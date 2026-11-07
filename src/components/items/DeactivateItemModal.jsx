// src/components/items/DeactivateItemModal.jsx
import ConfirmationModal from "../ui/ConfirmationModal.jsx";

export default function DeactivateItemModal({ item, onConfirm, onClose }) {
  if (!item) return null;

  return (
    <ConfirmationModal
      isOpen={Boolean(item)}
      onClose={onClose}
      onConfirm={() => onConfirm(item)}
      title="Deactivate Item?"
      confirmText="Continue"
      cancelText="Cancel"
      variant="danger"
      message={
        <p className="text-gray-800 leading-relaxed text-xs">
          Are you sure you want to deactivate{" "}
          <strong className="text-[#0A4B6E] font-bold">
            {item.name || item.itemName || "this product"}
          </strong>
          ? This product item will be marked as inactive and will not be available for new sales or inventory movements, while historical records are retained.
        </p>
      }
    />
  );
}


