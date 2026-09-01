# AGENTS.md — MadayawGas Frontend Developer & Agent Guide

> **Note for AI Agents & Developers**: This document serves as the single source of truth for the codebase architecture, UI design standards, RBAC/permissions, component patterns, API conventions, and recent implementations. Read this file first to gain immediate context without wasting tokens exploring the codebase.

---

## 1. Project Overview & Tech Stack

**MadayawGas Frontend** is the operational management web application for Madayaw Petroleum and Gas Corporation (LPG distribution, fleet dispatch, inventory, sales/customer profiles, user RBAC, and history audit logging).

- **Framework**: React 19 (`react@^19.2.4`, `react-dom@^19.2.4`)
- **Build Tool**: Vite 8 (`@vitejs/plugin-react`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `@import "tailwindcss";` in `src/index.css`)
- **Icons**: Lucide React (`lucide-react@^1.34.0`)
- **Routing**: React Router v7 (`react-router-dom@^7.14.1`)
- **Forms**: React Hook Form (`react-hook-form@^7.72.1`) & Controlled Form Components
- **Charts**: Recharts (`recharts@^3.8.1`)
- **Font**: Poppins (`'Poppins', sans-serif`)

---

## 2. Directory Structure

```
madayawgas-frontend/
├── docs/
│   ├── API Contract/           # Backend REST API contracts (Single source of truth for data models)
│   │   ├── auth.api.md
│   │   ├── fleet.api.md
│   │   ├── sales-customer.api.md
│   │   └── user.api.md
│   ├── Reference/              # UI/UX design mockups and reference screenshots
│   └── permissions.md          # RBAC matrix and role permissions mapping
├── src/
│   ├── api/                    # API services (wraps fetch with auto session cookie & mock fallbacks)
│   │   ├── auth.js             # Login, logout, getMe, verifyPassword, changePassword
│   │   ├── client.js           # apiClient wrapper, isMock flag, delay helper
│   │   ├── customers.js        # Customer CRUD & password verification
│   │   ├── dashboard.js        # Metrics & analytics
│   │   ├── fleet.js            # Vehicle CRUD, maintenance, driver assignments
│   │   ├── history.js          # Audit logs
│   │   ├── index.js            # Re-exports all API services
│   │   ├── inventory.js        # Stock and catalog
│   │   ├── sales.js            # Sales overview & customer delegation
│   │   └── users.js            # User CRUD, roles, password reset, deactivation
│   ├── assets/                 # SVGs, brand logos, background graphics
│   ├── components/
│   │   ├── auth/               # ProtectedRoute.jsx, DynamicHomeRedirect.jsx
│   │   ├── customers/          # CustomerHeader, CustomerControls, CustomerTable, CustomerDetailPanel, CustomerModal (Wizard steps 1-4), DeactivateCustomerModal, FilterCustomer, CustomerActiveFilters, etc.
│   │   ├── dashboard/          # SalesGraph, StatCard, TruckList
│   │   ├── fleet/              # FleetHeader, TruckCard, TruckModal, DeleteConfirmationModal, etc.
│   │   ├── history log/        # HistoryTable, ActionTypePill
│   │   ├── ui/                 # Reusable atomic UI: Badge, Button, Card, FilterDropdown, Input, Modal, SavedChangesToast, SearchBar, Select, ToastNotifications, UnsavedChangesToast
│   │   └── users/              # UsersHeader, UsersControls, UsersTable, UserModal (Wizard steps 1-4), AdminPasswordModal, DeactivateUserModal, ReactivateUserModal, FilterRole, PermissionsModal, etc.
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state, session bootstrap, can/canAll/canAny permission helpers
│   ├── mocks/                  # JSON datasets for offline/mock development (isMock = true)
│   │   ├── customers.json
│   │   ├── dashboard.json
│   │   ├── fleet.json
│   │   ├── history.json
│   │   ├── me.json
│   │   ├── roles.json
│   │   ├── sales.json
│   │   └── users.json
│   ├── pages/
│   │   ├── Customers/          # Customer Profile page (Master-Detail layout)
│   │   ├── Dashboard/          # Analytics dashboard
│   │   ├── Fleet/              # Fleet and maintenance management
│   │   ├── HistoryLog/         # Audit event logs
│   │   ├── Inventory/          # Product inventory
│   │   ├── Layout.jsx          # Shell with collapsible dark-blue sidebar and top navbar
│   │   ├── Login/              # Auth login page
│   │   ├── Profile/            # User profile settings & password change
│   │   ├── RouteDispatch/      # Driver dispatch and route assignments
│   │   ├── SalesAndDelivery/   # Sales overview placeholder
│   │   └── Users/              # User management & RBAC administration
│   ├── utils/
│   │   ├── permissions.js      # PERMISSIONS constants, can(), canAll(), canAny(), getDefaultRoute()
│   │   └── phone.js            # Philippine phone format normalization & validation
│   ├── App.jsx                 # Route fallback definitions
│   ├── index.css               # Global CSS, Tailwind import, custom keyframes & scrollbar
│   └── main.jsx                # Application root with createBrowserRouter router configuration
├── AGENTS.md                   # This developer & agent guide
├── package.json
└── vite.config.js
```

