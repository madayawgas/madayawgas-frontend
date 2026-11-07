# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Logistics Dispatcher / Operations Coordinator (Primary)**: Stationed in the plant dispatch booth/back-office. Responsible for morning truck staging, allocating routes, assigning drivers, loading cargo (canister crates vs cylinders), verifying driver attendance clock-in, monitoring in-progress trips, logging midday reloads, and handling end-of-day trip reconciliation. High-frequency operator where speed, minimal clicks, and keyboard efficiency directly impact departure schedules.
- **Plant / Warehouse Supervisor**: Based in the Bunawan LPG refilling plant. Responsible for bulk yard inventory reconciliation (filled units, empty returns, quarantined leakers/defects), supplier intake batches, canister crate conversion, and tracking stock movements against route loads.
- **Fleet Supervisor / Vehicle Safety Inspector**: Inspects delivery trucks and utility vehicles before departure. Conducts safety checks (brakes, tires, LPG valve seals, fire extinguishers), grounds defective vehicles (`UNDER_MAINTENANCE`), monitors preventive maintenance (5,000 KM threshold), and manages repair work orders with managerial approval gatekeeping (₱5,000 threshold).
- **System Administrator / Office Manager**: Manages internal user accounts, role-based access control (RBAC), credentials resets, and customer master profiles (commercial, retail, wholesale).

## Product Purpose
MadayawGas is the central operational enterprise web application for Madayaw Petroleum and Gas Corporation, an LPG refilling, bottling, and distribution company headquartered in Davao City, Philippines. The system serves as the operational spine uniting fleet dispatch logistics, physical yard bulk inventory, driver compliance, route scheduling, and customer management into a single, high-reliability workspace. Success means zero hazardous dispatches, rapid truck turnaround at staging lanes, accurate container and crate reconciliation, and complete auditability of plant movements.

## Positioning
Unlike generic CRM, ERP, or fleet GPS tracking dashboards, MadayawGas is custom-architected around the physical realities and regulatory constraints of industrial LPG distribution:
1. **Two-Tier LPG Cargo Modeling**: Explicit differentiation between pressurized cylinders (11kg, 50kg) and 24-unit butane canister crates.
2. **Safety-First Dispatch Gating**: Hard-blocks vehicle departure if the assigned driver is off-duty (attendance API) or if the truck has failed safety inspection / exceeded PM odometer limits.
3. **Bunawan Yard Bulk Stock Integration**: Directly connects truck dispatch staging, midday delivery reloads, and end-of-trip returns to plant warehouse inventory balances.

## Operating Context
- **Physical Environment**: High-throughput plant dispatch booths, weighbridges, and administrative back-offices located at the Bunawan LPG refilling terminal.
- **Hardware & Devices**: Dedicated desktop workstations (1080p+ widescreen monitors, standard keyboards, and mice). Minimal mobile interaction; optimized for dense, multi-panel desktop information architecture.
- **Daily Operational Rhythm**:
  - *05:30 – 07:30 AM*: High-density staging rush. Dispatchers inspect schedules, verify driver attendance, configure truck loadout crates/cylinders, and dispatch 10–25 delivery runs.
  - *Midday (11:00 AM – 02:00 PM)*: Route tracking, midday canister reload requests, emergency alert / SOS handling, and schedule adjustments.
  - *Late Afternoon (04:00 – 06:30 PM)*: Return trip intake, odometer logging, physical cylinder/crate count audits, and Bunawan yard reconciliation.
- **Regulatory & Safety Context**: Highly regulated hazardous materials handling (Bureau of Fire Protection, Department of Energy, and DOTr standards). Failed safety inspections or missing driver credentials carry strict operational liability.

## Capabilities and Constraints
- **Logistics & Dispatch**: Weekly recurring route matrix, daily dispatch runs, midday canister reloads, emergency driver SOS alerting, trip cancellation with yard rollback.
- **Physical Inventory**: Bunawan bulk yard tracking (`plant_inventory`), crate-to-canister conversion (1 crate = 24 canisters), defect quarantine tracking, supplier intake batches.
- **Fleet & Work Orders**: Asset lifecycle tracking, soft-bound driver assignment, 5,000 KM preventive maintenance alerts, findings-only safety inspection gating, ₱5,000 managerial cost gatekeeping (`users.manage`).
- **Data State & Integrity**: Instant client-side caching (`app_*_cache`) combined with live WebSocket real-time updates (`useRealtimeRefresh`), eliminating manual page reloads.
- **Localization**: Strict Philippine Standard Time (`Asia/Manila`, GMT+8) display and date range filtering; standard Philippine phone number normalization (`(+63) 9xx xxx xxxx`).
- **Technical Stack**: React 19, Vite, Tailwind CSS v4, React Router v7, Lucide React, Recharts.

## Brand Commitments
- **Name**: Madayaw Petroleum and Gas Corporation (MadayawGas).
- **Visual Identity**:
  - Primary Navy: `#0A4B6E` (Dark Navy `#0D4B6E` / `#0B4A6E`)
  - Accent Yellow: `#FFDF2C` / `#F6C445` (Hover: `#ebd024`)
  - Title Blue: `#1B4B75`
  - Slate Secondary Text: `#6D8AA2`
  - Neutral Backgrounds: `#F2F2F2` (Body), `#E8F3F8` (Cards), `#E2EDF3` (Selected Row)
- **Tone**: Pragmatic, safety-first, authoritative, and industrial. Free of consumer marketing fluff or unnecessary gamification.

## Evidence on Hand
- **Backend API Contracts**: Defined in `docs/api-contracts/` (fleet, inventory, media, schedules, trips, users, sales-customer).
- **Live REST API Client**: Fully implemented in `src/api/client.js` with session cookies (`credentials: "include"`).
- **Authentication & RBAC Matrix**: Live in `src/context/AuthContext.jsx` and `src/utils/permissions.js`.
- **Active Codebase**: Production-grade frontend application under `src/` managing live LPG distribution workflows.

## Product Principles
1. **Safety Gating Overrides Convenience**: If a truck fails inspection, exceeds PM safety limits, or the driver is off-duty, dispatch is strictly locked. The UI must clearly explain why and provide direct paths to resolve the gate.
2. **Speed in the Staging Rush**: Morning dispatch operates under tight logistical deadlines. Operations must minimize unnecessary clicks, eliminate redundant multi-step modal confirmations, and support efficient keyboard/dense desktop navigation.
3. **Physical-Digital Reconciliation Truth**: Every canister, crate, and cylinder that leaves or enters Bunawan yard must balance against digital inventory. The UI must never obscure stock loss, defect quarantines, or discrepancy audits.
4. **Desktop Information Density**: Designed for 1080p+ widescreen desktop monitors with independent scrolling containers, dockable master-detail views, and persistent context rather than view-obscuring overlays.

## Accessibility & Inclusion
- **Desktop Operational Ergonomics**: High-contrast typography conforming to WCAG 2.1 AA (minimum 4.5:1 text contrast), replacing low-contrast `#99a1af` grays and sub-12px micro-text.
- **Accessible Controls**: Standardized keyboard focus indicators (`focus-visible:ring-2`), non-destructive modal focus trapping, and semantic `aria-label` tags on all icon-only action and close buttons.
