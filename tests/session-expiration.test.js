import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import {
  onSessionExpired,
  notifySessionExpired,
  broadcastLogout,
  setupCrossTabSessionSync,
  _resetSessionExpirationLock,
} from "../src/utils/sessionEvents.js";

// Mock minimal window and localStorage environment for Node.js test runner
const mockStorage = new Map();
const mockEventListeners = new Map();

globalThis.window = {
  location: { pathname: "/dashboard", search: "" },
  addEventListener: (event, handler) => {
    if (!mockEventListeners.has(event)) {
      mockEventListeners.set(event, new Set());
    }
    mockEventListeners.get(event).add(handler);
  },
  removeEventListener: (event, handler) => {
    if (mockEventListeners.has(event)) {
      mockEventListeners.get(event).delete(handler);
    }
  },
  dispatchEvent: (event) => {
    const handlers = mockEventListeners.get(event.type);
    if (handlers) {
      handlers.forEach((h) => h(event));
    }
    return true;
  },
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || {};
  }
};

globalThis.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

describe("1. Session Expiration Pub/Sub & Debouncing", () => {
  beforeEach(() => {
    mockStorage.clear();
    _resetSessionExpirationLock();
  });

  test("onSessionExpired registers callback and receives notification detail", (t, done) => {
    const unsub = onSessionExpired((detail) => {
      assert.strictEqual(detail.endpoint, "/sales/customers");
      assert.strictEqual(detail.message, "Session expired");
      unsub();
      done();
    });

    notifySessionExpired({
      message: "Session expired",
      endpoint: "/sales/customers",
    });
  });

  test("unsubscribe removes callback from listener set", () => {
    let callCount = 0;
    const unsub = onSessionExpired(() => {
      callCount += 1;
    });

    unsub();
    notifySessionExpired({ message: "Test" });
    assert.strictEqual(callCount, 0);
  });

  test("notifySessionExpired debounces rapid concurrent calls", () => {
    let callCount = 0;
    const unsub = onSessionExpired(() => {
      callCount += 1;
    });

    // Fire 3 simultaneous 401 expiration events
    notifySessionExpired({ message: "Expired 1" });
    notifySessionExpired({ message: "Expired 2" });
    notifySessionExpired({ message: "Expired 3" });

    // Only the first call should dispatch; subsequent calls within 1500ms are suppressed
    assert.strictEqual(callCount, 1);
    unsub();
  });

  test("notifySessionExpired removes mg_token from localStorage", () => {
    localStorage.setItem("mg_token", "test-token-12345");
    notifySessionExpired({ message: "Expired" });
    assert.strictEqual(localStorage.getItem("mg_token"), null);
  });
});

describe("2. Cross-Tab Session Synchronization", () => {
  beforeEach(() => {
    mockStorage.clear();
    _resetSessionExpirationLock();
  });

  test("broadcastLogout writes mg_logout_event and clears mg_token", () => {
    localStorage.setItem("mg_token", "active-token");
    broadcastLogout();

    assert.strictEqual(localStorage.getItem("mg_token"), null);
    assert.ok(localStorage.getItem("mg_logout_event"));
  });

  test("setupCrossTabSessionSync invokes onLogout when mg_logout_event fires", (t, done) => {
    const cleanup = setupCrossTabSessionSync({
      onLogout: () => {
        cleanup();
        done();
      },
    });

    // Simulate storage event from another browser tab
    const storageHandlers = mockEventListeners.get("storage");
    assert.ok(storageHandlers && storageHandlers.size > 0);
    storageHandlers.forEach((h) => {
      h({
        key: "mg_logout_event",
        newValue: Date.now().toString(),
      });
    });
  });

  test("setupCrossTabSessionSync invokes onExpired when mg_session_expired_event fires", (t, done) => {
    const cleanup = setupCrossTabSessionSync({
      onExpired: (detail) => {
        assert.strictEqual(detail.endpoint, "/fleet/vehicles");
        cleanup();
        done();
      },
    });

    // Simulate storage event from another browser tab
    const storageHandlers = mockEventListeners.get("storage");
    assert.ok(storageHandlers && storageHandlers.size > 0);
    storageHandlers.forEach((h) => {
      h({
        key: "mg_session_expired_event",
        newValue: JSON.stringify({
          endpoint: "/fleet/vehicles",
          message: "Session expired",
        }),
      });
    });
  });
});

describe("3. 401 Discrimination Rules (Session vs Login vs Dangerous Action)", () => {
  // Pure function testing the discrimination rules matching apiClient
  function evaluate401Action(cleanEndpoint, responseStatus, data) {
    if (responseStatus !== 401) {
      return "IGNORE_STATUS";
    }

    const isLoginEndpoint =
      cleanEndpoint.startsWith("/users/login") ||
      cleanEndpoint.startsWith("/login");
    const isConfirmationPasswordError =
      data?.code === "INVALID_CONFIRMATION_PASSWORD" ||
      data?.code === "PASSWORD_CONFIRMATION_REQUIRED";
    const isForbiddenError =
      data?.message?.toLowerCase() === "forbidden" ||
      data?.code === "FORBIDDEN";

    if (!isLoginEndpoint && !isConfirmationPasswordError && !isForbiddenError) {
      return "TRIGGER_SESSION_EXPIRED";
    }

    return "PASS_THROUGH_ERROR";
  }

  test("regular authenticated endpoint 401 triggers session expiration", () => {
    const result = evaluate401Action("/sales/customers", 401, {
      message: "Unauthorized",
    });
    assert.strictEqual(result, "TRIGGER_SESSION_EXPIRED");
  });

  test("/users/login 401 does NOT trigger session expiration (passes error through)", () => {
    const result = evaluate401Action("/users/login", 401, {
      message: "Invalid credentials",
    });
    assert.strictEqual(result, "PASS_THROUGH_ERROR");
  });

  test("dangerous action with INVALID_CONFIRMATION_PASSWORD does NOT trigger session expiration", () => {
    const result = evaluate401Action("/sales/customers/123/deactivate", 401, {
      code: "INVALID_CONFIRMATION_PASSWORD",
      message: "Invalid confirmation password",
    });
    assert.strictEqual(result, "PASS_THROUGH_ERROR");
  });

  test("dangerous action with PASSWORD_CONFIRMATION_REQUIRED does NOT trigger session expiration", () => {
    const result = evaluate401Action("/users/456/role", 401, {
      code: "PASSWORD_CONFIRMATION_REQUIRED",
      message: "Password confirmation required",
    });
    assert.strictEqual(result, "PASS_THROUGH_ERROR");
  });

  test("403 Forbidden is ignored by 401 handler", () => {
    const result = evaluate401Action("/users", 403, {
      message: "Forbidden",
    });
    assert.strictEqual(result, "IGNORE_STATUS");
  });
});
