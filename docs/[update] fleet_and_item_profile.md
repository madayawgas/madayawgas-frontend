# Documentation: Fleet Board & Item Profile API Contract Alignment

## 1. Executive Summary

This document explains the full implementation of the **Item Profile** (Products CRUD) and **Fleet Board** (Vehicle & Maintenance Management) modules, strictly aligning them with the official **MadayawGas Backend API Contracts**.

All source code in `src/api/` has been left **100% untouched**, while frontend components, form schemas, validation rules, mock datasets, and status life cycles directly adhere to the contract specifications.

---

## 2. Item Profile (Inventory Products) Module

### Data Model & Company Standard Products

| Product Name | Category | Container Type | Net Weight (kg) | Operational Status |
|---|---|---|---|---|
| **Butane Canister 250g** | `Canister` | `CANISTER` | `0.250` kg | `ACTIVE` (`isActive: true`) |
| **11kg LPG Cylinder** | `LPG Cylinder` | `CYLINDER` | `11.000` kg | `ACTIVE` (`isActive: true`) |
| **22kg LPG Cylinder** | `LPG Cylinder` | `CYLINDER` | `22.000` kg | `ACTIVE` (`isActive: true`) |

### Endpoints Mapped & Supported
1. **`GET /api/inventory/products`**:
   - Lists products with search (`name`, `category`, `containerType`) and status filtering (`ACTIVE`, `INACTIVE`).
2. **`GET /api/inventory/products/:id`**:
   - Retrieves single product details rendered inside `ItemModal.jsx` (View Mode).
3. **`POST /api/inventory/products`**:
   - 2-step registration: Form $\rightarrow$ Review/Confirm $\rightarrow$ Direct creation (no password required).
   - Request Body: `{ name, category, containerType, netWeightKg, isActive }`.
4. **`PATCH /api/inventory/products/:id`**:
   - Partial updates for name, category, container type, net weight.
   - **Reactivation Security**: When reactivating an inactive product item (`INACTIVE` $\rightarrow$ `ACTIVE`), requires Admin Password verification.
5. **`PATCH /api/inventory/products/:id/deactivate`**:
   - Deactivates product item (`isActive = false`) with admin password verification via `DeactivateItemModal.jsx` and `AdminPasswordModal.jsx`.


---

## 3. Fleet Board Module

### Domain Architecture & Availability Concepts
- **Soft-Bounded Default Driver**: Drivers are assigned as the truck's default dedicated operator (`driverId`, `driver` object).
- **Maintenance Preservation**: Setting a truck to `UNDER_MAINTENANCE` retains driver assignment.
- **Deactivation Release**: Setting a vehicle to `INACTIVE` releases the assigned driver back to the unassigned driver pool.

### Supported Fleet Endpoints
1. **`GET /api/fleet/overview`**: Aggregate operational rates and metrics.
2. **`GET /api/fleet/availability`**: Active vehicles ready for dispatch.
3. **`GET /api/fleet/trucks`**: Complete list of trucks with filtering and search.
4. **`GET /api/fleet/trucks/:id`**: Detailed single truck inspection.
5. **`POST /api/fleet/trucks`**: Registration of vehicle assets with optional driver assignment.
6. **`PATCH /api/fleet/trucks/:id`**: Update vehicle specifications, plate number, model, and year.
7. **`PATCH /api/fleet/trucks/:id/status`**: Update operational condition (`ACTIVE`, `INACTIVE`, `UNDER_MAINTENANCE`, `RETIRED`).
8. **`PATCH /api/fleet/trucks/:id/deactivate`**: Soft-decommission vehicle asset with admin password guard.
9. **`PATCH /api/fleet/trucks/:id/assign`**: Assign or transfer default driver.
10. **`POST/PATCH /api/fleet/trucks/:id/mileage`**: Record odometer with rollback prevention.

---

## 4. Account Profile Module

### Overview & Mockup Alignment
- **Dynamic Logged-In User Details**: Automatically sourced from active session via `useAuth()` (`firstName`, `lastName`, `phone`, `birthdate`, `username`).
- **View Mode**:
  - **Header**: `Account Profile` in `#1B4B75` with divider.
  - **Basic Information**: Profile picture avatar + `Change Image` / `Edit Profile` actions + formatted details (`Name`, `Mobile No.`, `Birthday`).
  - **Account Information**: `Email` / username (`adoe_admin`) + masked password (`••••••••••••••••`) with `Change password` link.
- **Edit Mode**:
  - Editable form inputs with smooth rounded pills (`Name`, `Mobile No.`, `Birthday`).
  - Actions: Yellow `Save Changes` pill button and `Cancel` button.
- **Change Password Workflow**:
  - Modal with `Current Password`, `New Password` (with show/hide toggle), and confirmation.
  - Calls `authApi.changePassword()`.
- **Toast Feedback**:
  - `Saved Changes ✓` (Green pill toast on successful update).
  - `Changes not Saved ×` (Blue pill toast on cancel/revert).

---

## 5. UI & Card Visuals

- **Default State**: Soft light blue card (`#DDF4FF`) with inner pill container (`#BAE6FD`) enclosing filled icon + identifier.
- **Hovered State**: Warm yellow card (`#FEF6D1`) with gold inner pill container (`#FEECA5`) and gold icon.
- **Locked Single-Line Controls**: Prevents layout distortion across search input and active filter badges.
- **Compact & Proportional Sizing**: Reduced padding and icon dimensions for a clean dashboard view.

---

## 6. Verification
- `npm run build` passes with **0 errors**.
- `src/api/` folder remains untouched.

