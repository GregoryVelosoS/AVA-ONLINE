import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

export function useTableSort<T>(data: T[], defaultSortConfig: { key: keyof T; direction: "asc" | "desc" } | null = null) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: "asc" | "desc" } | null>(defaultSortConfig);

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName: keyof T) => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return <span className="ml-1 inline-block w-4 text-slate-300 opacity-0 group-hover:opacity-100">↕</span>;
    }
    return sortConfig.direction === "asc" ? (
      <span className="ml-1 inline-block w-4 text-slate-700">↑</span>
    ) : (
      <span className="ml-1 inline-block w-4 text-slate-700">↓</span>
    );
  };

  return { sortedData, requestSort, sortConfig, getSortIcon };
}
