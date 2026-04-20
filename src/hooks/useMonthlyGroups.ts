import { useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthGroup<T> {
  key: string;          // "2026-04"
  label: string;        // "Abril 2026"
  items: T[];
  totalValue: number;
  count: number;
  isCurrent: boolean;
}

export function useMonthlyGroups<T>(
  data: T[],
  dateExtractor: (item: T) => string,
  valueExtractor: (item: T) => number
): MonthGroup<T>[] {
  return useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Group items by YYYY-MM
    const groupMap = new Map<string, T[]>();

    for (const item of data) {
      const dateStr = dateExtractor(item);
      if (!dateStr) continue;

      const date = parseISO(dateStr);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(item);
    }

    // Convert to array and sort descending (newest first)
    const groups: MonthGroup<T>[] = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => {
        const [year, month] = key.split('-').map(Number);
        const monthDate = new Date(year, month - 1, 1);
        const label = format(monthDate, "MMMM yyyy", { locale: ptBR });
        // Capitalize first letter
        const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

        return {
          key,
          label: capitalizedLabel,
          items,
          totalValue: items.reduce((sum, item) => sum + (valueExtractor(item) || 0), 0),
          count: items.length,
          isCurrent: key === currentKey,
        };
      });

    return groups;
  }, [data, dateExtractor, valueExtractor]);
}
