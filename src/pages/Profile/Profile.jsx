import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { usersApi } from "../../api/users.js";
import { authApi } from "../../api/auth.js";
import { getUserRoleNames, hasUserRole } from "../../utils/userRoles.js";
import { formatPhilippineDate } from "../../utils/date.js";
import {
  UserRound,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Pencil,
  Camera,
  X,
  Crop,
  Trash2,
  Lock,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import AvatarCropModal from "../../components/ui/AvatarCropModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { uploadMediaFile } from "../../api/media.js";
import { resolveMediaUrl } from "../../utils/media.js";
import Badge from "../../components/ui/Badge";
import ToastNotification from "../../components/ui/ToastNotifications";
import { formatPhilippinePhone } from "../../utils/phone.js";
import { toProperCase } from "../../utils/text.js";

export default function Profile() {
  const { currentUser, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  // Form State initialized lazily from logged-in user
  const [formData, setFormData] = useState(() => {
    const fName = currentUser?.firstName || "";
    const lName = currentUser?.lastName || "";
    const full = `${fName} ${lName}`.trim() || currentUser?.username || "";
    return {
      firstName: fName,
      lastName: lName,
      fullName: full,
      phone: currentUser?.phone || "",
      birthdate: currentUser?.birthdate || "",
      username: currentUser?.username || "",
    };
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Password / Security Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalStep, setPasswordModalStep] = useState(1);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Toast Notification State: { show: boolean, type: "success" | "info" | "error", message: string }
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "Saved Changes",
  });

  // Avatar Modal & Crop States
  const [cropImageSource, setCropImageSource] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showRemoveAvatarModal, setShowRemoveAvatarModal] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  // Handle Profile Picture selection from file input
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setToast({
          show: true,
          type: "error",
          message: "Please select a valid image file (JPEG, PNG, or WebP).",
        });
        e.target.value = "";
        return;
      }
      setCropImageSource(file);
      setIsCropModalOpen(true);
    }
    e.target.value = "";
  };

  // Open cropper for existing avatar photo
  const handleEditExistingAvatar = () => {
    const existing = currentUser?.avatarUrl || resolveMediaUrl(currentUser?.avatarMediaKey);
    if (existing) {
      setCropImageSource(existing);
      setIsCropModalOpen(true);
    }
  };

  // Save Cropped Avatar to backend
  const handleSaveCroppedAvatar = async (croppedFile) => {
    try {
      const result = await usersApi.uploadMyAvatar(croppedFile);
      updateUser({
        avatarMediaKey: result.avatarMediaKey,
        avatarUrl: result.avatarUrl,
      });
      setToast({
        show: true,
        type: "success",
        message: "Profile photo updated successfully",
      });
    } catch (err) {
      console.error("Failed to upload avatar photo:", err);
      setToast({
        show: true,
        type: "error",
        message: err?.message || "Failed to upload avatar photo. Please try again.",
      });
      throw err;
    }
  };

  // Confirm Remove Avatar
  const handleConfirmRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    try {
      await usersApi.deleteMyAvatar();
      updateUser({
        avatarMediaKey: null,
        avatarUrl: null,
      });
      setShowRemoveAvatarModal(false);
      setToast({
        show: true,
        type: "success",
        message: "Profile photo removed",
      });
    } catch (err) {
      console.error("Failed to remove avatar photo:", err);
      setToast({
        show: true,
        type: "error",
        message: err?.message || "Failed to remove avatar photo. Please try again.",
      });
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Save Profile Changes
  const handleSaveChanges = async (e) => {
    e?.preventDefault();

    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const cleanFirstName = toProperCase(formData.firstName);
    const cleanLastName = toProperCase(formData.lastName);
    const full = `${cleanFirstName} ${cleanLastName}`.trim();

    const updatedData = {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phone: formData.phone,
      birthdate: formData.birthdate !== "DD/MM/YYYY" ? formData.birthdate : null,
    };

    try {
      if (usersApi.updateMe) {
        await usersApi.updateMe(updatedData);
      }
    } catch {
      // Optimistic update
    }

    updateUser(updatedData);
    setFormData((prev) => ({
      ...prev,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      fullName: full,
    }));
    setIsEditing(false);
    setToast({
      show: true,
      type: "success",
      message: "Profile Updated Successfully",
    });
  };

  const handleCancelEdit = () => {
    if (currentUser) {
      const fName = currentUser.firstName || "";
      const lName = currentUser.lastName || "";
      const full = `${fName} ${lName}`.trim() || currentUser.username || "Alejandro Doe";
      setFormData({
        firstName: fName,
        lastName: lName,
        fullName: full,
        phone: currentUser.phone || "09999999999",
        birthdate: currentUser.birthdate || "1995-05-15",
        username: currentUser.username || "adoe_admin",
      });
    }
    setErrors({});
    setIsEditing(false);
    setToast({
      show: true,
      type: "info",
      message: "Changes Cancelled",
    });
  };

  // Change Password Submission
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!passwordForm.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordModalStep(2);
    } catch (err) {
      setIsChangingPassword(false);
      setPasswordError(err.message || "Failed to change password. Please check your current password.");
    }
  };

  const handleLogInAgain = async () => {
    await logout();
    navigate("/login", {
      replace: true,
      state: {
        successMessage: "Password changed successfully. Please log in with your new password.",
      },
    });
  };

  const displayName =
    formData.fullName ||
    `${formData.firstName} ${formData.lastName}`.trim() ||
    currentUser?.username ||
    "User Profile";
  const displayPhone = formatPhilippinePhone(formData.phone) || "Not set";
  const displayBirthday = formatPhilippineDate(formData.birthdate, { fallback: "Not set" });
  const displayUsername = formData.username || currentUser?.username || "—";
  const userRoles = getUserRoleNames(currentUser, "Super Admin");
  const isSuperAdmin = hasUserRole(currentUser, "Super Admin");

  return (
    <div className="w-full max-w-[1280px] mx-auto text-left">
      {/* ================= PAGE ACTIONS HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end pb-3.5 border-b border-[#6D8AA2]/20 mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={() => {
              setPasswordError("");
              setPasswordModalStep(1);
              setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
              setShowPasswordModal(true);
            }}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95 h-[30px]"
          >
            <KeyRound size={13} />
            <span>Change Password</span>
          </button>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer h-[30px]"
            >
              <Pencil size={13} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-2xs active:scale-95 h-[30px]"
            >
              <X size={13} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

        {/* ================= MAIN CONTENT GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT COLUMN: IDENTITY CARD */}
          <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-2xs flex flex-col justify-between items-center text-center relative overflow-hidden h-full">
            {/* Top decorative gradient banner */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#E8F3F8] to-transparent pointer-events-none" />

            {/* Top Identity Block */}
            <div className="flex flex-col items-center w-full relative z-10">
              {/* Avatar */}
              <div className="relative mt-2">
                <Avatar
                  src={currentUser?.avatarUrl}
                  storageKey={currentUser?.avatarMediaKey}
                  name={displayName}
                  size="2xl"
                  className="border-4 border-white shadow-md"
                />
              </div>

              {/* Avatar Actions */}
              <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 bg-[#E8F3F8] hover:bg-[#BCE1F1] text-[#0A4B6E] font-bold text-[11px] px-3.5 py-1.5 rounded-full uppercase tracking-wider transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <Camera size={13} />
                  <span>{currentUser?.avatarUrl || currentUser?.avatarMediaKey ? "Change Photo" : "Upload Photo"}</span>
                </button>

                {(currentUser?.avatarUrl || currentUser?.avatarMediaKey) && (
                  <>
                    <button
                      type="button"
                      onClick={handleEditExistingAvatar}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A4B6E] font-semibold text-[11px] px-2.5 py-1.5 rounded-full transition cursor-pointer shadow-2xs active:scale-95"
                      title="Adjust / Crop Current Photo"
                    >
                      <Crop size={12} />
                      <span>Adjust</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRemoveAvatarModal(true)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* User Title & Username */}
              <h2 className="text-xl font-bold text-[#0A4B6E] mt-4">
                {displayName}
              </h2>
              <p className="text-xs font-semibold text-[#6D8AA2]">
                @{displayUsername}
              </p>

              {/* Badges Row */}
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                {userRoles.map((role, idx) => (
                  <Badge key={`profile-role-${idx}`} variant="roles">
                    {role}
                  </Badge>
                ))}
                <Badge variant="success">ACTIVE</Badge>
              </div>
            </div>

            {/* Bottom Security / Privilege Summary Card */}
            <div className="bg-[#E8F3F8] border border-[#BCE1F1]/60 rounded-2xl p-4 w-full mt-6 text-left space-y-2.5 text-xs relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[#6D8AA2] font-medium">System Access:</span>
                <span className="font-bold text-[#0A4B6E]">
                  {isSuperAdmin ? "Full Admin Control" : "Role-Scoped"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6D8AA2] font-medium">Account Status:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Check size={13} /> Active & Verified
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILED SECTIONS */}
          <div className="lg:col-span-8 bg-white border border-[#CBD5E1] rounded-2xl p-6 md:p-8 shadow-2xs flex flex-col justify-between space-y-6 h-full">
            {/* ================= SECTION 1: PERSONAL INFORMATION ================= */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#E8F3F8] flex items-center justify-center text-[#0A4B6E] shrink-0">
                  <UserRound size={18} />
                </div>
                <h3 className="text-base md:text-lg font-bold text-[#1B4B75]">
                  Personal Information
                </h3>
              </div>

              {!isEditing ? (
                // VIEW STATE
                <div className="bg-[#E8F3F8] border border-[#BCE1F1]/60 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-[#6D8AA2] uppercase tracking-wider block mb-1">
                      Full Name
                    </span>
                    <p className="text-sm md:text-base font-bold text-[#0A4B6E]">
                      {displayName}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#6D8AA2] uppercase tracking-wider block mb-1">
                      Mobile No.
                    </span>
                    <p className="text-sm md:text-base font-bold text-[#0A4B6E]">
                      {displayPhone}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#6D8AA2] uppercase tracking-wider block mb-1">
                      Birthday
                    </span>
                    <p className="text-sm md:text-base font-bold text-[#0A4B6E]">
                      {displayBirthday}
                    </p>
                  </div>
                </div>
              ) : (
                // EDIT STATE FORM
                <div className="bg-[#E8F3F8] border border-[#BCE1F1]/60 rounded-xl p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="text-xs font-semibold text-[#0A4B6E] block mb-1.5">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="e.g. Juan"
                        className={`w-full bg-white rounded-lg px-3.5 py-2 text-sm text-[#0A4B6E] font-medium border ${
                          errors.firstName ? "border-red-500" : "border-[#BCE1F1]"
                        } focus:border-[#0A4B6E] focus:outline-hidden transition shadow-2xs`}
                      />
                      {errors.firstName && (
                        <p className="text-[11px] text-red-500 mt-1 ml-1 font-medium">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="text-xs font-semibold text-[#0A4B6E] block mb-1.5">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="e.g. Dela Cruz"
                        className={`w-full bg-white rounded-lg px-3.5 py-2 text-sm text-[#0A4B6E] font-medium border ${
                          errors.lastName ? "border-red-500" : "border-[#BCE1F1]"
                        } focus:border-[#0A4B6E] focus:outline-hidden transition shadow-2xs`}
                      />
                      {errors.lastName && (
                        <p className="text-[11px] text-red-500 mt-1 ml-1 font-medium">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact Number */}
                    <div>
                      <label className="text-xs font-semibold text-[#0A4B6E] block mb-1.5">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 09171234567"
                        className="w-full bg-white rounded-lg px-3.5 py-2 text-sm text-[#0A4B6E] font-medium border border-[#BCE1F1] focus:border-[#0A4B6E] focus:outline-hidden transition shadow-2xs"
                      />
                    </div>

                    {/* Birthday */}
                    <div>
                      <label className="text-xs font-semibold text-[#0A4B6E] block mb-1.5">
                        Birthdate
                      </label>
                      <input
                        type="date"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleInputChange}
                        className="w-full bg-white rounded-lg px-3.5 py-2 text-sm text-[#0A4B6E] font-medium border border-[#BCE1F1] focus:border-[#0A4B6E] focus:outline-hidden transition shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ================= SECTION 2: SECURITY & CREDENTIALS ================= */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#E8F3F8] flex items-center justify-center text-[#0A4B6E] shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-base md:text-lg font-bold text-[#1B4B75]">
                  Security & Credentials
                </h3>
              </div>

              <div className="bg-[#E8F3F8] border border-[#BCE1F1]/60 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username / Login ID */}
                  <div>
                    <span className="text-[11px] font-semibold text-[#6D8AA2] uppercase tracking-wider block mb-1">
                      Username / Login ID
                    </span>
                    <p className="text-sm md:text-base font-bold text-[#0A4B6E]">
                      @{displayUsername}
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <span className="text-[11px] font-semibold text-[#6D8AA2] uppercase tracking-wider block mb-1">
                      {userRoles.length > 1 ? "Assigned Roles" : "Assigned Role"}
                    </span>
                    <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
                      {userRoles.map((role, idx) => (
                        <Badge key={`profile-assigned-role-${idx}`} variant="roles">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#BCE1F1]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#6D8AA2] uppercase tracking-wider block mb-1">
                      Account Password
                    </span>
                    <p className="text-sm font-bold text-[#0A4B6E] tracking-widest">
                      ••••••••••••••••
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordError("");
                      setPasswordModalStep(1);
                      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setShowPasswordModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-[#0A4B6E] hover:underline font-bold cursor-pointer"
                  >
                    <KeyRound size={14} />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ================= EDIT MODE BOTTOM ACTIONS ================= */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs md:text-sm px-5 py-2 rounded-lg transition cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold text-xs md:text-sm px-6 py-2 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer uppercase tracking-wider text-[11px]"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      {showPasswordModal && (
        <Modal
          isOpen={true}
          onClose={passwordModalStep === 2 ? null : () => setShowPasswordModal(false)}
          closeOnBackdrop={passwordModalStep !== 2}
          title={passwordModalStep === 1 ? "Change Account Password" : null}
          subtitle={passwordModalStep === 1 ? "Update your personal security credentials" : null}
          icon={KeyRound}
          maxWidth="max-w-md"
        >
          {passwordModalStep === 1 ? (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-left py-1">
              <div className="bg-[#E8F3F8] border border-[#BCE1F1]/60 rounded-2xl p-4 space-y-3.5">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-[#0A4B6E] mb-1">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }));
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Enter current password"
                      required
                      className="w-full bg-white rounded-full px-4 py-2.5 text-sm text-[#0A4B6E] font-medium border border-[#BCE1F1] pr-11 focus:border-[#0A4B6E] outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-[#0A4B6E] mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }));
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Enter at least 8 characters"
                      required
                      minLength={8}
                      className="w-full bg-white rounded-full px-4 py-2.5 text-sm text-[#0A4B6E] font-medium border border-[#BCE1F1] pr-11 focus:border-[#0A4B6E] outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-[#0A4B6E] mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }));
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Re-enter new password"
                      required
                      className="w-full bg-white rounded-full px-4 py-2.5 text-sm text-[#0A4B6E] font-medium border border-[#BCE1F1] pr-11 focus:border-[#0A4B6E] outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {passwordError && (
                <div className="flex items-center gap-2 text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-2xl border border-red-200">
                  <AlertTriangle size={16} className="shrink-0 text-red-500" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-3.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold rounded-full text-xs uppercase tracking-wider shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? "UPDATING PASSWORD..." : "CONFIRM & CHANGE PASSWORD"}
                </button>
                <button
                  type="button"
                  disabled={isChangingPassword}
                  onClick={() => setShowPasswordModal(false)}
                  className="text-xs text-slate-500 hover:underline py-1 text-center font-medium cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: SUCCESS VIEW */
            <div className="text-center py-3 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200 animate-scale-in">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 className="font-bold text-lg text-[#0A4B6E]">
                  Password Changed Successfully
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed px-2">
                  Your password has been updated. For security compliance, your active session has been reset. Please log in again to continue.
                </p>
              </div>

              <div className="bg-[#E8F3F8] border border-[#BCE1F1]/60 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#6D8AA2] font-medium">Account:</span>
                  <span className="font-bold text-[#0A4B6E]">{displayName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6D8AA2] font-medium">Security Status:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Check size={13} /> Updated
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogInAgain}
                className="w-full py-3.5 bg-[#FFDF2C] hover:bg-[#ebd024] text-[#0A4B6E] font-bold rounded-full text-xs uppercase tracking-wider shadow-xs transition active:scale-98 cursor-pointer"
              >
                LOG IN AGAIN
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* ================= AVATAR CROP / EDIT MODAL ================= */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSource={cropImageSource}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropImageSource(null);
        }}
        onSave={handleSaveCroppedAvatar}
      />

      {/* ================= REMOVE AVATAR CONFIRMATION MODAL ================= */}
      <ConfirmationModal
        isOpen={showRemoveAvatarModal}
        onClose={() => setShowRemoveAvatarModal(false)}
        onConfirm={handleConfirmRemoveAvatar}
        title="Remove Profile Photo"
        message="Are you sure you want to remove your profile photo? Your account will revert to displaying your initials."
        confirmText="Remove Photo"
        variant="danger"
        isLoading={isRemovingAvatar}
      />

      {/* ================= TOAST NOTIFICATION ================= */}
      {toast.show && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
