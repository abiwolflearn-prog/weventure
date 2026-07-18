import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search,
  X,
  FileSpreadsheet,
  Maximize2,
  ExternalLink,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Button } from '../Button';
import { motion, AnimatePresence } from 'motion/react';

export interface ITableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface PerformanceTableProps<T> {
  data: T[];
  columns: ITableColumn<T>[];
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  itemsPerPage?: number;
  onRowClick?: (row: T) => void;
  drillDownTitle?: (row: T) => string;
  drillDownContent?: (row: T) => React.ReactNode;
}

export default function PerformanceTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  searchPlaceholder = 'Search records...',
  itemsPerPage = 5,
  onRowClick,
  drillDownTitle,
  drillDownContent,
}: PerformanceTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);

  // Sorting Handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Local Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val ? String(val).toLowerCase().includes(term) : false
        )
      );
    }

    // 2. Sort
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        return sortOrder === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, searchTerm, sortKey, sortOrder]);

  // Paginated Slices
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    } else if (drillDownContent) {
      setSelectedRow(row);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm relative" id={`datagrid-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* TABLE HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5 mb-5">
        <div>
          <h3 className="font-display font-bold text-base text-[#111827]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#4B5563] mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Search tool */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full border border-[#E5E7EB] bg-white rounded-xl pl-9 pr-8 py-2 text-xs text-[#111827] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#84CC16]/10 focus:border-[#84CC16] transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#6B7280] hover:text-[#111827]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CORE GRID */}
      <div className="overflow-x-auto min-h-[180px]">
        {pageData.length === 0 ? (
          <div className="flex flex-col justify-center items-center text-center py-10 space-y-2">
            <SlidersHorizontal className="w-8 h-8 text-[#D1D5DB] animate-pulse" />
            <h4 className="text-xs font-bold text-[#111827]">
              No matching records
            </h4>
            <p className="text-[10px] text-[#6B7280] max-w-xs">
              Refine your filters, search queries, or select another reporting timeframe.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#4B5563] font-bold uppercase tracking-wider text-[10px]">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="pb-3.5 font-bold"
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(String(col.key))}
                        className="flex items-center gap-1.5 hover:text-[#111827] transition-colors"
                      >
                        {col.header}
                        {sortKey === String(col.key) ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#84CC16]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#84CC16]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#D1D5DB]" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {pageData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => handleRowClick(row)}
                  className={`group transition-all ${
                    onRowClick || drillDownContent
                      ? 'cursor-pointer hover:bg-[#F9FAFB]'
                      : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="py-3.5 font-medium text-[#111827]"
                    >
                      {col.render ? col.render(row, idx) : row[col.key as keyof T]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4 mt-4 text-xs font-semibold">
          <span className="text-[11px] text-[#4B5563] font-medium">
            Showing <b className="text-[#111827]">{(currentPage - 1) * itemsPerPage + 1}</b> to{' '}
            <b className="text-[#111827]">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </b>{' '}
            of <b className="text-[#111827]">{totalItems}</b> entries
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              variant="secondary"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB] transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-[11px] font-bold transition flex items-center justify-center ${
                  currentPage === i + 1
                    ? 'bg-[#84CC16] text-[#111111] shadow-xs'
                    : 'text-[#4B5563] hover:bg-[#F3F4F6]'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <Button
              size="xs"
              variant="secondary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB] transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* DRILL DOWN DRIFT DRAWER (Slide-in) */}
      <AnimatePresence>
        {selectedRow && drillDownContent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRow(null)}
              className="fixed inset-0 bg-black/60 z-50 pointer-events-auto"
            />

            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white border-l border-[#E5E7EB] shadow-2xl z-55 p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                {/* Header inside drawer */}
                <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-4 mb-5">
                  <div>
                    <span className="text-[9px] font-bold text-[#65A30D] uppercase bg-[#84CC16]/10 px-2 py-0.5 rounded-full">
                      Interactive Drill Down
                    </span>
                    <h3 className="font-display font-extrabold text-lg text-[#111827] mt-1.5 leading-tight">
                      {drillDownTitle ? drillDownTitle(selectedRow) : 'Detailed Performance Insights'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedRow(null)}
                    className="p-1.5 text-[#6B7280] hover:text-[#111827] rounded-lg hover:bg-[#F3F4F6]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body inside drawer */}
                <div className="space-y-6 text-xs text-[#374151]">
                  {drillDownContent(selectedRow)}
                </div>
              </div>

              {/* Action buttons inside drawer */}
              <div className="border-t border-[#E5E7EB] pt-5 mt-6 flex justify-end gap-3.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedRow(null)}
                  className="font-bold rounded-xl text-[#374151] hover:bg-[#F3F4F6]"
                >
                  Close Insights
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    console.log('Redirecting to the associated workspace profile...');
                    setSelectedRow(null);
                  }}
                  className="font-bold rounded-xl flex items-center gap-1.5 bg-[#84CC16] text-[#111111] hover:bg-[#65A30D]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Lease Record Profile
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
