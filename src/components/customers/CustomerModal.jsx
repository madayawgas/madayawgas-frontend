import { useState, useEffect } from "react";
import { customersApi } from "../../api/customers.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { isValidPhilippinePhone, formatPhilippinePhone } from "../../utils/phone.js";
import CustomerFormStep from "./CustomerFormStep";
import CustomerConfirmStep from "./CustomerConfirmStep";
import CustomerPasswordStep from "./CustomerPasswordStep";
import CustomerSuccessStep from "./CustomerSuccessStep";

export default function CustomerModal({ isOpen, onSave, onClose, customer }) {
  const { user: currentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

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
      setAdminPassword("");
      setShowPassword(false);
      setPasswordError("");
      setPhoneError("");
      setIsVerifying(false);

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

  const handleSubmit = (e) => {
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
    // Clean format
    setFormData((prev) => ({
      ...prev,
      contactNumber: formatPhilippinePhone(prev.contactNumber),
    }));

    // If edit mode: proceed directly to password verification (matching UserModal pattern)
    // If create mode: show confirm step first
    setStep(customer ? 3 : 2);
  };

  const handleProceed = async () => {
    if (!adminPassword) return;

    setIsVerifying(true);
    setPasswordError("");

    try {
      await customersApi.verifyAdminPassword(
        adminPassword,
        currentUser?.username
      );

      const finalData = {
        ...formData,
        adminPassword,
      };

      await onSave(finalData, customer ? customer.id : null);

      setIsVerifying(false);
      setStep(4);
    } catch (err) {
      setIsVerifying(false);
      setPasswordError(
        err.message || "Incorrect admin password. Please try again."
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-[2rem] w-full shadow-xl flex flex-col overflow-hidden transition-all duration-300 ${
          step === 4 ? "max-w-md" : "max-w-lg"
        }`}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center">
          <h2 className="text-[28px] font-bold text-[#0B4A6E]">
            {step === 1 && (customer ? "Edit Customer" : "Add New Customer")}
            {step === 2 && "Confirm Information"}
            {step === 3 && "Input Password"}
            {step === 4 && (customer ? "Customer Updated" : "Customer Created")}
          </h2>
          {(step === 2 || step === 3) && (
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              className="text-[#0B4A6E] hover:opacity-70 transition-opacity p-1 cursor-pointer"
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
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        )}

        {/* Step 2: Confirmation Summary */}
        {step === 2 && (
          <CustomerConfirmStep
            formData={formData}
            onConfirm={() => setStep(3)}
          />
        )}

        {/* Step 3: Password Confirmation */}
        {step === 3 && (
          <CustomerPasswordStep
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            passwordError={passwordError}
            setPasswordError={setPasswordError}
            isVerifying={isVerifying}
            currentUser={currentUser}
            onProceed={handleProceed}
          />
        )}

        {/* Step 4: Success Display */}
        {step === 4 && (
          <CustomerSuccessStep formData={formData} onDone={onClose} />
        )}
      </div>
    </div>
  );
}
