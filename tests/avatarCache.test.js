// tests/avatarCache.test.js
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

import {
  AVATAR_CACHE_NAME,
  AVATAR_META_STORAGE_KEY,
  getMemoryCachedAvatarUrl,
  getOrCacheAvatarUrl,
  evictAvatarCache,
  syncProfileAvatarCache,
  clearProfileAvatarCache,
  resetMemoryAvatarCache,
} from "../src/utils/avatarCache.js";

function createMockEnvironment() {
  const storageMap = new Map();
  const cacheEntries = new Map();
  const deletedKeys = [];
  const revokedUrls = [];
  let blobCounter = 0;
  let fetchCalls = [];

  const mockCache = {
    async match(key) {
      return cacheEntries.get(key) || undefined;
    },
    async put(key, response) {
      cacheEntries.set(key, response);
    },
    async delete(key) {
      deletedKeys.push(key);
      return cacheEntries.delete(key);
    },
  };

  globalThis.localStorage = {
    getItem(k) {
      return storageMap.has(k) ? storageMap.get(k) : null;
    },
    setItem(k, v) {
      storageMap.set(k, String(v));
    },
    removeItem(k) {
      storageMap.delete(k);
    },
  };

  globalThis.caches = {
    async open(name) {
      assert.strictEqual(name, AVATAR_CACHE_NAME);
      return mockCache;
    },
  };

  globalThis.URL = {
    createObjectURL(blob) {
      blobCounter += 1;
      return `blob:mock-${blobCounter}-${blob.size}`;
    },
    revokeObjectURL(url) {
      revokedUrls.push(url);
    },
  };

  globalThis.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, options });
    const mockBlob = { size: 1024, type: "image/jpeg" };
    const response = {
      ok: true,
      status: 200,
      async blob() {
        return mockBlob;
      },
      clone() {
        return {
          async blob() {
            return mockBlob;
          },
        };
      },
    };
    return response;
  };

  return {
    storageMap,
    cacheEntries,
    deletedKeys,
    revokedUrls,
    getFetchCalls: () => fetchCalls,
    clearFetchCalls: () => {
      fetchCalls = [];
    },
  };
}

describe("Avatar Cache Utility", () => {
  let env;
  const origLocalStorage = globalThis.localStorage;
  const origCaches = globalThis.caches;
  const origURL = globalThis.URL;
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    resetMemoryAvatarCache();
    env = createMockEnvironment();
  });

  afterEach(() => {
    resetMemoryAvatarCache();
    globalThis.localStorage = origLocalStorage;
    globalThis.caches = origCaches;
    globalThis.URL = origURL;
    globalThis.fetch = origFetch;
  });

  test("caches fetched avatar into CacheStorage and in-memory Object URL map", async () => {
    const url = "http://localhost:5000/media/users/avatars/avatar-1.jpg";

    const first = await getOrCacheAvatarUrl(url);
    assert.ok(first.startsWith("blob:mock-"));
    assert.strictEqual(getMemoryCachedAvatarUrl(url), first);
    assert.strictEqual(env.cacheEntries.has(url), true);
    assert.strictEqual(env.getFetchCalls().length, 1);

    // Second call should hit memory without fetching again
    const second = await getOrCacheAvatarUrl(url);
    assert.strictEqual(second, first);
    assert.strictEqual(env.getFetchCalls().length, 1);

    // After clearing memory cache, it should hit CacheStorage without fetching
    resetMemoryAvatarCache();
    const third = await getOrCacheAvatarUrl(url);
    assert.ok(third.startsWith("blob:mock-"));
    assert.strictEqual(env.getFetchCalls().length, 1);
  });

  test("syncProfileAvatarCache deletes old cache when profile avatar changes or is removed", async () => {
    const url1 = "http://localhost:5000/media/users/avatars/avatar-old.jpg";
    const url2 = "http://localhost:5000/media/users/avatars/avatar-new.jpg";

    const cached1 = await syncProfileAvatarCache({
      id: "user-1",
      avatarUrl: url1,
      avatarMediaKey: "users/avatars/avatar-old.jpg",
    });

    assert.ok(cached1.startsWith("blob:mock-"));
    assert.strictEqual(env.cacheEntries.has(url1), true);
    assert.ok(env.storageMap.has(AVATAR_META_STORAGE_KEY));

    // Change avatar to url2 -> url1 must be evicted and revoked
    const cached2 = await syncProfileAvatarCache({
      id: "user-1",
      avatarUrl: url2,
      avatarMediaKey: "users/avatars/avatar-new.jpg",
    });

    assert.ok(cached2.startsWith("blob:mock-"));
    assert.strictEqual(env.cacheEntries.has(url1), false);
    assert.strictEqual(env.cacheEntries.has(url2), true);
    assert.strictEqual(env.deletedKeys.includes(url1), true);
    assert.strictEqual(env.revokedUrls.includes(cached1), true);
    assert.strictEqual(getMemoryCachedAvatarUrl(url1), null);

    // Remove avatar -> url2 must be evicted and metadata cleared
    const afterRemove = await syncProfileAvatarCache({
      id: "user-1",
      avatarUrl: null,
      avatarMediaKey: null,
    });

    assert.strictEqual(afterRemove, null);
    assert.strictEqual(env.cacheEntries.has(url2), false);
    assert.strictEqual(env.deletedKeys.includes(url2), true);
    assert.strictEqual(env.revokedUrls.includes(cached2), true);
    assert.strictEqual(env.storageMap.has(AVATAR_META_STORAGE_KEY), false);
  });

  test("clearProfileAvatarCache evicts active profile avatar on logout", async () => {
    const url = "http://localhost:5000/media/users/avatars/avatar-active.jpg";
    const cached = await syncProfileAvatarCache({ id: "user-1", avatarUrl: url });
    assert.strictEqual(env.cacheEntries.has(url), true);

    await clearProfileAvatarCache();

    assert.strictEqual(env.cacheEntries.has(url), false);
    assert.strictEqual(env.deletedKeys.includes(url), true);
    assert.strictEqual(env.revokedUrls.includes(cached), true);
    assert.strictEqual(env.storageMap.has(AVATAR_META_STORAGE_KEY), false);
  });

  test("falls back gracefully to resolvedUrl when fetch fails or CacheStorage is unavailable", async () => {
    delete globalThis.caches;
    globalThis.fetch = async () => {
      throw new Error("CORS blocked");
    };

    const url = "https://cdn.example.com/users/avatars/cors-avatar.jpg";
    const result = await getOrCacheAvatarUrl(url);
    assert.strictEqual(result, url);
    assert.strictEqual(getMemoryCachedAvatarUrl(url), null);

    // Calling evictAvatarCache without CacheStorage should not throw
    await evictAvatarCache(url);
  });
});
