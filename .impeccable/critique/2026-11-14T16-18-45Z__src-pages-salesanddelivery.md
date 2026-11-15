---
target: sales & delivery page
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\giann\\Documents\\Programming Stuff\\MadayawGas\\madayawgas-frontend\\src\\pages\\SalesAndDelivery"
timestamp: 2026-11-14T16-18-45Z
slug: src-pages-salesanddelivery
---
Method: dual-agent (A: c40637c2 · B: cdbb78c5)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2 | Header claims "Read-Only Operations & Monitoring" even on mutable Invoices tab; truncated pagination counts; no chart-specific loading state |
| 2 | Match System / Real World | 3 | Strong LPG terms (Canister Debt, Empties, Declaration Slip), but `DollarSign` icon on `₱` sales, raw enum badges (`PAID_UNVERIFIED`), and green icon on rising Canister Debt |
| 3 | User Control and Freedom | 2 | Custom drawers lack `Escape` and backdrop close; no "Clear filters" action; conflicting `dateRangePreset` vs `timeframe` controls |
| 4 | Consistency and Standards | 1 | Major drift: bypasses `SideDrawer`, `Badge`, `SearchBar`, `FilterDropdown`, and `Layout.jsx` sidebar patterns used in `Customers` and `Fleet` |
| 5 | Error Prevention | 1 | `canVerifyInvoice` gates on `SALES_VIEW` (read permission) instead of `SALES_UPDATE`; Verify Payment modal hides GCash reference & proof |
| 6 | Recognition Rather Than Recall | 2 | `InvoicesTab` has no detail drawer and omits customer names/items, forcing auditors to memorize invoice #s and switch to `Transaction Records` |
| 7 | Flexibility and Efficiency | 2 | URL `?tab=` sync exists, but no quick-filter chip for Unverified GCash, no keyboard shortcuts, and no shift/audit export |
| 8 | Aesthetic and Minimalist Design | 2 | 3 simultaneous `animate-pulse`/`ping` indicators, AI-slop badges (`Live Feed`, `Read-Only`), `₱` KPI inside tab button, and dense 5-KPI + chart + 2-panel Tab 1 |
| 9 | Error Recovery | 1 | `refreshAll` failures only `console.error` with zero user-facing error banner or retry, silently showing stale `localStorage` cache |
| 10 | Help and Documentation | 1 | No hover info tooltips for domain concepts (Wall-Clock vs Server Sync, Canister Debt sign, Declaration Slip); relies on a `Sparkles` footnote |
| **Total** | | **17 / 40** | **Poor — Major UX & consistency overhaul required** |

### Design Specificity Verdict

**LLM Assessment:** Hybrid — domain-authored data model wrapped in generic SaaS/AI-slop UI. The underlying data model is genuinely tailored to MadayawGas's Davao LPG operations (GCash vs. COD remittances, Declaration Slips, Empties Returned, Canister Debt, offline Wall-Clock vs. Server Sync timestamps). However, the presentation breaks project identity with `DollarSign` icons on Peso figures, a `Sparkles` icon on an accounting note, three competing `animate-pulse`/`ping` badges (`Live Feed`, `Read-Only Operations & Monitoring`), and custom inline drawers/raw `<select>` elements instead of the repo's `SideDrawer`, `Badge`, `SearchBar`, and `FilterDropdown` primitives.

**Deterministic Scan:** `impeccable detect --json src/pages/SalesAndDelivery src/components/sales` scanned 8 `.jsx` files with regex matching and exited `0` (`[]`). Because rules requiring a parsed DOM (`tiny-text`, `low-contrast`) could not run on `.jsx` source, manual inspection verified widespread `9px`–`11px` micro-text, missing `aria-label`s on drawer close buttons and filter inputs, missing `role="tablist"`/`aria-expanded`, and non-standard `py-0.2` utility classes.

**Visual Overlays:** Skipped (no browser automation tools exposed in this environment).

### Overall Impression

The Sales & Delivery module captures the right operational data for Bunawan plant closeouts and offline mobile sales, but it feels bolted on from a generic SaaS template rather than authored as part of MadayawGas. Four distinct workflows are crammed behind centered pill tabs with noisy pulsing badges, and the overview chart collapses at scale while hiding products beyond the hardcoded three.

### What's Working

1. **Authentic LPG Field-Ops Data Model:** Distinguishing `Wall-Clock Transacted` vs. `Server Sync Ingest` timestamps, zero-sale pickup stops, empties returned, and net canister debt directly addresses real Davao field-delivery realities.
2. **Shift Remittance Summary (`TripShiftSummaryDrawer`):** Consolidating truck/crew, Cash vs. GCash totals, proof links, and SKU-level empties returned in one view fits end-of-shift truck check-in.
3. **Real-Time WebSocket Sync (`useRealtimeRefresh`):** Listening to `SALES_BATCH_SYNCED`, `SALES_INVOICE_VERIFIED`, and `TRIP_*` keeps dispatchers and auditors synchronized without manual reloads.

### Priority Issues

- **[P0] Broken Verification Guard & Blind Approval Modal (`SalesAndDelivery.jsx:48`, `InvoicesTab.jsx:291-335`)**
  - **Why it matters:** `canVerifyInvoice` checks `PERMISSIONS.SALES_VIEW` (allowing read-only users to verify financial settlements), and the confirmation modal hides the GCash reference number and proof screenshot, encouraging blind rubber-stamping.
  - **Fix:** Gate verification on `PERMISSIONS.SALES_UPDATE` and render the GCash reference number + proof preview directly inside the verification modal.
  - **Suggested command:** ` harden`

