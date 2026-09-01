import Button from "../ui/Button";

export default function ResetPasswordModal({ user, onClose, onConfirm }) {
  if (!user || user?.role === "Super Admin") return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-[#0B4A6E] mb-4">
          Reset Password?
        </h2>

        <p className="text-gray-800 mb-8 leading-relaxed text-[15px]">
          Resetting <span className="font-semibold text-gray-900">{user.firstName} {user.lastName}</span>'s
          {" "}password will generate a new temporary password and terminate all active sessions for this user. The user will be required to change their password upon their next login.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => onConfirm(user)}
            className="w-full py-3 bg-[#CD3E3E] border-none !text-white rounded-full font-semibold uppercase tracking-widest text-sm hover:bg-[#b83737] transition-colors"
          >
            CONTINUE
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-transparent border-none !text-[#0B4A6E] font-semibold uppercase tracking-widest text-sm hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
          >
            CANCEL
          </Button>
        </div>
      </div>
    </div>
  );
}
