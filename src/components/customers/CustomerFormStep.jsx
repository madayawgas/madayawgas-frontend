// src/components/customers/CustomerFormStep.jsx
import { Building2, MapPin, Phone, Tag } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function CustomerFormStep({
  formData,
  setFormData,
  customer,
  phoneError,
  setPhoneError,
  onSubmit,
  onClose,
}) {
  const customerTypes = [
    { value: "COMMERCIAL", label: "COMMERCIAL" },
    { value: "RETAIL", label: "RETAIL" },
    { value: "WHOLESALE", label: "WHOLESALE" },
  ];

  const statuses = [
    { value: true, label: "ACTIVE", variant: "success" },
    { value: false, label: "INACTIVE", variant: "deactivated" },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* CARD 1: Customer Profile Details */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
          <Building2 size={14} />
          <span>Customer & Business Information</span>
        </div>

        {/* Customer / Business Name */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
            Customer / Business Name <span className="text-[#CD3E3E]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Davao Central Bakery"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Customer Segment */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
            Customer Segment <span className="text-[#CD3E3E]">*</span>
          </label>
          <select
            required
            value={formData.customerType}
            onChange={(e) =>
              setFormData({ ...formData, customerType: e.target.value })
            }
            className="w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 transition-all cursor-pointer"
          >
            {customerTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CARD 2: Contact & Delivery Location */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
          <MapPin size={14} />
          <span>Contact & Delivery Address</span>
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
            Contact Number <span className="text-[#CD3E3E]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 09171234567 or +63822245678"
            value={formData.contactNumber}
            onChange={(e) => {
              setFormData({ ...formData, contactNumber: e.target.value });
              if (phoneError) setPhoneError("");
            }}
            className={`w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
              phoneError
                ? "border-[#CD3E3E] focus:ring-2 focus:ring-red-200"
                : "border-slate-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10"
            }`}
          />
          {phoneError && (
            <p className="text-[#CD3E3E] text-[11px] mt-1 font-medium">{phoneError}</p>
          )}
        </div>

        {/* Delivery / Physical Address */}
        <div>
          <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1">
            Delivery / Physical Address <span className="text-[#CD3E3E]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Corner San Pedro St, Davao City"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="w-full bg-white text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status (Edit Mode) */}
        {customer && (
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-[#0A4B6E] uppercase tracking-wider mb-1.5">
              Operational Status
            </label>
            <div className="flex items-center gap-2">
              {statuses.map((s) => {
                const isSelected = formData.isActive === s.value;
                return (
                  <label
                    key={String(s.value)}
                    className="cursor-pointer relative flex items-center"
                  >
                    <input
                      type="radio"
                      name="isActive"
                      value={String(s.value)}
                      checked={isSelected}
                      onChange={() =>
                        setFormData({ ...formData, isActive: s.value })
                      }
                      className="sr-only"
                    />
                    <Badge
                      variant={s.variant}
                      className={`px-4 py-1.5 text-xs transition-all duration-150 ${
                        isSelected
                          ? "ring-2 ring-offset-1 ring-[#0A4B6E] font-bold shadow-xs scale-102"
                          : "opacity-50 hover:opacity-80"
                      }`}
                    >
                      {s.label}
                    </Badge>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>


      {/* FOOTER BUTTONS */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          type="submit"
          className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] active:scale-[0.98] text-[#0A4B6E] font-bold py-3.5 px-6 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-150 shadow-sm cursor-pointer"
        >
          {customer ? "SAVE CHANGES" : "CONTINUE TO CONFIRMATION"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-transparent hover:bg-slate-50 text-slate-500 font-semibold py-2 rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
