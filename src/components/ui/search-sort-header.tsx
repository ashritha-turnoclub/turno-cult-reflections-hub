
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface SearchSortHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortField?: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  sortOptions: { field: string; label: string }[];
  placeholder?: string;
}

export const SearchSortHeader = ({
  searchTerm,
  onSearchChange,
  sortField,
  sortOrder,
  onSort,
  sortOptions,
  placeholder = "Search..."
}: SearchSortHeaderProps) => {
  return (
    <div className="flex gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        {sortOptions.map(({ field, label }) => (
          <Button
            key={field}
            variant={sortField === field ? "default" : "outline"}
            size="sm"
            onClick={() => onSort(field)}
            className="flex items-center gap-2"
          >
            {label}
            {sortField === field ? (
              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
