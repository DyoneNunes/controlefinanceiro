import React, { useRef, useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/finance';

interface MonthSectionProps {
  monthKey: string;
  label: string;
  count: number;
  totalValue: number;
  isCurrent: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const MonthSection: React.FC<MonthSectionProps> = ({
  label,
  count,
  totalValue,
  isCurrent,
  isOpen,
  onToggle,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight);
        }
      });
      observer.observe(contentRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div className="mb-3">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-50 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          />
          <span className="text-base font-bold text-gray-800">{label}</span>
          {isCurrent && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
              Mês Atual
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {count} {count === 1 ? 'item' : 'itens'}
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </button>

      {/* Content with smooth animation */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? `${contentHeight + 16}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};
