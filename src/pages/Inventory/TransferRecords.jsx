// src/pages/Inventory/TransferRecords.jsx
import { useState, useEffect, useCallback, useId } from "react";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  Layers,
  Calendar,
  User,
  AlertOctagon,
  Download,
} from "lucide-react";
import { inventoryApi } from "../../api/inventory.js";
import { formatPhilippineDateTime } from "../../utils/date.js";
import Pagination from "../../components/ui/Pagination.jsx";
import SideDrawer from "../../components/ui/SideDrawer.jsx";

const TRANSFER_TYPES = [
  { value: "ALL", label: "All Movements" },
  { value: "DISPATCH_LOAD", label: "Dispatch Loads" },
  { value: "RETURN_UNLOAD", label: "Return Unloads" },
  { value: "SUPPLIER_PURCHASE", label: "Supplier Restocks" },
  { value: "DEFECT_ADJUSTMENT", label: "Defect Adjustments" },
];

function getTransferTypeMeta(type) {
  switch (type) {
    case "DISPATCH_LOAD":
      return {
        label: "Dispatch Load",
        icon: ArrowUpRight,
        color: "text-[#0A4B6E] bg-sky-50 border-sky-200",
      };
    case "RETURN_UNLOAD":
      return {
        label: "Return Unload",
        icon: ArrowDownLeft,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    case "SUPPLIER_PURCHASE":
      return {
        label: "Supplier Restock",
        icon: Download,
        color: "text-amber-800 bg-amber-50 border-amber-200",
      };
    case "DEFECT_ADJUSTMENT":
      return {
        label: "Defect Adjustment",
        icon: AlertOctagon,
        color: "text-[#C93B32] bg-rose-50 border-rose-200",
      };
    default:
      return {
        label: type || "Stock Transfer",
        icon: Package,
        color: "text-slate-700 bg-slate-50 border-slate-200",
      };
  }
}

export default function TransferRecords() {
  const searchInputId = useId();
  const [transfers, setTransfers] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [transferType, setTransferType] = useState("ALL");

  // Selected slip for SideDrawer
  const [selectedSlip, setSelectedSlip] = useState(null);

  const fetchTransfers = useCallback(
    async (pageToFetch = 1) => {
      try {
        setIsLoading(true);
        const params = {
          page: pageToFetch,
          limit: 20,
          search: activeSearch || undefined,
          transferType: transferType !== "ALL" ? transferType : undefined,
        };
        const res = await inventoryApi.getTransfers(params);
        setTransfers(res?.transfers || []);
        if (res?.meta) {
          setMeta(res.meta);
        }
      } catch (err) {
        console.error("Failed to fetch transfer records:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [activeSearch, transferType]
  );

  useEffect(() => {
    fetchTransfers(meta.page);
  }, [fetchTransfers, meta.page]);

  // Submit search on Enter or search button click
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handleTypeChange = (typeVal) => {
    setTransferType(typeVal);
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setMeta((prev) => ({ ...prev, page: newPage }));
  };

  // Helper to calculate total items and crates on a transfer slip
  const getSlipTotals = (slip) => {
    const items = slip?.items || [];
    const totalUnits = items.reduce(
      (sum, it) => sum + (Number(it.quantityUnits) || 0),
      0
    );
    const totalCrates = items.reduce(
      (sum, it) => sum + (it.crates !== null && it.crates !== undefined ? Number(it.crates) : 0),
      0
    );
    return { totalUnits, totalCrates };
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Top Controls Header */}
      <header className="shrink-0 bg-white border-b border-[#E2E8F0] px-6 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Movement Type Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TRANSFER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTypeChange(t.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  transferType === t.value
                    ? "bg-[#0A4B6E] text-white border-[#0A4B6E] shadow-2xs"
                    : "bg-white text-[#6D8AA2] border-[#CBD5E1] hover:text-[#0A4B6E] hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search on Enter */}
            <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
              <label htmlFor={searchInputId} className="sr-only">Search slips, trips, or vehicles</label>
              <input
                id={searchInputId}
                type="text"
                placeholder="Search slip, truck, or notes..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-full text-[#0A4B6E] placeholder-[#6D8AA2]/70 focus:outline-hidden focus:border-[#0A4B6E] focus:bg-white transition-all"
              />
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D8AA2]"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setActiveSearch("");
                    setMeta((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={() => fetchTransfers(meta.page)}
              disabled={isLoading}
              title="Refresh transfer records"
              className="p-1.5 text-[#6D8AA2] hover:text-[#0A4B6E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Table Container */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-6">
        <div className="flex-1 min-h-0 bg-white border border-[#0A4B6E]/30 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#0D4B6E] text-white text-xs md:text-sm z-10 shadow-xs select-none">
                <tr>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Slip Number</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Movement Type</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Destination / Source</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Recorded By</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">Date & Time</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-right">Total Units</th>
                  <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
                {isLoading && transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-[#6D8AA2]">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#0A4B6E]" />
                      Loading transfer records...
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-[#6D8AA2]">
                      <FileText size={24} className="mx-auto mb-2 text-[#CBD5E1]" />
                      <p className="font-semibold text-[#0A4B6E]">No Transfer Records Found</p>
                      <p className="text-[11px] mt-0.5">
                        {activeSearch
                          ? "No movements matched your search query."
                          : "No stock movements recorded yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  transfers.map((slip) => {
                    const typeMeta = getTransferTypeMeta(slip.transferType);
                    const TypeIcon = typeMeta.icon;
                    const { totalUnits, totalCrates } = getSlipTotals(slip);
                    const recordedName =
                      slip.recordedBy?.firstName && slip.recordedBy?.lastName
                        ? `${slip.recordedBy.firstName} ${slip.recordedBy.lastName}`
                        : slip.recordedBy?.username || "System";

                    const vehicleSource = slip.trip?.plateNumber
                      ? `${slip.trip.plateNumber} · ${slip.trip.tripNumber || "Trip"}`
                      : slip.supplierInvoiceNumber
                      ? `Invoice: ${slip.supplierInvoiceNumber}`
                      : "Bunawan Yard";

                    return (
                      <tr
                        key={slip.id}
                        className="hover:bg-[#F4F9FC] transition-colors cursor-pointer"
                        onClick={() => setSelectedSlip(slip)}
                      >
                        {/* Slip Number */}
                        <td className="py-3 px-4 font-bold text-[#0A4B6E]">
                          {slip.slipNumber || slip.id}
                        </td>

                        {/* Movement Type */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${typeMeta.color}`}
                          >
                            <TypeIcon size={12} />
                            <span>{typeMeta.label}</span>
                          </span>
                        </td>

                        {/* Destination / Source */}
                        <td className="py-3 px-4 text-[#0A4B6E] font-medium">
                          {vehicleSource}
                        </td>

                        {/* Recorded By */}
                        <td className="py-3 px-4 text-[#6D8AA2]">
                          {recordedName}
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-4 text-[#6D8AA2]">
                          {formatPhilippineDateTime(slip.recordedAt)}
                        </td>

                        {/* Total Units */}
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-[#0A4B6E]">
                            {totalUnits.toLocaleString()}
                          </span>
                          {totalCrates > 0 && (
                            <span className="text-[11px] text-[#6D8AA2] block">
                              {totalCrates} crates
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedSlip(slip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-md transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination */}
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.totalItems}
            limit={meta.limit}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* SideDrawer for Slip Inspection */}
      <SideDrawer
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip?.slipNumber || "Transfer Slip Details"}
        subtitle={`Recorded ${
          selectedSlip?.recordedAt
            ? formatPhilippineDateTime(selectedSlip.recordedAt)
            : ""
        }`}
        icon={FileText}
        footer={
          <div className="flex justify-end w-full">
            <button
              type="button"
              onClick={() => setSelectedSlip(null)}
              className="px-5 py-2 text-xs font-bold text-[#0A4B6E] bg-[#FFDF2C] hover:bg-[#ebd024] rounded-lg cursor-pointer transition-colors"
            >
              Close Slip
            </button>
          </div>
        }
      >
        {selectedSlip && (
          <div className="p-6 space-y-6 text-xs">
            {/* Overview Grid */}
            <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <div>
                <span className="text-[#6D8AA2] text-[11px] block">Movement Type</span>
                <span className="font-bold text-[#0A4B6E] text-xs mt-0.5 block">
                  {getTransferTypeMeta(selectedSlip.transferType).label}
                </span>
              </div>

              <div>
                <span className="text-[#6D8AA2] text-[11px] block">Recorded By</span>
                <span className="font-bold text-[#0A4B6E] text-xs mt-0.5 block">
                  {selectedSlip.recordedBy?.firstName && selectedSlip.recordedBy?.lastName
                    ? `${selectedSlip.recordedBy.firstName} ${selectedSlip.recordedBy.lastName}`
                    : selectedSlip.recordedBy?.username || "Plant Supervisor"}
                </span>
              </div>

              {selectedSlip.trip?.plateNumber && (
                <div>
                  <span className="text-[#6D8AA2] text-[11px] block">Vehicle Plate</span>
                  <span className="font-bold text-[#0A4B6E] text-xs mt-0.5 block">
                    {selectedSlip.trip.plateNumber}
                  </span>
                </div>
              )}

              {selectedSlip.trip?.tripNumber && (
                <div>
                  <span className="text-[#6D8AA2] text-[11px] block">Trip Code</span>
                  <span className="font-bold text-[#0A4B6E] text-xs mt-0.5 block">
                    {selectedSlip.trip.tripNumber}
                  </span>
                </div>
              )}

              {selectedSlip.supplierInvoiceNumber && (
                <div className="col-span-2">
                  <span className="text-[#6D8AA2] text-[11px] block">Supplier Invoice</span>
                  <span className="font-bold text-[#0A4B6E] text-xs mt-0.5 block">
                    {selectedSlip.supplierInvoiceNumber}
                  </span>
                </div>
              )}

              {selectedSlip.remarks && (
                <div className="col-span-2 border-t border-[#E2E8F0] pt-2 mt-1">
                  <span className="text-[#6D8AA2] text-[11px] block">Remarks / Notes</span>
                  <span className="text-[#0A4B6E] text-xs mt-0.5 block">
                    {selectedSlip.remarks}
                  </span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xs text-[#0A4B6E] uppercase tracking-wide">
                  Manifest Line Items
                </h3>
                <span className="text-[11px] text-[#6D8AA2]">
                  {selectedSlip.items?.length || 0} product lines
                </span>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#6D8AA2]">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Condition</th>
                      <th className="py-2.5 px-3 text-right">Units</th>
                      <th className="py-2.5 px-3 text-right">Crates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[#0A4B6E]">
                    {(selectedSlip.items || []).map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2.5 px-3 font-semibold">
                          {it.productName || "Product Item"}
                          <span className="text-[10px] text-[#6D8AA2] font-normal block">
                            {it.containerType} · {it.netWeightKg} kg
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] font-medium text-slate-700">
                            {it.condition === "FILLED"
                              ? "Filled Good"
                              : it.condition === "EMPTY_GOOD"
                              ? "Empty Good"
                              : it.condition === "DEFECTIVE"
                              ? "Defective"
                              : it.condition}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#0A4B6E]">
                          {Number(it.quantityUnits || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#6D8AA2]">
                          {it.crates !== null && it.crates !== undefined ? it.crates : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
}
