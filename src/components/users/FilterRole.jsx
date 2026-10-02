import { useState, useEffect, useRef, useMemo } from "react";
import { Funnel } from "lucide-react";
import Button from "../ui/Button";
import StatusFilterGroup from "./StatusFilterGroup";
import RolesFilterGroup from "./RolesFilterGroup";
import DateFilterGroup from "./DateFilterGroup";

export default function FilterRole({
  label = "Filter Roles",
  onApply,
  className = "",
  roles = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const dropdownRef = useRef(null);

  const rolesList = useMemo(() => {
    const defaultRoles = [
      "All Roles",
      "Super Admin",
      "Admin",
      "Fleet Manager",
      "Driver",
      "Sales Manager",
      "Sales Person",
      "Sales Supervisor",
      "Logistics Supervisor",
    ];
    const fromProps = (roles || [])
      .map((r) => (typeof r === "string" ? r : r?.name))
      .filter(Boolean);
    return Array.from(new Set([...defaultRoles, ...fromProps]));
  }, [roles]);

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
        className={`bg-[#FCFEFE] hover:bg-[#F3F8FB] text-[#0A4B6E] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#0A4B6E]/30 hover:border-[#0A4B6E]/60 flex items-center gap-1.5 transition-all duration-150 h-[30px] min-w-[110px] justify-between cursor-pointer shadow-2xs ${className}`}
      >
        <span>{label}</span>
        <Funnel size={12} className="text-[#0A4B6E] shrink-0" />
      </button>

      {/* Filter Card Dropdown */}
      <div
        className={`absolute right-0 mt-1.5 w-[290px] bg-white border border-[#0A4B6E]/20 rounded-2xl shadow-xl z-30 p-3.5 origin-top-right transition-all duration-150 ease-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold text-xs">
            <Funnel size={12} className="text-[#0A4B6E]" />
            <span>Filter Roles</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider cursor-pointer"
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
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={handleClearAll}
            className="!px-2.5 !py-1 !text-[10px] font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wider !rounded-full !h-[26px]"
          >
            CLEAR ALL
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="!px-3 !py-1 !text-[10px] font-bold uppercase tracking-wider !rounded-full !h-[26px]"
          >
            APPLY RESULT
          </Button>
        </div>
      </div>
    </div>
  );
}