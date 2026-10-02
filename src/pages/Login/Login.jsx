// src/pages/Login/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getDefaultRoute } from "../../utils/permissions.js";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import logo from "../../assets/logov2.svg";
import bgLeftCard from "../../assets/BG-Madayaw8.png";
import bgScreen from "../../assets/BG-Madayaw8.png";

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
      setError(err.message || "Invalid username or password.");
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative font-sans overflow-hidden">
  <div
    className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-md scale-105"
    style={{ backgroundImage: `url(${bgScreen})` }}
  />

  <div className="relative z-10 w-full max-w-3xl lg:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 md:p-9 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-stretch animate-scale-in">
    <div
      className="md:col-span-5 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-start bg-cover bg-center relative overflow-hidden min-h-[260px] md:min-h-[380px] shadow-2xs"
      style={{ backgroundImage: `url(${bgLeftCard})` }}
    >
      <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-white leading-tight">
        Lets save lives
        <br />
        and
        <br />
        properties
      </h2>
    </div>

    <div className="md:col-span-7 flex flex-col justify-between py-1 px-1 sm:px-2">
      <div>
        <img
          src={logo}
          alt="Madayaw Gas Logo"
          className="w-11 h-11 object-contain mb-2.5"
        />

        <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 leading-tight">
          System Login
        </h1>

        <p className="text-xs text-gray-400 mt-0.5">
          Madayaw Petroleum and Gas Corporation
        </p>

        <div className="w-full h-px bg-gray-100 my-4" />

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
                setSuccessMessage("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter username"
              disabled={loading}
              className="w-full bg-[#F3F4F6] rounded-full px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 outline-none border border-transparent focus:border-[#0F7AB2] focus:bg-white transition-all"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password
            </label>

            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                  setSuccessMessage("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                disabled={loading}
                className="w-full bg-[#F3F4F6] rounded-full pl-4 pr-16 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 outline-none border border-transparent focus:border-[#0F7AB2] focus:bg-white transition-all"
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                className="absolute right-4 text-xs font-medium text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium p-2.5 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#0E384E] hover:bg-[#0b5f8a] text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition active:scale-[0.99] text-xs sm:text-sm flex items-center justify-center cursor-pointer"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-3.5">
          <button
            type="button"
            className="text-xs text-[#0F7AB2] hover:underline font-medium cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-5">
        Madayaw Gas Fleet System © 2026
      </p>
    </div>
  </div>
</div>
  );
}

