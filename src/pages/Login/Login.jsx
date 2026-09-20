// src/pages/Login/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getDefaultRoute } from "../../utils/permissions.js";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  Truck,
  Flame,
} from "lucide-react";

import logo from "../../assets/logo-outlined.svg";
import bgImage from "../../assets/BG-Madayaw5.png";

export default function Login() {
  const { login, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ""
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect directly to user's landing page
  if (isAuthenticated && currentUser) {
    return <Navigate to={getDefaultRoute(currentUser)} replace />;
  }

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await login(username.trim(), password);
      const destination = getDefaultRoute(user);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid username or password. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-cover bg-center bg-no-repeat relative font-sans"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Neutral Dark Overlay (Not Bluish) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" />

      {/* Main Container Card (No White Border Line) */}
      <div className="w-full max-w-4xl relative z-10 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[540px] animate-scale-in">
        
        {/* ================= LEFT BRANDING HERO PANEL (Solid Navy, No Gradient, No White Border) ================= */}
        <div className="md:col-span-5 bg-[#0A4B6E] p-7 md:p-9 flex flex-col justify-between text-white min-h-[280px] md:min-h-[540px]">
          {/* Top Brand Identity */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Madayaw Petroleum and Gas Logo"
                className="w-11 h-11 object-contain shrink-0"
              />
              <div className="leading-tight">
                <h1 className="text-[13px] font-bold text-white tracking-wide">
                  Madayaw Petroleum
                </h1>
                <p className="text-[13px] font-bold text-[#FFDF2C] tracking-wide">
                  and Gas Corporation
                </p>
              </div>
            </div>
          </div>

          {/* Main Slogan & Mission Statement */}
          <div className="my-auto py-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-[#FFDF2C] mb-3.5">
              <Flame size={13} className="text-[#FFDF2C]" />
              <span>Reliable LPG & Petroleum Energy</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-[30px] font-extrabold text-white leading-tight tracking-tight">
              Whatever your <br className="hidden sm:inline" />
              LPG needs, <br />
              <span className="text-[#FFDF2C] inline-block mt-0.5">
                we provide.
              </span>
            </h2>

            <p className="text-xs text-white/80 mt-3.5 leading-relaxed font-normal max-w-xs">
              Delivering safe, dependable, and efficient LPG distribution, fleet logistics, and energy solutions for homes and industries.
            </p>
          </div>

          {/* Bottom Pillar Badges */}
          <div className="pt-4 grid grid-cols-2 gap-2 text-[10.5px] text-white/90">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#FFDF2C] shrink-0" />
              <span className="truncate font-medium">Safety Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck size={14} className="text-[#FFDF2C] shrink-0" />
              <span className="truncate font-medium">Fleet Logistics</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT LOGIN FORM PANEL ================= */}
        <div className="md:col-span-7 p-7 sm:p-9 md:p-11 flex flex-col justify-between bg-white">
          {/* Header Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0A4B6E]" />
              <span className="text-[11px] font-bold text-[#6D8AA2] uppercase tracking-widest">
                Operations Management System
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A4B6E]">
              Account Login
            </h2>
            <p className="text-xs md:text-sm text-[#6D8AA2] mt-1">
              Enter your authorized credentials to access the portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0A4B6E] tracking-wide">
                Username or Email
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#6D8AA2] pointer-events-none">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                    setSuccessMessage("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your username"
                  disabled={loading}
                  className={`w-full bg-[#F3F5F5] rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-gray-800 outline-none transition-all border ${
                    error
                      ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                      : "border-gray-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20"
                  }`}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0A4B6E] tracking-wide">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#6D8AA2] pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                    setSuccessMessage("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your password"
                  disabled={loading}
                  className={`w-full bg-[#F3F5F5] rounded-full pl-10 pr-11 py-2.5 text-xs md:text-sm text-gray-800 outline-none transition-all border ${
                    error
                      ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                      : "border-gray-200 focus:border-[#0A4B6E] focus:ring-2 focus:ring-[#0A4B6E]/20"
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 p-1 text-[#6D8AA2] hover:text-[#0A4B6E] transition cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Success Alert Banner */}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium p-3 rounded-2xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Alert Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-3 rounded-2xl flex items-center gap-2 animate-fade-in">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-6 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A4B6E] border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Copyright */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6D8AA2]">
            <span>Madayaw Gas Enterprise System</span>
            <span>© {new Date().getFullYear()} All Rights Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}