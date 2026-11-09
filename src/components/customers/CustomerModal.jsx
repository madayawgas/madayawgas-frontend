import { useState } from "react";
import { UserRoundPlus, UserRound } from "lucide-react";
import { isValidPhilippinePhone, formatPhilippinePhone } from "../../utils/phone.js";
import CustomerFormStep from "./CustomerFormStep";
import Modal from "../ui/Modal";

export default function CustomerModal({ isOpen, onSave, onClose, customer }) {
  const [phoneError, setPhoneError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contactNumber: "",
    customerType: "COMMERCIAL",
    isActive: true,
  });

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevCustomer, setPrevCustomer] = useState(customer);

  if (isOpen !== prevIsOpen || customer !== prevCustomer) {
    setPrevIsOpen(isOpen);
    setPrevCustomer(customer);
    if (isOpen) {
      setPhoneError("");
      setSubmitError("");
      setIsSubmitting(false);

      if (customer) {
        setFormData({
          name: customer.name || "",
          address: customer.address || "",
          contactNumber: customer.contactNumber || "",
          customerType: customer.customerType || "COMMERCIAL",
          isActive: customer.isActive !== undefined ? customer.isActive : true,
        });
      } else {
        setFormData({
          name: "",
          address: "",
          contactNumber: "",
          customerType: "COMMERCIAL",
          isActive: true,
        });
      }
    }
  }

  if (!isOpen) return null;

  const handleFormSubmit = async (e) => {
    e?.preventDefault();

    if (!formData.name.trim()) {
      setSubmitError("Customer name is required.");
      return;
    }

    if (!formData.contactNumber.trim()) {
      setPhoneError("Contact number is required.");
      return;
    }

    if (!isValidPhilippinePhone(formData.contactNumber)) {
      setPhoneError(
        "Please enter a valid Philippine phone number (e.g. 09171234567, +639171234567, or landline)."
      );
      return;
    }

    setPhoneError("");
    setSubmitError("");
    setIsSubmitting(true);

    const normalizedData = {
      ...formData,
      contactNumber: formatPhilippinePhone(formData.contactNumber),
    };

    try {
      await onSave(normalizedData, customer ? customer.id : null);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err.message || "Failed to save customer. Please try again.");
    }
  };

  const modalTitle = customer ? "Edit Customer Profile" : "Add New Customer";
  const modalSubtitle = customer
    ? "Update client segment, delivery and contact details"
    : "Register client account, segment & delivery destination";
  const modalIcon = customer ? UserRound : UserRoundPlus;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={modalIcon}
      maxWidth="max-w-xl"
      closeOnBackdrop={false}
    >
      <div className="py-1">
        <CustomerFormStep
          formData={formData}
          setFormData={setFormData}
          customer={customer}
          phoneError={phoneError}
          setPhoneError={setPhoneError}
          submitError={submitError}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onClose={onClose}
        />
      </div>
    </Modal>
  );
}
