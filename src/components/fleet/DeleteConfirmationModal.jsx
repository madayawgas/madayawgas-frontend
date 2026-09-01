// src/components/fleet/DeleteConfirmationModal.jsx
import Button from "../ui/Button";

export default function DeleteConfirmationModal({ truck, onConfirm, onClose }) {
  if (!truck) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl text-left">
        <h2 className="text-2xl font-bold text-[#0B4A6E] mb-4">
          Deactivate Truck?
        </h2>

        <p className="text-gray-800 mb-8 leading-relaxed text-[15px]">
          This action will mark{" "}
          <span className="font-semibold text-gray-900">
            {truck.plateNumber || "this vehicle"}
          </span>{" "}
          as inactive and release its assigned driver, while its historical records and mileage logs are retained.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => onConfirm(truck)}
            className="w-full py-3 bg-[#CD3E3E] border-none !text-white rounded-full font-semibold uppercase tracking-widest text-sm hover:bg-[#b83737] transition-colors"
          >
            DEACTIVATE TRUCK
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-transparent border-none !text-[#0B4A6E] font-semibold uppercase tracking-widest text-sm hover:bg-gray-50 rounded-full transition-colors"
          >
            CANCEL
          </Button>
        </div>
      </div>
    </div>
  );
}