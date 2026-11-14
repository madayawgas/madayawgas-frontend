// src/components/ui/AvatarCropModal.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertCircle,
  Move,
} from "lucide-react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { compressAndPrepareImage } from "../../utils/imageCompressor.js";

const VIEWPORT_SIZE = 280; // Viewport dimension in px
const OUTPUT_SIZE = 512; // Final output canvas dimension in px

/**
 * Interactive Avatar Editor and Cropper Modal.
 * Provides circular viewport masking, mouse/touch dragging, zoom slider (1x-3x),
 * 90° rotation, and zero-dependency Canvas-based rendering.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {File | Blob | string | null} props.imageSource - Image file, blob, or resolved URL
 * @param {Function} props.onClose - Modal close handler
 * @param {Function} props.onSave - Callback receiving processed File: (file: File) => Promise<void> | void
 */
export default function AvatarCropModal({
  isOpen,
  imageSource,
  onClose,
  onSave,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Transform states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Dragging states
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const imageObjRef = useRef(null);
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0, baseScale: 1 });
  const blobUrlRef = useRef(null);

  // Reset transforms
  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Cleanup blob URLs on unmount or source change
  const cleanupBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  // Load image whenever imageSource changes or modal opens
  useEffect(() => {
    if (!isOpen || !imageSource) {
      cleanupBlob();
      setImageLoaded(false);
      setImageError("");
      return;
    }

    cleanupBlob();
    setImageLoaded(false);
    setImageError("");
    resetTransform();

    let srcUrl = "";
    if (typeof imageSource === "string") {
      srcUrl = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      srcUrl = URL.createObjectURL(imageSource);
      blobUrlRef.current = srcUrl;
    }

    if (!srcUrl) {
      setImageError("Invalid image source provided.");
      return;
    }

    const img = new Image();
    // Enable cross-origin loading if it's a remote URL
    if (srcUrl.startsWith("http://") || srcUrl.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      imageObjRef.current = img;
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;

      // Base scale fits the shortest dimension to the viewport size
      const minDimension = Math.min(nw, nh);
      const baseScale = VIEWPORT_SIZE / (minDimension || VIEWPORT_SIZE);

      setImageMeta({ width: nw, height: nh, baseScale });
      setImageLoaded(true);
    };

    img.onerror = () => {
      setImageError("Unable to load the selected image. Please try another file.");
      setImageLoaded(false);
    };

    img.src = srcUrl;

    return () => {
      cleanupBlob();
    };
  }, [isOpen, imageSource, cleanupBlob, resetTransform]);

  // Pointer drag event handlers for mouse & touch
  const handlePointerDown = (e) => {
    if (!imageLoaded) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };

    // Set pointer capture if available
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignored for environments without setPointerCapture
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Boundary limits (prevent user from dragging entirely out of view)
    const maxPan = VIEWPORT_SIZE * zoom * 0.8;
    const nextX = Math.max(-maxPan, Math.min(maxPan, panStartRef.current.x + dx));
    const nextY = Math.max(-maxPan, Math.min(maxPan, panStartRef.current.y + dy));

    setPan({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e) => {
    isDraggingRef.current = false;
    try {
      e.target.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
  };

  // Zoom slider change
  const handleZoomChange = (e) => {
    const val = parseFloat(e.target.value);
    setZoom(val);
  };

  // 90° Clockwise Rotation
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Zoom buttons
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, +(prev + 0.2).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(1, +(prev - 0.2).toFixed(2)));
  };

  // Render crop to Canvas and Save
  const handleConfirmCrop = async () => {
    if (!imageObjRef.current || !imageLoaded) return;

    setIsProcessing(true);
    try {
      const img = imageObjRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to initialize canvas context.");
      }

      // Smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Ratio from viewport dimension to final output canvas
      const outputScaleRatio = OUTPUT_SIZE / VIEWPORT_SIZE;

      // 1. Move origin to center of output canvas
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

      // 2. Apply Pan adjusted for output canvas scale
      ctx.translate(pan.x * outputScaleRatio, pan.y * outputScaleRatio);

      // 3. Apply Rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // 4. Apply combined scale (base fit scale * user zoom * output scale)
      const effectiveScale = imageMeta.baseScale * zoom * outputScaleRatio;
      ctx.scale(effectiveScale, effectiveScale);

      // 5. Draw image centered
      const drawX = -imageMeta.width / 2;
      const drawY = -imageMeta.height / 2;
      ctx.drawImage(img, drawX, drawY, imageMeta.width, imageMeta.height);

      // 6. Convert canvas to Blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Canvas to Blob export failed."));
          },
          "image/jpeg",
          0.92
        );
      });

      // 7. Create File and compress using shared utility
      const rawFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const preparedFile = await compressAndPrepareImage(rawFile, {
        maxDimension: 1024,
        maxSizeBytes: 5 * 1024 * 1024,
        quality: 0.88,
      });

      if (onSave) {
        await onSave(preparedFile);
      }
      onClose();
    } catch (err) {
      console.error("Failed to crop avatar image:", err);
      setImageError(err?.message || "Failed to crop and save avatar photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? undefined : onClose}
      title="Edit Profile Photo"
      subtitle="Drag to reposition, use the slider to zoom, or rotate your avatar photo"
      icon={Camera}
      maxWidth="max-w-md"
      closeOnBackdrop={!isProcessing}
      showCloseButton={!isProcessing}
    >
      <div className="flex flex-col items-center p-2 text-center select-none font-sans">
        {/* Error Alert */}
        {imageError && (
          <div className="w-full mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span className="text-left font-medium">{imageError}</span>
          </div>
        )}

        {/* Viewport Frame with Circular Mask */}
        <div
          className="relative overflow-hidden rounded-2xl bg-slate-900 border-2 border-slate-200 shadow-inner cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Draggable & Scalable Image Layer */}
          {imageLoaded && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${
                  imageMeta.baseScale * zoom
                })`,
                transformOrigin: "center center",
                transition: isDraggingRef.current ? "none" : "transform 0.1s ease-out",
              }}
            >
              <img
                src={imageObjRef.current?.src}
                alt="Crop preview"
                className="max-w-none select-none pointer-events-none"
                style={{
                  width: imageMeta.width,
                  height: imageMeta.height,
                }}
                draggable={false}
              />
            </div>
          )}

          {/* Loading Indicator inside Viewport */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2">
              <Loader2 size={32} className="animate-spin text-[#FFDF2C]" />
              <span className="text-xs font-semibold">Loading photo...</span>
            </div>
          )}

          {/* Circular Mask Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened mask around the circular aperture */}
            <div
              className="w-full h-full rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(10,25,40,0.6)]"
              style={{ width: VIEWPORT_SIZE - 20, height: VIEWPORT_SIZE - 20 }}
            />
          </div>

          {/* Hint Overlay when image is ready */}
          {imageLoaded && (
            <div className="absolute bottom-2 inset-x-0 flex items-center justify-center pointer-events-none">
              <span className="inline-flex items-center gap-1 bg-slate-900/70 backdrop-blur-xs text-white/90 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                <Move size={11} /> Drag to position
              </span>
            </div>
          )}
        </div>

        {/* ================= CONTROLS ROW ================= */}
        <div className="w-full max-w-[320px] mt-4 space-y-3.5">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={!imageLoaded || zoom <= 1 || isProcessing}
              className="p-1.5 text-slate-500 hover:text-[#0A4B6E] disabled:opacity-30 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={handleZoomChange}
              disabled={!imageLoaded || isProcessing}
              className="w-full accent-[#0A4B6E] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Zoom photo"
            />

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={!imageLoaded || zoom >= 3 || isProcessing}
              className="p-1.5 text-slate-500 hover:text-[#0A4B6E] disabled:opacity-30 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Secondary Action Buttons (Rotate & Reset) */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleRotate}
              disabled={!imageLoaded || isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#0A4B6E] bg-[#E8F3F8] hover:bg-[#BCE1F1] transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <RotateCw size={13} />
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              onClick={resetTransform}
              disabled={!imageLoaded || isProcessing || (zoom === 1 && rotation === 0 && pan.x === 0 && pan.y === 0)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <RefreshCw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ================= MODAL FOOTER ACTIONS ================= */}
        <div className="w-full flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-full"
          >
            <X size={14} className="mr-1" />
            <span>Cancel</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirmCrop}
            disabled={!imageLoaded || isProcessing}
            className="rounded-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5 text-[#0A4B6E]" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={14} className="mr-1.5 text-[#0A4B6E]" />
                <span>Save Avatar</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
