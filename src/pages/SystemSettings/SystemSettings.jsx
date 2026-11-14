import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Info, Loader2, RotateCcw, Save, AlertCircle } from "lucide-react";
import { settingsApi } from "../../api/settings.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS } from "../../utils/permissions.js";
import ToastNotification from "../../components/ui/ToastNotifications.jsx";

const CATEGORY_ORDER = ["FLEET", "OPERATIONS", "INVENTORY", "SCHEDULES"];

function formatCategoryTitle(category) {
  if (!category) return "General";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

function validateSettingValue(setting, rawValue) {
  if (setting.valueType === "BOOLEAN") {
    return null;
  }

  const str = String(rawValue ?? "").trim();
  if (!str) {
    return "Value is required.";
  }

  if (setting.valueType === "INTEGER" || setting.valueType === "NUMBER") {
    const num = Number(str);
    if (!Number.isFinite(num)) {
      return `Must be a valid ${setting.valueType === "INTEGER" ? "whole number" : "number"}.`;
    }
    if (setting.valueType === "INTEGER" && !Number.isInteger(num)) {
      return "Must be a whole integer.";
    }
    if (setting.minValue !== null && setting.minValue !== undefined && num < setting.minValue) {
      return `Minimum is ${setting.minValue}${setting.unit ? ` ${setting.unit}` : ""}.`;
    }
    if (setting.maxValue !== null && setting.maxValue !== undefined && num > setting.maxValue) {
      return `Maximum is ${setting.maxValue}${setting.unit ? ` ${setting.unit}` : ""}.`;
    }
  }

  return null;
}

function toInputValue(setting) {
  if (setting.valueType === "BOOLEAN") {
    return Boolean(setting.value);
  }
  return setting.value !== null && setting.value !== undefined ? String(setting.value) : "";
}

function toSubmitValue(setting, draftValue) {
  if (setting.valueType === "BOOLEAN") {
    return Boolean(draftValue);
  }
  if (setting.valueType === "INTEGER" || setting.valueType === "NUMBER") {
    return Number(String(draftValue).trim());
  }
  return String(draftValue ?? "").trim();
}

function InfoTooltip({ label, description }) {
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState(null);

  const show = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 256;
    const margin = 12;
    const centerX = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      Math.max(centerX, tooltipWidth / 2 + margin),
      window.innerWidth - tooltipWidth / 2 - margin
    );
    const placeBelow = rect.top < 120;

    setCoords({
      left: clampedLeft,
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      placeBelow,
      arrowOffset: centerX - clampedLeft,
    });
  };

  const hide = () => setCoords(null);

  return (
    <div className="inline-flex items-center shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Info about ${label}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="text-[#6D8AA2] hover:text-[#0A4B6E] focus:text-[#0A4B6E] focus:outline-none rounded-full p-0.5 transition-colors cursor-help"
      >
        <Info size={15} />
      </button>

      {coords &&
        createPortal(
          <div
            role="tooltip"
            style={{
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              transform: coords.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
            className="fixed z-[9999] pointer-events-none w-64 px-3 py-2 rounded-lg bg-[#0A4B6E] text-white text-[11px] leading-relaxed font-normal shadow-xl"
          >
            {description}
            <span
              style={{ left: `calc(50% + ${coords.arrowOffset}px)` }}
              className={`absolute -translate-x-1/2 border-4 border-transparent ${
                coords.placeBelow
                  ? "bottom-full border-b-[#0A4B6E]"
                  : "top-full border-t-[#0A4B6E]"
              }`}
            />
          </div>,
          document.body
        )}
    </div>
  );
}

export default function SystemSettings() {
  const { can } = useAuth();
  const canManage = can(PERMISSIONS.SETTINGS_MANAGE);

  const [settings, setSettings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const list = await settingsApi.getSettings();
      setSettings(list);
      const initialDrafts = {};
      for (const item of list) {
        initialDrafts[item.key] = toInputValue(item);
      }
      setDrafts(initialDrafts);
      setErrors({});
    } catch (err) {
      setLoadError(err?.message || "Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const dirtyKeys = useMemo(() => {
    return settings
      .filter((s) => {
        const current = drafts[s.key];
        const original = toInputValue(s);
        if (s.valueType === "BOOLEAN") {
          return Boolean(current) !== Boolean(original);
        }
        return String(current ?? "").trim() !== String(original).trim();
      })
      .map((s) => s.key);
  }, [settings, drafts]);

  const isDirty = dirtyKeys.length > 0;

  const groupedSettings = useMemo(() => {
    const groups = new Map();
    for (const item of settings) {
      const cat = item.category || "GENERAL";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(item);
    }
    const entries = Array.from(groups.entries());
    entries.sort(([a], [b]) => {
      const idxA = CATEGORY_ORDER.indexOf(a);
      const idxB = CATEGORY_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return entries;
  }, [settings]);

  const handleChange = (setting, nextVal) => {
    setDrafts((prev) => ({ ...prev, [setting.key]: nextVal }));
    if (errors[setting.key]) {
      const err = validateSettingValue(setting, nextVal);
      setErrors((prev) => ({ ...prev, [setting.key]: err }));
    }
  };

  const handleBlur = (setting) => {
    const err = validateSettingValue(setting, drafts[setting.key]);
    setErrors((prev) => ({ ...prev, [setting.key]: err }));
  };

  const handleDiscard = () => {
    const resetDrafts = {};
    for (const item of settings) {
      resetDrafts[item.key] = toInputValue(item);
    }
    setDrafts(resetDrafts);
    setErrors({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canManage || !isDirty || saving) return;

    const nextErrors = {};
    let hasError = false;
    for (const key of dirtyKeys) {
      const setting = settings.find((s) => s.key === key);
      if (!setting) continue;
      const err = validateSettingValue(setting, drafts[key]);
      if (err) {
        nextErrors[key] = err;
        hasError = true;
      }
    }

    if (hasError) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      setToast({
        show: true,
        type: "error",
        message: "Please fix the highlighted validation errors before saving.",
      });
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.allSettled(
        dirtyKeys.map((key) => {
          const setting = settings.find((s) => s.key === key);
          return settingsApi.updateSetting(key, toSubmitValue(setting, drafts[key]));
        })
      );

      const updatedByKey = new Map();
      const failedKeys = [];

      results.forEach((res, idx) => {
        const key = dirtyKeys[idx];
        if (res.status === "fulfilled" && res.value) {
          updatedByKey.set(key, res.value);
        } else {
          failedKeys.push({
            key,
            message: res.reason?.message || "Failed to update setting.",
          });
        }
      });

      if (updatedByKey.size > 0) {
        setSettings((prev) => prev.map((s) => updatedByKey.get(s.key) || s));
        setDrafts((prev) => {
          const next = { ...prev };
          for (const [k, updated] of updatedByKey.entries()) {
            next[k] = toInputValue(updated);
          }
          return next;
        });
      }

      if (failedKeys.length > 0) {
        const errMap = {};
        for (const f of failedKeys) {
          errMap[f.key] = f.message;
        }
        setErrors((prev) => ({ ...prev, ...errMap }));
        setToast({
          show: true,
          type: "error",
          message:
            updatedByKey.size > 0
              ? `Saved ${updatedByKey.size} setting(s), but ${failedKeys.length} failed.`
              : failedKeys[0].message,
        });
      } else {
        setToast({
          show: true,
          type: "success",
          message: `Updated ${updatedByKey.size} system ${updatedByKey.size === 1 ? "setting" : "settings"}.`,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <ToastNotification
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <form onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto">
        {/* Top Action Bar */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 pb-4">
          <p className="text-xs sm:text-sm text-[#6D8AA2] font-medium">
            Operational thresholds and organization-wide configuration variables.
          </p>

          {canManage && (
            <div className="flex items-center gap-2 ml-auto">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  <span>Discard</span>
                </button>
              )}
              <button
                type="submit"
                disabled={!isDirty || saving}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-[#FFDF2C] text-[#0A4B6E] hover:bg-[#ebd024] transition-colors shadow-2xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-6 space-y-5">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-10 flex flex-col items-center justify-center gap-2 text-[#6D8AA2]">
              <Loader2 size={24} className="animate-spin text-[#0A4B6E]" />
              <span className="text-xs font-medium">Loading system settings...</span>
            </div>
          ) : loadError ? (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 flex flex-col items-center justify-center gap-3 text-center">
              <AlertCircle size={24} className="text-rose-600" />
              <p className="text-sm font-medium text-slate-700">{loadError}</p>
              <button
                type="button"
                onClick={fetchSettings}
                className="h-9 px-4 rounded-full text-[11px] font-bold uppercase tracking-widest bg-[#0A4B6E] text-white hover:bg-[#083a56] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : groupedSettings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center text-sm text-[#6D8AA2]">
              No system settings configured.
            </div>
          ) : (
            groupedSettings.map(([category, items]) => (
              <section
                key={category}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs"
              >
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#1B4B75]">
                    {formatCategoryTitle(category)}
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map((setting) => {
                    const value = drafts[setting.key] ?? "";
                    const error = errors[setting.key];
                    const isRowDirty = dirtyKeys.includes(setting.key);

                    return (
                      <div
                        key={setting.key}
                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Label + (i) Tooltip */}
                        <div className="flex items-center gap-2 min-w-0">
                          <label
                            htmlFor={setting.key}
                            className="text-sm font-semibold text-[#0A4B6E] leading-snug cursor-pointer"
                          >
                            {setting.label}
                          </label>

                          {isRowDirty && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#F6C445] shrink-0"
                              title="Unsaved change"
                              aria-label="Unsaved change"
                            />
                          )}

                          {setting.description && (
                            <InfoTooltip
                              label={setting.label}
                              description={setting.description}
                            />
                          )}
                        </div>

                        {/* Control */}
                        <div className="flex flex-col sm:items-end shrink-0">
                          {setting.valueType === "BOOLEAN" ? (
                            <button
                              id={setting.key}
                              type="button"
                              role="switch"
                              aria-checked={Boolean(value)}
                              disabled={!canManage || saving}
                              onClick={() => handleChange(setting, !value)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                value ? "bg-[#0A4B6E]" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  value ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          ) : (
                            <div className="relative flex items-center w-full sm:w-52">
                              <input
                                id={setting.key}
                                type={
                                  setting.valueType === "INTEGER" || setting.valueType === "NUMBER"
                                    ? "number"
                                    : "text"
                                }
                                step={setting.valueType === "INTEGER" ? "1" : "any"}
                                min={setting.minValue ?? undefined}
                                max={setting.maxValue ?? undefined}
                                value={value}
                                disabled={!canManage || saving}
                                onChange={(e) => handleChange(setting, e.target.value)}
                                onBlur={() => handleBlur(setting)}
                                aria-invalid={Boolean(error)}
                                className={`h-10 w-full rounded-xl bg-[#F3F5F5] border text-sm font-semibold text-[#0A4B6E] px-3 transition-colors focus:outline-none focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed ${
                                  setting.unit ? "pr-16" : "pr-3"
                                } ${
                                  error
                                    ? "border-rose-500 focus:border-rose-600"
                                    : isRowDirty
                                      ? "border-[#F6C445] focus:border-[#0A4B6E]"
                                      : "border-slate-200 focus:border-[#0A4B6E]"
                                }`}
                              />
                              {setting.unit && (
                                <span className="pointer-events-none absolute right-3 text-[11px] font-bold uppercase tracking-wide text-[#6D8AA2]">
                                  {setting.unit}
                                </span>
                              )}
                            </div>
                          )}

                          {error && (
                            <span className="mt-1 text-[11px] font-medium text-rose-600">
                              {error}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </form>
    </div>
  );
}
