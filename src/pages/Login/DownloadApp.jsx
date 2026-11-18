import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Copy, Download, Smartphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getDefaultRoute } from "../../utils/permissions.js";
import { SYSTEM_CONFIG } from "../../config/systemConfig.js";
import QrCodeCard from "../../components/ui/QrCodeCard.jsx";

import logo from "../../assets/logov2.svg";
import bgLeftCard from "../../assets/BG-Madayaw8.png";
import bgScreen from "../../assets/BG-Madayaw8.png";

export default function DownloadApp() {
  const { isAuthenticated, currentUser } = useAuth();
  const [copied, setCopied] = useState(false);

  const {
    url: downloadUrl = "",
    appName = "MadayawGas Mobile",
    platformLabel = "Android APK",
    version = "",
    fileName = "MadayawGas-Mobile.apk",
  } = SYSTEM_CONFIG.appDownload || {};

  const hasValidUrl = Boolean(downloadUrl && downloadUrl.trim());
  const backPath =
    isAuthenticated && currentUser ? getDefaultRoute(currentUser) : "/login";
  const backLabel =
    isAuthenticated && currentUser ? "Back to Dashboard" : "Back to Login";

  const handleCopyLink = async () => {
    if (!hasValidUrl || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission errors silently
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative font-sans overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-md scale-105"
        style={{ backgroundImage: `url(${bgScreen})` }}
      />

      <div className="relative z-10 w-full max-w-3xl lg:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 md:p-9 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-stretch animate-scale-in">
        {/* Left Branded Visual Card */}
        <div
          className="md:col-span-5 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-start bg-cover bg-center relative overflow-hidden min-h-[220px] md:min-h-[380px] shadow-2xs"
          style={{ backgroundImage: `url(${bgLeftCard})` }}
        >
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#FFDF2C] text-[#0A4B6E] text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-2xs">
              <Smartphone size={12} aria-hidden="true" />
              {platformLabel}
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-white leading-tight mt-4">
              Take field
              <br />
              operations
              <br />
              with you
            </h2>
          </div>
        </div>

        {/* Right Download & QR Content */}
        <div className="md:col-span-7 flex flex-col justify-between py-1 px-1 sm:px-2">
          <div>
            <div className="flex items-start justify-between gap-3">
              <img
                src={logo}
                alt="Madayaw Gas Logo"
                className="w-11 h-11 object-contain mb-2.5"
              />

              <Link
                to={backPath}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F7AB2] hover:text-[#0A4B6E] hover:underline rounded-lg px-2 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F7AB2]"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                {backLabel}
              </Link>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 leading-tight">
                {appName}
              </h1>
              {version && (
                <span className="text-[11px] font-semibold text-[#0A4B6E] bg-[#E8F3F8] px-2.5 py-0.5 rounded-full">
                  {version}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-0.5">
              Madayaw Petroleum and Gas Corporation
            </p>

            <div className="w-full h-px bg-gray-100 my-4" />

            {/* QR Code Container */}
            <div className="bg-[#F3F5F5] rounded-2xl p-5 flex flex-col items-center text-center border border-gray-200/70">
              <QrCodeCard
                value={downloadUrl}
                alt={`QR code to download ${appName}`}
              />

              <p className="text-xs font-medium text-gray-600 mt-3.5">
                Scan with your phone camera to start downloading
              </p>

              {hasValidUrl && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F7AB2] hover:text-[#0A4B6E] px-2.5 py-1 rounded-full hover:bg-white/80 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F7AB2]"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" aria-hidden="true" />
                      <span className="text-emerald-700">Download link copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} aria-hidden="true" />
                      <span>Copy download link</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Optional Direct Download Button */}
            {hasValidUrl && (
              <div className="mt-4">
                <a
                  href={downloadUrl}
                  download={fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#0E384E] hover:bg-[#0b5f8a] text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors active:scale-[0.99] text-xs sm:text-sm flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F7AB2] focus-visible:ring-offset-2"
                >
                  <Download size={16} aria-hidden="true" />
                  <span>Download Directly</span>
                </a>
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  Already on your phone? Tap above to download directly.
                </p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-5">
            Madayaw Gas Fleet System © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
