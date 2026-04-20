import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { SortDirection } from '../hooks/useSortableTable';

interface SortableHeaderProps {
  label: string;
  columnKey: string;
  activeColumn: string | null;
  direction: SortDirection;
  onToggle: (key: string) => void;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  columnKey,
  activeColumn,
  direction,
  onToggle,
  className = '',
}) => {
  const isActive = activeColumn === columnKey;

  return (
    <th
      className={`px-6 py-4 text-sm font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100/60 transition-colors ${className}`}
      onClick={() => onToggle(columnKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`inline-flex flex-col transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
          {isActive ? (
            direction === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
            )
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          )}
        </span>
      </span>
    </th>
  );
};
