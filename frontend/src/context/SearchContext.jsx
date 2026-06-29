import { createContext, useContext, useState, useRef, useCallback } from 'react';

const SearchContext = createContext({ searchQuery: '', setSearchQuery: () => {} });

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQueryRaw] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef(null);

  const setSearchQuery = useCallback((val) => {
    setSearchQueryRaw(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(val.trim().toLowerCase());
    }, 400);
  }, []);

  return (
    <SearchContext.Provider value={{ searchQuery, debouncedQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}