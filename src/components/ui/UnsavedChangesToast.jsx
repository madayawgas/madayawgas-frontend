import ToastNotification from "./ToastNotifications";

export default function UnsavedChangesToast({ onClose, className = "" }) {
  return (
    <ToastNotification
      type="info"
      message="Changes not Saved"
      onClose={onClose}
      className={className}
    />
  );
}