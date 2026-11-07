import { AlertTriangle, AlertCircle } from "lucide-react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary"
  isLoading = false,
  icon: Icon = AlertTriangle,
}) {
  const isDanger = variant === "danger";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={Icon}
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "destructive" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs"
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
            isDanger
              ? "bg-rose-50/70 border-rose-100 text-rose-950"
              : "bg-amber-50/70 border-amber-100 text-amber-950"
          }`}
        >
          <AlertCircle
            size={18}
            className={`shrink-0 mt-0.5 ${
              isDanger ? "text-[#C93B32]" : "text-amber-600"
            }`}
          />
          <div className="space-y-1">
            {typeof message === "string" ? <p>{message}</p> : message}
          </div>
        </div>
      </div>
    </Modal>
  );
}
