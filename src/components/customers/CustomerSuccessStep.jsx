import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function CustomerSuccessStep({ formData, onDone }) {
  return (
    <div className="px-8 pb-8 overflow-y-auto max-h-[85vh]">
      <div className="flex flex-col gap-4 px-4 mb-8">
        <div className="grid grid-cols-[130px_1fr] items-center">
          <span className="text-gray-600 text-[14px]">Customer Name</span>
          <span className="text-gray-900 font-bold text-[15px]">
            {formData.name}
          </span>
        </div>

        <div className="grid grid-cols-[130px_1fr] items-start">
          <span className="text-gray-600 text-[14px] mt-0.5">Address</span>
          <span className="text-gray-900 font-medium text-[14px]">
            {formData.address}
          </span>
        </div>

        <div className="grid grid-cols-[130px_1fr] items-center">
          <span className="text-gray-600 text-[14px]">Contact No.</span>
          <span className="text-gray-900 font-medium text-[14px]">
            {formData.contactNumber}
          </span>
        </div>

        <div className="grid grid-cols-[130px_1fr] items-center">
          <span className="text-gray-600 text-[14px]">Segment</span>
          <div>
            <Badge variant="roles">{formData.customerType}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-[130px_1fr] items-center">
          <span className="text-gray-600 text-[14px]">Status</span>
          <div>
            <Badge
              variant={formData.isActive ? "success" : "deactivated"}
              className="px-5 py-1.5 text-[11px] font-extrabold"
            >
              {formData.isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={onDone}
          className="w-full py-3.5 bg-[#F6C445] hover:bg-[#e2b23b] border-none !text-[#0B4A6E] rounded-full font-bold uppercase tracking-widest text-[11px] transition-colors cursor-pointer"
        >
          DONE
        </Button>
      </div>
    </div>
  );
}