---

## 3. Core Architecture & Rules

### A. Authentication & RBAC Permissions
1. **Session Handling**: Uses HTTP-Only cookie `mg_sid`. `apiClient` in `src/api/client.js` always sets `credentials: "include"`.
2. **Permission Keys** (`src/utils/permissions.js`):
   - `dashboard.view`
   - `fleet.view`, `fleet.manage`
   - `route.view`, `route.view_own`, `route.manage`
   - `inventory.view`, `inventory.manage`
   - `sales.view`, `sales.view_own`, `sales.create`, `sales.update`, `sales.delete`
   - `delivery.view`, `delivery.view_own`, `delivery.update`, `delivery.update_own`
   - `users.view`, `users.manage`
   - `history.view`, `history.manage`
3. **Permission Evaluation**:
   - `useAuth()` provides `can(permission)`, `canAll(permissionsList)`, `canAny(permissionsList)`, `currentUser`, `isAuthenticated`.
   - Use `<ProtectedRoute permission={[PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_VIEW_OWN]}>` to wrap routes in `main.jsx`.
   - Condition management buttons/actions with `can(PERMISSIONS.SALES_CREATE)`, `can(PERMISSIONS.USERS_MANAGE)`, etc.

### B. Mock System (`isMock`)
- Governed by `VITE_USE_MOCK` in `src/api/client.js` (defaults to `true` if not explicitly set to `"false"`).
- All API services (`users.js`, `customers.js`, `fleet.js`, etc.) check `isMock`. In mock mode, they simulate latency (`await delay(250)`) and update in-memory/mock JSON collections.
- Pages also utilize `localStorage` cache keys (e.g. `app_customers_cache`, `app_users_cache`) to retain state across browser refreshes.

### C. Visual Identity & Design System
- **Colors**:
  - Primary Dark Navy: `#0A4B6E` / `#0B4A6E` / `#0D4B6E`
  - Accent Yellow: `#FFDF2C` / `#F6C445` (Hover: `#ebd024` / `#e2b23b`)
  - Title Blue: `#1B4B75`
  - Slate Label Text: `#6D8AA2`
  - Background Neutral: `#F2F2F2` (Body), `#F3F5F5` (Inputs), `#E8F3F8` (Cards), `#E2EDF3` (Selected Row)
  - Danger / Error Red: `#C93B32` / `#CD3E3E` / `#D93025`
  - Success Green: `#43A047` / `#48BB78`
- **Typography**: Poppins (`font-sans`), font weights 400, 500, 600, 700.
- **Pills & Buttons**: Fully rounded (`rounded-full`), uppercase tracking for buttons (`text-[11px] font-bold tracking-widest uppercase`).

### D. Layout & Independent Scrolling Architecture
- Pages inside `Layout.jsx` have a fixed height: `h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] overflow-hidden`.
- **Top Headers & Controls**: Marked with `shrink-0` so they never scroll out of view.
- **Master Table (Left)**: Table container has `flex-1 min-h-0 overflow-y-auto custom-scrollbar` with `thead` having `sticky top-0 z-10`. Table scrolls independently.
- **Detail Panel (Right)**: Has `w-full lg:w-[400px] xl:w-[430px] shrink-0 h-full flex flex-col overflow-hidden`. Its content is wrapped in `flex-1 min-h-0 overflow-y-auto custom-scrollbar` (scrolls independently only if content overflows), and the yellow **CLOSE** button is pinned at `shrink-0 pt-4`.
- **Rule**: Table and Detail Panel scrollbars are completely isolated. Neither causes the whole page to scroll.

