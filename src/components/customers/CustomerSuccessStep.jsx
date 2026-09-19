// src/components/customers/CustomerSuccessStep.jsx
import { Building2, MapPin, Phone, Tag, CheckCircle2 } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function CustomerSuccessStep({ formData, onDone }) {
  return (
    <div className="space-y-4">
      {/* SUCCESS SUMMARY CARD */}
      <div className="bg-[#E8F3F8] rounded-2xl p-5 border border-[#BCE1F1]/60 space-y-4">
        {/* Customer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#BCE1F1]/60">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-12 h-12 rounded-full bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Building2 size={24} className="text-[#FFDF2C]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#0A4B6E] truncate">
                {formData.name}
              </h3>
              <p className="text-xs text-[#6D8AA2] font-medium">Customer Saved</p>
            </div>
          </div>

          <Badge variant="roles" className="shrink-0">
            {formData.customerType}
          </Badge>
        </div>

        {/* Saved Attributes */}
        <div className="space-y-2 text-xs">
          <div className="bg-white/90 p-3 rounded-xl border border-[#BCE1F1]/50 space-y-1">
            <span className="text-[#6D8AA2] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin size={13} /> Address
            </span>
            <p className="font-bold text-[#0A4B6E] text-sm">
              {formData.address}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-white/90 p-3 rounded-xl border border-[#BCE1F1]/50 space-y-1">
              <span className="text-[#6D8AA2] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Phone size={13} /> Contact No.
              </span>
              <p className="font-bold text-[#0A4B6E] text-sm">
                {formData.contactNumber}
              </p>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-[#BCE1F1]/50 space-y-1">
              <span className="text-[#6D8AA2] font-bold uppercase tracking-wider text-[11px]">
                Status
              </span>
              <div>
                <Badge
                  variant={formData.isActive ? "success" : "deactivated"}
                  className="px-3 py-0.5 text-[10px] font-bold"
                >
                  {formData.isActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Done Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onDone}
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer"
        >
          DONE
        </button>
      </div>
    </div>
  );
}
