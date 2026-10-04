/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";

const SearchContext = createContext({
  searchTerm: "",
  setSearchTerm: () => {},
  placeholder: "Search...",
  setPlaceholder: () => {},
  onSearchSubmit: null,
  setOnSearchSubmit: () => {},
  onClearSearch: null,
  setOnClearSearch: () => {},
  isSearchVisible: true,
  setIsSearchVisible: () => {},
  resetSearch: () => {},
});

export function SearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [placeholder, setPlaceholder] = useState("Search...");
  const [onSearchSubmitCallback, setOnSearchSubmitCallback] = useState(null);
  const [onClearSearchCallback, setOnClearSearchCallback] = useState(null);
  const [isSearchVisible, setIsSearchVisible] = useState(true);

  const resetSearch = useCallback(() => {
    setSearchTerm("");
    if (onClearSearchCallback) {
      onClearSearchCallback();
    }
  }, [onClearSearchCallback]);

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        placeholder,
        setPlaceholder,
        onSearchSubmit: onSearchSubmitCallback,
        setOnSearchSubmit: setOnSearchSubmitCallback,
        onClearSearch: onClearSearchCallback,
        setOnClearSearch: setOnClearSearchCallback,
        isSearchVisible,
        setIsSearchVisible,
        resetSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}

