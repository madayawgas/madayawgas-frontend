import { useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext"; // <-- Import your brain!
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
  
  // Bring in the auth state and functions from Context
  const { isAuthenticated, currentUser, hasPermission, logout } = useData();
  const navigate = useNavigate();

  // SECURITY: If they bypassed login, kick them out before rendering
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Handle actual logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Navigation active state
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl mb-2 text-[13px] md:text-[16px] font-semibold transition ${
      isActive ? "bg-[#FFDF2C] text-[#0F7AB2]" : "text-white hover:bg-white/10"
    }`;

  return (
    // MAIN WRAPPER
    <div className="flex h-screen w-full bg-[#F2F2F2] font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static z-30 top-0 left-0 h-full w-[350px] bg-[#0F7AB2] flex flex-col justify-between text-white transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div>
          {/* Logo Area */}
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

          {/* Navigation Links - Now Protected by Permissions! */}
          <nav className="mt-4 px-2">
            {hasPermission("dashboard") && (
              <NavLink to="/app/dashboard" className={navClass} onClick={() => setOpen(false)}>
                <LayoutDashboard size={26} />
                <span>Dashboard</span>
              </NavLink>
            )}

            {hasPermission("fleet") && (
              <NavLink to="/fleet" className={navClass} onClick={() => setOpen(false)}>
                <Truck size={26} />
                <span>Fleet and Maintenance</span>
              </NavLink>
            )}

            {hasPermission("route-dispatch") && (
              <NavLink to="/route-dispatch" className={navClass} onClick={() => setOpen(false)}>
                <Route size={26} />
                <span>Route Dispatch</span>
              </NavLink>
            )}

            {hasPermission("inventory") && (
              <NavLink to="/inventory" className={navClass} onClick={() => setOpen(false)}>
                <ClipboardList size={26} />
                <span>Inventory</span>
              </NavLink>
            )}

            {hasPermission("sales-delivery") && (
              <NavLink to="/sales-delivery" className={navClass} onClick={() => setOpen(false)}>
                <ReceiptText size={26} />
                <span>Sales and Delivery</span>
              </NavLink>
            )}

            {hasPermission("users") && (
              <NavLink to="/users" className={navClass} onClick={() => setOpen(false)}>
                <Users size={26} />
                <span>Manage Users</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Bottom / Logout */}
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

      {/* Overlay (Mobile only) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen">
        
        {/* Top Navbar */}
        <header className="h-[80px] bg-[#0F7AB2] flex items-center justify-between px-6 text-white">
          
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setOpen(true)}>
              <Menu size={28} />
            </button>
          </div>

          {/* Dynamic User Info */}
          <div className="flex items-center gap-3">
            <UserCircle size={38} className="text-[#FFDF2C]"/>
            <div className="leading-tight">
              <p className="text-[14px] md:text-[16px] font-semibold">
                {currentUser?.name || "Loading..."} {/* Dynamic Name! */}
              </p>
              <div className="text-[12px] md:text-[14px] font-medium opacity-90 tracking-wide text-[#FFDF2C]">
                {currentUser?.roleName?.replace('_', ' ')} {/* Dynamic Role! */}
              </div>
            </div>
          </div>
        </header>

        {/* The Actual Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in bg-[#F2F2F2]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}