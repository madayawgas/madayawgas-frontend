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
          }
        : {
            firstName: "",
            lastName: "",
            phone: "",
            birthdate: "",
            roleId: roles[0]?.id || "",
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

  const footer = (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="secondary" onClick={onClose}>
        CANCEL
      </Button>
      <Button type="submit" form="user-form" variant="primary">
        {user ? "UPDATE USER" : "ADD USER"}
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
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="Enter first name"
          required
        />
        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Enter last name"
          required
        />
        <Input
          label="Contact Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. 09123456789"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{11}"
          title="Exactly 11 digits required"
          maxLength={11}
          required
        />
        <Select
          label="Role"
          name="roleId"
          value={formData.roleId}
          onChange={handleChange}
          options={roleOptions}
          required
        />
      </form>
    </Modal>
  );
}
