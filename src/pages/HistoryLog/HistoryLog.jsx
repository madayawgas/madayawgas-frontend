import { useState, useEffect, useCallback } from "react";
import { History } from "lucide-react";
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

  const handleModuleChange = (newModule) => {
    setSelectedModule(newModule);
    setPage(1); // Auto reset page = 1
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearchSubmit = (query) => {
    setCommittedSearch(query || "");
    setPage(1);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    setCommittedSearch("");
    setPage(1);
  };

  return (
    <div className="w-full">
      {/* Header Section: Summary Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 border-b border-[#6D8AA2]/20 pb-3.5">
        {/* Left: Summary Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3F8] text-[#0A4B6E] border border-[#BCE1F1] font-bold text-xs shadow-2xs">
            <History size={13} className="text-[#0A4B6E]" />
            <span>{paginationMeta.totalItems || historyLogs.length} Audit Events</span>
          </span>
        </div>
      </div>

      {/* Controls Section: Search Bar & Module Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3.5">
        {/* Search Bar */}
        <SearchBar
          placeholder="Search history logs (Press Enter)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearchSubmit}
          onClear={handleSearchClear}
          className="w-full sm:w-64 md:w-72"
        />

        {/* Right: Module Filter Dropdown */}
        <div className="flex items-center gap-3 justify-end shrink-0">
          <FilterDropdown 
            label="Module" 
            options={filterOptions} 
            value={selectedModule} 
            onChange={handleModuleChange} 
          />
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