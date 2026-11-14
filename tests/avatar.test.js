// tests/avatar.test.js
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { resolveMediaUrl, isValidMediaDomain, ALLOWED_MEDIA_DOMAINS } from "../src/utils/media.js";
import { usersApi } from "../src/api/users.js";

// Mock fetch environment for Node.js test runner
let capturedFetchRequests = [];

globalThis.fetch = async (url, options = {}) => {
  capturedFetchRequests.push({ url, options });

  // Mock standard avatar success responses
  if (url.includes("/api/users/me/avatar")) {
    if (options.method === "POST") {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          data: {
            avatarMediaKey: "users/avatars/test-avatar-123.jpg",
            avatarUrl: "http://localhost:5000/media/users/avatars/test-avatar-123.jpg",
            user: {
              id: "test-user-id",
              username: "testuser",
              avatarMediaKey: "users/avatars/test-avatar-123.jpg",
              avatarUrl: "http://localhost:5000/media/users/avatars/test-avatar-123.jpg",
            },
          },
        }),
      };
    }
    if (options.method === "DELETE") {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          data: {
            user: {
              id: "test-user-id",
              username: "testuser",
              avatarMediaKey: null,
              avatarUrl: null,
            },
          },
        }),
      };
    }
  }

  if (url.includes("/api/users/target-user-456/avatar")) {
    if (options.method === "POST") {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          data: {
            avatarMediaKey: "users/avatars/admin-uploaded-avatar.jpg",
            avatarUrl: "http://localhost:5000/media/users/avatars/admin-uploaded-avatar.jpg",
            user: {
              id: "target-user-456",
              username: "targetuser",
              avatarMediaKey: "users/avatars/admin-uploaded-avatar.jpg",
            },
          },
        }),
      };
    }
    if (options.method === "DELETE") {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          data: {
            user: {
              id: "target-user-456",
              avatarMediaKey: null,
              avatarUrl: null,
            },
          },
        }),
      };
    }
  }

  return {
    ok: true,
    status: 200,
    json: async () => ({ status: "success", data: {} }),
  };
};

describe("1. Avatar Domain & URL Resolution", () => {
  test("users/avatars is a registered canonical media domain", () => {
    assert.strictEqual(ALLOWED_MEDIA_DOMAINS.includes("users/avatars"), true);
    assert.strictEqual(isValidMediaDomain("users/avatars"), true);
  });

  test("resolveMediaUrl properly resolves canonical relative avatar storage key", () => {
    const key = "users/avatars/b4e6a8c1f0d2394e.jpg";
    const resolved = resolveMediaUrl(key);
    assert.ok(resolved.endsWith("/media/users/avatars/b4e6a8c1f0d2394e.jpg"));
  });

  test("resolveMediaUrl passes full HTTP/HTTPS/data/blob URLs untouched", () => {
    const httpsUrl = "https://example.com/avatar.jpg";
    assert.strictEqual(resolveMediaUrl(httpsUrl), httpsUrl);

    const blobUrl = "blob:http://localhost:5173/1234-5678";
    assert.strictEqual(resolveMediaUrl(blobUrl), blobUrl);

    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA";
    assert.strictEqual(resolveMediaUrl(dataUrl), dataUrl);
  });

  test("resolveMediaUrl returns null for empty or null inputs", () => {
    assert.strictEqual(resolveMediaUrl(null), null);
    assert.strictEqual(resolveMediaUrl(undefined), null);
    assert.strictEqual(resolveMediaUrl("   "), null);
  });
});

describe("2. Users API Avatar Methods & Payload Formatting", () => {
  beforeEach(() => {
    capturedFetchRequests = [];
  });

  test("uploadMyAvatar sends POST /api/users/me/avatar with FormData containing 'avatar'", async () => {
    const dummyBlob = new Blob(["TEST_IMAGE_BINARY"], { type: "image/jpeg" });
    const dummyFile = new File([dummyBlob], "profile.jpg", { type: "image/jpeg" });

    const result = await usersApi.uploadMyAvatar(dummyFile);

    assert.strictEqual(capturedFetchRequests.length, 1);
    const req = capturedFetchRequests[0];
    assert.ok(req.url.endsWith("/api/users/me/avatar"));
    assert.strictEqual(req.options.method, "POST");
    assert.ok(req.options.body instanceof FormData);
    assert.ok(req.options.body.get("avatar"));
    assert.strictEqual(result.avatarMediaKey, "users/avatars/test-avatar-123.jpg");
  });

  test("deleteMyAvatar sends DELETE /api/users/me/avatar", async () => {
    const result = await usersApi.deleteMyAvatar();

    assert.strictEqual(capturedFetchRequests.length, 1);
    const req = capturedFetchRequests[0];
    assert.ok(req.url.endsWith("/api/users/me/avatar"));
    assert.strictEqual(req.options.method, "DELETE");
    assert.strictEqual(result.user.avatarMediaKey, null);
  });

  test("uploadUserAvatar sends POST /api/users/:id/avatar for target user", async () => {
    const dummyBlob = new Blob(["TARGET_USER_IMAGE"], { type: "image/jpeg" });
    const dummyFile = new File([dummyBlob], "target.jpg", { type: "image/jpeg" });

    const result = await usersApi.uploadUserAvatar("target-user-456", dummyFile);

    assert.strictEqual(capturedFetchRequests.length, 1);
    const req = capturedFetchRequests[0];
    assert.ok(req.url.endsWith("/api/users/target-user-456/avatar"));
    assert.strictEqual(req.options.method, "POST");
    assert.ok(req.options.body instanceof FormData);
    assert.strictEqual(result.avatarMediaKey, "users/avatars/admin-uploaded-avatar.jpg");
  });

  test("deleteUserAvatar sends DELETE /api/users/:id/avatar for target user", async () => {
    const result = await usersApi.deleteUserAvatar("target-user-456");

    assert.strictEqual(capturedFetchRequests.length, 1);
    const req = capturedFetchRequests[0];
    assert.ok(req.url.endsWith("/api/users/target-user-456/avatar"));
    assert.strictEqual(req.options.method, "DELETE");
    assert.strictEqual(result.user.avatarMediaKey, null);
  });
});
