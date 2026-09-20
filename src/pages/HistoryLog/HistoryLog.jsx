import React, { useState, useEffect, useCallback } from "react";
import HistoryTable from "../../components/history log/HistoryTable";
import FilterDropdown from "../../components/ui/FilterDropdown"; 
import SearchBar from "../../components/ui/SearchBar"; 
import { historyApi } from "../../api/history";

export default function HistoryLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("All Modules");
  
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State (Strategy B)
  const [page, setPage] = useState(1);
  const limit = 20;
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });

  const filterOptions = [
    "All Modules",
    "User Management",
    "Fleet Management",
    "Route Dispatch",
    "Inventory Management"
  ];

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await historyApi.getHistoryLogs({
        page,
        limit,
        module: selectedModule === "All Modules" ? undefined : selectedModule,
        search: committedSearch.trim() || undefined,
      });

      if (res?.data && Array.isArray(res.data)) {
        setHistoryLogs(res.data);
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
        setHistoryLogs(res);
        setPaginationMeta({
          page,
          limit,
          totalItems: res.length,
          totalPages: Math.max(1, Math.ceil(res.length / limit)),
        });
      }
    } catch (error) {
      console.error("Failed to fetch history logs", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, committedSearch, selectedModule]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handlers
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

  const handleModuleChange = (newModule) => {
    setSelectedModule(newModule);
    setPage(1); // Auto reset page = 1
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center mb-6 gap-6 border-b border-[#6D8AA2] pb-4">
        <h1 className="text-3xl font-bold text-[#1B4B75]">History</h1>
        
        <div className="flex items-center gap-3 flex-1 w-full">
          <FilterDropdown 
            label="Module" 
            options={filterOptions} 
            value={selectedModule} 
            onChange={handleModuleChange} 
          />
          
          <div className="flex-1">
            <SearchBar 
              placeholder="Search history logs (Press Enter)..." 
              value={searchTerm} 
              onChange={setSearchTerm}
              onSearch={handleSearchSubmit}
              onClear={handleSearchClear}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      {isLoading && historyLogs.length === 0 ? (
        <div className="flex justify-center p-8 text-gray-500">Loading history logs...</div>
      ) : (
        <div className="h-[calc(100vh-280px)] min-h-[460px] w-full min-w-0">
          <HistoryTable
            logs={historyLogs}
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
      )}
    </div>
  );
}