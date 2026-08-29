import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Button from "../ui/Button";

export default function AdminPasswordModal({ isOpen, onClose, onSubmit }) {
  const [adminPassword, setAdminPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(adminPassword);
    setAdminPassword("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#0B4A6E]">Input Password</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#0B4A6E] hover:opacity-75 transition-opacity cursor-pointer bg-transparent border-none p-0"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        <p className="text-gray-800 mb-6 text-[15px] leading-relaxed">
          For security, please enter your password to confirm this action.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-8">
            <input
              type={showPasswordText ? "text" : "password"}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="****************"
              className="w-full bg-[#F3F5F5] text-gray-800 px-5 py-3.5 rounded-full outline-none pr-12 focus:ring-2 focus:ring-[#0B4A6E]/20"
            />
            <button
              type="button"
              onClick={() => setShowPasswordText(!showPasswordText)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#0B4A6E] hover:opacity-75 cursor-pointer bg-transparent border-none p-0"
            >
              {showPasswordText ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full py-3 bg-[#CD3E3E] border-none text-white rounded-full font-semibold uppercase tracking-widest text-sm hover:bg-[#b83737] transition-colors"
          >
            PROCEED
          </Button>
        </form>
      </div>
    </div>
  );
}