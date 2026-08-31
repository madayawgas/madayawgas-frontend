import { useState } from "react";
import { KeyRound, Check, Copy } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function CreatedCredentialsModal({
  credentials,
  title = "User Account Created",
  description,
  onClose,
}) {
  const [copied, setCopied] = useState(false);

  if (!credentials) return null;

  const handleCopy = () => {
    if (credentials?.temporaryPassword) {
      navigator.clipboard.writeText(credentials.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const footer = (
    <div className="flex justify-end">
      <Button variant="primary" onClick={onClose}>
        GOT IT
      </Button>
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="max-w-md" footer={footer}>
      <div className="text-left py-2 space-y-3">
        <div className="flex items-center gap-3 text-[#0F7AB2]">
          <KeyRound size={28} />
          <h3 className="font-bold text-lg text-[#0B4A6E]">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">
          {description ||
            "Please share these temporary credentials with the user. They will be prompted to set a new password upon first login."}
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Username:</span>
            <span className="font-bold text-[#0F7AB2] font-mono">
              {credentials.username}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Temporary Password:</span>
            <span className="font-bold text-[#E53E3E] font-mono tracking-wider">
              {credentials.temporaryPassword}
            </span>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0B4A6E] hover:underline cursor-pointer bg-transparent border-none p-1"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Password</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}