import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Mail,
  Receipt,
  Copy,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Landmark,
  User,
  Phone,
  Layers,
  Check,
  Send,
  X,
  FileCheck,
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';
import { useAppSelector } from '../store';
import { UserRole } from '../types';
import { axiosInstance } from '../lib/axiosInstance';
import {
  quotationApi,
  IQuotation,
  IQuotationItem,
  IQuotationStats,
  ISettlementBank,
} from '../lib/quotationApi';
import WeVentureLogo from '../components/WeVentureLogo';
import { numberToWords, WEVENTURE_SUPPLIER_INFO, WEVENTURE_BANKS, getBankRecords } from '../utils/invoiceUtils';

const DEFAULT_AMENITIES = [
  'High-Speed Dedicated Fiber Wi-Fi (Dual Redundancy)',
  'Uninterruptible Power Supply (UPS) & Backup Generator',
  'Electronic presentation display screens & 75" 4K Smart TVs',
  'High-fidelity sound system & dual wireless microphones',
  'Ergonomic workstation furniture and executive seating',
  'Complimentary printing, scanning, and document copying',
  'Full access to executive lounge, kitchenette & barista coffee stations',
  '24/7 Biometric access & round-the-clock facility security guards',
  'On-site IT support and reception guest greeting services',
  'Free tea, premium Ethiopian coffee & filtered spring water',
];

const PRESET_SERVICES = [
  { name: 'Executive Private Office (Large Suite)', priceUsd: 1200, priceEtb: 180000, desc: 'Dedicated 8-person private office with executive furniture' },
  { name: 'Dedicated Private Office (Standard)', priceUsd: 650, priceEtb: 98000, desc: 'Dedicated 4-person secure office space' },
  { name: 'Dedicated Desk Membership (Monthly)', priceUsd: 220, priceEtb: 33000, desc: 'Assigned personal workspace with lockable pedestal' },
  { name: 'Flexi Hot Desk (Monthly Pass)', priceUsd: 150, priceEtb: 22500, desc: 'Open workspace hot desk with hub access' },
  { name: 'Boardroom & Conference Suite (Full Day)', priceUsd: 400, priceEtb: 60000, desc: '25-person high-tech boardroom with video conferencing' },
  { name: 'Meeting Room (Hourly Booking)', priceUsd: 35, priceEtb: 5000, desc: '10-person meeting room with 4K screen and whiteboards' },
  { name: 'Event Hall & Auditorium (Full Day)', priceUsd: 1500, priceEtb: 225000, desc: '150-capacity event hall with stage, audio, and lighting' },
  { name: 'Training & Workshop Studio', priceUsd: 500, priceEtb: 75000, desc: '40-capacity modular workshop setup with projectors' },
  { name: 'Virtual Office & Corporate Business Address', priceUsd: 80, priceEtb: 12000, desc: 'Official company address, mail handling, and 4h room credits' },
];

