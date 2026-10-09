// src/api/media.js
import { apiClient, isMock, delay } from "./client.js";
import { compressAndPrepareImage } from "../utils/imageCompressor.js";
import { isValidMediaDomain, ALLOWED_MEDIA_DOMAINS, resolveMediaUrl } from "../utils/media.js";

/**
 * Generates a mock canonical storage key adhering to the backend standard:
 * {domain}/{timestamp}-{randomHex}{extension}
 *
 * @param {string} domain
 * @param {string} mimeType
 * @returns {string}
 */
function generateMockStorageKey(domain, mimeType) {
  const timestamp = Date.now();
  const hexPart1 = Math.random().toString(16).slice(2, 8).padStart(6, "0");
  const hexPart2 = Math.random().toString(16).slice(2, 8).padStart(6, "0");
  const randomHex = `${hexPart1}${hexPart2}`;

  let extension = ".jpg";
  if (mimeType === "application/pdf") {
    extension = ".pdf";
  } else if (mimeType === "image/png") {
    extension = ".png";
  } else if (mimeType === "image/webp") {
    extension = ".webp";
  }

  return `${domain}/${timestamp}-${randomHex}${extension}`;
}

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

  // 2. Mock mode fallback
  if (isMock) {
    await delay(350);
    const mockStorageKey = generateMockStorageKey(domain, preparedFile.type);
    const objectUrl =
      typeof window !== "undefined" && typeof URL !== "undefined"
        ? URL.createObjectURL(preparedFile)
        : `http://localhost:5000/media/${mockStorageKey}`;

    return {
      storageKey: mockStorageKey,
      url: objectUrl,
      mimeType: preparedFile.type || "image/jpeg",
      sizeBytes: preparedFile.size,
      originalName: file.name || "uploaded-file",
    };
  }

  // 3. Live backend upload via multipart/form-data
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

  if (isMock) {
    await delay(100);
    return {
      storageKey,
      url: resolveMediaUrl(storageKey),
    };
  }

  const response = await apiClient("/media/resolve", {
    method: "POST",
    body: { storageKey },
  });

  return response.data;
}

export const mediaApi = {
  upload: uploadMediaFile,
  resolve: resolveMediaKey,
};
