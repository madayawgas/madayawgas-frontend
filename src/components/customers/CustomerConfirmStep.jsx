import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function CustomerConfirmStep({ formData, onConfirm, isSubmitting }) {
  return (
    <div className="px-8 pb-8 overflow-y-auto max-h-[85vh]">
      <div className="space-y-4">
        {/* Customer / Business Name */}
        <div>
          <label className="block text-[14px] text-gray-500 mb-1">
            Customer / Business Name
          </label>
          <div className="w-full bg-[#F3F5F5] text-gray-900 font-semibold text-sm px-4 py-3 rounded-full">
            {formData.name || "-"}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-[14px] text-gray-500 mb-1">
            Delivery / Physical Address
          </label>
          <div className="w-full bg-[#F3F5F5] text-gray-900 font-semibold text-sm px-4 py-3 rounded-full">
            {formData.address || "-"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Number */}
          <div>
            <label className="block text-[14px] text-gray-500 mb-1">
              Contact Number
            </label>
            <div className="w-full bg-[#F3F5F5] text-gray-900 font-semibold text-sm px-4 py-3 rounded-full">
              {formData.contactNumber || "-"}
            </div>
          </div>

          {/* Customer Segment */}
          <div>
            <label className="block text-[14px] text-gray-500 mb-1">
              Customer Segment
            </label>
            <div className="w-full bg-[#F3F5F5] text-gray-900 font-semibold text-sm px-4 py-3 rounded-full">
              {formData.customerType || "-"}
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[14px] text-gray-500 mb-1">Status</label>
          <div className="pt-1">
            <Badge
              variant={formData.isActive ? "success" : "deactivated"}
              className="px-5 py-1.5 text-[11px] font-extrabold"
            >
              {formData.isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-[#F6C445] hover:bg-[#e2b23b] border-none !text-[#0B4A6E] rounded-full font-bold uppercase tracking-widest text-[11px] transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "SAVING..." : "CONFIRM"}
        </Button>
      </div>
    </div>
  );
}
