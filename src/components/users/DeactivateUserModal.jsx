import ConfirmationModal from "../ui/ConfirmationModal.jsx";
import { hasUserRole } from "../../utils/userRoles.js";

export default function DeactivateUserModal({ user, onClose, onConfirm }) {
  if (!user || hasUserRole(user, "Super Admin")) return null;

  return (
    <ConfirmationModal
      isOpen={Boolean(user)}
      onClose={onClose}
      onConfirm={(password) => onConfirm(user, password)}
      title="Deactivate User?"
      confirmText="Deactivate"
      cancelText="Cancel"
      variant="danger"
      requiresPassword={true}
      passwordLabel="Enter your password to authorize deactivation:"
      message={
        <p className="text-gray-800 leading-relaxed text-xs">
          <strong className="text-[#0A4B6E] font-bold">
            {user.firstName} {user.lastName}
          </strong>
          's account will be deactivated and will no longer have access to the
          system, while its records and activity history are retained.
        </p>
      }
    />
  );
}