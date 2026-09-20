import { UserRound, Phone, Calendar, MapPin } from "lucide-react";
import { formatPhilippinePhone } from "../../utils/phone.js";
import Badge from "../ui/Badge";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  } catch {
    return dateStr;
  }
}

export default function CustomerTable({
  customers = [],
  selectedCustomer,
  onSelectCustomer,
  sortConfig = { key: "name", direction: "asc" },
  onSort,
}) {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs">
            <tr>
              <th
                className="py-3 px-4 md:px-5 font-medium cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[32%]"
                onClick={() => onSort("name")}
              >
                Customer Profile{" "}
                {sortConfig.key === "name" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3 px-4 md:px-5 font-medium cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[18%]"
                onClick={() => onSort("customerType")}
              >
                Customer Type{" "}
                {sortConfig.key === "customerType" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th className="py-3 px-4 md:px-5 font-medium whitespace-nowrap w-[20%]">
                Contact No.
              </th>
              <th
                className="py-3 px-4 md:px-5 font-medium text-center cursor-pointer hover:bg-[#0b3e5b] transition-colors whitespace-nowrap w-[15%]"
                onClick={() => onSort("createdAt")}
              >
                Date Registered{" "}
                {sortConfig.key === "createdAt" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th className="py-3 px-4 md:px-5 font-medium text-center whitespace-nowrap w-[15%]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
            {customers.length > 0 ? (
              customers.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;
                const initial = customer.name
                  ? customer.name.trim().charAt(0).toUpperCase()
                  : "";

                return (
                  <tr
                    key={customer.id}
                    onClick={() => onSelectCustomer(customer)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#E2EDF3] text-[#0A4B6E] font-medium"
                        : "hover:bg-[#E8F3F8]/70 bg-white"
                    }`}
                  >
                    {/* Customer Profile & Address */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                          {initial || <UserRound size={14} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#0A4B6E] truncate text-xs md:text-sm">
                            {customer.name}
                          </div>
                          {customer.address && (
                            <div
                              className="text-[11px] text-[#6D8AA2] flex items-center gap-1 font-normal truncate"
                              title={customer.address}
                            >
                              <MapPin size={11} className="shrink-0 text-[#6D8AA2]" />
                              <span className="truncate">{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Customer Type Badge */}
                    <td className="py-3.5 px-4 md:px-5">
                      <Badge
                        variant="roles"
                        className="text-[10px] px-2.5 py-0.5 truncate max-w-full inline-block"
                      >
                        {customer.customerType}
                      </Badge>
                    </td>

                    {/* Contact Number */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-center gap-1.5 text-gray-700 font-medium text-xs md:text-sm">
                        <Phone size={13} className="text-[#6D8AA2] shrink-0" />
                        <span className="truncate">
                          {customer.contactNumber
                            ? formatPhilippinePhone(customer.contactNumber)
                            : "-"}
                        </span>
                      </div>
                    </td>

                    {/* Date Registered */}
                    <td className="py-3.5 px-4 md:px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[#6D8AA2] italic">
                        <Calendar size={13} className="text-[#6D8AA2] shrink-0" />
                        <span>{formatDate(customer.createdAt)}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 md:px-5 text-center whitespace-nowrap">
                      <Badge
                        variant={customer.isActive ? "success" : "deactivated"}
                        className="text-[10px] px-2.5 py-0.5"
                      >
                        {customer.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="py-12 text-center text-gray-400 italic"
                >
                  No customers match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
