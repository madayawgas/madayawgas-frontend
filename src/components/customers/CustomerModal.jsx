import { useState, useEffect } from "react";
import { isValidPhilippinePhone, formatPhilippinePhone } from "../../utils/phone.js";
import CustomerFormStep from "./CustomerFormStep";
import CustomerConfirmStep from "./CustomerConfirmStep";
import CustomerSuccessStep from "./CustomerSuccessStep";

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

  useEffect(() => {
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
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();

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

    // Clean format
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-[2rem] w-full shadow-xl flex flex-col overflow-hidden transition-all duration-300 ${
          step === 3 ? "max-w-md" : "max-w-lg"
        }`}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center">
          <h2 className="text-[28px] font-bold text-[#0B4A6E]">
            {step === 1 && (customer ? "Edit Customer" : "Add New Customer")}
            {step === 2 && "Confirm Information"}
            {step === 3 && (customer ? "Customer Updated" : "Customer Created")}
          </h2>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="text-[#0B4A6E] hover:opacity-70 transition-opacity p-1 cursor-pointer disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Step 1: Form Input */}
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

        {/* Step 2: Confirmation Summary */}
        {step === 2 && (
          <div className="flex flex-col">
            {submitError && (
              <p className="text-red-500 text-xs font-semibold px-8 pb-2">
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

        {/* Step 3: Success Display */}
        {step === 3 && (
          <CustomerSuccessStep formData={formData} onDone={onClose} />
        )}
      </div>
    </div>
  );
}
