// src/pages/Layout.jsx
import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Truck, Users } from "lucide-react";

export default function Layout() {
  // Very basic active state: just turns gray and bold when you are on that page
  const navClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded mb-1 text-gray-700 ${
      isActive ? "bg-gray-200 font-bold text-black" : "hover:bg-gray-100"
    }`;

  return (
    // MAIN WRAPPER
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden text-gray-900">
      {/* SIDEBAR (Light gray with a right border) */}
      <aside className="w-64 bg-gray-50 border-r border-gray-300 flex flex-col z-20">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-gray-300">
          <h1 className="text-xl font-bold">MadayawGas Admin</h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4">
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/fleet" className={navClass}>
            <Truck size={18} />
            <span>Fleet Board</span>
          </NavLink>

          <NavLink to="/users" className={navClass}>
            <Users size={18} />
            <span>Users</span>
          </NavLink>
        </nav>

        {/* Bottom / Logout */}
        <div className="p-4 border-t border-gray-300">
          <button className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-200 rounded">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Top Navbar (Plain white with bottom border) */}
        <header className="h-16 bg-white border-b border-gray-300 flex items-center justify-between px-6 z-10">
          <h2 className="text-gray-600">Prototype Environment</h2>
          <div className="text-sm text-gray-500">Logged in as: Superadmin</div>
        </header>

        {/* The Actual Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          {/* This is where the Fleet or Dashboard component gets injected */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
