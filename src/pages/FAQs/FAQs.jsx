// src/pages/FAQs/FAQs.jsx
import { useState, useMemo } from "react";
import {
  HelpCircle,
  Search,
  Truck,
  Wrench,
  Package,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Layers,
  Gauge,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from "lucide-react";

const FAQ_DATA = [
  // 1. ROUTE DISPATCH & TRIPS
  {
    id: "trip-lifecycle-stages",
    category: "dispatch",
    categoryLabel: "Route Dispatch & Trips",
    icon: Truck,
    question: "What are the 3 operational stages of a delivery trip?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>Every delivery run goes through three sequential stages:</p>
        <ol className="list-decimal list-inside space-y-1.5 pl-1">
          <li>
            <strong>Stage 1: Out on Route (In Progress)</strong> — The truck leaves Bunawan Yard with assigned LPG stock (Transfer Slip #1). The driver and sales partner perform deliveries in their designated zone.
          </li>
          <li>
            <strong>Stage 2: Return Check-In (Pending Reconciliation)</strong> — The truck physically arrives back at the yard. Staff records the ending odometer reading and unloads physical inventory (unsold full cylinders, empty cylinders returned by customers, and defective units).
          </li>
          <li>
            <strong>Stage 3: Reconcile & Settle (Settled)</strong> — A supervisor or cashier audits the numbers by matching physical returned cylinders against mobile sales receipts. When discrepancy is zero, the trip is finalized and stock is released back into plant inventory.
          </li>
        </ol>
      </div>
    ),
    tags: ["Trips", "Stages", "Workflow", "Lifecycle"],
  },
  {
    id: "what-is-midday-reload",
    category: "dispatch",
    categoryLabel: "Route Dispatch & Trips",
    icon: Layers,
    question: "What is a 'Midday Reload'? Why and when is it used?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          A <strong>Midday Reload</strong> is an additional transfer slip (Slip #2, #3, etc.) recorded while a truck is actively out on route.
        </p>
        <p>
          If customer demand in a zone is high and the truck runs low on cylinders before finishing its route, Bunawan Yard prepares a reload transfer slip. This allows the crew to load additional stock and continue deliveries without needing to prematurely cancel or settle the active trip.
        </p>
        <div className="bg-[#E8F3F8] p-2.5 rounded-xl border border-[#BCE1F1] text-[11px] text-[#0A4B6E]">
          <strong>System Formula:</strong> Total Loaded Full = Departure Slip #1 + Midday Reload #2 + Any subsequent reload slips.
        </div>
      </div>
    ),
    tags: ["Midday Reload", "Transfer Slip", "Stock Transfer"],
  },
  {
    id: "what-is-return-check-in",
    category: "dispatch",
    categoryLabel: "Route Dispatch & Trips",
    icon: Gauge,
    question: "What happens during 'Return Check-In'?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          When the delivery truck returns to Bunawan Yard, staff performs <strong>Return Check-In</strong>:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>
            <strong>Ending Odometer Reading:</strong> The current vehicle odometer reading is recorded. It must be strictly greater than the departure odometer (monotonic check). The system calculates total km driven and immediately updates the vehicle's 5,000 km Periodic Maintenance counter.
          </li>
          <li>
            <strong>Physical Inventory Unload:</strong> Staff counts and logs:
            <ul className="list-circle list-inside pl-4 mt-0.5 space-y-0.5 text-slate-600">
              <li>Unsold full cylinders returned to the yard</li>
              <li>Empty good cylinders retrieved from customers</li>
              <li>Damaged or leaking cylinders to be quarantined</li>
            </ul>
          </li>
        </ul>
        <p>
          Once submitted, the trip status moves from <em>Out on Route</em> to <em>Pending Reconciliation</em>.
        </p>
      </div>
    ),
    tags: ["Return Check-In", "Odometer", "Physical Unload"],
  },
  {
    id: "why-pending-reconciliation",
    category: "dispatch",
    categoryLabel: "Route Dispatch & Trips",
    icon: RotateCcw,
    question: "Why was the status called 'Awaiting Sync' and what does 'Pending Reconciliation' mean?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          In technical database terms, the status is <code>AWAITING_SYNC</code>. In human operational terms, it means <strong>Pending Reconciliation</strong>.
        </p>
        <p>
          The truck has physically returned to Bunawan Yard and finished unloading, but the trip is <strong>waiting for supervisor sign-off</strong>. The cashier or auditor must verify that physical returned cylinders match sales receipts before closing the trip.
        </p>
      </div>
    ),
    tags: ["Awaiting Sync", "Pending Reconciliation", "Status"],
  },
  {
    id: "reconciliation-math-formula",
    category: "dispatch",
    categoryLabel: "Route Dispatch & Trips",
    icon: Sparkles,
    question: "How does the Multi-SKU Post-Trip Reconciliation formula work?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          Reconciliation mathematically audits each cylinder and canister SKU using two zero-variance equations:
        </p>
        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-1.5 font-mono text-[11px] text-[#0A4B6E]">
          <div>1. FullDiscrepancy = (Loaded Full - Sold Full) - Returned Full = 0</div>
          <div>2. EmptyDiscrepancy = (Sold Full) - (Returned Empty + Customer Debt) = 0</div>
        </div>
        <p>
          If both discrepancies equal <strong>0</strong>, the trip is settled with zero variance. If any difference occurs, the trip flags a variance for supervisor inquiry.
        </p>
      </div>
    ),
    tags: ["Reconciliation", "Math Formula", "Discrepancy", "Settlement"],
  },

  // 2. FLEET BOARD & MAINTENANCE
  {
    id: "fleet-statuses-explained",
    category: "fleet",
    categoryLabel: "Fleet Board & Maintenance",
    icon: Truck,
    question: "What do the Fleet vehicle statuses (Active, Under Maintenance, Inactive, Retired) mean?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <ul className="space-y-1.5">
          <li>
            <strong className="text-emerald-700">ACTIVE:</strong> The vehicle is operational, mechanically sound, and eligible for route dispatch.
          </li>
          <li>
            <strong className="text-amber-700">UNDER MAINTENANCE:</strong> The vehicle is grounded due to pending maintenance, scheduled 5,000 km PM service, failed safety inspection, or reported breakdown. It cannot be dispatched.
          </li>
          <li>
            <strong className="text-slate-700">INACTIVE:</strong> The vehicle has been soft-deactivated from daily operations (e.g. seasonal standby or temporary de-registration).
          </li>
          <li>
            <strong className="text-rose-700">RETIRED:</strong> The vehicle has been permanently decommissioned or sold.
          </li>
        </ul>
      </div>
    ),
    tags: ["Fleet", "Truck Status", "Under Maintenance", "Active"],
  },
  {
    id: "pm-5000-rule",
    category: "fleet",
    categoryLabel: "Fleet Board & Maintenance",
    icon: Wrench,
    question: "How does the 5,000 km Periodic Maintenance (PM) engine work?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          Every vehicle is governed by a strict 5,000-kilometer preventive maintenance schedule:
        </p>
        <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] font-mono text-[11px] text-[#0A4B6E]">
          Distance Since Last PM = Current Odometer - Last PM Odometer
        </div>
        <p>
          When this distance reaches or exceeds <strong>5,000 km</strong>, the vehicle is automatically flagged with <code>PM Due</code>. Dispatchers receive a clear maintenance warning to route the vehicle to the repair shop for oil change and fluid checks.
        </p>
      </div>
    ),
    tags: ["Periodic Maintenance", "5000 km", "PM Due", "Odometer"],
  },
  {
    id: "safety-inspection-grounding",
    category: "fleet",
    categoryLabel: "Fleet Board & Maintenance",
    icon: AlertTriangle,
    question: "What happens if a vehicle fails a daily safety inspection or incident is reported?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          If a daily pre-trip inspection records critical defects (e.g., brake failure, tire baldness, gas leak hazard) or a driver reports a critical breakdown on route:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>The vehicle is <strong>automatically grounded</strong> and transitioned to <code>UNDER_MAINTENANCE</code>.</li>
          <li>Dispatching is immediately restricted until repaired.</li>
          <li>The soft-bound driver remains assigned to the vehicle so they are not uncoupled during routine servicing.</li>
        </ul>
      </div>
    ),
    tags: ["Safety Inspection", "Breakdown", "Grounding", "Incident"],
  },
  {
    id: "work-order-lifecycle",
    category: "fleet",
    categoryLabel: "Fleet Board & Maintenance",
    icon: Wrench,
    question: "How does the Work Order lifecycle and Admin Cost Approval work?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          Work Orders track vehicle repair shop quotes, official receipts, and parts replacement:
        </p>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          <li><strong>Created:</strong> Workshop issues diagnostic quote.</li>
          <li><strong>Cost Approval:</strong> Quotes exceeding the threshold require Admin review and approval before mechanics can commence work.</li>
          <li><strong>Finalize & Release:</strong> Once repairs are completed and the Official Receipt (OR) is logged, the work order is finalized, restoring the truck status back to <code>ACTIVE</code>.</li>
        </ol>
      </div>
    ),
    tags: ["Work Order", "Cost Approval", "Receipt", "Maintenance"],
  },

  // 3. ITEM CATALOG & BUNAWAN YARD BULK STOCK
  {
    id: "catalog-vs-yard-stock",
    category: "inventory",
    categoryLabel: "Item Catalog & Bunawan Yard",
    icon: Package,
    question: "What is the difference between the Item Catalog and Bunawan Yard Bulk Stock?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          <strong>Item Catalog:</strong> Defines the standardized product profiles (e.g. SKU name, net weight in kg, category, and container type: <code>CYLINDER</code> vs <code>CANISTER</code>).
        </p>
        <p>
          <strong>Bunawan Yard Bulk Stock:</strong> Tracks physical on-hand inventory levels stored at the main LPG plant yard across 3 discrete buckets:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
          <li><strong>Filled Good:</strong> Ready for route truck dispatch.</li>
          <li><strong>Empty Good:</strong> Depleted return cylinders awaiting bulk refill.</li>
          <li><strong>Quarantined Defective:</strong> Damaged valves or dented cylinders awaiting hydrostatic testing or decommissioning.</li>
        </ul>
      </div>
    ),
    tags: ["Inventory", "Catalog", "Bunawan Yard", "Stock Buckets"],
  },
  {
    id: "canister-crates-conversion",
    category: "inventory",
    categoryLabel: "Item Catalog & Bunawan Yard",
    icon: Layers,
    question: "How are butane canisters counted in crates vs individual units?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          In the LPG industry, butane canisters are stored and dispatched in standardized commercial crates:
        </p>
        <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] font-mono text-[11px] text-[#0A4B6E]">
          1 Crate = 24 Individual Canister Units (250g)
        </div>
        <p>
          The system provides dual metrics: displaying both the bulk crate count (e.g. 5 crates) and total discrete units (120 cans) for precise warehouse dispatch.
        </p>
      </div>
    ),
    tags: ["Canister", "Crates", "24 Units", "Butane"],
  },
  {
    id: "suggested-split-calculator",
    category: "inventory",
    categoryLabel: "Item Catalog & Bunawan Yard",
    icon: Sparkles,
    question: "What is the Suggested Refill Split calculator?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          When the Bunawan Yard refill station prepares a bulk bulk gas batch, the <strong>Suggested Refill Split</strong> tool analyzes historical weekly sales demand across zones to recommend the optimal ratio of empty cylinders (11kg, 2.7kg, 50kg) to refill, preventing stockouts on peak delivery days.
        </p>
      </div>
    ),
    tags: ["Suggested Split", "Refill Batch", "Demand Planning"],
  },

  // 4. SALES & CUSTOMER ACCOUNTS
  {
    id: "customer-classifications",
    category: "sales",
    categoryLabel: "Sales & Customer Accounts",
    icon: Users,
    question: "What are the customer classifications (Retail, Commercial, Wholesale)?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <ul className="space-y-1.5">
          <li>
            <strong>RETAIL:</strong> Residential households and neighborhood sari-sari stores purchasing 1–2 cylinders on demand.
          </li>
          <li>
            <strong>COMMERCIAL:</strong> Restaurants, hotels, and bakeries with recurring weekly cylinder swaps and scheduled route deliveries.
          </li>
          <li>
            <strong>WHOLESALE:</strong> Sub-distributors and industrial plants purchasing bulk cylinder batches or pallet quantities.
          </li>
        </ul>
      </div>
    ),
    tags: ["Customers", "Retail", "Commercial", "Wholesale"],
  },

  // 5. SECURITY & RBAC
  {
    id: "rbac-admin-password-confirmation",
    category: "security",
    categoryLabel: "Security & User Access",
    icon: ShieldCheck,
    question: "Why is Admin Password Confirmation required for dangerous actions?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          High-impact actions — such as deactivating a truck, soft-deleting an inventory product, disabling a user account, or resetting employee credentials — are protected by the <code>requirePasswordConfirmation</code> guard.
        </p>
        <p>
          The operator must enter their valid admin password to confirm intent. This prevents accidental deactivations and unauthorized personnel tampering.
        </p>
      </div>
    ),
    tags: ["Security", "Admin Password", "Confirmation", "RBAC"],
  },
  {
    id: "auto-credentials-generation",
    category: "security",
    categoryLabel: "Security & User Access",
    icon: Lock,
    question: "How are usernames and temporary passwords created?",
    answer: (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        <p>
          User credential creation is 100% automated by the system for security:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>
            <strong>Username Formula:</strong> First letter of first name + last name (e.g., John Doe ➔ <code>jdoe</code>). Any duplicates are resolved automatically (<code>jdoe1</code>, <code>jdoe2</code>).
          </li>
          <li>
            <strong>Temporary Password:</strong> Cryptographically random 8-character password generated once and returned in the response.
          </li>
          <li>
            <strong>First-Login Gatekeeper:</strong> The account has <code>must_change_password = TRUE</code>. Upon first login, the user must update their password before accessing system modules.
          </li>
        </ul>
      </div>
    ),
    tags: ["User Creation", "Credentials", "First Login", "Password Generator"],
  },
];

const CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "dispatch", label: "Route Dispatch" },
  { id: "fleet", label: "Fleet Board" },
  { id: "inventory", label: "Inventory & Yard" },
  { id: "sales", label: "Sales & Customers" },
  { id: "security", label: "Security & RBAC" },
];

export default function FAQs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedIds, setExpandedIds] = useState(() => new Set(["trip-lifecycle-stages"]));

  const toggleAccordion = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(FAQ_DATA.map((item) => item.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const filteredFaqs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] flex flex-col overflow-hidden w-full max-w-[1400px] mx-auto text-left font-sans">
      {/* 1. Header Banner */}
      <div className="shrink-0 mb-4 bg-gradient-to-r from-[#0E384E] to-[#0A4B6E] rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-full bg-[#FFDF2C] text-[#0A4B6E] flex items-center justify-center font-bold shadow-xs">
              <HelpCircle size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              System FAQs & Operational Guide
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl">
            Quick answers, formulas, and operational definitions for Route Dispatch, Fleet Maintenance, Yard Inventory, and RBAC Security.
          </p>
        </div>

        {/* Quick Expand/Collapse Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* 2. Controls: Search Bar & Category Switcher */}
      <div className="shrink-0 space-y-3 mb-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions by keyword, topic, or tag (e.g. Midday Reload, PM 5000, Awaiting Sync)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D5E3EC] rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-[#0A4B6E] text-[#FFDF2C] shadow-xs"
                  : "bg-[#EDF3F7] text-[#486581] hover:bg-[#D5E3EC] hover:text-[#0A4B6E]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Scrollable Accordion List */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-3 pb-6">
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center bg-[#E8F3F8]/40 border border-dashed border-[#BCE1F1] rounded-2xl">
            <p className="text-sm font-bold text-[#0A4B6E] mb-1">No Matching Questions Found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search keywords or select a different category filter.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedIds.has(faq.id);
            const Icon = faq.icon;

            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-[#D5E3EC] hover:border-[#0A4B6E]/30 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full p-4 flex items-start justify-between gap-3 text-left hover:bg-[#F8FAFC] transition cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-[#6D8AA2] uppercase tracking-wider block mb-0.5">
                        {faq.categoryLabel}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0A4B6E] leading-snug">
                        {faq.question}
                      </h3>
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {faq.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9.5px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 mt-1">
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-slate-700 border-t border-slate-100 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
