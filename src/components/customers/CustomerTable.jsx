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
  customers,
  selectedCustomer,
  onSelectCustomer,
  sortConfig,
  onSort,
}) {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#0D4B6E] text-white text-sm sticky top-0 z-10 shadow-xs">
            <tr>
              <th
                className="py-3.5 px-6 font-medium cursor-pointer hover:bg-[#0b3e5b] transition-colors"
                onClick={() => onSort("name")}
              >
                Name{" "}
                {sortConfig.key === "name" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th
                className="py-3.5 px-6 font-medium cursor-pointer hover:bg-[#0b3e5b] transition-colors"
                onClick={() => onSort("customerType")}
              >
                Customer Type{" "}
                {sortConfig.key === "customerType" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th className="py-3.5 px-6 font-medium">Contact No.</th>
              <th
                className="py-3.5 px-6 font-medium text-center cursor-pointer hover:bg-[#0b3e5b] transition-colors"
                onClick={() => onSort("createdAt")}
              >
                Date Created{" "}
                {sortConfig.key === "createdAt" ? (
                  sortConfig.direction === "asc" ? "▲" : "▼"
                ) : ""}
              </th>
              <th className="py-3.5 px-6 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {customers.length > 0 ? (
              customers.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;

                return (
                  <tr
                    key={customer.id}
                    onClick={() => onSelectCustomer(customer)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#E2EDF3] text-[#0A4B6E] font-medium"
                        : "hover:bg-gray-50/80 bg-white"
                    }`}
                  >
                    <td className="py-4 px-6 text-gray-800 font-medium">
                      {customer.name}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="roles">{customer.customerType}</Badge>
                    </td>
                    <td className="py-4 px-6 italic text-[#6D8AA2]">
                      {customer.contactNumber}
                    </td>
                    <td className="py-4 px-6 text-center italic text-[#6D8AA2] text-xs">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge
                        variant={customer.isActive ? "success" : "deactivated"}
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
