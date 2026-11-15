/**
 * Utility functions for product packaging and measurement types.
 * Enforces business rule:
 * - Butane canisters are measured in both single item (units/cans) and crates (24 cans/crate).
 * - LPG cylinders are counted strictly as single items (units/cylinders). Cylinders have NO crates.
 */

import { BUSINESS_SETTING_DEFAULTS } from "../config/systemConfig.js";

export const UNITS_PER_CANISTER_CRATE =
  BUSINESS_SETTING_DEFAULTS["inventory.canisters_per_crate"];

/**
 * Checks if a product is a butane canister based on containerType, category, or name.
 * @param {object|string} product
 * @returns {boolean}
 */
export function isCanisterProduct(product) {
  if (!product) return false;
  if (typeof product === "string") {
    const s = product.toLowerCase();
    return s.includes("canister") || s.includes("butane");
  }
  const cType = (product.containerType || product.container_type || "").toUpperCase();
  if (cType === "CANISTER") return true;
  if (cType === "CYLINDER") return false;

  const cat = (product.category || "").toLowerCase();
  if (cat.includes("canister") || cat.includes("butane")) return true;

  const name = (product.name || product.productName || "").toLowerCase();
  return name.includes("canister") || name.includes("butane");
}

/**
 * Calculates crates and loose remainder for canister units.
 * @param {number} quantityUnits
 * @returns {{ crates: number, remainder: number }}
 */
export function getCanisterCrates(quantityUnits, unitsPerCrate = UNITS_PER_CANISTER_CRATE) {
  const units = Math.max(0, Number(quantityUnits) || 0);
  const perCrate = Math.max(1, Number(unitsPerCrate) || UNITS_PER_CANISTER_CRATE);
  return {
    crates: Math.floor(units / perCrate),
    remainder: units % perCrate,
  };
}

/**
 * Formats product quantity display string.
 * - Canister: "120 cans (5 crates)" or "125 cans (5 crates + 5 loose)"
 * - Cylinder: "25 cylinders" (strictly no crates)
 * @param {object|string} product
 * @param {number} quantityUnits
 * @param {number} [unitsPerCrate]
 * @returns {string}
 */
export function formatProductQuantity(product, quantityUnits, unitsPerCrate = UNITS_PER_CANISTER_CRATE) {
  const units = Number(quantityUnits) || 0;
  if (isCanisterProduct(product)) {
    const { crates, remainder } = getCanisterCrates(units, unitsPerCrate);
    if (crates === 0 && remainder === 0) return "0 cans";
    if (crates > 0 && remainder > 0) {
      return `${units.toLocaleString()} cans (${crates} crt + ${remainder} loose)`;
    }
    if (crates > 0) {
      return `${units.toLocaleString()} cans (${crates} ${crates === 1 ? "crate" : "crates"})`;
    }
    return `${units.toLocaleString()} cans`;
  }
  return `${units.toLocaleString()} cylinders`;
}
