import { useState, useEffect } from "react";
import { UserPlus, UserRound, ShieldCheck, CheckCircle2 } from "lucide-react";
import UserFormStep from "./UserFormStep";
import UserConfirmStep from "./UserConfirmStep";
import UserSuccessStep from "./UserSuccessStep";
import { toProperCase } from "../../utils/text.js";
import { hasUserRole } from "../../utils/userRoles.js";
import Modal from "../ui/Modal";

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
  const [createdUsername, setCreatedUsername] = useState("");
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
      setCreatedUsername("");
      setErrors({});
      setSubmitError("");

      const defaultRoleObj =
        roles && roles.length > 0
          ? typeof roles[0] === "string"
            ? { id: roles[0].toLowerCase().replace(/\s+/g, "-"), name: roles[0] }
            : roles[0]
          : { id: "driver", name: "Driver" };
      const defaultRole = defaultRoleObj.name || "Driver";
      const defaultRoleId = defaultRoleObj.id || "driver";

      if (user) {
        const isUserBlocked = user.isBlocked === true || user.status === "SUSPENDED";
        const currentStatus = isUserBlocked ? "SUSPENDED" : "ACTIVE";

        let rawPhone = user.phone || user.contactNumber || "";
        let cleanPhone = rawPhone.replace(/\D/g, "");
        if (cleanPhone.startsWith("63") && cleanPhone.length === 12) {
          cleanPhone = cleanPhone.slice(2);
        } else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
          cleanPhone = cleanPhone.slice(1);
        }

        // Resolve existing user roleIds and primaryRoleId
        let userRoleIds = [];
        if (Array.isArray(user.roles) && user.roles.length > 0) {
          userRoleIds = user.roles.map((r) => (typeof r === "object" && r.id ? String(r.id) : String(r)));
        } else if (Array.isArray(user.roleIds) && user.roleIds.length > 0) {
          userRoleIds = user.roleIds.map(String);
        } else if (user.roleId) {
          userRoleIds = [String(user.roleId)];
        } else if (user.role) {
          const match = roles.find((r) => (typeof r === "object" ? r.name : r).toLowerCase() === String(user.role).toLowerCase());
          userRoleIds = [match && typeof match === "object" ? String(match.id) : defaultRoleId];
        } else {
          userRoleIds = [defaultRoleId];
        }

        let userPrimaryId = "";
        if (Array.isArray(user.roles)) {
          const primaryObj = user.roles.find((r) => typeof r === "object" && r.isPrimary);
          if (primaryObj?.id) userPrimaryId = String(primaryObj.id);
        }
        if (!userPrimaryId && user.primaryRoleId) {
          userPrimaryId = String(user.primaryRoleId);
        }
        if (!userPrimaryId && user.roleId) {
          userPrimaryId = String(user.roleId);
        }
        if (!userPrimaryId) {
          userPrimaryId = userRoleIds[0] || defaultRoleId;
        }

        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          birthday: user.birthday || user.birthdate || "",
          contactNo: cleanPhone || "",
          role: user.role || defaultRole || "",
          roles: user.roles || [],
          roleNames: user.roleNames || [],
          roleId: userPrimaryId,
          roleIds: userRoleIds,
          primaryRoleId: userPrimaryId,
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
          roles: [{ id: defaultRoleId, name: defaultRole, isPrimary: true }],
          roleNames: [defaultRole],
          roleId: defaultRoleId,
          roleIds: [defaultRoleId],
          primaryRoleId: defaultRoleId,
          username: "",
          status: "ACTIVE",
          isBlocked: false,
        });
      }
    }
  }, [isOpen, user, roles]);

  if (!isOpen || hasUserRole(user, "Super Admin")) return null;

  const statuses = [
    { value: "ACTIVE", label: "ACTIVE", variant: "success" },
    { value: "SUSPENDED", label: "SUSPEND", variant: "danger" },
  ];

  const safeRole =
    typeof formData.role === "string" ? formData.role : formData.role?.name || "Driver";

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

    if (!formData.contactNo || formData.contactNo.length !== 10) {
      newErrors.contactNo = "Please enter exactly 10 digits.";
    } else if (!formData.contactNo.startsWith("9")) {
      newErrors.contactNo = "Mobile number must start with 9.";
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

    const hasRoles = Array.isArray(formData.roleIds) && formData.roleIds.length > 0;
    const hasSingleRole = formData.role && (typeof formData.role !== "string" || formData.role.trim());
    if (!hasRoles && !hasSingleRole) {
      newErrors.role = "Please select at least one role.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
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
    const formattedContactNo = `+63${formData.contactNo}`;

    const cleanedData = {
      ...formData,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      contactNo: formattedContactNo,
      isBlocked,
      status: isBlocked ? "SUSPENDED" : "ACTIVE",
    };
    setFormData((prev) => ({ ...prev, contactNo: formData.contactNo }));

    if (user) {
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
      setStep(2);
    }
  };

  const handleConfirmCreate = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const cleanFirstName = toProperCase(formData.firstName);
      const cleanLastName = toProperCase(formData.lastName);
      const formattedContactNo = `+63${formData.contactNo}`;
      const finalData = {
        ...formData,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        contactNo: formattedContactNo,
        isBlocked: false,
        status: "ACTIVE",
      };

      const result = await onSave(finalData, null);
      if (result?.temporaryPassword) {
        setCreatedTemporaryPassword(result.temporaryPassword);
      }

      const backendUsername =
        result?.username || result?.user?.username || result?.data?.username || "";
      if (backendUsername) {
        setCreatedUsername(backendUsername);
      }

      setStep(3);
    } catch (err) {
      console.error("Failed to create user:", err);
      setSubmitError(err?.message || "Failed to create user. Please try again.");
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  let modalTitle = "";
  let modalSubtitle = "";
  let modalIcon = UserPlus;
  let modalBadge = null;

  if (step === 1) {
    modalTitle = user ? "Edit User Account" : "Add New User";
    modalSubtitle = user ? "Update personal information and role access" : "Register user credentials, details & system privileges";
    modalIcon = user ? UserRound : UserPlus;
    modalBadge = !user ? (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
        Step 1 of 3
      </span>
    ) : null;
  } else if (step === 2) {
    modalTitle = "Confirm Information";
    modalSubtitle = "Review account details before finalizing registration";
    modalIcon = ShieldCheck;
    modalBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
        Step 2 of 3
      </span>
    );
  } else if (step === 3) {
    modalTitle = "User Account Created";
    modalSubtitle = "Credentials successfully generated";
    modalIcon = CheckCircle2;
    modalBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        Completed
      </span>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={modalIcon}
      badge={modalBadge}
      onBack={step === 2 ? () => setStep(1) : undefined}
      maxWidth={step === 3 ? "max-w-md" : "max-w-xl"}
      closeOnBackdrop={false}
    >
      <div className="py-1">
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
            generatedUsername={createdUsername || formData.username}
            temporaryPassword={createdTemporaryPassword}
            onDone={onClose}
          />
        )}
      </div>
    </Modal>
  );
}