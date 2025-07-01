
import { useState, useMemo } from 'react';

export function useSearch<T>(
  data: T[],
  searchFields: (keyof T)[],
  initialSortField?: keyof T,
  initialSortOrder: 'asc' | 'desc' = 'desc'
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof T | undefined>(initialSortField);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Filter by search term
    if (searchTerm) {
      filtered = data.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        })
      );
    }

    // Sort data
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortOrder === 'asc' ? comparison : -comparison;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          const comparison = aValue.getTime() - bValue.getTime();
          return sortOrder === 'asc' ? comparison : -comparison;
        }

        // Handle string dates
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            const comparison = dateA.getTime() - dateB.getTime();
            return sortOrder === 'asc' ? comparison : -comparison;
          }
        }

        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, searchFields, sortField, sortOrder]);

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    sortField,
    sortOrder,
    handleSort,
    filteredAndSortedData,
  };
}
