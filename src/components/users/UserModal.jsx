import { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

const roleOptions = [
  { value: "Admin", label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "Driver", label: "Driver" },
];

export default function UserModal({ isOpen, onClose, onSave, user }) {
  const [formData, setFormData] = useState(
    user || {
      firstName: "",
      lastName: "",
      role: "",
      contactNumber: "",
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? "Edit User" : "Add New User"}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Enter contact number"
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
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            CANCEL
          </Button>
          <Button type="submit" variant="primary">
            {user ? "UPDATE USER" : "ADD USER"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
