---
target_identity: "file:C:\\Users\\giann\\Documents\\Programming Stuff\\MadayawGas\\madayawgas-frontend\\src\\pages\\Fleet\\Fleet.jsx"
target_fingerprint: "sha256:27e7266b79080acd344328513141febe3f63503861ea0492cfec70fab796421f"
target_path: "C:\\Users\\giann\\Documents\\Programming Stuff\\MadayawGas\\madayawgas-frontend\\src\\pages\\Fleet\\Fleet.jsx"
timestamp: 2026-11-07T06-22-58Z
slug: src-pages-fleet-fleet-jsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | High visibility of vehicle states, but competing badges (Status, Vehicle Type, PM DUE, ATTN) fight for visual prominence. |
| 2 | Match System / Real World | 3 | Terminology reflects LPG fleet reality, but tucking Fuel Monitoring and Traffic Citations into subtabs of a vehicle board is unnatural. |
| 3 | User Control and Freedom | 2 | Switching between 6 subtabs resets sub-filters; no direct link from a vehicle row to its work orders without opening the drawer. |
| 4 | Consistency and Standards | 2 | Severe inconsistency with Customers and Users: Fleet defaults to Cards (grid) and uses a 6-pill segmented bar seen nowhere else. |
| 5 | Error Prevention | 3 | Strong soft-bound driver retention and PM gatekeeping, but visual noise increases misclick risk during high-pressure staging. |
| 6 | Recognition Rather Than Recall | 2 | Critical vehicle status is fragmented across 6 tabs, forcing dispatchers to retain information across tab switches. |
| 7 | Flexibility and Efficiency | 2 | Card view shows only 6-8 vehicles per 1080p screen. Table view exists but is hidden behind a toggle; no keyboard navigation. |
| 8 | Aesthetic and Minimalist Design | 1 | Severe visual clutter: excessive badges, decorative icons inside cells, micro-text (<11px), nested cards, and multi-colored indicators. |
| 9 | Error Recovery | 3 | Inspection advisory tooltips explain dispatch restrictions clearly, but modals stack deeply when performing actions from the detail panel. |
| 10 | Help and Documentation | 2 | No inline explanation of PM threshold calculations (5,000 KM interval) or distinction between 'NEEDS_ATTENTION' vs 'FAILED' gating. |
| **Total** | | **23/40** | **Acceptable (57.5%) — Requires Structural Distillation & Polish** |

## Design Specificity Verdict

**Verdict: Robust Industrial Operational Logic Diluted by AI Dashboard Template Anti-Patterns.**

While the underlying domain logic (LPG truck staging, soft-bound drivers, 5,000-KM PM cycles, inspection gating, ₱5,000 work order gatekeeping) is authentically grounded in MadayawGas industrial requirements, the visual packaging and information architecture heavily suffer from AI boilerplate patterns:
- Over-pillification: Nested pill-shaped buttons, pill badges inside pill headers, and floating segmented controls.
- Container-in-container nesting: Every metric, card, and row is encased in its own bordered container with custom drop-shadows (shadow-2xs, shadow-xs).
- Monolithic Page Architecture: Rather than leveraging the application sidebar, 6 disparate operational domains (Vehicles, Work Orders, Maintenance History, Fuel Logs, Roadside Citations, and Defect Analytics) are jammed into a single page (Fleet.jsx is 1,616 lines).
- Card-First bias: The page defaults to visually loud, space-inefficient cards (iewMode = 'grid') that hide tabular comparative density needed during the morning staging rush.

**Deterministic Scan**:
Executed .agents\skills\impeccable\scripts\impeccable.cmd detect --json on src/pages/Fleet/Fleet.jsx and all components in src/components/fleet/. AST detector reported 0 fatal syntax rule breaks. However, code inspection revealed extensive sub-12px micro-text (	ext-[9px], 	ext-[10px], 	ext-[10.5px]), WCAG AA text contrast failures with #6D8AA2 on light backgrounds, and excessive badge/pill stacking.

## Overall Impression
MadayawGas has built comprehensive fleet functionality, but packed it all into one monolithic page with overwhelming visual ornament. The interface treats every vehicle attribute as a brightly colored badge and forces dispatchers into a card view that requires excessive scrolling during critical morning staging. By establishing a clean Table-First default, stripping decorative noise, and moving standalone operational domains (Fuel and Citations) to the sidebar, the Fleet module will transform into a fast, professional, high-density industrial tool.

## What's Working
1. **Faithful Industrial Invariants**: 5,000-KM preventive maintenance cycles, soft-bound driver retention during maintenance, and findings-only safety inspection gating are robustly enforced.
2. **Instant Search & Caching**: Local caching (pp_fleet_cache) combined with instant client filtering across plate number, driver name, and vehicle model provides zero-latency search.
3. **Dedicated Slide-In Detail Drawer**: TruckDetailPanel maintains list context while inspecting specifications, avoiding jarring full-page transitions.

## Priority Issues (P0–P3)

