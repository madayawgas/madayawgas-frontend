import React, { useState, useEffect, useMemo } from "react";
import HistoryTable from "../../components/history log/HistoryTable";
import FilterDropdown from "../../components/ui/FilterDropdown"; 
import SearchBar from "../../components/ui/SearchBar"; 
import { historyApi } from "../../api/history";

export default function HistoryLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("All Modules");
  
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const filterOptions = [
    "All Modules",
    "User Management",
    "Fleet Management",
    "Route Dispatch",
    "Inventory Management"
  ];

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const logs = await historyApi.getHistoryLogs();
        setHistoryLogs(logs || []);
      } catch (error) {
        console.error("Failed to fetch history logs", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return historyLogs.filter((log) => {
      const matchesModule = selectedModule === "All Modules" || log.module === selectedModule;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower) ||
        log.actionType.toLowerCase().includes(searchLower);

      return matchesModule && matchesSearch;
    });
  }, [searchTerm, selectedModule, historyLogs]);

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
            onChange={setSelectedModule} 
          />
          
          <div className="flex-1">
            <SearchBar 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="flex justify-center p-8 text-gray-500">Loading history logs...</div>
      ) : (
        <HistoryTable logs={filteredLogs} />
      )}
    </div>
  );
}