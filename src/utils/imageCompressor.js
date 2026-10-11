/**
 * src/utils/imageCompressor.js
 *
 * Client-side media pre-processor:
 * - 5 MB hard limit enforcement.
 * - PDF bypass (validated for <= 5 MB).
 * - Canvas-based image resizing (max dimension 1920px).
 * - Iterative JPEG quality compression (down to 0.35).
 * - Automatic HEIC/HEIF transcoding via Canvas (native on Safari/iOS WebKit).
 */

/**
 * Loads an image file or blob into an inspectable/drawable object.
 * Supports createImageBitmap with graceful fallback to HTMLImageElement.
 *
 * @param {File | Blob} file
 * @returns {Promise<{ width: number, height: number, draw: Function, cleanup: Function }>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    // Attempt createImageBitmap first for performance and lower memory footprint
    if (typeof createImageBitmap === "function") {
      createImageBitmap(file)
        .then((bitmap) => {
          resolve({
            width: bitmap.width,
            height: bitmap.height,
            draw: (ctx, dw, dh) => ctx.drawImage(bitmap, 0, 0, dw, dh),
            cleanup: () => {
              if (typeof bitmap.close === "function") {
                bitmap.close();
              }
            },
          });
        })
        .catch(() => {
          fallbackImageElement();
        });
    } else {
      fallbackImageElement();
    }

    function fallbackImageElement() {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          draw: (ctx, dw, dh) => ctx.drawImage(img, 0, 0, dw, dh),
          cleanup: () => URL.revokeObjectURL(url),
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        const fileName = (file && file.name) ? file.name.toLowerCase() : "";
        const isHeic =
          file.type === "image/heic" ||
          file.type === "image/heif" ||
          /\.(heic|heif)$/i.test(fileName);

        if (isHeic) {
          reject(
            new Error(
              "Unable to decode HEIC image in this browser. Please use a WebKit-enabled browser (Safari/iOS) or convert the photo to JPEG before uploading."
            )
          );
        } else {
          reject(new Error("Unable to decode or load image file."));
        }
      };

      img.src = url;
    }
  });
}

/**
 * Prepares and compresses an image or PDF file prior to network upload.
 *
 * @param {File | Blob} file - Selected file from input or dropzone
 * @param {Object} [options]
 * @param {number} [options.maxDimension=1920] - Max width or height in pixels
 * @param {number} [options.maxSizeBytes=5242880] - Max allowed file size (default 5 MB)
 * @param {number} [options.quality=0.82] - Initial JPEG compression quality (0 to 1)
 * @returns {Promise<File>} Final compressed File ready for transmission
 */
export async function compressAndPrepareImage(file, options = {}) {
  if (!file) {
    throw new Error("No file provided for compression.");
  }

  const {
    maxDimension = 1920,
    maxSizeBytes = 5 * 1024 * 1024, // 5 MB
    quality = 0.82,
  } = options;

  // 1. PDF Documents: pass through as-is if within size limit
  const isPdf =
    file.type === "application/pdf" ||
    (typeof file.name === "string" && file.name.toLowerCase().endsWith(".pdf"));

  if (isPdf) {
    if (file.size > maxSizeBytes) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      throw new Error(`PDF document size (${mb} MB) exceeds maximum allowed limit of ${maxMb} MB.`);
    }
    return file;
  }

  // 2. Load and decode image
  const imgData = await loadImage(file);

  try {
    let currentMaxDim = maxDimension;
    let blob = null;

    // Multi-pass resolution check: if at lowest quality (0.35) size still exceeds ceiling,
    // downscale dimensions by 30% and re-compress.
    for (let attempt = 0; attempt < 3; attempt++) {
      const origW = imgData.width;
      const origH = imgData.height;
      const longest = Math.max(origW, origH);
      const scale = longest > currentMaxDim ? currentMaxDim / longest : 1;
      const targetW = Math.max(1, Math.round(origW * scale));
      const targetH = Math.max(1, Math.round(origH * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d", { alpha: false });

      if (!ctx) {
        throw new Error("Unable to create canvas 2D rendering context.");
      }

      // Draw white background in case source had transparency (e.g. PNG / WebP)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      imgData.draw(ctx, targetW, targetH);

      // Iterative quality decrement: step down by 0.1 until <= maxSizeBytes or reached min 0.35
      let q = quality;
      while (q >= 0.35) {
        blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", q)
        );

        if (blob && blob.size <= maxSizeBytes) {
          break;
        }

        q = Math.round((q - 0.1) * 100) / 100;
        if (q < 0.35 && blob && blob.size > maxSizeBytes) {
          blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.35)
          );
        }
      }

      if (blob && blob.size <= maxSizeBytes) {
        break;
      }

      // Further reduce dimensions if extreme photo still exceeds ceiling
      currentMaxDim = Math.round(currentMaxDim * 0.7);
    }

    if (!blob) {
      throw new Error("Failed to generate compressed image blob.");
    }

    if (blob.size > maxSizeBytes) {
      const mb = (blob.size / (1024 * 1024)).toFixed(1);
      throw new Error(`Image size (${mb} MB) could not be compressed below 5 MB.`);
    }

    // Determine normalized .jpg output file name
    const rawName = file.name || "photo.jpg";
    const baseName = rawName.replace(/\.[^/.]+$/, "");
    const outputName = `${baseName || "photo"}.jpg`;

    return new File([blob], outputName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    imgData.cleanup();
  }
}
