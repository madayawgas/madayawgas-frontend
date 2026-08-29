import { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

export default function UserModal({
  isOpen,
  onClose,
  user,
  roles = [],
  onSave,
}) {
  const [prevUser, setPrevUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthdate: "",
    roleId: roles[0]?.id || "",
    username: "",
    password: "",
    status: "ACTIVE",
  });

  // Adjust state during render when user prop changes (React recommended pattern)
  if (user !== prevUser) {
    setPrevUser(user);
    setFormData(
      user
        ? {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: user.phone || user.contactNumber || "",
          birthdate: user.birthdate || "",
          roleId:
            user.roleId ||
            roles.find(
              (r) =>
                r.name?.toLowerCase() === (user.role || "").toLowerCase()
            )?.id ||
            roles[0]?.id ||
            "",
          username: user.username || "",
          password: "",
          status: user.status || "ACTIVE",
        }
        : {
          firstName: "",
          lastName: "",
          phone: "",
          birthdate: "",
          roleId: roles[0]?.id || "",
          username: "",
          password: "",
          status: "ACTIVE",
        }
    );
  }

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 11) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.phone && formData.phone.length !== 11) {
      alert("Contact number must be exactly 11 digits.");
      return;
    }

    if (onSave) {
      await onSave(formData, user?.id || user?.userId);
    }
    onClose();
  };




  // OEMJI AAAAAAAA
  const handleStatusToggle = (newStatus) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));
  };

  const handleCopyPassword = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password);
      alert("Password copied to clipboard!");
    }
  };


  const footer = (
    <div className="flex flex-col items-center w-full gap-2 pt-2">
      <Button type="submit" form="user-form" variant="yellow">
        {user ? "SAVE CHANGES" : "CREATE ACCOUNT"}
      </Button>
      <Button type="button" variant="cancel" onClick={onClose}>
        CANCEL
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? "Edit User" : "Add New User"}
      maxWidth="max-w-md"
      footer={footer}
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        {/* oemji bai i input sa nako ni */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Birthday"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
            required
          />
          <Input
            label="Contact Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{11}"
            title="Exactly 11 digits required"
            maxLength={11}
            required
          />
        </div>
        <Select
          label="Role"
          name="roleId"
          value={formData.roleId}
          onChange={handleChange}
          options={roleOptions}
          required
        />
        {/* EDIT USER SPECIFIC FIELDS (Hidden when creating a new user) */}
        {user && (
          <>
            {/* Row 4: Username & Password */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
              <div className="flex flex-col">
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-[10px] text-sky-600 underline text-right mt-1 hover:text-sky-800 self-end"
                >
                  Copy Password
                </button>
              </div>
            </div>

            {/* Row 5: Status Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusToggle("ACTIVE")}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-colors ${formData.status === "ACTIVE"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-300 text-gray-600"
                    }`}
                >
                  ACTIVE
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusToggle("SUSPEND")}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-colors ${formData.status === "SUSPEND"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-300 text-white"
                    }`}
                >
                  SUSPEND
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
