// src/pages/Profile/Profile.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { usersApi } from "../../api/users.js";
import { authApi } from "../../api/auth.js";
import { UserCircle, Eye, EyeOff, X, Check, Lock, AlertTriangle, KeyRound } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import ToastNotification from "../../components/ui/ToastNotifications";

export default function Profile() {
  const { currentUser, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  // Form State initialized from logged-in user
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    fullName: "",
    phone: "",
    birthdate: "",
    username: "",
  });

  // Password / Security Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Toast Notification State: { show: boolean, type: "success" | "info" | "error", message: string }
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "Saved Changes",
  });

  // Populate from logged-in user details
  useEffect(() => {
    if (currentUser) {
      const fName = currentUser.firstName || "";
      const lName = currentUser.lastName || "";
      const full = `${fName} ${lName}`.trim() || currentUser.username || "Alejandro Doe";
      
      setFormData({
        firstName: fName,
        lastName: lName,
        fullName: full,
        phone: currentUser.phone || "09999999999",
        birthdate: currentUser.birthdate || "DD/MM/YYYY",
        username: currentUser.username || "adoe_admin",
      });
    }
  }, [currentUser]);

  // Handle Profile Picture selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save Profile Changes
  const handleSaveChanges = async (e) => {
    e?.preventDefault();

    // Parse full name into firstName and lastName
    const nameParts = (formData.fullName || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const updatedData = {
      firstName: firstName || formData.firstName,
      lastName: lastName || formData.lastName,
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
    setIsEditing(false);
    setToast({
      show: true,
      type: "success",
      message: "Saved Changes",
    });
  };

  const handleCancelEdit = () => {
    // Revert form data to current user state
    if (currentUser) {
      const fName = currentUser.firstName || "";
      const lName = currentUser.lastName || "";
      const full = `${fName} ${lName}`.trim() || currentUser.username || "Alejandro Doe";
      
      setFormData({
        firstName: fName,
        lastName: lName,
        fullName: full,
        phone: currentUser.phone || "09999999999",
        birthdate: currentUser.birthdate || "DD/MM/YYYY",
        username: currentUser.username || "adoe_admin",
      });
    }
    setIsEditing(false);
    setToast({
      show: true,
      type: "info",
      message: "Changes not Saved",
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
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setToast({
        show: true,
        type: "success",
        message: "Password changed successfully",
      });
    } catch (err) {
      setIsChangingPassword(false);
      setPasswordError(err.message || "Failed to change password. Please check your current password.");
    }
  };

  const displayName = formData.fullName || `${formData.firstName} ${formData.lastName}`.trim() || "Alejandro Doe";
  const displayPhone = formData.phone || "09999999999";
  const displayBirthday = formData.birthdate || "DD/MM/YYYY";
  const displayUsername = formData.username || "adoe_admin";

  return (
    <div className="p-6 md:p-8">
      <div className="w-full max-w-[1200px] mx-auto text-left">
        {/* PAGE HEADER */}
        <div className="pb-4 border-b border-[#6D8AA2] mb-8">
          <h1 className="text-2xl md:text-[32px] font-bold text-[#1B4B75]">
            Account Profile
          </h1>
        </div>

        {/* MAIN PROFILE CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-gray-100">
          {/* ==================================================== */}
          {/* SECTION 1: BASIC INFORMATION                         */}
          {/* ==================================================== */}
          <div className="mb-10">
            <h2 className="text-[#1B4B75] font-bold text-lg md:text-xl mb-6">
              Basic Information
            </h2>

            {/* Profile Picture Row */}
            <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-100 gap-4">
              <span className="w-40 sm:w-48 text-sm font-medium text-gray-500 shrink-0">
                Profile Picture
              </span>

              <div className="flex items-center gap-4">
                {/* Avatar Display */}
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 overflow-hidden shrink-0">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle size={56} className="text-gray-300" />
                  )}
                </div>

                {/* Upload / Edit Actions */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#FFDF2C] hover:bg-[#F5D020] text-[#0A4B6E] text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider transition cursor-pointer shadow-xs"
                  >
                    Change Image
                  </button>

                  {isEditing ? (
                    profileImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs text-gray-500 hover:text-red-600 hover:underline cursor-pointer font-medium"
                      >
                        Remove Image
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-[#0A4B6E] hover:underline cursor-pointer font-semibold"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fields (View State vs Edit State) */}
            {!isEditing ? (
              // VIEW STATE
              <div className="divide-y divide-gray-100">
                {/* Name */}
                <div className="flex flex-col sm:flex-row sm:items-center py-4">
                  <span className="w-40 sm:w-48 text-sm font-medium text-gray-500 shrink-0">
                    Name
                  </span>
                  <span className="text-sm font-bold text-[#0A4B6E]">
                    {displayName}
                  </span>
                </div>

                {/* Mobile No. */}
                <div className="flex flex-col sm:flex-row sm:items-center py-4">
                  <span className="w-40 sm:w-48 text-sm font-medium text-gray-500 shrink-0">
                    Mobile No.
                  </span>
                  <span className="text-sm font-bold text-[#0A4B6E]">
                    {displayPhone}
                  </span>
                </div>

                {/* Birthday */}
                <div className="flex flex-col sm:flex-row sm:items-center py-4">
                  <span className="w-40 sm:w-48 text-sm font-medium text-gray-500 shrink-0">
                    Birthday
                  </span>
                  <span className="text-sm font-bold text-[#0A4B6E]">
                    {displayBirthday}
                  </span>
                </div>
              </div>
            ) : (
              // EDIT STATE FORM
              <div className="space-y-4 pt-4">
                {/* Name Input */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 sm:w-48 text-sm font-medium text-gray-500 shrink-0">
                    Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Alejandro Doe"
                    className="w-full max-w-md bg-[#F3F5F5] rounded-full px-5 py-2.5 text-sm text-[#0A4B6E] font-medium border border-transparent focus:border-[#0A4B6E] focus:bg-white outline-none transition"
                  />
                </div>

                {/* Mobile No. Input */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 sm:w-48 text-sm font-medium text-gray-500 shrink-0">
                    Mobile No.
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 09999999999"
                    className="w-full max-w-md bg-[#F3F5F5] rounded-full px-5 py-2.5 text-sm text-[#0A4B6E] font-medium border border-transparent focus:border-[#0A4B6E] focus:bg-white outline-none transition"
                  />
                </div>

                {/* Birthday Input */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 sm:w-48 text-sm font-medium text-gray-500 shrink-0">
                    Birthday
                  </label>
                  <input
                    type="text"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleInputChange}
                    placeholder="DD/MM/YYYY"
                    className="w-full max-w-md bg-[#F3F5F5] rounded-full px-5 py-2.5 text-sm text-[#0A4B6E] font-medium border border-transparent focus:border-[#0A4B6E] focus:bg-white outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* SECTION 2: ACCOUNT INFORMATION                      */}
          {/* ==================================================== */}
          <div>
            <h2 className="text-[#1B4B75] font-bold text-lg md:text-xl mb-6">
              Account Information
            </h2>

            <div className="divide-y divide-gray-100">
              {/* Email / Username */}
              <div className="flex flex-col sm:flex-row sm:items-center py-4">
                <span className="w-40 sm:w-48 text-sm font-medium text-gray-500 shrink-0">
                  Email
                </span>
                <span className="text-sm font-bold text-[#0A4B6E]">
                  {displayUsername}
                </span>
              </div>

              {/* Password */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-40 sm:w-48 text-sm font-medium text-gray-500 shrink-0">
                    Password
                  </span>
                  <span className="text-sm font-bold text-[#0A4B6E] tracking-widest">
                    ••••••••••••••••
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPasswordError("");
                    setShowPasswordModal(true);
                  }}
                  className="text-xs text-[#0A4B6E] hover:underline font-semibold cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Change password
                </button>
              </div>
            </div>

            {/* Bottom Actions for Edit Mode */}
            {isEditing && (
              <div className="flex items-center justify-end gap-4 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="bg-[#FFDF2C] hover:bg-[#F5D020] text-[#0A4B6E] text-sm font-bold px-8 py-3 rounded-full uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[#0A4B6E] text-sm font-semibold hover:underline cursor-pointer px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* CHANGE PASSWORD MODAL                                */}
      {/* ==================================================== */}
      {showPasswordModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowPasswordModal(false)}
          title="Change Password"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-left py-2">
            <p className="text-gray-600 text-xs leading-relaxed">
              Enter your current password and choose a secure new password of at least 8 characters.
            </p>

            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter current password"
                  required
                  className="w-full bg-[#F3F5F5] rounded-full px-5 py-2.5 text-sm text-gray-800 pr-12 focus:ring-2 focus:ring-[#0B4A6E]/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  className="w-full bg-[#F3F5F5] rounded-full px-5 py-2.5 text-sm text-gray-800 pr-12 focus:ring-2 focus:ring-[#0B4A6E]/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirm new password"
                required
                className="w-full bg-[#F3F5F5] rounded-full px-5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#0B4A6E]/20 outline-none"
              />
            </div>

            {/* Error Message */}
            {passwordError && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium bg-red-50 p-2.5 rounded-xl">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-3 bg-[#FFDF2C] hover:bg-[#F5D020] border-none !text-[#0A4B6E] font-bold rounded-full text-xs uppercase tracking-wider shadow-sm transition"
              >
                {isChangingPassword ? "UPDATING..." : "CHANGE PASSWORD"}
              </Button>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-xs text-gray-500 hover:underline py-1 text-center font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ==================================================== */}
      {/* TOAST NOTIFICATION                                  */}
      {/* ==================================================== */}
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