export default function QuotationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const printableRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.TENANT_ADMIN ||
    user?.role === UserRole.STAFF;

  // Data states
  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [stats, setStats] = useState<IQuotationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [banks, setBanks] = useState<ISettlementBank[]>([]);
  const [crmContacts, setCrmContacts] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currencyFilter, setCurrencyFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isBanksModalOpen, setIsBanksModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Active / Selected Quotation
  const [selectedQuotation, setSelectedQuotation] = useState<IQuotation | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Email form state
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailCustomMessage, setEmailCustomMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  // Bank form state
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('WE VENTURE HOLDINGS PLC');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBranch, setNewBranch] = useState('');

  // Notification / Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Form State for Create / Edit
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formTinNumber, setFormTinNumber] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formQuotationNumber, setFormQuotationNumber] = useState('');
  const [formQuotationDate, setFormQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [formPreparedBy, setFormPreparedBy] = useState(
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'WeVentureHub Sales Team' : 'WeVentureHub Sales Team'
  );
  const [formCurrency, setFormCurrency] = useState<'USD' | 'ETB'>('USD');
  const [formExchangeRate, setFormExchangeRate] = useState<number>(153.09);
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formNotes, setFormNotes] = useState(
    'Thank you for choosing WeVentureHub Workspace Solutions. We look forward to partnering with you.'
  );
  const [formPaymentTerms, setFormPaymentTerms] = useState(
    'Payment terms: 100% advance deposit upon contract execution or official acceptance. Bank transfer details listed below.'
  );
  const [formItems, setFormItems] = useState<IQuotationItem[]>([
    {
      itemName: 'Executive Coworking Space Rental',
      description: 'Dedicated office workspace with full access to hub amenities',
      quantity: 1,
      unitPrice: 500,
      amount: 500,
    },
  ]);
  const [formAmenities, setFormAmenities] = useState<string[]>(DEFAULT_AMENITIES.slice(0, 7));
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [formSelectedBanks, setFormSelectedBanks] = useState<string[]>([
    'Dashen Bank',
    'Commercial Bank of Ethiopia',
  ]);

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [quotesRes, statsRes, banksRes] = await Promise.all([
        quotationApi.getQuotations({
          search: searchQuery,
          status: statusFilter,
          currency: currencyFilter,
          startDate,
          endDate,
          sort: sortBy,
        }),
        quotationApi.getQuotationStats(),
        quotationApi.getSettlementBanks(),
      ]);

      setQuotations(quotesRes?.data || []);
      setStats(statsRes || null);
      setBanks(banksRes || []);
    } catch (err) {
      console.error('Error fetching quotations data:', err);
      showToast('error', 'Failed to load quotations data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, currencyFilter, sortBy]);

  // Load CRM contacts and workspaces once for helper auto-fill
  useEffect(() => {
    axiosInstance
      .get('/crm/contacts')
      .then((res) => setCrmContacts(res.data?.data || []))
      .catch(() => {});
    axiosInstance
      .get('/workspaces')
      .then((res) => setWorkspaces(res.data?.data || []))
      .catch(() => {});
  }, []);

  // Calculate live totals in form
  const formCalculations = useMemo(() => {
    const rawTotal = formItems.reduce((acc, item) => {
      const q = Math.max(1, Number(item.quantity) || 1);
      const r = Math.max(0, Number(item.unitPrice) || 0);
      return acc + q * r;
    }, 0);

    const discount = Math.min(rawTotal, Math.max(0, Number(formDiscount) || 0));
    const grandTotal = Math.max(0, Math.round((rawTotal - discount) * 100) / 100);
    const convertedEtb =
      formCurrency === 'USD'
        ? Math.round(grandTotal * (Number(formExchangeRate) || 153.09) * 100) / 100
        : grandTotal;
    const words = numberToWords(grandTotal, formCurrency);

    return {
      discount,
      grandTotal,
      convertedEtb,
      words,
    };
  }, [formItems, formDiscount, formCurrency, formExchangeRate]);

  // Open Create Form with fresh state
  const handleOpenCreate = async () => {
    try {
      const nextNum = await quotationApi.getNextNumber();
      setFormQuotationNumber(nextNum || 'QUO-WV-1001');
    } catch {
      setFormQuotationNumber('QUO-WV-1001');
    }
    setIsEditing(false);
    setSelectedQuotation(null);
    setFormCustomerName('');
    setFormCompanyName('');
    setFormTinNumber('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormQuotationDate(new Date().toISOString().slice(0, 10));
    setFormCurrency('USD');
    setFormExchangeRate(153.09);
    setFormDiscount(0);
    setFormNotes(
      'Thank you for choosing WeVentureHub Workspace Solutions. We look forward to partnering with you.'
    );
    setFormPaymentTerms(
      'Payment terms: 100% advance deposit upon contract execution or official acceptance. Bank transfer details listed below.'
    );
    setFormItems([
      {
        itemName: 'Executive Coworking Space Rental',
        description: 'Dedicated office workspace with full access to hub amenities',
        quantity: 1,
        unitPrice: 500,
        amount: 500,
      },
    ]);
    setFormAmenities(DEFAULT_AMENITIES.slice(0, 7));
    setFormSelectedBanks(WEVENTURE_BANKS.map((b) => b.bankName));
    setIsCreateModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (q: IQuotation) => {
    setSelectedQuotation(q);
    setIsEditing(true);
    setFormQuotationNumber(q.quotationNumber);
    setFormCustomerName(q.customerName || '');
    setFormCompanyName(q.companyName || '');
    setFormTinNumber(q.tinNumber || '');
    setFormEmail(q.email || '');
    setFormPhone(q.phone || '');
    setFormAddress(q.address || '');
    setFormQuotationDate(q.quotationDate ? new Date(q.quotationDate).toISOString().slice(0, 10) : '');
    setFormPreparedBy(q.preparedBy || '');
    setFormCurrency(q.currency || 'USD');
    setFormExchangeRate(q.exchangeRate || 153.09);
    setFormDiscount(q.discount || 0);
    setFormNotes(q.notes || 'Thank you for choosing WeVentureHub Workspace Solutions. We look forward to partnering with you.');
    setFormPaymentTerms(q.paymentTerms || '');
    setFormItems(
      (q.items || []).map((item) => ({
        serviceId: item.serviceId,
        itemName: item.itemName,
        description: item.description || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      }))
    );
    setFormAmenities(q.amenities || DEFAULT_AMENITIES.slice(0, 7));
    setFormSelectedBanks(q.selectedBanks || WEVENTURE_BANKS.map((b) => b.bankName));
    setIsCreateModalOpen(true);
  };

  // Select CRM contact to auto-fill
  const handleSelectCrmContact = (c: any) => {
    if (!c) return;
    setFormCustomerName(`${c.firstName || ''} ${c.lastName || ''}`.trim());
    setFormEmail(c.email || '');
    setFormPhone(c.phone || '');
    if (c.companyName) setFormCompanyName(c.companyName);
    if (c.tinNumber) setFormTinNumber(c.tinNumber);
    if (c.address) setFormAddress(c.address);
  };

  // Handle Items Table Changes
  const handleItemChange = (index: number, field: keyof IQuotationItem, value: any) => {
    setFormItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = Math.max(1, Number(field === 'quantity' ? value : target.quantity) || 1);
        const r = Math.max(0, Number(field === 'unitPrice' ? value : target.unitPrice) || 0);
        target.amount = Math.round(q * r * 100) / 100;
      }
      copy[index] = target;
      return copy;
    });
  };

  const handleAddItem = (preset?: { name: string; priceUsd: number; priceEtb: number; desc: string }) => {
    if (preset) {
      const unitPrice = formCurrency === 'USD' ? preset.priceUsd : preset.priceEtb;
      setFormItems((prev) => [
        ...prev,
        {
          itemName: preset.name,
          description: preset.desc,
          quantity: 1,
          unitPrice,
          amount: unitPrice,
        },
      ]);
    } else {
      setFormItems((prev) => [
        ...prev,
        {
          itemName: 'Custom Workspace Service',
          description: '',
          quantity: 1,
          unitPrice: formCurrency === 'USD' ? 100 : 15000,
          amount: formCurrency === 'USD' ? 100 : 15000,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length <= 1) {
      showToast('error', 'At least one item is required in a quotation');
      return;
    }
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Quotation Form (Create or Edit)
  const handleSaveQuotation = async (status: string = 'Draft') => {
    if (!formCustomerName.trim()) {
      showToast('error', 'Please enter customer name');
      return;
    }
    if (!formEmail.trim()) {
      showToast('error', 'Please enter customer email');
      return;
    }
    if (formItems.length === 0) {
      showToast('error', 'Please add at least one quotation line item');
      return;
    }

    try {
      const payload: Partial<IQuotation> = {
        quotationNumber: formQuotationNumber,
        customerName: formCustomerName.trim(),
        companyName: formCompanyName.trim(),
        tinNumber: formTinNumber.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        quotationDate: formQuotationDate,
        preparedBy: formPreparedBy.trim(),
        currency: formCurrency,
        exchangeRate: Number(formExchangeRate) || 153.09,
        discount: Number(formDiscount) || 0,
        items: formItems,
        amenities: formAmenities,
        selectedBanks: formSelectedBanks,
        notes: formNotes,
        paymentTerms: formPaymentTerms,
        status: status as any,
      };

      if (isEditing && selectedQuotation) {
        await quotationApi.updateQuotation(selectedQuotation.id || (selectedQuotation as any)._id, payload);
        showToast('success', `Quotation #${formQuotationNumber} updated successfully`);
      } else {
        await quotationApi.createQuotation(payload);
        showToast('success', `Quotation #${formQuotationNumber} created successfully`);
      }

      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving quotation:', err);
      showToast('error', err?.response?.data?.error?.message || 'Failed to save quotation');
    }
  };

  // Duplicate Quotation
  const handleDuplicate = async (id: string) => {
    try {
      const dup = await quotationApi.duplicateQuotation(id);
      showToast('success', `Duplicated as Quotation #${dup.quotationNumber}`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Failed to duplicate quotation');
    }
  };

  // Delete Quotation
  const handleDelete = async (id: string, num: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete quotation #${num}?`)) return;
    try {
      await quotationApi.deleteQuotation(id);
      showToast('success', `Quotation #${num} deleted`);
      fetchData();
    } catch (err) {
      showToast('error', 'Failed to delete quotation');
    }
  };

  // Status Change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await quotationApi.updateStatus(id, newStatus);
      showToast('success', `Status updated to ${newStatus}`);
      fetchData();
      if (selectedQuotation && (selectedQuotation.id === id || (selectedQuotation as any)._id === id)) {
        setSelectedQuotation((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err) {
      showToast('error', 'Failed to update status');
    }
  };

  // Convert to Invoice
  const handleConvertToInvoice = async () => {
    if (!selectedQuotation) return;
    try {
      const res = await quotationApi.convertToInvoice(
        selectedQuotation.id || (selectedQuotation as any)._id
      );
      showToast('success', res.message || 'Quotation converted to invoice');
      setIsConvertModalOpen(false);
      setIsPreviewModalOpen(false);
      fetchData();

      // Ask if user wants to view invoice
      const goToInvoice = window.confirm(
        `Quotation successfully converted to Invoice #${res.invoice?.invoiceNumber || ''}!\n\nWould you like to open the Invoices page now?`
      );
      if (goToInvoice) {
        navigate('/dashboard/invoices');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to convert quotation to invoice');
    }
  };

  // Send Email with PDF
  const handleSendEmail = async () => {
    if (!selectedQuotation) return;
    if (!emailRecipient.trim()) {
      showToast('error', 'Recipient email is required');
      return;
    }
    try {
      setEmailSending(true);
      await quotationApi.sendEmail(
        selectedQuotation.id || (selectedQuotation as any)._id,
        emailRecipient.trim(),
        emailCustomMessage
      );
      showToast('success', `Quotation PDF successfully emailed to ${emailRecipient}`);
      setIsEmailModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', err?.response?.data?.error?.message || 'Failed to send quotation email');
    } finally {
      setEmailSending(false);
    }
  };

  // Print Document
  const handlePrint = () => {
    window.print();
  };

  // Download PDF
  const handleDownloadPdf = (q: IQuotation) => {
    try {
      showToast('success', `Generating PDF for ${q.quotationNumber}...`);
      quotationApi.downloadPdf(q.id || (q as any)._id, q.quotationNumber);
    } catch {
      showToast('error', 'Failed to download PDF');
    }
  };

  // Save new Bank
  const handleSaveBank = async () => {
    if (!newBankName || !newAccountNumber || !newBranch) {
      showToast('error', 'Please fill in Bank Name, Account Number, and Branch');
      return;
    }
    try {
      await quotationApi.saveSettlementBank({
        bankName: newBankName.trim(),
        accountName: newAccountName.trim(),
        accountNumber: newAccountNumber.trim(),
        branch: newBranch.trim(),
      });
      showToast('success', 'Bank account saved successfully');
      setNewBankName('');
      setNewAccountNumber('');
      setNewBranch('');
      const updated = await quotationApi.getSettlementBanks();
      setBanks(updated);
    } catch {
      showToast('error', 'Failed to save bank account');
    }
  };

  // Delete Bank
  const handleDeleteBank = async (name: string) => {
    if (!window.confirm(`Delete bank account ${name}?`)) return;
    try {
      await quotationApi.deleteSettlementBank(name);
      showToast('success', `Bank ${name} removed`);
      const updated = await quotationApi.getSettlementBanks();
      setBanks(updated);
    } catch {
      showToast('error', 'Failed to delete bank');
    }
  };

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const matchesNum = q.quotationNumber?.toLowerCase().includes(term);
        const matchesCust = q.customerName?.toLowerCase().includes(term);
        const matchesComp = q.companyName?.toLowerCase().includes(term);
        const matchesEmail = q.email?.toLowerCase().includes(term);
        const matchesTin = q.tinNumber?.toLowerCase().includes(term);
        if (!matchesNum && !matchesCust && !matchesComp && !matchesEmail && !matchesTin) {
          return false;
        }
      }
      if (statusFilter !== 'All' && q.status !== statusFilter) return false;
      if (currencyFilter !== 'All' && q.currency !== currencyFilter) return false;
      return true;
    });
  }, [quotations, searchQuery, statusFilter, currencyFilter]);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Accepted
          </span>
        );
      case 'Converted to Invoice':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
            <Receipt className="w-3 h-3" /> Converted to Invoice
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3" /> Sent
          </span>
        );
      case 'Viewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Eye className="w-3 h-3" /> Viewed
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Expired
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3 h-3" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-slate-900 text-white border border-[#84CC16]'
              : 'bg-rose-900 text-white border border-rose-500'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#84CC16]" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="font-semibold text-sm">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#65A30D]">
            <span>WeVentureHub Commercial</span>
            <span>•</span>
            <span>Sales & Proposals</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mt-1">
            <FileText className="w-8 h-8 text-[#84CC16]" />
            Quotations & Estimates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, manage, send, and convert official client quotations into invoices with automated USD/ETB pricing and amenities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchData();
            }}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsBanksModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            >
              <Landmark className="w-4 h-4 text-slate-500" />
              Settlement Banks ({banks.length})
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-black text-sm shadow-md shadow-[#84CC16]/20 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Quotation
            </button>
          )}
        </div>
      </div>

      {/* KPI STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalQuotations}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              ${stats.totalValueUsd.toLocaleString()} USD
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-blue-500">
              <span className="text-xs font-bold uppercase tracking-wider">Sent / Open</span>
              <Send className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-blue-600">{stats.sent + stats.viewed}</div>
            <div className="text-[11px] text-slate-500 font-medium">{stats.draft} in draft</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-emerald-500">
              <span className="text-xs font-bold uppercase tracking-wider">Accepted</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.accepted}</div>
            <div className="text-[11px] text-emerald-600 font-bold">
              ${stats.acceptedValueUsd.toLocaleString()} USD
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-purple-500">
              <span className="text-xs font-bold uppercase tracking-wider">Invoiced</span>
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-purple-600">{stats.converted}</div>
            <div className="text-[11px] text-purple-600 font-bold">{stats.conversionRate}% Converted</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-amber-500">
              <span className="text-xs font-bold uppercase tracking-wider">Expired</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.expired}</div>
            <div className="text-[11px] text-slate-400 font-medium">Valid period ended</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-rose-500">
              <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-rose-600">{stats.rejected}</div>
            <div className="text-[11px] text-slate-400 font-medium">Declined by client</div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quotation #, client name, company, email, TIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Viewed">Viewed</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
            <option value="Converted to Invoice">Converted to Invoice</option>
          </select>

          {/* Currency filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
          >
            <option value="All">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="ETB">ETB (Birr)</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Highest Value</option>
            <option value="amount_asc">Lowest Value</option>
          </select>
        </div>
      </div>

      {/* QUOTATIONS DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#84CC16]" />
            <p className="font-semibold text-sm">Loading quotations...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No quotations found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your search query or filters to find what you are looking for.'
                : 'Get started by creating your first official client quotation.'}
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-bold text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Create First Quotation
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Quotation #</th>
                  <th className="py-3.5 px-4">Client / Company</th>
                  <th className="py-3.5 px-4">Quotation Date</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredQuotations.map((q) => {
                  return (
                    <tr
                      key={q.id || (q as any)._id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedQuotation(q);
                        setIsPreviewModalOpen(true);
                      }}
                    >
                      {/* Quotation # */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-[#84CC16]/20 flex items-center justify-center text-slate-700 group-hover:text-[#65A30D] transition">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 font-mono text-sm group-hover:text-[#65A30D] transition">
                              {q.quotationNumber}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              By {q.preparedBy || 'Sales'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{q.customerName}</div>
                        {q.companyName && (
                          <div className="text-[11px] text-[#65A30D] font-semibold flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {q.companyName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">{q.email}</div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-bold">
                          {new Date(q.quotationDate).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Prepared by: {q.preparedBy || 'Sales'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 font-mono text-sm">
                          {(q.grandTotal || 0).toLocaleString()} {q.currency}
                        </div>
                        {q.currency === 'USD' && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            ≈ {(q.convertedEtbTotal || 0).toLocaleString()} ETB
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(q.status)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview / View */}
                          <button
                            onClick={() => {
                              setSelectedQuotation(q);
                              setIsPreviewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                            title="Preview Quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEdit(q)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                              title="Edit Quotation"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Send Email */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setSelectedQuotation(q);
                                setEmailRecipient(q.email || '');
                                setEmailCustomMessage('');
                                setIsEmailModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600 hover:text-blue-700 transition"
                              title="Send Email with PDF"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPdf(q)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Duplicate */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDuplicate(q.id || (q as any)._id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                              title="Duplicate Quotation"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}

                          {/* Convert to Invoice */}
                          {isAdmin && q.status !== 'Converted to Invoice' && (
                            <button
                              onClick={() => {
                                setSelectedQuotation(q);
                                setIsConvertModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-[#84CC16]/20 hover:bg-[#84CC16] text-slate-900 transition"
                              title="Convert to Invoice"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(q.id || (q as any)._id, q.quotationNumber)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition"
                              title="Delete Quotation"
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. CREATE / EDIT QUOTATION MODAL */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#84CC16] flex items-center justify-center text-slate-950 font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {isEditing ? `Edit Quotation #${formQuotationNumber}` : 'Create New Quotation'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure customer details, workspace packages, currency conversions, and amenities.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* SECTION 1: CUSTOMER INFORMATION */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#84CC16]" /> 1. Customer Information
                  </div>

                  {/* CRM Quick Picker */}
                  {crmContacts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">Select Existing Client:</span>
                      <select
                        onChange={(e) => {
                          const contact = crmContacts.find((c) => c.id === e.target.value || c._id === e.target.value);
                          if (contact) handleSelectCrmContact(contact);
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-[#84CC16]"
                      >
                        <option value="">-- Choose CRM Contact --</option>
                        {crmContacts.map((c) => (
                          <option key={c.id || c._id} value={c.id || c._id}>
                            {c.firstName} {c.lastName} {c.companyName ? `(${c.companyName})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abel Bekele / Sarah Jenkins"
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. AfriTech Solutions Ltd."
                      value={formCompanyName}
                      onChange={(e) => setFormCompanyName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Customer TIN Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 0098765432"
                      value={formTinNumber}
                      onChange={(e) => setFormTinNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. client@company.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +251 91 123 4567"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Physical Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Bole Subcity, Addis Ababa"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: QUOTATION SCHEDULE & CURRENCY */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#84CC16]" /> 2. Quotation Details & Currency
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Quotation Number</label>
                    <input
                      type="text"
                      readOnly
                      value={formQuotationNumber}
                      className="w-full px-3 py-2 bg-slate-200/70 font-mono font-bold text-slate-800 border border-slate-300 rounded-xl text-xs cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Quotation Date</label>
                    <input
                      type="date"
                      value={formQuotationDate}
                      onChange={(e) => setFormQuotationDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#84CC16]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Prepared By / Salesperson</label>
                    <input
                      type="text"
                      value={formPreparedBy}
                      onChange={(e) => setFormPreparedBy(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#84CC16]"
                    />
                  </div>
                </div>

                {/* Currency & Exchange Rate */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Quotation Currency</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormCurrency('USD')}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs border transition ${
                          formCurrency === 'USD'
                            ? 'bg-slate-900 text-[#84CC16] border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        USD ($)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormCurrency('ETB')}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs border transition ${
                          formCurrency === 'ETB'
                            ? 'bg-slate-900 text-[#84CC16] border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ETB (Birr)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Exchange Rate (1 USD = ETB)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={formExchangeRate}
                        onChange={(e) => setFormExchangeRate(parseFloat(e.target.value) || 153.09)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#84CC16]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">
                        Birr
                      </span>
                    </div>
                  </div>

                  {formCurrency === 'USD' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="font-bold text-amber-800 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Live Conversion Note:
                      </div>
                      <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
                        The exchange rate used is <strong>{formExchangeRate} Birr</strong>. Total: <strong>{formCalculations.convertedEtb.toLocaleString()} ETB</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: LINE ITEMS TABLE */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#84CC16]" /> 3. Quotation Items & Packages
                  </div>

                  {/* Preset Packages Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Add Quick Package:</span>
                    <select
                      onChange={(e) => {
                        const preset = PRESET_SERVICES.find((p) => p.name === e.target.value);
                        if (preset) handleAddItem(preset);
                        e.target.value = '';
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-[#84CC16]"
                    >
                      <option value="">-- Add Predefined Workspace / Service --</option>
                      {PRESET_SERVICES.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({formCurrency === 'USD' ? `$${p.priceUsd}` : `${p.priceEtb} ETB`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item / Service Description</th>
                        <th className="py-2.5 px-3 w-24 text-center">Quantity</th>
                        <th className="py-2.5 px-3 w-32 text-right">Unit Rate ({formCurrency})</th>
                        <th className="py-2.5 px-3 w-36 text-right">Amount ({formCurrency})</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 space-y-1">
                            <input
                              type="text"
                              placeholder="Service / Workspace Name"
                              value={item.itemName}
                              onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-[#84CC16]"
                            />
                            <input
                              type="text"
                              placeholder="Optional description / details..."
                              value={item.description || ''}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:ring-1 focus:ring-[#84CC16]"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-900 focus:ring-1 focus:ring-[#84CC16]"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-28 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right text-slate-900 focus:ring-1 focus:ring-[#84CC16]"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                            {(item.amount || 0).toLocaleString()} {formCurrency}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Custom Line Item
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-bold">Discount ({formCurrency}):</span>
                    <input
                      type="number"
                      min="0"
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(parseFloat(e.target.value) || 0)}
                      className="w-28 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-right text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: INCLUDED AMENITIES */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#84CC16]" /> 4. Included Hub Amenities & Services
                </div>
                <p className="text-[11px] text-slate-500">
                  Select which standard amenities are included in this quotation proposal:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_AMENITIES.map((amen) => {
                    const isChecked = formAmenities.includes(amen);
                    return (
                      <label
                        key={amen}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-[#84CC16]/10 border-[#84CC16] text-slate-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormAmenities((prev) => [...prev, amen]);
                            } else {
                              setFormAmenities((prev) => prev.filter((a) => a !== amen));
                            }
                          }}
                          className="rounded text-[#84CC16] focus:ring-[#84CC16]"
                        />
                        <span className="text-xs">{amen}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom Amenity Adder */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom amenity (e.g. Dedicated Locker, Catering service)..."
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAmenityInput.trim()) {
                        setFormAmenities((prev) => [...prev, customAmenityInput.trim()]);
                        setCustomAmenityInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold text-xs"
                  >
                    Add Amenity
                  </button>
                </div>
              </div>

              {/* SECTION 5: SETTLEMENT BANKS */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#84CC16]" /> 5. Payment Settlement Banks (Displayed on Quotation)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {banks.map((b) => {
                    const isChecked = formSelectedBanks.includes(b.bankName);
                    return (
                      <label
                        key={b.bankName}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-slate-900 text-white border-slate-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormSelectedBanks((prev) => [...prev, b.bankName]);
                            } else {
                              setFormSelectedBanks((prev) => prev.filter((name) => name !== b.bankName));
                            }
                          }}
                          className="mt-0.5 rounded text-[#84CC16] focus:ring-[#84CC16]"
                        />
                        <div>
                          <div className="text-xs font-bold">{b.bankName}</div>
                          <div className={`text-[10px] ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>
                            Acc: {b.accountNumber} ({b.branch})
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 6: TERMS & NOTES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Notes & Validity Remarks</label>
                  <textarea
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#84CC16]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Payment & Contract Terms</label>
                  <textarea
                    rows={3}
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#84CC16]"
                  />
                </div>
              </div>

              {/* LIVE TOTALS BREAKDOWN SUMMARY */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="text-xs font-bold text-[#84CC16] uppercase tracking-wider">
                  Financial Quotation Summary
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Grand Total ({formCurrency}):</span>
                    <div className="font-mono font-extrabold text-[#84CC16] text-xl">
                      {formCalculations.grandTotal.toLocaleString()} {formCurrency}
                    </div>
                  </div>
                  {formCurrency === 'USD' && (
                    <div>
                      <span className="text-slate-400">Equivalent in ETB:</span>
                      <div className="font-mono font-extrabold text-amber-400 text-xl">
                        {formCalculations.convertedEtb.toLocaleString()} ETB
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <strong className="text-slate-400">Amount in Words:</strong> {formCalculations.words}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveQuotation('Draft')}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold text-xs transition"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuotation('Sent')}
                  className="px-5 py-2 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-black text-xs shadow-md shadow-[#84CC16]/20 transition"
                >
                  {isEditing ? 'Save Changes' : 'Create & Mark Sent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OFFICIAL LIVE QUOTATION PREVIEW MODAL (PRINTABLE) */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full my-6 flex flex-col overflow-hidden max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Top Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-3">
                <FileCheck className="w-6 h-6 text-[#84CC16]" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Official Quotation Preview — {selectedQuotation.quotationNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Status: <span className="text-[#84CC16] font-bold">{selectedQuotation.status}</span> | Date: {new Date(selectedQuotation.quotationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => handleDownloadPdf(selectedQuotation)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 rounded-xl text-xs font-black transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEmailRecipient(selectedQuotation.email || '');
                      setEmailCustomMessage('');
                      setIsEmailModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                )}
                {isAdmin && selectedQuotation.status !== 'Converted to Invoice' && (
                  <button
                    onClick={() => setIsConvertModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 rounded-xl text-xs font-black transition"
                  >
                    <Receipt className="w-3.5 h-3.5" /> Convert to Invoice
                  </button>
                )}
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE OFFICIAL DOCUMENT BOX MATCHING INVOICE DESIGN */}
            <div
              id="printable-quotation"
              ref={printableRef}
              className="bg-white text-neutral-900 rounded-3xl p-8 md:p-12 print:p-0 border border-neutral-200 print:border-none space-y-6 print:space-y-1.5 shadow-sm font-sans overflow-y-auto flex-1"
            >
              {/* Official Header & Branding with WEVENTURE Logo + WEVENTURE Header Text ABOVE Lemon Line */}
              <div className="space-y-4 print:space-y-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:gap-2">
                  <div className="flex items-center gap-4 print:gap-2.5">
                    <WeVentureLogo size={70} mode="light" />
                    <div>
                      <span className="font-display font-black text-3xl md:text-4xl print:text-xl text-neutral-900 tracking-tight block leading-tight">
                        WEVENTURE
                      </span>
                      <span className="text-xs md:text-sm print:text-[8.5px] font-extrabold text-[#84CC16] tracking-widest uppercase block mt-0.5">
                        EVENT & WORKSPACE MANAGEMENT PLATFORM
                      </span>
                    </div>
                  </div>
                </div>

                {/* THE VIBRANT LEMON GREEN ACCENT LINE */}
                <div className="w-full h-2 print:h-1 bg-[#84CC16] rounded-full my-4 print:my-1" />

                {/* OFFICIAL QUOTATION META BANNER UNDER LEMON LINE */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-900 text-white rounded-2xl print:rounded-md p-4 print:p-1.5 gap-3 print:gap-1.5">
                  <div className="flex items-center gap-3 print:gap-2 flex-wrap">
                    <div className="inline-block px-3 print:px-2 py-1 print:py-0.5 bg-[#84CC16] text-black font-mono font-black text-xs print:text-[9px] rounded-xl print:rounded">
                      OFFICIAL QUOTATION
                    </div>
                    <div className="font-mono font-black text-xl md:text-2xl print:text-sm text-white">
                      {selectedQuotation.quotationNumber}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 print:gap-2 flex-wrap">
                    <div className="text-xs md:text-sm print:text-[8.5px] text-neutral-300 font-mono font-semibold">
                      Date Issued: <span className="text-white font-bold">{new Date(selectedQuotation.quotationDate).toLocaleDateString()}</span>
                    </div>
                    <div>{getStatusBadge(selectedQuotation.status)}</div>
                  </div>
                </div>

                {/* SUPPLIER & BILLED TO GRID BELOW LEMON LINE */}
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-2 pt-1 print:pt-0">
                  {/* Supplier Information */}
                  <div className="space-y-1.5 print:space-y-0.5 text-xs md:text-sm print:text-[8.5px]">
                    <h4 className="font-black uppercase text-xs md:text-sm print:text-[8.5px] text-neutral-500 tracking-wider mb-1 print:mb-0.5">
                      SUPPLIER INFORMATION
                    </h4>
                    <div className="font-black text-base md:text-lg print:text-[10px] text-neutral-900">
                      {WEVENTURE_SUPPLIER_INFO.companyName}
                    </div>
                    <div className="text-neutral-700 font-medium leading-tight">
                      <span className="font-bold text-neutral-900">Address:</span> {WEVENTURE_SUPPLIER_INFO.address}
                    </div>
                    <div className="text-neutral-700 font-medium leading-tight">
                      <span className="font-bold text-neutral-900">Date of Registration:</span> {WEVENTURE_SUPPLIER_INFO.dateOfRegistration || 'N/A'}
                    </div>
                    <div className="text-neutral-500 text-xs print:text-[8px] font-medium">
                      Email: info@weventurehub.com | Tel: 0911243503
                    </div>
                    <div className="text-[#65A30D] font-bold text-xs print:text-[8px]">
                      Prepared by: {selectedQuotation.preparedBy || 'Commercial Sales Team'}
                    </div>
                  </div>

                  {/* Billed To / Quotation Issued To */}
                  <div className="bg-neutral-50 rounded-2xl print:rounded-md p-4 print:p-1.5 border border-neutral-200 text-xs md:text-sm print:text-[8.5px] space-y-2 print:space-y-0.5">
                    <div>
                      <h4 className="font-black uppercase text-xs md:text-sm print:text-[8.5px] text-neutral-400 tracking-wider mb-1 print:mb-0.5">
                        QUOTATION ISSUED TO:
                      </h4>
                      <div className="font-black text-base md:text-lg print:text-[10px] text-neutral-900">
                        {selectedQuotation.customerName}
                      </div>
                      {selectedQuotation.companyName && (
                        <div className="font-bold text-[#65A30D] mt-0.5 flex items-center gap-1.5 text-xs md:text-sm print:text-[8.5px]">
                          <Building2 className="w-3.5 h-3.5 print:w-2.5 print:h-2.5" />
                          <span>{selectedQuotation.companyName}</span>
                        </div>
                      )}
                      {selectedQuotation.address && (
                        <div className="text-neutral-600 leading-tight">{selectedQuotation.address}</div>
                      )}
                      <div className="text-neutral-700 font-medium leading-tight">
                        {selectedQuotation.email} {selectedQuotation.phone ? `| Tel: ${selectedQuotation.phone}` : ''}
                      </div>
                      {selectedQuotation.tinNumber && (
                        <div className="text-neutral-800 font-semibold text-xs md:text-sm print:text-[8px]">
                          <span className="font-bold text-neutral-900">Customer TIN No:</span> {selectedQuotation.tinNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <table className="w-full text-left text-xs md:text-sm print:text-[8.5px] border-collapse">
                  <thead>
                    <tr className="bg-neutral-900 text-white font-black uppercase text-xs print:text-[8px] tracking-wider">
                      <th className="py-3 print:py-1 px-4 print:px-2 rounded-l-xl print:rounded-l-md">Description</th>
                      <th className="py-3 print:py-1 px-4 print:px-2 text-center">Qty</th>
                      <th className="py-3 print:py-1 px-4 print:px-2 text-right">Unit Rate</th>
                      <th className="py-3 print:py-1 px-4 print:px-2 text-right rounded-r-xl print:rounded-r-md">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {selectedQuotation.items.map((item, idx) => (
                      <tr key={idx} className="text-neutral-800 font-medium">
                        <td className="py-2.5 print:py-0.5 px-4 print:px-2 font-bold text-neutral-900">
                          <div>{item.itemName}</div>
                          {item.description && (
                            <div className="text-xs print:text-[7.5px] text-neutral-500 font-normal">{item.description}</div>
                          )}
                        </td>
                        <td className="py-2.5 print:py-0.5 px-4 print:px-2 text-center font-bold text-xs md:text-sm print:text-[8.5px]">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 print:py-0.5 px-4 print:px-2 text-right font-mono font-semibold">
                          {(item.unitPrice || 0).toLocaleString()} {selectedQuotation.currency}
                        </td>
                        <td className="py-2.5 print:py-0.5 px-4 print:px-2 text-right font-mono font-bold text-xs md:text-sm print:text-[8.5px] text-neutral-900">
                          {(item.amount || 0).toLocaleString()} {selectedQuotation.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Grand Total Summary (Amount in Words, Payment Term & Payment Settlement Banks BOTTOM LEFT, Grand Total BOTTOM RIGHT) */}
              <div className="flex flex-col md:flex-row print:flex-row justify-between items-start gap-6 print:gap-3 border-t border-neutral-200 pt-4 print:pt-1">
                {/* BOTTOM LEFT: AMOUNT IN WORDS, PAYMENT TERM & PAYMENT SETTLEMENT BANKS (MATCHING INVOICE LAYOUT) */}
                <div className="text-sm print:text-[9px] text-neutral-800 space-y-3 print:space-y-1.5 max-w-lg w-full print:w-[58%]">
                  {/* AMOUNT IN WORDS */}
                  <div className="p-3.5 print:p-2 bg-neutral-50 rounded-2xl print:rounded-md border border-neutral-200 space-y-1 print:space-y-0.5">
                    <div className="font-extrabold uppercase text-xs print:text-[8.5px] text-neutral-500 tracking-wider">
                      Amount in Words:
                    </div>
                    <div className="font-black text-sm md:text-base print:text-[10px] text-[#65A30D]">
                      {selectedQuotation.amountInWords || numberToWords(selectedQuotation.grandTotal, selectedQuotation.currency)}
                    </div>
                  </div>

                  {/* PAYMENT TERM (Prominent & Clear, consistent with Invoice text size) */}
                  <div className="p-3.5 print:p-2 bg-neutral-50 rounded-2xl print:rounded-md border border-neutral-200 space-y-1 print:space-y-0.5">
                    <div className="font-extrabold uppercase text-xs print:text-[8.5px] text-neutral-500 tracking-wider">
                      Payment Term:
                    </div>
                    <div className="font-bold text-sm md:text-base print:text-[10px] text-neutral-900 leading-snug">
                      {selectedQuotation.paymentTerms || selectedQuotation.notes || '100% advance payment upon quotation acceptance / prior to space handover.'}
                    </div>
                  </div>

                  {/* PAYMENT SETTLEMENT BANKS — ALL 5 BANKS VERTICALLY MATCHING INVOICE */}
                  <div className="p-4 print:p-2.5 bg-neutral-50 rounded-2xl print:rounded-md border border-neutral-200 space-y-3 print:space-y-1.5">
                    <div className="font-extrabold uppercase text-xs print:text-[8.5px] text-neutral-500 tracking-wider mb-1 print:mb-0.5">
                      SETTLEMENT BANK OPTIONS (TRANSFER ACCOUNT DETAILS):
                    </div>
                    <div className="space-y-3 print:space-y-1.5 divide-y divide-neutral-200 print:divide-neutral-200">
                      {WEVENTURE_BANKS.map((b, idx) => (
                        <div key={b.bankName + idx} className={idx > 0 ? 'pt-3 print:pt-1 border-t border-neutral-100 print:border-neutral-200' : ''}>
                          <div className="font-black text-sm print:text-[9.5px] text-neutral-900 flex flex-wrap items-center justify-between gap-1">
                            <span className="break-words">Bank Option {idx + 1}: {b.bankName}</span>
                            <span className="text-xs print:text-[8.5px] text-neutral-500 font-semibold break-words">{b.branch}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-1.5 print:gap-0.5 text-xs md:text-sm print:text-[8.5px] mt-1">
                            <span className="text-neutral-500 font-medium break-words">Acc Name:</span>
                            <span className="col-span-2 font-bold text-neutral-800 break-words">{b.accountName}</span>
                            <span className="text-neutral-500 font-medium break-words">Acc No:</span>
                            <span className="col-span-2 font-black font-mono text-neutral-900 text-xs md:text-sm print:text-[9px] break-all">{b.accountNumber}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* BOTTOM RIGHT: FINANCIAL BREAKDOWN (GRAND TOTAL) & INCLUDED AMENITIES */}
                <div className="w-full md:w-80 print:w-[38%] space-y-3 print:space-y-1.5 text-sm print:text-[9px]">
                  {selectedQuotation.discount > 0 && (
                    <div className="flex justify-between text-[#65A30D] font-bold p-2.5 print:p-1.5 bg-lime-50 rounded-xl print:rounded-md border border-lime-200 text-xs md:text-sm print:text-[8.5px]">
                      <span>Discount Applied:</span>
                      <span className="font-mono">
                        -{(selectedQuotation.discount || 0).toLocaleString()} {selectedQuotation.currency}
                      </span>
                    </div>
                  )}

                  {/* GRAND TOTAL ROW */}
                  <div className="border-t-2 border-neutral-900 pt-3 print:pt-1.5 flex justify-between font-black text-xl md:text-2xl print:text-base text-neutral-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-[#65A30D]">
                      {(selectedQuotation.grandTotal || 0).toLocaleString()} {selectedQuotation.currency}
                    </span>
                  </div>

                  {/* VAT INCLUSIVE STATEMENT */}
                  <div className="text-right text-xs md:text-sm print:text-[8.5px] text-neutral-600 font-medium pt-0.5">
                    All amounts are inclusive of VAT.
                  </div>

                  {/* USD EXCHANGE RATE & EQUIVALENT */}
                  {selectedQuotation.currency === 'USD' && (
                    <div className="pt-2.5 print:pt-1 border-t border-neutral-200 space-y-1 print:space-y-0.5">
                      <div className="flex justify-between text-xs print:text-[8px] text-neutral-600 font-medium">
                        <span>Exchange Rate:</span>
                        <span className="font-mono font-bold text-neutral-900">
                          1 USD = {selectedQuotation.exchangeRate || 153.09} Birr
                        </span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm print:text-[8.5px] font-bold text-amber-800 bg-amber-50 p-2 print:p-1 rounded-xl print:rounded-md border border-amber-200">
                        <span>Equivalent in ETB:</span>
                        <span className="font-mono font-black">
                          {(selectedQuotation.convertedEtbTotal || 0).toLocaleString()} ETB
                        </span>
                      </div>
                    </div>
                  )}

                  {/* INCLUDED AMENITIES */}
                  {selectedQuotation.amenities && selectedQuotation.amenities.length > 0 && (
                    <div className="p-3 print:p-2 bg-neutral-50 rounded-2xl print:rounded-md border border-neutral-200 space-y-2 print:space-y-1">
                      <div className="font-extrabold uppercase text-xs print:text-[8.5px] text-neutral-500 tracking-wider">
                        INCLUDED AMENITIES & FACILITIES:
                      </div>
                      <div className="space-y-1.5 print:space-y-1 text-xs md:text-sm print:text-[8.5px] text-neutral-800 font-medium">
                        {selectedQuotation.amenities.map((amen, i) => (
                          <div key={i} className="flex items-start gap-1.5 leading-snug print:leading-tight">
                            <span className="text-[#65A30D] font-black shrink-0 text-xs print:text-[8.5px] mt-0.5">✓</span>
                            <span className="break-words leading-snug print:leading-tight">{amen}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Footer */}
              <div className="border-t border-neutral-200 pt-6 print:pt-1.5 flex justify-between items-end text-xs md:text-sm print:text-[8px] text-neutral-500 font-medium">
                <div>
                  <div className="font-bold text-neutral-800 text-xs md:text-sm print:text-[8.5px]">
                    WeVentureHub Finance Department
                  </div>
                  <div>Thank you for choosing WeVentureHub Workspace Solutions</div>
                </div>
                <div className="text-right font-mono font-bold text-neutral-900 border-t-2 border-neutral-800 pt-1 print:pt-0.5 w-52 print:w-36 text-center print:text-[8.5px]">
                  Authorized Stamp & Signature
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print">
              {isAdmin && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700">Change Status:</span>
                  <select
                    value={selectedQuotation.status}
                    onChange={(e) => handleStatusChange(selectedQuotation.id || (selectedQuotation as any)._id, e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Viewed">Viewed</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                    <option value="Converted to Invoice">Converted to Invoice</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsPreviewModalOpen(false);
                      handleOpenEdit(selectedQuotation);
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl text-xs font-bold transition"
                  >
                    Edit Quotation
                  </button>
                )}
                {isAdmin && selectedQuotation.status !== 'Converted to Invoice' && (
                  <button
                    onClick={() => setIsConvertModalOpen(true)}
                    className="px-4 py-2 bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 rounded-xl text-xs font-black transition"
                  >
                    Convert to Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SEND EMAIL MODAL */}
      {/* ========================================================================= */}
      {isEmailModalOpen && selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Email Quotation PDF</h3>
                  <p className="text-[11px] text-slate-500">{selectedQuotation.quotationNumber}</p>
                </div>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Recipient Email *</label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="client@domain.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#84CC16]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Custom Note / Greeting</label>
                <textarea
                  rows={3}
                  value={emailCustomMessage}
                  onChange={(e) => setEmailCustomMessage(e.target.value)}
                  placeholder="Optional custom message to accompany the attached quotation PDF..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#84CC16]"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-800">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Attachment: <strong>Quotation-{selectedQuotation.quotationNumber}.pdf</strong> will be generated and attached.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailSending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black transition disabled:opacity-50"
              >
                {emailSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONVERT TO INVOICE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isConvertModalOpen && selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#84CC16]/20 text-[#65A30D] flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Convert Quotation to Official Invoice?
              </h3>
              <p className="text-slate-500">
                This will create a new verified invoice for <strong>{selectedQuotation.customerName}</strong> with all {selectedQuotation.items.length} line items totaling <strong>{(selectedQuotation.grandTotal || 0).toLocaleString()} {selectedQuotation.currency}</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Quotation Number:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedQuotation.quotationNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Client:</span>
                <span className="font-bold text-slate-900">{selectedQuotation.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Amount:</span>
                <span className="font-black text-[#65A30D] font-mono text-sm">
                  {(selectedQuotation.grandTotal || 0).toLocaleString()} {selectedQuotation.currency}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToInvoice}
                className="flex-1 py-2.5 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-black text-xs shadow-md shadow-[#84CC16]/20 transition"
              >
                Confirm & Convert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MANAGE SETTLEMENT BANKS MODAL */}
      {/* ========================================================================= */}
      {isBanksModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-[#84CC16] flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Payment Settlement Bank Accounts
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Manage official bank details printed on Quotations and Invoices.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsBanksModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of current banks */}
            <div className="space-y-2">
              <div className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">
                Configured Settlement Banks ({banks.length})
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                {banks.map((b) => (
                  <div
                    key={b.bankName}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-black text-slate-900 text-xs">{b.bankName}</div>
                      <div className="text-[11px] text-slate-500">
                        {b.accountName} • <span className="font-mono font-bold text-slate-800">{b.accountNumber}</span> ({b.branch})
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBank(b.bankName)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Bank"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add new bank form */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="font-extrabold uppercase text-[10px] text-slate-900 tracking-wider">
                Add New Bank Account
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Bank Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dashen Bank / Zemen Bank"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Account Name *</label>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Account Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 5032049281001"
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Branch *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bole Medhanialem Branch"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleSaveBank}
                  className="px-4 py-2 bg-slate-900 text-[#84CC16] font-bold rounded-xl text-xs hover:bg-slate-800 transition"
                >
                  Save Bank Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
