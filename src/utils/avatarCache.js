/**
 * src/utils/avatarCache.js
 *
 * Client-side caching for user profile avatars using the browser CacheStorage API
 * paired with an in-memory Object URL map for synchronous, flicker-free rendering.
 * Automatically evicts stale avatar cache entries when a user's profile photo changes or is removed.
 */
import { resolveMediaUrl } from "./media.js";

export const AVATAR_CACHE_NAME = "mg-avatar-cache-v1";
export const AVATAR_META_STORAGE_KEY = "mg_profile_avatar_meta";

const objectUrlCache = new Map();
const inFlightCache = new Map();

function isCacheableHttpUrl(url) {
  return (
    typeof url === "string" &&
    (url.startsWith("http://") || url.startsWith("https://"))
  );
}

function hasCacheStorage() {
  return typeof globalThis !== "undefined" && typeof globalThis.caches !== "undefined";
}

function hasLocalStorage() {
  try {
    return typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function readStoredAvatarMeta() {
  if (!hasLocalStorage()) return null;
  try {
    const raw = globalThis.localStorage.getItem(AVATAR_META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredAvatarMeta(meta) {
  if (!hasLocalStorage()) return;
  try {
    if (!meta) {
      globalThis.localStorage.removeItem(AVATAR_META_STORAGE_KEY);
    } else {
      globalThis.localStorage.setItem(AVATAR_META_STORAGE_KEY, JSON.stringify(meta));
    }
  } catch {
    // Ignore storage quota or private-browsing restrictions
  }
}

/**
 * Synchronously retrieves an in-memory Object URL for a resolved avatar URL if already cached.
 *
 * @param {string | null | undefined} resolvedUrl
 * @returns {string | null}
 */
export function getMemoryCachedAvatarUrl(resolvedUrl) {
  if (!resolvedUrl) return null;
  return objectUrlCache.get(resolvedUrl) || null;
}

/**
 * Evicts a specific avatar URL from both the in-memory Object URL map and CacheStorage.
 *
 * @param {string | null | undefined} resolvedUrl
 * @returns {Promise<void>}
 */
export async function evictAvatarCache(resolvedUrl) {
  if (!resolvedUrl) return;

  inFlightCache.delete(resolvedUrl);

  const existingBlobUrl = objectUrlCache.get(resolvedUrl);
  if (existingBlobUrl) {
    objectUrlCache.delete(resolvedUrl);
    if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
      try {
        URL.revokeObjectURL(existingBlobUrl);
      } catch {
        // Ignore revoke errors
      }
    }
  }

  if (hasCacheStorage()) {
    try {
      const cache = await globalThis.caches.open(AVATAR_CACHE_NAME);
      await cache.delete(resolvedUrl);
    } catch {
      // Ignore CacheStorage deletion failures
    }
  }
}

/**
 * Resolves an avatar URL through the in-memory + CacheStorage cache.
 * Falls back gracefully to the original `resolvedUrl` if CacheStorage or CORS fetch is unavailable.
 *
 * @param {string | null | undefined} resolvedUrl
 * @returns {Promise<string | null>}
 */
export async function getOrCacheAvatarUrl(resolvedUrl) {
  if (!resolvedUrl) return null;
  if (!isCacheableHttpUrl(resolvedUrl)) return resolvedUrl;

  const memoryHit = objectUrlCache.get(resolvedUrl);
  if (memoryHit) return memoryHit;

  if (inFlightCache.has(resolvedUrl)) {
    return inFlightCache.get(resolvedUrl);
  }

  const task = (async () => {
    try {
      // 1. Check persistent CacheStorage first
      if (hasCacheStorage()) {
        try {
          const cache = await globalThis.caches.open(AVATAR_CACHE_NAME);
          const cachedResponse = await cache.match(resolvedUrl);
          if (cachedResponse && cachedResponse.ok) {
            const blob = await cachedResponse.blob();
            if (blob && blob.size > 0 && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
              const blobUrl = URL.createObjectURL(blob);
              objectUrlCache.set(resolvedUrl, blobUrl);
              return blobUrl;
            }
          }
        } catch {
          // Proceed to network fetch
        }
      }

      // 2. Fetch and persist into CacheStorage
      if (typeof fetch !== "function") {
        return resolvedUrl;
      }

      const response = await fetch(resolvedUrl, {
        mode: "cors",
        credentials: "same-origin",
      });

      if (!response || !response.ok) {
        return resolvedUrl;
      }

      const blob = await response.clone().blob();
      if (!blob || blob.size === 0) {
        return resolvedUrl;
      }

      if (hasCacheStorage()) {
        try {
          const cache = await globalThis.caches.open(AVATAR_CACHE_NAME);
          await cache.put(resolvedUrl, response);
        } catch {
          // Ignore CacheStorage write failures
        }
      }

      if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        const blobUrl = URL.createObjectURL(blob);
        objectUrlCache.set(resolvedUrl, blobUrl);
        return blobUrl;
      }

      return resolvedUrl;
    } catch {
      // Graceful fallback to direct URL (e.g., CORS restriction or offline)
      return resolvedUrl;
    } finally {
      inFlightCache.delete(resolvedUrl);
    }
  })();

  inFlightCache.set(resolvedUrl, task);
  return task;
}

/**
 * Synchronizes the authenticated user's profile avatar cache.
 * Deletes the previous cached avatar if the user's avatar URL changed or was removed,
 * then warms the cache for the new avatar URL.
 *
 * @param {Object | null | undefined} user
 * @returns {Promise<string | null>}
 */
export async function syncProfileAvatarCache(user) {
  const prevMeta = readStoredAvatarMeta();
  const nextUrl = user ? resolveMediaUrl(user.avatarUrl || user.avatarMediaKey) : null;

  if (prevMeta?.resolvedUrl && prevMeta.resolvedUrl !== nextUrl) {
    await evictAvatarCache(prevMeta.resolvedUrl);
  }

  if (!user || !nextUrl) {
    writeStoredAvatarMeta(null);
    return null;
  }

  writeStoredAvatarMeta({
    userId: user.id ?? null,
    resolvedUrl: nextUrl,
  });

  return getOrCacheAvatarUrl(nextUrl);
}

/**
 * Evicts the active profile avatar from CacheStorage and clears metadata (e.g., on logout).
 *
 * @returns {Promise<void>}
 */
export async function clearProfileAvatarCache() {
  const prevMeta = readStoredAvatarMeta();
  if (prevMeta?.resolvedUrl) {
    await evictAvatarCache(prevMeta.resolvedUrl);
  }
  writeStoredAvatarMeta(null);
}

/**
 * Clears all in-memory Object URLs (primarily for test isolation).
 */
export function resetMemoryAvatarCache() {
  for (const blobUrl of objectUrlCache.values()) {
    if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Ignore
      }
    }
  }
  objectUrlCache.clear();
  inFlightCache.clear();
}
