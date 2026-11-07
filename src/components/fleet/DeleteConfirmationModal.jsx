// src/components/fleet/DeleteConfirmationModal.jsx
import ConfirmationModal from "../ui/ConfirmationModal.jsx";

export default function DeleteConfirmationModal({ truck, onConfirm, onClose }) {
  if (!truck) return null;

  return (
    <ConfirmationModal
      isOpen={Boolean(truck)}
      onClose={onClose}
      onConfirm={() => onConfirm(truck)}
      title="Deactivate Truck?"
      confirmText="Continue"
      cancelText="Cancel"
      variant="danger"
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