// src/pages/SalesAndDelivery/TripRemittancesPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Truck, MapPin, AlertCircle, Clock } from "lucide-react";
import { salesApi } from "../../api/sales.js";
import { formatPhilippineDateShort } from "../../utils/date.js";
import { useSalesDateRange } from "../../hooks/useSalesDateRange.js";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh.js";
import SalesPageHeader from "../../components/sales/SalesPageHeader";
import TripShiftSummaryDrawer from "../../components/sales/TripShiftSummaryDrawer";
import SearchBar from "../../components/ui/SearchBar";
import FilterDropdown from "../../components/ui/FilterDropdown";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";

const CACHE_KEY_TRIPS = "app_sales_trips_cache";

const TRIP_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TRIP_STATUS_META = {
  COMPLETED: { label: "Completed", variant: "success" },
  IN_PROGRESS: { label: "In Progress", variant: "info" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

export default function TripRemittancesPage() {
  const { dateRangePreset, setDateRangePreset, dateFilter } =
    useSalesDateRange("last30");

  const [trips, setTrips] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_TRIPS);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const fetchTrips = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setIsRefreshing(true);
      setFetchError("");
      try {
        const res = await salesApi.getTripSalesPerformance({
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
        });
        const rawTrips = res?.items || res?.trips || res || [];
        if (Array.isArray(rawTrips)) {
          setTrips(rawTrips);
          try {
            localStorage.setItem(CACHE_KEY_TRIPS, JSON.stringify(rawTrips));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Failed to fetch trip remittances:", err);
        setFetchError(
          err?.message || "Unable to load trip remittances. Showing cached data."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [dateFilter.startDate, dateFilter.endDate]
  );

  useEffect(() => {
    fetchTrips(false);
  }, [fetchTrips]);

  useRealtimeRefresh({
    events: [
      "TRIP_CREATED",
      "TRIP_DISPATCHED",
      "TRIP_COMPLETED",
      "TRIP_CANCELLED",
      "SALES_BATCH_SYNCED",
    ],
    onRefresh: () => fetchTrips(false),
  });

  const inProgressCount = useMemo(
    () =>
      trips.filter((t) => (t.status || "").toUpperCase() === "IN_PROGRESS")
        .length,
    [trips]
  );

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        (t.trip_number || t.tripNumber || "").toLowerCase().includes(q) ||
        (t.truck_plate_number || t.truckPlate || "").toLowerCase().includes(q) ||
        (t.driver_name || t.driverName || "").toLowerCase().includes(q) ||
        (t.sales_name || t.salesName || "").toLowerCase().includes(q);

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

  const headerPills = [
    {
      icon: Truck,
      label: `${trips.length} Delivery Trips`,
      tone: "info",
    },
    ...(inProgressCount > 0
      ? [
          {
            icon: Clock,
            label: `${inProgressCount} In Progress`,
            tone: statusFilter === "IN_PROGRESS" ? "active" : "warning",
            onClick: () => {
              setStatusFilter((prev) =>
                prev === "IN_PROGRESS" ? "" : "IN_PROGRESS"
              );
              setPage(1);
            },
          },
        ]
      : []),
  ];

  return (
    <div className="h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] overflow-hidden flex flex-col">
      <SalesPageHeader
        pills={headerPills}
        dateRangePreset={dateRangePreset}
        onDateRangeChange={(val) => {
          setDateRangePreset(val);
          setPage(1);
        }}
        onRefresh={() => fetchTrips(true)}
        isRefreshing={isRefreshing}
      />

      {fetchError && (
        <div className="shrink-0 mb-3 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#C93B32] flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle size={15} />
            <span>{fetchError}</span>
          </span>
          <button
            type="button"
            onClick={() => fetchTrips(true)}
            className="font-bold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
        <SearchBar
          placeholder="Search trip #, plate #, driver, or rep..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="flex-1 max-w-md"
        />

        <div className="flex items-center gap-2">
          <FilterDropdown
            label="All Statuses"
            options={TRIP_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(opt) => {
              setStatusFilter(opt?.value ?? "");
              setPage(1);
            }}
          />
          {(searchTerm || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setPage(1);
              }}
              className="text-xs font-bold text-[#0F7AB2] hover:underline px-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Standardized Master Table */}
      <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden border border-[#0A4B6E]/30 rounded-2xl bg-white shadow-sm">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead className="bg-[#0D4B6E] text-white text-xs md:text-sm sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Trip #
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Truck & Driver
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Zone
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap">
                  Total Sales
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] text-right whitespace-nowrap">
                  Units Sold
                </th>
                <th className="py-3.5 px-3 md:px-4 font-semibold uppercase tracking-wider text-[11px] text-center whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading delivery trips...
                  </td>
                </tr>
              ) : paginatedTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No delivery trips match your filters
                  </td>
                </tr>
              ) : (
                paginatedTrips.map((trip) => {
                  const isSelected = selectedTrip?.id === trip.id;
                  const statusKey = (trip.status || "").toUpperCase();
                  const statusMeta = TRIP_STATUS_META[statusKey] || {
                    label: statusKey.replace(/_/g, " ") || "Unknown",
                    variant: "neutral",
                  };
                  const totalRevenue = Number(
                    trip.total_sales_amount || trip.totalRevenue || 0
                  );

                  return (
                    <tr
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                      className={`transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-[#E2EDF3] text-[#0A4B6E] font-semibold"
                          : "bg-white hover:bg-[#F4F9FC]"
                      }`}
                    >
                      <td className="py-3.5 px-3 md:px-4 whitespace-nowrap">
                        <div className="font-bold text-[#0A4B6E]">
                          {trip.trip_number || trip.tripNumber}
                        </div>
                        <div className="text-xs text-[#6D8AA2]">
                          {formatPhilippineDateShort(
                            trip.departure_time || trip.departureTime
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 md:px-4">
                        <div className="font-semibold text-slate-800">
                          {trip.truck_plate_number || trip.truckPlate}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">
                          {trip.driver_name || trip.driverName || "Unassigned"}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 md:px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin size={13} className="text-[#6D8AA2]" />
                          <span>
                            {trip.zone_name || trip.zoneName || "Zone"}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 md:px-4 text-right font-bold text-[#0A4B6E] tabular-nums whitespace-nowrap">
                        ₱
                        {totalRevenue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-3.5 px-3 md:px-4 text-right font-bold text-slate-800 tabular-nums whitespace-nowrap">
                        {trip.total_units_sold ?? 0}
                      </td>

                      <td className="py-3.5 px-3 md:px-4 text-center whitespace-nowrap">
                        <Badge variant={statusMeta.variant}>
                          {statusMeta.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredTrips.length}
          limit={limit}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>

      <TripShiftSummaryDrawer
        trip={selectedTrip}
        isOpen={Boolean(selectedTrip)}
        onClose={() => setSelectedTrip(null)}
      />
    </div>
  );
}
