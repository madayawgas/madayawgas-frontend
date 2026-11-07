// src/components/fleet/DeleteConfirmationModal.jsx
import ConfirmationModal from "../ui/ConfirmationModal.jsx";

export default function DeleteConfirmationModal({ truck, onConfirm, onClose }) {
  if (!truck) return null;

  return (
    <ConfirmationModal
      isOpen={Boolean(truck)}
      onClose={onClose}
      onConfirm={(password) => onConfirm(truck, password)}
      title="Deactivate Truck?"
      confirmText="Deactivate"
      cancelText="Cancel"
      variant="danger"
      requiresPassword={true}
      passwordLabel="Enter your password to authorize deactivation:"
      message={
        <p className="text-gray-800 leading-relaxed text-xs">
          This action will mark{" "}
          <strong className="text-[#0A4B6E] font-bold">
            {truck.plateNumber || "this vehicle"}
          </strong>{" "}
          as inactive and release its assigned driver, while its historical records and mileage logs are retained.
        </p>
      }
    />
  );
}