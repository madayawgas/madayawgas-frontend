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
  ReceiptText,
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
    `flex items-center gap-3 px-4 py-3 rounded-xl mb-2 text-[13px] md:text-[16px] font-semibold transition ${
      isActive
        ? "bg-[#FFDF2C] text-[#0F7AB2]"
        : "text-white hover:bg-white/10"
    }`;

  return (
    <div className="flex h-screen w-full bg-[#F2F2F2] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static z-30 top-0 left-0 h-full w-[350px] bg-[#0A4B6E] flex flex-col justify-between text-white transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div>
          <div className="flex items-center gap-3 px-4 h-[80px]">
            <img src={logo} alt="logo" className="w-12 h-12" />
            <div className="leading-tight">
              <h1 className="text-[13px] md:text-[16px] font-semibold">
                Madayaw Petroleum
              </h1>
              <p className="text-[13px] md:text-[16px] font-semibold">
                and Gas Corporation
              </p>
            </div>
          </div>

          {/* EXACT ROUTE LINKS */}
          <nav className="mt-4 px-2">
            {can(PERMISSIONS.DASHBOARD_VIEW) && (
              <NavLink
                to="/dashboard"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={26} />
                <span>Dashboard</span>
              </NavLink>
            )}

            {can(PERMISSIONS.FLEET_VIEW) && (
              <NavLink
                to="/fleet"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Truck size={26} />
                <span>Fleet and Maintenance</span>
              </NavLink>
            )}

            {can(PERMISSIONS.ROUTE_VIEW) && (
              <NavLink
                to="/route-dispatch"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Route size={26} />
                <span>Route Dispatch</span>
              </NavLink>
            )}

            {can(PERMISSIONS.INVENTORY_VIEW) && (
              <NavLink
                to="/inventory"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <ClipboardList size={26} />
                <span>Inventory</span>
              </NavLink>
            )}

            {can(PERMISSIONS.SALES_VIEW) && (
              <NavLink
                to="/sales-delivery"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <ReceiptText size={26} />
                <span>Sales and Delivery</span>
              </NavLink>
            )}

            {can(PERMISSIONS.USERS_VIEW) && (
              <NavLink
                to="/users"
                className={navClass}
                onClick={() => setOpen(false)}
              >
                <Users size={26} />
                <span>Manage Users</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* LOGOUT */}
        <div className="px-4 pb-5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-[13px] md:text-[16px] font-semibold hover:opacity-80 transition-opacity w-full text-left"
          >
            <LogOut size={24} />
            Logout
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