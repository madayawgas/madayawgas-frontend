// src/pages/Layout.jsx
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  LogOut,
  UserCircle,
} from "lucide-react";

export default function Layout() {
  // This helper function automatically applies a blue background if the link is active
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? "bg-blue-600 text-white font-medium"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-blue-400 tracking-wider">
            MadayawGas
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/fleet" className={navClass}>
            <Truck size={20} />
            <span>Fleet Board</span>
          </NavLink>

          <NavLink to="/users" className={navClass}>
            <Users size={20} />
            <span>User Management</span>
          </NavLink>
        </nav>

        {/* Bottom Area / Logout */}
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-semibold text-slate-700">Admin Portal</h2>

          {/* User Profile Mockup */}
          <div className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-md transition-colors">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700">Superadmin</p>
              <p className="text-xs text-slate-500">admin@madayawgas.com</p>
            </div>
            <UserCircle size={36} className="text-slate-400" />
          </div>
        </header>

        {/* The Actual Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Outlet is where Dashboard.jsx, Fleet.jsx, etc. will render */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
