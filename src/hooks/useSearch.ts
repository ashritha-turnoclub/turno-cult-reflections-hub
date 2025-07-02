import { useState, useMemo } from 'react';

export interface SortOption {
  value: string;
  label: string;
}

export interface UseSearchProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  sortOptions: SortOption[];
  defaultSort?: string;
}

export const useSearch = <T>({
  data,
  searchFields,
  sortOptions,
  defaultSort = sortOptions[0]?.value || ''
}: UseSearchProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(defaultSort);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Filter by search term
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = data.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowercaseSearch);
          }
          return false;
        })
      );
    }

    // Sort the filtered data
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const [field, direction] = sortBy.split('-');
        const aValue = a[field as keyof T];
        const bValue = b[field as keyof T];

        // Handle quarter sorting with fixed order
        if (field === 'quarter') {
          const quarterOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
          const aOrder = quarterOrder[aValue as keyof typeof quarterOrder] || 0;
          const bOrder = quarterOrder[bValue as keyof typeof quarterOrder] || 0;
          return direction === 'desc' ? bOrder - aOrder : aOrder - bOrder;
        }

        // Handle date sorting
        if (field === 'deadline' || field === 'timeline' || field === 'created_at') {
          const aDate = new Date(aValue as string);
          const bDate = new Date(bValue as string);
          return direction === 'desc' ? bDate.getTime() - aDate.getTime() : aDate.getTime() - bDate.getTime();
        }

        // Handle string sorting
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return direction === 'desc' 
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        }

        // Handle number sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return direction === 'desc' ? bValue - aValue : aValue - bValue;
        }

        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortBy, searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filteredData: filteredAndSortedData,
    sortOptions
  };
};