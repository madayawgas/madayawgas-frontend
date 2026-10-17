// src/api/inventory.js
import { apiClient } from "./client.js";
import { authApi } from "./auth.js";

/**
 * Inventory / Product API Service
 * Interacts with /api/inventory/products and /api/inventory/plant endpoints
 * based on docs/api-contracts/inventory/
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
   * @param {object} [params] - Query parameters (search, category, containerType, status, isActive, sortBy, sortOrder, page, limit)
   * @returns {Promise<Array>} Array of product items
   */
  async getInventoryItems(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category && params.category !== "All Categories" && params.category !== "All") {
      query.append("category", params.category);
    }
    if (params.containerType && params.containerType !== "All") {
      query.append("containerType", params.containerType);
    }
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.isActive !== undefined) query.append("isActive", params.isActive);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/inventory/products${queryString}`);
    if (Array.isArray(result?.data)) {
      return result.data;
    }
    return result?.data?.products || (Array.isArray(result) ? result : []);
  },

  /**
   * View Single Item Profile.
   * @param {string} id - Product UUID
   * @returns {Promise<object>} Product item object
   */
  async getInventoryItemById(id) {
    const result = await apiClient(`/inventory/products/${id}`);
    return result?.data?.product || result?.data || result;
  },

  /**
   * Register Item / Product.
   * @param {{ name: string, category: string, containerType: string, netWeightKg: number, isActive?: boolean }} productData
   * @returns {Promise<{ product: object }>} Created product response
   */
  async createProduct(productData) {
    if (productData.name && !/^[a-zA-Z0-9\s.-]+$/.test(productData.name.trim())) {
      const err = new Error("Product name cannot contain special characters.");
      err.status = 400;
      throw err;
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
    if (productData.name && !/^[a-zA-Z0-9\s.-]+$/.test(productData.name.trim())) {
      const err = new Error("Product name cannot contain special characters.");
      err.status = 400;
      throw err;
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
    const password =
      typeof confirmPassword === "object"
        ? confirmPassword?.confirmPassword || confirmPassword?.adminPassword
        : confirmPassword;
    const result = await apiClient(`/inventory/products/${id}/deactivate`, {
      method: "PATCH",
      body: {
        confirmPassword: password,
        adminPassword: password,
        confirm_password: password,
        admin_password: password,
      },
    });
    return result.data;
  },

  // Backward compatibility alias for stock update
  async updateStock(id, stockData) {
    return this.updateProduct(id, stockData);
  },

  // ==========================================
  // Plant Yard Bulk Inventory & Reconciliation
  // ==========================================

  /**
   * Master Bunawan Yard bulk inventory overview across all active products.
   * Guarantees all active catalog products are represented in the list.
   */
  async getPlantInventory() {
    try {
      const [plantRes, productsRes] = await Promise.allSettled([
        apiClient(`/inventory/plant`),
        apiClient(`/inventory/products?status=ACTIVE`),
      ]);

      const plantList =
        plantRes.status === "fulfilled"
          ? plantRes.value?.data?.inventory || plantRes.value?.data || []
          : [];
      const productList =
        productsRes.status === "fulfilled"
          ? productsRes.value?.data?.products || (Array.isArray(productsRes.value?.data) ? productsRes.value.data : [])
          : [];

      const normalizedPlantList = Array.isArray(plantList)
        ? plantList.map((item) => ({
            ...item,
            productId: item.productId || item.product_id,
            productName: item.productName || item.product_name,
            containerType: item.containerType || item.container_type,
            netWeightKg: item.netWeightKg !== undefined ? item.netWeightKg : Number(item.net_weight_kg) || 0,
            quantityFilled: item.quantityFilled !== undefined ? item.quantityFilled : Number(item.quantity_filled) || 0,
            quantityEmptyGood: item.quantityEmptyGood !== undefined ? item.quantityEmptyGood : Number(item.quantity_empty_good) || 0,
            quantityDefective: item.quantityDefective !== undefined ? item.quantityDefective : Number(item.quantity_defective) || 0,
            cratesFilled: item.cratesFilled !== undefined ? item.cratesFilled : (item.container_type === 'CANISTER' ? Math.floor(Number(item.quantity_filled) / 24) : null),
            cratesEmptyGood: item.cratesEmptyGood !== undefined ? item.cratesEmptyGood : (item.container_type === 'CANISTER' ? Math.floor(Number(item.quantity_empty_good) / 24) : null),
            cratesDefective: item.cratesDefective !== undefined ? item.cratesDefective : (item.container_type === 'CANISTER' ? Math.floor(Number(item.quantity_defective) / 24) : null),
          }))
        : [];

      // Defensively ensure that all active products are present in the returned plant list
      if (Array.isArray(productList) && productList.length > 0) {
        const existingProductIds = new Set(normalizedPlantList.map((p) => p.productId));
        productList.forEach((prod) => {
          if (prod.isActive !== false && !existingProductIds.has(prod.id)) {
            normalizedPlantList.push({
              id: `pln-${prod.id}`,
              productId: prod.id,
              productName: prod.name,
              category: prod.category,
              containerType: prod.containerType,
              netWeightKg: prod.netWeightKg,
              quantityFilled: 0,
              cratesFilled: prod.containerType === "CANISTER" ? 0 : null,
              quantityEmptyGood: 0,
              cratesEmptyGood: prod.containerType === "CANISTER" ? 0 : null,
              quantityDefective: 0,
              cratesDefective: prod.containerType === "CANISTER" ? 0 : null,
              lastCountedAt: prod.createdAt || new Date().toISOString(),
              updatedAt: prod.updatedAt || new Date().toISOString(),
            });
            existingProductIds.add(prod.id);
          }
        });
      }

      return normalizedPlantList;
    } catch (err) {
      console.error("Failed to fetch plant inventory from API:", err);
      throw err;
    }
  },

  /**
   * Record supplier bulk shipment stock-in.
   */
  async restockPlant(payload) {
    const res = await apiClient(`/inventory/plant/restock`, {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  /**
   * Quarantines yard leakers or defective stock.
   */
  async quarantineDefects(payload) {
    const res = await apiClient(`/inventory/plant/quarantine-defects`, {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  /**
   * Calculate suggested equal truck loading split.
   */
  async getSuggestedSplit(productId, activeTripCount = 3) {
    const res = await apiClient(
      `/inventory/plant/suggested-split?productId=${productId}&activeTripCount=${activeTripCount}`
    );
    return res?.data;
  },

  // ==========================================
  // Global Cross-Fleet Stock Movement Transfers
  // ==========================================

  /**
   * Global cross-fleet inventory transfers ledger.
   * Consumes GET /api/inventory/transfers
   * @param {object} params - { page, limit, search, transferType, startDate, endDate, productId, tripId, truckId }
   * @returns {Promise<{ transfers: Array, meta: object }>}
   */
  async getTransfers(params = {}) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;

    const query = new URLSearchParams();
    query.append("page", page);
    query.append("limit", limit);
    if (params.transferType && params.transferType !== "ALL") query.append("transferType", params.transferType);
    if (params.search && params.search.trim()) query.append("search", params.search.trim());
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.productId) query.append("productId", params.productId);
    if (params.tripId) query.append("tripId", params.tripId);
    if (params.truckId) query.append("truckId", params.truckId);

    try {
      const res = await apiClient(`/inventory/transfers?${query.toString()}`);
      const rawList = res?.data || [];
      const meta = res?.meta || {
        page,
        limit,
        totalItems: rawList.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };
      return {
        transfers: Array.isArray(rawList) ? rawList : [],
        meta,
      };
    } catch (err) {
      console.warn("apiClient /inventory/transfers failed, returning empty list:", err.message);
      return {
        transfers: [],
        meta: { page: 1, limit, totalItems: 0, totalPages: 1 },
      };
    }
  },

  /**
   * Historical plant stock adjustments audit log.
   */
  async getPlantAdjustments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const qs = query ? `?${query}` : "";
    const res = await apiClient(`/inventory/plant/adjustments${qs}`);
    return res?.data?.adjustments || res?.data || [];
  },

  /**
   * Retrieves all multi-load and return transfer slips for a trip.
   */
  async getTripTransfers(tripId) {
    const res = await apiClient(`/inventory/trips/${tripId}/transfers`);
    return res?.data?.transfers || res?.data || [];
  },
};
