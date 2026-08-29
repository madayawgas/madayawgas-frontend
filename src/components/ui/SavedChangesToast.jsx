import ToastNotification from "./ToastNotifications";

export default function SavedChangesToast({ onClose, className = "" }) {
  return (
    <ToastNotification
      type="success"
      message="Saved Changes"
      onClose={onClose}
      className={className}
    />
  );
}