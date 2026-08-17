import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import WeVentureLogo from '../components/WeVentureLogo';
import { getBankRecord, getBankRecords, numberToWords, WEVENTURE_SUPPLIER_INFO, WEVENTURE_BANKS } from '../utils/invoiceUtils';
import { motion, AnimatePresence } from 'motion/react';
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
 Trash2,
 Check,
 Building,
 Tag,
 Hash,
 Mail,
 Phone,
 HelpCircle,
 Pencil,
 Edit2,
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

 // Invoice & Payment Action Modals
 const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
 const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
 const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
 const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

 // Enhanced Create Invoice States
 const [invoiceLineItems, setInvoiceLineItems] = useState<Array<{
   description: string;
   quantity: number;
   unitPrice: number;
 }>>([
   { description: 'Executive Coworking Suite - Workspace Rental', quantity: 1, unitPrice: 5000 }
 ]);
 const [invoiceExtraCharges, setInvoiceExtraCharges] = useState(0);
 const [invoiceSelectedBank, setInvoiceSelectedBank] = useState('Dashen Bank');
 const [invoiceSelectedBanks, setInvoiceSelectedBanks] = useState<string[]>(['Dashen Bank', 'Commercial Bank of Ethiopia']);
 const [invoiceBankDetails, setInvoiceBankDetails] = useState('');
 const [invoiceOriginalPrice, setInvoiceOriginalPrice] = useState(0);
 const [invoiceAdjustedPrice, setInvoiceAdjustedPrice] = useState(0);
 const [invoiceAdjustmentReason, setInvoiceAdjustmentReason] = useState('');

 const [invoiceForm, setInvoiceForm] = useState({
   userName: '',
   userEmail: '',
   userPhone: '',
   companyName: '',
   customerType: 'Individual',
   workspaceName: 'Executive Coworking Suite',
   durationType: 'Monthly',
   durationQuantity: 1,
   unitPrice: 5000,
   currency: 'USD',
   taxEnabled: true,
   discount: 0,
   status: 'Pending Payment',
   dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
   notes: 'Payment is due within 14 days of invoice issuance.',
   customerTin: '',
   invoiceDate: new Date().toISOString().split('T')[0],
   billingPeriod: 'Monthly Plan'
 });

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

 const defaultWorkspacePresets = [
  'Executive Coworking Suite',
  'Dedicated Desk',
  'Hot Desk (Flex Space)',
  'High-Tech Meeting Room',
  'Conference Boardroom',
  'Training & Workshop Hall',
  'Main Event & Pitch Arena',
  'Private Team Office',
  'Podcasting & Media Studio',
 ];

 const availableWorkspaceNames = useMemo(() => {
  const names = new Set<string>(defaultWorkspacePresets);
  if (workspaces && workspaces.length > 0) {
   workspaces.forEach((w: any) => {
    if (w.name) names.add(w.name);
    if (w.title) names.add(w.title);
   });
  }
  return Array.from(names);
 }, [workspaces]);

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
      throw new Error(`Failed to fetch invoice PDF (Status: ${response.status})`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Invoice_${invoiceNumber || id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (e) {
    console.error('Download invoice PDF failed:', e);
    const token = localStorage.getItem('weventure_jwt_token') || '';
    const tenantId = localStorage.getItem('weventure_tenant_id') || 'weventurehub';
    window.open(`/api/v1/payments/invoices/${id}/download?token=${encodeURIComponent(token)}&tenantId=${encodeURIComponent(tenantId)}`, '_blank');
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

 const handleOpenCreateInvoice = () => {
  setEditingInvoice(null);
  setInvoiceForm({
   userName: '',
   userEmail: '',
   userPhone: '',
   companyName: '',
   customerType: 'Individual',
   workspaceName: 'Executive Coworking Suite',
   durationType: 'Monthly',
   durationQuantity: 1,
   unitPrice: 5000,
   currency: 'ETB',
   taxEnabled: true,
   discount: 0,
   status: 'Pending Payment',
   dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
   notes: 'Payment is due within 14 days of invoice issuance.',
   customerTin: '',
   invoiceDate: new Date().toISOString().split('T')[0],
   billingPeriod: 'Monthly Plan'
  });
  setInvoiceLineItems([
   { description: 'Executive Coworking Suite - Workspace Rental', quantity: 1, unitPrice: 5000 }
  ]);
  setInvoiceExtraCharges(0);
  setInvoiceOriginalPrice(0);
  setInvoiceAdjustedPrice(0);
  setInvoiceAdjustmentReason('');
  setInvoiceSelectedBank('Dashen Bank');
  setInvoiceSelectedBanks(['Dashen Bank', 'Commercial Bank of Ethiopia']);
  setInvoiceBankDetails('Commercial Bank of Ethiopia - Account: 1000123456789');
  setIsCreateInvoiceOpen(true);
 };

 const handleOpenEditInvoice = (invoice: any) => {
  setEditingInvoice(invoice);

  if (invoice.lineItems && Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0) {
   setInvoiceLineItems(
    invoice.lineItems.map((item: any) => ({
     description: item.description || '',
     quantity: Number(item.quantity) || 1,
     unitPrice: Number(item.unitPrice) || 0,
    }))
   );
  } else {
   setInvoiceLineItems([
    {
     description: invoice.workspaceName || invoice.itemDescription || 'Executive Coworking Suite - Workspace Rental',
     quantity: Number(invoice.durationQuantity) || 1,
     unitPrice: Number(invoice.unitPrice) || Number(invoice.amount) || 5000,
    }
   ]);
  }

  setInvoiceExtraCharges(Number(invoice.extraCharges) || 0);
  setInvoiceSelectedBank(invoice.selectedBank || invoice.bankName || 'Dashen Bank');
  setInvoiceSelectedBanks(
   invoice.selectedBanks && Array.isArray(invoice.selectedBanks) && invoice.selectedBanks.length > 0
    ? invoice.selectedBanks
    : (invoice.selectedBank ? [invoice.selectedBank] : ['Dashen Bank', 'Commercial Bank of Ethiopia'])
  );
  setInvoiceBankDetails(invoice.bankDetails || '');
  setInvoiceOriginalPrice(Number(invoice.originalPrice) || 0);
  setInvoiceAdjustedPrice(Number(invoice.adjustedPrice) || 0);
  setInvoiceAdjustmentReason(invoice.adjustmentReason || '');

  const vatVal = Number(invoice.vat);
  const hasTax = !isNaN(vatVal) ? vatVal > 0 : true;

  setInvoiceForm({
   userName: invoice.billingDetails?.name || invoice.userName || '',
   userEmail: invoice.billingDetails?.email || invoice.userEmail || '',
   userPhone: invoice.billingDetails?.phone || invoice.userPhone || '',
   companyName: invoice.billingDetails?.company || invoice.companyName || '',
   customerType: invoice.customerType || (invoice.billingDetails?.company ? 'Company' : 'Individual'),
   workspaceName: invoice.workspaceName || 'Executive Coworking Suite',
   durationType: invoice.durationType || 'Monthly',
   durationQuantity: Number(invoice.durationQuantity) || 1,
   unitPrice: Number(invoice.unitPrice) || 5000,
   currency: invoice.currency || 'ETB',
   taxEnabled: hasTax,
   discount: Number(invoice.discount) || 0,
   status: invoice.status || 'Pending Payment',
   dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
   notes: invoice.notes || 'Payment is due within 14 days of invoice issuance.',
   customerTin: invoice.billingDetails?.tinNumber || invoice.billingDetails?.taxId || invoice.customerTin || '',
   invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : (invoice.createdAt ? new Date(invoice.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
   billingPeriod: invoice.billingPeriod || invoice.durationType || 'Monthly Plan'
  });

  setIsCreateInvoiceOpen(true);
 };

 const handleInvoiceSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmittingInvoice(true);
  try {
   const subtotal = invoiceLineItems.reduce((acc, item) => acc + (Number(item.unitPrice) * Number(item.quantity)), 0);
   const vat = invoiceForm.taxEnabled ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
   const discount = Number(invoiceForm.discount || 0);
   const extraCharges = Number(invoiceExtraCharges || 0);
   const grandTotal = subtotal + vat + extraCharges - discount;

   const selectedBankRecords = getBankRecords(invoiceSelectedBanks);
   const primaryBank = selectedBankRecords[0] || getBankRecord(invoiceSelectedBank);

   const payload = {
    userName: invoiceForm.userName || 'Customer',
    userEmail: invoiceForm.userEmail,
    userPhone: invoiceForm.userPhone,
    companyName: invoiceForm.companyName,
    customerType: invoiceForm.customerType,
    workspaceName: invoiceForm.workspaceName?.trim() || 'Executive Coworking Suite',
    durationType: invoiceForm.durationType,
    durationQuantity: invoiceLineItems.reduce((acc, item) => acc + Number(item.quantity), 0),
    unitPrice: invoiceLineItems[0]?.unitPrice || 0,
    currency: invoiceForm.currency || 'ETB',
    amount: subtotal,
    vat,
    discount,
    extraCharges,
    grandTotal,
    status: invoiceForm.status,
    dueDate: invoiceForm.dueDate,
    customerTin: invoiceForm.customerTin,
    invoiceDate: invoiceForm.invoiceDate,
    billingPeriod: invoiceForm.billingPeriod,
    notes: invoiceForm.notes,
    billingDetails: {
     name: invoiceForm.userName,
     email: invoiceForm.userEmail,
     phone: invoiceForm.userPhone,
     company: invoiceForm.companyName,
     tinNumber: invoiceForm.customerTin,
     taxId: invoiceForm.customerTin
    },
    lineItems: invoiceLineItems.map(item => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.quantity) * Number(item.unitPrice)
    })),
    selectedBank: primaryBank.bankName,
    selectedBanks: invoiceSelectedBanks,
    bankName: primaryBank.bankName,
    accountName: primaryBank.accountName,
    accountNumber: primaryBank.accountNumber,
    branch: primaryBank.branch,
    bankDetails: `${primaryBank.bankName} - Account: ${primaryBank.accountNumber}`,
    originalPrice: invoiceOriginalPrice > 0 ? Number(invoiceOriginalPrice) : undefined,
    adjustedPrice: invoiceAdjustedPrice > 0 ? Number(invoiceAdjustedPrice) : undefined,
    adjustmentReason: invoiceAdjustmentReason || undefined
   };

   if (editingInvoice) {
     const invId = editingInvoice.id || editingInvoice._id;
     const updated = await paymentApi.updateInvoice(invId, payload);
     setIsCreateInvoiceOpen(false);
     setEditingInvoice(null);
     await queryClient.invalidateQueries({ queryKey: ['invoices'] });
     await queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
     refetchInvoices();
     if (isAdmin) refetchStats();
     if (selectedInvoice && (selectedInvoice.id === invId || selectedInvoice._id === invId)) {
       setSelectedInvoice(updated);
     }
     alert('Invoice updated successfully!');
   } else {
     await paymentApi.createInvoice(payload);
     setIsCreateInvoiceOpen(false);
     await queryClient.invalidateQueries({ queryKey: ['invoices'] });
     await queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
     refetchInvoices();
     if (isAdmin) refetchStats();
     alert('Invoice generated successfully!');
   }
  } catch (err: any) {
   alert(err?.response?.data?.message || err?.message || 'Failed to save invoice.');
  } finally {
   setIsSubmittingInvoice(false);
  }
 };

 const handleDeleteInvoice = async (invoice: any) => {
   const invId = invoice.id || invoice._id;
   const invNumber = invoice.invoiceNumber || invId;
   if (!window.confirm(`Are you sure you want to delete invoice "${invNumber}"? This action will permanently remove it from the system.`)) {
     return;
   }
   setIsDeletingId(invId);
   try {
     await paymentApi.deleteInvoice(invId);
     await queryClient.invalidateQueries({ queryKey: ['invoices'] });
     await queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
     refetchInvoices();
     if (isAdmin) refetchStats();
     if (selectedInvoice && (selectedInvoice.id === invId || selectedInvoice._id === invId)) {
       setIsDetailModalOpen(false);
       setSelectedInvoice(null);
     }
     alert(`Invoice "${invNumber}" deleted successfully.`);
   } catch (err: any) {
     alert(err?.response?.data?.message || err?.message || 'Failed to delete invoice.');
   } finally {
     setIsDeletingId(null);
   }
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
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-extrabold uppercase rounded-full bg-emerald-100 text-[#4D7C0F] border border-emerald-300 /40 ">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Paid</span>
 </span>
 );
 }
 if (s === 'partially paid') {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-extrabold uppercase rounded-full bg-blue-100 text-blue-800 border border-blue-300 /40 ">
 <Clock className="w-3.5 h-3.5" />
 <span>Partially Paid</span>
 </span>
 );
 }
 if (s === 'overdue') {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-extrabold uppercase rounded-full bg-rose-100 text-rose-800 border border-rose-300 /40 animate-pulse">
 <AlertCircle className="w-3.5 h-3.5" />
 <span>Overdue</span>
 </span>
 );
 }
 if (s === 'cancelled' || s === 'void' || s === 'refunded') {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-extrabold uppercase rounded-full bg-neutral-200 text-neutral-700 border border-neutral-300 ">
 <XCircle className="w-3.5 h-3.5" />
 <span>Cancelled</span>
 </span>
 );
 }
 if (s === 'draft') {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-extrabold uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-300 /40 ">
 <Receipt className="w-3.5 h-3.5" />
 <span>Draft</span>
 </span>
 );
 }
 // Default Pending Payment / Unpaid
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200 /30 ">
 <Clock className="w-3.5 h-3.5" />
 <span>Pending Payment</span>
 </span>
 );
 };

 const COLORS = ['#84CC16', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

 return (
 <div className="space-y-6 pb-12 text-[12px]">
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
 <p className="text-[12px] text-[#4B5563] mt-1">
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
 className={`px-3 py-1.5 text-[12px] font-bold rounded-xl transition-all flex items-center gap-1.5 ${
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
 className={`px-3 py-1.5 text-[12px] font-bold rounded-xl transition-all flex items-center gap-1.5 ${
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
 className="bg-[#84CC16] hover:bg-[#65A30D] text-[#111827] font-bold rounded-xl text-[12px] flex items-center gap-1.5 shadow-md shadow-lime-500/10"
 onClick={handleOpenCreateInvoice}
 >
 <Plus className="w-4 h-4" />
 <span>Create Invoice</span>
 </Button>

 <Button
 size="sm"
 variant="secondary"
 onClick={handleExportCSV}
 className="rounded-xl font-bold text-[12px] flex items-center gap-1.5"
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
 className="rounded-xl font-bold text-[12px] flex items-center gap-1.5"
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
 <span className="text-[12px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Total Invoices
 </span>
 <FileText className="w-4 h-4 text-[#65A30D]" />
 </div>
 <div className="font-display font-extrabold text-2xl text-[#111827]">
 {stats.totalInvoices || 0}
 </div>
 <div className="text-[12px] text-[#65A30D] font-bold">Workspace Ledger</div>
 </div>

 {/* Total Revenue */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[12px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Total Revenue
 </span>
 <DollarSign className="w-4 h-4 text-[#84CC16]" />
 </div>
 <div className="font-display font-extrabold text-xl text-[#111827] truncate">
 {(stats.totalRevenue || 0).toLocaleString()} <span className="text-[12px] font-normal">ETB</span>
 </div>
 <div className="text-[12px] text-[#65A30D] font-bold">Paid Settlements</div>
 </div>

 {/* Paid Invoices */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[12px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Paid Invoices
 </span>
 <CheckCircle2 className="w-4 h-4 text-[#65A30D]" />
 </div>
 <div className="font-display font-extrabold text-2xl text-[#65A30D] ">
 {stats.paidInvoices || 0}
 </div>
 <div className="text-[12px] text-neutral-500 font-medium">
 {stats.totalInvoices
 ? `${Math.round(((stats.paidInvoices || 0) / stats.totalInvoices) * 100)}% Settled`
 : '0% Settled'}
 </div>
 </div>

 {/* Pending Invoices */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[12px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Pending Invoices
 </span>
 <Clock className="w-4 h-4 text-amber-500" />
 </div>
 <div className="font-display font-extrabold text-2xl text-amber-600 ">
 {stats.pendingInvoices || 0}
 </div>
 <div className="text-[12px] text-amber-700 font-medium">
 Awaiting Checkout
 </div>
 </div>

 {/* Unpaid Invoices */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[12px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Unpaid Total
 </span>
 <Receipt className="w-4 h-4 text-blue-500" />
 </div>
 <div className="font-display font-extrabold text-2xl text-blue-600 ">
 {stats.unpaidInvoices || 0}
 </div>
 <div className="text-[12px] text-blue-600 font-medium">Open Balance</div>
 </div>

 {/* Overdue Invoices */}
 <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2 shadow-xs">
 <div className="flex items-center justify-between text-neutral-400">
 <span className="text-[12px] font-bold uppercase tracking-wider text-[#4B5563] ">
 Overdue
 </span>
 <AlertCircle className="w-4 h-4 text-rose-500" />
 </div>
 <div className="font-display font-extrabold text-2xl text-rose-600 ">
 {stats.overdueInvoices || 0}
 </div>
 <div className="text-[12px] text-rose-600 font-bold">Past Due Grace</div>
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
 <h3 className="font-display font-bold text-[12px] text-[#111827]">
 Monthly Revenue Trend
 </h3>
 </div>
 <span className="text-[12px] text-[#4B5563] font-mono">
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
 <div className="h-48 flex items-center justify-center text-[12px] text-neutral-400">
 No monthly revenue trend recorded yet.
 </div>
 )}
 </div>

 {/* Revenue by Workspace Breakdown */}
 <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-4 shadow-xs">
 <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
 <div className="flex items-center gap-2">
 <PieChartIcon className="w-5 h-5 text-[#65A30D]" />
 <h3 className="font-display font-bold text-[12px] text-[#111827]">
 Revenue by Workspace
 </h3>
 </div>
 <span className="text-[12px] text-[#4B5563] font-mono">
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
 className="flex items-center justify-between p-3 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] text-[12px]"
 >
 <div className="flex items-center gap-2.5">
 <div
 className="w-3 h-3 rounded-full"
 style={{ backgroundColor: COLORS[idx % COLORS.length] }}
 />
 <div>
 <div className="font-bold text-[#111827]">{ws.name}</div>
 <div className="text-[12px] text-[#4B5563] ">
 {ws.count} paid invoice(s)
 </div>
 </div>
 </div>
 <div className="text-right">
 <div className="font-black text-[12px] text-[#111827]">
 {ws.revenue.toLocaleString()} ETB
 </div>
 <div className="text-[12px] font-bold text-[#65A30D]">{percent}% of Total</div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="h-48 flex items-center justify-center text-[12px] text-neutral-400">
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
 className="pl-10 text-[12px] rounded-2xl border-[#E5E7EB] "
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
 className="bg-[#F9FAFB] border border-[#E5E7EB] text-[12px] font-semibold rounded-2xl px-3 py-2 text-[#111827]"
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
 <label className="block text-[12px] font-extrabold uppercase text-[#4B5563] mb-1">
 Invoice Status
 </label>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[12px] font-medium rounded-xl px-2.5 py-1.5 text-[#111827]"
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
 <label className="block text-[12px] font-extrabold uppercase text-[#4B5563] mb-1">
 Customer Type
 </label>
 <select
 value={customerTypeFilter}
 onChange={(e) => setCustomerTypeFilter(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[12px] font-medium rounded-xl px-2.5 py-1.5 text-[#111827]"
 >
 <option value="All">All Types</option>
 <option value="Individual">Individual Customer</option>
 <option value="Company">Company / Org</option>
 </select>
 </div>

 {/* Workspace Filter */}
 {isAdmin && (
 <div>
 <label className="block text-[12px] font-extrabold uppercase text-[#4B5563] mb-1">
 Workspace
 </label>
 <select
 value={workspaceFilter}
 onChange={(e) => setWorkspaceFilter(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[12px] font-medium rounded-xl px-2.5 py-1.5 text-[#111827] truncate"
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
 <label className="block text-[12px] font-extrabold uppercase text-[#4B5563] mb-1">
 Start Date
 </label>
 <input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[12px] font-medium rounded-xl px-2 py-1 text-[#111827]"
 />
 </div>

 {/* Date Range End */}
 <div>
 <label className="block text-[12px] font-extrabold uppercase text-[#4B5563] mb-1">
 End Date
 </label>
 <input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[12px] font-medium rounded-xl px-2 py-1 text-[#111827]"
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
 className="text-[12px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
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
 <span className="text-[12px] text-[#4B5563] font-mono">
 Loading Workspace Invoice Management ledger...
 </span>
 </div>
 ) : isError || invoices.length === 0 ? (
 <div className="text-center py-20 bg-white border border-[#E5E7EB] rounded-3xl space-y-4">
 <Receipt className="w-12 h-12 text-[#9CA3AF] mx-auto" />
 <h3 className="font-display font-bold text-[12px] text-[#111827]">
 No invoices match your filter
 </h3>
 <p className="text-[12px] text-[#4B5563] max-w-sm mx-auto">
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
 <div className="flex items-center gap-2 font-mono font-extrabold text-[12px] text-[#111827]">
 <FileText className="w-4 h-4 text-[#65A30D]" />
 <span>{invoice.invoiceNumber}</span>
 </div>
 <div className="text-[12px] text-neutral-400 font-mono mt-0.5">
 Booking: {invoice.bookingId || 'N/A'}
 </div>
 </div>
 <div>{getStatusBadge(invoice.status)}</div>
 </div>

 <div className="space-y-2 text-[12px] border-y border-[#E5E7EB] py-3">
 <div className="flex justify-between items-center">
 <span className="text-neutral-400">Customer Type:</span>
 <span className="inline-flex items-center gap-1 font-bold text-[12px] text-[#111827]">
 {isCompany ? (
 <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 /40 font-extrabold text-[12px] flex items-center gap-1">
 <Building2 className="w-3 h-3" />
 <span>Company ({invoice.billingDetails?.company || 'Corporate'})</span>
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-[12px] flex items-center gap-1">
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
 <div className="text-[12px] uppercase text-neutral-400 font-extrabold">Grand Total</div>
 <div className="text-[12px] font-extrabold text-[#111827]">
 {(invoice.grandTotal || invoice.amount || 0).toLocaleString()} <span className="text-[12px] font-normal text-neutral-400">{invoice.currency || 'ETB'}</span>
 </div>
 </div>

 <div className="flex items-center gap-1.5">
 {!isPaid && (
 <Button
 size="sm"
 variant="primary"
 onClick={() => handlePayInvoice(invoice)}
 className="rounded-xl bg-[#84CC16] hover:bg-[#73B612] text-[#111827] font-bold text-[12px] flex items-center gap-1"
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
 className="rounded-xl flex items-center gap-1 text-[12px] font-bold"
 >
 <Eye className="w-3.5 h-3.5" />
 <span>View</span>
 </Button>

 {isAdmin && (
 <>
 <button
 onClick={() => handleOpenEditInvoice(invoice)}
 title="Edit Invoice"
 className="p-1.5 rounded-xl border border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-50 transition-all"
 >
 <Pencil className="w-3.5 h-3.5" />
 </button>

 <button
 onClick={() => handleDeleteInvoice(invoice)}
 disabled={isDeletingId === (invoice.id || invoice._id)}
 title="Delete Invoice"
 className="p-1.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 transition-all disabled:opacity-50"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* Desktop View: Full Workspace Invoice Management Table */}
 <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-[12px] border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] font-extrabold uppercase tracking-wider text-[12px] select-none">
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
 <div className="font-mono font-extrabold text-[12px] text-[#111827] flex items-center gap-2">
 <FileText className="w-4 h-4 text-[#65A30D]" />
 <span>{invoice.invoiceNumber}</span>
 </div>
 <div className="text-[12px] font-mono text-neutral-400 mt-0.5 flex items-center gap-1">
 <Hash className="w-3 h-3 text-neutral-400" />
 <span>Booking ID: {invoice.bookingId || 'N/A'}</span>
 </div>
 </td>

 {/* Customer Type & Details */}
 <td className="py-4 px-5">
 <div className="flex items-center gap-1.5 mb-1">
 {isCompany ? (
 <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 /40 font-black text-[12px] uppercase border border-indigo-200 flex items-center gap-1">
 <Building2 className="w-3 h-3" />
 <span>{invoice.billingDetails?.company || 'Company'}</span>
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-[12px] uppercase border border-gray-200 flex items-center gap-1">
 <User className="w-3 h-3" />
 <span>Individual</span>
 </span>
 )}
 </div>
 <div className="font-semibold text-[#111827]">
 {invoice.billingDetails?.name}
 </div>
 <div className="text-[12px] text-neutral-500 font-mono">
 {invoice.billingDetails?.email || invoice.userEmail}
 </div>
 {(invoice.billingDetails?.tinNumber || invoice.billingDetails?.taxId || invoice.customerTin) && (
 <div className="text-[12px] text-[#65A30D] font-extrabold mt-1">
 TIN No: {invoice.billingDetails?.tinNumber || invoice.billingDetails?.taxId || invoice.customerTin}
 </div>
 )}
 </td>

 {/* Workspace & Duration */}
 <td className="py-4 px-5">
 <div className="font-bold text-[#111827]">
 {invoice.workspaceName || 'Executive Workspace'}
 </div>
 <div className="text-[12px] text-neutral-500 font-medium mt-0.5">
 {invoice.durationQuantity || invoice.lineItems?.[0]?.quantity || 1} x {invoice.durationType || invoice.lineItems?.[0]?.durationType || 'Hourly'} @{' '}
 {(invoice.unitPrice || invoice.lineItems?.[0]?.unitPrice || invoice.amount || 0).toLocaleString()}{' '}
 {invoice.currency || 'ETB'}
 </div>
 </td>

 {/* Financial Breakdown */}
 <td className="py-4 px-5">
 <div className="font-black text-[12px] text-[#111827]">
 {(invoice.grandTotal || invoice.amount || 0).toLocaleString()}{' '}
 <span className="text-[12px] font-normal text-neutral-400">
 {invoice.currency || 'ETB'}
 </span>
 </div>
 <div className="text-[12px] text-neutral-500 font-mono">
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
 className="bg-[#F9FAFB] border border-[#E5E7EB] text-[12px] font-extrabold rounded-xl px-2.5 py-1 text-[#111827] cursor-pointer hover:border-[#84CC16] transition-all"
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
 className="rounded-xl bg-[#84CC16] hover:bg-[#73B612] text-[#111827] font-bold text-[12px] flex items-center gap-1 py-1"
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
 className="rounded-xl flex items-center gap-1 text-[12px] font-bold py-1"
 >
 <Eye className="w-3.5 h-3.5" />
 <span>Details</span>
 </Button>

 {isAdmin && (
 <button
 onClick={() => handleOpenEditInvoice(invoice)}
 title="Edit Invoice"
 className="p-1.5 rounded-xl border border-[#E5E7EB] text-blue-600 hover:bg-blue-50 transition-all"
 >
 <Pencil className="w-4 h-4" />
 </button>
 )}

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

 {isAdmin && (
 <button
 onClick={() => handleDeleteInvoice(invoice)}
 disabled={isDeletingId === (invoice.id || invoice._id)}
 title="Delete Invoice"
 className="p-1.5 rounded-xl border border-[#E5E7EB] text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
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
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
 <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 md:p-8">
 {/* Modal Header Controls */}
 <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4 no-print">
 <div className="flex items-center gap-2">
 <Receipt className="w-6 h-6 text-[#65A30D]" />
 <h2 className="font-display font-bold text-[12px] text-[#111827]">
 Invoice Details & Printable Document
 </h2>
 </div>
 <div className="flex items-center gap-2">
 {isAdmin && (
 <>
 <Button
 size="sm"
 variant="secondary"
 onClick={() => {
 setIsDetailModalOpen(false);
 handleOpenEditInvoice(selectedInvoice);
 }}
 className="rounded-xl flex items-center gap-1.5 font-bold text-[12px] text-blue-700 border-blue-200 hover:bg-blue-50"
 >
 <Pencil className="w-4 h-4 text-blue-600" />
 <span>Edit</span>
 </Button>
 <Button
 size="sm"
 variant="secondary"
 onClick={() => handleDeleteInvoice(selectedInvoice)}
 disabled={isDeletingId === (selectedInvoice.id || selectedInvoice._id)}
 className="rounded-xl flex items-center gap-1.5 font-bold text-[12px] text-rose-700 border-rose-200 hover:bg-rose-50 disabled:opacity-50"
 >
 <Trash2 className="w-4 h-4 text-rose-600" />
 <span>Delete</span>
 </Button>
 </>
 )}
 <Button
 size="sm"
 variant="secondary"
 onClick={() => window.print()}
 className="rounded-xl flex items-center gap-1.5 font-bold text-[12px]"
 >
 <Printer className="w-4 h-4 text-[#65A30D]" />
 <span>Print</span>
 </Button>
 <Button
 size="sm"
 onClick={() => handleDownloadPdf(selectedInvoice.id || selectedInvoice._id, selectedInvoice.invoiceNumber)}
 className="rounded-xl flex items-center gap-1.5 font-bold text-[12px] bg-[#65A30D] text-white hover:bg-[#4d7c0a]"
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
 <span className="text-xs md:text-sm font-extrabold text-[#84CC16] tracking-widest uppercase block mt-1">
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
 <div className="text-xs md:text-sm text-neutral-300 font-mono font-semibold">
 Booking ID: <span className="text-white font-bold">{selectedInvoice.bookingId || 'N/A'}</span>
 </div>
 <div>{getStatusBadge(selectedInvoice.status)}</div>
 </div>
 </div>

 {/* SUPPLIER & BILLED TO GRID BELOW LEMON LINE */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
 {/* Supplier Information */}
 <div className="space-y-2 text-sm">
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
 <div className="text-neutral-500 text-xs mt-2 font-medium">
 Email: info@weventurehub.com | Tel: 0911243503
 </div>
 </div>

 {/* Billed To Information & Space Info */}
 <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 text-sm space-y-3">
 <div>
 <h4 className="font-black uppercase text-xs md:text-sm text-neutral-400 tracking-wider mb-1.5">
 Billed To:
 </h4>
 <div className="font-black text-lg md:text-xl text-neutral-900">
 {selectedInvoice.billingDetails?.name}
 </div>
 {selectedInvoice.billingDetails?.company && (
 <div className="font-bold text-indigo-700 mt-1 flex items-center gap-1.5 text-xs md:text-sm">
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

 <div className="pt-3 border-t border-neutral-200 space-y-1.5 text-xs md:text-sm">
 <div className="flex justify-between">
 <span className="text-neutral-500 font-medium">Date Issued:</span>
 <span className="font-bold text-neutral-900">
 {selectedInvoice.invoiceDate
 ? new Date(selectedInvoice.invoiceDate).toLocaleDateString()
 : (selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString() : 'Today')}
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
 <span className="text-neutral-500 font-medium">Duration / Plan:</span>
 <span className="font-semibold text-neutral-800">
 {selectedInvoice.billingPeriod || selectedInvoice.durationType || 'Monthly Plan'}
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
 <table className="w-full text-left text-sm border-collapse">
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
 <td className="py-4 px-5 text-center font-bold text-sm">{item.quantity}</td>
 <td className="py-4 px-5 text-right font-mono font-semibold">
 {item.unitPrice.toLocaleString()} {selectedInvoice.currency || 'ETB'}
 </td>
 <td className="py-4 px-5 text-right font-mono font-bold text-sm text-neutral-900">
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
 <td className="py-4 px-5 text-center font-bold text-sm">
 {selectedInvoice.durationQuantity || 1}
 </td>
 <td className="py-4 px-5 text-right font-mono font-semibold">
 {(selectedInvoice.unitPrice || selectedInvoice.amount || 0).toLocaleString()}{' '}
 {selectedInvoice.currency || 'ETB'}
 </td>
 <td className="py-4 px-5 text-right font-mono font-bold text-sm text-neutral-900">
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
 <div className="font-black text-sm md:text-base text-[#65A30D]">
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
   <div key={b.bankName + idx} className={idx > 0 ? 'pt-3 border-t border-neutral-100' : ''}>
     <div className="font-black text-sm text-neutral-900 flex flex-wrap items-center justify-between gap-1">
       <span className="break-words">Option {idx + 1}: {b.bankName}</span>
       <span className="text-xs text-neutral-500 font-semibold break-words">{b.branch}</span>
     </div>
     <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mt-1">
       <span className="text-neutral-500 font-medium break-words">Account Name:</span>
       <span className="col-span-2 font-bold text-neutral-800 break-words">{b.accountName}</span>
       <span className="text-neutral-500 font-medium break-words">Account No:</span>
       <span className="col-span-2 font-black font-mono text-neutral-900 text-xs break-all">{b.accountNumber}</span>
     </div>
   </div>
 ))}
 </div>
 </div>
 </div>

 {/* BOTTOM RIGHT: FINANCIAL BREAKDOWN */}
 <div className="w-full md:w-80 space-y-3 text-sm">
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
 <div className="font-bold text-neutral-800 text-xs md:text-sm">WeVentureHub Finance Department</div>
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
 <div className="flex items-center gap-2 text-[12px]">
 <span className="font-bold text-[#111827]">Change Status:</span>
 <select
 value={selectedInvoice.status}
 onChange={(e) => handleStatusChange(selectedInvoice.id, e.target.value)}
 className="bg-[#F9FAFB] border border-[#E5E7EB] text-[12px] font-bold rounded-xl px-3 py-1.5 text-[#111827]"
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
 className="rounded-xl bg-[#84CC16] hover:bg-[#73B612] text-[#111827] font-bold text-[12px] flex items-center gap-1.5"
 >
 <CreditCard className="w-4 h-4" />
 <span>Proceed to Payment</span>
 </Button>
 )}

 <Button
 size="sm"
 variant="secondary"
 onClick={() => setIsDetailModalOpen(false)}
 className="rounded-xl font-bold text-[12px]"
 >
 Close
 </Button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* CREATE WORKSPACE INVOICE MODAL */}
 <AnimatePresence>
 {isCreateInvoiceOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC]/70 backdrop-blur-sm no-print">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 text-left"
 >
 <div className="flex items-center justify-between border-b border-gray-200 pb-3">
 <h3 className="font-bold text-[12px] text-[#111827] flex items-center gap-2">
 <Receipt className="w-5 h-5 text-[#84CC16]" />
 {editingInvoice ? `Edit Custom Invoice (${editingInvoice.invoiceNumber || 'Invoice'})` : 'Create New Custom WeVentureHub Invoice'}
 </h3>
 <button onClick={() => { setIsCreateInvoiceOpen(false); setEditingInvoice(null); }} className="text-[#6B7280] hover:text-[#111827]">
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleInvoiceSubmit} className="space-y-4 text-[12px] max-h-[75vh] overflow-y-auto pr-1">
 
 {/* Section 1: Customer Details */}
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
   <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[12px]">1. Customer Billing Details</h4>
   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
     <div>
       <label className="font-semibold block mb-1">Customer Name</label>
       <input
       type="text"
       value={invoiceForm.userName}
       onChange={(e) => setInvoiceForm({ ...invoiceForm, userName: e.target.value })}
       required
       placeholder="e.g. Samuel Kebede"
       className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
       />
     </div>

     <div>
       <label className="font-semibold block mb-1">Customer Email</label>
       <input
       type="email"
       value={invoiceForm.userEmail}
       onChange={(e) => setInvoiceForm({ ...invoiceForm, userEmail: e.target.value })}
       required
       placeholder="customer@email.com"
       className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
       />
     </div>

     <div>
       <label className="font-semibold block mb-1">Customer Phone</label>
       <input
       type="text"
       value={invoiceForm.userPhone}
       onChange={(e) => setInvoiceForm({ ...invoiceForm, userPhone: e.target.value })}
       placeholder="e.g. +251..."
       className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
       />
     </div>
   </div>

   <div className="grid grid-cols-2 gap-3">
     <div>
       <label className="font-semibold block mb-1">Company Name (Optional)</label>
       <input
       type="text"
       value={invoiceForm.companyName}
       onChange={(e) => setInvoiceForm({ ...invoiceForm, companyName: e.target.value })}
       placeholder="e.g. WeVenture Enterprises"
       className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
       />
     </div>

     <div>
       <label className="font-semibold block mb-1">Customer Type</label>
       <select
       value={invoiceForm.customerType}
       onChange={(e) => setInvoiceForm({ ...invoiceForm, customerType: e.target.value })}
       className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
       >
       <option value="Individual">Individual</option>
       <option value="Company">Company</option>
       <option value="Group">Group</option>
       <option value="Government">Government</option>
       <option value="NGO">NGO</option>
       </select>
     </div>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
     <div>
       <label className="font-semibold block mb-1">Customer TIN No</label>
       <input
       type="text"
       value={invoiceForm.customerTin}
       onChange={(e) => setInvoiceForm({ ...invoiceForm, customerTin: e.target.value })}
       placeholder="e.g. 0082788884"
       className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
       />
     </div>
   </div>
 </div>

 {/* Section 2: Workspace & Tenancy Assignment (Admin Controlled) */}
 <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
   <div className="flex items-center justify-between">
     <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[12px] flex items-center gap-1.5">
       <Building2 className="w-3.5 h-3.5 text-[#84CC16]" />
       2. Workspace & Tenancy Details (Admin Controlled)
     </h4>
     <span className="text-[11px] font-bold text-[#65A30D] bg-lime-50 px-2 py-0.5 rounded-md border border-lime-200">
       Admin Controlled
     </span>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
     <div className="md:col-span-2">
       <label className="font-semibold block mb-1 text-slate-700 flex items-center justify-between">
         <span>Workspace Name <span className="text-rose-500">*</span></span>
         <span className="text-[11px] text-slate-400 font-normal">Enter or select workspace name</span>
       </label>
       <div className="relative">
         <input
           type="text"
           list="workspace-name-options"
           value={invoiceForm.workspaceName}
           onChange={(e) => setInvoiceForm({ ...invoiceForm, workspaceName: e.target.value })}
           required
           placeholder="e.g. Executive Coworking Suite, Dedicated Desk #4, Conference Room A"
           className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold text-slate-900 focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16]"
         />
         <datalist id="workspace-name-options">
           {availableWorkspaceNames.map((name) => (
             <option key={name} value={name} />
           ))}
         </datalist>
       </div>

       {/* Quick Select Buttons */}
       <div className="flex flex-wrap items-center gap-1.5 mt-2">
         <span className="text-[11px] font-bold text-slate-400">Quick Presets:</span>
         {['Executive Coworking Suite', 'Dedicated Desk', 'Hot Desk', 'Meeting Room', 'Conference Room', 'Event Hall', 'Private Office'].map((preset) => (
           <button
             key={preset}
             type="button"
             onClick={() => setInvoiceForm({ ...invoiceForm, workspaceName: preset })}
             className={`text-[11px] px-2 py-0.5 rounded-md border font-medium transition-all ${
               invoiceForm.workspaceName === preset
                 ? 'bg-[#84CC16] text-[#111827] border-[#84CC16] font-bold shadow-xs'
                 : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
             }`}
           >
             {preset}
           </button>
         ))}
       </div>
     </div>

     <div>
       <label className="font-semibold block mb-1 text-slate-700">Duration / Plan</label>
       <input
         type="text"
         value={invoiceForm.billingPeriod}
         onChange={(e) => setInvoiceForm({ ...invoiceForm, billingPeriod: e.target.value })}
         placeholder="e.g. Monthly Plan, Annual, Daily Pass"
         className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
       />
     </div>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
     <div>
       <label className="font-semibold block mb-1 text-slate-700">Date Issued</label>
       <input
         type="date"
         value={invoiceForm.invoiceDate}
         onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
         required
         className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
       />
     </div>

     <div>
       <label className="font-semibold block mb-1 text-slate-700">Payment Due Date</label>
       <input
         type="date"
         value={invoiceForm.dueDate}
         onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
         required
         className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
       />
     </div>
   </div>
 </div>

 {/* Section 3: Multiple Line Items & Services Editor */}
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
   <div className="flex justify-between items-center">
     <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[12px]">3. Line Items & Custom Services</h4>
     <button
       type="button"
       onClick={() => setInvoiceLineItems([...invoiceLineItems, { description: '', quantity: 1, unitPrice: 0 }])}
       className="px-2.5 py-1 bg-[#111827] hover:bg-slate-800 text-white font-bold rounded-lg text-[12px] flex items-center gap-1"
     >
       <Plus className="w-3.5 h-3.5" />
       Add Line Item / Custom Service
     </button>
   </div>

   <div className="space-y-2">
     {invoiceLineItems.map((item, index) => (
       <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
         <div className="col-span-6">
           <label className="text-[12px] font-bold text-slate-500 block mb-0.5">Description / Service Name</label>
           <input
             type="text"
             value={item.description}
             onChange={(e) => {
               const newList = [...invoiceLineItems];
               newList[index].description = e.target.value;
               setInvoiceLineItems(newList);
             }}
             required
             placeholder="e.g. Catering, Dedicated Desk Subscription, High Speed Fiber Optic"
             className="w-full p-1.5 border border-slate-200 rounded text-[12px] font-bold"
           />
         </div>

         <div className="col-span-2">
           <label className="text-[12px] font-bold text-slate-500 block mb-0.5">Unit Price (ETB)</label>
           <input
             type="number"
             value={item.unitPrice}
             onChange={(e) => {
               const newList = [...invoiceLineItems];
               newList[index].unitPrice = Number(e.target.value);
               setInvoiceLineItems(newList);
             }}
             required
             min="0"
             className="w-full p-1.5 border border-slate-200 rounded text-[12px] font-semibold font-mono"
           />
         </div>

         <div className="col-span-2">
           <label className="text-[12px] font-bold text-slate-500 block mb-0.5">Quantity</label>
           <input
             type="number"
             value={item.quantity}
             onChange={(e) => {
               const newList = [...invoiceLineItems];
               newList[index].quantity = Number(e.target.value);
               setInvoiceLineItems(newList);
             }}
             required
             min="1"
             className="w-full p-1.5 border border-slate-200 rounded text-[12px] font-semibold font-mono"
           />
         </div>

         <div className="col-span-2 flex items-center justify-between pt-3">
           <span className="text-[12px] font-mono font-bold text-slate-700">
             {(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
           </span>
           {invoiceLineItems.length > 1 && (
             <button
               type="button"
               onClick={() => {
                 setInvoiceLineItems(invoiceLineItems.filter((_, idx) => idx !== index));
               }}
               className="text-rose-500 hover:text-rose-700 p-1"
               title="Remove Item"
             >
               <Trash2 className="w-3.5 h-3.5" />
             </button>
           )}
         </div>
       </div>
     ))}
   </div>
 </div>

 {/* Section 4: Settlement Banks & Terms */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
     <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[12px]">4. Settlement Banks & Terms</h4>
     
     <div className="grid grid-cols-1 gap-2">
       <div>
         <label className="font-semibold block mb-1">Invoice Status</label>
         <select
         value={invoiceForm.status}
         onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
         className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold"
         >
           <option value="Pending Payment">Pending Payment</option>
           <option value="Paid">Paid</option>
           <option value="Partially Paid">Partially Paid</option>
           <option value="Voided">Voided</option>
           <option value="Overdue">Overdue</option>
         </select>
       </div>

       <div>
         <label className="font-semibold block mb-1">Invoice Terms & Notes</label>
         <input
         type="text"
         value={invoiceForm.notes}
         onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
         placeholder="Payment is due within 14 days of issuance."
         className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] font-medium"
         />
       </div>
     </div>

     <div className="flex items-center gap-2 py-1">
       <input
         type="checkbox"
         id="invoiceTaxEnabled"
         checked={invoiceForm.taxEnabled}
         onChange={(e) => setInvoiceForm({ ...invoiceForm, taxEnabled: e.target.checked })}
         className="w-3.5 h-3.5 rounded border-gray-300 text-[#84CC16] focus:ring-[#84CC16]"
       />
       <label htmlFor="invoiceTaxEnabled" className="font-bold text-slate-700 select-none cursor-pointer">
         Apply 15.00% standard VAT rate on line items
       </label>
     </div>

     <div className="space-y-3 pt-1 border-t border-slate-200">
       <div>
         <label className="font-bold block mb-1 text-slate-700">
           Select Settlement Banks (Choose 2 or More Bank Options for Invoice Display)
         </label>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
           {WEVENTURE_BANKS.map((b) => {
             const isChecked = invoiceSelectedBanks.includes(b.bankName);
             return (
               <label
                 key={b.bankName}
                 className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-[12px] font-semibold transition-all ${
                   isChecked
                     ? 'bg-white border-[#84CC16] shadow-2xs text-slate-900'
                     : 'bg-slate-100/60 border-slate-200 text-slate-600 hover:bg-white'
                 }`}
               >
                 <input
                   type="checkbox"
                   checked={isChecked}
                   onChange={(e) => {
                     if (e.target.checked) {
                       setInvoiceSelectedBanks((prev) => [...prev, b.bankName]);
                       setInvoiceSelectedBank(b.bankName);
                     } else {
                       if (invoiceSelectedBanks.length > 1) {
                         const next = invoiceSelectedBanks.filter((name) => name !== b.bankName);
                         setInvoiceSelectedBanks(next);
                         setInvoiceSelectedBank(next[0]);
                       }
                     }
                   }}
                   className="rounded text-[#84CC16] focus:ring-[#84CC16]"
                 />
                 <span>{b.bankName}</span>
               </label>
             );
           })}
         </div>
       </div>

       {/* Auto-populated Read-Only Selected Banks List */}
       <div className="space-y-2 p-3 bg-slate-100/80 rounded-lg border border-slate-200">
         <div className="text-[12px] font-extrabold text-slate-500 uppercase tracking-wider">
           Selected Settlement Bank Accounts ({invoiceSelectedBanks.length} Selected)
         </div>
         <div className="space-y-2 divide-y divide-slate-200">
           {getBankRecords(invoiceSelectedBanks).map((bankRec, idx) => (
             <div key={bankRec.bankName + idx} className={idx > 0 ? 'pt-2' : ''}>
               <div className="flex items-center justify-between text-[12px] font-bold text-slate-800 mb-1">
                 <span>Option {idx + 1}: {bankRec.bankName}</span>
                 <span className="text-[12px] text-slate-500 font-medium">{bankRec.branch}</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[12px] bg-white p-2 rounded border border-slate-200">
                 <div>
                   <span className="text-slate-500 font-medium">Acc Name: </span>
                   <span className="font-bold text-slate-700">{bankRec.accountName}</span>
                 </div>
                 <div>
                   <span className="text-slate-500 font-medium">Acc No: </span>
                   <span className="font-mono font-bold text-slate-900">{bankRec.accountNumber}</span>
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>
     </div>
   </div>

   {/* Section 4: Pricing Adjustments, Extra Charges & Manual Auditing Override */}
   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
     <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[12px]">4. Adjustment Metrics & Auditing</h4>
     
     <div className="grid grid-cols-2 gap-2">
       <div>
         <label className="font-semibold block mb-1">Extra Charges (ETB)</label>
         <input
           type="number"
           min="0"
           value={invoiceExtraCharges}
           onChange={(e) => setInvoiceExtraCharges(Number(e.target.value))}
           className="w-full p-2 bg-white border border-gray-200 rounded-lg font-semibold font-mono"
           placeholder="0"
         />
       </div>

       <div>
         <label className="font-semibold block mb-1">General Discount (ETB)</label>
         <input
           type="number"
           min="0"
           value={invoiceForm.discount}
           onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: Number(e.target.value) })}
           className="w-full p-2 bg-white border border-gray-200 rounded-lg font-semibold font-mono"
           placeholder="0"
         />
       </div>
     </div>

     <div className="border-t border-dashed border-slate-200 pt-2.5 mt-1 space-y-2">
       <span className="text-[12px] font-bold text-slate-500 block">Manual Price Override Audit Fields (Optional):</span>
       <div className="grid grid-cols-2 gap-2">
         <div>
           <label className="text-[12px] font-semibold block mb-0.5">Original Cost (ETB)</label>
           <input
             type="number"
             min="0"
             value={invoiceOriginalPrice || ''}
             onChange={(e) => setInvoiceOriginalPrice(Number(e.target.value))}
             className="w-full p-1.5 bg-white border border-gray-200 rounded font-mono"
             placeholder="e.g. 6000"
           />
         </div>
         <div>
           <label className="text-[12px] font-semibold block mb-0.5">Adjusted Cost (ETB)</label>
           <input
             type="number"
             min="0"
             value={invoiceAdjustedPrice || ''}
             onChange={(e) => setInvoiceAdjustedPrice(Number(e.target.value))}
             className="w-full p-1.5 bg-white border border-gray-200 rounded font-mono"
             placeholder="e.g. 5000"
           />
         </div>
       </div>
       <div>
         <label className="text-[12px] font-semibold block mb-0.5">Reason for Price Adjustment</label>
         <input
           type="text"
           value={invoiceAdjustmentReason}
           onChange={(e) => setInvoiceAdjustmentReason(e.target.value)}
           className="w-full p-1.5 bg-white border border-gray-200 rounded"
           placeholder="e.g. Approved bulk booking discount by center manager"
         />
       </div>
     </div>
   </div>
 </div>

 {/* Live Calculations Summary Banner */}
 {(() => {
   const subtotal = invoiceLineItems.reduce((acc, item) => acc + (Number(item.unitPrice) * Number(item.quantity)), 0);
   const vat = invoiceForm.taxEnabled ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
   const discount = Number(invoiceForm.discount || 0);
   const extraCharges = Number(invoiceExtraCharges || 0);
   const grandTotal = subtotal + vat + extraCharges - discount;

   return (
     <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-wrap justify-between items-center text-[12px] gap-3 font-bold">
       <div className="flex gap-4">
         <div>
           <span className="text-slate-400 block text-[12px] uppercase font-bold">Subtotal</span>
           <span className="font-mono font-bold text-[12px]">ETB {subtotal.toFixed(2)}</span>
         </div>
         <div>
           <span className="text-slate-400 block text-[12px] uppercase font-bold">VAT (15%)</span>
           <span className="font-mono font-bold text-[12px]">ETB {vat.toFixed(2)}</span>
         </div>
         {extraCharges > 0 && (
           <div>
             <span className="text-emerald-400 block text-[12px] uppercase font-bold">Extra Charges</span>
             <span className="font-mono font-bold text-[12px] text-emerald-400">+ ETB {extraCharges.toFixed(2)}</span>
           </div>
         )}
         {discount > 0 && (
           <div>
             <span className="text-rose-400 block text-[12px] uppercase font-bold">Discounts</span>
             <span className="font-mono font-bold text-[12px] text-rose-400">- ETB {discount.toFixed(2)}</span>
           </div>
         )}
       </div>
       <div className="text-right">
         <span className="text-[#84CC16] block text-[12px] uppercase font-bold tracking-wider">Final Recalculated Grand Total</span>
         <span className="font-mono font-bold text-[12px] text-[#84CC16]">ETB {grandTotal.toFixed(2)}</span>
       </div>
     </div>
   );
 })()}

 <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
   <Button type="button" variant="outline" onClick={() => { setIsCreateInvoiceOpen(false); setEditingInvoice(null); }}>
     Cancel
   </Button>
   <Button type="submit" disabled={isSubmittingInvoice} className="bg-[#84CC16] text-[#111827] font-bold">
     {isSubmittingInvoice
       ? (editingInvoice ? 'Saving Changes...' : 'Generating...')
       : (editingInvoice ? 'Save Invoice Changes' : 'Generate Custom Invoice')}
   </Button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
