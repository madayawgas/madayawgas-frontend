// src/components/route-dispatch/TripLifecycleGuide.jsx
import { useState } from "react";
import {
  HelpCircle,
  Truck,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Gauge,
  Sparkles,
} from "lucide-react";

export default function TripLifecycleGuide() {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const stored = localStorage.getItem("app_route_guide_open");
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("app_route_guide_open", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#BCE1F1] shadow-2xs overflow-hidden transition-all duration-200 mb-4">
      {/* Header Bar */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-[#F4F8FA] to-[#E8F3F8] hover:from-[#E8F3F8] hover:to-[#D5E3EC]/50 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#0A4B6E] text-[#FFDF2C] flex items-center justify-center shrink-0 shadow-2xs">
            <HelpCircle size={17} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#0A4B6E] tracking-tight">
                Trip Operations & Lifecycle Guide
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFDF2C] text-[#0A4B6E] shrink-0">
                Quick Primer
              </span>
            </div>
            <p className="text-[11px] text-[#6D8AA2] truncate">
              Understand the 3 operational stages: Departure, Midday Reloads, Return Check-In, and Settlement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#0A4B6E] shrink-0 ml-2">
          <span className="text-xs font-semibold hidden sm:inline">
            {isOpen ? "Hide Guide" : "View Guide"}
          </span>
          <div className="w-7 h-7 rounded-full bg-white/80 border border-[#BCE1F1] flex items-center justify-center">
            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>
      </button>

      {/* Expanded Step-by-Step Explanation */}
      {isOpen && (
        <div className="p-4 sm:p-5 bg-white border-t border-[#BCE1F1]/60">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative">
            {/* Step 1: Out on Route (IN_PROGRESS) */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0A4B6E]/30 transition-all flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    STAGE 1: OUT ON ROUTE
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Step 1 of 3</span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Truck size={15} />
                  </div>
                  <h4 className="font-bold text-xs text-[#0A4B6E]">
                    Truck Deployed to Zone
                  </h4>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
                  The truck leaves Bunawan Yard with assigned LPG stock (Transfer Slip #1). The driver & sales rep deliver cylinders to customers.
                </p>

                {/* What is Midday Reload callout */}
                <div className="bg-[#E8F3F8] rounded-lg p-2.5 border border-[#BCE1F1] text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#0A4B6E] font-bold mb-1">
                    <Layers size={13} className="text-[#0A4B6E]" />
                    <span>What is a "Midday Reload"?</span>
                  </div>
                  <p className="text-[#486581] text-[10.5px] leading-snug">
                    If customer orders exceed truck capacity mid-shift, Bunawan Yard prepares a <strong>Midday Reload (Slip #2)</strong> with extra cylinders so deliveries can continue.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Return Check-In (AWAITING_SYNC) */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-amber-400/50 transition-all flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    STAGE 2: RETURN CHECK-IN
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Step 2 of 3</span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Gauge size={15} />
                  </div>
                  <h4 className="font-bold text-xs text-[#0A4B6E]">
                    Truck Returns to Yard
                  </h4>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
                  The truck arrives back at Bunawan Yard. Staff logs final odometer (triggering the 5,000 km maintenance check) and unloads remaining physical cylinders.
                </p>

                {/* What is Awaiting Sync callout */}
                <div className="bg-amber-50/80 rounded-lg p-2.5 border border-amber-200 text-[11px]">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold mb-1">
                    <RotateCcw size={13} className="text-amber-700" />
                    <span>Why "Pending Reconciliation"?</span>
                  </div>
                  <p className="text-amber-800 text-[10.5px] leading-snug">
                    The truck has completed its physical return, but the trip is <strong>awaiting supervisor audit</strong> to balance sales against unloaded cylinders.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Reconcile & Settle (SETTLED) */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0A4B6E]/30 transition-all flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-[#0A4B6E] border border-[#BCE1F1] font-bold text-[10px]">
                    <CheckCircle2 size={11} className="text-[#0A4B6E]" />
                    STAGE 3: RECONCILIATION
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Step 3 of 3</span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0A4B6E] flex items-center justify-center shrink-0">
                    <Sparkles size={15} />
                  </div>
                  <h4 className="font-bold text-xs text-[#0A4B6E]">
                    Mathematical Stock Audit
                  </h4>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
                  The system verifies the inventory formula:
                  <br />
                  <code className="text-[10px] font-semibold text-[#0A4B6E] bg-white px-1.5 py-0.5 rounded border border-[#D5E3EC] inline-block my-1">
                    (Loaded Full - Sales) = Returned Full
                  </code>
                </p>

                {/* Settlement result callout */}
                <div className="bg-emerald-50/80 rounded-lg p-2.5 border border-emerald-200 text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-1">
                    <CheckCircle2 size={13} className="text-emerald-700" />
                    <span>Zero Discrepancy = Settled</span>
                  </div>
                  <p className="text-emerald-800 text-[10.5px] leading-snug">
                    When sales match returned empty and full stock (zero variance), the trip is signed off and stock is released back into plant inventory.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
