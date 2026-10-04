import { useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { PERMISSIONS } from "../utils/permissions.js";
import { formatUserRoles } from "../utils/userRoles.js";
import {
  LayoutDashboard,
  Truck,
  Users,
  LogOut,
  UserCircle,
  Menu,
  Route,
  Layers,
  History,
  UserRound,
} from "lucide-react";
import logo from "../assets/logov2.svg";
import ForceChangePasswordModal from "../components/auth/ForceChangePasswordModal.jsx";

export default function Layout() {
  const [open, setOpen] = useState(false);

  const { isAuthenticated, currentUser, can, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/fleet")) return "Fleet Board";
    if (pathname.startsWith("/route-dispatch")) return "Route Dispatch";
    if (pathname.startsWith("/item-profile") || pathname.startsWith("/inventory")) return "Item Profile";
    if (pathname.startsWith("/sales-delivery")) return "Sales and Delivery";
    if (pathname.startsWith("/customers") || pathname.startsWith("/customer")) return "Customer Profile";
    if (pathname.startsWith("/users")) return "User Management";
    if (pathname.startsWith("/history-log")) return "History Log";
    if (pathname.startsWith("/profile")) return "Account Profile";
    return "Madayaw Gas";
  };

  const pageTitle = getPageTitle(location.pathname);

  // If loading session check on refresh, show lightweight fallback
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <p className="text-[#0F7AB2] font-semibold">Loading session...</p>
      </div>
    );
  }

  // SECURITY Bouncer
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-full mb-1 text-[13px] font-semibold transition-all ${
      isActive
        ? "bg-[#FFDF2C] text-[#0A4B6E] font-bold shadow-2xs"
        : "text-white/85 hover:text-white hover:bg-white/10"
    }`;

  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static z-30 top-0 left-0 h-full w-[225px] bg-[#0E384E] flex flex-col justify-between text-white transform transition-transform duration-300 shrink-0
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div>
          {/* Logo Header matching top navbar height */}
          <div className="flex items-center gap-2.5 px-3.5 h-[60px] border-b border-white/10">
            <img src={logo} alt="logo" className="w-7 h-7 shrink-0" />
            <div className="leading-tight text-left">
              <h1 className="text-xs font-bold tracking-tight text-white">
                Madayaw Petroleum
              </h1>
              <p className="text-[10px] font-medium text-white/75">
                and Gas Corporation
              </p>
            </div>
          </div>

          {/* EXACT ROUTE LINKS */}
          <nav
            className={`mt-3 px-2 ${
              currentUser?.mustChangePassword
                ? "pointer-events-none opacity-40 select-none"
                : ""
            }`}
          >
            {can(PERMISSIONS.DASHBOARD_VIEW) && (
              <NavLink
                to="/dashboard"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={17} className="shrink-0" />
                <span>Dashboard</span>
              </NavLink>
            )}

            {can(PERMISSIONS.FLEET_VIEW) && (
              <NavLink
                to="/fleet"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Truck size={17} className="shrink-0" />
                <span>Fleet Board</span>
              </NavLink>
            )}

            {can(PERMISSIONS.ROUTE_VIEW) && (
              <NavLink
                to="/route-dispatch"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Route size={17} className="shrink-0" />
                <span>Route Dispatch</span>
              </NavLink>
            )}

            {can(PERMISSIONS.INVENTORY_VIEW) && (
              <NavLink
                to="/item-profile"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Layers size={17} className="shrink-0" />
                <span>Inventory</span>
              </NavLink>
            )}

            {(can(PERMISSIONS.SALES_VIEW) || can(PERMISSIONS.SALES_VIEW_OWN)) && (
              <NavLink
                to="/sales-delivery"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Truck size={17} className="shrink-0" />
                <span>Sales and Delivery</span>
              </NavLink>
            )}

            {(can(PERMISSIONS.SALES_VIEW) || can(PERMISSIONS.SALES_VIEW_OWN)) && (
              <NavLink
                to="/customers"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <UserRound size={17} className="shrink-0" />
                <span>Customer</span>
              </NavLink>
            )}

            {can(PERMISSIONS.USERS_VIEW) && (
              <NavLink
                to="/users"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Users size={17} className="shrink-0" />
                <span>Manage Users</span>
              </NavLink>
            )}

            {can(PERMISSIONS.HISTORY_VIEW) && (
              <NavLink
                to="/history-log"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <History size={17} className="shrink-0" />
                <span>History Log</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* BOTTOM ACTIONS: PROFILE & LOGOUT */}
        <div className="px-3 py-3.5 flex items-center justify-around border-t border-white/10">
          <NavLink
            to="/profile"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-xs font-semibold transition ${
                currentUser?.mustChangePassword
                  ? "pointer-events-none opacity-40 select-none"
                  : isActive
                  ? "text-[#FFDF2C]"
                  : "text-white/85 hover:text-white"
              }`
            }
          >
            <UserCircle size={17} />
            <span>Profile</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/85 hover:text-white transition cursor-pointer"
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden p-6">
        {/* Slim, clean white top header with page title */}
        <header className="h-[60px] bg-white flex items-center justify-between px-4 md:px-8 text-slate-800 shrink-0 border-b border-slate-200/80 shadow-2xs z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-xl text-[#0A4B6E] hover:bg-[#E8F3F8] transition cursor-pointer"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-[#1B4B75] tracking-tight">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            {/* User Profile Container */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0 border border-[#BCE1F1]">
                <UserRound size={17} />
              </div>
              <div className="leading-tight text-left">
                <p className="text-xs sm:text-[13px] font-bold text-[#0A4B6E] truncate max-w-[120px] sm:max-w-[160px]">
                  {currentUser?.firstName && currentUser?.lastName
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : "Super Admin"}
                </p>
                <div className="text-[10px] sm:text-[11px] font-semibold text-[#854D0E] bg-[#FFDF2C] px-2 py-0.2 rounded-full inline-block mt-0.5 truncate max-w-[120px] sm:max-w-[160px]">
                  {formatUserRoles(currentUser, "Super Admin")}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-3 md:py-4 animate-fade-in bg-white min-w-0">
          <Outlet />
        </main>
      </div>

      {/* FORCE CHANGE PASSWORD INESCAPABLE MODAL */}
      {currentUser?.mustChangePassword && <ForceChangePasswordModal />}
    </div>
  );
}