// src/components/route-dispatch/ZonesModal.jsx
import { useState } from "react";
import { MapPin, X, Plus, Edit2 } from "lucide-react";

export default function ZonesModal({
  isOpen,
  onClose,
  zones = [],
  onCreateZone,
  onUpdateZone,
  canManage = true,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsEditing(false);
    setSelectedZone(null);
    setCode("");
    setName("");
    setDescription("");
    setIsActive(true);
  };

  const handleStartEdit = (zone) => {
    setIsEditing(true);
    setSelectedZone(zone);
    setCode(zone.code);
    setName(zone.name);
    setDescription(zone.description || "");
    setIsActive(zone.isActive !== false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      if (isEditing && selectedZone) {
        await onUpdateZone(selectedZone.id, {
          name,
          description,
          isActive,
        });
      } else {
        await onCreateZone({
          code: code.toUpperCase().trim(),
          name: name.trim(),
          description: description.trim(),
          isActive,
        });
      }
      handleStartCreate();
    } catch (err) {
      setError(err.message || "Failed to save service zone");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0E384E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#D5E3EC] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E8F3F8] text-[#0A4B6E] flex items-center justify-center font-bold">
              <MapPin size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A4B6E]">Service Delivery Zones</h3>
              <p className="text-[11px] text-[#6D8AA2]">Configure delivery route clusters and districts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-[#D93025] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Existing Zones List */}
        <div className="space-y-2">
          <label className="font-bold text-[#0A4B6E] text-xs">Registered Service Zones</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
            {zones.map((z) => (
              <div
                key={z.id}
                className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between hover:border-[#0A4B6E]/30"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#0A4B6E]">{z.code}</span>
                    <span className="text-[10px] text-slate-500 font-medium">({z.name})</span>
                  </div>
                  {z.description && (
                    <p className="text-[10px] text-slate-400 truncate max-w-[170px]">{z.description}</p>
                  )}
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(z)}
                    className="p-1 text-[#0A4B6E] hover:bg-[#E8F3F8] rounded-md cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Zone Form */}
        {canManage && (
          <form onSubmit={handleSubmit} className="p-3.5 bg-[#EDF3F7]/60 rounded-xl border border-[#D5E3EC] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0A4B6E]">
                {isEditing ? `Edit Zone: ${selectedZone?.code}` : "Register New Service Zone"}
              </span>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="text-xs text-[#6D8AA2] hover:text-[#0A4B6E] underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#0A4B6E] mb-1">Route Code *</label>
                <input
                  type="text"
                  disabled={isEditing}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. TORIL"
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs font-bold uppercase focus:outline-[#0A4B6E] disabled:bg-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0A4B6E] mb-1">Zone Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Toril District"
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs focus:outline-[#0A4B6E]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0A4B6E] mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Residential and commercial cluster"
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs focus:outline-[#0A4B6E]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#0A4B6E] text-white hover:bg-[#0E384E] cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "+ Add Service Zone"}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
