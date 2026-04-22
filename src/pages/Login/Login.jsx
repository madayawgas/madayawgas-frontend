import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import logo from "../../assets/logo.svg";
import bgImage from "../../assets/BG-Madayaw3.png";

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
      className="min-h-screen flex items-center justify-center px-6 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      
      <div className="absolute inset-0 bg-[#0F7AB2]/0 backdrop-blur-[0px]"></div>

    <Card className="w-full max-w-md p-8 relative z-10 bg-white rounded-2xl border border-gray-300 shadow-xl">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col items-center text-center mb-10">

          <div className="w-40 h-40 mb-4 flex items-center justify-center">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>

          <h3 className="text-xl font-thin text-[#0F7AB2]">
            System Login
          </h3>

          <p className="text-xs font-thin text-[#0F7AB2] mt-2">
            Madayaw Petroleum and Gas Corporation
          </p>
        </div>

        {/* ================= FORM ================= */}
        <div className="flex flex-col gap-5">
          <Input
            label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your username"
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
              placeholder="Enter your password"
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
            className="w-full py-3 text-base mt-3"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="mt-15 text-center">
          <p className="text-xs text-gray-400">
            Madayaw Gas Fleet System © {new Date().getFullYear()}
          </p>
        </div>

      </Card>
    </div>
  );
}