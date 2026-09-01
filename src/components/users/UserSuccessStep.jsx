import { useState } from "react";
import { Check, Copy } from "lucide-react";
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
    <div className="px-8 pb-8 overflow-y-auto max-h-[85vh]">
      <div className="flex flex-col gap-5 px-4 mb-8">
        <div className="grid grid-cols-[120px_1fr] items-center">
          <span className="text-gray-600 text-[15px]">Name</span>
          <span className="text-gray-900 font-bold text-[15px]">
            {formData.firstName} {formData.lastName}
          </span>
        </div>
        <div className="grid grid-cols-[120px_1fr] items-center">
          <span className="text-gray-600 text-[15px]">Role Access</span>
          <span className="text-gray-900 font-bold text-[15px]">{safeRole}</span>
        </div>
        <div className="grid grid-cols-[120px_1fr] items-center">
          <span className="text-gray-600 text-[15px]">Username</span>
          <span className="text-gray-900 font-bold text-[15px]">{generatedUsername}</span>
        </div>

        {temporaryPassword && (
          <div className="grid grid-cols-[120px_1fr] items-start">
            <span className="text-gray-600 text-[15px] mt-2.5">Password</span>
            <div>
              <div className="bg-[#F3F5F5] text-[#E53E3E] font-mono text-sm px-4 py-2.5 rounded-full inline-block min-w-[160px] text-center font-bold tracking-wider">
                {temporaryPassword}
              </div>
              <div className="text-right mt-1.5 max-w-[160px]">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[#0B4A6E] bg-transparent border-none p-0 text-[11px] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Password</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-[120px_1fr] items-center">
          <span className="text-gray-600 text-[15px]">Status</span>
          <div>
            <Badge
              variant={formData.status === "SUSPENDED" ? "neutral" : "success"}
              className="px-5 py-1.5 text-[11px] font-extrabold filter saturate-150 brightness-95"
            >
              {formData.status || "ACTIVE"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={onDone}
          className="w-full py-3.5 bg-[#F6C445] hover:bg-[#e2b23b] border-none !text-[#0B4A6E] rounded-full font-bold uppercase tracking-widest text-[11px] transition-colors"
        >
          DONE
        </Button>
      </div>
    </div>
  );
}