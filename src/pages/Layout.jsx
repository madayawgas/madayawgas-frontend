// src/pages/Layout.jsx
import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
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

  // Navigation active state (yellow background when active)
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl mb-2 text-[13px] md:text-[16px] font-semibold transition ${
      isActive ? "bg-[#FFDF2C] text-[#0F7AB2]" : "text-white hover:bg-white/10"
    }`;

  return (
    // MAIN WRAPPER
    <div className="flex h-screen w-full bg-[#F2F2F2] font-sans overflow-hidden">
      {/* SIDEBAR (Blue background) */}
      <aside
        className={`fixed md:static z-30 top-0 left-0 h-full w-[350px] bg-[#0F7AB2] flex flex-col justify-between text-white transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Top Section */}
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

          {/* Navigation Links */}
          <nav className="mt-4 px-2">
            <NavLink to="/dashboard" className={navClass}>
              <LayoutDashboard size={26} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/fleet" className={navClass}>
              <Truck size={26} />
              <span>Fleet and Maintenance</span>
            </NavLink>

            <NavLink to="/route-dispatch" className={navClass}>
              <Route size={26} />
              <span>Route Dispatch</span>
            </NavLink>

            <NavLink to="/inventory" className={navClass}>
              <ClipboardList size={26} />
              <span>Inventory</span>
            </NavLink>

            <NavLink to="/sales-delivery" className={navClass}>
              <ReceiptText size={26} />
              <span>Sales and Delivery</span>
            </NavLink>

            <NavLink to="/users" className={navClass}>
              <Users size={26} />
              <span>Manage Users</span>
            </NavLink>
          </nav>
        </div>

        {/* Bottom / Logout */}
        <div className="px-4 pb-5">
          <button className="flex items-center gap-3 text-[13px] md:text-[16px] font-semibold hover:opacity-80">
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
        
        {/* Top Navbar (Blue header with user info) */}
        <header className="h-[80px] bg-[#0F7AB2] flex items-center justify-between px-6 text-white">
          
          {/* Left Side (Menu button on mobile) */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu size={28} />
            </button>
          </div>

          {/* Right Side / User Info */}
          <div className="flex items-center gap-3">
            <UserCircle size={38} className="text-[#FFDF2C]"/>
            <div className="leading-tight">
              <p className="text-[14px] md:text-[16px] font-semibold">
                Alejandro Doe
              </p>
              <div className="text-[12px] md:text-[14px] font-medium opacity-90">
                System Admin
              </div>
            </div>
          </div>
        </header>

        {/* The Actual Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* This is where the Fleet or Dashboard component gets injected */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}