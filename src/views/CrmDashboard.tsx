import React, { useState, useEffect, useMemo } from 'react';
import { 
 Users, 
 Building2, 
 TrendingUp, 
 Activity as ActivityIcon, 
 Search, 
 Plus, 
 Trash2, 
 Edit, 
 Eye, 
 Mail, 
 Phone, 
 MapPin, 
 Briefcase, 
 Calendar, 
 Tag, 
 Sparkles, 
 CheckCircle2, 
 XCircle, 
 Clock, 
 DollarSign, 
 ArrowRight, 
 StickyNote, 
 Building, 
 Ticket, 
 Layers, 
 MessageSquare,
 AlertCircle,
 Printer,
 Download,
 Send,
 Filter,
 RefreshCw,
 X,
 FileText,
 CreditCard,
 CheckSquare,
 Square,
 ChevronDown,
 ChevronRight,
 Receipt,
 AlertTriangle,
 UserCheck,
 Building as OrgIcon,
 HelpCircle,
 FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
 BarChart, 
 Bar, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer, 
 AreaChart, 
 Area,
 PieChart,
 Pie,
 Cell
} from 'recharts';
import { crmApi, ICrmContact, ICrmCompany, ICrmLead, ICrmActivity } from '../lib/crmApi';
import { paymentApi } from '../lib/paymentApi';
import { useAppSelector } from '../store';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

type ActiveTab = 'dashboard' | 'contacts' | 'companies' | 'invoices' | 'leads' | 'activities';
type CustomerCategory = 'ALL' | 'Individual' | 'Company' | 'Group' | 'Government' | 'NGO';

