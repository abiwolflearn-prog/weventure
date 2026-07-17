import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  Play, 
  Trash2, 
  Plus, 
  Calendar, 
  Download, 
  Mail, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Filter, 
  Database, 
  Activity, 
  RotateCw, 
  Search, 
  ChevronRight, 
  Printer, 
  ArrowUpDown,
  BookOpen,
  Info
} from 'lucide-react';
import { axiosInstance } from '../lib/axiosInstance';
import { useAppSelector } from '../store';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

// Available Report Types
export enum ReportType {
  EVENT = 'EVENT',
  WORKSPACE = 'WORKSPACE',
  FINANCIAL = 'FINANCIAL',
  USER = 'USER',
  OPERATIONAL = 'OPERATIONAL',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}

interface SavedReport {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  createdBy: string;
  filters: any;
  format: ReportFormat;
  scheduling: {
    enabled: boolean;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    emailRecipients: string[];
    nextRunAt?: string;
  };
  createdAt: string;
}

interface ReportHistoryItem {
  id: string;
  reportId?: string;
  name: string;
  type: ReportType;
  generatedBy: string;
  filters: any;
  format: ReportFormat;
  fileUrl: string;
  summary: Record<string, any>;
  createdAt: string;
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  // Core navigation tab state
  const [activeTab, setActiveTab] = useState<'builder' | 'templates' | 'history'>('builder');

  // Query builder state
  const [reportType, setReportType] = useState<ReportType>(ReportType.FINANCIAL);
  const [datePreset, setDatePreset] = useState<string>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('ALL');
  const [paymentStatus, setPaymentStatus] = useState<string>('ALL');
  const [registrationStatus, setRegistrationStatus] = useState<string>('ALL');

