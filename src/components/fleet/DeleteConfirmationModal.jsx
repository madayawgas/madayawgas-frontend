// src/components/DeleteConfirmationModal.jsx
import { AlertCircle } from "lucide-react";

export default function DeleteConfirmationModal({ truck, onConfirm, onClose }) {
  if (!truck) return null;

  return (
    // Overlay background
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      {/* Modal Box */}
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative text-center">
        
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <AlertCircle size={60} className="text-red-500" />
        </div>

        {/* Title */}
        <h2 className="text-[#1B4B75] text-xl font-bold mb-3">
          Confirm Deletion
        </h2>

        {/* Message */}
        <p className="text-gray-700 text-sm mb-8">
          Are you sure you want to delete <span className="font-semibold text-gray-900">{truck.plate || `Truck #${truck.id}`}</span>? This action cannot be undone.
        </p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white font-semibold px-8 py-2 rounded-lg hover:bg-red-700 transition"
          >
            DELETE
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-200 text-gray-700 font-semibold px-8 py-2 rounded-lg hover:bg-gray-300 border border-gray-300 transition"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}