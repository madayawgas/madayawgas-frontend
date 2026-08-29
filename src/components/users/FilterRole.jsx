import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";
import Button from "../ui/Button";
import StatusFilterGroup from "./StatusFilterGroup";
import RolesFilterGroup from "./RolesFilterGroup";
import DateFilterGroup from "./DateFilterGroup";

export default function FilterRole({
  label = "Filter Roles",
  onApply,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const dropdownRef = useRef(null);

  const rolesList = [
    "All Roles",
    "Super Admin",
    "Admin",
    "Fleet Manager",
    "Driver",
    "Sales Manager",
    "Sales Person",
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearAll = () => {
    setSelectedStatus("");
    setSelectedRole("All Roles");
    setDateFrom("");
    setDateTo("");
  };

  const handleApply = () => {
    if (onApply) {
      onApply({ status: selectedStatus, role: selectedRole, dateFrom, dateTo });
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`bg-[#FCFEFE] text-[#0A4B6E] px-4 py-2 rounded-full text-sm border border-[#0A4B6E] flex items-center gap-2 hover:bg-gray-100 transition-all duration-200 h-[38px] min-w-[140px] justify-between cursor-pointer ${className}`}
      >
        <span>{label}</span>
        <Funnel size={16} className="text-[#0A4B6E]" />
      </button>

      {/* Filter Card Dropdown */}
      <div
        className={`absolute right-0 mt-2 w-[360px] bg-white border border-[#0A4B6E]/30 rounded-2xl shadow-xl z-30 p-5 origin-top-right transition-all duration-200 ease-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold text-sm">
            <span>Filter Roles</span>
            <Funnel size={14} className="text-[#0A4B6E]" />
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[11px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Section Components */}
        <StatusFilterGroup
          selectedStatus={selectedStatus}
          onChange={setSelectedStatus}
        />

        <RolesFilterGroup
          rolesList={rolesList}
          selectedRole={selectedRole}
          onChange={setSelectedRole}
        />

        <DateFilterGroup
          dateFrom={dateFrom}
          dateTo={dateTo}
          onFromChange={(e) => setDateFrom(e.target.value)}
          onToChange={(e) => setDateTo(e.target.value)}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={handleClearAll}
            className="!px-3 !py-1.5 !text-[11px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wider !rounded-full"
          >
            CLEAR ALL
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="!px-4 !py-1.5 !text-[11px] font-bold uppercase tracking-wider !rounded-full"
          >
            APPLY RESULT
          </Button>
        </div>
      </div>
    </div>
  );
}