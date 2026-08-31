import { useState, useEffect } from "react";
import UserFormStep from "./UserFormStep";
import UserConfirmStep from "./UserConfirmStep";
import UserSuccessStep from "./UserSuccessStep";

export default function UserModal({
  isOpen,
  roles,
  onSave,
  onClose,
  user,
  onResetPassword,
}) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTemporaryPassword, setCreatedTemporaryPassword] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthday: "",
    contactNo: "",
    role: "",
    username: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsSubmitting(false);
      setCreatedTemporaryPassword("");

      const defaultRole =
        roles && roles.length > 0
          ? typeof roles[0] === "string"
            ? roles[0]
            : roles[0].name
          : "Driver";

      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          birthday: user.birthday || user.birthdate || "",
          contactNo: user.phone || user.contactNumber || "",
          role: user.role || defaultRole || "",
          username: user.username || "",
          status: user.status || "ACTIVE",
        });
      } else {
        setFormData({
          firstName: "",
          lastName: "",
          birthday: "",
          contactNo: "",
          role: defaultRole,
          username: "",
          status: "ACTIVE",
        });
      }
    }
  }, [isOpen, user, roles]);

  if (!isOpen || user?.role === "Super Admin") return null;

  const statuses = [
    { value: "ACTIVE", label: "ACTIVE", variant: "success" },
    { value: "SUSPENDED", label: "SUSPEND", variant: "neutral" },
  ];

  const safeRole =
    typeof formData.role === "string" ? formData.role : formData.role?.name || "driver";
  const generatedUsername = `${(formData.firstName || "").charAt(0).toLowerCase()}${(
    formData.lastName || ""
  )
    .toLowerCase()
    .replace(/\s/g, "")}_${safeRole.toLowerCase()}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user) {
      // Direct save for user edit (no admin password required per API contract)
      setIsSubmitting(true);
      try {
        await onSave(formData, user.id || user.userId);
        onClose();
      } catch (err) {
        console.error("Failed to update user:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Go to confirm step for new user creation
      setStep(2);
    }
  };

  const handleConfirmCreate = async () => {
    setIsSubmitting(true);
    try {
      const finalData = {
        ...formData,
        username: generatedUsername,
      };

      const result = await onSave(finalData, null);
      if (result?.temporaryPassword) {
        setCreatedTemporaryPassword(result.temporaryPassword);
      }
      setStep(3);
    } catch (err) {
      console.error("Failed to create user:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-[2rem] w-full shadow-xl flex flex-col overflow-hidden transition-all duration-300 ${
          step === 3 ? "max-w-sm" : "max-w-lg"
        }`}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center">
          <h2 className="text-[28px] font-bold text-[#0B4A6E]">
            {step === 1 && (user ? "Edit User" : "Add New User")}
            {step === 2 && "Confirm Information"}
            {step === 3 && "User Created"}
          </h2>
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[#0B4A6E] hover:opacity-70 transition-opacity p-1 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
          )}
        </div>

        {step === 1 && (
          <UserFormStep
            formData={formData}
            setFormData={setFormData}
            roles={roles}
            user={user}
            statuses={statuses}
            onResetPassword={(targetUser) => {
              onClose();
              if (onResetPassword) onResetPassword(targetUser);
            }}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        )}

        {step === 2 && (
          <UserConfirmStep
            formData={formData}
            safeRole={safeRole}
            onConfirm={handleConfirmCreate}
            isSubmitting={isSubmitting}
          />
        )}

        {step === 3 && (
          <UserSuccessStep
            formData={formData}
            safeRole={safeRole}
            generatedUsername={generatedUsername}
            temporaryPassword={createdTemporaryPassword}
            onDone={onClose}
          />
        )}
      </div>
    </div>
  );
}