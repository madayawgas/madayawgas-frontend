import Button from "../ui/Button";

export default function DeactivateCustomerModal({
  customer,
  onClose,
  onConfirm,
}) {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-[#0B4A6E] mb-4">
          Deactivate Customer?
        </h2>

        <p className="text-gray-800 mb-8 leading-relaxed text-[15px]">
          <span className="font-bold text-[#0B4A6E]">{customer.name}</span>
          's profile will be deactivated and will no longer be available for new
          sales or deliveries, while historical records are retained.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => onConfirm(customer)}
            className="w-full py-3 bg-[#CD3E3E] border-none !text-white rounded-full font-semibold uppercase tracking-widest text-sm hover:bg-[#b83737] transition-colors cursor-pointer"
          >
            CONTINUE
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-transparent border-none !text-[#0B4A6E] font-semibold uppercase tracking-widest text-sm hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
          >
            CANCEL
          </Button>
        </div>
      </div>
    </div>
  );
}
