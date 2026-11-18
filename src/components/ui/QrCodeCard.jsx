import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AlertCircle } from "lucide-react";

/**
 * Generates and displays a client-side QR code for the given URL/value.
 * Uses MadayawGas Primary Dark Navy (#0A4B6E) on pure white for reliable scanning.
 */
export default function QrCodeCard({
  value,
  size = 196,
  alt = "QR code to download the MadayawGas mobile app",
}) {
  const trimmedValue = typeof value === "string" ? value.trim() : "";
  const [qrState, setQrState] = useState({
    source: "",
    dataUrl: "",
    error: "",
  });

  useEffect(() => {
    if (!trimmedValue) return undefined;

    let cancelled = false;

    QRCode.toDataURL(trimmedValue, {
      width: size * 2,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0A4B6E",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        if (!cancelled) {
          setQrState({ source: trimmedValue, dataUrl: url, error: "" });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrState({
            source: trimmedValue,
            dataUrl: "",
            error: "Unable to generate QR code for this link.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [trimmedValue, size]);

  const errorMessage = !trimmedValue
    ? "Download link is not configured yet."
    : qrState.source === trimmedValue
    ? qrState.error
    : "";

  const activeDataUrl =
    trimmedValue && qrState.source === trimmedValue ? qrState.dataUrl : "";

  if (errorMessage) {
    return (
      <div
        role="alert"
        className="w-full max-w-[220px] aspect-square rounded-2xl border border-red-200 bg-red-50/80 p-4 flex flex-col items-center justify-center text-center gap-2"
      >
        <AlertCircle size={24} className="text-red-600 shrink-0" aria-hidden="true" />
        <p className="text-xs font-medium text-red-700 leading-relaxed">
          {errorMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs inline-flex items-center justify-center">
      {activeDataUrl ? (
        <img
          src={activeDataUrl}
          alt={alt}
          width={size}
          height={size}
          className="w-[176px] h-[176px] sm:w-[196px] sm:h-[196px] object-contain rounded-lg select-none"
        />
      ) : (
        <div
          aria-hidden="true"
          className="w-[176px] h-[176px] sm:w-[196px] sm:h-[196px] rounded-lg bg-gray-100 animate-pulse"
        />
      )}
    </div>
  );
}
