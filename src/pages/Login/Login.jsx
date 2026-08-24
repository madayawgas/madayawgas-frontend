import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import logo from "../../assets/logo.svg";
import bgImage from "../../assets/BG-Madayaw5.png";

export default function Login() {
  const { login } = useData();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    setTimeout(() => {
      const result = login(username, password);
      if (result.success) {
        if (result.user.roleName === "DRIVER") {
          navigate("/sales-delivery"); 
        } else {
          navigate("/dashboard"); 
        }
      } else {
        setError(result.message || "Invalid username or password");
      }
      setLoading(false);
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"></div>

      {/* Main Container Card using your custom Card component */}
      <Card className="w-full max-w-4xl p-6 md:p-8 relative z-10 bg-white rounded-[3rem] border border-gray-300 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch min-h-[520px]">
        
        {/* ================= LEFT BRANDING PANEL ================= */}
        <div className="bg-[#0F7AB2] rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden text-white min-h-[350px]">
          <div className="z-10">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Lets save lives <br /> and <br /> properties
            </h1>
          </div>

          {/* Spiky Yellow Shape */}
          <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-[#F5C219] z-0">
            <svg
              className="absolute -top-12 left-0 w-full h-12"
              viewBox="0 0 500 100"
              preserveAspectRatio="none"
            >
              <polygon
                points="0,100 500,100 500,60 450,20 400,80 340,10 280,70 230,30 170,90 120,20 60,60 0,20"
                fill="#F5C219"
              />
            </svg>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL ================= */}
        <div className="flex flex-col justify-center px-2 md:px-4">
          
          {/* HEADER */}
          <div className="flex flex-col items-start mb-6">
            <div className="w-16 h-16 mb-2">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>

            <h2 className="text-3xl font-bold text-gray-800">
              System Login
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Madayaw Petroleum and Gas Corporation
            </p>

            <div className="w-full h-[1px] bg-gray-200 mt-4"></div>
          </div>

          {/* FORM */}
          <div className="flex flex-col gap-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter username"
              disabled={loading}
              error={!!error}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                disabled={loading}
                error={!!error}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-xs text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              className="w-full py-3 text-base mt-2 bg-[#0F7AB2] hover:bg-[#0B6594] text-white rounded-lg transition"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>

            <div className="text-center mt-3">
              <a href="#forgot" className="text-xs text-[#0F7AB2] hover:underline">
                Forgot Password?
              </a>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-400">
              Madayaw Gas Fleet System © {new Date().getFullYear()}
            </p>
          </div>

        </div>

      </Card>
    </div>
  );
}