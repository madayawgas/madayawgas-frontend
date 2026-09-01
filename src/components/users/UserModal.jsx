import { useState, useEffect } from "react";
import UserFormStep from "./UserFormStep";
import UserConfirmStep from "./UserConfirmStep";
import UserSuccessStep from "./UserSuccessStep";
import { toProperCase } from "../../utils/text.js";
import { isValidPhilippinePhone, formatPhilippinePhone } from "../../utils/phone.js";

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
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthday: "",
    contactNo: "",
    role: "",
    username: "",
    status: "ACTIVE",
    isBlocked: false,
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsSubmitting(false);
      setCreatedTemporaryPassword("");
      setErrors({});
      setSubmitError("");

      const defaultRole =
        roles && roles.length > 0
          ? typeof roles[0] === "string"
            ? roles[0]
            : roles[0].name
          : "Driver";

      if (user) {
        const isUserBlocked = user.isBlocked === true || user.status === "SUSPENDED";
        const currentStatus = isUserBlocked ? "SUSPENDED" : "ACTIVE";

        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          birthday: user.birthday || user.birthdate || "",
          contactNo: user.phone || user.contactNumber || "",
          role: user.role || defaultRole || "",
          username: user.username || "",
          status: currentStatus,
          isBlocked: isUserBlocked,
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
          isBlocked: false,
        });
      }
    }
  }, [isOpen, user, roles]);

  if (!isOpen || user?.role === "Super Admin") return null;

  const statuses = [
    { value: "ACTIVE", label: "ACTIVE", variant: "success" },
    { value: "SUSPENDED", label: "SUSPEND", variant: "danger" },
  ];

  const safeRole =
    typeof formData.role === "string" ? formData.role : formData.role?.name || "driver";
  const generatedUsername = `${(formData.firstName || "").charAt(0).toLowerCase()}${(
    formData.lastName || ""
  )
    .toLowerCase()
    .replace(/\s/g, "")}_${safeRole.toLowerCase()}`;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName || !formData.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters.";
    }

    if (!formData.lastName || !formData.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters.";
    }

    if (!formData.contactNo || !formData.contactNo.trim()) {
      newErrors.contactNo = "Contact number is required.";
    } else if (!isValidPhilippinePhone(formData.contactNo)) {
      newErrors.contactNo =
        "Please enter a valid Philippine phone number (e.g. 09171234567 or +639171234567).";
    }

    if (formData.birthday) {
      const bDate = new Date(formData.birthday);
      const today = new Date();
      if (isNaN(bDate.getTime())) {
        newErrors.birthday = "Please enter a valid birthdate.";
      } else if (bDate > today) {
        newErrors.birthday = "Birthdate cannot be in the future.";
      } else if (bDate.getFullYear() < 1900) {
        newErrors.birthday = "Please enter a valid birthdate.";
      } else {
        let age = today.getFullYear() - bDate.getFullYear();
        const m = today.getMonth() - bDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
          age--;
        }
        if (age < 18) {
          newErrors.birthday = "User must be at least 18 years old.";
        }
      }
    }

    if (!formData.role || (typeof formData.role === "string" && !formData.role.trim())) {
      newErrors.role = "Please select a role.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError("");

    const cleanFirstName = toProperCase(formData.firstName);
    const cleanLastName = toProperCase(formData.lastName);
    const isBlocked = formData.status === "SUSPENDED";
    const formattedContactNo = formatPhilippinePhone(formData.contactNo);

    const cleanedData = {
      ...formData,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      contactNo: formattedContactNo,
      isBlocked,
      status: isBlocked ? "SUSPENDED" : "ACTIVE",
    };
    setFormData(cleanedData);

    if (user) {
      // Direct save for user edit (no admin password required per API contract)
      setIsSubmitting(true);
      try {
        await onSave(cleanedData, user.id || user.userId);
        onClose();
      } catch (err) {
        console.error("Failed to update user:", err);
        setSubmitError(err?.message || "Failed to update user. Please try again.");
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
    setSubmitError("");
    try {
      const cleanFirstName = toProperCase(formData.firstName);
      const cleanLastName = toProperCase(formData.lastName);
      const formattedContactNo = formatPhilippinePhone(formData.contactNo);
      const finalData = {
        ...formData,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        contactNo: formattedContactNo,
        username: generatedUsername,
        isBlocked: false,
        status: "ACTIVE",
      };

      const result = await onSave(finalData, null);
      if (result?.temporaryPassword) {
        setCreatedTemporaryPassword(result.temporaryPassword);
      }
      setStep(3);
    } catch (err) {
      console.error("Failed to create user:", err);
      setSubmitError(err?.message || "Failed to create user. Please try again.");
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
            {step === 3 && (user ? "User Updated" : "User Created")}
          </h2>
          {step === 2 && (
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
            errors={errors}
            setErrors={setErrors}
            submitError={submitError}
            setSubmitError={setSubmitError}
            isSubmitting={isSubmitting}
            onResetPassword={onResetPassword}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        )}

        {step === 2 && (
          <UserConfirmStep
            formData={formData}
            safeRole={safeRole}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onConfirm={handleConfirmCreate}
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