### [P0] Information Architecture Bloat & Monolithic Page Syndrome
- **What**: Fleet Board is an overloaded container housing 6 completely distinct subpages (ehicles, work-orders, logs, uel, pprehensions, nalytics) with 1,616 lines of orchestration code.
- **Why**: Major functional modules like Fuel Monitoring, Roadside Apprehensions, and Work Orders are buried as secondary subtabs inside a single page, while the main application sidebar has ample room under 'Fleet & Maintenance'. Operators cannot navigate directly or bookmark these views.
- **Fix**: Elevate high-frequency, standalone modules (Fuel Monitoring, Apprehensions, Maintenance/Work Orders) directly to the sidebar under 'Fleet & Maintenance', or consolidate them into a clean 2-surface structure (Fleet Assets vs Maintenance & Operations).
- **Suggested Command**: $impeccable layout / $impeccable distill

### [P1] Card-First Default Violates Desktop Operational Ergonomics
- **What**: Fleet Board defaults to Cards Grid View (iewMode = 'grid').
- **Why**: MadayawGas dispatchers work on 1080p+ widescreen monitors during rapid morning dispatch staging. Card view displays only ~6 trucks per viewport, requires excessive vertical scrolling, and makes comparing odometers or driver assignments across the fleet slow and error-prone. The rest of the app (Customers, Users, Inventory) defaults to Table-First.
- **Fix**: Set iewMode default to 'table'. Retain the Cards toggle for operators who prefer visual browsing, but align Fleet with the rest of the application as Table-First.
- **Suggested Command**: $impeccable layout

### [P2] Pervasive 'AI Template' Visual Clutter (Over-Badging & Over-Pillification)
- **What**: Every element is wrapped in a rounded pill, container border, or colored badge. In FleetTable, a single row contains up to 5 colored badges/pills (DELIVERY TRUCK, PM DUE, ATTN, ACTIVE, and a circular action button). The top header has a row of 6 pills, followed by another row of 4 badge chips.
- **Why**: High visual noise lowers readability and dilutes the urgency of critical alerts. When everything is a badge, nothing stands out.
- **Fix**: Strip decorative badges. Plain text with subtle typographic hierarchy should replace secondary badges (e.g. vehicle classification formatted as quiet secondary slate text below the plate number). Reserve badges strictly for actionable operational states (ACTIVE, UNDER MAINTENANCE, PM DUE).
- **Suggested Command**: $impeccable quieter / $impeccable distill

### [P3] Fragmented & Redundant Action Toolbars in Detail Panel
- **What**: TruckDetailPanel features two separate button grids: a 4-button quick operations grid at the top (Inspect, Report, Record, Order) and a 3-button history logs grid at the bottom (Odometer, Inspection, Incidents), plus inline action buttons (Edit, Deactivate, Assign Driver).
- **Why**: 8+ competing buttons scattered across the drawer create action paralysis. Users must hunt through multiple small buttons to perform standard tasks.
- **Fix**: Consolidate actions into a single coherent action bar with clear primary vs secondary hierarchy (Primary: Record Safety Inspection / Create Work Order; Secondary overflow: History logs and settings).
- **Suggested Command**: $impeccable distill

## Persona Red Flags
- **Alex (Power User Dispatcher)**: Forced to view cards on login; must click the view switcher every time. Scanning 25 vehicles requires 4x more scrolling than a dense table. Cannot multi-select or batch-assign drivers.
- **Jordan (First-Timer)**: Confronted with 6 subtabs on the header and 9 different badges. Confused whether 'Apprehensions' is a vehicle state or a driver disciplinary action. Doesn't know if 'Work Orders' or 'Vehicles' is where a vehicle is repaired.
- **Sam (Accessibility / Keyboard User)**: Micro-text (	ext-[9px], 	ext-[10px]) in badges and table headers fails readability. Card view cards have nested clickable buttons inside clickable card wrappers, creating keyboard focus traps.
- **Nonoy (Bunawan Plant Fleet Supervisor)**: Needs to check if trucks returning at 5:00 PM had roadside citations or fuel anomalies. Has to navigate into Fleet Board, click Tab 4 (Fuel), filter, then click Tab 5 (Apprehensions) and filter again. Neither is directly accessible from the primary sidebar navigation.

## Minor Observations
- 'Incidents Log' is tucked inside an 'Incidents' dropdown button in the header, while 'Apprehensions' is a top-level tab. This creates confusion between traffic citations (Apprehensions) and road accidents/breakdowns (Incidents).
- Micro-text (	ext-[9px] to 	ext-[10.5px]) in badges and tables strains readability in plant back-office lighting.

## Questions to Consider
- What if Fuel Monitoring and Roadside Citations were standalone sidebar destinations alongside Route Dispatch?
- What would the Fleet Table look like if we removed all decorative icons and let typography do the heavy lifting?
- Can a vehicle's work order history be consolidated directly into its detail drawer rather than requiring a page-level tab switch?
