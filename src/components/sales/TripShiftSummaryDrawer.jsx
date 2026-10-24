// src/components/sales/TripShiftSummaryDrawer.jsx
import { useEffect, useState } from "react";
import {
  X,
  Truck,
  User,
  MapPin,
  Banknote,
  CreditCard,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { salesApi } from "../../api/sales.js";
import { formatPhilippineDateTime, formatPhilippineDate } from "../../utils/date.js";
import DocumentViewerModal from "../ui/DocumentViewerModal";

export default function TripShiftSummaryDrawer({
  trip,
  onClose,
  isClosing = false,
}) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProofKey, setSelectedProofKey] = useState(null);

  useEffect(() => {
    if (!trip?.id) return;
    let isMounted = true;
    setIsLoading(true);

    salesApi
      .getTripShiftSummary(trip.id)
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch((err) => {
        console.error("Failed to load shift summary:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [trip?.id]);

  if (!trip) return null;

  const revenue = summary?.revenue || {};
  const empties = summary?.empties || {};
  const gcashPayments = revenue.gcash?.payments || [];

  return (
    <>
      <div
        className={`w-full lg:w-[440px] xl:w-[480px] shrink-0 h-full flex flex-col bg-white border-l border-[#BCE1F1]/60 shadow-xl z-20 ${
          isClosing ? "animate-slide-fade-out" : "animate-slide-fade-in"
        }`}
      >
        {/* Top Header */}
        <div className="shrink-0 p-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FBFC]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D8AA2]">
              Shift Closeout Remittance
            </span>
            <h2 className="text-base font-bold text-[#0A4B6E] flex items-center gap-2">
              <span>{trip.trip_number || trip.tripNumber}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  (trip.status || "").toUpperCase() === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : (trip.status || "").toUpperCase() === "IN_PROGRESS"
                    ? "bg-sky-50 text-sky-800 border border-sky-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {trip.status}
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4 text-xs">
          {/* 1. Trip & Crew Context */}
          <div className="bg-[#E8F3F8]/50 p-3 rounded-xl border border-[#BCE1F1]/60 flex flex-col gap-2">
            <div className="flex items-center justify-between font-semibold text-[#0A4B6E]">
              <span className="flex items-center gap-1.5">
                <Truck size={14} className="text-[#0F7AB2]" />
                <span>
                  {trip.truck_plate_number || trip.truckPlate} ({trip.truck_model || trip.truckModel})
                </span>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#6D8AA2]">
                <MapPin size={12} />
                <span>{trip.zone_name || trip.zoneName || "Assigned Zone"}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#BCE1F1]/40 text-[11px]">
              <div>
                <span className="text-[#6D8AA2] block">Driver</span>
                <span className="font-semibold text-slate-800">
                  {trip.driver_name || trip.driverName || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-[#6D8AA2] block">Sales Representative</span>
                <span className="font-semibold text-slate-800">
                  {trip.sales_name || trip.salesName || "Unassigned"}
                </span>
              </div>
            </div>

            {(trip.departure_time || trip.departureTime) && (
              <div className="text-[10px] text-[#6D8AA2] pt-1">
                Departed: {formatPhilippineDateTime(trip.departure_time || trip.departureTime)}
                {(trip.return_time || trip.returnTime) &&
                  ` • Returned: ${formatPhilippineDateTime(trip.return_time || trip.returnTime)}`}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">Loading shift closeout...</div>
          ) : !summary ? (
            <div className="py-12 text-center text-slate-400">No shift summary available</div>
          ) : (
            <>
              {/* 2. Financial Collections Card */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A4B6E]">Total Collections</span>
                  <span className="text-base font-bold text-emerald-700">
                    ₱{Number(revenue.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Cash Box */}
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 flex flex-col">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                      <Banknote size={13} />
                      <span>Cash Remittance</span>
                    </span>
                    <span className="text-sm font-bold text-emerald-900 mt-1">
                      ₱{Number(revenue.cash?.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-700 mt-0.5">
                      {revenue.cash?.transactionCount || 0} Cash payments
                    </span>
                  </div>

                  {/* GCash Box */}
                  <div className="p-2.5 rounded-lg bg-sky-50/50 border border-sky-200/80 flex flex-col">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-sky-800">
                      <CreditCard size={13} />
                      <span>GCash Transfers</span>
                    </span>
                    <span className="text-sm font-bold text-sky-900 mt-1">
                      ₱{Number(revenue.gcash?.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-sky-700 mt-0.5">
                      {revenue.gcash?.transactionCount || 0} GCash transfers
                      {revenue.gcash?.unverifiedCount > 0 && ` (${revenue.gcash.unverifiedCount} unverified)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. GCash Individual Transactions (if any) */}
              {gcashPayments.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2">
                  <span className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
                    <CreditCard size={14} className="text-[#0F7AB2]" />
                    <span>GCash Payment Declarations ({gcashPayments.length})</span>
                  </span>

                  <div className="flex flex-col gap-2 divide-y divide-slate-100">
                    {gcashPayments.map((p, idx) => (
                      <div key={idx} className="pt-2 flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{p.customerName || "Customer"}</span>
                          <span className="font-bold text-[#0A4B6E]">
                            ₱{Number(p.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Ref: {p.paymentReferenceNumber || "N/A"}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                              p.paymentStatus === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {p.paymentStatus || "PAID_UNVERIFIED"}
                          </span>
                        </div>
                        {(p.paymentProofUrl || p.payment_proof_url || p.paymentProofKey || p.payment_proof_key) && (
                          <button
                            type="button"
                            onClick={() => setSelectedProofKey(p.paymentProofUrl || p.payment_proof_url || p.paymentProofKey || p.payment_proof_key)}
                            className="text-[10px] text-[#0F7AB2] hover:underline flex items-center gap-1 font-semibold mt-0.5 cursor-pointer"
                          >
                            <ExternalLink size={10} />
                            <span>View GCash Proof Screenshot</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Empties Shells & Debt Reconciled */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A4B6E] flex items-center gap-1.5">
                    <Layers size={14} className="text-[#0F7AB2]" />
                    <span>Empties Returned vs Full Sold</span>
                  </span>
                  <span className="font-bold text-slate-700">
                    {empties.totalEmptiesCount || 0} Returned
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="py-1 px-2">SKU</th>
                        <th className="py-1 px-2 text-right">Sold</th>
                        <th className="py-1 px-2 text-right">Returned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(empties.breakdown || []).map((item) => (
                        <tr key={item.productId}>
                          <td className="py-1.5 px-2 font-medium text-slate-800">{item.productName}</td>
                          <td className="py-1.5 px-2 text-right font-semibold text-slate-700">{item.quantitySold}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-700">{item.emptiesReturned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Net Debt Note */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Net Customer Debt Created:</span>
                  <span className="font-bold text-[#0A4B6E]">
                    {summary.netCustomerDebtCreated > 0
                      ? `+${summary.netCustomerDebtCreated}`
                      : summary.netCustomerDebtCreated}{" "}
                    Canisters
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pinned Bottom Close Button */}
        <div className="shrink-0 p-4 border-t border-slate-200 bg-[#F8FBFC]">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider py-2.5 rounded-full shadow-2xs transition-all cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </div>

      {/* Document Proof Viewer Modal */}
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
