import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';
export type SortType = 'string' | 'number' | 'date' | 'status';

export interface SortColumnConfig<T> {
  key: string;
  type: SortType;
  /** Custom value extractor — use when the sort key differs from the data field (e.g. groupId → groupName) */
  getValue?: (item: T) => any;
  /** Status priority map for status-type sorting, e.g. { pending: 0, paid: 1 } */
  statusOrder?: Record<string, number>;
}

export interface UseSortableTableResult<T> {
  sortedData: T[];
  sortColumn: string | null;
  sortDirection: SortDirection;
  toggleSort: (columnKey: string) => void;
}

export function useSortableTable<T>(
  data: T[],
  columns: SortColumnConfig<T>[]
): UseSortableTableResult<T> {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const toggleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    const config = columns.find(c => c.key === sortColumn);
    if (!config) return data;

    const sorted = [...data].sort((a, b) => {
      const valA = config.getValue ? config.getValue(a) : (a as any)[config.key];
      const valB = config.getValue ? config.getValue(b) : (b as any)[config.key];

      let comparison = 0;

      switch (config.type) {
        case 'string': {
          const strA = (valA || '').toString().toLowerCase();
          const strB = (valB || '').toString().toLowerCase();
          comparison = strA.localeCompare(strB, 'pt-BR');
          break;
        }
        case 'number': {
          const numA = typeof valA === 'number' ? valA : parseFloat(valA) || 0;
          const numB = typeof valB === 'number' ? valB : parseFloat(valB) || 0;
          comparison = numA - numB;
          break;
        }
        case 'date': {
          const dateA = valA ? new Date(valA).getTime() : 0;
          const dateB = valB ? new Date(valB).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'status': {
          const order = config.statusOrder || {};
          const orderA = order[valA] ?? 999;
          const orderB = order[valB] ?? 999;
          comparison = orderA - orderB;
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortColumn, sortDirection, columns]);

  return { sortedData, sortColumn, sortDirection, toggleSort };
}
