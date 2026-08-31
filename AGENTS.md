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
[Step 1: Input Form]
        │
        ├── (Create Flow) ──> [Step 2: Confirm Info] ──> [Step 3: Admin Password] ──> [Step 4: Success View]
        │
        └── (Edit Flow)   ─────────────────────────────> [Step 3: Admin Password] ──> [Step 4: Success View]
```

### Steps Detail:
1. **Form Step** (`CustomerFormStep` / `UserFormStep`):
   - Input fields with rounded-full background `#F3F5F5`.
   - Red required asterisk (`*`).
   - Radio badges for status selection.
   - Submits to Step 2 (Create) or Step 3 (Edit).
2. **Confirm Step** (`CustomerConfirmStep` / `UserConfirmStep`):
   - Read-only summary cards of all entered data.
   - Yellow "CONFIRM" button advances to Step 3.
3. **Password Re-authentication Step** (`CustomerPasswordStep` / `UserPasswordStep` / `AdminPasswordModal`):
   - Requires admin password before sensitive operations or record mutations.
   - Verifies against `authApi.verifyPassword(password, username)`.
   - Shows inline error with `<AlertTriangle>` if incorrect.
   - Red `#C93B32` "PROCEED" / "VERIFYING..." button.
4. **Success Step** (`CustomerSuccessStep` / `UserSuccessStep`):
   - Summary of created/updated record.
   - Yellow "DONE" button closes modal and displays toast.

### Dangerous Operations (Soft-Deactivation):
- Clicking trash icon opens `DeactivateCustomerModal` / `DeactivateUserModal` (Warning confirmation).
- Clicking "CONTINUE" opens `AdminPasswordModal`.
- Calls `deactivateCustomer(id, { confirmPassword })` / `updateUserStatus`.
- Marks `isActive: false` (does not hard delete).
- Shows `ToastNotification` ("Customer Successfully Deactivated").

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
- **Contract**: `docs/API Contract/user.api.md`
- **Fields**: `id`, `username`, `firstName`, `lastName`, `phone`, `birthdate`, `role`, `roleId`, `isActive`, `isBlocked`, `mustChangePassword`, `createdAt`.
- **Features**: Multi-step user wizard, password reset, temporary credentials generator, deactivation, reactivation, and RBAC permissions modal matrix.

### 3. Fleet & Maintenance (`/fleet`)
- **Contract**: `docs/API Contract/fleet.api.md`
- **Features**: Truck cards grid, truck details modal, maintenance status indicators, driver assignment, vehicle delete/deactivate.

### 4. History Log (`/history-log`)
- **Features**: Chronological audit trail table, search, and module filter dropdown.

### 5. Layout & Navigation (`/`)
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