  // Preview data state
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Sorting state for preview records
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal displays
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveReportName, setSaveReportName] = useState<string>('');
  const [saveReportDesc, setSaveReportDesc] = useState<string>('');
  const [saveReportFormat, setSaveReportFormat] = useState<ReportFormat>(ReportFormat.CSV);
  
  // Scheduling details
  const [isScheduleEnabled, setIsScheduleEnabled] = useState<boolean>(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [scheduleEmails, setScheduleEmails] = useState<string>('');

  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear messages automatically
  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => setGlobalMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  // ----------------------------------------------------
  // Live Queries (TanStack Query)
  // ----------------------------------------------------
  
  // 1. Saved Templates
  const { data: savedResponse, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ['savedReports'],
    queryFn: async () => {
      const res = await axiosInstance.get('/reports');
      return res.data;
    },
  });

  // 2. Report Execution History
  const { data: historyResponse, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['reportsHistory'],
    queryFn: async () => {
      const res = await axiosInstance.get('/reports/history');
      return res.data;
    },
  });

  // 3. Dynamic workspaces list to populate filters
  const { data: workspacesResponse } = useQuery({
    queryKey: ['workspacesFilter'],
    queryFn: async () => {
      const res = await axiosInstance.get('/workspaces');
      return res.data;
    },
  });

  // 4. Dynamic events list to populate filters
  const { data: eventsResponse } = useQuery({
    queryKey: ['eventsFilter'],
    queryFn: async () => {
      const res = await axiosInstance.get('/events');
      return res.data;
    },
  });

  const savedTemplates: SavedReport[] = savedResponse?.data || [];
  const reportsHistory: ReportHistoryItem[] = historyResponse?.data || [];
  const filterWorkspaces: any[] = workspacesResponse?.data || [];
  const filterEvents: any[] = eventsResponse?.data || [];

  // ----------------------------------------------------
  // Live Mutations
  // ----------------------------------------------------

  // 1. Run Preview Data On-demand
  const runPreview = async () => {
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      const filters: any = { preset: datePreset };
      if (datePreset === 'custom') {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
      if (selectedEventId !== 'ALL') filters.eventId = selectedEventId;
      if (selectedWorkspaceId !== 'ALL') filters.workspaceId = selectedWorkspaceId;
      if (paymentStatus !== 'ALL') filters.paymentStatus = paymentStatus;
      if (registrationStatus !== 'ALL') filters.registrationStatus = registrationStatus;

      const res = await axiosInstance.post('/reports/generate', {
        type: reportType,
        filters,
      });

      setPreviewData(res.data.data);
    } catch (err: any) {
      setPreviewError(err?.message || 'Failed to aggregate report preview data.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Trigger default preview on mount
  useEffect(() => {
    runPreview();
  }, [reportType]);

  // 2. Save/Configure Report Template Mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.post('/reports', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedReports'] });
      setIsSaveModalOpen(false);
      setSaveReportName('');
      setSaveReportDesc('');
      setIsScheduleEnabled(false);
      setScheduleEmails('');
      setGlobalMessage({ type: 'success', text: 'Report Template registered with scheduler successfully!' });
    },
    onError: (err: any) => {
      setGlobalMessage({ type: 'error', text: err?.message || 'Failed to save report template config' });
    }
  });

  const handleSaveTemplate = () => {
    if (!saveReportName) {
      setGlobalMessage({ type: 'error', text: 'Please fill out a template name' });
      return;
    }

    const filters: any = { preset: datePreset };
    if (datePreset === 'custom') {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    if (selectedEventId !== 'ALL') filters.eventId = selectedEventId;
    if (selectedWorkspaceId !== 'ALL') filters.workspaceId = selectedWorkspaceId;
    if (paymentStatus !== 'ALL') filters.paymentStatus = paymentStatus;
    if (registrationStatus !== 'ALL') filters.registrationStatus = registrationStatus;

    const emailList = scheduleEmails
      ? scheduleEmails.split(',').map((email) => email.trim()).filter((email) => email.length > 0)
      : [];

    saveTemplateMutation.mutate({
      name: saveReportName,
      type: reportType,
      description: saveReportDesc,
      filters,
      format: saveReportFormat,
      createdBy: user?.email || 'operator@weventurehub.com',
      scheduling: {
        enabled: isScheduleEnabled,
        frequency: isScheduleEnabled ? scheduleFrequency : undefined,
        emailRecipients: emailList,
      },
    });
  };

  // 3. Run Saved Template Immediately
  const runTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.post(`/reports/${id}/run`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportsHistory'] });
      setGlobalMessage({ type: 'success', text: 'Instant run completed! Emails dispatched and archive logged.' });
    },
    onError: (err: any) => {
      setGlobalMessage({ type: 'error', text: err?.message || 'Failed to trigger report run' });
    }
  });

  // 4. Delete Saved Template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.delete(`/reports/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedReports'] });
      setGlobalMessage({ type: 'success', text: 'Report template deleted successfully.' });
    },
    onError: (err: any) => {
      setGlobalMessage({ type: 'error', text: err?.message || 'Failed to delete template configuration' });
    }
  });

  // 5. Download / Export Document
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const handleExport = async (format: ReportFormat) => {
    if (!previewData || previewData.rows.length === 0) return;
    setIsExporting(true);
    try {
      const res = await axiosInstance.post('/reports/export', {
        title: `${reportType} Executive Summary`,
        type: reportType,
        columns: previewData.columns,
        rows: previewData.rows,
        format,
        filters: {
          preset: datePreset,
          startDate,
          endDate,
        }
      });

      const { fileUrl, filename } = res.data.data;
      
      // Iframe-friendly download mechanism
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${filename}.${format.toLowerCase() === 'excel' ? 'xls' : format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setGlobalMessage({ type: 'success', text: `Document compiled successfully! Downloaded: ${format}` });
    } catch (err: any) {
      setGlobalMessage({ type: 'error', text: err?.message || 'Failed to compile and download report file' });
    } finally {
      setIsExporting(false);
    }
  };

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedRows = () => {
    if (!previewData?.rows) return [];
    const rowsCopy = [...previewData.rows];
    if (!sortField) return rowsCopy;

    return rowsCopy.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // ----------------------------------------------------
  // Dynamic statistics for executive panel
  // ----------------------------------------------------
  const scheduledCount = savedTemplates.filter((s) => s.scheduling.enabled).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Dynamic Alerts */}
      <AnimatePresence>
        {globalMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg border flex items-center space-x-3 ${
              globalMessage.type === 'success' 
                ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]' 
                : 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]'
            }`}
          >
            {globalMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 text-[#16A34A]" /> : <AlertCircle className="w-5 h-5 shrink-0 text-[#EF4444]" />}
            <span className="text-[13px] font-bold select-none">{globalMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upper Module Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5E7EB] pb-6">
        <div>
          <span className="text-[14px] font-bold text-[#65A30D] tracking-wide uppercase">
            Platform Core Business Intelligence
          </span>
          <h1 className="font-display font-bold text-[32px] text-[#111827] tracking-tight mt-1">
            Reports & Export Center
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Construct enterprise aggregations, compile PDF/Excel summaries, and configure automated scheduled email delivery.
          </p>
        </div>

        {/* View selection tabs */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl shrink-0 self-start md:self-center border border-[#E2E8F0]">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-lg transition-all duration-150 ${
              activeTab === 'builder'
                ? 'bg-white text-[#84CC16] shadow-sm font-bold'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Report Builder
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-lg transition-all duration-150 relative ${
              activeTab === 'templates'
                ? 'bg-white text-[#84CC16] shadow-sm font-bold'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Saved Templates
            {savedTemplates.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#84CC16] text-[10px] text-[#111111] font-bold shadow-sm">
                {savedTemplates.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-lg transition-all duration-150 relative ${
              activeTab === 'history'
                ? 'bg-white text-[#84CC16] shadow-sm font-bold'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Downloads
            {reportsHistory.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#6B7280] text-[10px] text-white font-bold shadow-sm">
                {reportsHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center space-x-4">
          <div className="p-3.5 bg-[#A3E635]/15 text-[#65A30D] rounded-[14px]">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block">Saved Templates</span>
            <h3 className="text-[28px] font-bold text-[#111827] tracking-tight">{savedTemplates.length}</h3>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center space-x-4">
          <div className="p-3.5 bg-emerald-50 text-[#16A34A] rounded-[14px]">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block">Scheduled Active</span>
            <h3 className="text-[28px] font-bold text-[#111827] tracking-tight">{scheduledCount}</h3>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 text-[#D97706] rounded-[14px]">
            <Download className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block">Compiled History</span>
            <h3 className="text-[28px] font-bold text-[#111827] tracking-tight">{reportsHistory.length}</h3>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center space-x-4">
          <div className="p-3.5 bg-[#EEF2FF] text-[#4F46E5] rounded-[14px]">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block">Scheduler Engine</span>
            <div className="flex items-center space-x-2 pt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[14px] font-bold text-emerald-600">Active (1m)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Workspace Body with Animations */}
      <AnimatePresence mode="wait">
        {activeTab === 'builder' && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Filter Configuration column */}
            <div className="lg:col-span-4 bg-[#FFFFFF] p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5 h-fit">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-2.5 font-display font-bold text-[16px] text-[#111827]">
                  <Filter className="w-5 h-5 text-[#84CC16]" />
                  <span>Report Settings</span>
                </div>
                <button
                  onClick={runPreview}
                  title="Force recalculate"
                  className="p-2 hover:bg-gray-100 text-[#6B7280] hover:text-[#111827] rounded-lg transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Report Type Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[#6B7280] tracking-wider block">Report Focus Domain</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] px-3.5 py-2.5 rounded-[12px] text-[13px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition"
                >
                  <option value={ReportType.EVENT}>Event Analytics & Registrations</option>
                  <option value={ReportType.WORKSPACE}>Workspace Bookings & Utilization</option>
                  <option value={ReportType.FINANCIAL}>Financial Payments & Revenues</option>
                  <option value={ReportType.USER}>Customer Lifetime Value (LTV)</option>
                  <option value={ReportType.OPERATIONAL}>Operational Access & Audit Logs</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#6B7280] tracking-wider block">Time Range Preset</label>
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] px-3.5 py-2.5 rounded-[12px] text-[13px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition"
                  >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="12m">Last 12 Months</option>
                    <option value="all">All-Time History</option>
                    <option value="custom">Custom Date Boundary</option>
                  </select>
                </div>

                {datePreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-1 animate-fadeIn">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Start Boundary</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[#FFFFFF] border border-[#E5E7EB] px-3.5 py-2 rounded-[10px] text-[12px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">End Boundary</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-[#FFFFFF] border border-[#E5E7EB] px-3.5 py-2 rounded-[10px] text-[12px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Conditional Event Filter */}
              {reportType === ReportType.EVENT && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#6B7280] tracking-wider block">Select Specific Event</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] px-3.5 py-2.5 rounded-[12px] text-[13px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition"
                  >
                    <option value="ALL">All Platform Events</option>
                    {filterEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>{evt.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Workspace Filter */}
              {reportType === ReportType.WORKSPACE && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#6B7280] tracking-wider block">Select Specific Space</label>
                  <select
                    value={selectedWorkspaceId}
                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] px-3.5 py-2.5 rounded-[12px] text-[13px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition"
                  >
                    <option value="ALL">All Hub Spaces</option>
                    {filterWorkspaces.map((space) => (
                      <option key={space.id} value={space.id}>{space.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Financial / Payment status */}
              {reportType === ReportType.FINANCIAL && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#6B7280] tracking-wider block">Payment Process Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] px-3.5 py-2.5 rounded-[12px] text-[13px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition"
                  >
                    <option value="ALL">All Gateways</option>
                    <option value="SUCCESSFUL">Successful Gross Cashflow</option>
                    <option value="PENDING">Pending Invoices / Uncollected</option>
                    <option value="FAILED">Failed / Abandoned Requests</option>
                  </select>
                </div>
              )}

              {/* Conditional Registration check */}
              {reportType === ReportType.EVENT && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#6B7280] tracking-wider block">Attendee Ticket Status</label>
                  <select
                    value={registrationStatus}
                    onChange={(e) => setRegistrationStatus(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] px-3.5 py-2.5 rounded-[12px] text-[13px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition"
                  >
                    <option value="ALL">All Registrations</option>
                    <option value="CONFIRMED">Confirmed / Active Tickets</option>
                    <option value="PENDING_APPROVAL">Awaiting Manual Operator Approval</option>
                    <option value="CANCELLED">Cancelled Tickets</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-5 border-t border-gray-100">
                <Button
                  onClick={runPreview}
                  disabled={isPreviewLoading}
                  className="flex-grow justify-center bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold text-[13px] h-[44px] rounded-[12px] shadow-[0_2px_10px_rgba(132,204,22,0.2)]"
                >
                  {isPreviewLoading ? 'Aggregating...' : 'Compile BI Report'}
                </Button>
                <Button
                  onClick={() => {
                    setSaveReportName(`${reportType.charAt(0) + reportType.slice(1).toLowerCase()} Report - ${new Date().toLocaleDateString()}`);
                    setIsSaveModalOpen(true);
                  }}
                  variant="outline"
                  className="shrink-0 border-[#E5E7EB] hover:bg-[#F8FAFC] h-[44px] w-[44px] p-0 flex items-center justify-center rounded-[12px] text-[#65A30D]"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Live Preview Pane Column */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Preview Control Indicator Panel */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-4 rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[13px] font-bold text-[#111827]">Live BI Indicators Preview</span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[12px] text-[#6B7280] font-bold uppercase tracking-wide mr-1">Download Stream:</span>
                  <button
                    onClick={() => handleExport(ReportFormat.CSV)}
                    disabled={!previewData || isExporting}
                    className="px-3.5 py-2 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-[12px] font-bold text-[#374151] flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Download className="w-4 h-4 text-[#6B7280]" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport(ReportFormat.EXCEL)}
                    disabled={!previewData || isExporting}
                    className="px-3.5 py-2 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-[12px] font-bold text-[#374151] flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#6B7280]" />
                    <span>XLS</span>
                  </button>
                  <button
                    onClick={() => handleExport(ReportFormat.PDF)}
                    disabled={!previewData || isExporting}
                    className="px-3.5 py-2 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-[12px] font-bold text-[#374151] flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Printer className="w-4 h-4 text-[#6B7280]" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Main Preview Container */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                {isPreviewLoading ? (
                  <div className="p-12 space-y-4">
                    <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-1/3"></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-20 bg-gray-50 rounded-xl animate-pulse"></div>
                      <div className="h-20 bg-gray-50 rounded-xl animate-pulse"></div>
                      <div className="h-20 bg-gray-50 rounded-xl animate-pulse"></div>
                    </div>
                    <div className="h-40 bg-gray-50 rounded-xl animate-pulse"></div>
                  </div>
                ) : previewError ? (
                  <div className="p-12 text-center text-[#EF4444] flex flex-col items-center">
                    <AlertCircle className="w-10 h-10 mb-3 animate-bounce" />
                    <p className="text-sm font-semibold">{previewError}</p>
                    <Button onClick={runPreview} className="mt-4 bg-[#2563EB] text-white text-xs">Retry Aggregation</Button>
                  </div>
                ) : previewData ? (
                  <div>
                    {/* Live KPI Indicators top list */}
                    <div className="p-6 border-b border-gray-100 bg-[#F8FAFC] grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(previewData.summary).map(([key, val]) => {
                        const readableLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                        return (
                          <div key={key} className="bg-[#FFFFFF] p-4 rounded-[14px] border border-[#E5E7EB] shadow-sm">
                            <span className="text-[10px] font-bold text-[#6B7280] uppercase block tracking-wider truncate mb-1">{readableLabel}</span>
                            <span className="text-[18px] font-bold text-[#111827] tracking-tight block">
                              {typeof val === 'number' && key.toLowerCase().includes('revenue') ? `$${val.toLocaleString()}` : String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Table Stream */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                            {previewData.columns.map((col: any) => (
                              <th 
                                key={col.key}
                                onClick={() => handleSort(col.key)}
                                className="p-4 px-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider select-none cursor-pointer hover:text-[#111827] transition"
                              >
                                <div className="flex items-center space-x-1.5">
                                  <span>{col.label}</span>
                                  <ArrowUpDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {getSortedRows().map((row: any, rIdx: number) => (
                            <tr 
                              key={row.id || rIdx}
                              className="hover:bg-[#F8FAFC]/40 transition-colors"
                            >
                              {previewData.columns.map((col: any) => {
                                const rawVal = row[col.key];
                                return (
                                  <td key={col.key} className="p-4 px-5 text-[13px] font-medium text-[#374151]">
                                    {col.key === 'revenue' || col.key === 'amount' || col.key === 'totalSpend' || col.key === 'hourlyRate'
                                      ? typeof rawVal === 'number' ? `$${rawVal.toLocaleString()}` : rawVal
                                      : rawVal}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer counts */}
                    <div className="p-4 px-5 bg-[#F8FAFC] border-t border-[#E5E7EB] flex justify-between items-center text-[12px] font-semibold text-[#6B7280]">
                      <span>Records generated: {previewData.rows.length} rows</span>
                      <span className="font-bold text-[#65A30D]">SECURE ARCHIVE READY</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-16 text-center text-[#6B7280] flex flex-col items-center">
                    <Database className="w-12 h-12 mb-3 text-[#9CA3AF] animate-pulse" />
                    <p className="text-[15px] font-bold text-[#111827]">Ready to compile business insights</p>
                    <p className="text-[13px] text-[#6B7280] max-w-sm mt-1 leading-relaxed">Configure your search boundary metrics and click Compile BI Report to render live preview streams.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Saved templates tab */}
        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {isTemplatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-44 bg-gray-50 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : savedTemplates.length === 0 ? (
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] p-16 text-center max-w-md mx-auto shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <FileText className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                <h3 className="text-[16px] font-bold text-[#111827]">No Saved BI Templates</h3>
                <p className="text-[13px] text-[#6B7280] mt-2 leading-relaxed">You haven't configured any custom reporting templates yet. Open Report Builder, configure your indicators, and register templates with scheduled delivery triggers.</p>
                <Button onClick={() => setActiveTab('builder')} className="mt-5 bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold text-[13px] px-5 h-[40px] rounded-[10px] shadow-sm">Build Your First Report</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4338CA] text-[10px] font-bold uppercase tracking-wide">
                          {template.type} report
                        </span>
                        
                        <div className="flex items-center space-x-1.5">
                          <span className={`h-2 w-2 rounded-full ${template.scheduling.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide">
                            {template.scheduling.enabled ? 'Scheduled' : 'Ad-hoc'}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-display font-bold text-[16px] text-[#111827] mt-3 truncate">{template.name}</h3>
                      <p className="text-[13px] text-[#6B7280] mt-1 line-clamp-2 h-10 leading-relaxed">{template.description || 'No description provided'}</p>

                      <div className="bg-[#F8FAFC] p-3.5 rounded-[12px] mt-4 border border-[#E5E7EB] text-[12px] text-[#4B5563] space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span>Delivery Preset:</span>
                          <span className="font-bold text-[#111827] uppercase">{template.filters?.preset || '30d'}</span>
                        </div>
                        {template.scheduling.enabled && (
                          <>
                            <div className="flex justify-between">
                              <span>Recurrence:</span>
                              <span className="font-bold text-[#111827]">{template.scheduling.frequency}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span>Subscribers:</span>
                              <span className="font-bold text-[#111827] truncate max-w-[140px]">{template.scheduling.emailRecipients.join(', ')}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 mt-5">
                      <Button
                        onClick={() => runTemplateMutation.mutate(template.id)}
                        disabled={runTemplateMutation.isPending}
                        className="flex-grow justify-center bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold text-[12px] h-[38px] rounded-[10px] flex items-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-[#111111]" />
                        <span>Run Now</span>
                      </Button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this template? Scheduled jobs will be halted.')) {
                            deleteTemplateMutation.mutate(template.id);
                          }
                        }}
                        className="p-2 border border-[#E5E7EB] hover:bg-red-50 rounded-[10px] text-[#9CA3AF] hover:text-[#EF4444] transition duration-150"
                        title="Delete template config"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Generated downloads tab */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden"
          >
            <div className="p-5 px-6 border-b border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
              <span className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280]">Business Intelligence Audit Stream</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase select-none">Encrypted Archive</span>
            </div>

            {isHistoryLoading ? (
              <div className="p-12 space-y-3.5 animate-pulse">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-12 bg-gray-50 rounded-xl"></div>
                ))}
              </div>
            ) : reportsHistory.length === 0 ? (
              <div className="p-16 text-center text-[#6B7280]">
                <Clock className="w-12 h-12 mb-3 text-[#9CA3AF] mx-auto animate-pulse" />
                <p className="text-[15px] font-bold text-[#111827]">BI Audit Stream Empty</p>
                <p className="text-[13px] text-[#6B7280] mt-2 max-w-sm mx-auto leading-relaxed">No generated documents have been saved yet. Automated triggers and immediate runs populate this historical record stream.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                      <th className="p-4 pl-6 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Timestamp</th>
                      <th className="p-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Report Description</th>
                      <th className="p-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Type</th>
                      <th className="p-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Compiler</th>
                      <th className="p-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Format</th>
                      <th className="p-4 pr-6 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
                    {reportsHistory.map((item) => (
                      <tr 
                        key={item.id}
                        className="hover:bg-[#F8FAFC]/50 transition-colors"
                      >
                        <td className="p-4 pl-6 text-[#6B7280] font-medium">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-[#111827]">
                          {item.name}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#4338CA] border border-[#E0E7FF]">
                            {item.type}
                          </span>
                        </td>
                        <td className="p-4 text-[#374151] font-medium">
                          {item.generatedBy === 'AUTOMATED_SCHEDULER' ? (
                            <span className="flex items-center space-x-1 text-emerald-600 font-bold">
                              <RotateCw className="w-3.5 h-3.5 animate-spin mr-1 shrink-0" />
                              <span>BI Scheduler</span>
                            </span>
                          ) : item.generatedBy}
                        </td>
                        <td className="p-4 font-bold text-[#65A30D]">
                          {item.format}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <a 
                            href={item.fileUrl} 
                            download={`${item.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${item.format === 'EXCEL' ? 'xls' : item.format.toLowerCase()}`}
                            className="inline-flex items-center space-x-1.5 text-[#65A30D] hover:text-[#84CC16] font-bold p-2 hover:bg-[#F1F5F9] rounded-lg transition"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Retrieve</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Template Configuration Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Register Custom BI Template"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Template Name</label>
            <input
              type="text"
              value={saveReportName}
              onChange={(e) => setSaveReportName(e.target.value)}
              placeholder="e.g. Monthly Operational Financial Audit"
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] p-3 rounded-[12px] text-[13px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#84CC16] focus:ring-1 focus:ring-[#84CC16] shadow-sm transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Description / Purpose</label>
            <textarea
              value={saveReportDesc}
              onChange={(e) => setSaveReportDesc(e.target.value)}
              placeholder="Configure template purpose for internal audits..."
              rows={2}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] p-3 rounded-[12px] text-[13px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#84CC16] focus:ring-1 focus:ring-[#84CC16] shadow-sm transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Default Format</label>
              <select
                value={saveReportFormat}
                onChange={(e) => setSaveReportFormat(e.target.value as ReportFormat)}
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] p-3 rounded-[12px] text-[13px] text-[#111827] focus:outline-none focus:border-[#84CC16] focus:ring-1 focus:ring-[#84CC16] shadow-sm transition"
              >
                <option value={ReportFormat.CSV}>Comma Separated (.csv)</option>
                <option value={ReportFormat.EXCEL}>MS Excel Tabular (.xls)</option>
                <option value={ReportFormat.PDF}>Aesthetic HTML (.pdf)</option>
              </select>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center space-x-2.5 p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isScheduleEnabled}
                  onChange={(e) => setIsScheduleEnabled(e.target.checked)}
                  className="rounded border-[#E5E7EB] text-[#84CC16] focus:ring-[#84CC16] h-4 w-4"
                />
                <span className="text-[13px] font-bold text-[#374151]">Enable Email Scheduler</span>
              </label>
            </div>
          </div>

          {/* Scheduling controls */}
          {isScheduleEnabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#F8FAFC] border border-[#E5E7EB] p-4 rounded-[12px] space-y-4"
            >
              <div className="flex items-center space-x-2 text-[#65A30D] font-bold text-[13px]">
                <Mail className="w-5 h-5 text-[#65A30D]" />
                <span>Automated Email Scheduler Settings</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Frequency Boundary</label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value as any)}
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] p-2.5 rounded-[10px] text-[13px] text-[#111827] focus:outline-none focus:border-[#84CC16] focus:ring-1 focus:ring-[#84CC16] shadow-sm transition"
                >
                  <option value="DAILY">Compile & Send Daily</option>
                  <option value="WEEKLY">Compile & Send Weekly</option>
                  <option value="MONTHLY">Compile & Send Monthly</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Email Recipients (Comma Separated)</label>
                <input
                  type="text"
                  value={scheduleEmails}
                  onChange={(e) => setScheduleEmails(e.target.value)}
                  placeholder="e.g. cfo@weventurehub.com, admin@weventurehub.com"
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] p-2.5 rounded-[10px] text-[13px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#84CC16] focus:ring-1 focus:ring-[#84CC16] shadow-sm transition"
                />
                <span className="text-[11px] text-[#6B7280] block pt-0.5 leading-relaxed font-medium">Automated cron compiles live aggregates and dispatches reports to all listed recipients.</span>
              </div>
            </motion.div>
          )}

          <div className="flex gap-3 pt-5 border-t border-[#E5E7EB]">
            <Button
              onClick={() => setIsSaveModalOpen(false)}
              variant="outline"
              className="w-1/2 justify-center border-[#E5E7EB] text-[#4B5563] hover:bg-[#F8FAFC] h-[40px] rounded-[10px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={saveTemplateMutation.isPending}
              className="w-1/2 justify-center bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold h-[40px] rounded-[10px]"
            >
              {saveTemplateMutation.isPending ? 'Registering...' : 'Register Template'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
