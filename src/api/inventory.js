// src/api/inventory.js
import { apiClient, isMock, delay } from "./client.js";
import mockItems from "../mocks/items.json" with { type: "json" };
import { authApi } from "./auth.js";

// In-memory collection initialized from mockItems
let inMemoryItems = Array.isArray(mockItems)
  ? [...mockItems]
  : mockItems?.data?.products
  ? [...mockItems.data.products]
  : [];

/**
 * Inventory / Product API Service
 * Interacts with /api/inventory/products endpoints based on docs/API Contract/inventory-products.api.md
 */
export const inventoryApi = {
  /**
   * Verify admin password before performing sensitive operations.
   * Delegates directly to authApi.
   * @param {string} password
   * @param {string} [username]
   * @returns {Promise<boolean>}
   */
  async verifyAdminPassword(password, username) {
    return authApi.verifyPassword(password, username);
  },

  /**
   * View Item Profiles (List & Search).
   * @param {object} [params] - Query parameters (search, category, containerType, status, isActive)
   * @returns {Promise<Array>} Array of product items
   */
  async getInventoryItems(params = {}) {
    if (isMock) {
      await delay(250);
      let list = [...inMemoryItems];

      // 1. Category Filter
      if (params.category && params.category !== "All Categories") {
        list = list.filter(
          (item) =>
            (item.category || "").toLowerCase() ===
            params.category.toLowerCase()
        );
      }

      // 2. Container Type Filter
      if (params.containerType) {
        list = list.filter(
          (item) =>
            (item.containerType || "").toUpperCase() ===
            params.containerType.toUpperCase()
        );
      }

      // 3. Status Filter
      if (params.status) {
        if (params.status.toUpperCase() === "ACTIVE") {
          list = list.filter((item) => item.isActive === true);
        } else if (params.status.toUpperCase() === "INACTIVE") {
          list = list.filter((item) => item.isActive === false);
        }
      }

      // 4. isActive Filter
      if (params.isActive !== undefined) {
        const activeBool =
          params.isActive === true || params.isActive === "true";
        list = list.filter((item) => item.isActive === activeBool);
      }

      // 5. Search Filter (name, category, containerType)
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (item) =>
            (item.name || "").toLowerCase().includes(q) ||
            (item.category || "").toLowerCase().includes(q) ||
            (item.containerType || "").toLowerCase().includes(q)
        );
      }

      return list;
    }

    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category && params.category !== "All Categories") {
      query.append("category", params.category);
    }
    if (params.containerType) query.append("containerType", params.containerType);
    if (params.status) query.append("status", params.status);
    if (params.isActive !== undefined) query.append("isActive", params.isActive);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/inventory/products${queryString}`);
    return result.data.products;
  },

  /**
   * View Single Item Profile.
   * @param {string} id - Product UUID
   * @returns {Promise<object>} Product item object
   */
  async getInventoryItemById(id) {
    if (isMock) {
      await delay(150);
      const item = inMemoryItems.find((i) => i.id === id);
      if (!item) {
        const error = new Error("Product not found");
        error.status = 404;
        throw error;
      }
      return item;
    }

    const result = await apiClient(`/inventory/products/${id}`);
    return result.data.product;
  },

  /**
   * Register Item / Product.
   * @param {{ name: string, category: string, containerType: string, netWeightKg: number, isActive?: boolean }} productData
   * @returns {Promise<{ product: object }>} Created product response
   */
  async createProduct(productData) {
    if (isMock) {
      await delay(300);
      const newProduct = {
        id: `itm-${Date.now()}`,
        name: productData.name,
        category: productData.category,
        containerType: productData.containerType || "CYLINDER",
        netWeightKg: Number(productData.netWeightKg) || 0,
        isActive:
          productData.isActive !== undefined ? productData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inMemoryItems.unshift(newProduct);
      return { product: newProduct };
    }

    const result = await apiClient("/inventory/products", {
      method: "POST",
      body: productData,
    });
    return result.data;
  },

  /**
   * Update Item Profile.
   * @param {string} id - Product UUID
   * @param {object} productData - Fields to update
   * @returns {Promise<{ product: object }>} Updated product response
   */
  async updateProduct(id, productData) {
    if (isMock) {
      await delay(250);
      const index = inMemoryItems.findIndex((i) => i.id === id);
      const existing = index !== -1 ? inMemoryItems[index] : {};
      const updated = {
        ...existing,
        ...productData,
        netWeightKg:
          productData.netWeightKg !== undefined
            ? Number(productData.netWeightKg)
            : existing.netWeightKg,
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryItems[index] = updated;
      }
      return { product: updated };
    }

    const result = await apiClient(`/inventory/products/${id}`, {
      method: "PATCH",
      body: productData,
    });
    return result.data;
  },

  /**
   * Deactivate Item (Soft delete with password verification).
   * @param {string} id - Product UUID
   * @param {{ confirmPassword?: string }} payload
   * @returns {Promise<{ product: object, message: string }>} Updated deactivated product
   */
  async deactivateProduct(id, { confirmPassword }) {
    if (isMock) {
      await delay(300);
      if (!confirmPassword) {
        const error = new Error("Admin password confirmation is required");
        error.status = 401;
        throw error;
      }

      const index = inMemoryItems.findIndex((i) => i.id === id);
      const existing = index !== -1 ? inMemoryItems[index] : {};
      const updated = {
        ...existing,
        isActive: false,
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryItems[index] = updated;
      }

      return {
        product: updated,
        message: "Product successfully deactivated",
      };
    }

    const result = await apiClient(`/inventory/products/${id}/deactivate`, {
      method: "PATCH",
      body: { confirmPassword },
    });
    return result.data;
  },

  // Backward compatibility alias for stock update
  async updateStock(id, stockData) {
    return this.updateProduct(id, stockData);
  },
};
