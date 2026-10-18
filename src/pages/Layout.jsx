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
  Settings,
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
} from "lucide-react";
import logo from "../assets/logov2.svg";
import ForceChangePasswordModal from "../components/auth/ForceChangePasswordModal.jsx";
import EmergencyAlertBanner from "../components/alerts/EmergencyAlertBanner.jsx";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const hoverTimerRef = useRef(null);
  const settingsMenuRef = useRef(null);

  const { isAuthenticated, currentUser, can, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowSettingsMenu(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowSettingsMenu(false);
    }, 280); // 280ms grace delay to ensure frictionless hover transition
  };

  // Click-outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const getPageTitle = (pathname) => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/route-planner")) return "Route Planner";
    if (pathname.startsWith("/route-dispatch")) return "Today's Dispatches";
    if (pathname.startsWith("/reconciliation")) return "Stock Check-In & Settlement";
    if (pathname.startsWith("/inventory/plant")) return "Plant Warehouse";
    if (pathname.startsWith("/inventory/transfers")) return "Transfer Records";
    if (pathname.startsWith("/inventory/products") || pathname.startsWith("/item-profile")) return "Products Catalog";
    if (pathname.startsWith("/fleet")) return "Fleet Board";
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
            className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 py-2 ${
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
            {(can(PERMISSIONS.ROUTE_VIEW) || can(PERMISSIONS.ROUTE_MANAGE) || can(PERMISSIONS.ROUTE_VIEW_OWN)) && (
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
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <Truck size={17} className="shrink-0" />
                  <span>Today's Dispatches</span>
                </NavLink>

                <NavLink
                  to="/reconciliation"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <Scale size={17} className="shrink-0" />
                  <span>Stock Check-In</span>
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
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <Truck size={17} className="shrink-0" />
                  <span>Fleet Board</span>
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
                  <span>Sales and Delivery</span>
                </NavLink>

                <NavLink
                  to="/customers"
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <UserRound size={17} className="shrink-0" />
                  <span>Customer</span>
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

        {/* BOTTOM ACTIONS: SETTINGS (POPOVER FOR PROFILE, SERVICE ZONES & FAQS) & LOGOUT */}
        <div className="px-3 py-3.5 flex items-center justify-around border-t border-white/10 relative shrink-0">
          {/* Settings Trigger & Flyout Popover Container */}
          <div
            ref={settingsMenuRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            {/* Settings Flyout Popover */}
            {showSettingsMenu && (
              <div
                className="absolute bottom-full mb-1 left-0 z-50 w-56 bg-white text-slate-800 rounded-2xl shadow-xl border border-[#BCE1F1] p-1.5 animate-scale-in text-left
                after:content-[''] after:absolute after:-bottom-3 after:left-0 after:right-0 after:h-4 after:bg-transparent"
              >
                <div className="p-2 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-bold text-[#0A4B6E] truncate">
                    {currentUser?.firstName && currentUser?.lastName
                      ? `${currentUser.firstName} ${currentUser.lastName}`
                      : "User Account"}
                  </p>
                  <p className="text-[10px] text-[#6D8AA2] truncate">
                    {currentUser?.username || "Signed in"}
                  </p>
                </div>

                <NavLink
                  to="/profile"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setOpen(false);
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#E8F3F8] text-[#0A4B6E] font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-[#0A4B6E]"
                    }`
                  }
                >
                  <div className="w-6 h-6 rounded-lg bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center shrink-0">
                    <UserCircle size={14} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="leading-tight">Profile</p>
                    <p className="text-[10px] text-slate-400 font-normal">Account & password</p>
                  </div>
                </NavLink>

                {/* Service Delivery Zones in Settings Popover */}
                {(can(PERMISSIONS.ROUTE_VIEW) || can(PERMISSIONS.ROUTE_MANAGE) || can(PERMISSIONS.ROUTE_VIEW_OWN)) && (
                  <NavLink
                    to="/settings/zones"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      setOpen(false);
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all mt-0.5 ${
                        isActive
                          ? "bg-[#E8F3F8] text-[#0A4B6E] font-bold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-[#0A4B6E]"
                      }`
                    }
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#0A4B6E]/10 text-[#0A4B6E] flex items-center justify-center shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="leading-tight">Service Delivery Zones</p>
                      <p className="text-[10px] text-slate-400 font-normal">Route zone coverage</p>
                    </div>
                  </NavLink>
                )}

                <NavLink
                  to="/faqs"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setOpen(false);
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all mt-0.5 ${
                      isActive
                        ? "bg-[#E8F3F8] text-[#0A4B6E] font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-[#0A4B6E]"
                    }`
                  }
                >
                  <div className="w-6 h-6 rounded-lg bg-[#FFDF2C]/30 text-[#0A4B6E] flex items-center justify-center shrink-0">
                    <HelpCircle size={14} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="leading-tight">FAQs & Guide</p>
                    <p className="text-[10px] text-slate-400 font-normal">System operations</p>
                  </div>
                </NavLink>
              </div>
            )}

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setShowSettingsMenu((prev) => !prev)}
              className={`flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer px-2.5 py-1.5 rounded-lg ${
                location.pathname.startsWith("/profile") ||
                location.pathname.startsWith("/faqs") ||
                location.pathname.startsWith("/settings/zones")
                  ? "text-[#FFDF2C]"
                  : "text-white/85 hover:text-white"
              }`}
            >
              <Settings size={17} />
              <span>Settings</span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/85 hover:text-white transition cursor-pointer px-2.5 py-1.5 rounded-lg"
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
        <header className="h-[60px] bg-white flex items-center justify-between px-4 md:px-8 text-slate-800 shrink-0 border-b border-slate-200/80 shadow-2xs">
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

        {/* REAL-TIME DRIVER EMERGENCY SOS ALERT BANNER */}
        <EmergencyAlertBanner />

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-3 md:py-4 animate-fade-in bg-white min-w-0">
          <Outlet />
        </main>
      </div>

      {/* FORCE CHANGE PASSWORD INESCAPABLE MODAL */}
      {currentUser?.mustChangePassword && <ForceChangePasswordModal />}
    </div>
  );
}