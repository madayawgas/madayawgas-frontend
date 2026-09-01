import { AlertCircle } from "lucide-react";
import Button from "../ui/Button";

export default function UserConfirmStep({
  formData,
  safeRole,
  onConfirm,
  isSubmitting = false,
  submitError = "",
}) {
  return (
    <div className="px-8 pb-8 overflow-y-auto max-h-[85vh]">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium p-3.5 rounded-2xl flex items-center gap-2.5 mb-5 animate-fade-in">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{submitError}</span>
        </div>
      )}

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
          disabled={isSubmitting}
          className="w-full py-3.5 bg-[#F6C445] hover:bg-[#e2b23b] disabled:opacity-50 disabled:cursor-not-allowed border-none !text-[#0B4A6E] rounded-full font-bold uppercase tracking-widest text-[11px] transition-colors"
        >
          {isSubmitting ? "CREATING..." : "CONFIRM"}
        </Button>
      </div>
    </div>
  );
}