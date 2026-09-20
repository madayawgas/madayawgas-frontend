import { useState, useEffect, useRef, useCallback } from "react";
import CustomerHeader from "../../components/customers/CustomerHeader";
import CustomerControls from "../../components/customers/CustomerControls";
import CustomerTable from "../../components/customers/CustomerTable";
import CustomerDetailPanel from "../../components/customers/CustomerDetailPanel";
import CustomerModal from "../../components/customers/CustomerModal";
import DeactivateCustomerModal from "../../components/customers/DeactivateCustomerModal";
import AdminPasswordModal from "../../components/users/AdminPasswordModal";
import ToastNotification from "../../components/ui/ToastNotifications";
import { useAuth } from "../../context/AuthContext.jsx";
import { customersApi } from "../../api/customers.js";
import { PERMISSIONS } from "../../utils/permissions.js";

const LOCAL_STORAGE_KEY = "app_customers_cache";

export default function Customers() {
  const { can } = useAuth();

  // Data State
  const [customers, setCustomers] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading cached customers", e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(customers.length === 0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeDetailCustomer, setActiveDetailCustomer] = useState(null);
  const [isClosingPanel, setIsClosingPanel] = useState(false);
  const closeTimerRef = useRef(null);

  // Modal and Action States
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDeactivate, setCustomerToDeactivate] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState(null); // { message: string, type: string }

  // Search, Filter, Sort and Server Pagination (Strategy B)
  const [page, setPage] = useState(1);
  const limit = 20;
  const [searchTerm, setSearchTerm] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    customerType: "All Types",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  // Permissions
  const canManage = can
    ? can(PERMISSIONS?.SALES_UPDATE || "sales.update") ||
      can(PERMISSIONS?.SALES_CREATE || "sales.create")
    : true;
  const canCreate = can
    ? can(PERMISSIONS?.SALES_CREATE || "sales.create")
    : true;

  // Load Customers (Server Pagination & Filters)
  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await customersApi.getCustomers({
        page,
        limit,
        search: committedSearch.trim() || undefined,
        customerType: filters.customerType === "All Types" ? undefined : filters.customerType,
        status: filters.status || undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      if (res?.data && Array.isArray(res.data)) {
        setCustomers(res.data);
        if (res.meta) {
          setPaginationMeta(res.meta);
        } else {
          setPaginationMeta({
            page,
            limit,
            totalItems: res.data.length,
            totalPages: Math.max(1, Math.ceil(res.data.length / limit)),
          });
        }
      } else if (Array.isArray(res)) {
        setCustomers(res);
        setPaginationMeta({
          page,
          limit,
          totalItems: res.length,
          totalPages: Math.max(1, Math.ceil(res.length / limit)),
        });
      }
    } catch (err) {
      console.error("Failed to load customer list", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, committedSearch, filters, sortConfig]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Helper to sync local state changes to localStorage
  const updateCustomersState = (updater) => {
    setCustomers((prev) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Close panel with smooth exit animation (left-to-right off screen)
  const handleCloseDetail = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosingPanel(true);
    setSelectedCustomer(null);
    closeTimerRef.current = setTimeout(() => {
      setActiveDetailCustomer(null);
      setIsClosingPanel(false);
    }, 250);
  };

  // Handlers for Selection, Sorting & Server Pagination
  const handleSelectCustomer = (customer) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    if (selectedCustomer?.id === customer.id) {
      handleCloseDetail();
    } else {
      setIsClosingPanel(false);
      setSelectedCustomer(customer);
      setActiveDetailCustomer(customer);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSearchSubmit = (query) => {
    setCommittedSearch(query);
    setSearchTerm(query);
    setPage(1); // Auto reset page = 1
  };

  const handleSearchClear = () => {
    setCommittedSearch("");
    setSearchTerm("");
    setPage(1); // Auto reset page = 1
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Auto reset page = 1
  };

  const handleClearType = () => {
    setFilters((prev) => ({ ...prev, customerType: "All Types" }));
    setPage(1);
  };

  const handleClearStatus = () => {
    setFilters((prev) => ({ ...prev, status: "" }));
    setPage(1);
  };

  const handleClearDate = () => {
    setFilters((prev) => ({ ...prev, dateFrom: "", dateTo: "" }));
    setPage(1);
  };

  // Create / Update Customer Handler (POST /api/sales/customers or PATCH /api/sales/customers/:id)
  const handleSaveCustomer = async (formData, customerId) => {
    if (customerId) {
      const result = await customersApi.updateCustomer(customerId, formData);
      const updatedCustomer = result?.customer || {
        ...formData,
        id: customerId,
        updatedAt: new Date().toISOString(),
      };

      updateCustomersState((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, ...updatedCustomer } : c))
      );

      if (activeDetailCustomer?.id === customerId) {
        setActiveDetailCustomer((prev) => ({ ...prev, ...updatedCustomer }));
        setSelectedCustomer((prev) => ({ ...prev, ...updatedCustomer }));
      }

      setToast({ type: "success", message: "Saved Changes" });
    } else {
      const result = await customersApi.createCustomer(formData);
      const newCustomer = result?.customer || {
        ...formData,
        id: `cust-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      updateCustomersState((prev) => [newCustomer, ...prev]);
      setToast({ type: "success", message: "Customer Created Successfully" });
    }
    await loadCustomers();
  };

  // Reactivate Inactive Customer Handler (PATCH /api/sales/customers/:id with isActive: true)
  const handleReactivateCustomer = async (customer) => {
    try {
      const targetId = customer.id;
      const result = await customersApi.updateCustomer(targetId, {
        isActive: true,
      });

      const updatedCustomer = result?.customer || {
        ...customer,
        isActive: true,
        updatedAt: new Date().toISOString(),
      };

      updateCustomersState((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, ...updatedCustomer } : c))
      );

      if (activeDetailCustomer?.id === targetId) {
        setActiveDetailCustomer((prev) => ({ ...prev, ...updatedCustomer }));
        setSelectedCustomer((prev) => ({ ...prev, ...updatedCustomer }));
      }

      setToast({
        type: "success",
        message: "Customer Successfully Reactivated",
      });
      await loadCustomers();
    } catch (err) {
      console.error("Failed to reactivate customer:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to reactivate customer.",
      });
    }
  };

  // Trigger deactivation flow (Dangerous Operation)
  const handleInitiateDeactivate = (targetCustomer) => {
    setCustomerToDeactivate(targetCustomer);
  };

  const handleConfirmDeactivatePrompt = () => {
    setShowPasswordModal(true);
  };

  // Confirm Admin Password and Deactivate Customer (PATCH /api/sales/customers/:id/deactivate)
  const handleConfirmAdminPassword = async (adminPassword) => {
    if (!customerToDeactivate) return;

    const targetId = customerToDeactivate.id;
    // Sends { confirmPassword } directly to PATCH /api/sales/customers/:id/deactivate
    const result = await customersApi.deactivateCustomer(targetId, {
      confirmPassword: adminPassword,
    });

    const updatedCustomer = result?.customer || {
      ...customerToDeactivate,
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    updateCustomersState((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, ...updatedCustomer } : c))
    );

    if (activeDetailCustomer?.id === targetId) {
      setActiveDetailCustomer((prev) => ({ ...prev, ...updatedCustomer }));
      setSelectedCustomer((prev) => ({ ...prev, ...updatedCustomer }));
    }

    setToast({
      type: "success",
      message: "Customer Successfully Deactivated",
    });

    setShowPasswordModal(false);
    setCustomerToDeactivate(null);
    await loadCustomers();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden min-w-0">
      {/* Header (Pinned at Top) */}
      <div className="shrink-0">
        <CustomerHeader
          canCreate={canCreate}
          onAddCustomer={() => setIsAddingCustomer(true)}
        />
      </div>

      {/* Search and Filters Controls (Pinned at Top) */}
      <div className="shrink-0">
        <CustomerControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearchSubmit}
          onClearSearch={handleSearchClear}
          activeFilters={filters}
          onApplyFilters={handleApplyFilters}
          onClearType={handleClearType}
          onClearStatus={handleClearStatus}
          onClearDate={handleClearDate}
        />
      </div>

      {/* Main Content Area (Table + Locked Expanded View on Select) */}
      {isLoading && customers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-12 text-gray-500 font-medium">
          Loading customer records...
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6 overflow-hidden min-w-0">
          {/* Customer Table Container (Scrolls independently) */}
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden transition-all duration-300">
            <CustomerTable
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={handleSelectCustomer}
              sortConfig={sortConfig}
              onSort={handleSort}
              pagination={{
                page,
                limit,
                totalItems: paginationMeta.totalItems,
                totalPages: paginationMeta.totalPages,
                onPageChange: handlePageChange,
                isLoading,
              }}
            />
          </div>

          {/* Locked Expanded Customer Details Panel (Right Side with independent scroll & out-animation) */}
          {activeDetailCustomer && (
            <div
              className={`w-full lg:w-[350px] xl:w-[390px] shrink-0 h-full flex flex-col overflow-hidden transition-all duration-300 ${
                isClosingPanel
                  ? "animate-slide-fade-out pointer-events-none"
                  : "animate-slide-fade-in"
              }`}
            >
              <CustomerDetailPanel
                customer={activeDetailCustomer}
                onClose={handleCloseDetail}
                onEdit={(c) => setEditingCustomer(c)}
                onDelete={(c) => handleInitiateDeactivate(c)}
                onReactivate={(c) => handleReactivateCustomer(c)}
                canManage={canManage}
              />
            </div>
          )}
        </div>
      )}

      {/* Customer Create / Edit Wizard Modal */}
      <CustomerModal
        isOpen={isAddingCustomer || !!editingCustomer}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        onClose={() => {
          setIsAddingCustomer(false);
          setEditingCustomer(null);
        }}
      />

      {/* Deactivation Confirmation Modal */}
      {customerToDeactivate && !showPasswordModal && (
        <DeactivateCustomerModal
          customer={customerToDeactivate}
          onClose={() => setCustomerToDeactivate(null)}
          onConfirm={handleConfirmDeactivatePrompt}
        />
      )}

      {/* Security Admin Password Verification Modal */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setCustomerToDeactivate(null);
        }}
        onSubmit={handleConfirmAdminPassword}
      />

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
