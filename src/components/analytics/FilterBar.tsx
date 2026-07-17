import React, { useState } from 'react';
import { 
  Calendar, 
  Filter, 
  RefreshCw, 
  FileDown, 
  Download, 
  Info, 
  ChevronDown, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { Button } from '../Button';
import { motion, AnimatePresence } from 'motion/react';

interface FilterBarProps {
  range: string;
  onRangeChange: (range: string) => void;
  customDates: { start: string; end: string };
  onCustomDatesChange: (dates: { start: string; end: string }) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isRefetching: boolean;
  onExport: (format: 'csv' | 'json') => void;
}

export default function FilterBar({
  range,
  onRangeChange,
  customDates,
  onCustomDatesChange,
  onRefresh,
  isLoading,
  isRefetching,
  onExport,
}: FilterBarProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const ranges = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '12m', label: '12M' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-4">
      {/* FILTER & CONTROL STRIP */}
      <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none">
        {/* Left Side: Time presets */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6B7280] shrink-0" />
            <span className="text-xs font-bold text-[#4B5563]">
              Timeframe:
            </span>
          </div>

          <div className="flex items-center bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl p-1 text-xs">
            {ranges.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onRangeChange(r.id);
                  setShowCustomPicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  range === r.id
                    ? 'bg-white text-[#2563EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {r.label}
              </button>
            ))}

            <button
              onClick={() => {
                onRangeChange('custom');
                setShowCustomPicker(!showCustomPicker);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                range === 'custom'
                  ? 'bg-white text-[#2563EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Custom
            </button>
          </div>
        </div>

        {/* Right Side: Refresh & Exports */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* Export Selector Trigger */}
          <div className="relative">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-xs font-bold border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB] rounded-xl h-9 px-4.5"
            >
              <FileDown className="w-4 h-4 mr-1.5 text-[#4B5563]" />
              Export
              <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-[#6B7280]" />
            </Button>

            <AnimatePresence>
              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowExportMenu(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 py-1.5 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        onExport('csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      Download Spreadsheet (.csv)
                    </button>
                    <button
                      onClick={() => {
                        onExport('json');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                      Download Schema (.json)
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh Action */}
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefresh}
            disabled={isLoading || isRefetching}
            className="text-xs font-bold border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB] rounded-xl h-9"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${
                isLoading || isRefetching ? 'animate-spin text-[#2563EB]' : 'text-[#6B7280]'
              }`}
            />
            {isLoading || isRefetching ? 'Aggregating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* DATE RANGE EXPANDED FORM PANEL */}
      <AnimatePresence>
        {range === 'custom' && showCustomPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#6B7280]">
                  Custom Start Date
                </label>
                <input
                  type="date"
                  value={customDates.start}
                  onChange={(e) => onCustomDatesChange({ ...customDates, start: e.target.value })}
                  className="block border border-[#E5E7EB] bg-white rounded-xl px-3 py-1.5 text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#6B7280]">
                  Custom End Date
                </label>
                <input
                  type="date"
                  value={customDates.end}
                  onChange={(e) => onCustomDatesChange({ ...customDates, end: e.target.value })}
                  className="block border border-[#E5E7EB] bg-white rounded-xl px-3 py-1.5 text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB]"
                />
              </div>

              <Button
                size="sm"
                onClick={() => setShowCustomPicker(false)}
                className="font-bold text-xs h-9 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                disabled={!customDates.start || !customDates.end}
              >
                Apply Custom Selection
              </Button>

              <p className="text-[11px] text-[#6B7280] font-medium pb-2 self-center flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#2563EB]" />
                Select a valid calendar range to lock-in isolation boundaries.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
