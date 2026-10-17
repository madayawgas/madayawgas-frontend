// src/api/media.js
import { apiClient } from "./client.js";
import { compressAndPrepareImage } from "../utils/imageCompressor.js";
import { isValidMediaDomain, ALLOWED_MEDIA_DOMAINS } from "../utils/media.js";

/**
 * Uploads a media file into the canonical MadayawGas media storage subsystem.
 * Applies client-side compression/HEIC transcoding before transmission.
 *
 * @param {File | Blob} file - The file binary to upload
 * @param {string} domain - Whitelisted domain (e.g. 'maintenance/receipts')
 * @returns {Promise<{ storageKey: string, url: string, mimeType: string, sizeBytes: number, originalName?: string }>}
 */
export async function uploadMediaFile(file, domain) {
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  if (!isValidMediaDomain(domain)) {
    throw new Error(
      `Invalid media domain '${domain}'. Allowed domains are: ${ALLOWED_MEDIA_DOMAINS.join(", ")}`
    );
  }

  // 1. Client-side compression & size verification (< 5 MB)
  const preparedFile = await compressAndPrepareImage(file);

  // 2. Live backend upload via multipart/form-data
  const formData = new FormData();
  formData.append("file", preparedFile);
  formData.append("domain", domain);

  const response = await apiClient("/media/upload", {
    method: "POST",
    body: formData,
  });

  return response.data;
}

/**
 * Resolves a canonical relative storage key to a fully qualified URL via the backend.
 *
 * @param {string} storageKey
 * @returns {Promise<{ storageKey: string, url: string }>}
 */
export async function resolveMediaKey(storageKey) {
  if (!storageKey) {
    throw new Error("storageKey must be provided as a non-empty string");
  }

  const response = await apiClient("/media/resolve", {
    method: "POST",
    body: { storageKey },
  });

  return response.data;
}

/**
 * Deletes a media file asset directly from canonical storage.
 * Endpoint: DELETE /api/media
 *
 * @param {string} storageKey - Canonical relative key or full URL
 * @returns {Promise<{ status: string, message: string }>}
 */
export async function deleteMediaFile(storageKey) {
  if (!storageKey) return null;

  const response = await apiClient("/media", {
    method: "DELETE",
    body: { storageKey },
  });

  return response.data || response;
}

export const mediaApi = {
  upload: uploadMediaFile,
  resolve: resolveMediaKey,
  delete: deleteMediaFile,
};
