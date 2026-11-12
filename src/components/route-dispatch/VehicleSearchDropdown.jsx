// src/components/route-dispatch/VehicleSearchDropdown.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Truck, Search, ChevronDown, Check, X } from "lucide-react";

/**
 * VehicleSearchDropdown — Compact, high-contrast searchable dropdown for vehicle plate numbers.
 * Conforms to MadayawGas UI standards (Dark Navy #0A4B6E, crisp borders, immediate search filter).
 */
export default function VehicleSearchDropdown({
  trips = [],
  selectedTripId = "",
  onSelectTrip,
  placeholder = "Select vehicle plate number...",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const selectedTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  // Filter trips by plate number, trip number, or driver
  const filteredTrips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) => {
      const plate = (t.truckPlate || "").toLowerCase();
      const tripNum = String(t.tripNumber || "").toLowerCase();
      const driver = (t.driverName || "").toLowerCase();
      return plate.includes(q) || tripNum.includes(q) || driver.includes(q);
    });
  }, [trips, searchQuery]);

  const handleSelect = (trip) => {
    onSelectTrip(trip.id);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left w-full sm:w-[280px]">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || trips.length === 0}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-10 px-3.5 py-2 bg-white border rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs select-none ${
          isOpen
            ? "border-[#0A4B6E] ring-2 ring-[#0A4B6E]/20"
            : "border-[#0A4B6E]/30 hover:border-[#0A4B6E]/60 hover:bg-[#F8FBFC]"
        } ${disabled || trips.length === 0 ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Truck size={16} className="text-[#0A4B6E] shrink-0" />
          {selectedTrip ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-xs text-[#0A4B6E] truncate">
                {selectedTrip.truckPlate}
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#E8F3F8] text-[#0A4B6E] shrink-0 border border-[#BCE1F1]">
                #{selectedTrip.tripNumber}
              </span>
              {(selectedTrip.rawStatus || selectedTrip.status || "").toUpperCase() === "IN_PROGRESS" && (
                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full shrink-0">
                  En Route
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-500 truncate">
              {trips.length === 0 ? "No returning vehicles" : placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          size={14}
          className={`text-[#6D8AA2] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0A4B6E]" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full sm:w-[320px] bg-white rounded-xl shadow-xl border border-[#0A4B6E]/30 py-2 z-50 animate-scale-in text-left">
          {/* Search Input Header */}
          <div className="px-2.5 pb-2 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-[#6D8AA2] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plate number..."
                className="w-full pl-8 pr-7 py-1.5 text-xs text-slate-800 bg-[#F4F8FA] border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#0A4B6E] focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List of Vehicles */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-50 pt-1">
            {filteredTrips.length > 0 ? (
              filteredTrips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                return (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => handleSelect(trip)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#E2EDF3] text-[#0A4B6E]"
                        : "hover:bg-[#F4F9FC] text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-[#0A4B6E]">
                          {trip.truckPlate}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          #{trip.tripNumber}
                        </span>
                        {(trip.rawStatus || trip.status || "").toUpperCase() === "IN_PROGRESS" ? (
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full">
                            En Route
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                            Returned
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {trip.driverName || "Driver"} {trip.zoneCode ? `· ${trip.zoneCode}` : ""}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-[#0A4B6E] shrink-0 font-bold" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-4 px-3 text-center text-xs text-slate-400">
                No matching plate numbers found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
