import Button from "../ui/Button";

export default function UserConfirmStep({ formData, safeRole, onConfirm }) {
  return (
    <div className="px-8 pb-8 overflow-y-auto max-h-[85vh]">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5">First Name</label>
            <div className="w-full bg-[#F3F5F5] text-gray-500 text-sm px-4 py-3 rounded-full">
              {formData.firstName || "-"}
            </div>
          </div>
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5">Last Name</label>
            <div className="w-full bg-[#F3F5F5] text-gray-500 text-sm px-4 py-3 rounded-full">
              {formData.lastName || "-"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5">Birthday</label>
            <div className="w-full bg-[#F3F5F5] text-gray-500 text-sm px-4 py-3 rounded-full min-h-[44px] flex items-center">
              {formData.birthday || "-"}
            </div>
          </div>
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5">Contact No.</label>
            <div className="w-full bg-[#F3F5F5] text-gray-500 text-sm px-4 py-3 rounded-full">
              {formData.contactNo || "-"}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-[15px] text-gray-900 mb-1.5">Role Access</label>
          <div className="w-full bg-[#F3F5F5] text-gray-500 text-sm px-4 py-3 rounded-full">
            {safeRole || "-"}
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <Button
          onClick={onConfirm}
          className="w-full py-3.5 bg-[#F6C445] hover:bg-[#e2b23b] border-none !text-[#0B4A6E] rounded-full font-bold uppercase tracking-widest text-[11px] transition-colors"
        >
          CONFIRM
        </Button>
      </div>
    </div>
  );
}