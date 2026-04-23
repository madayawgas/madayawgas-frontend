// src/components/DeleteConfirmationModal.jsx
import { AlertCircle } from "lucide-react"; // Import visual icon for urgency
import Modal from "../ui/Modal";           // Reusable wrapper for pop-up behavior
import Button from "../ui/Button";         // Reusable styled button component

export default function DeleteConfirmationModal({ truck, onConfirm, onClose }) {
  // Guard clause: Prevents the modal from crashing if no truck data is passed
  if (!truck) return null;

  // Define footer buttons separately to keep the main JSX return clean
  const footer = (
    <div className="flex justify-center gap-4">
      <Button variant="danger" className="px-8" onClick={onConfirm}>
        DELETE
      </Button>
      <Button variant="secondary" className="px-8" onClick={onClose}>
        CANCEL
      </Button>
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="max-w-sm" footer={footer}>
      <div className="text-center py-4">
        
        {/* Warning Icon: Large and red to signal a destructive action */}
        <div className="flex justify-center mb-6">
          <AlertCircle size={60} className="text-red-500" />
        </div>

        {/* Title: Clear heading for accessibility and context */}
        <h2 className="text-[#1B4B75] text-xl font-bold mb-3">
          Confirm Deletion
        </h2>

        {/* Dynamic Message: Pulls plate number or ID so the user knows EXACTLY what they are deleting */}
        <p className="text-gray-700 text-sm">
          Are you sure you want to delete <span className="font-semibold text-gray-900">{truck.plateNumber || `Truck #${truck.truckId}`}</span>? This action cannot be undone.
        </p>
      </div>
    </Modal>
  );
}