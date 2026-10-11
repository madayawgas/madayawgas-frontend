// src/components/ui/CameraCaptureModal.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  X,
  RefreshCw,
  Check,
  AlertCircle,
  Zap,
  ZapOff,
  RotateCcw,
} from "lucide-react";
import Button from "./Button";

/**
 * CameraCaptureModal
 * Production-ready in-browser camera viewfinder utilizing WebRTC getUserMedia.
 * Eliminates mobile OS Low Memory Killer (LMK) process eviction by keeping
 * the browser in the active foreground without delegating to native camera apps.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback to close modal without capturing
 * @param {Function} props.onCapture - Callback (file: File) => void with JPEG File object
 */
export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("environment"); // "environment" (rear) or "user" (front)
  const [capturedBlobUrl, setCapturedBlobUrl] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Stop active video track stream cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping track:", e);
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Cleanup blob preview
  const cleanupCaptured = useCallback(() => {
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
    }
    setCapturedBlobUrl(null);
    setCapturedFile(null);
  }, [capturedBlobUrl]);

  // Start or restart camera stream
  const startCamera = useCallback(async (desiredFacing) => {
    stopStream();
    setIsLoadingCamera(true);
    setErrorMessage("");
    setHasTorch(false);
    setIsTorchOn(false);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setIsLoadingCamera(false);
      setErrorMessage(
        "Camera stream is not supported in this browser environment. Ensure the page is served over a secure connection (HTTPS) or use the Browse File option."
      );
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: desiredFacing || facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn("Video play interrupted:", err);
        });
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === "function") {
        const capabilities = track.getCapabilities();
        if (capabilities?.torch) {
          setHasTorch(true);
        }
      }
    } catch (err) {
      console.error("Failed to access camera:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage(
          "Camera access permission was denied. Please allow camera permissions in your browser settings to take photos directly."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No camera hardware found on this device.");
      } else {
        setErrorMessage(
          `Unable to access camera (${err.message || "Unknown error"}). Try the Browse File option instead.`
        );
      }
    } finally {
      setIsLoadingCamera(false);
    }
  }, [facingMode, stopStream]);

  // Manage camera lifecycle based on modal open state
  useEffect(() => {
    if (isOpen) {
      cleanupCaptured();
      startCamera(facingMode);
    } else {
      stopStream();
      cleanupCaptured();
      setErrorMessage("");
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flip rear / front camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Toggle flashlight / torch
  const handleToggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()?.[0];
    if (track) {
      try {
        const nextTorch = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
      } catch (err) {
        console.warn("Failed to toggle torch:", err);
      }
    }
  };

  // Capture current video frame to canvas
  const handleSnapPhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setErrorMessage("Camera feed is not ready yet. Please wait a second.");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setErrorMessage("Could not initialize image processing canvas.");
        return;
      }

      // Draw active frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Export as high-quality JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setErrorMessage("Failed to encode captured photo.");
            return;
          }

          const previewUrl = URL.createObjectURL(blob);
          const fileName = `receipt-photo-${Date.now()}.jpg`;
          const file = new File([blob], fileName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          setCapturedBlobUrl(previewUrl);
          setCapturedFile(file);
          // Pause camera stream while previewing
          stopStream();
        },
        "image/jpeg",
        0.92
      );
    } catch (err) {
      console.error("Snap photo error:", err);
      setErrorMessage("Error capturing photo frame.");
    }
  };

  // User accepts the snapped photo
  const handleConfirmPhoto = () => {
    if (capturedFile && onCapture) {
      onCapture(capturedFile);
    }
    handleCloseModal();
  };

  // Retake photo: discard captured preview and restart camera
  const handleRetake = () => {
    cleanupCaptured();
    startCamera(facingMode);
  };

  // Dismiss modal
  const handleCloseModal = () => {
    stopStream();
    cleanupCaptured();
    setErrorMessage("");
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-fade-in text-white">
      {/* Top Controls Toolbar */}
      <div className="w-full max-w-xl flex items-center justify-between px-2 pt-1 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#FFDF2C]">
            <Camera size={17} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              {capturedBlobUrl ? "Confirm Receipt Photo" : "Take Receipt Photo"}
            </span>
            <p className="text-[10px] text-slate-300">
              {capturedBlobUrl
                ? "Review photo clarity before saving"
                : "Frame the official receipt in clear lighting"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Torch toggle button (if supported on active hardware track) */}
          {!capturedBlobUrl && hasTorch && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-2 rounded-full transition cursor-pointer ${
                isTorchOn
                  ? "bg-[#FFDF2C] text-[#0A4B6E]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Toggle Flash / Torch"
            >
              {isTorchOn ? <Zap size={17} /> : <ZapOff size={17} />}
            </button>
          )}

          {/* Camera flip toggle button */}
          {!capturedBlobUrl && (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
              title="Flip Camera (Front/Rear)"
            >
              <RefreshCw size={17} />
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-red-500/40 transition cursor-pointer"
            title="Close camera"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Viewfinder / Preview Body */}
      <div className="flex-1 w-full max-w-xl min-h-0 flex items-center justify-center p-2 relative my-2">
        <div className="w-full h-full max-h-[70vh] rounded-2xl overflow-hidden bg-black/60 border border-white/15 relative flex items-center justify-center shadow-2xl">
          {/* Error Message Notice */}
          {errorMessage ? (
            <div className="p-6 text-center max-w-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle size={26} />
              </div>
              <p className="text-xs text-red-200 font-medium leading-relaxed">
                {errorMessage}
              </p>
              <Button
                type="button"
                variant="yellow"
                onClick={handleCloseModal}
                className="text-xs mt-2"
              >
                CLOSE CAMERA
              </Button>
            </div>
          ) : capturedBlobUrl ? (
            /* FROZEN PREVIEW */
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              <img
                src={capturedBlobUrl}
                alt="Captured Receipt"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] text-emerald-300 font-semibold flex items-center gap-1 border border-emerald-500/30">
                <Check size={12} />
                <span>Photo Captured</span>
              </div>
            </div>
          ) : (
            /* LIVE WEBRTC VIDEO FEED */
            <div className="w-full h-full relative flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Viewfinder Target Framing Guides */}
              <div className="absolute inset-6 pointer-events-none border border-white/25 rounded-xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-[#FFDF2C]" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-[#FFDF2C]" />
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-white/70 bg-black/40 px-2.5 py-0.5 rounded-full backdrop-blur-xs font-mono">
                    Align Receipt Inside Box
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-[#FFDF2C]" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-[#FFDF2C]" />
                </div>
              </div>

              {isLoadingCamera && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw size={24} className="text-[#FFDF2C] animate-spin" />
                    <span className="text-xs text-white font-medium">
                      Initializing camera...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Shutter & Action Bar */}
      <div className="w-full max-w-xl flex items-center justify-center px-4 pb-2 pt-1 shrink-0 z-10">
        {capturedBlobUrl ? (
          /* Confirmation Actions */
          <div className="w-full flex items-center gap-3">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>RETAKE PHOTO</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmPhoto}
              className="flex-1 py-3 rounded-full bg-[#FFDF2C] hover:bg-yellow-400 text-[#0A4B6E] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg"
            >
              <Check size={16} />
              <span>USE THIS PHOTO</span>
            </button>
          </div>
        ) : (
          /* Live Shutter Button */
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSnapPhoto}
              disabled={isLoadingCamera || Boolean(errorMessage)}
              className="w-16 h-16 rounded-full bg-white/20 border-4 border-white flex items-center justify-center transition active:scale-95 hover:bg-white/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group shadow-xl"
              title="Snap photo"
            >
              <div className="w-11 h-11 rounded-full bg-[#FFDF2C] group-hover:scale-95 transition-transform flex items-center justify-center text-[#0A4B6E]">
                <Camera size={20} />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
