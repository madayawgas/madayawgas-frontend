// src/pages/Layout.jsx
import { useState, useRef, useEffect } from "react";
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
  Layers,
  History,
  UserRound,
  HelpCircle,
  Calendar,
  Scale,
  ClipboardList,
  Tag,
  Briefcase,
  MapPin,
  ChevronDown,
  Wrench,
  Fuel,
  FileWarning,
  PackageCheck,
} from "lucide-react";
import logo from "../assets/logov2.svg";
import Avatar from "../components/ui/Avatar.jsx";
import ForceChangePasswordModal from "../components/auth/ForceChangePasswordModal.jsx";
import EmergencyAlertBanner from "../components/alerts/EmergencyAlertBanner.jsx";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const { isAuthenticated, currentUser, can, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close user dropdown on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setOpen(false);
  }, [location.pathname]);

  const getPageTitle = (pathname) => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/route-planner")) return "Route Planner";
    if (pathname.startsWith("/return-checkin") || pathname.startsWith("/route-dispatch/check-in")) return "Return Stock Check-In";
    if (pathname.startsWith("/route-dispatch") || pathname.startsWith("/reconciliation")) return "Today's Dispatches";
    if (pathname.startsWith("/inventory/plant")) return "Plant Warehouse";
    if (pathname.startsWith("/inventory/transfers")) return "Transfer Records";
    if (pathname.startsWith("/inventory/products") || pathname.startsWith("/item-profile")) return "Products Catalog";
    if (pathname.startsWith("/fleet")) {
      const search = location.search;
      if (search.includes("tab=fuel")) return "Fuel Monitoring";
      if (search.includes("tab=apprehensions")) return "Driver Roadside Citations";
      if (search.includes("tab=work-orders") || search.includes("tab=logs") || search.includes("tab=analytics")) return "Fleet Maintenance Hub";
      return "Fleet Board";
    }
    if (pathname.startsWith("/sales-delivery")) return "Sales and Delivery";
    if (pathname.startsWith("/customers") || pathname.startsWith("/customer")) return "Customer Profile";
    if (pathname.startsWith("/users")) return "User Management";
    if (pathname.startsWith("/history-log")) return "History Log";
    if (pathname.startsWith("/settings/zones") || pathname.startsWith("/service-zones")) return "Service Delivery Zones";
    if (pathname.startsWith("/profile")) return "Account Settings";
    if (pathname.startsWith("/faqs") || pathname.startsWith("/help")) return "System FAQs & Guide";
    return "Madayaw Gas";
  };

  const pageTitle = getPageTitle(location.pathname);

  // If loading session check on refresh, show lightweight fallback
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <p className="text-[#0A4B6E] font-semibold text-sm">Loading session...</p>
      </div>
    );
  }

  // Security Bouncer
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 text-[13px] font-semibold transition-all ${
      isActive
        ? "bg-[#FFDF2C] text-[#0A4B6E] font-bold shadow-2xs"
        : "text-white/85 hover:text-white hover:bg-white/10"
    }`;

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:static z-30 top-0 left-0 h-full w-[225px] max-w-[225px] min-w-[225px] bg-[#0E384E] flex flex-col justify-between text-white transform transition-transform duration-300 shrink-0
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex flex-col h-full min-h-0 flex-1">
          {/* Logo Header matching top navbar height */}
          <div className="flex items-center gap-2.5 px-3.5 h-[60px] border-b border-white/10 shrink-0">
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

          {/* EXACT ROUTE LINKS - SCROLLABLE CONTAINER */}
          <nav
            className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2.5 py-2.5 ${
              currentUser?.mustChangePassword
                ? "pointer-events-none opacity-40 select-none"
                : ""
            }`}
          >
            {/* 1. STANDALONE DASHBOARD */}
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

            {/* 2. TRIP OPERATIONS */}
            {(can(PERMISSIONS.ROUTE_VIEW) ||
              can(PERMISSIONS.ROUTE_MANAGE) ||
              can(PERMISSIONS.ROUTE_VIEW_OWN)) && (
              <>
                <div className="pt-2.5 pb-1 px-3 select-none">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-white/45">
                    Trip Operations
                  </p>
                </div>

                <NavLink
                  to="/route-planner"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <Calendar size={17} className="shrink-0" />
                  <span>Route Planner</span>
                </NavLink>

                <NavLink
                  to="/route-dispatch"
                  end
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <Truck size={17} className="shrink-0" />
                  <span>Today's Dispatches</span>
                </NavLink>

                <NavLink
                  to="/return-checkin"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <PackageCheck size={17} className="shrink-0" />
                  <span>Return Stock Check-In</span>
                </NavLink>

                <NavLink
                  to="/settings/zones"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <MapPin size={17} className="shrink-0" />
                  <span>Delivery Zones</span>
                </NavLink>
              </>
            )}

            {/* 3. INVENTORY */}
            {can(PERMISSIONS.INVENTORY_VIEW) && (
              <>
                <div className="pt-2.5 pb-1 px-3 select-none">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-white/45">
                    Inventory
                  </p>
                </div>

                <NavLink
                  to="/inventory/plant"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <Layers size={17} className="shrink-0" />
                  <span>Plant Warehouse</span>
                </NavLink>

                <NavLink
                  to="/inventory/transfers"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <ClipboardList size={17} className="shrink-0" />
                  <span>Transfer Records</span>
                </NavLink>

                <NavLink
                  to="/inventory/products"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <Tag size={17} className="shrink-0" />
                  <span>Products</span>
                </NavLink>
              </>
            )}

            {/* 4. FLEET */}
            {(can(PERMISSIONS.FLEET_VIEW) || can(PERMISSIONS.FLEET_MANAGE)) && (
              <>
                <div className="pt-2.5 pb-1 px-3 select-none">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-white/45">
                    Fleet & Maintenance
                  </p>
                </div>

                <NavLink
                  to="/fleet"
                  end
                  className={({ isActive }) => {
                    const isFleetActive =
                      isActive &&
                      (!location.search || location.search.includes("tab=vehicles"));
                    return `flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 text-[13px] font-semibold transition-all ${
                      isFleetActive
                        ? "bg-[#FFDF2C] text-[#0A4B6E] font-bold shadow-2xs"
                        : "text-white/85 hover:text-white hover:bg-white/10"
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <Truck size={17} className="shrink-0" />
                  <span>Fleet Board</span>
                </NavLink>

                <NavLink
                  to="/fleet?tab=work-orders"
                  className={() => {
                    const isMaintActive =
                      location.pathname.startsWith("/fleet") &&
                      (location.search.includes("tab=work-orders") ||
                        location.search.includes("tab=logs") ||
                        location.search.includes("tab=analytics"));
                    return `flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 text-[13px] font-semibold transition-all ${
                      isMaintActive
                        ? "bg-[#FFDF2C] text-[#0A4B6E] font-bold shadow-2xs"
                        : "text-white/85 hover:text-white hover:bg-white/10"
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <Wrench size={17} className="shrink-0" />
                  <span>Maintenance Hub</span>
                </NavLink>

                <NavLink
                  to="/fleet?tab=fuel"
                  className={() => {
                    const isFuelActive =
                      location.pathname.startsWith("/fleet") &&
                      location.search.includes("tab=fuel");
                    return `flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 text-[13px] font-semibold transition-all ${
                      isFuelActive
                        ? "bg-[#FFDF2C] text-[#0A4B6E] font-bold shadow-2xs"
                        : "text-white/85 hover:text-white hover:bg-white/10"
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <Fuel size={17} className="shrink-0" />
                  <span>Fuel Monitoring</span>
                </NavLink>

                <NavLink
                  to="/fleet?tab=apprehensions"
                  className={() => {
                    const isApprehensionActive =
                      location.pathname.startsWith("/fleet") &&
                      location.search.includes("tab=apprehensions");
                    return `flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 text-[13px] font-semibold transition-all ${
                      isApprehensionActive
                        ? "bg-[#FFDF2C] text-[#0A4B6E] font-bold shadow-2xs"
                        : "text-white/85 hover:text-white hover:bg-white/10"
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <FileWarning size={17} className="shrink-0" />
                  <span>Driver Citations</span>
                </NavLink>
              </>
            )}

            {/* 5. SALES */}
            {(can(PERMISSIONS.SALES_VIEW) || can(PERMISSIONS.SALES_VIEW_OWN)) && (
              <>
                <div className="pt-2.5 pb-1 px-3 select-none">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-white/45">
                    Sales
                  </p>
                </div>

                <NavLink
                  to="/sales-delivery"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <Briefcase size={17} className="shrink-0" />
                  <span>Sales & Delivery</span>
                </NavLink>

                <NavLink
                  to="/customers"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <UserRound size={17} className="shrink-0" />
                  <span>Customers</span>
                </NavLink>
              </>
            )}

            {/* 6. SYSTEM */}
            {(can(PERMISSIONS.USERS_VIEW) || can(PERMISSIONS.HISTORY_VIEW)) && (
              <>
                <div className="pt-2.5 pb-1 px-3 select-none">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-white/45">
                    System
                  </p>
                </div>

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
              </>
            )}
          </nav>
        </div>

        {/* BOTTOM SIDEBAR FOOTER: SYSTEM GUIDE */}
        <div className="px-2.5 py-3 border-t border-white/10 shrink-0">
          <NavLink
            to="/faqs"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#FFDF2C] text-[#0A4B6E] font-bold shadow-2xs"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`
            }
            onClick={() => setOpen(false)}
          >
            <HelpCircle size={16} className="shrink-0" />
            <span>FAQs & System Guide</span>
          </NavLink>
        </div>
      </aside>

      {/* MOBILE BACKDROP */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-xs"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* TOP NAVBAR */}
        <header className="h-[60px] bg-white flex items-center justify-between px-4 md:px-6 text-slate-800 shrink-0 border-b border-slate-200/90 shadow-2xs z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden p-1.5 rounded-lg text-[#0A4B6E] hover:bg-[#E8F3F8] transition cursor-pointer"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-[#1B4B75] tracking-tight truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 ml-auto relative" ref={userMenuRef}>
            {/* User Profile Interactive Trigger */}
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none border border-transparent hover:border-slate-200"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <Avatar
                src={currentUser?.avatarUrl}
                storageKey={currentUser?.avatarMediaKey}
                name={`${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || currentUser?.username}
                size="sm"
              />
              <div className="leading-tight text-left hidden sm:block">
                <p className="text-xs font-bold text-[#0A4B6E] truncate max-w-[140px]">
                  {currentUser?.firstName && currentUser?.lastName
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : currentUser?.username || "Staff User"}
                </p>
                <div className="text-[10px] font-semibold text-[#854D0E] bg-[#FFDF2C] px-2 py-0.2 rounded-full inline-block mt-0.5 truncate max-w-[140px]">
                  {formatUserRoles(currentUser, "Staff")}
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-[#6D8AA2] transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User Profile Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-scale-in text-left">
                {/* User Info Header */}
                <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                  <Avatar
                    src={currentUser?.avatarUrl}
                    storageKey={currentUser?.avatarMediaKey}
                    name={`${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || currentUser?.username}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0A4B6E] truncate">
                      {currentUser?.firstName && currentUser?.lastName
                        ? `${currentUser.firstName} ${currentUser.lastName}`
                        : "Staff User"}
                    </p>
                    <p className="text-[11px] text-[#6D8AA2] truncate mt-0.5">
                      @{currentUser?.username || "user"}
                    </p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <NavLink
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-[#E8F3F8] text-[#0A4B6E]"
                          : "text-slate-700 hover:bg-slate-50 hover:text-[#0A4B6E]"
                      }`
                    }
                  >
                    <UserCircle size={15} className="text-[#0A4B6E]" />
                    <span>Account Settings</span>
                  </NavLink>

                  <NavLink
                    to="/faqs"
                    onClick={() => setUserMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-[#E8F3F8] text-[#0A4B6E]"
                          : "text-slate-700 hover:bg-slate-50 hover:text-[#0A4B6E]"
                      }`
                    }
                  >
                    <HelpCircle size={15} className="text-[#0A4B6E]" />
                    <span>FAQs & Guide</span>
                  </NavLink>
                </div>

                <div className="border-t border-slate-100 my-1" />

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* REAL-TIME DRIVER EMERGENCY SOS ALERT BANNER */}
        <EmergencyAlertBanner />

        {/* UNIFIED MAIN VIEWPORT */}
        <main className="flex-1 min-h-0 overflow-hidden px-4 md:px-6 py-4 animate-fade-in bg-[#F8FAFC] min-w-0 flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* FORCE CHANGE PASSWORD INESCAPABLE MODAL */}
      {currentUser?.mustChangePassword && <ForceChangePasswordModal />}
    </div>
  );
}