- **[P1] Navigation, Layout & Component Drift from MadayawGas Standards (`SalesHeader.jsx`, `Layout.jsx`, `TransactionDetailDrawer.jsx`, `TripShiftSummaryDrawer.jsx`)**
  - **Why it matters:** Centered pill tabs with an embedded `₱` KPI, AI-slop status badges (`Live Feed`, `Read-Only Operations & Monitoring`), and custom inline drawers break muscle memory from `Customers` and `Fleet`, squish tables on smaller screens, and omit `Escape`/`role="dialog"`/`aria-label`.
  - **Fix:** Promote Sales sub-pages into the `Layout.jsx` sidebar (matching `Fleet` and `Inventory`), remove AI-slop pulsing badges, and refactor both drawers to use `src/components/ui/SideDrawer.jsx`, `Badge`, `SearchBar`, and `FilterDropdown`.
  - **Suggested command:** ` layout`

- **[P1] Chart Scalability Collapse & Metric Ambiguity (`SalesOverviewTab.jsx:161-259`)**
  - **Why it matters:** Rendering 3 hardcoded SKU bars (`butane`, `lpg11kg`, `lpg50kg`) inside a non-scrolling `100%` width container collapses into unreadable slivers on `Daily` + `Last 30 Days`/`All Time`, silently drops any additional catalog SKUs, and mixes `₱` Y-axis ticks with unitless tooltips.
  - **Fix:** Redesign the chart around **Total Revenue (₱)** stacked or grouped by **Container Type (Cylinders vs. Canisters)** or a clean **Total Sales Revenue + Order Volume** trend with a metric toggle, plus horizontal scroll/capped bucket density and unified `₱` formatting.
  - **Suggested command:** ` distill`

- **[P1] High Cognitive Load & Cross-Tab Recall Burden (`SalesOverviewTab.jsx`, `InvoicesTab.jsx`)**
  - **Why it matters:** Tab 1 packs 5 KPIs + chart + 6-column SKU table + payment card + footnote on one scroll, while `InvoicesTab` lacks customer names and a detail drawer—forcing auditors to memorize invoice #s and switch to `Transaction Records`.
  - **Fix:** Establish a clear operational flow (Overview -> Trip Remittances -> Transactions & Verification), reduce KPIs to 4 scannable cards, move explanatory prose into hover `Info` icon tooltips, and merge or cross-link invoice verification with `TransactionDetailDrawer`.
  - **Suggested command:** ` distill`

- **[P2] Timezone Boundary Drift, Eager Refetching & Silent Errors (`SalesAndDelivery.jsx:51-73, 120-183`)**
  - **Why it matters:** `today` preset appends `Z` (UTC) to a PHT date string, `last7`/`last30`/`thisMonth` use browser-local time instead of `Asia/Manila`, changing `timeframe` re-fetches all 4 endpoints, and `refreshAll` errors fail silently in `console.error`.
  - **Fix:** Compute all date-range boundaries in `Asia/Manila` (`+08:00`), decouple chart `timeframe` fetching from table endpoints, and show a user-facing error banner with Retry on API failure.
  - **Suggested command:** ` harden`

- **[P2] Client-Side Pagination Mismatch & Eager 20-Row Truncation (`SalesAndDelivery.jsx`)**
  - **Why it matters:** Header counts and tables paginate client-side over a single fetch, breaking accuracy as order volume grows.
  - **Fix:** Adopt server-side pagination (`page`, `limit`, `meta`) matching `Customers.jsx`.
  - **Suggested command:** ` optimize`

- **[P3] Micro-Text, Accessibility & Non-Standard Tailwind Classes**
  - **Why it matters:** Extensive `9px`–`11px` text fails readability on desktop workstations; `py-0.2` is not a valid Tailwind utility; missing `aria-label`s and unused imports add noise.
  - **Fix:** Enforce `>= 12px` body/table text, replace `py-0.2` with `py-0.5`, add `aria-label`s, and prune unused imports.
  - **Suggested command:** ` audit`

### Persona Red Flags

- **Logistics Dispatcher (Bunawan Plant):** Needs to check active/unreconciled truck remittances at shift end, but `TripDeliveriesTab` defaults to `All Statuses` with no quick `In Progress` filter, and on narrower screens the inline drawer crushes the table.
- **Office Manager / Sales Auditor (Davao Office):** Must verify GCash settlements using a modal that hides the GCash reference and proof image, and must switch tabs while holding an invoice number in working memory to see the customer or line items.
- **Plant Manager / Executive:** Switches to `Daily` over `Last 30 Days` and hits crushed illegible bars, a `DollarSign` icon on Peso revenue, and a green icon on rising Canister Debt.

### Minor Observations

- Unused imports across all 7 sales components (`Legend`, `useState`, `toPhilippineDateInputString`, `Filter`, `Receipt`, `Calendar`, etc.).
- Raw enum strings (`PAID_UNVERIFIED`, `IN_PROGRESS`) rendered directly instead of human-friendly labels via `Badge`.

### Questions to Consider

1. Should Sales sub-views live in the `Layout.jsx` sidebar (like `Fleet` and `Inventory`) so each route has one clear job and standard MadayawGas header?
2. Should the overview chart track **Revenue by Container Type (Cylinders vs. Canisters)** or **Total Revenue (₱) + Order Count**, eliminating the multi-SKU scalability problem?
3. Can `Invoices & Settlements` and `Transaction Records` be unified (or cross-linked with a shared `SideDrawer`) so auditors never have to memorize invoice numbers across tabs?
