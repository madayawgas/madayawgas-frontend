// src/components/users/UserSuccessStep.jsx
import { useState } from "react";
import { Check, Copy, CheckCircle2, KeyRound, Shield, UserRound } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function UserSuccessStep({
  formData,
  safeRole,
  generatedUsername,
  temporaryPassword,
  onDone,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* SUCCESS CARD */}
      <div className="bg-[#E8F3F8] rounded-2xl p-5 border border-[#BCE1F1]/60 space-y-4">
        {/* User Identity Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#BCE1F1]/60">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-12 h-12 rounded-full bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
              <UserRound size={26} className="text-[#FFDF2C]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate">
                {formData.firstName} {formData.lastName}
              </h3>
              <p className="text-xs text-[#6D8AA2] font-medium">User Credentials Created</p>
            </div>
          </div>

          <Badge variant="roles" className="shrink-0">
            {safeRole}
          </Badge>
        </div>

        {/* Credentials Breakdown */}
        <div className="space-y-3 text-xs">
          <div className="bg-white/90 p-3.5 rounded-xl border border-[#BCE1F1]/50 flex items-center justify-between">
            <span className="text-[#6D8AA2] font-bold uppercase tracking-wider text-[11px]">
              Assigned Username
            </span>
            <span className="font-mono font-bold text-[#0A4B6E] text-sm bg-[#E8F3F8] px-2.5 py-1 rounded-lg border border-[#BCE1F1]">
              {generatedUsername || formData.username}
            </span>
          </div>

          {temporaryPassword && (
            <div className="bg-white/90 p-3.5 rounded-xl border border-[#BCE1F1]/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#6D8AA2] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <KeyRound size={13} className="text-amber-600" />
                  <span>Temporary Password</span>
                </span>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[#0A4B6E] hover:bg-[#E8F3F8] px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-[#0A4B6E]/30"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Password</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#FEF6D1] text-amber-900 font-mono text-center font-bold tracking-wider py-2 px-3 rounded-xl border border-amber-300 text-sm select-all">
                {temporaryPassword}
              </div>
              <p className="text-[11px] text-amber-800 text-center font-medium">
                User will be required to change this password on first login.
              </p>
            </div>
          )}

          <div className="bg-white/90 p-3 rounded-xl border border-[#BCE1F1]/50 flex items-center justify-between">
            <span className="text-[#6D8AA2] font-bold uppercase tracking-wider text-[11px]">
              Initial Status
            </span>
            <Badge variant="success" className="px-3 py-0.5 text-[10px] font-bold">
              {formData.status || "ACTIVE"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Done Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onDone}
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer"
        >
          DONE
        </button>
      </div>
    </div>
  );
}