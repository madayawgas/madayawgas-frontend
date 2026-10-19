import { useState, useEffect, useCallback, useMemo } from "react";
import { ShieldAlert, AlertTriangle, FileWarning } from "lucide-react";
import ApprehensionsControls from "./ApprehensionsControls.jsx";
import ApprehensionsTable from "./ApprehensionsTable.jsx";
import ApprehensionDetailModal from "./ApprehensionDetailModal.jsx";
import ToastNotification from "../../ui/ToastNotifications.jsx";
import { apprehensionsApi } from "../../../api/apprehensions.js";
import { useRealtimeRefresh } from "../../../hooks/useRealtimeRefresh.js";

function formatCurrency(val) {
  const num = Number(val) || 0;
  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const APPREHENSIONS_CACHE_KEY = "app_apprehensions_cache";

export default function ApprehensionsTab({
  canManage = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [agencyFilter, setAgencyFilter] = useState("ALL");
  const [selectedApprehension, setSelectedApprehension] = useState(null);
  const [toast, setToast] = useState(null);

  // Cache Bootstrap
  const [apprehensions, setApprehensions] = useState(() => {
    try {
      const cached = localStorage.getItem(APPREHENSIONS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(apprehensions.length === 0);

  // Fetch apprehensions list
  const fetchApprehensions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (agencyFilter !== "ALL") params.agency = agencyFilter;

      const res = await apprehensionsApi.getApprehensions(params);
      const list = res?.apprehensions || [];

      setApprehensions(list);
      try {
        localStorage.setItem(APPREHENSIONS_CACHE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error("Failed to write apprehensions cache:", e);
      }
    } catch (err) {
      console.error("Failed to fetch apprehensions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, agencyFilter]);

  useEffect(() => {
    fetchApprehensions();
  }, [fetchApprehensions]);

  // Real-time Socket.IO Sync
  useRealtimeRefresh({
    events: ["APPREHENSION_LOGGED", "APPREHENSION_STATUS_UPDATED"],
    onRefresh: fetchApprehensions,
    cacheKeysToInvalidate: [APPREHENSIONS_CACHE_KEY],
  });

  // Client-side search filtering
  const filteredApprehensions = useMemo(() => {
    if (!searchQuery.trim()) return apprehensions;

    const query = searchQuery.toLowerCase().trim();
    return apprehensions.filter((item) => {
      const ticket = (item.citationTicketNo || "").toLowerCase();
      const plate = (item.vehicle?.plateNumber || "").toLowerCase();
      const driver = (item.driver?.fullName || item.driver?.username || "").toLowerCase();
      const agency = (item.apprehendingAgency || "").toLowerCase();
      const violation = (item.violationType || "").toLowerCase();
      const location = (item.location || "").toLowerCase();

      return (
        ticket.includes(query) ||
        plate.includes(query) ||
        driver.includes(query) ||
        agency.includes(query) ||
        violation.includes(query) ||
        location.includes(query)
      );
    });
  }, [apprehensions, searchQuery]);

  // Operational metrics
  const metrics = useMemo(() => {
    let recorded = 0;
    let settled = 0;
    let totalFines = 0;

    apprehensions.forEach((a) => {
      if (a.status === "RECORDED") recorded++;
      if (a.status === "SETTLED") settled++;
      totalFines += Number(a.penaltyAmount || 0);
    });

    return {
      total: apprehensions.length,
      recorded,
      settled,
      totalFines,
    };
  }, [apprehensions]);

  // Status transition handler
  const handleUpdateStatus = async (id, payload) => {
    const updated = await apprehensionsApi.updateStatus(id, payload);
    setApprehensions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );

    if (selectedApprehension && selectedApprehension.id === id) {
      setSelectedApprehension((prev) => ({ ...prev, ...updated }));
    }

    setToast({
      type: "success",
      message: `Apprehension #${updated.citationTicketNo || id} marked as ${updated.status}.`,
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden min-w-0 space-y-4 pb-2">
      {/* 1. TOP CONTROLS & STATUS FILTERS */}
      <div className="shrink-0">
        <ApprehensionsControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          agencyFilter={agencyFilter}
          onAgencyChange={setAgencyFilter}
          onRefresh={fetchApprehensions}
          isLoading={isLoading}
        />
      </div>

      {/* 2. STAT CARDS SUMMARY (Branded Palette matching RecurringIssuesAnalytics) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        {/* Card 1: Total Citations */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#9BCBE3] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
              Total Citations
            </span>
            <p className="text-2xl md:text-[26px] font-bold text-[#1B4B75] mt-0.5">
              {metrics.total}
            </p>
            <p className="text-xs text-[#588094] font-medium mt-0.5">
              Recorded road traffic citations
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
            <FileWarning size={24} className="text-[#FFDF2C]" />
          </div>
        </div>

        {/* Card 2: Open / Recorded Violations */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#9BCBE3] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
              Open Violations
            </span>
            <p className="text-2xl md:text-[26px] font-bold text-[#1B4B75] mt-0.5">
              {metrics.recorded}
            </p>
            <p className="text-xs text-[#588094] font-medium mt-0.5">
              Pending supervisor settlement
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
            <AlertTriangle size={24} className="text-[#FFDF2C]" />
          </div>
        </div>

        {/* Card 3: Total Penalties */}
        <div className="bg-[#E8F3F8] rounded-2xl p-4 md:p-5 border border-[#9BCBE3] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[11px] font-bold tracking-wider text-[#6D8AA2] uppercase">
              Total Penalties
            </span>
            <p className="text-2xl md:text-[26px] font-bold text-[#1B4B75] mt-0.5 truncate">
              {formatCurrency(metrics.totalFines)}
            </p>
            <p className="text-xs text-[#588094] font-medium mt-0.5">
              Aggregated fine liability
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0A4B6E] flex items-center justify-center text-white shrink-0 shadow-xs">
            <ShieldAlert size={24} className="text-[#FFDF2C]" />
          </div>
        </div>
      </div>

      {/* 3. MASTER APPREHENSIONS TABLE */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <ApprehensionsTable
          apprehensions={filteredApprehensions}
          isLoading={isLoading}
          onSelectApprehension={(item) => setSelectedApprehension(item)}
        />
      </div>

      {/* 3. DETAIL MODAL & MEDIA VIEWER */}
      {selectedApprehension && (
        <ApprehensionDetailModal
          isOpen={Boolean(selectedApprehension)}
          onClose={() => setSelectedApprehension(null)}
          apprehension={selectedApprehension}
          canManage={canManage}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