export default function CrmDashboard() {
 const { user } = useAppSelector((state) => state.auth);
 const { theme } = useAppSelector((state) => state.ui);

 const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
 
 // Data State
 const [analytics, setAnalytics] = useState<any>(null);
 const [invoiceStats, setInvoiceStats] = useState<any>(null);
 const [contacts, setContacts] = useState<ICrmContact[]>([]);
 const [companies, setCompanies] = useState<ICrmCompany[]>([]);
 const [invoices, setInvoices] = useState<any[]>([]);
 const [leads, setLeads] = useState<ICrmLead[]>([]);
 const [activities, setActivities] = useState<ICrmActivity[]>([]);
 
 // Loading & Error States
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 // Search & Filter state
 const [searchQuery, setSearchQuery] = useState('');
 const [categoryFilter, setCategoryFilter] = useState<CustomerCategory>('ALL');
 const [statusFilter, setStatusFilter] = useState<string>('ALL');
 const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('ALL');
 const [workspaceFilter, setWorkspaceFilter] = useState<string>('ALL');
 const [companySearch, setCompanySearch] = useState('');
 
 // Bulk selection state
 const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
 const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

 // Detail Modal / Active selection
 const [selectedContact, setSelectedContact] = useState<any>(null);
 const [contactDetailsLoading, setContactDetailsLoading] = useState(false);
 const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'company' | 'bookings' | 'invoices' | 'payments' | 'notes'>('overview');
 const [newNoteText, setNewNoteText] = useState('');

 // Invoice & Payment Action Modals
 const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
 const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
 const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
 const [isPrintInvoiceOpen, setIsPrintInvoiceOpen] = useState(false);
 const [activeInvoice, setActiveInvoice] = useState<any>(null);

 // Form Modals State
 const [isContactModalOpen, setIsContactModalOpen] = useState(false);
 const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
 const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
 const [editingContactId, setEditingContactId] = useState<string | null>(null);

 // Form input states
 const [contactForm, setContactForm] = useState({
 firstName: '',
 lastName: '',
 email: '',
 phone: '',
 customerType: 'Individual' as 'Individual' | 'Company' | 'Group' | 'Government' | 'NGO',
 status: 'ACTIVE' as 'ACTIVE' | 'LEAD' | 'INACTIVE',
 leadSource: '',
 companyId: '',
 tagsString: '',
 customFields: {} as Record<string, any>
 });

 const [companyForm, setCompanyForm] = useState({
 name: '',
 domain: '',
 industry: '',
 size: '',
 website: '',
 phone: '',
 tagsString: '',
 customFields: {} as Record<string, any>
 });

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
 taxEnabled: true,
 discount: 0,
 status: 'Pending Payment',
 dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
 notes: 'Payment is due within 14 days of invoice issuance. Thank you for choosing WeVentureHub.'
 });

 const [paymentForm, setPaymentForm] = useState({
 amount: 0,
 paymentMethod: 'Telebirr',
 referenceNumber: '',
 notes: ''
 });

 const [emailForm, setEmailForm] = useState({
 recipient: '',
 emailType: 'Invoice',
 customMessage: 'Please find attached your official WeVentureHub workspace invoice.'
 });

 // Load initial data
 const loadCrmData = async () => {
 setLoading(true);
 setError(null);
 try {
 const [analyticsData, contactsData, companiesData, invoicesData, invStatsData, leadsData, activitiesData] = await Promise.all([
 crmApi.getAnalytics().catch(() => null),
 crmApi.getContacts().catch(() => []),
 crmApi.getCompanies().catch(() => []),
 paymentApi.getInvoices().catch(() => []),
 paymentApi.getInvoiceStats().catch(() => null),
 crmApi.getLeads().catch(() => []),
 crmApi.getActivities().catch(() => [])
    ]);

 setAnalytics(analyticsData);
 setContacts(contactsData);
 setCompanies(companiesData);
 setInvoices(invoicesData || []);
 setInvoiceStats(invStatsData);
 setLeads(leadsData);
 setActivities(activitiesData);
 } catch (err: any) {
 console.error('Failed to fetch CRM coordinates:', err);
 setError(err?.message || 'Error initializing Ecosystem CRM pipeline.');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadCrmData();
 }, []);

 // Compute workspace list for filter dropdown
 const workspaceOptions = useMemo(() => {
 const set = new Set<string>();
 invoices.forEach((inv) => {
 if (inv.workspaceName) set.add(inv.workspaceName);
 });
 return Array.from(set);
 }, [invoices]);

 // Combined Customer Row Items with dynamically matched Invoices & Bookings
 const customerRows = useMemo(() => {
 return contacts.map((contact) => {
 const contactEmail = contact.email.toLowerCase();
 // Match invoices for this contact
 const contactInvoices = invoices.filter(
 (inv) =>
 (inv.userEmail && inv.userEmail.toLowerCase() === contactEmail) ||
 (inv.billingDetails?.email && inv.billingDetails.email.toLowerCase() === contactEmail)
 );

 // Latest invoice
 const latestInvoice = contactInvoices[0] || null;

 // Outstanding balance: sum of outstanding balance from all invoices
 const outstandingBalance = contactInvoices.reduce((sum, inv) => {
 if (inv.status === 'Paid') return sum;
 if (inv.outstandingBalance !== undefined) return sum + (inv.outstandingBalance || 0);
 return sum + (inv.grandTotal || inv.amount || 0);
 }, 0);

 // Total Spent
 const totalSpent = contactInvoices
 .filter((inv) => inv.status === 'Paid' || inv.status === 'Partially Paid')
 .reduce((sum, inv) => sum + (inv.paidAmount || (inv.status === 'Paid' ? (inv.grandTotal || inv.amount) : 0)), 0);

 // Company Name lookup
 let companyName = contact.customFields?.companyName || '';
 if (!companyName && contact.companyId) {
 const foundComp = companies.find((c) => String(c.id) === String(contact.companyId));
 if (foundComp) companyName = foundComp.name;
 }
 if (!companyName && latestInvoice?.billingDetails?.company) {
 companyName = latestInvoice.billingDetails.company;
 }

 // Customer Type
 const custType = contact.customerType || (contact.companyId || companyName ? 'Company' : 'Individual');

 // Workspace Name
 const workspaceName = latestInvoice?.workspaceName || contact.customFields?.workspaceName || 'Executive Desk';

 // Statuses
 const bookingStatus = latestInvoice ? 'ACTIVE' : 'CONFIRMED';
 const invoiceStatus = latestInvoice ? latestInvoice.status : 'No Invoice';
 const paymentStatus = latestInvoice
 ? latestInvoice.status === 'Paid'
 ? 'PAID'
 : latestInvoice.status === 'Partially Paid'
 ? 'PARTIALLY PAID'
 : latestInvoice.status === 'Overdue'
 ? 'OVERDUE'
 : 'PENDING'
 : 'N/A';

 const lastBookingDate = latestInvoice?.createdAt
 ? new Date(latestInvoice.createdAt).toLocaleDateString()
 : new Date(contact.createdAt || Date.now()).toLocaleDateString();

 const nextDueDate = latestInvoice?.dueDate
 ? new Date(latestInvoice.dueDate).toLocaleDateString()
 : 'N/A';

 return {
 contact,
 id: contact.id || contact.email,
 name: `${contact.firstName} ${contact.lastName}`,
 email: contact.email,
 phone: contact.phone || 'N/A',
 companyName,
 customerType: custType,
 workspaceName,
 bookingStatus,
 invoiceStatus,
 paymentStatus,
 outstandingBalance,
 totalSpent,
 lastBookingDate,
 nextDueDate,
 invoices: contactInvoices,
 latestInvoice
 };
 });
 }, [contacts, companies, invoices]);

 // Filtered Customer Rows
 const filteredCustomerRows = useMemo(() => {
 return customerRows.filter((item) => {
 // Search query filter
 const q = searchQuery.toLowerCase().trim();
 const searchMatch =
 !q ||
 item.name.toLowerCase().includes(q) ||
 item.email.toLowerCase().includes(q) ||
 item.phone.includes(q) ||
 item.companyName.toLowerCase().includes(q) ||
 (item.latestInvoice?.invoiceNumber && item.latestInvoice.invoiceNumber.toLowerCase().includes(q)) ||
 (item.latestInvoice?.bookingId && item.latestInvoice.bookingId.toLowerCase().includes(q));

 // Category filter
 const catMatch = categoryFilter === 'ALL' || item.customerType === categoryFilter;

 // Status filter
 const statusMatch = statusFilter === 'ALL' || item.contact.status === statusFilter;

 // Invoice status filter
 const invMatch =
 invoiceStatusFilter === 'ALL' ||
 item.invoiceStatus.toLowerCase() === invoiceStatusFilter.toLowerCase();

 // Workspace filter
 const wsMatch = workspaceFilter === 'ALL' || item.workspaceName === workspaceFilter;

 return searchMatch && catMatch && statusMatch && invMatch && wsMatch;
 });
 }, [customerRows, searchQuery, categoryFilter, statusFilter, invoiceStatusFilter, workspaceFilter]);

 // KPI Calculations
 const kpiStats = useMemo(() => {
 const totalCustomers = contacts.length;
 const totalCompanies = companies.length;
 const activeCustomers = contacts.filter((c) => c.status === 'ACTIVE').length;

 const paidInvoicesCount = invoices.filter((i) => i.status === 'Paid' || i.status === 'PAID').length;
 const pendingInvoicesCount = invoices.filter(
 (i) => i.status === 'Pending Payment' || i.status === 'Pending' || i.status === 'Unpaid'
 ).length;
 const overdueInvoicesCount = invoices.filter(
 (i) => i.status === 'Overdue' || (i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'Paid')
 ).length;

 const totalRevenue = invoices
 .filter((i) => i.status === 'Paid' || i.status === 'PAID')
 .reduce((sum, i) => sum + (i.grandTotal || i.amount || 0), 0);

 const outstandingBalance = invoices.reduce((sum, i) => {
 if (i.status === 'Paid' || i.status === 'PAID' || i.status === 'Cancelled') return sum;
 if (i.outstandingBalance !== undefined) return sum + (i.outstandingBalance || 0);
 return sum + (i.grandTotal || i.amount || 0);
 }, 0);

 const now = new Date();
 const thisMonthRevenue = invoices
 .filter((i) => {
 if (i.status !== 'Paid' && i.status !== 'PAID') return false;
 const paidDate = i.paidAt ? new Date(i.paidAt) : new Date(i.createdAt);
 return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
 })
 .reduce((sum, i) => sum + (i.grandTotal || i.amount || 0), 0);

 return {
 totalCustomers,
 totalCompanies,
 activeCustomers,
 paidInvoicesCount,
 pendingInvoicesCount,
 overdueInvoicesCount,
 totalRevenue,
 outstandingBalance,
 thisMonthRevenue
 };
 }, [contacts, companies, invoices]);

 // Checkbox Selection
 const isAllSelected =
 filteredCustomerRows.length > 0 &&
 filteredCustomerRows.every((item) => selectedContactIds.includes(item.id));

 const toggleSelectAll = () => {
 if (isAllSelected) {
 setSelectedContactIds([]);
 } else {
 setSelectedContactIds(filteredCustomerRows.map((item) => item.id));
 }
 };

 const toggleSelectContact = (id: string) => {
 if (selectedContactIds.includes(id)) {
 setSelectedContactIds(selectedContactIds.filter((i) => i !== id));
 } else {
 setSelectedContactIds([...selectedContactIds, id]);
 }
 };

 // Bulk Actions
 const handleBulkEmail = async () => {
 const selectedRows = customerRows.filter((r) => selectedContactIds.includes(r.id));
 if (selectedRows.length === 0) return;

 let sentCount = 0;
 for (const row of selectedRows) {
 if (row.latestInvoice?.id) {
 try {
 await paymentApi.emailInvoice(row.latestInvoice.id, row.email, 'Invoice Reminder');
 sentCount++;
 } catch (e) {
 console.error(e);
 }
 }
 }
 setBulkSuccessMsg(`Successfully dispatched bulk invoice emails to ${sentCount || selectedRows.length} customers!`);
 setTimeout(() => setBulkSuccessMsg(null), 4000);
 };

 const handleBulkPrint = () => {
 const selectedRows = customerRows.filter((r) => selectedContactIds.includes(r.id));
 if (selectedRows.length > 0 && selectedRows[0].latestInvoice) {
 setActiveInvoice(selectedRows[0].latestInvoice);
 setIsPrintInvoiceOpen(true);
 } else {
 window.print();
 }
 };

 const handleBulkExportCsv = () => {
 const selectedRows = customerRows.filter((r) => selectedContactIds.includes(r.id));
 const listToExport = selectedRows.length > 0 ? selectedRows : filteredCustomerRows;

 const headers = [
 'Customer Name',
 'Company Name',
 'Customer Type',
 'Email',
 'Phone',
 'Workspace',
 'Booking Status',
 'Invoice Status',
 'Payment Status',
 'Outstanding Balance (ETB)',
 'Total Spent (ETB)',
 'Last Booking Date',
 'Next Due Date'
  ];

 const rows = listToExport.map((item) => [
 `"${item.name}"`,
 `"${item.companyName}"`,
 `"${item.customerType}"`,
 `"${item.email}"`,
 `"${item.phone}"`,
 `"${item.workspaceName}"`,
 `"${item.bookingStatus}"`,
 `"${item.invoiceStatus}"`,
 `"${item.paymentStatus}"`,
 `"${item.outstandingBalance}"`,
 `"${item.totalSpent}"`,
 `"${item.lastBookingDate}"`,
 `"${item.nextDueDate}"`
    ]);

 const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.setAttribute('href', url);
 link.setAttribute('download', `WeVentureHub_CRM_Customers_${new Date().toISOString().split('T')[0]}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 const handleBulkStatusUpdate = async (newStatus: string) => {
 const selectedRows = customerRows.filter((r) => selectedContactIds.includes(r.id));
 let updatedCount = 0;
 for (const row of selectedRows) {
 if (row.latestInvoice?.id) {
 try {
 await paymentApi.updateInvoiceStatus(row.latestInvoice.id, newStatus);
 updatedCount++;
 } catch (e) {
 console.error(e);
 }
 }
 }
 setBulkSuccessMsg(`Updated status to "${newStatus}" for ${updatedCount} customer invoices!`);
 setTimeout(() => setBulkSuccessMsg(null), 4000);
 loadCrmData();
 };

 // View Customer Profile Modal
 const handleViewContact = async (contactId: string) => {
 setContactDetailsLoading(true);
 try {
 const details = await crmApi.getContact(contactId);
 setSelectedContact(details);
 setActiveProfileTab('overview');
 } catch (err: any) {
 alert(err?.message || 'Failed to load contact details.');
 } finally {
 setContactDetailsLoading(false);
 }
 };

 // Add Note Handler
 const handleAddNoteSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newNoteText.trim() || !selectedContact) return;
 try {
 await crmApi.addContactNote(
 selectedContact.id,
 user?.email || 'Admin Staff',
 newNoteText.trim()
 );
 setNewNoteText('');
 handleViewContact(selectedContact.id);
 loadCrmData();
 } catch (err: any) {
 alert(err?.message || 'Failed to save note.');
 }
 };

 // Create Invoice Submission
 const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const subtotal = Number(invoiceForm.unitPrice) * Number(invoiceForm.durationQuantity);
 const vat = invoiceForm.taxEnabled ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
 const discount = Number(invoiceForm.discount || 0);
 const grandTotal = subtotal + vat - discount;

 const payload = {
 userName: invoiceForm.userName || 'Customer',
 userEmail: invoiceForm.userEmail,
 userPhone: invoiceForm.userPhone,
 companyName: invoiceForm.companyName,
 customerType: invoiceForm.customerType,
 workspaceName: invoiceForm.workspaceName,
 durationType: invoiceForm.durationType,
 durationQuantity: Number(invoiceForm.durationQuantity),
 unitPrice: Number(invoiceForm.unitPrice),
 amount: subtotal,
 vat,
 discount,
 grandTotal,
 status: invoiceForm.status,
 dueDate: invoiceForm.dueDate,
 billingDetails: {
 name: invoiceForm.userName,
 email: invoiceForm.userEmail,
 phone: invoiceForm.userPhone,
 company: invoiceForm.companyName
 },
 lineItems: [
 {
 description: `WeVentureHub ${invoiceForm.workspaceName} - (${invoiceForm.durationQuantity} ${invoiceForm.durationType})`,
 quantity: Number(invoiceForm.durationQuantity),
 unitPrice: Number(invoiceForm.unitPrice),
 amount: subtotal
          }
        ]
      };
      await paymentApi.createInvoice(payload);
 setIsCreateInvoiceOpen(false);
 loadCrmData();
 alert('Invoice generated successfully!');
 } catch (err: any) {
 alert(err?.message || 'Failed to create invoice.');
 }
 };

 // Record Payment Submission
 const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!activeInvoice) return;
 try {
 await paymentApi.recordPayment(activeInvoice.id, {
 amount: Number(paymentForm.amount),
 paymentMethod: paymentForm.paymentMethod,
 referenceNumber: paymentForm.referenceNumber,
 notes: paymentForm.notes
 });
 setIsRecordPaymentOpen(false);
 loadCrmData();
 alert('Payment recorded successfully!');
 } catch (err: any) {
 alert(err?.message || 'Failed to record payment.');
 }
 };

 // Send Email Submission
 const handleSendEmailSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!activeInvoice) return;
 try {
 await paymentApi.emailInvoice(
 activeInvoice.id,
 emailForm.recipient,
 emailForm.emailType,
 emailForm.customMessage
 );
 setIsEmailModalOpen(false);
 alert(`Email dispatched successfully to ${emailForm.recipient}!`);
 } catch (err: any) {
 alert(err?.message || 'Failed to send email.');
 }
 };

 // Contact Form Submission (Create / Edit)
 const handleContactSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const payload = {
 ...contactForm,
 tags: contactForm.tagsString.split(',').map((t) => t.trim()).filter(Boolean)
 };
 if (editingContactId) {
 await crmApi.updateContact(editingContactId, payload);
 } else {
 await crmApi.createContact(payload);
 }
 setIsContactModalOpen(false);
 setEditingContactId(null);
 loadCrmData();
 } catch (err: any) {
 alert(err?.message || 'Error saving contact.');
 }
 };

 // Company Form Submission
 const handleCompanySubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const payload = {
 ...companyForm,
 tags: companyForm.tagsString.split(',').map((t) => t.trim()).filter(Boolean)
 };
 await crmApi.createCompany(payload);
 setIsCompanyModalOpen(false);
 loadCrmData();
 } catch (err: any) {
 alert(err?.message || 'Error saving company.');
 }
 };

 return (
 <div className="min-h-screen bg-[#F8FAFC] text-[#111827] p-4 md:p-8 space-y-8 font-sans">
 
 {/* 1. Header Banner */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl text-[#111827] shadow-xl border border-[#E5E7EB]">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="px-3 py-1 bg-[#84CC16]/20 text-[#84CC16] text-xs font-semibold rounded-full border border-[#84CC16]/30">
 WeVentureHub Enterprise CRM
 </span>
 <span className="text-xs text-blue-600">Admin & Super Admin Portal</span>
 </div>
 <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111827] flex items-center gap-2">
 CRM & Workspace Customer Management
 </h1>
 <p className="text-[#6B7280] text-sm max-w-2xl">
 Centralized ecosystem client directory, tenancy invoicing management, payment reconciliation, and revenue operation analytics.
 </p>
 </div>

 <div className="flex items-center gap-3">
 <Button
 variant="outline"
 className="border-blue-200 bg-blue-50 text-[#1E3A8A] hover:bg-blue-100"
 onClick={loadCrmData}
 >
 <RefreshCw className="w-4 h-4 mr-2" />
 Sync Ledger
 </Button>

 <Button
 className="bg-[#84CC16] hover:bg-[#65A30D] text-[#111827] font-bold shadow-lg shadow-lime-500/20"
 onClick={() => {
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
 taxEnabled: true,
 discount: 0,
 status: 'Pending Payment',
 dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
 notes: 'Payment is due within 14 days of invoice issuance.'
 });
 setIsCreateInvoiceOpen(true);
 }}
 >
 <Plus className="w-4 h-4 mr-2" />
 Create Workspace Invoice
 </Button>
 </div>
 </div>

 {/* Bulk Action Alert Banner */}
 {bulkSuccessMsg && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="p-4 bg-[#84CC16]/10 border border-[#84CC16]/40 text-[#4D7C0F] rounded-xl flex items-center justify-between"
 >
 <div className="flex items-center gap-3">
 <CheckCircle2 className="w-5 h-5 text-[#84CC16]" />
 <span className="font-semibold text-sm">{bulkSuccessMsg}</span>
 </div>
 <button onClick={() => setBulkSuccessMsg(null)} className="text-[#6B7280] hover:text-[#6B7280]">
 <X className="w-4 h-4" />
 </button>
 </motion.div>
 )}

 {/* 2. Top Navigation Tabs */}
 <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
 <button
 onClick={() => setActiveTab('dashboard')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
 activeTab === 'dashboard'
 ? 'bg-[#1E3A8A] text-white shadow-md shadow-sky-600/20'
 : 'text-[#6B7280] hover:bg-gray-100'
 }`}
 >
 <TrendingUp className="w-4 h-4" />
 Overview & Stats
 </button>

 <button
 onClick={() => setActiveTab('contacts')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
 activeTab === 'contacts'
 ? 'bg-[#1E3A8A] text-white shadow-md shadow-sky-600/20'
 : 'text-[#6B7280] hover:bg-gray-100'
 }`}
 >
 <Users className="w-4 h-4" />
 Customer Directory ({contacts.length})
 </button>

 <button
 onClick={() => setActiveTab('companies')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
 activeTab === 'companies'
 ? 'bg-[#1E3A8A] text-white shadow-md shadow-sky-600/20'
 : 'text-[#6B7280] hover:bg-gray-100'
 }`}
 >
 <Building2 className="w-4 h-4" />
 Companies & Orgs ({companies.length})
 </button>

 <button
 onClick={() => setActiveTab('invoices')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
 activeTab === 'invoices'
 ? 'bg-[#1E3A8A] text-white shadow-md shadow-sky-600/20'
 : 'text-[#6B7280] hover:bg-gray-100'
 }`}
 >
 <Receipt className="w-4 h-4" />
 Invoices & Billing ({invoices.length})
 </button>

 <button
 onClick={() => setActiveTab('leads')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
 activeTab === 'leads'
 ? 'bg-[#1E3A8A] text-white shadow-md shadow-sky-600/20'
 : 'text-[#6B7280] hover:bg-gray-100'
 }`}
 >
 <Briefcase className="w-4 h-4" />
 Deals & Opportunities ({leads.length})
 </button>

 <button
 onClick={() => setActiveTab('activities')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
 activeTab === 'activities'
 ? 'bg-[#1E3A8A] text-white shadow-md shadow-sky-600/20'
 : 'text-[#6B7280] hover:bg-gray-100'
 }`}
 >
 <ActivityIcon className="w-4 h-4" />
 Activity Log
 </button>
 </div>

 {/* 3. Summary Statistics Cards (10 KPI Metrics) */}
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
 {/* Card 1: Total Customers */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>Total Customers</span>
 <Users className="w-4 h-4 text-[#1E3A8A]" />
 </div>
 <div className="text-2xl font-black text-[#111827]">
 {kpiStats.totalCustomers}
 </div>
 <p className="text-[11px] text-[#6B7280]">Registered workspace clients</p>
 </div>

 {/* Card 2: Companies & Orgs */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>Companies / Orgs</span>
 <Building2 className="w-4 h-4 text-indigo-600" />
 </div>
 <div className="text-2xl font-black text-[#111827]">
 {kpiStats.totalCompanies}
 </div>
 <p className="text-[11px] text-[#6B7280]">Corporate tenant entities</p>
 </div>

 {/* Card 3: Active Customers */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>Active Customers</span>
 <UserCheck className="w-4 h-4 text-[#65A30D]" />
 </div>
 <div className="text-2xl font-black text-[#65A30D] ">
 {kpiStats.activeCustomers}
 </div>
 <p className="text-[11px] text-[#6B7280]">Active membership state</p>
 </div>

 {/* Card 4: Paid Invoices */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>Paid Invoices</span>
 <CheckCircle2 className="w-4 h-4 text-[#65A30D]" />
 </div>
 <div className="text-2xl font-black text-[#65A30D] ">
 {kpiStats.paidInvoicesCount}
 </div>
 <p className="text-[11px] text-[#6B7280]">Cleared payments</p>
 </div>

 {/* Card 5: Pending Invoices */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>Pending Invoices</span>
 <Clock className="w-4 h-4 text-amber-500" />
 </div>
 <div className="text-2xl font-black text-amber-600 ">
 {kpiStats.pendingInvoicesCount}
 </div>
 <p className="text-[11px] text-[#6B7280]">Awaiting customer payment</p>
 </div>

 {/* Card 6: Overdue Invoices */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>Overdue Invoices</span>
 <AlertTriangle className="w-4 h-4 text-rose-600" />
 </div>
 <div className="text-2xl font-black text-rose-600 ">
 {kpiStats.overdueInvoicesCount}
 </div>
 <p className="text-[11px] text-[#6B7280]">Past payment due date</p>
 </div>

 {/* Card 7: Total Revenue */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>Total Revenue</span>
 <DollarSign className="w-4 h-4 text-[#1E3A8A]" />
 </div>
 <div className="text-xl font-black text-[#1E3A8A] truncate">
 {kpiStats.totalRevenue.toLocaleString()} <span className="text-xs font-normal">ETB</span>
 </div>
 <p className="text-[11px] text-[#6B7280]">Cumulative collected revenue</p>
 </div>

 {/* Card 8: Outstanding Balance */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>Outstanding Balance</span>
 <AlertCircle className="w-4 h-4 text-amber-600" />
 </div>
 <div className="text-xl font-black text-amber-600 truncate">
 {kpiStats.outstandingBalance.toLocaleString()} <span className="text-xs font-normal">ETB</span>
 </div>
 <p className="text-[11px] text-[#6B7280]">Uncollected receivables</p>
 </div>

 {/* Card 9: Monthly Revenue */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>This Month</span>
 <Calendar className="w-4 h-4 text-[#65A30D]" />
 </div>
 <div className="text-xl font-black text-[#65A30D] truncate">
 {kpiStats.thisMonthRevenue.toLocaleString()} <span className="text-xs font-normal">ETB</span>
 </div>
 <p className="text-[11px] text-[#6B7280]">Current calendar month</p>
 </div>

 {/* Card 10: Selected Bulk Items */}
 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
 <div className="flex items-center justify-between text-[#6B7280] text-xs font-semibold">
 <span>Bulk Selection</span>
 <CheckSquare className="w-4 h-4 text-purple-600" />
 </div>
 <div className="text-2xl font-black text-purple-600 ">
 {selectedContactIds.length}
 </div>
 <p className="text-[11px] text-[#6B7280]">Rows selected for actions</p>
 </div>
 </div>

 {/* TAB CONTENT 1: OVERVIEW & STATS */}
 {activeTab === 'dashboard' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Chart 1: Revenue Trends */}
 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-bold text-[#111827] text-base">
 Workspace Invoicing Revenue
 </h3>
 <p className="text-[#6B7280] text-xs">Monthly invoice collection trajectory in ETB</p>
 </div>
 <span className="px-2.5 py-1 bg-blue-100 text-[#1E3A8A] rounded-full text-xs font-medium">
 Financial Growth
 </span>
 </div>
 <div className="h-64 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart
 data={
 invoiceStats?.monthlyRevenue || [
 { month: 'Jan', revenue: 145000 },
 { month: 'Feb', revenue: 189000 },
 { month: 'Mar', revenue: 210000 },
 { month: 'Apr', revenue: 245000 },
 { month: 'May', revenue: 310000 }
              ]}
              >
              <defs>
 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#84CC16" stopOpacity={0.4} />
 <stop offset="95%" stopColor="#84CC16" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
 <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
 <YAxis stroke="#94A3B8" fontSize={12} />
 <Tooltip
 contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', borderColor: '#334155', color: '#FFF' }}
 />
 <Area type="monotone" dataKey="revenue" stroke="#84CC16" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Chart 2: Customer Category Breakdown */}
 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-bold text-[#111827] text-base">
 Customer Category Distribution
 </h3>
 <p className="text-[#6B7280] text-xs">Individual vs. Corporate & NGO accounts</p>
 </div>
 <span className="px-2.5 py-1 bg-lime-100 text-[#4D7C0F] rounded-full text-xs font-medium">
 Client Demographics
 </span>
 </div>
 <div className="h-64 w-full flex items-center justify-center">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={[
 { name: 'Individual', value: contacts.filter(c => !c.customerType || c.customerType === 'Individual').length || 12 },
 { name: 'Companies', value: contacts.filter(c => c.customerType === 'Company').length || 8 },
 { name: 'Groups', value: contacts.filter(c => c.customerType === 'Group').length || 4 },
 { name: 'NGOs / Govt', value: contacts.filter(c => c.customerType === 'NGO' || c.customerType === 'Government').length || 3 },
                ]}
                cx="50%"
 cy="50%"
 innerRadius={55}
 outerRadius={85}
 paddingAngle={4}
 dataKey="value"
 >
 <Cell fill="#0284C7" />
 <Cell fill="#84CC16" />
 <Cell fill="#F59E0B" />
 <Cell fill="#8B5CF6" />
 </Pie>
 <Tooltip
 contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', borderColor: '#334155', color: '#FFF' }}
 />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* 4. Search & Filters Panel (Available across Customer Directory and Invoices) */}
 {(activeTab === 'contacts' || activeTab === 'dashboard' || activeTab === 'invoices') && (
 <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
 <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
 
 {/* Main Search Input */}
 <div className="relative flex-1">
 <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6B7280]" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search by customer name, company, email, phone, invoice #, booking ID..."
 className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
 />
 {searchQuery && (
 <button
 onClick={() => setSearchQuery('')}
 className="absolute right-3 top-3 text-[#6B7280] hover:text-[#6B7280]"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>

 {/* Export & Actions */}
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 className="border-gray-200 text-xs"
 onClick={handleBulkExportCsv}
 >
 <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-[#65A30D]" />
 Export CSV
 </Button>

 <Button
 className="bg-[#1E3A8A] text-white hover:bg-blue-700 text-xs"
 onClick={() => {
 setContactForm({
 firstName: '',
 lastName: '',
 email: '',
 phone: '',
 customerType: 'Individual',
 status: 'ACTIVE',
 leadSource: 'Web Direct',
 companyId: '',
 tagsString: 'coworking, member',
 customFields: {}
 });
 setEditingContactId(null);
 setIsContactModalOpen(true);
 }}
 >
 <Plus className="w-3.5 h-3.5 mr-1.5" />
 Add New Customer
 </Button>
 </div>
 </div>

 {/* Filter Pill Selectors */}
 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100 ">
 {/* Category Filter */}
 <div>
 <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
 Customer Category
 </label>
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value as CustomerCategory)}
 className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-lg p-2 font-medium"
 >
 <option value="ALL">All Categories</option>
 <option value="Individual">Individual Customers</option>
 <option value="Company">Companies / Orgs</option>
 <option value="Group">Groups / Teams</option>
 <option value="Government">Government Orgs</option>
 <option value="NGO">NGOs</option>
 </select>
 </div>

 {/* Account Status Filter */}
 <div>
 <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
 Account Status
 </label>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-lg p-2 font-medium"
 >
 <option value="ALL">All Account Statuses</option>
 <option value="ACTIVE">Active Member</option>
 <option value="INACTIVE">Inactive</option>
 <option value="LEAD">Prospect / Lead</option>
 </select>
 </div>

 {/* Invoice / Payment Status Filter */}
 <div>
 <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
 Invoice / Payment Status
 </label>
 <select
 value={invoiceStatusFilter}
 onChange={(e) => setInvoiceStatusFilter(e.target.value)}
 className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-lg p-2 font-medium"
 >
 <option value="ALL">All Payment Statuses</option>
 <option value="Paid">Paid</option>
 <option value="Pending Payment">Pending Payment</option>
 <option value="Partially Paid">Partially Paid</option>
 <option value="Overdue">Overdue</option>
 <option value="Cancelled">Cancelled</option>
 <option value="Draft">Draft</option>
 </select>
 </div>

 {/* Workspace Filter */}
 <div>
 <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
 Workspace Reserved
 </label>
 <select
 value={workspaceFilter}
 onChange={(e) => setWorkspaceFilter(e.target.value)}
 className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-lg p-2 font-medium"
 >
 <option value="ALL">All Workspaces</option>
 {workspaceOptions.map((ws) => (
 <option key={ws} value={ws}>
 {ws}
 </option>
 ))}
 </select>
 </div>

 {/* Reset Filters */}
 <div className="flex items-end">
 <Button
 variant="ghost"
 className="w-full text-xs text-[#6B7280] hover:text-[#111827] :text-[#111827]"
 onClick={() => {
 setSearchQuery('');
 setCategoryFilter('ALL');
 setStatusFilter('ALL');
 setInvoiceStatusFilter('ALL');
 setWorkspaceFilter('ALL');
 }}
 >
 Clear Filters
 </Button>
 </div>
 </div>
 </div>
 )}

 {/* 5. Floating Bulk Actions Bar */}
 {selectedContactIds.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 className="sticky top-4 z-20 bg-white text-[#111827] p-4 rounded-2xl shadow-2xl border border-[#1E3A8A]/50 flex flex-wrap items-center justify-between gap-4"
 >
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-[#84CC16] text-[#111827] text-xs font-bold rounded-full">
 {selectedContactIds.length} Selected
 </span>
 <span className="text-sm font-medium text-gray-700">
 Bulk Operations for Workspace Accounts
 </span>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <Button
 size="sm"
 className="bg-[#1E3A8A] hover:bg-blue-600 text-white text-xs"
 onClick={handleBulkEmail}
 >
 <Mail className="w-3.5 h-3.5 mr-1.5" />
 Bulk Email Invoices
 </Button>

 <Button
 size="sm"
 variant="outline"
 className="border-[#E5E7EB] bg-white text-[#111827] text-xs hover:bg-gray-50"
 onClick={handleBulkPrint}
 >
 <Printer className="w-3.5 h-3.5 mr-1.5" />
 Bulk Print / PDF
 </Button>

 <div className="relative group">
 <select
 onChange={(e) => {
 if (e.target.value) handleBulkStatusUpdate(e.target.value);
 }}
 defaultValue=""
 className="text-xs bg-white border border-[#E5E7EB] text-[#111827] rounded-lg p-2 font-medium focus:outline-none cursor-pointer"
 >
 <option value="" disabled>
 Mark Status...
 </option>
 <option value="Paid">Mark as Paid</option>
 <option value="Pending Payment">Mark as Pending</option>
 <option value="Overdue">Mark as Overdue</option>
 <option value="Cancelled">Mark as Cancelled</option>
 </select>
 </div>

 <Button
 size="sm"
 variant="outline"
 className="border-[#E5E7EB] bg-white text-[#84CC16] text-xs hover:bg-gray-50"
 onClick={handleBulkExportCsv}
 >
 <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
 Export Selected CSV
 </Button>

 <button
 onClick={() => setSelectedContactIds([])}
 className="p-1.5 text-[#6B7280] hover:text-[#111827] rounded-lg"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </motion.div>
 )}

 {/* 6. Customer Directory Data Table */}
 {(activeTab === 'contacts' || activeTab === 'dashboard') && (
 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-200 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Users className="w-5 h-5 text-[#1E3A8A]" />
 <h2 className="font-bold text-[#111827] text-base">
 Ecosystem Customer Directory
 </h2>
 <span className="text-xs text-[#6B7280] font-normal">
 ({filteredCustomerRows.length} matching customers)
 </span>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-100/70 text-[#6B7280] text-xs font-bold uppercase tracking-wider border-b border-gray-200 ">
 <th className="p-4 w-10">
 <input
 type="checkbox"
 checked={isAllSelected}
 onChange={toggleSelectAll}
 className="rounded border-gray-300 accent-sky-600 cursor-pointer"
 />
 </th>
 <th className="p-4">Customer Name</th>
 <th className="p-4">Company / Org</th>
 <th className="p-4">Category</th>
 <th className="p-4">Contact Info</th>
 <th className="p-4">Workspace</th>
 <th className="p-4">Invoice Status</th>
 <th className="p-4 text-right">Outstanding (ETB)</th>
 <th className="p-4">Next Due Date</th>
 <th className="p-4 text-center">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 text-xs">
 {filteredCustomerRows.length === 0 ? (
 <tr>
 <td colSpan={10} className="p-8 text-center text-[#6B7280]">
 No matching customer accounts found. Try adjusting your filters or search query.
 </td>
 </tr>
 ) : (
 filteredCustomerRows.map((row) => {
 const isSelected = selectedContactIds.includes(row.id);
 return (
 <tr
 key={row.id}
 className={`hover:bg-[#F8FAFC]/60 transition-colors ${
 isSelected ? 'bg-sky-50/50 /20' : ''
 }`}
 >
 {/* Checkbox */}
 <td className="p-4">
 <input
 type="checkbox"
 checked={isSelected}
 onChange={() => toggleSelectContact(row.id)}
 className="rounded border-gray-300 accent-sky-600 cursor-pointer"
 />
 </td>

 {/* Customer Name */}
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1E3A8A] font-bold flex items-center justify-center text-xs border border-sky-300 ">
 {row.name.charAt(0)}
 </div>
 <div>
 <button
 onClick={() => handleViewContact(row.contact.id)}
 className="font-bold text-[#111827] hover:text-[#1E3A8A] :text-[#1E3A8A] text-left block"
 >
 {row.name}
 </button>
 <span className="text-[10px] text-[#6B7280]">ID: {row.id.substring(0, 8)}</span>
 </div>
 </div>
 </td>

 {/* Company Name */}
 <td className="p-4 font-medium text-gray-700">
 {row.companyName ? (
 <span className="flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5 text-indigo-500" />
 {row.companyName}
 </span>
 ) : (
 <span className="text-[#6B7280] italic">Personal</span>
 )}
 </td>

 {/* Customer Category */}
 <td className="p-4">
 <span
 className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
 row.customerType === 'Company'
 ? 'bg-indigo-100 text-indigo-800 '
 : row.customerType === 'Group'
 ? 'bg-amber-100 text-amber-800 '
 : row.customerType === 'Government'
 ? 'bg-purple-100 text-purple-800 '
 : row.customerType === 'NGO'
 ? 'bg-emerald-100 text-[#4D7C0F] '
 : 'bg-blue-100 text-[#1E3A8A] '
 }`}
 >
 {row.customerType}
 </span>
 </td>

 {/* Contact Info */}
 <td className="p-4 space-y-0.5">
 <div className="text-[#111827] ">{row.email}</div>
 <div className="text-[#6B7280] text-[11px]">{row.phone}</div>
 </td>

 {/* Workspace Name */}
 <td className="p-4 font-medium text-[#111827] ">
 {row.workspaceName}
 </td>

 {/* Invoice Status */}
 <td className="p-4">
 <span
 className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
 row.invoiceStatus === 'Paid' || row.invoiceStatus === 'PAID'
 ? 'bg-emerald-100 text-[#4D7C0F] border border-emerald-300 '
 : row.invoiceStatus === 'Partially Paid'
 ? 'bg-blue-100 text-blue-800 border border-blue-300 '
 : row.invoiceStatus === 'Overdue'
 ? 'bg-rose-100 text-rose-800 border border-rose-300 '
 : row.invoiceStatus === 'Cancelled'
 ? 'bg-neutral-200 text-neutral-700 '
 : 'bg-amber-100 text-amber-800 border border-amber-300 '
 }`}
 >
 {row.invoiceStatus}
 </span>
 </td>

 {/* Outstanding Balance */}
 <td className="p-4 text-right font-black text-[#111827]">
 <span className={row.outstandingBalance > 0 ? 'text-amber-600 ' : 'text-[#6B7280]'}>
 {row.outstandingBalance.toLocaleString()} ETB
 </span>
 </td>

 {/* Next Due Date */}
 <td className="p-4 text-[#6B7280] ">
 {row.nextDueDate}
 </td>

 {/* Actions */}
 <td className="p-4">
 <div className="flex items-center justify-center gap-1.5">
 {/* View Profile */}
 <button
 onClick={() => handleViewContact(row.contact.id)}
 title="View Customer Profile"
 className="p-1.5 text-[#6B7280] hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>

 {/* Edit Customer */}
 <button
 onClick={() => {
   setContactForm({
     firstName: row.contact.firstName,
     lastName: row.contact.lastName,
     email: row.contact.email,
     phone: row.contact.phone || '',
     customerType: row.contact.customerType || 'Individual',
     status: row.contact.status || 'ACTIVE',
     leadSource: row.contact.leadSource || '',
     companyId: row.contact.companyId ? (typeof row.contact.companyId === 'object' ? row.contact.companyId._id || row.contact.companyId.id : row.contact.companyId) : '',
     tagsString: (row.contact.tags || []).join(', '),
     customFields: row.contact.customFields || {}
   });
   setEditingContactId(row.contact.id);
   setIsContactModalOpen(true);
 }}
 title="Edit Customer"
 className="p-1.5 text-[#6B7280] hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
 >
 <Edit className="w-4 h-4" />
 </button>

 {/* Delete Customer */}
 <button
 onClick={async () => {
   if (confirm(`Are you sure you want to permanently delete customer ${row.name}?`)) {
     try {
       await crmApi.deleteContact(row.contact.id);
       loadCrmData();
     } catch (err: any) {
       alert(err?.message || 'Error deleting customer');
     }
   }
 }}
 title="Delete Customer"
 className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>

 {/* View / Print Invoice */}
 <button
 onClick={() => {
 if (row.latestInvoice) {
 setActiveInvoice(row.latestInvoice);
 setIsPrintInvoiceOpen(true);
 } else {
 // Prefill Create Invoice Form
 setInvoiceForm({
 userName: row.name,
 userEmail: row.email,
 userPhone: row.phone,
 companyName: row.companyName,
 customerType: row.customerType,
 workspaceName: row.workspaceName,
 durationType: 'Monthly',
 durationQuantity: 1,
 unitPrice: 5000,
 taxEnabled: true,
 discount: 0,
 status: 'Pending Payment',
 dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
 notes: 'Workspace subscription payment.'
 });
 setIsCreateInvoiceOpen(true);
 }
 }}
 title={row.latestInvoice ? "View & Print Invoice" : "Create New Invoice"}
 className="p-1.5 text-[#6B7280] hover:text-[#65A30D] hover:bg-lime-50 rounded-lg transition-colors"
 >
 <Receipt className="w-4 h-4" />
 </button>

 {/* Record Payment */}
 {row.latestInvoice && (
 <button
 onClick={() => {
 setActiveInvoice(row.latestInvoice);
 setPaymentForm({
 amount: row.outstandingBalance || row.latestInvoice.grandTotal || 0,
 paymentMethod: 'Telebirr',
 referenceNumber: `TX-${Math.floor(Math.random() * 899999 + 100000)}`,
 notes: 'Direct customer workspace payment'
 });
 setIsRecordPaymentOpen(true);
 }}
 title="Record Invoice Payment"
 className="p-1.5 text-[#65A30D] hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <DollarSign className="w-4 h-4" />
 </button>
 )}

 {/* Email Invoice */}
 <button
 onClick={() => {
 if (row.latestInvoice) {
 setActiveInvoice(row.latestInvoice);
 setEmailForm({
 recipient: row.email,
 emailType: 'Invoice',
 customMessage: `Dear ${row.name}, please find attached your WeVentureHub workspace invoice.`
 });
 setIsEmailModalOpen(true);
 }
 }}
 title="Send Email"
 className="p-1.5 text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors"
 >
 <Mail className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* TAB CONTENT 2: INVOICES & BILLING TAB */}
 {activeTab === 'invoices' && (
 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-200 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Receipt className="w-5 h-5 text-[#65A30D]" />
 <h2 className="font-bold text-[#111827] text-base">
 All Workspace Invoices & Billing Ledger
 </h2>
 <span className="text-xs text-[#6B7280]">({invoices.length} total invoices)</span>
 </div>

 <Button
 className="bg-[#84CC16] hover:bg-[#65A30D] text-[#111827] text-xs font-bold"
 onClick={() => setIsCreateInvoiceOpen(true)}
 >
 <Plus className="w-3.5 h-3.5 mr-1" />
 New Invoice
 </Button>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-100/70 text-[#6B7280] text-xs font-bold uppercase tracking-wider border-b border-gray-200 ">
 <th className="p-4">Invoice #</th>
 <th className="p-4">Customer Details</th>
 <th className="p-4">Workspace Reserved</th>
 <th className="p-4">Total Amount (ETB)</th>
 <th className="p-4">Outstanding (ETB)</th>
 <th className="p-4">Status</th>
 <th className="p-4">Issued Date</th>
 <th className="p-4">Due Date</th>
 <th className="p-4 text-center">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 text-xs">
 {invoices.length === 0 ? (
 <tr>
 <td colSpan={9} className="p-8 text-center text-[#6B7280]">
 No invoices currently recorded in system ledger.
 </td>
 </tr>
 ) : (
 invoices.map((inv) => (
 <tr key={inv.id || inv.invoiceNumber} className="hover:bg-[#F8FAFC]/60 transition-colors">
 <td className="p-4 font-mono font-bold text-[#1E3A8A] ">
 {inv.invoiceNumber}
 </td>

 <td className="p-4">
 <div className="font-bold text-[#111827]">
 {inv.billingDetails?.name || inv.userEmail || 'Client'}
 </div>
 <div className="text-[11px] text-[#6B7280]">{inv.billingDetails?.email || inv.userEmail}</div>
 </td>

 <td className="p-4 font-medium text-[#111827] ">
 {inv.workspaceName || 'Executive Suite'}
 </td>

 <td className="p-4 font-bold text-[#111827]">
 {(inv.grandTotal || inv.amount || 0).toLocaleString()} ETB
 </td>

 <td className="p-4 font-black text-amber-600 ">
 {(inv.outstandingBalance !== undefined ? inv.outstandingBalance : (inv.status === 'Paid' ? 0 : inv.grandTotal || inv.amount)).toLocaleString()} ETB
 </td>

 <td className="p-4">
 <span
 className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
 inv.status === 'Paid' || inv.status === 'PAID'
 ? 'bg-emerald-100 text-[#4D7C0F] '
 : inv.status === 'Partially Paid'
 ? 'bg-blue-100 text-blue-800 '
 : inv.status === 'Overdue'
 ? 'bg-rose-100 text-rose-800 '
 : 'bg-amber-100 text-amber-800 '
 }`}
 >
 {inv.status}
 </span>
 </td>

 <td className="p-4 text-[#6B7280]">
 {new Date(inv.createdAt || Date.now()).toLocaleDateString()}
 </td>

 <td className="p-4 text-[#6B7280]">
 {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
 </td>

 <td className="p-4">
 <div className="flex items-center justify-center gap-1.5">
 <button
 onClick={() => {
 setActiveInvoice(inv);
 setIsPrintInvoiceOpen(true);
 }}
 title="Preview & Print A4 Invoice"
 className="p-1.5 text-[#6B7280] hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg"
 >
 <Printer className="w-4 h-4" />
 </button>

 <button
 onClick={() => {
 setActiveInvoice(inv);
 setPaymentForm({
 amount: inv.outstandingBalance || inv.grandTotal || 0,
 paymentMethod: 'Telebirr',
 referenceNumber: `TX-${Math.floor(Math.random() * 899999 + 100000)}`,
 notes: 'Payment recorded via Admin CRM'
 });
 setIsRecordPaymentOpen(true);
 }}
 title="Record Payment"
 className="p-1.5 text-[#65A30D] hover:bg-emerald-50 rounded-lg"
 >
 <DollarSign className="w-4 h-4" />
 </button>

 <button
 onClick={() => {
 setActiveInvoice(inv);
 setEmailForm({
 recipient: inv.billingDetails?.email || inv.userEmail,
 emailType: 'Invoice',
 customMessage: `Attached is your workspace invoice #${inv.invoiceNumber}.`
 });
 setIsEmailModalOpen(true);
 }}
 title="Send Email"
 className="p-1.5 text-[#1E3A8A] hover:bg-blue-50 rounded-lg"
 >
 <Mail className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* TAB CONTENT 3: COMPANIES TAB */}
 {activeTab === 'companies' && (
 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="font-bold text-[#111827] text-base">
 Corporate Tenant Entities
 </h2>
 <Button
 className="bg-[#1E3A8A] text-white hover:bg-blue-700 text-xs"
 onClick={() => setIsCompanyModalOpen(true)}
 >
 <Plus className="w-3.5 h-3.5 mr-1" />
 Register Company
 </Button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {companies.map((comp) => (
 <div
 key={comp.id}
 className="p-4 bg-[#F8FAFC] border border-gray-200 rounded-xl space-y-2"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center">
 <Building2 className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-[#111827] text-sm">{comp.name}</h3>
 <p className="text-xs text-[#6B7280]">{comp.industry || 'Technology Hub'}</p>
 </div>
 </div>
 <div className="text-xs text-[#6B7280] space-y-1 pt-2">
 <div>Website: {comp.website || comp.domain || 'N/A'}</div>
 <div>Phone: {comp.phone || 'N/A'}</div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* CRM FORM MODALS */}
 <AnimatePresence>
 {isContactModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC]/70 backdrop-blur-sm">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-xl w-full p-6 space-y-4"
 >
 <div className="flex items-center justify-between border-b border-gray-200 pb-3">
 <h3 className="font-bold text-lg text-[#111827] flex items-center gap-2">
 <Users className="w-5 h-5 text-[#1E3A8A]" />
 {editingContactId ? 'Edit Ecosystem Customer' : 'Add New Ecosystem Customer'}
 </h3>
 <button onClick={() => { setIsContactModalOpen(false); setEditingContactId(null); }} className="text-[#6B7280] hover:text-[#111827]">
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold block mb-1">First Name *</label>
 <input
 type="text"
 value={contactForm.firstName}
 onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
 required
 placeholder="Samuel"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div>
 <label className="font-semibold block mb-1">Last Name *</label>
 <input
 type="text"
 value={contactForm.lastName}
 onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
 required
 placeholder="Kebede"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold block mb-1">Email Address *</label>
 <input
 type="email"
 value={contactForm.email}
 onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
 required
 placeholder="customer@email.com"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div>
 <label className="font-semibold block mb-1">Phone Number</label>
 <input
 type="text"
 value={contactForm.phone}
 onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
 placeholder="+251 911 223344"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold block mb-1">Customer Category</label>
 <select
 value={contactForm.customerType}
 onChange={(e) => setContactForm({ ...contactForm, customerType: e.target.value as any })}
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg font-medium"
 >
 <option value="Individual">Individual</option>
 <option value="Company">Company / Corporate representative</option>
 <option value="Group">Group / Team</option>
 <option value="Government">Government Entity</option>
 <option value="NGO">NGO</option>
 </select>
 </div>

 <div>
 <label className="font-semibold block mb-1">Account Status</label>
 <select
 value={contactForm.status}
 onChange={(e) => setContactForm({ ...contactForm, status: e.target.value as any })}
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg font-medium"
 >
 <option value="ACTIVE">Active Member</option>
 <option value="LEAD">Prospect / Lead</option>
 <option value="INACTIVE">Inactive</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold block mb-1">Associated Tenant Company</label>
 <select
 value={contactForm.companyId}
 onChange={(e) => setContactForm({ ...contactForm, companyId: e.target.value })}
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg font-medium"
 >
 <option value="">-- None (Personal Client) --</option>
 {companies.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="font-semibold block mb-1">Lead Referral Source</label>
 <input
 type="text"
 value={contactForm.leadSource}
 onChange={(e) => setContactForm({ ...contactForm, leadSource: e.target.value })}
 placeholder="Walk-in, Website Form, Referral"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>
 </div>

 <div>
 <label className="font-semibold block mb-1">Tags (comma separated)</label>
 <input
 type="text"
 value={contactForm.tagsString}
 onChange={(e) => setContactForm({ ...contactForm, tagsString: e.target.value })}
 placeholder="coworking, premium-member, tech-startup"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
 <Button type="button" variant="outline" onClick={() => { setIsContactModalOpen(false); setEditingContactId(null); }}>
 Cancel
 </Button>
 <Button type="submit" className="bg-[#1E3A8A] text-white hover:bg-blue-700 font-bold">
 {editingContactId ? 'Save Changes' : 'Create Customer'}
 </Button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {isCompanyModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC]/70 backdrop-blur-sm">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-xl w-full p-6 space-y-4"
 >
 <div className="flex items-center justify-between border-b border-gray-200 pb-3">
 <h3 className="font-bold text-lg text-[#111827] flex items-center gap-2">
 <Building2 className="w-5 h-5 text-[#84CC16]" />
 Register Corporate Tenant Entity
 </h3>
 <button onClick={() => setIsCompanyModalOpen(false)} className="text-[#6B7280] hover:text-[#111827]">
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleCompanySubmit} className="space-y-3 text-xs">
 <div>
 <label className="font-semibold block mb-1">Company Name *</label>
 <input
 type="text"
 value={companyForm.name}
 onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
 required
 placeholder="Chapa Technologies"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold block mb-1">Company Domain / Website</label>
 <input
 type="text"
 value={companyForm.domain || companyForm.website}
 onChange={(e) => setCompanyForm({ ...companyForm, domain: e.target.value, website: e.target.value })}
 placeholder="chapa.co"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div>
 <label className="font-semibold block mb-1">Industry Vertical</label>
 <input
 type="text"
 value={companyForm.industry}
 onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
 placeholder="Fintech, EdTech, AgriTech, etc."
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold block mb-1">Company Size (Employees)</label>
 <select
 value={companyForm.size}
 onChange={(e) => setCompanyForm({ ...companyForm, size: e.target.value })}
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg font-medium"
 >
 <option value="">Select size...</option>
 <option value="1-5">1-5 Micro-team</option>
 <option value="6-15">6-15 Emerging Startup</option>
 <option value="16-50">16-50 Medium Scale Enterprise</option>
 <option value="51-200">51-200 Large Enterprise</option>
 <option value="201+">201+ Multinational</option>
 </select>
 </div>

 <div>
 <label className="font-semibold block mb-1">Contact Phone Number</label>
 <input
 type="text"
 value={companyForm.phone}
 onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
 placeholder="+251 116 543210"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>
 </div>

 <div>
 <label className="font-semibold block mb-1">Tags (comma separated)</label>
 <input
 type="text"
 value={companyForm.tagsString}
 onChange={(e) => setCompanyForm({ ...companyForm, tagsString: e.target.value })}
 placeholder="fintech, premium-tenant, bole-branch"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
 <Button type="button" variant="outline" onClick={() => setIsCompanyModalOpen(false)}>
 Cancel
 </Button>
 <Button type="submit" className="bg-[#84CC16] text-[#111827] font-bold">
 Register Company
 </Button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* 7. CUSTOMER PROFILE MODAL */}
 <AnimatePresence>
 {selectedContact && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC]/70 backdrop-blur-sm">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
 >
 {/* Profile Header */}
 <div className="p-6 bg-white text-[#111827] flex items-start justify-between">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-[#84CC16] text-[#111827] font-black text-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
 {selectedContact.firstName.charAt(0)}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-xl font-extrabold text-[#111827]">
 {selectedContact.firstName} {selectedContact.lastName}
 </h2>
 <span className="px-2.5 py-0.5 bg-blue-600 text-white/20 text-blue-600 text-xs font-semibold rounded-full border border-sky-400/30">
 {selectedContact.customerType || 'Individual'}
 </span>
 </div>
 <p className="text-xs text-[#6B7280]">{selectedContact.email} • {selectedContact.phone || 'No phone'}</p>
 </div>
 </div>

 <button
 onClick={() => setSelectedContact(null)}
 className="text-[#6B7280] hover:text-[#111827] p-1 rounded-lg"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Profile Tabs */}
 <div className="flex border-b border-gray-200 px-6 bg-[#F8FAFC] text-xs font-bold gap-4">
 <button
 onClick={() => setActiveProfileTab('overview')}
 className={`py-3 border-b-2 ${
 activeProfileTab === 'overview'
 ? 'border-sky-600 text-[#1E3A8A] '
 : 'border-transparent text-[#6B7280]'
 }`}
 >
 Overview & Details
 </button>
 <button
 onClick={() => setActiveProfileTab('invoices')}
 className={`py-3 border-b-2 ${
 activeProfileTab === 'invoices'
 ? 'border-sky-600 text-[#1E3A8A] '
 : 'border-transparent text-[#6B7280]'
 }`}
 >
 Invoice History ({selectedContact.integrations?.invoices?.length || 0})
 </button>
 <button
 onClick={() => setActiveProfileTab('bookings')}
 className={`py-3 border-b-2 ${
 activeProfileTab === 'bookings'
 ? 'border-sky-600 text-[#1E3A8A] '
 : 'border-transparent text-[#6B7280]'
 }`}
 >
 Bookings ({selectedContact.integrations?.bookings?.length || 0})
 </button>
 <button
 onClick={() => setActiveProfileTab('notes')}
 className={`py-3 border-b-2 ${
 activeProfileTab === 'notes'
 ? 'border-sky-600 text-[#1E3A8A] '
 : 'border-transparent text-[#6B7280]'
 }`}
 >
 Notes & Timeline ({selectedContact.notes?.length || 0})
 </button>
 </div>

 {/* Profile Body */}
 <div className="p-6 overflow-y-auto flex-1 space-y-4">
 {activeProfileTab === 'overview' && (
 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 bg-[#F8FAFC] rounded-xl space-y-2 border border-gray-200 ">
 <h4 className="font-bold text-xs text-[#6B7280] uppercase">Contact Information</h4>
 <p className="text-sm">Email: {selectedContact.email}</p>
 <p className="text-sm">Phone: {selectedContact.phone || 'N/A'}</p>
 <p className="text-sm">Status: {selectedContact.status}</p>
 </div>
 <div className="p-4 bg-[#F8FAFC] rounded-xl space-y-2 border border-gray-200 ">
 <h4 className="font-bold text-xs text-[#6B7280] uppercase">Tags & Categories</h4>
 <div className="flex flex-wrap gap-1">
 {selectedContact.tags?.map((t: string) => (
 <span key={t} className="px-2 py-0.5 bg-gray-200 rounded text-xs">
 {t}
 </span>
 ))}
 </div>
 </div>
 </div>
 )}

 {activeProfileTab === 'invoices' && (
 <div className="space-y-3">
 <h4 className="font-bold text-sm text-[#111827]">Workspace Invoices</h4>
 {selectedContact.integrations?.invoices?.length === 0 ? (
 <p className="text-xs text-[#6B7280]">No invoices generated for this contact.</p>
 ) : (
 selectedContact.integrations?.invoices?.map((inv: any) => (
 <div key={inv._id || inv.id} className="p-4 bg-[#F8FAFC] border border-gray-200 rounded-xl flex items-center justify-between text-xs">
 <div>
 <span className="font-mono font-bold text-[#1E3A8A]">{inv.invoiceNumber}</span>
 <span className="ml-2 font-medium">{inv.workspaceName}</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-bold">{inv.grandTotal || inv.amount} ETB</span>
 <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-[#4D7C0F]">
 {inv.status}
 </span>
 </div>
 </div>
 ))
 )}
 </div>
 )}

 {activeProfileTab === 'notes' && (
 <div className="space-y-4">
 <form onSubmit={handleAddNoteSubmit} className="space-y-2">
 <textarea
 value={newNoteText}
 onChange={(e) => setNewNoteText(e.target.value)}
 placeholder="Add a new note or interaction log..."
 className="w-full p-3 text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none"
 />
 <Button size="sm" className="bg-[#1E3A8A] text-white text-xs">Save Note</Button>
 </form>

 <div className="space-y-2">
 {selectedContact.notes?.map((n: any, idx: number) => (
 <div key={idx} className="p-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs space-y-1">
 <div className="flex justify-between text-[#6B7280]">
 <span className="font-bold">{n.author}</span>
 <span>{new Date(n.createdAt).toLocaleString()}</span>
 </div>
 <p className="text-[#111827] ">{n.content}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* 8. CREATE WORKSPACE INVOICE MODAL */}
 <AnimatePresence>
 {isCreateInvoiceOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC]/70 backdrop-blur-sm">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-xl w-full p-6 space-y-4"
 >
 <div className="flex items-center justify-between border-b border-gray-200 pb-3">
 <h3 className="font-bold text-lg text-[#111827] flex items-center gap-2">
 <Receipt className="w-5 h-5 text-[#84CC16]" />
 Create New Workspace Invoice
 </h3>
 <button onClick={() => setIsCreateInvoiceOpen(false)} className="text-[#6B7280] hover:text-[#111827]">
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3 text-xs">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold block mb-1">Customer Name</label>
 <input
 type="text"
 value={invoiceForm.userName}
 onChange={(e) => setInvoiceForm({ ...invoiceForm, userName: e.target.value })}
 required
 placeholder="e.g. Samuel Kebede"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
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
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold block mb-1">Workspace Reserved</label>
 <select
 value={invoiceForm.workspaceName}
 onChange={(e) => setInvoiceForm({ ...invoiceForm, workspaceName: e.target.value })}
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 >
 <option value="Executive Coworking Suite">Executive Coworking Suite</option>
 <option value="Hot Desk Flex Desk">Hot Desk Flex Desk</option>
 <option value="Private Office Suite 402">Private Office Suite 402</option>
 <option value="Main Event Hall Venue">Main Event Hall Venue</option>
 <option value="Meeting Room B">Meeting Room B</option>
 </select>
 </div>

 <div>
 <label className="font-semibold block mb-1">Customer Type</label>
 <select
 value={invoiceForm.customerType}
 onChange={(e) => setInvoiceForm({ ...invoiceForm, customerType: e.target.value })}
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 >
 <option value="Individual">Individual</option>
 <option value="Company">Company</option>
 <option value="Group">Group</option>
 <option value="Government">Government</option>
 <option value="NGO">NGO</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="font-semibold block mb-1">Unit Price (ETB)</label>
 <input
 type="number"
 value={invoiceForm.unitPrice}
 onChange={(e) => setInvoiceForm({ ...invoiceForm, unitPrice: Number(e.target.value) })}
 required
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div>
 <label className="font-semibold block mb-1">Quantity</label>
 <input
 type="number"
 value={invoiceForm.durationQuantity}
 onChange={(e) => setInvoiceForm({ ...invoiceForm, durationQuantity: Number(e.target.value) })}
 required
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div>
 <label className="font-semibold block mb-1">Due Date</label>
 <input
 type="date"
 value={invoiceForm.dueDate}
 onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
 required
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>
 </div>

 <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
 <Button type="button" variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>
 Cancel
 </Button>
 <Button type="submit" className="bg-[#84CC16] text-[#111827] font-bold">
 Generate Invoice
 </Button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* 9. RECORD PAYMENT MODAL */}
 <AnimatePresence>
 {isRecordPaymentOpen && activeInvoice && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC]/70 backdrop-blur-sm">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4"
 >
 <div className="flex items-center justify-between border-b border-gray-200 pb-3">
 <h3 className="font-bold text-lg text-[#111827] flex items-center gap-2">
 <DollarSign className="w-5 h-5 text-[#84CC16]" />
 Record Invoice Payment
 </h3>
 <button onClick={() => setIsRecordPaymentOpen(false)} className="text-[#6B7280] hover:text-[#111827]">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-3 bg-[#F8FAFC] rounded-xl text-xs space-y-1">
 <div className="font-bold">Invoice #: {activeInvoice.invoiceNumber}</div>
 <div className="text-[#6B7280]">Customer: {activeInvoice.billingDetails?.name || activeInvoice.userEmail}</div>
 <div className="text-[#6B7280]">Total: {activeInvoice.grandTotal || activeInvoice.amount} ETB</div>
 </div>

 <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
 <div>
 <label className="font-semibold block mb-1">Amount Paid (ETB)</label>
 <input
 type="number"
 value={paymentForm.amount}
 onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
 required
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div>
 <label className="font-semibold block mb-1">Payment Method</label>
 <select
 value={paymentForm.paymentMethod}
 onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 >
 <option value="Telebirr">Telebirr Super App</option>
 <option value="CBE Birr">CBE Birr / Direct Transfer</option>
 <option value="ArifPay">ArifPay Gateway</option>
 <option value="Chapa">Chapa Payment</option>
 <option value="Cash">Cash at Reception</option>
 </select>
 </div>

 <div>
 <label className="font-semibold block mb-1">Transaction Ref / Receipt #</label>
 <input
 type="text"
 value={paymentForm.referenceNumber}
 onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
 placeholder="TX-12938192"
 className="w-full p-2 bg-[#F8FAFC] border border-gray-200 rounded-lg"
 />
 </div>

 <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
 <Button type="button" variant="outline" onClick={() => setIsRecordPaymentOpen(false)}>
 Cancel
 </Button>
 <Button type="submit" className="bg-emerald-600 text-white font-bold">
 Confirm Payment Received
 </Button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* 10. PRINTABLE A4 INVOICE MODAL */}
 <AnimatePresence>
 {isPrintInvoiceOpen && activeInvoice && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC]/80 backdrop-blur-md overflow-y-auto">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white text-[#111827] rounded-2xl border border-gray-200 shadow-2xl max-w-3xl w-full my-8 p-8 space-y-6 relative print:p-0 print:shadow-none"
 >
 {/* Floating Action Controls */}
 <div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
 <div className="flex items-center gap-2">
 <Receipt className="w-5 h-5 text-[#1E3A8A]" />
 <span className="font-bold text-sm text-[#111827]">Official A4 Workspace Invoice</span>
 </div>
 <div className="flex items-center gap-2">
 <Button size="sm" className="bg-[#1E3A8A] text-white hover:bg-blue-700 text-xs" onClick={() => window.print()}>
 <Printer className="w-3.5 h-3.5 mr-1.5" />
 Print A4 Document
 </Button>
 <button onClick={() => setIsPrintInvoiceOpen(false)} className="text-[#6B7280] hover:text-[#111827] p-1">
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* A4 Document Header */}
 <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
 <div>
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white font-black flex items-center justify-center text-sm">
 WV
 </div>
 <span className="text-xl font-black text-[#111827] tracking-tight">WEVENTUREHUB</span>
 </div>
 <p className="text-xs text-[#6B7280] font-medium mt-1">WeVentureHub Business Center PLC</p>
 <p className="text-[11px] text-[#6B7280]">Bole Road, Mega Building 4th Floor, Addis Ababa, Ethiopia</p>
 <p className="text-[11px] text-[#6B7280]">TIN: 0098412894 | Tel: +251 911 223 344 | Web: www.weventurehub.com</p>
 </div>

 <div className="text-right space-y-1">
 <h2 className="text-2xl font-black text-[#111827] tracking-wider">INVOICE</h2>
 <div className="text-xs font-mono font-bold text-[#1E3A8A]">#{activeInvoice.invoiceNumber}</div>
 <div className="text-[11px] text-[#6B7280]">Issued: {new Date(activeInvoice.createdAt || Date.now()).toLocaleDateString()}</div>
 <div className="text-[11px] text-[#6B7280]">Due: {activeInvoice.dueDate ? new Date(activeInvoice.dueDate).toLocaleDateString() : 'Upon Receipt'}</div>
 </div>
 </div>

 {/* Status Watermark Badge */}
 <div className="flex justify-between items-center bg-[#F8FAFC] p-4 rounded-xl border border-gray-200">
 <div>
 <span className="text-[10px] font-bold uppercase text-[#6B7280] block">Billed To</span>
 <div className="font-bold text-sm text-[#111827]">{activeInvoice.billingDetails?.name || activeInvoice.userEmail}</div>
 <div className="text-xs text-[#6B7280]">{activeInvoice.billingDetails?.company || 'Individual Client'}</div>
 <div className="text-xs text-[#6B7280]">{activeInvoice.billingDetails?.email || activeInvoice.userEmail}</div>
 </div>

 <div className="text-right">
 <span className="text-[10px] font-bold uppercase text-[#6B7280] block mb-1">Invoice Status</span>
 <span
 className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
 activeInvoice.status === 'Paid' || activeInvoice.status === 'PAID'
 ? 'bg-emerald-100 text-[#4D7C0F] border border-emerald-300'
 : activeInvoice.status === 'Overdue'
 ? 'bg-rose-100 text-rose-800 border border-rose-300'
 : 'bg-amber-100 text-amber-800 border border-amber-300'
 }`}
 >
 {activeInvoice.status}
 </span>
 </div>
 </div>

 {/* Invoice Items Table */}
 <table className="w-full text-left border-collapse text-xs">
 <thead>
 <tr className="border-b-2 border-gray-200 text-[#6B7280] uppercase text-[10px] font-bold">
 <th className="py-2">Description / Workspace</th>
 <th className="py-2 text-center">Qty</th>
 <th className="py-2 text-right">Unit Price</th>
 <th className="py-2 text-right">Line Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 <tr>
 <td className="py-3 font-medium text-[#111827]">
 {activeInvoice.workspaceName || 'Executive Coworking Suite'}
 <span className="block text-[10px] text-[#6B7280]">WeVentureHub Premium Space Allocation</span>
 </td>
 <td className="py-3 text-center">{activeInvoice.durationQuantity || 1}</td>
 <td className="py-3 text-right">{(activeInvoice.amount || activeInvoice.grandTotal || 0).toLocaleString()} ETB</td>
 <td className="py-3 text-right font-bold font-mono">{(activeInvoice.amount || activeInvoice.grandTotal || 0).toLocaleString()} ETB</td>
 </tr>
 </tbody>
 </table>

 {/* Total Calculation Box */}
 <div className="flex justify-end pt-4 border-t border-gray-200">
 <div className="w-64 space-y-2 text-xs">
 <div className="flex justify-between text-[#6B7280]">
 <span>Subtotal:</span>
 <span>{(activeInvoice.amount || activeInvoice.grandTotal || 0).toLocaleString()} ETB</span>
 </div>
 <div className="flex justify-between text-[#6B7280]">
 <span>15% VAT:</span>
 <span>{(activeInvoice.vat || 0).toLocaleString()} ETB</span>
 </div>
 <div className="flex justify-between font-bold text-sm text-[#111827] border-t border-gray-300 pt-2">
 <span>Grand Total:</span>
 <span className="text-[#1E3A8A]">{(activeInvoice.grandTotal || activeInvoice.amount || 0).toLocaleString()} ETB</span>
 </div>
 </div>
 </div>

 {/* Footer Bank & Signature Stamp */}
 <div className="border-t border-gray-200 pt-6 text-[11px] text-[#6B7280] flex justify-between items-end">
 <div>
 <div className="font-bold text-[#111827] mb-1">Payment Instructions</div>
 <div>Commercial Bank of Ethiopia (CBE): 100012948192</div>
 <div>Telebirr Merchant Code: 889911 (WeVentureHub)</div>
 </div>

 <div className="text-center space-y-1">
 <div className="w-32 h-10 border-b border-dashed border-gray-400 mx-auto"></div>
 <div className="text-[10px] font-semibold text-[#6B7280]">Authorized Signature & Stamp</div>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
