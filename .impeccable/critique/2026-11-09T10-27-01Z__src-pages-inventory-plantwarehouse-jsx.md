---
target: Plant Warehouse & Bunawan Bulk Yard Stock
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\giann\\Documents\\Programming Stuff\\MadayawGas\\madayawgas-frontend\\src\\pages\\Inventory\\PlantWarehouse.jsx"
target_fingerprint: "sha256:8b2a44dc257fc6f03c486175c3f51f6e211677e7e890b61a71bc490f7f5574b8"
target_path: "C:\\Users\\giann\\Documents\\Programming Stuff\\MadayawGas\\madayawgas-frontend\\src\\pages\\Inventory\\PlantWarehouse.jsx"
timestamp: 2026-11-09T10-27-01Z
slug: src-pages-inventory-plantwarehouse-jsx
---
# Design Critique: Plant Warehouse & Bunawan Bulk Yard Stock

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|:---:|---|
| 1 | Visibility of System Status | 2 | Realtime updates work, but no audit freshness stamps or indication of when counts were last physically audited |
| 2 | Match System / Real World | 3 | 3-bucket model and crate math match yard realities, but available verbs miss real supervisor operations (audits, write-offs) |
| 3 | User Control and Freedom | 1 | Zero count modification or reversal capabilities; errors cannot be edited or adjusted in the UI |
| 4 | Consistency and Standards | 1 | Completely departs from app standard: missing Header banner, Controls bar, Search, Filters, Table view, Detail panel, and 3-step wizard |
| 5 | Error Prevention | 1 | Unsafe single-step modals with hazardous pre-filled dummy numbers (2,400 units, fake invoice) and no confirmation review |
| 6 | Recognition Rather Than Recall | 2 | No search or filters; supervisors must visually scan cards; historical adjustments and audit ledger are hidden |
| 7 | Flexibility and Efficiency | 1 | Only a 3-column card grid; lacks a high-density sortable master table for high-frequency scanning |
| 8 | Aesthetic and Minimalist Design | 2 | Top header is cluttered; "Morning Loading Guide" blows open an intrusive 4-column card displacing inventory |
| 9 | Error Recovery | 2 | No way to recover from clerical count errors or write off scrapped/condemned stock in the UI |
| 10 | Help and Documentation | 2 | Lacks contextual guidance on how yard buffers interact with dispatches and return unloads |
| **Total** | | **17/40** | **Poor (42.5% — Major UX Overhaul Required)** |

---

### Design Specificity Verdict

**LLM Assessment**: While the underlying 3-bucket data model (`FILLED`, `EMPTY_GOOD`, `DEFECTIVE`) and crate conversion helpers are authentic to industrial LPG bottling in Davao, the page operates as an incomplete bulletin board rather than an active **Yard Stock Management & Audit Workspace**. The user's explicit requirement—allowing supervisors to add, modify, or remove stock across all products and condition buckets—is completely missing from the UI. Users are trapped with only two rigid, one-way actions (`+ Restock` and `Defect`).

**Deterministic Scan & Code Evidence**:
- CLI detector scanned `PlantWarehouse.jsx` and plant modal components (0 regex findings; static mode undercount).
- Automated AST & contrast analysis revealed:
  - **6 WCAG AA contrast failures** (e.g. brand slate `#6D8AA2` on `#F8FAFC` at 3.46:1 and `#FFFFFF` at 3.62:1, below 4.5:1 minimum).
  - **0 of 8 `<label>` elements linked via `htmlFor`**, and **0 of 8 inputs/selects have `id` attributes**, violating accessibility standards.
  - **Hazardous pre-filled mock values** (`quantityUnits = 2400`, invoice `"INV-SUP-2026-001"`) creating immediate database corruption risks.
  - **Suppressed focus rings** (`focus:outline-hidden` on active trucks input) and substandard touch targets ($\sim 22\text{px}$ on card action links).
  - **Dead code & logic duplication**: `SuggestedSplitModal.jsx` exists in the codebase but was abandoned in favor of an intrusive inline widget.

---

### Overall Impression
Plant Warehouse is an architectural orphan in the application. It looks and behaves like an isolated prototype rather than a coherent part of MadayawGas. It lacks the search, filtering, table views, and master-detail drawer that make every other module fast and predictable. By elevating this page into the canonical Master-Detail pattern with a unified Stock Adjustment Wizard (Add, Modify/Audit, Remove/Scrap), supervisors will gain complete command over Bunawan yard inventory.

---

### What's Working
1. **Discrete 3-Bucket Yard Taxonomy**: Segregating inventory into `Filled (Sale-Ready)`, `Empty Good (Refill Dock)`, and `Quarantined Defective` perfectly maps to physical plant zones.
2. **Crate & Canister Conversions**: Automated $1\text{ crate} = 24\text{ canisters}$ conversions prevent mental arithmetic errors during yard audits.
3. **Real-Time WebSocket Synchronization**: Automatic background cache invalidation via `useRealtimeRefresh` keeps stock fresh across concurrent dispatches.

