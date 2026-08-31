import { useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { PERMISSIONS } from "../utils/permissions.js";
import {
  LayoutDashboard,
  Truck,
  Users,
  LogOut,
  UserCircle,
  Menu,
  Route,
  ClipboardList,
  Layers,
  ReceiptText,
  History,
  UserRound,
} from "lucide-react";
import logo from "../assets/logo-outlined.svg";

export default function Layout() {
  const [open, setOpen] = useState(false);

  const { isAuthenticated, currentUser, can, logout, loading } = useAuth();
  const navigate = useNavigate();

  // If loading session check on refresh, show lightweight fallback
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F2F2F2]">
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
    `flex items-center gap-3 px-4 py-3 rounded-[27px] mb-2 text-[14px] font-semibold transition ${
      isActive
        ? "bg-[#FFDF2C] text-[#0F7AB2]"
        : "text-white hover:bg-white/10"
    }`;

  return (
    <div className="flex h-screen w-full bg-[#F2F2F2] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static z-30 top-0 left-0 h-full w-[260px] bg-[#0A4B6E] flex flex-col justify-between text-white transform transition-transform duration-300 shrink-0
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div>
          <div className="flex items-center gap-3 px-4 h-[80px]">
            <img src={logo} alt="logo" className="w-10 h-10 shrink-0" />
            <div className="leading-tight">
              <h1 className="text-[13px] font-bold">
                Madayaw Petroleum
              </h1>
              <p className="text-[13px] font-bold">
                and Gas Corporation
              </p>
            </div>
          </div>

          {/* EXACT ROUTE LINKS */}
          <nav className="mt-4 px-3">
            {can(PERMISSIONS.DASHBOARD_VIEW) && (
              <NavLink
                to="/dashboard"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={22} className="shrink-0" />
                <span>Dashboard</span>
              </NavLink>
            )}

            {can(PERMISSIONS.FLEET_VIEW) && (
              <NavLink
                to="/fleet"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Truck size={22} className="shrink-0" />
                <span>Fleet Board</span>
              </NavLink>
            )}

            {can(PERMISSIONS.ROUTE_VIEW) && (
              <NavLink
                to="/route-dispatch"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Route size={22} className="shrink-0" />
                <span>Route Dispatch</span>
              </NavLink>
            )}

            {can(PERMISSIONS.INVENTORY_VIEW) && (
              <NavLink
                to="/item-profile"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Layers size={22} className="shrink-0" />
                <span>Item Profile</span>
              </NavLink>
            )}

            {can(PERMISSIONS.SALES_VIEW) && (
              <NavLink
                to="/sales-delivery"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <ReceiptText size={22} className="shrink-0" />
                <span>Sales and Delivery</span>
              </NavLink>
            )}

            {(can(PERMISSIONS.SALES_VIEW) || can(PERMISSIONS.SALES_VIEW_OWN)) && (
              <NavLink
                to="/customers"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <UserRound size={26} />
                <span>Customer</span>
              </NavLink>
            )}

            {can(PERMISSIONS.USERS_VIEW) && (
              <NavLink
                to="/users"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Users size={22} className="shrink-0" />
                <span>Manage Users</span>
              </NavLink>
            )}

            {can(PERMISSIONS.HISTORY_VIEW) && (
              <NavLink
                to="/history-log"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <History size={22} className="shrink-0" />
                <span>History Log</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* BOTTOM ACTIONS: PROFILE & LOGOUT */}
        <div className="px-4 pb-8 flex items-center justify-around">
          <NavLink
            to="/profile"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 text-[14px] font-semibold transition ${
                isActive ? "text-[#FFDF2C]" : "text-white hover:opacity-80"
              }`
            }
          >
            <UserCircle size={24} />
            <span>Profile</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[14px] font-semibold text-white hover:opacity-80 transition cursor-pointer"
          >
            <LogOut size={22} />
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
      <div className="flex-1 flex flex-col h-screen">
        <header className="h-[80px] bg-[#0A4B6E] flex items-center justify-between px-6 text-white">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setOpen(true)}>
              <Menu size={28} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <UserCircle size={38} className="text-[#FFDF2C]" />
            <div className="leading-tight">
              <p className="text-[14px] md:text-[16px] font-semibold">
                {currentUser?.firstName && currentUser?.lastName
                  ? `${currentUser.firstName} ${currentUser.lastName}`
                  : "Super Admin"}
              </p>
              <div className="text-[12px] md:text-[14px] font-medium opacity-90 tracking-wide text-[#FFDF2C]">
                {currentUser?.role || "Super Admin"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in bg-[#F2F2F2]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}