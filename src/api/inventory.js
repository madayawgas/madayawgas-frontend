// src/api/inventory.js
import { apiClient, isMock, delay } from "./client.js";
import mockItems from "../mocks/items.json" with { type: "json" };
import mockPlantInventory from "../mocks/plant-inventory.json" with { type: "json" };
import { authApi } from "./auth.js";

// In-memory collection initialized from mockItems
let inMemoryItems = Array.isArray(mockItems)
  ? [...mockItems]
  : mockItems?.data?.products
  ? [...mockItems.data.products]
  : [];

let inMemoryPlantStock = mockPlantInventory?.data?.inventory
  ? [...mockPlantInventory.data.inventory]
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

    if (isMock) {
      await delay(300);
      const newProduct = {
        id: `itm-${Date.now()}`,
        name: productData.name.trim(),
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
    if (productData.name && !/^[a-zA-Z0-9\s.-]+$/.test(productData.name.trim())) {
      const err = new Error("Product name cannot contain special characters.");
      err.status = 400;
      throw err;
    }

    if (isMock) {
      await delay(250);
      const index = inMemoryItems.findIndex((i) => i.id === id);
      const existing = index !== -1 ? inMemoryItems[index] : {};
      const updated = {
        ...existing,
        ...productData,
        name: productData.name !== undefined ? productData.name.trim() : existing.name,
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
   */
  async getPlantInventory() {
    if (isMock) {
      await delay(250);
      return inMemoryPlantStock;
    }

    try {
      const res = await apiClient(`/inventory/plant`);
      const list = res?.data?.inventory || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item) => ({
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
        }));
      }
      return inMemoryPlantStock;
    } catch (err) {
      console.warn("Failed to fetch plant inventory from API, using fallback:", err.message);
      return inMemoryPlantStock;
    }
  },

  /**
   * Record supplier bulk shipment stock-in.
   */
  async restockPlant(payload) {
    if (isMock) {
      await delay(300);
      const idx = inMemoryPlantStock.findIndex((p) => p.productId === payload.productId);
      if (idx !== -1) {
        const item = inMemoryPlantStock[idx];
        const addedUnits = Number(payload.quantityUnits) || 0;
        item.quantityFilled = (item.quantityFilled || 0) + addedUnits;
        if (item.cratesFilled !== null) {
          item.cratesFilled = Math.floor(item.quantityFilled / 24);
        }
        item.updatedAt = new Date().toISOString();
      }
      return {
        message: `Supplier restock of ${payload.quantityUnits} units recorded successfully`,
      };
    }

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
    if (isMock) {
      await delay(300);
      const idx = inMemoryPlantStock.findIndex((p) => p.productId === payload.productId);
      if (idx !== -1) {
        const item = inMemoryPlantStock[idx];
        const movedUnits = Number(payload.quantityUnits) || 0;
        if (payload.sourceCondition === "EMPTY_GOOD") {
          item.quantityEmptyGood = Math.max(0, (item.quantityEmptyGood || 0) - movedUnits);
        } else {
          item.quantityFilled = Math.max(0, (item.quantityFilled || 0) - movedUnits);
          if (item.cratesFilled !== null) {
            item.cratesFilled = Math.floor(item.quantityFilled / 24);
          }
        }
        item.quantityDefective = (item.quantityDefective || 0) + movedUnits;
        if (item.cratesDefective !== null) {
          item.cratesDefective = Math.floor(item.quantityDefective / 24);
        }
        item.updatedAt = new Date().toISOString();
      }
      return {
        message: `Quarantined ${payload.quantityUnits} units to defective inventory`,
      };
    }

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
    if (isMock) {
      await delay(200);
      const item = inMemoryPlantStock.find((p) => p.productId === productId);
      const available = item?.quantityFilled || 0;
      const count = Number(activeTripCount) || 1;
      const suggestedUnits = Math.floor(available / count);
      return {
        productId,
        productName: item?.productName || "Product",
        totalAvailableFilledUnits: available,
        activeTripCount: count,
        suggestedUnitsPerTruck: suggestedUnits,
        suggestedCratesPerTruck: Math.floor(suggestedUnits / 24),
        remainingUnits: available % count,
      };
    }

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

    if (isMock) {
      await delay(200);

      // Collect mock transfers from cached trips loads + mock adjustments
      let mockList = [];
      try {
        const cachedTrips = localStorage.getItem("app_trips_cache");
        const parsedTrips = cachedTrips ? JSON.parse(cachedTrips) : [];
        parsedTrips.forEach((trip) => {
          (trip.loads || []).forEach((load) => {
            mockList.push({
              id: load.id || `trans-${Date.now()}-${Math.random()}`,
              sourceType: "TRIP_LOAD",
              transferType: load.transferType || "DISPATCH_LOAD",
              slipNumber: load.slipNumber || `LOAD-${trip.tripNumber}`,
              recordedAt: load.recordedAt || trip.departureTime || new Date().toISOString(),
              recordedBy: load.recordedBy || {
                username: "plant_supervisor",
                firstName: "Plant",
                lastName: "Supervisor",
              },
              remarks: load.remarks || trip.notes || "Trip load manifest",
              trip: {
                id: trip.id,
                tripNumber: trip.tripNumber,
                truckId: trip.truckId,
                plateNumber: trip.truckPlate,
              },
              supplierInvoiceNumber: null,
              items: (load.items || []).map((it) => ({
                id: it.id || `item-${Math.random()}`,
                productId: it.productId,
                productName: it.productName || "LPG Product",
                productCategory: it.productCategory || "Cylinder",
                containerType: it.containerType || "CYLINDER",
                netWeightKg: it.netWeightKg || 11.0,
                condition: it.condition || "FILLED",
                quantityUnits: Number(it.quantityUnits) || 0,
                crates: it.containerType === "CANISTER" ? Math.floor((it.quantityUnits || 0) / 24) : null,
              })),
            });
          });
        });
      } catch (e) {
        console.warn("Error collecting mock trip transfers:", e);
      }

      // Add mock supplier restock and defect movements if list is small
      if (mockList.length < 5) {
        mockList.push(
          {
            id: "trans-mock-restock-1",
            sourceType: "PLANT_ADJUSTMENT",
            transferType: "SUPPLIER_PURCHASE",
            slipNumber: "INV-SUP-2026-108",
            recordedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            recordedBy: { username: "plant_user", firstName: "Plant", lastName: "Manager" },
            remarks: "Bulk shipment intake from refinery depot",
            trip: null,
            supplierInvoiceNumber: "INV-SUP-2026-108",
            items: [
              {
                id: "item-rst-1",
                productId: "e9b21f37-142c-4f76-96f3-a3d8b02e7b91",
                productName: "Butane Canister 250g",
                containerType: "CANISTER",
                condition: "FILLED",
                quantityUnits: 2400,
                crates: 100,
              },
            ],
          },
          {
            id: "trans-mock-quarantine-1",
            sourceType: "PLANT_ADJUSTMENT",
            transferType: "DEFECT_ADJUSTMENT",
            slipNumber: "QUAR-20261008-01",
            recordedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
            recordedBy: { username: "plant_supervisor", firstName: "Yard", lastName: "Inspector" },
            remarks: "Defective valve quarantine during intake check",
            trip: null,
            supplierInvoiceNumber: null,
            items: [
              {
                id: "item-qar-1",
                productId: "27d6365b-bfb0-4ca7-b286-63d1bcfa2520",
                productName: "11kg LPG Cylinder",
                containerType: "CYLINDER",
                condition: "DEFECTIVE",
                quantityUnits: 8,
                crates: null,
              },
            ],
          }
        );
      }

      // Filter by transferType
      if (params.transferType && params.transferType !== "ALL") {
        mockList = mockList.filter(
          (t) => (t.transferType || "").toUpperCase() === params.transferType.toUpperCase()
        );
      }

      // Filter by search query
      if (params.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        mockList = mockList.filter(
          (t) =>
            (t.slipNumber || "").toLowerCase().includes(q) ||
            (t.trip?.tripNumber || "").toLowerCase().includes(q) ||
            (t.trip?.plateNumber || "").toLowerCase().includes(q) ||
            (t.supplierInvoiceNumber || "").toLowerCase().includes(q) ||
            (t.remarks || "").toLowerCase().includes(q)
        );
      }

      // Sort reverse chronological
      mockList.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

      const totalItems = mockList.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const startIndex = (page - 1) * limit;
      const paginatedItems = mockList.slice(startIndex, startIndex + limit);

      return {
        transfers: paginatedItems,
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

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
      console.warn("apiClient /inventory/transfers failed, falling back to mock:", err.message);
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
    if (isMock) {
      await delay(150);
      return [];
    }

    const query = new URLSearchParams(params).toString();
    const qs = query ? `?${query}` : "";
    const res = await apiClient(`/inventory/plant/adjustments${qs}`);
    return res?.data?.adjustments || res?.data || [];
  },

  /**
   * Retrieves all multi-load and return transfer slips for a trip.
   */
  async getTripTransfers(tripId) {
    if (isMock) {
      await delay(100);
      return [];
    }

    const res = await apiClient(`/inventory/trips/${tripId}/transfers`);
    return res?.data?.transfers || res?.data || [];
  },
};
