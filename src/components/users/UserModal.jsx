import { useState, useEffect } from "react";
import { usersApi } from "../../api/users.js";
import { useAuth } from "../../context/AuthContext.jsx";
import UserFormStep from "./UserFormStep";
import UserConfirmStep from "./UserConfirmStep";
import UserPasswordStep from "./UserPasswordStep";
import UserSuccessStep from "./UserSuccessStep";

export default function UserModal({ isOpen, roles, onSave, onClose, user }) {
  const { user: currentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setAdminPassword("");
      setShowPassword(false);
      setPasswordError("");
      setIsVerifying(false);
      setCopied(false);

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

  if (!isOpen) return null;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep(user ? 3 : 2);
  };

  const handleProceed = async () => {
    if (!adminPassword) return;

    setIsVerifying(true);
    setPasswordError("");

    try {
      await usersApi.verifyAdminPassword(adminPassword, currentUser?.username);

      const finalData = {
        ...formData,
        username: user ? formData.username : generatedUsername,
        adminPassword,
      };

      await onSave(finalData, user ? user.id || user.userId : null);

      setIsVerifying(false);
      setStep(4);
    } catch (err) {
      setIsVerifying(false);
      setPasswordError(err.message || "Incorrect admin password. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-[2rem] w-full shadow-xl flex flex-col overflow-hidden transition-all duration-300 ${
          step === 4 ? "max-w-sm" : "max-w-lg"
        }`}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center">
          <h2 className="text-[28px] font-bold text-[#0B4A6E]">
            {step === 1 && (user ? "Edit User" : "Add New User")}
            {step === 2 && "Confirm Information"}
            {step === 3 && "Input Password"}
            {step === 4 && (user ? "User Updated" : "User Created")}
          </h2>
          {(step === 2 || step === 3) && (
            <button
              onClick={() => step > 1 && setStep(step - 1)}
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
            copied={copied}
            setCopied={setCopied}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        )}

        {step === 2 && (
          <UserConfirmStep
            formData={formData}
            safeRole={safeRole}
            onConfirm={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <UserPasswordStep
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            passwordError={passwordError}
            setPasswordError={setPasswordError}
            isVerifying={isVerifying}
            currentUser={currentUser}
            onProceed={handleProceed}
          />
        )}

        {step === 4 && (
          <UserSuccessStep
            formData={formData}
            safeRole={safeRole}
            generatedUsername={generatedUsername}
            copied={copied}
            setCopied={setCopied}
            onDone={onClose}
          />
        )}
      </div>
    </div>
  );
}