import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useData } from "../../context/DataContext";

const roleOptions = [
  { value: "Admin", label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "Driver", label: "Driver" },
];

export default function UserModal({ isOpen, onClose, user }) {
  const { addUser, updateUser } = useData();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "Driver",
    contactNumber: "",
    username: "",
    password: "password123"
  });

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        role: user.role || "Driver"
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        role: "Driver",
        contactNumber: "",
        username: "",
        password: "password123"
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "contactNumber") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 11) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.contactNumber.length !== 11) {
      alert("Contact number must be exactly 11 digits.");
      return;
    }

    if (user) {
      updateUser(user.userId, formData);
    } else {
      addUser(formData);
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
          name="contactNumber"
          value={formData.contactNumber}
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
          name="role"
          value={formData.role}
          onChange={handleChange}
          options={roleOptions}
          required
        />
      </form>
    </Modal>
  );
}
