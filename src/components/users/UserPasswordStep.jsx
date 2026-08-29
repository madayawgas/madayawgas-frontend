import Button from "../ui/Button";

export default function UserPasswordStep({
  adminPassword,
  setAdminPassword,
  showPassword,
  setShowPassword,
  passwordError,
  setPasswordError,
  isVerifying,
  currentUser,
  onProceed,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (adminPassword && !isVerifying) {
          onProceed();
        }
      }}
      className="px-8 pb-8 overflow-y-auto max-h-[85vh]"
    >
      <p className="text-gray-700 text-[15px] mb-6">
        For security, please enter your password to confirm this action.
      </p>

      <input
        type="text"
        name="username"
        value={currentUser?.username || ""}
        autoComplete="username"
        readOnly
        className="sr-only"
        tabIndex="-1"
      />

      <div className="relative mb-2">
        <input
          type={showPassword ? "text" : "password"}
          name="admin_confirm_password"
          id="admin_confirm_password"
          value={adminPassword}
          onChange={(e) => {
            setAdminPassword(e.target.value);
            if (passwordError) setPasswordError("");
          }}
          placeholder="****************"
          autoComplete="current-password"
          className={`w-full bg-[#F3F5F5] text-gray-800 text-sm px-4 py-3.5 rounded-full outline-none focus:ring-2 ${
            passwordError ? "border-2 border-red-500 focus:ring-red-200" : "focus:ring-[#0B4A6E]/20"
          } pr-12`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          )}
        </button>
      </div>

      {passwordError && (
        <p className="text-red-500 text-xs ml-4 mb-4 font-semibold">{passwordError}</p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="submit"
          disabled={!adminPassword || isVerifying}
          className="w-full py-3.5 bg-[#C93B32] hover:bg-[#a8322a] disabled:opacity-50 disabled:cursor-not-allowed border-none !text-white rounded-full font-bold uppercase tracking-widest text-[11px] transition-colors cursor-pointer"
        >
          {isVerifying ? "VERIFYING..." : "PROCEED"}
        </Button>
      </div>
    </form>
  );
}