---

### Priority Issues

#### [P0] Core Purpose Mismatch: Missing Modify, Audit, and Removal Capabilities
- **What**: The UI only provides one-way `+ Restock` (hardcoded to Filled) and `Defect`. Supervisors cannot correct clerical errors, adjust physical count discrepancies, modify empty good stock, or write off scrapped units.
- **Why it matters**: Violates the page's core job-to-be-done. Physical count variations cannot be corrected in the system without direct database intervention.
- **Fix**: Implement a unified, multi-mode **`StockAdjustmentModal.jsx`** supporting:
  1. *Receive Supplier Stock* (`SUPPLIER_PURCHASE`): Add filled or empty stock with invoice ref.
  2. *Physical Count Audit & Adjustment* (`PHYSICAL_COUNT`): Set new verified count or $\pm N$ delta across any bucket (`FILLED`, `EMPTY_GOOD`, `DEFECTIVE`) with mandatory audit reason.
  3. *Condition Transfer & Scrap* (`DEFECT_ADJUSTMENT`): Move units to quarantine or write off condemned stock.
- **Suggested Command**: `$impeccable shape`

#### [P1] Architectural Inconsistency: Missing Master-Detail Pattern & Standard Controls
- **What**: The page lacks the standard Page Header, Controls Bar (Search, Category/Container filters, Active chips), Dual View Switcher (Cards vs Table), and Master-Detail Slide-in Panel.
- **Why it matters**: Inconsistent navigation breaks user muscle memory. Supervisors cannot quickly search for SKUs, filter by Cylinders vs Canisters, or switch to a high-density table.
- **Fix**: Redesign `PlantWarehouse.jsx` to follow the standard layout:
  - Sticky Page Header with title, subtitle, metric pills, and primary `+ ADJUST PLANT STOCK` button.
  - Controls bar with SearchBar, Container Type filter (`All`, `Canisters`, `Cylinders`), and View Switcher (`Cards` / `Table`).
  - Slide-in Detail Panel (`PlantStockDetailPanel.jsx`) displaying full SKU specifications, condition progress gauges, quick actions, and the recent adjustments audit ledger (`/api/inventory/plant/adjustments`).
- **Suggested Command**: `$impeccable layout`

#### [P1] Unsafe Single-Step Modals with Pre-Filled Mock Data
- **What**: Modals submit immediately without confirmation, and `SupplierRestockModal` dangerously pre-populates `2400` units and a fake invoice number.
- **Why it matters**: High risk of accidental inventory corruption if an operator clicks submit unintentionally.
- **Fix**: Refactor modals to the standard 3-step wizard flow (`[Input] -> [Confirm] -> [Success]`), remove all dummy defaults, and enforce explicit confirmation.
- **Suggested Command**: `$impeccable harden`

#### [P2] "Morning Loading Guide" Intrusively Hijacking Layout
- **What**: The loading guide toggle button dominates the header, and clicking it injects a massive inline card pushing inventory off-screen.
- **Why it matters**: Clutters the bulk stock workspace with an auxiliary calculation tool.
- **Fix**: Extract the loading guide from the page body into an on-demand modal helper using the existing `SuggestedSplitModal.jsx` triggered from an auxiliary button in Controls or Detail Panel.
- **Suggested Command**: `$impeccable distill`

---

### Persona Red Flags
- **Plant Supervisor (Mateo)**: Completes a physical count walk-through and finds 18 leaking cans and a -8 cylinder variance. He has no way to enter the verified count or write off the loss, and cannot see who made the last change.
- **Operations Dispatcher (Carlo)**: Needs a fast scan of 11kg and 50kg cylinder buffers before morning truck staging. Cannot search or filter by cylinders, and cannot view a compact table.
- **Junior Warehouse Clerk (Jordan)**: Opens restock modal and is terrified by pre-filled `2400` units and fake invoice. Clicks submit, and the modal vanishes with no confirmation or receipt.

---

### Minor Observations
- Refresh button uses square `rounded-lg` instead of the system's standard `rounded-full` pill buttons.
- Substandard touch targets ($\sim 22\text{px}$) on product card action links violate WCAG recommendations for warehouse tablets.
- When zero defective stock exists, the dot indicator displays `bg-slate-300`, looking like an error or disconnected sensor.

---

### Questions to Consider
- What if supervisors had a single, unified "Adjust Stock" action supporting restocks, count audits, and scrap write-offs instead of scattered buttons?
- What if clicking any product card or table row opened an independent Detail Panel showing its live Bunawan Yard stock breakdown and recent adjustment audit log?
- Why keep an intrusive inline loading guide card on screen when it is an auxiliary calculation tool?
