// src/components/sales/TripDeliveriesTab.jsx
import { useState, useMemo } from "react";
import {
  Truck,
  Search,
  MapPin,
  Calendar,
  FileText,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatPhilippineDateTime, formatPhilippineDate } from "../../utils/date.js";
import Pagination from "../ui/Pagination";
import TripShiftSummaryDrawer from "./TripShiftSummaryDrawer";

export default function TripDeliveriesTab({
  trips = [],
  isLoading = false,
  searchTerm = "",
  onSearchChange,
  statusFilter = "",
  onStatusChange,
}) {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isClosingDrawer, setIsClosingDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 15;

  // Filter trips locally
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchSearch =
        !searchTerm ||
        (t.trip_number || t.tripNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.truck_plate_number || t.truckPlate || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.zone_name || t.zoneName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.driver_name || t.driverName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.sales_name || t.salesName || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        !statusFilter ||
        (t.status || "").toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchStatus;
    });
  }, [trips, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredTrips.length / limit) || 1;
  const paginatedTrips = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredTrips.slice(start, start + limit);
  }, [filteredTrips, page, limit]);

  const handleOpenDrawer = (trip) => {
    setSelectedTrip(trip);
    setIsClosingDrawer(false);
  };

  const handleCloseDrawer = () => {
    setIsClosingDrawer(true);
    setTimeout(() => {
      setSelectedTrip(null);
      setIsClosingDrawer(false);
    }, 250);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      {/* Controls Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by trip #, plate, zone, driver or sales agent..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-full focus:outline-none focus:border-[#0A4B6E] focus:ring-1 focus:ring-[#0A4B6E] transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#6D8AA2] flex items-center gap-1">
            <Filter size={12} />
            <span>Status:</span>
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              onStatusChange(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-300 rounded-full px-3 py-1 font-semibold text-[#0A4B6E] focus:outline-none focus:border-[#0A4B6E] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Content Area: Table on Left + Optional Slide Drawer on Right */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden border border-[#0A4B6E]/15 rounded-2xl bg-white shadow-xs">
        {/* Master Trips Table Container */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#E8F3F8]/70 text-[#0A4B6E] font-bold sticky top-0 z-10 border-b border-[#0A4B6E]/15 backdrop-blur-xs select-none">
                <tr>
                  <th className="py-3 px-3.5 whitespace-nowrap">Trip Number</th>
                  <th className="py-3 px-3 whitespace-nowrap">Vehicle & Crew</th>
                  <th className="py-3 px-3 whitespace-nowrap">Zone</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Orders</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Gross Sales</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Units / Returns</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading delivery performance records...
                    </td>
                  </tr>
                ) : paginatedTrips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No delivery trips found matching criteria
                    </td>
                  </tr>
                ) : (
                  paginatedTrips.map((trip) => {
                    const isSelected = selectedTrip?.id === trip.id;
                    const status = (trip.status || "").toUpperCase();
                    const totalRevenue = Number(trip.total_sales_amount || trip.totalRevenue || 0);

                    return (
                      <tr
                        key={trip.id}
                        onClick={() => handleOpenDrawer(trip)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#E2EDF3] font-semibold"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* Trip Number & Date */}
                        <td className="py-2.5 px-3.5">
                          <div className="font-bold text-[#0A4B6E]">
                            {trip.trip_number || trip.tripNumber}
                          </div>
                          <div className="text-[10px] text-[#6D8AA2] flex items-center gap-1 mt-0.5">
                            <Calendar size={10} />
                            <span>
                              {formatPhilippineDate(trip.departure_time || trip.departureTime)}
                            </span>
                          </div>
                        </td>

                        {/* Vehicle & Crew */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Truck size={12} className="text-[#0F7AB2]" />
                            <span>{trip.truck_plate_number || trip.truckPlate}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Driver: {trip.driver_name || trip.driverName || "N/A"} • Rep: {trip.sales_name || trip.salesName || "N/A"}
                          </div>
                        </td>

                        {/* Zone */}
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F3F8] text-[#0A4B6E] text-[10px] font-bold border border-[#BCE1F1]/60">
                            <MapPin size={10} />
                            <span>{trip.zone_name || trip.zoneName || "Zone"}</span>
                          </span>
                        </td>

                        {/* Completed Orders */}
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                          {trip.completed_transactions ?? trip.total_transactions ?? 0}
                        </td>

                        {/* Total Revenue */}
                        <td className="py-2.5 px-3 text-right font-bold text-[#0A4B6E]">
                          ₱{totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Units / Empties */}
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-bold text-slate-800">
                            {trip.total_units_sold ?? 0}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {trip.total_empties_returned ?? 0} returned
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : status === "IN_PROGRESS"
                                ? "bg-sky-50 text-sky-800 border border-sky-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {trip.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(trip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F3F8] hover:bg-[#d5e8f3] text-[#0A4B6E] text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <span>Summary</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredTrips.length}
            limit={limit}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </div>

        {/* Slide-in Detail Drawer */}
        {selectedTrip && (
          <TripShiftSummaryDrawer
            trip={selectedTrip}
            onClose={handleCloseDrawer}
            isClosing={isClosingDrawer}
          />
        )}
      </div>
    </div>
  );
}
