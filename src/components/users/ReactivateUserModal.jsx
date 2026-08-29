import Button from "../ui/Button";

export default function ReactivateUserModal({ user, onClose, onConfirm }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-[#0B4A6E] mb-4">
          Reactivate User?
        </h2>

        <p className="text-gray-800 mb-8 leading-relaxed text-[15px]">
          {user.firstName} {user.lastName}'s account will be reactivated and
          will regain access to the system.
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
            className="w-full py-3 bg-transparent border-none !text-[#0B4A6E] font-semibold uppercase tracking-widest text-sm hover:bg-gray-50 rounded-full transition-colors"
          >
            CANCEL
          </Button>
        </div>
      </div>
    </div>
  );
}