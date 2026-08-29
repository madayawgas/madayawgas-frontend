import { KeyRound } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function CreatedCredentialsModal({ credentials, onClose }) {
  if (!credentials) return null;

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
          <h3 className="font-bold text-lg">User Account Created</h3>
        </div>
        <p className="text-sm text-gray-600">
          Please share these temporary credentials with the user. They will be
          prompted to set a new password upon first login.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 font-mono text-sm">
          <p>
            <span className="text-gray-500 font-sans">Username: </span>
            <span className="font-bold text-[#0F7AB2]">
              {credentials.username}
            </span>
          </p>
          <p>
            <span className="text-gray-500 font-sans">
              Temporary Password:{" "}
            </span>
            <span className="font-bold text-[#E53E3E]">
              {credentials.temporaryPassword}
            </span>
          </p>
        </div>
      </div>
    </Modal>
  );
}