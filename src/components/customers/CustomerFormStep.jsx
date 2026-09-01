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
    <form onSubmit={onSubmit} className="px-8 pb-8 overflow-y-auto max-h-[85vh]">
      <div className="space-y-5">
        {/* Customer / Business Name */}
        <div>
          <label className="block text-[15px] text-gray-900 mb-1.5 font-medium">
            Customer / Business Name<span className="text-[#CD3E3E]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Davao Central Bakery"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-[#0B4A6E]/20"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-[15px] text-gray-900 mb-1.5 font-medium">
            Delivery / Physical Address<span className="text-[#CD3E3E]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Corner San Pedro St, Davao City"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-[#0B4A6E]/20"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Number */}
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5 font-medium">
              Contact Number<span className="text-[#CD3E3E]">*</span>
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
              className={`w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 ${
                phoneError
                  ? "border-2 border-red-500 focus:ring-red-200"
                  : "focus:ring-[#0B4A6E]/20"
              }`}
            />
            {phoneError && (
              <p className="text-red-500 text-xs mt-1.5 ml-3">{phoneError}</p>
            )}
          </div>

          {/* Customer Type / Segment */}
          <div>
            <label className="block text-[15px] text-gray-900 mb-1.5 font-medium">
              Customer Segment<span className="text-[#CD3E3E]">*</span>
            </label>
            <select
              required
              value={formData.customerType}
              onChange={(e) =>
                setFormData({ ...formData, customerType: e.target.value })
              }
              className="w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-[#0B4A6E]/20 cursor-pointer"
            >
              {customerTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status (Edit Mode) */}
        {customer && (
          <div>
            <label className="block text-[15px] text-gray-900 mb-2 font-medium">
              Status
            </label>
            <div className="flex items-center gap-3">
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
                      className={`px-5 py-2 text-[11px] transition-all duration-200 ease-in-out ${
                        isSelected
                          ? "filter saturate-150 brightness-95 shadow-inner scale-[1.02] border-2 font-extrabold"
                          : "opacity-60 grayscale-[40%] hover:opacity-80"
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

      {/* Buttons */}
      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="submit"
          className="w-full py-3.5 bg-[#F6C445] hover:bg-[#e2b23b] border-none !text-[#0B4A6E] rounded-full font-bold uppercase tracking-widest text-[11px] transition-colors cursor-pointer"
        >
          {customer ? "SAVE CHANGES" : "CREATE CUSTOMER"}
        </Button>
        <Button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-transparent border-none !text-[#0B4A6E] font-bold uppercase tracking-widest text-[11px] hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
        >
          CANCEL
        </Button>
      </div>
    </form>
  );
}
