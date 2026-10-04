// src/components/fleet/AssignDriverModal.jsx
import { useState, useEffect } from "react";
import { UserRoundX, Truck, Phone, Check } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function AssignDriverModal({
  isOpen,
  truck,
  availableDrivers = [],
  allDrivers = [],
  onClose,
  onAssign,
}) {
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentDriverId = truck?.driverId || truck?.driver?.id || "";
  const currentDriverName = truck?.driver
    ? `${truck.driver.firstName || ""} ${truck.driver.lastName || ""}`.trim() ||
      truck.driver.username
    : truck?.driverName && truck?.driverName !== "Unassigned" && truck?.driverName !== "No Assigned"
    ? truck.driverName
    : null;

  useEffect(() => {
    if (isOpen && truck) {
      setSelectedDriverId(currentDriverId || "");
      setErrorMsg("");
    }
  }, [isOpen, truck, currentDriverId]);

  if (!isOpen || !truck) return null;

  const isDeactivated =
    (truck.status || "").toUpperCase() === "INACTIVE" ||
    (truck.status || "").toUpperCase() === "RETIRED";

  // Compile list of selectable drivers
  const selectableDrivers = [];

  if (currentDriverId && currentDriverName) {
    const matchedCurrent = allDrivers.find((d) => (d.id || d.value) === currentDriverId);
    selectableDrivers.push({
      id: currentDriverId,
      name: currentDriverName,
      phone: matchedCurrent?.phone || truck.driver?.phone || "",
      isCurrent: true,
    });
  }

  availableDrivers.forEach((d) => {
    const dId = d.id || d.value;
    if (dId !== currentDriverId) {
      const name = `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.username || d.label;
      selectableDrivers.push({
        id: dId,
        name,
        phone: d.phone || "",
        isCurrent: false,
      });
    }
  });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isDeactivated) {
      setErrorMsg("Cannot assign driver to a deactivated vehicle.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onAssign({
        truckId: truck.id,
        driverId: selectedDriverId || null,
      });
      onClose();
    } catch (err) {
      console.error("Failed to assign driver:", err);
      setErrorMsg(err.message || "Failed to update driver assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent = (
    <div className="w-full flex flex-col items-center">
      {errorMsg && (
        <div className="w-full bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium border border-red-200 mb-3 text-left">
          {errorMsg}
        </div>
      )}
      <Button
        type="button"
        variant="yellow"
        disabled={isSubmitting}
        onClick={handleSubmit}
        className="w-full font-bold text-sm uppercase tracking-wider mb-2"
      >
        {isSubmitting
          ? "SAVING..."
          : selectedDriverId === ""
          ? "UNASSIGN DRIVER"
          : "CONFIRM ASSIGNMENT"}
      </Button>
      <Button
        type="button"
        variant="cancel"
        disabled={isSubmitting}
        onClick={onClose}
        className="text-xs"
      >
        CANCEL
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Driver"
      maxWidth="max-w-lg"
      footer={footerContent}
    >
      <div className="space-y-4 text-left py-2">
        {/* VEHICLE CONTEXT BANNER */}
        <div className="bg-[#E8F3F8] rounded-xl p-3.5 flex items-center justify-between border border-[#BCE1F1]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A4B6E] text-white flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#0A4B6E] text-base leading-tight">
                {truck.plateNumber || "Truck"}
              </h3>
              <p className="text-xs text-[#588094]">
                {truck.model || "Isuzu Elf"} {truck.yearModel ? `(${truck.yearModel})` : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#588094] block">Current Driver</span>
            <span className="font-semibold text-xs text-[#0A4B6E]">
              {currentDriverName || "Unassigned"}
            </span>
          </div>
        </div>

        {/* DRIVER SELECTION SECTION */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#0A4B6E] uppercase tracking-wider">
              Select Driver <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-[#6D8AA2] font-medium">
              {selectableDrivers.length} {selectableDrivers.length === 1 ? "driver" : "drivers"} available
            </span>
          </div>

          <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
            {/* Option: Unassign Driver */}
            <label
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                selectedDriverId === ""
                  ? "bg-[#FEF6D1] border-[#F6C445] ring-1 ring-[#F6C445] shadow-2xs"
                  : "bg-white border-slate-200 hover:border-[#BCE1F1] hover:bg-[#E8F3F8]/40"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="radio"
                  name="driverSelection"
                  value=""
                  checked={selectedDriverId === ""}
                  onChange={() => setSelectedDriverId("")}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedDriverId === ""
                      ? "border-[#0A4B6E] bg-[#0A4B6E] text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selectedDriverId === "" && <Check size={10} className="stroke-[3]" />}
                </div>
                <div className="flex items-center gap-2">
                  <UserRoundX size={15} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    No Assigned Driver (Unassign)
                  </span>
                </div>
              </div>
            </label>

            {/* Drivers list */}
            {selectableDrivers.map((driver) => {
              const isSelected = selectedDriverId === driver.id;
              return (
                <label
                  key={driver.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#FEF6D1] border-[#F6C445] ring-1 ring-[#F6C445] shadow-2xs"
                      : "bg-white border-slate-200 hover:border-[#BCE1F1] hover:bg-[#E8F3F8]/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="radio"
                      name="driverSelection"
                      value={driver.id}
                      checked={isSelected}
                      onChange={() => setSelectedDriverId(driver.id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-[#0A4B6E] bg-[#0A4B6E] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={10} className="stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0A4B6E] truncate">
                          {driver.name}
                        </span>
                        {driver.isCurrent && (
                          <span className="text-[10px] font-semibold bg-[#BAE6FD] text-[#0A4B6E] px-2 py-0.2 rounded-full shrink-0">
                            Currently Assigned
                          </span>
                        )}
                      </div>
                      {driver.phone && (
                        <p className="text-[11px] text-[#6D8AA2] flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="shrink-0" />
                          <span>{driver.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}

            {selectableDrivers.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No active drivers available in directory.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
