import { useState } from "react";
import { UserRoundPlus, UserRound, ShieldCheck, CheckCircle2, Building2 } from "lucide-react";
import { isValidPhilippinePhone, formatPhilippinePhone } from "../../utils/phone.js";
import CustomerFormStep from "./CustomerFormStep";
import CustomerConfirmStep from "./CustomerConfirmStep";
import CustomerSuccessStep from "./CustomerSuccessStep";
import Modal from "../ui/Modal";

export default function CustomerModal({ isOpen, onSave, onClose, customer }) {
  const [step, setStep] = useState(1);
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
      setStep(1);
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

  const handleFormSubmit = (e) => {
    e?.preventDefault();

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

    setFormData((prev) => ({
      ...prev,
      contactNumber: formatPhilippinePhone(prev.contactNumber),
    }));

    setStep(2);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await onSave(formData, customer ? customer.id : null);
      setIsSubmitting(false);
      setStep(3);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err.message || "Failed to save customer. Please try again.");
    }
  };

  let modalTitle = "";
  let modalSubtitle = "";
  let modalIcon = UserRoundPlus;
  let modalBadge = null;

  if (step === 1) {
    modalTitle = customer ? "Edit Customer Profile" : "Add New Customer";
    modalSubtitle = customer ? "Update client segment, delivery and contact details" : "Register client account, segment & delivery destination";
    modalIcon = customer ? UserRound : UserRoundPlus;
    modalBadge = !customer ? (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
        Step 1 of 3
      </span>
    ) : null;
  } else if (step === 2) {
    modalTitle = "Confirm Information";
    modalSubtitle = "Verify customer details before saving to directory";
    modalIcon = ShieldCheck;
    modalBadge = (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1]">
        Step 2 of 3
      </span>
    );
  } else if (step === 3) {
    modalTitle = customer ? "Customer Profile Updated" : "Customer Profile Created";
    modalSubtitle = "Customer is active in sales directory";
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
          <CustomerFormStep
            formData={formData}
            setFormData={setFormData}
            customer={customer}
            phoneError={phoneError}
            setPhoneError={setPhoneError}
            onSubmit={handleFormSubmit}
            onClose={onClose}
          />
        )}

        {step === 2 && (
          <div className="flex flex-col">
            {submitError && (
              <p className="text-red-500 text-xs font-semibold pb-2">
                {submitError}
              </p>
            )}
            <CustomerConfirmStep
              formData={formData}
              onConfirm={handleConfirmSave}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {step === 3 && (
          <CustomerSuccessStep formData={formData} onDone={onClose} />
        )}
      </div>
    </Modal>
  );
}
