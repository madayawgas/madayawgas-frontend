// src/components/sales/TripShiftSummaryDrawer.jsx
import { useEffect, useState } from "react";
import {
  Truck,
  MapPin,
  Banknote,
  CreditCard,
  Layers,
  ExternalLink,
} from "lucide-react";
import { salesApi } from "../../api/sales.js";
import { formatPhilippineDateTime } from "../../utils/date.js";
import SideDrawer from "../ui/SideDrawer";
import Badge from "../ui/Badge";
import InfoTooltip from "../ui/InfoTooltip";
import DocumentViewerModal from "../ui/DocumentViewerModal";

const TRIP_STATUS_META = {
  COMPLETED: { label: "Completed", variant: "success" },
  IN_PROGRESS: { label: "In Progress", variant: "info" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

const PAYMENT_STATUS_META = {
  VERIFIED: { label: "Verified", variant: "success" },
  PAID_UNVERIFIED: { label: "Pending Review", variant: "warning" },
};

export default function TripShiftSummaryDrawer({
  trip,
  isOpen = false,
  onClose,
}) {
  const [summaryState, setSummaryState] = useState({ id: null, data: null });
  const [loadedId, setLoadedId] = useState(null);
  const [selectedProofKey, setSelectedProofKey] = useState(null);

  useEffect(() => {
    if (!isOpen || !trip?.id) return;
    let isMounted = true;
    const targetId = trip.id;

    salesApi
      .getTripShiftSummary(targetId)
      .then((data) => {
        if (isMounted) setSummaryState({ id: targetId, data });
      })
      .catch((err) => {
        console.error("Failed to load shift summary:", err);
      })
      .finally(() => {
        if (isMounted) setLoadedId(targetId);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, trip?.id]);

  const summary = summaryState.id === trip?.id ? summaryState.data : null;
  const isLoading = Boolean(isOpen && trip?.id && loadedId !== trip.id);

  const activeTrip = trip || {};
  const statusKey = (activeTrip.status || "").toUpperCase();
  const statusMeta = TRIP_STATUS_META[statusKey] || {
    label: statusKey ? statusKey.replace(/_/g, " ") : "Unknown",
    variant: "neutral",
  };

  const revenue = summary?.revenue || {};
  const empties = summary?.empties || {};
  const gcashPayments = revenue.gcash?.payments || [];
  const netDebt = summary?.netCustomerDebtCreated || 0;

  const footer = (
    <button
      type="button"
      onClick={onClose}
      className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider py-2.5 rounded-full shadow-2xs transition-all cursor-pointer"
    >
      Close Summary
    </button>
  );

  return (
    <>
      <SideDrawer
        isOpen={isOpen && Boolean(trip)}
        onClose={onClose}
        title={activeTrip.trip_number || activeTrip.tripNumber || "Trip Summary"}
        subtitle="Shift Closeout Remittance"
        icon={Truck}
        badge={<Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>}
        footer={footer}
        width="max-w-md sm:max-w-lg"
      >
        <div className="flex flex-col gap-4 text-xs">
          {/* 1. Trip & Crew Context */}
          <div className="bg-[#E8F3F8]/50 p-3.5 rounded-xl border border-[#BCE1F1]/60 flex flex-col gap-2">
            <div className="flex items-center justify-between font-semibold text-[#0A4B6E]">
              <span className="flex items-center gap-1.5">
                <Truck size={14} className="text-[#0F7AB2]" />
                <span>
                  {activeTrip.truck_plate_number || activeTrip.truckPlate} (
                  {activeTrip.truck_model || activeTrip.truckModel})
                </span>
              </span>
              <span className="flex items-center gap-1 text-[#6D8AA2]">
                <MapPin size={12} />
                <span>
                  {activeTrip.zone_name || activeTrip.zoneName || "Assigned Zone"}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#BCE1F1]/40">
              <div>
                <span className="text-[#6D8AA2] block">Driver</span>
                <span className="font-semibold text-slate-800">
                  {activeTrip.driver_name || activeTrip.driverName || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-[#6D8AA2] block">Sales Rep</span>
                <span className="font-semibold text-slate-800">
                  {activeTrip.sales_name || activeTrip.salesName || "Unassigned"}
                </span>
              </div>
            </div>

            {(activeTrip.departure_time || activeTrip.departureTime) && (
              <div className="text-[#6D8AA2] pt-1 border-t border-[#BCE1F1]/30">
                Departed:{" "}
                {formatPhilippineDateTime(
                  activeTrip.departure_time || activeTrip.departureTime
                )}
                {(activeTrip.return_time || activeTrip.returnTime) &&
                  ` • Returned: ${formatPhilippineDateTime(
                    activeTrip.return_time || activeTrip.returnTime
                  )}`}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500">
              Loading shift closeout...
            </div>
          ) : !summary ? (
            <div className="py-12 text-center text-slate-500">
              No shift summary available
            </div>
          ) : (
            <>
              {/* 2. Financial Collections */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A4B6E]">Total Collections</span>
                  <span className="text-base font-bold text-[#0A4B6E] tabular-nums">
                    ₱
                    {Number(revenue.totalRevenue || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/80 flex flex-col">
                    <span className="flex items-center gap-1 font-bold text-emerald-800">
                      <Banknote size={14} />
                      <span>Cash</span>
                    </span>
                    <span className="text-sm font-bold text-emerald-900 mt-1 tabular-nums">
                      ₱
                      {Number(revenue.cash?.totalAmount || 0).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </span>
                    <span className="text-emerald-700 mt-0.5">
                      {revenue.cash?.transactionCount || 0} payments
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-sky-50/50 border border-sky-200/80 flex flex-col">
                    <span className="flex items-center gap-1 font-bold text-sky-800">
                      <CreditCard size={14} />
                      <span>GCash</span>
                    </span>
                    <span className="text-sm font-bold text-sky-900 mt-1 tabular-nums">
                      ₱
                      {Number(revenue.gcash?.totalAmount || 0).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </span>
                    <span className="text-sky-700 mt-0.5">
                      {revenue.gcash?.transactionCount || 0} transfers
                      {revenue.gcash?.unverifiedCount > 0 &&
                        ` (${revenue.gcash.unverifiedCount} pending)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. GCash Declarations */}
              {gcashPayments.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2">
                  <span className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
                    <CreditCard size={14} className="text-[#0F7AB2]" />
                    <span>GCash Declarations ({gcashPayments.length})</span>
                  </span>

                  <div className="flex flex-col gap-2 divide-y divide-slate-100">
                    {gcashPayments.map((p, idx) => {
                      const pStatus = (p.paymentStatus || "PAID_UNVERIFIED").toUpperCase();
                      const pMeta = PAYMENT_STATUS_META[pStatus] || {
                        label: pStatus.replace(/_/g, " "),
                        variant: "warning",
                      };
                      const proof =
                        p.paymentProofUrl ||
                        p.payment_proof_url ||
                        p.paymentProofKey ||
                        p.payment_proof_key;

                      return (
                        <div key={idx} className="pt-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">
                              {p.customerName || "Customer"}
                            </span>
                            <span className="font-bold text-[#0A4B6E] tabular-nums">
                              ₱
                              {Number(p.totalAmount || 0).toLocaleString(
                                "en-US",
                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-mono">
                              Ref: {p.paymentReferenceNumber || "N/A"}
                            </span>
                            <Badge variant={pMeta.variant}>{pMeta.label}</Badge>
                          </div>
                          {proof && (
                            <button
                              type="button"
                              onClick={() => setSelectedProofKey(proof)}
                              className="text-xs text-[#0F7AB2] hover:underline flex items-center gap-1 font-semibold mt-0.5 cursor-pointer self-start"
                            >
                              <ExternalLink size={12} />
                              <span>View GCash Proof</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Empties & Canister Debt */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
                    <Layers size={14} className="text-[#0F7AB2]" />
                    <span>Empties vs. Sold</span>
                  </span>
                  <span className="font-bold text-slate-700 tabular-nums">
                    {empties.totalEmptiesCount || 0} Returned
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[#0A4B6E] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-2">Product</th>
                        <th className="py-1.5 px-2 text-right">Sold</th>
                        <th className="py-1.5 px-2 text-right">Returned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(empties.breakdown || []).map((item) => (
                        <tr key={item.productId}>
                          <td className="py-1.5 px-2 font-medium text-slate-800">
                            {item.productName}
                          </td>
                          <td className="py-1.5 px-2 text-right font-semibold text-slate-700 tabular-nums">
                            {item.quantitySold}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-700 tabular-nums">
                            {item.emptiesReturned}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    <span>Net Canister Debt</span>
                    <InfoTooltip
                      align="left"
                      text="Positive (+) means more full units were loaned than empty shells returned during this trip."
                      label="About net canister debt"
                    />
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      netDebt > 0 ? "text-amber-700" : "text-[#0A4B6E]"
                    }`}
                  >
                    {netDebt > 0 ? `+${netDebt}` : netDebt} Canisters
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </SideDrawer>

      {selectedProofKey && (
        <DocumentViewerModal
          isOpen={Boolean(selectedProofKey)}
          onClose={() => setSelectedProofKey(null)}
          item={selectedProofKey}
          storageKey={selectedProofKey}
          title="GCash Transfer Payment Receipt"
        />
      )}
    </>
  );
}