### E. Animations (`src/index.css`)
- **Slide-in (Right to Left)**: `.animate-slide-fade-in` (`translateX(100px)` &rarr; `translateX(0)` with fade).
- **Slide-out (Left to Right)**: `.animate-slide-fade-out` (`translateX(0)` &rarr; `translateX(100px)` with fade).
- **Scale/Fade Modal**: `.animate-scale-in`, `.animate-scale-out`, `.animate-fade-in`, `.animate-fade-out`.

---

## 4. Modal & Confirmation Wizard Patterns

All entity creation and modification flows follow the standard multi-step modal pattern established in the **Manage Users** and **Customer Profile** pages:

```
### Entity Wizard Flow (Create & Edit):
```
[Step 1: Input Form] ──> [Step 2: Confirm Info] ──> [Step 3: Success View]
```
- Standard CRUD (`POST /api/sales/customers`, `PATCH /api/sales/customers/:id`, `POST /api/users`, `PATCH /api/users/:id`) does not require password re-authentication according to the backend API contracts.
- Step 1 (Form) collects attributes and validates formats (e.g. Philippine contact numbers).
- Step 2 (Confirm) provides a read-only review with a yellow "CONFIRM" button that triggers the API call.
- Step 3 (Success) displays created/updated details with a yellow "DONE" button.

### Dangerous Operations (Deactivation / Role Changes / Credential Resets):
- **API Design Rule**: There is **NO standalone `/api/users/verify-password` endpoint**. The backend validates `confirmPassword` directly within the respective dangerous operation endpoints:
  - Deactivate Customer: `PATCH /api/sales/customers/:id/deactivate` with body `{ confirmPassword }`
  - Deactivate Item/Product: `PATCH /api/inventory/products/:id/deactivate` with body `{ confirmPassword }`
  - Deactivate Vehicle Asset: `PATCH /api/fleet/trucks/:id/deactivate` with body `{ confirmPassword }`
  - Update User Status (Deactivate/Activate/Block): `PATCH /api/users/:id/status` with body `{ confirmPassword, isActive, isBlocked }`
  - Reset User Credentials: `PATCH /api/users/:id/credentials` with body `{ confirmPassword, resetPassword, username }`
  - Change User Role: `PATCH /api/users/:id/role` with body `{ confirmPassword, roleId }`
- **UI Flow**:
  1. Triggering action opens warning confirmation modal (`DeactivateCustomerModal` / `DeactivateUserModal` / `DeactivateItemModal` / `DeleteConfirmationModal`).
  2. Clicking "CONTINUE" opens `AdminPasswordModal`.
  3. `AdminPasswordModal` collects the admin password and passes it to the dangerous operation API call. If invalid, the endpoint returns `401 Unauthorized` and `AdminPasswordModal` renders the inline error message.
  4. Upon success, state/cache is updated, modal closes, and a success `ToastNotification` is displayed.

---

## 5. Philippine Phone Number Conventions (`src/utils/phone.js`)

The application supports all Philippine contact number formats:
- **Mobile formats accepted**: `+639xxxxxxxxx`, `09xxxxxxxxx`, `(+63) 9xx xxx xxxx`, `09xx-xxx-xxxx`.
- **Landline formats accepted**: `+63822245678`, `(082) 224-5678`, `0822245678`.
- Helper functions:
  - `isValidPhilippinePhone(phone)`: Regex validation for mobile and landline conventions.
  - `formatPhilippinePhone(phone)`: Converts to standard display format `(+63) 9xx xxx xxxx`.

---

## 6. Modules Overview

### 0. Analytics Dashboard (`/dashboard`)
- **Features**:
  - Financial metric summary cards overlaying custom background header banner.
  - Interactive Sales Overview bar chart powered by Recharts (Weekly, Monthly, Annually filters across Butane Canister, 11kg LPG, 50kg LPG).
  - Truck operational status summary grid:
    - **Available**: Real-time count of active operational vehicles (`status === "ACTIVE"`) from backend `fleetApi`.
    - **In Use**: Retained metric (defaults to `0` pending dispatch trip integration).
    - **Maintenance**: Real-time count of vehicles under maintenance (`status === "UNDER_MAINTENANCE"`) from backend `fleetApi`.
    - **Under Repair**: Retained metric (defaults to `0`).

### 1. Customer Profile (`/customers`, `/customer`)
- **Contract**: `docs/API Contract/sales-customer.api.md`
- **Fields**:
  - `id` (UUID)
  - `name` (String, required)
  - `address` (String, required)
  - `contactNumber` (String, required)
  - `customerType` (`'COMMERCIAL'` | `'RETAIL'` | `'WHOLESALE'`)
  - `isActive` (Boolean, default `true`)
  - `createdAt` (TIMESTAMPTZ)
  - `updatedAt` (TIMESTAMPTZ)
- **Features**:
  - Master table on left with sortable columns, active filter chips, search bar, and filter dropdown.
  - Detail panel on right with customer avatar, address, type badge, status badge, timestamps, edit/delete actions, and bottom CLOSE button.
  - Multi-step Create/Edit wizard and password-guarded deactivation flow.

### 2. User Management (`/users`)
- **Contract**: `docs/API Contract/user-management.api.md`
- **Fields**: `id`, `username`, `firstName`, `lastName`, `phone`, `birthdate`, `role`, `roleId`, `isActive`, `isBlocked`, `mustChangePassword`, `createdAt`.
- **Status Distinction**:
  - **Suspend (`isBlocked = true`)**: Temporary login restriction without deleting or deactivating account. User remains active in table (`isActive = true`) with a red `"SUSPENDED"` badge. Can be toggled in the Edit modal or status endpoint.
  - **Deactivate (`isActive = false`)**: Soft-deletes user account. Deactivated accounts show a gray `"DEACTIVATED"` badge, sort to the bottom, and can be reactivated via the `RotateCcw` action button or status endpoint with admin password confirmation.
- **Features**: Multi-step user wizard, password reset, temporary credentials generator, deactivation, reactivation, and RBAC permissions modal matrix.

### 3. Fleet & Maintenance (`/fleet`)
- **Contract**: `docs/API Contract/fleet-and-maintenance.api.md`
- **Fields**: `id` (UUID), `plateNumber`, `model`, `yearModel`, `currentOdometer`, `lastPmOdometer`, `status` (`ACTIVE`, `UNDER_MAINTENANCE`, `INACTIVE`, `RETIRED`), `driverId`, `driver`, `createdAt`, `updatedAt`.
- **Features**: Card grid, truck modal, operational condition management, soft-bounded driver assignment, mileage tracking, deactivation guard with `confirmPassword`, `localStorage` caching (`app_fleet_cache`).

### 4. Item Profile / Inventory (`/item-profile`, `/inventory`)
- **Contract**: `docs/API Contract/inventory-products.api.md`
- **Fields**: `id` (UUID), `name`, `category`, `containerType` (`CYLINDER` | `CANISTER`), `netWeightKg`, `isActive`, `createdAt`, `updatedAt`.
- **Features**: Product card grid, register/edit product modal, category & container type filters, password-guarded deactivation (`PATCH /api/inventory/products/:id/deactivate`), `localStorage` caching (`app_items_cache`).

### 5. History Log (`/history-log`)
- **Contract**: `docs/API Contract/history-log.api.md`
- **Features**: Chronological audit trail table, search, and module filter dropdown.

### 6. Layout & Navigation (`/`)
- Sidebar includes: Dashboard, Fleet and Maintenance, Route Dispatch, Inventory, Sales and Delivery, Customer, Manage Users, History Log, Profile, Logout.
- Top header includes: Current user name and role badge with yellow text `#FFDF2C`.

---

## 7. Developer Cheatsheet

### Running the App
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run ESLint check
npm run lint
```

### Creating New Features — Checklist for Agents
1. **Check API Contract**: Always read the corresponding file in `docs/API Contract/` before coding. **API Contract takes precedence over design mockups**.
2. **Implement API Service**: Add functions to `src/api/<module>.js` supporting both live `apiClient` calls and simulated `isMock` operations.
3. **Seed Mock Data**: Add realistic mock entries in `src/mocks/<module>.json`.
4. **Permissions Guard**: Guard routes in `main.jsx` with `<ProtectedRoute permission={...}>` and check actions with `can(...)` from `useAuth()`.
5. **Follow UI Patterns**:
   - Reuse `src/components/ui/` (`Badge`, `Button`, `Modal`, `SearchBar`, `ToastNotifications`, `SavedChangesToast`).
   - Use multi-step confirmation modals for creates and edits.
   - Use `AdminPasswordModal` for sensitive/dangerous operations.
   - Ensure independent scroll contexts with sticky table headers and locked right panels.
   - Respect left-to-right out / right-to-left in animations.
