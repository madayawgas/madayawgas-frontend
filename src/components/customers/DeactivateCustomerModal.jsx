import ConfirmationModal from "../ui/ConfirmationModal.jsx";

export default function DeactivateCustomerModal({
  customer,
  onClose,
  onConfirm,
}) {
  if (!customer) return null;

  return (
    <ConfirmationModal
      isOpen={Boolean(customer)}
      onClose={onClose}
      onConfirm={() => onConfirm(customer)}
      title="Deactivate Customer?"
      confirmText="Continue"
      cancelText="Cancel"
      variant="danger"
      message={
        <p className="text-gray-800 leading-relaxed text-xs">
          <strong className="text-[#0A4B6E] font-bold">{customer.name}</strong>
          's profile will be deactivated and will no longer be available for new
          sales or deliveries, while historical records are retained.
        </p>
      }
    />
  );
}
