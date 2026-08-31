import { useState, useMemo, useEffect, useRef } from "react";
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

  // Search, Filter and Sort
  const [searchTerm, setSearchTerm] = useState("");
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

  // Initial Load
  useEffect(() => {
    async function loadCustomers() {
      try {
        setIsLoading(true);
        const data = await customersApi.getCustomers();
        if (data) {
          setCustomers(data);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        }
      } catch (err) {
        console.error("Failed to load customer list", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCustomers();
  }, []);

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

  // Filter & Sort Logic
  const processedCustomers = useMemo(() => {
    let result = [...customers];

    // 1. Customer Type filter
    if (filters.customerType && filters.customerType !== "All Types") {
      result = result.filter(
        (c) =>
          (c.customerType || "").toUpperCase() ===
          filters.customerType.toUpperCase()
      );
    }

    // 2. Status filter
    if (filters.status) {
      if (filters.status.toUpperCase() === "ACTIVE") {
        result = result.filter((c) => c.isActive === true);
      } else if (filters.status.toUpperCase() === "INACTIVE") {
        result = result.filter((c) => c.isActive === false);
      }
    }

    // 3. Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom).getTime();
      result = result.filter((c) => {
        if (!c.createdAt) return false;
        return new Date(c.createdAt).getTime() >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      const toDateTime = toDate.getTime();
      result = result.filter((c) => {
        if (!c.createdAt) return false;
        return new Date(c.createdAt).getTime() <= toDateTime;
      });
    }

    // 4. Search filter (name, address, contactNumber, customerType)
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.address || "").toLowerCase().includes(q) ||
          (c.contactNumber || "").toLowerCase().includes(q) ||
          (c.customerType || "").toLowerCase().includes(q)
      );
    }

    // 5. Sorting
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = aVal ? aVal.toString().toLowerCase() : "";
        bVal = bVal ? bVal.toString().toLowerCase() : "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, searchTerm, filters, sortConfig]);

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

  // Handlers
  const handleSelectCustomer = (customer) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    if (selectedCustomer?.id === customer.id) {
      // Toggle off if already selected
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

  const handleApplyFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearType = () => {
    setFilters((prev) => ({ ...prev, customerType: "All Types" }));
  };

  const handleClearStatus = () => {
    setFilters((prev) => ({ ...prev, status: "" }));
  };

  const handleClearDate = () => {
    setFilters((prev) => ({ ...prev, dateFrom: "", dateTo: "" }));
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

    try {
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
    } catch (err) {
      // Re-throw so AdminPasswordModal displays inline error
      throw err;
    }
  };

  return (
    <div className="h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] flex flex-col overflow-hidden">
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
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-6 overflow-hidden">
          {/* Customer Table Container (Scrolls independently) */}
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden transition-all duration-300">
            <CustomerTable
              customers={processedCustomers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={handleSelectCustomer}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>

          {/* Locked Expanded Customer Details Panel (Right Side with independent scroll & out-animation) */}
          {activeDetailCustomer && (
            <div
              className={`w-full lg:w-[400px] xl:w-[430px] shrink-0 h-full flex flex-col overflow-hidden transition-all duration-300 ${
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
