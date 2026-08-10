import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import WeVentureLogo from '../components/WeVentureLogo';
import { getBankRecord, getBankRecords, numberToWords, WEVENTURE_SUPPLIER_INFO } from '../utils/invoiceUtils';
import { paymentApi } from '../lib/paymentApi';
import { workspaceApi } from '../lib/workspaceApi';
import { getSocket } from '../lib/socket';
import { useAppSelector } from '../store';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
 FileText,
 Plus,
 Download,
 Loader2,
 Calendar,
 Receipt,
 CreditCard,
 Search,
 Filter,
 Printer,
 FileSpreadsheet,
 Building2,
 User,
 CheckCircle2,
 Clock,
 AlertCircle,
 XCircle,
 ArrowUpDown,
 ChevronDown,
 RefreshCw,
 Eye,
 DollarSign,
 TrendingUp,
 PieChart as PieChartIcon,
 X,
 Check,
 Building,
 Tag,
 Hash,
 Mail,
 Phone,
 HelpCircle,
} from 'lucide-react';
import {
 BarChart,
 Bar,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell,
} from 'recharts';

export default function InvoicesPage() {
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const { user } = useAppSelector((state) => state.auth);

 const isAdmin =
 user?.role === UserRole.SUPER_ADMIN ||
 user?.role === UserRole.TENANT_ADMIN ||
 user?.role === UserRole.STAFF;

 // View state: 'ledger' or 'analytics'
 const [activeTab, setActiveTab] = useState<'ledger' | 'analytics'>('ledger');

 // Filter & Search states
 const [searchQuery, setSearchQuery] = useState('');
 const [statusFilter, setStatusFilter] = useState('All');
 const [customerTypeFilter, setCustomerTypeFilter] = useState('All');
 const [workspaceFilter, setWorkspaceFilter] = useState('All');
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');
 const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'due_date' | 'amount_desc' | 'amount_asc'>('newest');

 // Selected Invoice for detail modal / print modal
 const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
 const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
 const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

 // Create Invoice Modal State
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
 const [newInvoiceData, setNewInvoiceData] = useState({
   userName: '',
   userEmail: '',
   userPhone: '',
   companyName: '',
   customerTin: '',
   customerType: 'Individual',
   workspaceName: 'Executive Coworking Suite',
   billingPeriod: 'Current Cycle',
   itemDescription: 'Tenancy Workspace Rental Charge',
   durationType: 'Hourly',
   customDurationType: '',
   durationQuantity: 1,
   unitPrice: 1500,
   discount: 0,
   dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
   status: 'Pending Payment',
   selectedBanks: ['Dashen Bank', 'Commercial Bank of Ethiopia'],
 });

 const createInvoiceMutation = useMutation({
   mutationFn: (payload: any) => paymentApi.createInvoice(payload),
   onSuccess: (data) => {
     queryClient.invalidateQueries({ queryKey: ['invoices'] });
     queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
     setIsCreateModalOpen(false);
     alert(`Invoice ${data?.invoiceNumber || ''} created successfully!`);
   },
   onError: (err: any) => {
     alert(`Failed to create invoice: ${err?.response?.data?.message || err.message}`);
   },
 });

 const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
   e.preventDefault();
   const finalDurationType = newInvoiceData.durationType === 'Custom'
     ? (newInvoiceData.customDurationType.trim() || 'Custom Duration')
     : newInvoiceData.durationType;

   const amount = Number(newInvoiceData.durationQuantity || 1) * Number(newInvoiceData.unitPrice || 0);
   const vat = Math.round(amount * 0.15 * 100) / 100;
   const grandTotal = amount + vat - Number(newInvoiceData.discount || 0);

   createInvoiceMutation.mutate({
     userName: newInvoiceData.userName || 'Valued Client',
     userEmail: newInvoiceData.userEmail || 'client@weventurehub.com',
     userPhone: newInvoiceData.userPhone,
     companyName: newInvoiceData.companyName,
     customerTin: newInvoiceData.customerTin,
     billingDetails: {
       name: newInvoiceData.userName || 'Valued Client',
       email: newInvoiceData.userEmail || 'client@weventurehub.com',
       phone: newInvoiceData.userPhone,
       company: newInvoiceData.companyName,
       taxId: newInvoiceData.customerTin,
       tinNumber: newInvoiceData.customerTin,
     },
     customerType: newInvoiceData.customerType,
     workspaceName: newInvoiceData.workspaceName,
     billingPeriod: newInvoiceData.billingPeriod,
     durationType: finalDurationType,
     durationQuantity: Number(newInvoiceData.durationQuantity || 1),
     unitPrice: Number(newInvoiceData.unitPrice || 0),
     amount,
     vat,
     discount: Number(newInvoiceData.discount || 0),
     grandTotal,
     dueDate: newInvoiceData.dueDate,
     status: newInvoiceData.status,
     selectedBanks: newInvoiceData.selectedBanks,
     itemDescription: newInvoiceData.itemDescription || `Workspace Rental - ${newInvoiceData.workspaceName}`,
     lineItems: [
       {
         description: newInvoiceData.itemDescription || `Workspace Rental - ${newInvoiceData.workspaceName}`,
         durationType: finalDurationType,
         quantity: Number(newInvoiceData.durationQuantity || 1),
         unitPrice: Number(newInvoiceData.unitPrice || 0),
         amount,
       }
     ]
   });
 };

 // Print ref
 const printContainerRef = useRef<HTMLDivElement>(null);

 // Fetch Workspaces list for dropdown filter
 const { data: workspacesData } = useQuery({
 queryKey: ['workspaces-list'],
 queryFn: () => workspaceApi.getWorkspaces(),
 enabled: isAdmin,
 });

 const workspaces: any[] = useMemo(() => {
 if (Array.isArray(workspacesData)) return workspacesData;
 if (Array.isArray((workspacesData as any)?.data)) return (workspacesData as any).data;
 return [];
 }, [workspacesData]);

 // Fetch Invoices with params
 const {
 data: invoicesData,
 isLoading: isLoadingInvoices,
 isError,
 refetch: refetchInvoices,
 } = useQuery({
 queryKey: [
 'invoices',
 searchQuery,
 statusFilter,
 customerTypeFilter,
 workspaceFilter,
 startDate,
 endDate,
 sortBy,
    ],
    queryFn: () =>
 paymentApi.getInvoices({
 search: searchQuery || undefined,
 status: statusFilter !== 'All' ? statusFilter : undefined,
 customerType: customerTypeFilter !== 'All' ? customerTypeFilter : undefined,
 workspaceId: workspaceFilter !== 'All' ? workspaceFilter : undefined,
 startDate: startDate || undefined,
 endDate: endDate || undefined,
 sort: sortBy,
 }),
 });

 const invoices: any[] = useMemo(() => {
 if (Array.isArray(invoicesData)) return invoicesData;
 if (Array.isArray((invoicesData as any)?.data)) return (invoicesData as any).data;
 return [];
 }, [invoicesData]);

 // Fetch Invoice Stats for Dashboard
 const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
 queryKey: ['invoice-stats'],
 queryFn: () => paymentApi.getInvoiceStats(),
 enabled: isAdmin,
 });

 // Real-time synchronization via Socket.IO
 useEffect(() => {
   const socket = getSocket();
   if (socket) {
     const handleSocketUpdate = () => {
       queryClient.invalidateQueries({ queryKey: ['invoices'] });
       queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
     };

     socket.on('invoice:created', handleSocketUpdate);
     socket.on('invoice:updated', handleSocketUpdate);
     socket.on('dashboard:update', handleSocketUpdate);

     return () => {
       socket.off('invoice:created', handleSocketUpdate);
       socket.off('invoice:updated', handleSocketUpdate);
       socket.off('dashboard:update', handleSocketUpdate);
     };
   }
 }, [queryClient]);

 // Status update mutation
 const updateStatusMutation = useMutation({
 mutationFn: ({ id, status }: { id: string; status: string }) =>
 paymentApi.updateInvoiceStatus(id, status),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['invoices'] });
 queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
 if (selectedInvoice) {
 // Update local modal data
 paymentApi.getInvoiceById(selectedInvoice.id).then((updated) => {
 if (updated) setSelectedInvoice(updated);
 });
 }
 setIsUpdatingStatus(null);
 },
 onError: (err: any) => {
 alert(`Failed to update status: ${err?.response?.data?.message || err.message}`);
 setIsUpdatingStatus(null);
 },
 });

 const handleStatusChange = (invoiceId: string, newStatus: string) => {
 setIsUpdatingStatus(invoiceId);
 updateStatusMutation.mutate({ id: invoiceId, status: newStatus });
 };

 const handlePayInvoice = (invoice: any) => {
 navigate('/dashboard/checkout', {
 state: {
 targetType: 'INVOICE',
 targetId: invoice.id,
 amount: invoice.grandTotal || invoice.amount,
 currency: invoice.currency || 'ETB',
 title: invoice.workspaceName
 ? `Invoice for ${invoice.workspaceName}`
 : `Invoice ${invoice.invoiceNumber}`,
 description: `WeVentureHub Reservation Invoice (${invoice.invoiceNumber})`,
 invoiceNumber: invoice.invoiceNumber,
 billingDetails: invoice.billingDetails,
 },
 });
 };

 const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
  try {
    const token = localStorage.getItem('weventure_jwt_token') || '';
    const tenantId = localStorage.getItem('weventure_tenant_id') || 'weventurehub';
    const response = await fetch(`/api/v1/payments/invoices/${id}/download?token=${encodeURIComponent(token)}&tenantId=${encodeURIComponent(tenantId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error('Failed to fetch invoice PDF');
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Invoice_${invoiceNumber || id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (e) {
    const token = localStorage.getItem('weventure_jwt_token') || '';
    window.open(`/api/v1/payments/invoices/${id}/download?token=${encodeURIComponent(token)}`, '_blank');
  }
 };

 const handleDownloadTxt = handleDownloadPdf;

 const handlePrint = (invoice: any) => {
 setSelectedInvoice(invoice);
 setIsDetailModalOpen(true);
 setTimeout(() => {
 window.print();
 }, 400);
 };

 // Export invoice list to Excel/CSV
 const handleExportCSV = () => {
 if (!invoices || invoices.length === 0) {
 alert('No invoice data available to export.');
 return;
 }

 const headers = [
 'Invoice Number',
 'Booking ID',
 'Customer Type',
 'Customer Name',
 'Company Name',
 'Email',
 'Phone',
 'Workspace Name',
 'Duration Type',
 'Quantity',
 'Unit Price',
 'Subtotal',
 'Tax (VAT)',
 'Discount',
 'Grand Total',
 'Due Date',
 'Status',
 'Date Issued',
 'Paid At'
  ];

 const rows = invoices.map((inv: any) => [
 `"${inv.invoiceNumber || ''}"`,
 `"${inv.bookingId || ''}"`,
 `"${inv.customerType || 'Individual'}"`,
 `"${inv.billingDetails?.name || ''}"`,
 `"${inv.billingDetails?.company || ''}"`,
 `"${inv.billingDetails?.email || inv.userEmail || ''}"`,
 `"${inv.billingDetails?.phone || ''}"`,
 `"${inv.workspaceName || ''}"`,
 `"${inv.durationType || 'Hourly'}"`,
 inv.durationQuantity || 1,
 inv.unitPrice || inv.amount || 0,
 inv.amount || 0,
 inv.vat || 0,
 inv.discount || 0,
 inv.grandTotal || inv.amount || 0,
 inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
 `"${inv.status || 'Pending Payment'}"`,
 inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : '',
 inv.paidAt ? new Date(inv.paidAt).toISOString().split('T')[0] : '',
    ]);

 const csvContent =
 'data:text/csv;charset=utf-8,' +
 [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

 const encodedUri = encodeURI(csvContent);
 const link = document.createElement('a');
 link.setAttribute('href', encodedUri);
 link.setAttribute(
 'download',
 `weventurehub_invoices_${new Date().toISOString().split('T')[0]}.csv`
 );
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 // Helper for Status Badge styling
 const getStatusBadge = (status: string) => {
 const s = String(status || '').toLowerCase();
 if (s === 'paid') {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase rounded-full bg-emerald-100 text-[#4D7C0F] border border-emerald-300 /40 ">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Paid</span>
 </span>
 );
 }
 if (s === 'partially paid') {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase rounded-full bg-blue-100 text-blue-800 border border-blue-300 /40 ">
 <Clock className="w-3.5 h-3.5" />
 <span>Partially Paid</span>
 </span>
 );
 }
 if (s === 'overdue') {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase rounded-full bg-rose-100 text-rose-800 border border-rose-300 /40 animate-pulse">
 <AlertCircle className="w-3.5 h-3.5" />
 <span>Overdue</span>
 </span>
 );
 }
 if (s === 'cancelled' || s === 'void' || s === 'refunded') {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase rounded-full bg-neutral-200 text-neutral-700 border border-neutral-300 ">
 <XCircle className="w-3.5 h-3.5" />
 <span>Cancelled</span>
 </span>
 );
 }
 if (s === 'draft') {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-300 /40 ">
 <Receipt className="w-3.5 h-3.5" />
 <span>Draft</span>
 </span>
 );
 }
 // Default Pending Payment / Unpaid
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200 /30 ">
 <Clock className="w-3.5 h-3.5" />
 <span>Pending Payment</span>
 </span>
 );
 };

 const COLORS = ['#84CC16', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

 return (
 <div className="space-y-6 pb-12">
 {/* Printable Invoice Container (visible during window.print()) */}
  <style>{`
  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
  }
  `}</style>

 {/* Main Page Title Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
 <div>
 <div className="flex items-center gap-2">
 <Receipt className="w-7 h-7 text-[#65A30D]" />
 <h1 className="font-display font-extrabold text-2xl tracking-tight text-[#111827]">
 Workspace Invoice Management
 </h1>
 </div>
 <p className="text-xs text-[#4B5563] mt-1">
 {isAdmin
 ? 'Complete tenancy billing ledger, customer invoicing, automated status tracking, and revenue diagnostics'
 : 'View your workspace booking invoices, payment statuses, and downloadable receipts'}
 </p>
 </div>

 <div className="flex items-center gap-2">
 {isAdmin && (
 <>
 <div className="bg-[#F3F4F6] p-1 rounded-2xl flex items-center border border-[#E5E7EB] ">
 <button
 onClick={() => setActiveTab('ledger')}
 className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
 activeTab === 'ledger'
 ? 'bg-white text-[#111827] shadow-xs'
 : 'text-[#4B5563] hover:text-[#111827]'
 }`}
 >
 <FileText className="w-3.5 h-3.5 text-[#65A30D]" />
 <span>Invoice Ledger</span>
 </button>
 <button
 onClick={() => setActiveTab('analytics')}
 className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
 activeTab === 'analytics'
 ? 'bg-white text-[#111827] shadow-xs'
 : 'text-[#4B5563] hover:text-[#111827]'
 }`}
 >
 <TrendingUp className="w-3.5 h-3.5 text-[#65A30D]" />
 <span>Revenue Analytics</span>
 </button>
 </div>

 <Button
 size="sm"
 onClick={() => setIsCreateModalOpen(true)}
 className="bg-[#84CC16] hover:bg-lime-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
 >
 <Plus className="w-4 h-4" />
 <span>Create Invoice</span>
 </Button>

 <Button
 size="sm"
 variant="secondary"
 onClick={handleExportCSV}
 className="rounded-xl font-bold text-xs flex items-center gap-1.5"
 >
 <FileSpreadsheet className="w-4 h-4 text-[#65A30D]" />
 <span>Export CSV/Excel</span>
 </Button>
 </>
 )}

 <Button
 size="sm"
 variant="secondary"
 onClick={() => {
 refetchInvoices();
 if (isAdmin) refetchStats();
 }}
 className="rounded-xl font-bold text-xs flex items-center gap-1.5"
 >
 <RefreshCw className="w-3.5 h-3.5" />
 <span>Refresh</span>
 </Button>
 </div>
 </div>

 {/* Admin Dashboard Summary Statistics Cards */}
 {isAdmin && stats && (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
 {/* Total Invoices */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Total Invoices
 </span>
 <FileText className="w-4 h-4 text-[#65A30D]" />
 </div>
 <div className="font-display font-extrabold text-2xl text-[#111827]">
 {stats.totalInvoices || 0}
 </div>
 <div className="text-[10px] text-[#65A30D] font-bold">Workspace Ledger</div>
 </div>

 {/* Total Revenue */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Total Revenue
 </span>
 <DollarSign className="w-4 h-4 text-[#84CC16]" />
 </div>
 <div className="font-display font-extrabold text-xl text-[#111827] truncate">
 {(stats.totalRevenue || 0).toLocaleString()} <span className="text-xs font-normal">ETB</span>
 </div>
 <div className="text-[10px] text-[#65A30D] font-bold">Paid Settlements</div>
 </div>

 {/* Paid Invoices */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Paid Invoices
 </span>
 <CheckCircle2 className="w-4 h-4 text-[#65A30D]" />
 </div>
 <div className="font-display font-extrabold text-2xl text-[#65A30D] ">
 {stats.paidInvoices || 0}
 </div>
 <div className="text-[10px] text-neutral-500 font-medium">
 {stats.totalInvoices
 ? `${Math.round(((stats.paidInvoices || 0) / stats.totalInvoices) * 100)}% Settled`
 : '0% Settled'}
 </div>
 </div>

 {/* Pending Invoices */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Pending Invoices
 </span>
 <Clock className="w-4 h-4 text-amber-500" />
 </div>
 <div className="font-display font-extrabold text-2xl text-amber-600 ">
 {stats.pendingInvoices || 0}
 </div>
 <div className="text-[10px] text-amber-700 font-medium">
 Awaiting Checkout
 </div>
 </div>

 {/* Unpaid Invoices */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Unpaid Total
 </span>
 <Receipt className="w-4 h-4 text-blue-500" />
 </div>
 <div className="font-display font-extrabold text-2xl text-blue-600 ">
 {stats.unpaidInvoices || 0}
 </div>
 <div className="text-[10px] text-blue-600 font-medium">Open Balance</div>
 </div>

 {/* Overdue Invoices */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Overdue
 </span>
 <AlertCircle className="w-4 h-4 text-rose-500" />
 </div>
 <div className="font-display font-extrabold text-2xl text-rose-600 ">
 {stats.overdueInvoices || 0}
 </div>
 <div className="text-[10px] text-rose-600 font-bold">Past Due Grace</div>
 </div>
 </div>
 )}

 {/* Analytics Tab View */}
 {isAdmin && activeTab === 'analytics' && stats && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
 {/* Monthly Revenue Chart */}
 <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-4 shadow-xs">
 <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
 <div className="flex items-center gap-2">
 <TrendingUp className="w-5 h-5 text-[#65A30D]" />
 <h3 className="font-display font-bold text-base text-[#111827]">
 Monthly Revenue Trend
 </h3>
 </div>
 <span className="text-xs text-[#4B5563] font-mono">
 Historical Income
 </span>
 </div>

 {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
 <div className="h-64 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={stats.monthlyRevenue}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
 <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
 <YAxis stroke="#9CA3AF" fontSize={11} />
 <Tooltip
 formatter={(val: any) => [`${Number(val).toLocaleString()} ETB`, 'Revenue']}
 contentStyle={{
 backgroundColor: '#111827',
 borderColor: '#374151',
 borderRadius: '12px',
 color: '#FFF',
 fontSize: '12px',
 }}
 />
 <Bar dataKey="revenue" fill="#84CC16" radius={[6, 6, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 ) : (
 <div className="h-48 flex items-center justify-center text-xs text-neutral-400">
 No monthly revenue trend recorded yet.
 </div>
 )}
 </div>

 {/* Revenue by Workspace Breakdown */}
 <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-4 shadow-xs">
 <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
 <div className="flex items-center gap-2">
 <PieChartIcon className="w-5 h-5 text-[#65A30D]" />
 <h3 className="font-display font-bold text-base text-[#111827]">
 Revenue by Workspace
 </h3>
 </div>
 <span className="text-xs text-[#4B5563] font-mono">
 Space Performance
 </span>
 </div>

 {stats.revenueByWorkspace && stats.revenueByWorkspace.length > 0 ? (
 <div className="space-y-3">
 {stats.revenueByWorkspace.map((ws: any, idx: number) => {
 const percent = stats.totalRevenue
 ? Math.round((ws.revenue / stats.totalRevenue) * 100)
 : 0;
 return (
 <div
 key={idx}
 className="flex items-center justify-between p-3 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs"
 >
 <div className="flex items-center gap-2.5">
 <div
 className="w-3 h-3 rounded-full"
 style={{ backgroundColor: COLORS[idx % COLORS.length] }}
 />
 <div>
 <div className="font-bold text-[#111827]">{ws.name}</div>
 <div className="text-[10px] text-[#4B5563] ">
 {ws.count} paid invoice(s)
 </div>
 </div>
 </div>
 <div className="text-right">
 <div className="font-black text-sm text-[#111827]">
 {ws.revenue.toLocaleString()} ETB
 </div>
 <div className="text-[10px] font-bold text-[#65A30D]">{percent}% of Total</div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="h-48 flex items-center justify-center text-xs text-neutral-400">
 No workspace revenue breakdown available yet.
 </div>
 )}
 </div>
 </div>
 )}

 {/* Ledger & Search Filters Section */}
 <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-4 shadow-xs">
 {/* Search Input Bar */}
 <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
 <div className="relative flex-1">
 <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
 <Input
 type="text"
 placeholder="Search by invoice #, customer, company, email, workspace, or booking ID..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10 text-xs rounded-2xl border-[#E5E7EB] "
 />
 {searchQuery && (
 <button
 onClick={() => setSearchQuery('')}
 className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>

 <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
 {/* Sort Control */}
 <select
 value={sortBy}
 onChange={(e: any) => setSortBy(e.target.value)}
 className="bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-semibold rounded-2xl px-3 py-2 text-[#111827]"
 >
 <option value="newest">Sort: Newest First</option>
 <option value="oldest">Sort: Oldest First</option>
 <option value="due_date">Sort: Due Date</option>
 <option value="amount_desc">Sort: Amount (High to Low)</option>
 <option value="amount_asc">Sort: Amount (Low to High)</option>
 </select>
 </div>
 </div>

 {/* Filters Grid */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-[#E5E7EB] ">
 {/* Status Filter */}
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-[#4B5563] mb-1">
 Invoice Status
 </label>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-medium rounded-xl px-2.5 py-1.5 text-[#111827]"
 >
 <option value="All">All Statuses</option>
 <option value="Paid">Paid</option>
 <option value="Pending Payment">Pending Payment</option>
 <option value="Partially Paid">Partially Paid</option>
 <option value="Overdue">Overdue</option>
 <option value="Cancelled">Cancelled</option>
 <option value="Draft">Draft</option>
 </select>
 </div>

 {/* Customer Type Filter */}
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-[#4B5563] mb-1">
 Customer Type
 </label>
 <select
 value={customerTypeFilter}
 onChange={(e) => setCustomerTypeFilter(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-medium rounded-xl px-2.5 py-1.5 text-[#111827]"
 >
 <option value="All">All Types</option>
 <option value="Individual">Individual Customer</option>
 <option value="Company">Company / Org</option>
 </select>
 </div>

 {/* Workspace Filter */}
 {isAdmin && (
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-[#4B5563] mb-1">
 Workspace
 </label>
 <select
 value={workspaceFilter}
 onChange={(e) => setWorkspaceFilter(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-medium rounded-xl px-2.5 py-1.5 text-[#111827] truncate"
 >
 <option value="All">All Workspaces</option>
 {workspaces.map((ws: any) => (
 <option key={ws.id} value={ws.id}>
 {ws.name}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* Date Range Start */}
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-[#4B5563] mb-1">
 Start Date
 </label>
 <input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-medium rounded-xl px-2 py-1 text-[#111827]"
 />
 </div>

 {/* Date Range End */}
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-[#4B5563] mb-1">
 End Date
 </label>
 <input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-medium rounded-xl px-2 py-1 text-[#111827]"
 />
 </div>
 </div>

 {/* Filter Clear Trigger */}
 {(statusFilter !== 'All' ||
 customerTypeFilter !== 'All' ||
 workspaceFilter !== 'All' ||
 startDate ||
 endDate ||
 searchQuery) && (
 <div className="flex justify-end pt-1">
 <button
 onClick={() => {
 setStatusFilter('All');
 setCustomerTypeFilter('All');
 setWorkspaceFilter('All');
 setStartDate('');
 setEndDate('');
 setSearchQuery('');
 }}
 className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
 >
 <X className="w-3.5 h-3.5" />
 <span>Reset Filters</span>
 </button>
 </div>
 )}
 </div>

 {/* Invoices List Display */}
 {isLoadingInvoices ? (
 <div className="flex flex-col items-center justify-center py-20 gap-3">
 <Loader2 className="w-10 h-10 text-[#84CC16] animate-spin" />
 <span className="text-xs text-[#4B5563] font-mono">
 Loading Workspace Invoice Management ledger...
 </span>
 </div>
 ) : isError || invoices.length === 0 ? (
 <div className="text-center py-20 bg-white border border-[#E5E7EB] rounded-3xl space-y-4">
 <Receipt className="w-12 h-12 text-[#9CA3AF] mx-auto" />
 <h3 className="font-display font-bold text-base text-[#111827]">
 No invoices match your filter
 </h3>
 <p className="text-xs text-[#4B5563] max-w-sm mx-auto">
 Try resetting your search query or status filter to see other workspace invoices.
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {/* Mobile View: Cards */}
 <div className="block md:hidden space-y-4">
 {invoices.map((invoice: any) => {
 const isPaid = String(invoice.status || '').toLowerCase() === 'paid';
 const isCompany = invoice.customerType === 'Company' || invoice.billingDetails?.company;

 return (
 <div
 key={invoice.id}
 className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-xs"
 >
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2 font-mono font-extrabold text-sm text-[#111827]">
 <FileText className="w-4 h-4 text-[#65A30D]" />
 <span>{invoice.invoiceNumber}</span>
 </div>
 <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
 Booking: {invoice.bookingId || 'N/A'}
 </div>
 </div>
 <div>{getStatusBadge(invoice.status)}</div>
 </div>

 <div className="space-y-2 text-xs border-y border-[#E5E7EB] py-3">
 <div className="flex justify-between items-center">
 <span className="text-neutral-400">Customer Type:</span>
 <span className="inline-flex items-center gap-1 font-bold text-[11px] text-[#111827]">
 {isCompany ? (
 <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 /40 font-extrabold text-[10px] flex items-center gap-1">
 <Building2 className="w-3 h-3" />
 <span>Company ({invoice.billingDetails?.company || 'Corporate'})</span>
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-[10px] flex items-center gap-1">
 <User className="w-3 h-3" />
 <span>Individual</span>
 </span>
 )}
 </span>
 </div>

 <div className="flex justify-between">
 <span className="text-neutral-400">Customer:</span>
 <span className="font-semibold text-[#111827]">
 {invoice.billingDetails?.name}
 </span>
 </div>

 <div className="flex justify-between">
 <span className="text-neutral-400">Workspace:</span>
 <span className="font-bold text-[#65A30D]">
 {invoice.workspaceName || 'Executive Suite'}
 </span>
 </div>

 <div className="flex justify-between">
 <span className="text-neutral-400">Customer TIN No:</span>
 <span className="font-bold text-[#65A30D] font-mono">
 {invoice.billingDetails?.tinNumber || invoice.billingDetails?.taxId || invoice.customerTin || 'N/A'}
 </span>
 </div>

 <div className="flex justify-between">
 <span className="text-neutral-400">Duration:</span>
 <span className="font-medium text-neutral-700 ">
 {invoice.durationQuantity || invoice.lineItems?.[0]?.quantity || 1} {invoice.durationType || invoice.lineItems?.[0]?.durationType || 'Hourly'}
 </span>
 </div>

 <div className="flex justify-between">
 <span className="text-neutral-400">Due Date:</span>
 <span className="font-mono text-neutral-600 ">
 {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Immediate'}
 </span>
 </div>
 </div>

 {/* Actions & Amount */}
 <div className="flex items-center justify-between gap-2">
 <div>
 <div className="text-[10px] uppercase text-neutral-400 font-extrabold">Grand Total</div>
 <div className="text-lg font-extrabold text-[#111827]">
 {(invoice.grandTotal || invoice.amount || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-400">{invoice.currency || 'ETB'}</span>
 </div>
 </div>

 <div className="flex items-center gap-1.5">
 {!isPaid && (
 <Button
 size="sm"
 variant="primary"
 onClick={() => handlePayInvoice(invoice)}
 className="rounded-xl bg-[#84CC16] hover:bg-[#73B612] text-[#111827] font-bold text-[11px] flex items-center gap-1"
 >
 <CreditCard className="w-3.5 h-3.5" />
 <span>Pay</span>
 </Button>
 )}

 <Button
 size="sm"
 variant="secondary"
 onClick={() => {
 setSelectedInvoice(invoice);
 setIsDetailModalOpen(true);
 }}
 className="rounded-xl flex items-center gap-1 text-[11px] font-bold"
 >
 <Eye className="w-3.5 h-3.5" />
 <span>View</span>
 </Button>
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* Desktop View: Full Workspace Invoice Management Table */}
 <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] font-extrabold uppercase tracking-wider text-[10px] select-none">
 <th className="py-4 px-5">Invoice & Booking Ref</th>
 <th className="py-4 px-5">Customer Type & Details</th>
 <th className="py-4 px-5">Workspace & Duration</th>
 <th className="py-4 px-5">Financial Breakdown</th>
 <th className="py-4 px-5">Due Date</th>
 <th className="py-4 px-5">Status</th>
 <th className="py-4 px-5 text-right">Actions</th>
 </tr>
 </thead>
 <tbody>
 {invoices.map((invoice: any) => {
 const isPaid = String(invoice.status || '').toLowerCase() === 'paid';
 const isCompany =
 invoice.customerType === 'Company' || Boolean(invoice.billingDetails?.company);
 const isUpdating = isUpdatingStatus === invoice.id;

 return (
 <tr
 key={invoice.id}
 className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]/50 transition-all animate-fade-in"
 >
 {/* Invoice & Booking Ref */}
 <td className="py-4 px-5">
 <div className="font-mono font-extrabold text-sm text-[#111827] flex items-center gap-2">
 <FileText className="w-4 h-4 text-[#65A30D]" />
 <span>{invoice.invoiceNumber}</span>
 </div>
 <div className="text-[10px] font-mono text-neutral-400 mt-0.5 flex items-center gap-1">
 <Hash className="w-3 h-3 text-neutral-400" />
 <span>Booking ID: {invoice.bookingId || 'N/A'}</span>
 </div>
 </td>

 {/* Customer Type & Details */}
 <td className="py-4 px-5">
 <div className="flex items-center gap-1.5 mb-1">
 {isCompany ? (
 <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 /40 font-black text-[10px] uppercase border border-indigo-200 flex items-center gap-1">
 <Building2 className="w-3 h-3" />
 <span>{invoice.billingDetails?.company || 'Company'}</span>
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-[10px] uppercase border border-gray-200 flex items-center gap-1">
 <User className="w-3 h-3" />
 <span>Individual</span>
 </span>
 )}
 </div>
 <div className="font-semibold text-[#111827]">
 {invoice.billingDetails?.name}
 </div>
 <div className="text-[10px] text-neutral-500 font-mono">
 {invoice.billingDetails?.email || invoice.userEmail}
 </div>
 {(invoice.billingDetails?.tinNumber || invoice.billingDetails?.taxId || invoice.customerTin) && (
 <div className="text-[10px] text-[#65A30D] font-extrabold mt-1">
 TIN No: {invoice.billingDetails?.tinNumber || invoice.billingDetails?.taxId || invoice.customerTin}
 </div>
 )}
 </td>

 {/* Workspace & Duration */}
 <td className="py-4 px-5">
 <div className="font-bold text-[#111827]">
 {invoice.workspaceName || 'Executive Workspace'}
 </div>
 <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
 {invoice.durationQuantity || invoice.lineItems?.[0]?.quantity || 1} x {invoice.durationType || invoice.lineItems?.[0]?.durationType || 'Hourly'} @{' '}
 {(invoice.unitPrice || invoice.lineItems?.[0]?.unitPrice || invoice.amount || 0).toLocaleString()}{' '}
 {invoice.currency || 'ETB'}
 </div>
 </td>

 {/* Financial Breakdown */}
 <td className="py-4 px-5">
 <div className="font-black text-sm text-[#111827]">
 {(invoice.grandTotal || invoice.amount || 0).toLocaleString()}{' '}
 <span className="text-[10px] font-normal text-neutral-400">
 {invoice.currency || 'ETB'}
 </span>
 </div>
 <div className="text-[10px] text-neutral-500 font-mono">
 Subtotal: {(invoice.amount || 0).toLocaleString()} | Tax:{' '}
 {(invoice.vat || 0).toLocaleString()}
 </div>
 </td>

 {/* Due Date */}
 <td className="py-4 px-5">
 <div className="flex items-center gap-1.5 font-medium text-neutral-700 ">
 <Calendar className="w-3.5 h-3.5 text-neutral-400" />
 <span>
 {invoice.dueDate
 ? new Date(invoice.dueDate).toLocaleDateString()
 : 'Immediate'}
 </span>
 </div>
 </td>

 {/* Status */}
 <td className="py-4 px-5">
 {isAdmin ? (
 <div className="relative inline-block">
 <select
 value={invoice.status}
 disabled={isUpdating}
 onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
 className="bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] font-extrabold rounded-xl px-2.5 py-1 text-[#111827] cursor-pointer hover:border-[#84CC16] transition-all"
 >
 <option value="Pending Payment">Pending Payment</option>
 <option value="Paid">Paid</option>
 <option value="Partially Paid">Partially Paid</option>
 <option value="Overdue">Overdue</option>
 <option value="Cancelled">Cancelled</option>
 <option value="Draft">Draft</option>
 </select>
 {isUpdating && (
 <Loader2 className="w-3.5 h-3.5 text-[#84CC16] animate-spin inline-block ml-1" />
 )}
 </div>
 ) : (
 getStatusBadge(invoice.status)
 )}
 </td>

 {/* Actions */}
 <td className="py-4 px-5 text-right">
 <div className="flex items-center justify-end gap-1.5">
 {!isPaid && (
 <Button
 size="sm"
 variant="primary"
 onClick={() => handlePayInvoice(invoice)}
 className="rounded-xl bg-[#84CC16] hover:bg-[#73B612] text-[#111827] font-bold text-[11px] flex items-center gap-1 py-1"
 >
 <CreditCard className="w-3.5 h-3.5" />
 <span>Pay</span>
 </Button>
 )}

 <Button
 size="sm"
 variant="secondary"
 onClick={() => {
 setSelectedInvoice(invoice);
 setIsDetailModalOpen(true);
 }}
 className="rounded-xl flex items-center gap-1 text-[11px] font-bold py-1"
 >
 <Eye className="w-3.5 h-3.5" />
 <span>Details</span>
 </Button>

 <button
 onClick={() => handlePrint(invoice)}
 title="Print Invoice"
 className="p-1.5 rounded-xl border border-[#E5E7EB] text-neutral-600 hover:bg-[#F3F4F6] transition-all"
 >
 <Printer className="w-4 h-4" />
 </button>

 <button
 onClick={() => handleDownloadTxt(invoice.id, invoice.invoiceNumber)}
 title="Download Text Invoice"
 className="p-1.5 rounded-xl border border-[#E5E7EB] text-neutral-600 hover:bg-[#F3F4F6] transition-all"
 >
 <Download className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* Invoice Details & Official Printable Modal */}
 {isDetailModalOpen && selectedInvoice && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in print:bg-white print:p-0 print:static print:z-0 print:inset-auto">
 <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 md:p-8 print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
 {/* Modal Header Controls */}
 <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4 no-print">
 <div className="flex items-center gap-2">
 <Receipt className="w-6 h-6 text-[#65A30D]" />
 <h2 className="font-display font-bold text-lg text-[#111827]">
 Invoice Details & Printable Document
 </h2>
 </div>
 <div className="flex items-center gap-2">
 <Button
 size="sm"
 variant="secondary"
 onClick={() => window.print()}
 className="rounded-xl flex items-center gap-1.5 font-bold text-xs"
 >
 <Printer className="w-4 h-4 text-[#65A30D]" />
 <span>Print</span>
 </Button>
 <Button
 size="sm"
 onClick={() => handleDownloadPdf(selectedInvoice.id || selectedInvoice._id, selectedInvoice.invoiceNumber)}
 className="rounded-xl flex items-center gap-1.5 font-bold text-xs bg-[#65A30D] text-white hover:bg-[#4d7c0a]"
 >
 <Download className="w-4 h-4 text-white" />
 <span>Download PDF</span>
 </Button>
 <button
 onClick={() => setIsDetailModalOpen(false)}
 className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Printable Document Box */}
 <div
 id="printable-invoice"
 ref={printContainerRef}
 className="bg-white text-neutral-900 rounded-3xl p-8 md:p-12 border border-neutral-200 space-y-8 shadow-sm font-sans"
 >
 {/* Official Header & Branding with WEVENTURE Logo + WEVENTURE Header Text ABOVE Lemon Line */}
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
 <div className="flex items-center gap-5">
 <WeVentureLogo size={88} mode="light" />
 <div>
 <span className="font-display font-black text-4xl md:text-5xl text-neutral-900 tracking-tight block leading-tight">
 WEVENTURE
 </span>
 <span className="text-sm md:text-base font-extrabold text-[#84CC16] tracking-widest uppercase block mt-1">
 EVENT & WORKSPACE MANAGEMENT PLATFORM
 </span>
 </div>
 </div>
 </div>

 {/* THE VIBRANT LEMON GREEN ACCENT LINE */}
 <div className="w-full h-2.5 bg-[#84CC16] rounded-full my-6" />

 {/* OFFICIAL INVOICE META BANNER UNDER LEMON LINE */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-900 text-white rounded-2xl p-5 gap-4">
 <div className="flex items-center gap-4 flex-wrap">
 <div className="inline-block px-4 py-1.5 bg-[#84CC16] text-black font-mono font-black text-xs md:text-sm rounded-xl">
 OFFICIAL INVOICE
 </div>
 <div className="font-mono font-black text-2xl md:text-3xl text-white">
 {selectedInvoice.invoiceNumber}
 </div>
 </div>
 <div className="flex items-center gap-4 flex-wrap">
 <div className="text-sm md:text-base text-neutral-300 font-mono font-semibold">
 Booking ID: <span className="text-white font-bold">{selectedInvoice.bookingId || 'N/A'}</span>
 </div>
 <div>{getStatusBadge(selectedInvoice.status)}</div>
 </div>
 </div>

 {/* SUPPLIER & BILLED TO GRID BELOW LEMON LINE */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
 {/* Supplier Information */}
 <div className="space-y-2 text-sm md:text-base">
 <h4 className="font-black uppercase text-xs md:text-sm text-neutral-500 tracking-wider mb-2">
 SUPPLIER INFORMATION
 </h4>
 <div className="font-black text-lg md:text-xl text-neutral-900">
 {WEVENTURE_SUPPLIER_INFO.companyName}
 </div>
 <div className="text-neutral-700 font-medium">
 <span className="font-bold text-neutral-900">Address:</span> {WEVENTURE_SUPPLIER_INFO.address}
 </div>
 <div className="text-neutral-700 font-medium">
 <span className="font-bold text-neutral-900">Supplier's VAT Reg. No:</span> {WEVENTURE_SUPPLIER_INFO.vatRegNo}
 </div>
 <div className="text-neutral-700 font-medium">
 <span className="font-bold text-neutral-900">Supplier's TIN No:</span> {WEVENTURE_SUPPLIER_INFO.tinNo}
 </div>
 <div className="text-neutral-700 font-medium">
 <span className="font-bold text-neutral-900">Date of Registration:</span> {WEVENTURE_SUPPLIER_INFO.dateOfRegistration}
 </div>
 <div className="text-neutral-500 text-xs md:text-sm mt-2 font-medium">
 Email: info@weventurehub.com | Tel: +251 11 600 8899
 </div>
 </div>

 {/* Billed To Information & Space Info */}
 <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 text-sm md:text-base space-y-3">
 <div>
 <h4 className="font-black uppercase text-xs md:text-sm text-neutral-400 tracking-wider mb-1.5">
 Billed To:
 </h4>
 <div className="font-black text-lg md:text-xl text-neutral-900">
 {selectedInvoice.billingDetails?.name}
 </div>
 {selectedInvoice.billingDetails?.company && (
 <div className="font-bold text-indigo-700 mt-1 flex items-center gap-1.5 text-base">
 <Building2 className="w-4 h-4" />
 <span>{selectedInvoice.billingDetails.company}</span>
 </div>
 )}
 <div className="text-neutral-700 font-medium">{selectedInvoice.billingDetails?.email || selectedInvoice.userEmail}</div>
 {selectedInvoice.billingDetails?.phone && (
 <div className="text-neutral-700 font-medium">{selectedInvoice.billingDetails.phone}</div>
 )}
 {(selectedInvoice.billingDetails?.tinNumber || selectedInvoice.billingDetails?.taxId || selectedInvoice.customerTin) && (
 <div className="text-neutral-800 font-semibold text-xs md:text-sm mt-1">
 <span className="font-bold text-neutral-900">Customer TIN No:</span> {selectedInvoice.billingDetails?.tinNumber || selectedInvoice.billingDetails?.taxId || selectedInvoice.customerTin}
 </div>
 )}
 <div className="mt-2.5 inline-block px-3 py-1 bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg uppercase">
 Customer Type: {selectedInvoice.customerType || 'Individual'}
 </div>
 </div>

 <div className="pt-3 border-t border-neutral-200 space-y-1.5 text-sm md:text-base">
 <div className="flex justify-between">
 <span className="text-neutral-500 font-medium">Date Issued:</span>
 <span className="font-bold text-neutral-900">
 {selectedInvoice.createdAt
 ? new Date(selectedInvoice.createdAt).toLocaleDateString()
 : 'Today'}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-neutral-500 font-medium">Due Date:</span>
 <span className="font-bold text-rose-700">
 {selectedInvoice.dueDate
 ? new Date(selectedInvoice.dueDate).toLocaleDateString()
 : 'Immediate'}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-neutral-500 font-medium">Workspace Name:</span>
 <span className="font-bold text-neutral-900">
 {selectedInvoice.workspaceName || 'Executive Workspace'}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-neutral-500 font-medium">Billing Period:</span>
 <span className="font-semibold text-neutral-800">
 {selectedInvoice.billingPeriod || 'Current Reservation Cycle'}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-neutral-500 font-medium">Duration:</span>
 <span className="font-bold text-neutral-900">
 {selectedInvoice.durationQuantity || selectedInvoice.lineItems?.[0]?.quantity || 1} {selectedInvoice.durationType || selectedInvoice.lineItems?.[0]?.durationType || 'Hourly'}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Line Items Table */}
 <div>
 <table className="w-full text-left text-sm md:text-base border-collapse">
 <thead>
 <tr className="bg-neutral-900 text-white font-black uppercase text-xs md:text-sm tracking-wider">
 <th className="py-4 px-5 rounded-l-xl">Description</th>
 <th className="py-4 px-5 text-center">Duration / Plan</th>
 <th className="py-4 px-5 text-center">Qty</th>
 <th className="py-4 px-5 text-right">Unit Price</th>
 <th className="py-4 px-5 text-right rounded-r-xl">Total Amount</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-200">
 {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 ? (
 selectedInvoice.lineItems.map((item: any, i: number) => (
 <tr key={i} className="text-neutral-800 font-medium">
 <td className="py-4 px-5 font-bold text-neutral-900">{item.description}</td>
 <td className="py-4 px-5 text-center">{item.durationType || selectedInvoice.durationType || 'N/A'}</td>
 <td className="py-4 px-5 text-center font-bold text-base">{item.quantity}</td>
 <td className="py-4 px-5 text-right font-mono font-semibold">
 {item.unitPrice.toLocaleString()} {selectedInvoice.currency || 'ETB'}
 </td>
 <td className="py-4 px-5 text-right font-mono font-bold text-base text-neutral-900">
 {item.amount.toLocaleString()} {selectedInvoice.currency || 'ETB'}
 </td>
 </tr>
 ))
 ) : (
 <tr className="text-neutral-800 font-medium">
 <td className="py-4 px-5 font-bold text-neutral-900">
 Tenancy Workspace Rental Charge - {selectedInvoice.workspaceName || 'Executive Suite'}
 </td>
 <td className="py-4 px-5 text-center">{selectedInvoice.durationType || 'N/A'}</td>
 <td className="py-4 px-5 text-center font-bold text-base">
 {selectedInvoice.durationQuantity || 1}
 </td>
 <td className="py-4 px-5 text-right font-mono font-semibold">
 {(selectedInvoice.unitPrice || selectedInvoice.amount || 0).toLocaleString()}{' '}
 {selectedInvoice.currency || 'ETB'}
 </td>
 <td className="py-4 px-5 text-right font-mono font-bold text-base text-neutral-900">
 {(selectedInvoice.amount || 0).toLocaleString()}{' '}
 {selectedInvoice.currency || 'ETB'}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Totals & Grand Total Summary (Amount in Words & Payment Info BOTTOM LEFT) */}
 {(() => {
   const banks = getBankRecords(selectedInvoice.selectedBanks || selectedInvoice.selectedBank || selectedInvoice.bankName || selectedInvoice.bankDetails);
   const grandTot = selectedInvoice.grandTotal || selectedInvoice.amount || 0;
   const curr = selectedInvoice.currency || 'ETB';
   const amountInWordsText = numberToWords(grandTot, curr);

   return (
 <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t border-neutral-200 pt-6">
 {/* BOTTOM LEFT: AMOUNT IN WORDS & PAYMENT INFORMATION */}
 <div className="text-sm text-neutral-800 space-y-5 max-w-lg w-full">
 {/* AMOUNT IN WORDS */}
 <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1.5">
 <div className="font-extrabold uppercase text-xs text-neutral-500 tracking-wider">
 Amount in Words:
 </div>
 <div className="font-black text-base md:text-lg text-[#65A30D]">
 {amountInWordsText}
 </div>
 </div>

 {/* PAYMENT INFORMATION - MULTIPLE SETTLEMENT BANKS */}
 <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
 <div className="font-extrabold uppercase text-xs text-neutral-500 tracking-wider mb-1">
 SETTLEMENT BANK OPTIONS (TRANSFER ACCOUNT DETAILS)
 </div>
 <div className="space-y-3 divide-y divide-neutral-200">
 {banks.map((b, idx) => (
   <div key={b.bankName + idx} className={idx > 0 ? 'pt-3' : ''}>
     <div className="font-black text-sm md:text-base text-neutral-900 flex items-center justify-between">
       <span>Option {idx + 1}: {b.bankName}</span>
       <span className="text-xs text-neutral-500 font-semibold">{b.branch}</span>
     </div>
     <div className="grid grid-cols-3 gap-1 text-xs md:text-sm mt-1">
       <span className="text-neutral-500 font-medium">Account Name:</span>
       <span className="col-span-2 font-bold text-neutral-800">{b.accountName}</span>
       <span className="text-neutral-500 font-medium">Account No:</span>
       <span className="col-span-2 font-black font-mono text-neutral-900 text-sm md:text-base">{b.accountNumber}</span>
     </div>
   </div>
 ))}
 </div>
 </div>
 </div>

 {/* BOTTOM RIGHT: FINANCIAL BREAKDOWN */}
 <div className="w-full md:w-80 space-y-3 text-sm md:text-base">
 <div className="flex justify-between text-neutral-600 font-medium">
 <span>Subtotal Amount:</span>
 <span className="font-mono font-bold text-neutral-900">
 {(selectedInvoice.amount || 0).toLocaleString()} {curr}
 </span>
 </div>
 <div className="flex justify-between text-neutral-600 font-medium">
 <span>VAT (15% Tax):</span>
 <span className="font-mono font-bold text-neutral-900">
 {(selectedInvoice.vat || 0).toLocaleString()} {curr}
 </span>
 </div>
 {selectedInvoice.discount > 0 && (
 <div className="flex justify-between text-[#65A30D] font-bold">
 <span>Discount Applied:</span>
 <span className="font-mono">
 -{(selectedInvoice.discount || 0).toLocaleString()} {curr}
 </span>
 </div>
 )}
 <div className="border-t-2 border-neutral-900 pt-3 flex justify-between font-black text-xl md:text-2xl text-neutral-900">
 <span>Grand Total:</span>
 <span className="font-mono text-[#65A30D]">
 {grandTot.toLocaleString()} {curr}
 </span>
 </div>
 </div>
 </div>
   );
 })()}

 {/* Signature Footer */}
 <div className="border-t border-neutral-200 pt-8 flex justify-between items-end text-xs md:text-sm text-neutral-500 font-medium">
 <div>
 <div className="font-bold text-neutral-800 text-sm md:text-base">WeVentureHub Finance Department</div>
 <div>Thank you for choosing WeVentureHub Workspaces</div>
 </div>
 <div className="text-right font-mono font-bold text-neutral-900 border-t-2 border-neutral-800 pt-2 w-56 text-center">
 Authorized Stamp & Signature
 </div>
 </div>
 </div>

 {/* Modal Bottom Actions */}
 <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] no-print">
 {isAdmin && (
 <div className="flex items-center gap-2 text-xs">
 <span className="font-bold text-[#111827]">Change Status:</span>
 <select
 value={selectedInvoice.status}
 onChange={(e) => handleStatusChange(selectedInvoice.id, e.target.value)}
 className="bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-bold rounded-xl px-3 py-1.5 text-[#111827]"
 >
 <option value="Pending Payment">Pending Payment</option>
 <option value="Paid">Paid</option>
 <option value="Partially Paid">Partially Paid</option>
 <option value="Overdue">Overdue</option>
 <option value="Cancelled">Cancelled</option>
 <option value="Draft">Draft</option>
 </select>
 </div>
 )}

 <div className="flex items-center gap-2 ml-auto">
 {String(selectedInvoice.status || '').toLowerCase() !== 'paid' && (
 <Button
 size="sm"
 variant="primary"
 onClick={() => {
 setIsDetailModalOpen(false);
 handlePayInvoice(selectedInvoice);
 }}
 className="rounded-xl bg-[#84CC16] hover:bg-[#73B612] text-[#111827] font-bold text-xs flex items-center gap-1.5"
 >
 <CreditCard className="w-4 h-4" />
 <span>Proceed to Payment</span>
 </Button>
 )}

 <Button
 size="sm"
 variant="secondary"
 onClick={() => setIsDetailModalOpen(false)}
 className="rounded-xl font-bold text-xs"
 >
 Close
 </Button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ADMIN CREATE INVOICE MODAL */}
 {isCreateModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
 <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full my-8 p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
 <div className="flex items-center gap-2.5">
 <Receipt className="w-6 h-6 text-[#65A30D]" />
 <div>
 <h2 className="font-display font-extrabold text-xl text-[#111827]">
 Create Custom Invoice
 </h2>
 <p className="text-xs text-[#4B5563]">
 Set duration, customer details, line items, and pricing explicitly.
 </p>
 </div>
 </div>
 <button
 onClick={() => setIsCreateModalOpen(false)}
 className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-neutral-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleCreateInvoiceSubmit} className="space-y-5 text-xs md:text-sm">
 {/* Customer Details */}
 <div className="space-y-3">
 <h3 className="font-bold text-[#111827] uppercase text-[11px] tracking-wider text-slate-500">
 1. Customer / Billed To Information
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Customer Name *</label>
 <Input
 type="text"
 placeholder="e.g. Samuel Kebede"
 required
 value={newInvoiceData.userName}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, userName: e.target.value })}
 />
 </div>
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Email Address *</label>
 <Input
 type="email"
 placeholder="e.g. samuel@example.com"
 required
 value={newInvoiceData.userEmail}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, userEmail: e.target.value })}
 />
 </div>
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Phone Number</label>
 <Input
 type="text"
 placeholder="e.g. +251 91 123 4567"
 value={newInvoiceData.userPhone}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, userPhone: e.target.value })}
 />
 </div>
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Company / Organization</label>
 <Input
 type="text"
 placeholder="e.g. VentureTech PLC"
 value={newInvoiceData.companyName}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, companyName: e.target.value })}
 />
 </div>
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Customer TIN No.</label>
 <Input
 type="text"
 placeholder="e.g. 0012345678"
 value={newInvoiceData.customerTin}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, customerTin: e.target.value })}
 />
 </div>
 </div>
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Customer Type</label>
 <select
 value={newInvoiceData.customerType}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, customerType: e.target.value })}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#111827]"
 >
 <option value="Individual">Individual</option>
 <option value="Company">Company</option>
 <option value="VIP">VIP / Corporate Partner</option>
 </select>
 </div>
 </div>

 {/* Space & Service Information */}
 <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
 <h3 className="font-bold text-[#111827] uppercase text-[11px] tracking-wider text-slate-500">
 2. Workspace & Billing Period
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Workspace Name</label>
 <Input
 type="text"
 placeholder="e.g. Executive Dedicated Desk"
 value={newInvoiceData.workspaceName}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, workspaceName: e.target.value })}
 />
 </div>
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Billing Period</label>
 <Input
 type="text"
 placeholder="e.g. Aug 10 - Aug 20, 2026"
 value={newInvoiceData.billingPeriod}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, billingPeriod: e.target.value })}
 />
 </div>
 </div>
 </div>

 {/* Duration & Pricing Section */}
 <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
 <h3 className="font-bold text-[#111827] uppercase text-[11px] tracking-wider text-slate-500 flex items-center justify-between">
 <span>3. Duration & Custom Pricing (Admin Configuration)</span>
 <span className="text-[#65A30D] text-[10px] lowercase font-normal">*admin created duration</span>
 </h3>

 <div>
 <label className="block font-semibold text-[#111827] mb-1">Line Item Description</label>
 <Input
 type="text"
 placeholder="e.g. Dedicated Desk Workspace Rental"
 value={newInvoiceData.itemDescription}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, itemDescription: e.target.value })}
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Duration Type *</label>
 <select
 value={newInvoiceData.durationType}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, durationType: e.target.value })}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827]"
 >
 <option value="Hourly">Hourly</option>
 <option value="Daily">Daily</option>
 <option value="Weekly">Weekly</option>
 <option value="Monthly">Monthly</option>
 <option value="Annual">Annual</option>
 <option value="Custom">Custom Duration</option>
 </select>
 </div>

 {newInvoiceData.durationType === 'Custom' && (
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Custom Duration Text *</label>
 <Input
 type="text"
 placeholder="e.g. 3 Days / 10 Hours / Flex Cycle"
 required
 value={newInvoiceData.customDurationType}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, customDurationType: e.target.value })}
 />
 </div>
 )}

 <div>
 <label className="block font-semibold text-[#111827] mb-1">Duration Quantity *</label>
 <Input
 type="number"
 min="1"
 required
 value={newInvoiceData.durationQuantity}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, durationQuantity: Number(e.target.value) })}
 />
 </div>

 <div>
 <label className="block font-semibold text-[#111827] mb-1">Unit Price (ETB) *</label>
 <Input
 type="number"
 min="0"
 required
 value={newInvoiceData.unitPrice}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, unitPrice: Number(e.target.value) })}
 />
 </div>
 </div>

 {/* Price summary badge */}
 <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between font-mono">
 <div>
 <span className="text-xs text-neutral-500 font-sans block">Subtotal (Qty x Unit Price):</span>
 <span className="font-bold text-[#111827]">
 {(Number(newInvoiceData.durationQuantity || 1) * Number(newInvoiceData.unitPrice || 0)).toLocaleString()} ETB
 </span>
 </div>
 <div className="text-right">
 <span className="text-xs text-neutral-500 font-sans block">Estimated VAT (15%):</span>
 <span className="font-bold text-[#65A30D]">
 {Math.round(Number(newInvoiceData.durationQuantity || 1) * Number(newInvoiceData.unitPrice || 0) * 0.15).toLocaleString()} ETB
 </span>
 </div>
 </div>
 </div>

 {/* Due Date, Discount, Status */}
 <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
 <h3 className="font-bold text-[#111827] uppercase text-[11px] tracking-wider text-slate-500">
 4. Invoice Status & Financials
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Due Date</label>
 <Input
 type="date"
 value={newInvoiceData.dueDate}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value })}
 />
 </div>
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Discount (ETB)</label>
 <Input
 type="number"
 min="0"
 value={newInvoiceData.discount}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, discount: Number(e.target.value) })}
 />
 </div>
 <div>
 <label className="block font-semibold text-[#111827] mb-1">Initial Status</label>
 <select
 value={newInvoiceData.status}
 onChange={(e) => setNewInvoiceData({ ...newInvoiceData, status: e.target.value })}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#111827]"
 >
 <option value="Pending Payment">Pending Payment</option>
 <option value="Paid">Paid</option>
 <option value="Draft">Draft</option>
 <option value="Partially Paid">Partially Paid</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
 <Button
 type="button"
 variant="secondary"
 onClick={() => setIsCreateModalOpen(false)}
 className="rounded-xl font-bold text-xs"
 >
 Cancel
 </Button>
 <Button
 type="submit"
 disabled={createInvoiceMutation.isPending}
 className="bg-[#84CC16] hover:bg-lime-600 text-white rounded-xl font-bold text-xs flex items-center gap-2"
 >
 {createInvoiceMutation.isPending ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Receipt className="w-4 h-4" />
 )}
 <span>Issue Custom Invoice</span>
 </Button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
