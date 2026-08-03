import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarRange, 
  QrCode, 
  Clock, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  SlidersHorizontal,
  DollarSign,
  User,
  Check,
  AlertCircle,
  FileText,
  Signature,
  CreditCard,
  Download,
  Building,
  CheckSquare,
  Sparkles,
  Layers,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Users,
  Briefcase,
  ShieldAlert,
  Ticket,
  Search,
  Tag
} from 'lucide-react';
import { useAppSelector } from '../store';
import { bookingApi } from '../lib/bookingApi';
import { workspaceApi } from '../lib/workspaceApi';
import { paymentApi } from '../lib/paymentApi';
import { ticketingApi } from '../lib/ticketingApi';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

interface BookingRecord {
  id: string;
  spaceId: string;
  userId: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'AGREEMENT_GENERATED' | 'CUSTOMER_ACCEPTED' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'RENEWED' | 'COMPLETED';
  purpose?: string;
  qrCode: string;
  billingPlanId?: string;
  billingPlanName?: string;
  teamSize?: number;
  notes?: string;
  documentUrl?: string;
  agreementId?: string;
  durationType?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  durationQuantity?: number;
  formattedDuration?: string;
  
  // Attached Registration Details
  primaryName?: string;
  primaryEmail?: string;
  phone?: string;
  company?: string;
  address?: string;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
  };
  emergencyContact?: any;
  userType?: 'individual' | 'group' | 'company';
  userTypeDetails?: any;
  workspaceBookingInfo?: any;
  workspace?: any;
  participantFile?: string;
}

export default function BookingList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  // Active Category Tab: Workspaces vs Events
  const [activeTab, setActiveTab] = useState<'WORKSPACES' | 'EVENTS'>('WORKSPACES');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI state for Modals & Actions
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Digital Signature Modal
  const [selectedBookingForSigning, setSelectedBookingForSigning] = useState<BookingRecord | null>(null);
  const [signatureName, setSignatureName] = useState<string>('');
  const [agreementDetails, setAgreementDetails] = useState<any>(null);
  const [isAgreementDetailsLoading, setIsAgreementDetailsLoading] = useState<boolean>(false);

  // Local storage state for user reservations
  const [localWorkspaces, setLocalWorkspaces] = useState<any[]>([]);
  const [localEventRegs, setLocalEventRegs] = useState<any[]>([]);

  useEffect(() => {
    try {
      const storedWorkspaces = JSON.parse(localStorage.getItem('weventurehub_user_bookings') || '[]');
      setLocalWorkspaces(storedWorkspaces);

      const storedEvents = JSON.parse(localStorage.getItem('weventurehub_user_registrations') || '[]');
      setLocalEventRegs(storedEvents);
    } catch (e) {
      console.error('Failed to parse local storage bookings:', e);
    }
  }, []);

  // Administrative Lease Drafting Modal
  const [draftBookingId, setDraftBookingId] = useState<string | null>(null);
  const [draftRules, setDraftRules] = useState({
    internet: 'Symmetric Gigabit Fiber Internet Access',
    meetingRoom: '10 meeting room credit hours per calendar month',
    parking: '1 reserved basement parking slot',
    utilities: 'All utilities including water, dynamic lighting, and heating included',
    workingHours: '24/7 access pass boundaries',
    renewalPolicy: 'Manual' as 'Automatic' | 'Manual',
    cancellationPolicy: '30-day early notification cancellation notice policy',
    terminationPolicy: 'Immediate termination on behavioral policy breach',
    visitorPolicy: 'Up to 3 simultaneous commercial visitors permitted',
    additionalNotes: 'Complimentary tea, artisan coffee, and reception services included.',
  });
  const [draftTerms, setDraftTerms] = useState('Standard WeVentureHub commercial occupancy regulations apply. Tenant agrees to respect common space guidelines.');
  const [draftConditions, setDraftConditions] = useState('Workspace utilization is strictly contingent upon regular payment compliance.');

  // User Roles Check
  const isAdminOrStaff = 
    user?.role === UserRole.SUPER_ADMIN || 
    user?.role === UserRole.TENANT_ADMIN || 
    user?.role === UserRole.STAFF;

  // ----------------------------------------------------
  // 1. Data Fetching (TanStack Query)
  // ----------------------------------------------------
  const { 
    data: bookingsResponse, 
    isLoading: isBookingsLoading,
    refetch: refetchBookings 
  } = useQuery({
    queryKey: ['bookings', statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      return await bookingApi.getBookings(params);
    }
  });

  const { 
    data: workspacesResponse 
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      return await workspaceApi.getWorkspaces();
    }
  });

  // Query Invoices for Customer Billing Portal
  const { 
    data: invoicesList,
    refetch: refetchInvoices 
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      return await paymentApi.getInvoices();
    }
  });

  // Query Event Registrations
  const { 
    data: eventRegistrationsResponse,
    refetch: refetchEventRegs
  } = useQuery({
    queryKey: ['all-event-registrations', isAdminOrStaff],
    queryFn: async () => {
      try {
        if (isAdminOrStaff) {
          return await ticketingApi.getAllRegistrations(1, 100);
        } else {
          const myRegs = await ticketingApi.getMyRegistrations();
          return { docs: myRegs || [], total: myRegs?.length || 0 };
        }
      } catch (e) {
        return { docs: [], total: 0 };
      }
    }
  });

  const workspaces: any[] = workspacesResponse?.data || [];
  const invoices: any[] = invoicesList || [];

  // Transform & Merge Workspace Bookings
  const apiBookings: any[] = bookingsResponse?.data || [];
  
  const formattedLocalWorkspaces = localWorkspaces.map((item: any) => ({
    id: item.id || `WVH-LOCAL-${Math.floor(Math.random() * 90000)}`,
    spaceId: item.workspace?.id || item.workspace?.slug || 'executive-suite',
    userId: item.primaryEmail || 'user',
    userEmail: item.primaryEmail || item.email || item.userEmail || '',
    startTime: item.workspaceBookingInfo?.bookingDate 
      ? `${item.workspaceBookingInfo.bookingDate}T${item.workspaceBookingInfo.startTime || '09:00'}:00.000Z`
      : new Date().toISOString(),
    endTime: item.workspaceBookingInfo?.bookingDate 
      ? `${item.workspaceBookingInfo.bookingDate}T${item.workspaceBookingInfo.endTime || '17:00'}:00.000Z`
      : new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    totalAmount: Number(item.totalAmount) || 120,
    status: 'CONFIRMED' as const,
    purpose: item.workspaceBookingInfo?.specialRequests || item.purpose || 'Workspace Reservation',
    qrCode: item.id || 'WVH-RES-PASS',
    billingPlanName: item.workspace?.type || 'Hot Desk',
    teamSize: item.workspaceBookingInfo?.desksRequested || item.userTypeDetails?.participantCount || item.userTypeDetails?.employeeCount || 1,
    notes: item.specialRequests || item.notes || '',
    documentUrl: item.participantFile || item.documentUrl || '',
    
    // Detailed Contact Information
    primaryName: item.primaryName || item.userTypeDetails?.fullName || item.userTypeDetails?.teamLeaderName || item.userTypeDetails?.contactPerson,
    phone: item.phone || item.userTypeDetails?.phone || item.userTypeDetails?.groupPhone || item.userTypeDetails?.companyPhone,
    billingDetails: item.billingDetails || {
      name: item.primaryName,
      email: item.primaryEmail,
      phone: item.phone,
      company: item.userTypeDetails?.companyName || item.userTypeDetails?.groupName || item.organization,
      address: item.userTypeDetails?.companyAddress || '',
    },
    userType: item.userType,
    userTypeDetails: item.userTypeDetails,
    workspace: item.workspace,
    workspaceBookingInfo: item.workspaceBookingInfo,
    durationType: item.durationType || item.workspaceBookingInfo?.durationType,
    durationQuantity: item.durationQuantity || item.workspaceBookingInfo?.durationQuantity,
    formattedDuration: item.formattedDuration || item.workspaceBookingInfo?.formattedDuration,
  }));

  const combinedBookings: BookingRecord[] = [...formattedLocalWorkspaces];
  apiBookings.forEach((bkg: any) => {
    if (!combinedBookings.some((cb) => cb.id === bkg.id)) {
      combinedBookings.push(bkg);
    }
  });

  // Filter Workspace Bookings
  const filteredWorkspaceBookings = combinedBookings.filter((bkg) => {
    const matchesStatus = statusFilter === 'ALL' || bkg.status === statusFilter;
    
    const nameStr = (bkg.billingDetails?.name || bkg.primaryName || bkg.userEmail || '').toLowerCase();
    const emailStr = (bkg.billingDetails?.email || bkg.userEmail || bkg.primaryEmail || '').toLowerCase();
    const phoneStr = (bkg.billingDetails?.phone || bkg.phone || '').toLowerCase();
    const companyStr = (bkg.billingDetails?.company || bkg.company || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || nameStr.includes(q) || emailStr.includes(q) || phoneStr.includes(q) || companyStr.includes(q) || bkg.id.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  // Transform & Merge Event Registrations
  const apiEventRegs: any[] = eventRegistrationsResponse?.docs || [];

  const formattedLocalEventRegs = localEventRegs.map((item: any) => ({
    id: item.id || `WVH-EVT-${Math.floor(Math.random() * 90000)}`,
    eventId: item.event?.id || 'evt-1',
    eventTitle: item.event?.title || 'WeVentureHub Summit',
    eventDate: item.event?.date || '2026-08-20',
    eventTime: item.event?.time || '09:00 AM - 04:00 PM',
    eventLocation: item.event?.location || 'Main Event Hall',
    attendeeName: item.primaryName || item.userTypeDetails?.fullName || item.userTypeDetails?.teamLeaderName || item.userTypeDetails?.contactPerson || 'Attendee',
    attendeeEmail: item.primaryEmail || item.userTypeDetails?.email || item.userTypeDetails?.groupEmail || item.userTypeDetails?.businessEmail || '',
    attendeePhone: item.phone || item.userTypeDetails?.phone || item.userTypeDetails?.groupPhone || item.userTypeDetails?.companyPhone || '',
    attendeeCompany: item.userTypeDetails?.companyName || item.userTypeDetails?.groupName || item.userTypeDetails?.organization || item.organization || '',
    ticketNumber: item.id,
    userType: item.userType || 'individual',
    userTypeDetails: item.userTypeDetails,
    status: 'CONFIRMED',
    checkedIn: false,
    totalAmount: item.totalAmount || '0.00',
    dateSubmitted: item.dateSubmitted || new Date().toISOString()
  }));

  const combinedEventRegs: any[] = [...formattedLocalEventRegs];
  apiEventRegs.forEach((reg: any) => {
    if (!combinedEventRegs.some((cr) => cr.id === reg.id)) {
      combinedEventRegs.push(reg);
    }
  });

  const filteredEventRegs = combinedEventRegs.filter((reg) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const nameStr = (reg.attendeeName || reg.primaryName || '').toLowerCase();
    const emailStr = (reg.attendeeEmail || reg.primaryEmail || reg.userEmail || '').toLowerCase();
    const phoneStr = (reg.attendeePhone || reg.phone || '').toLowerCase();
    const companyStr = (reg.attendeeCompany || reg.organization || '').toLowerCase();
    const eventStr = (reg.eventTitle || '').toLowerCase();

    return nameStr.includes(q) || emailStr.includes(q) || phoneStr.includes(q) || companyStr.includes(q) || eventStr.includes(q) || reg.id.toLowerCase().includes(q);
  });

  // Helper to find workspace name
  const findWorkspace = (spaceId: string) => {
    return workspaces.find((w) => w.id === spaceId);
  };

  // Helper to find invoices for a specific booking
  const findInvoicesForBooking = (bookingId: string) => {
    return invoices.filter((inv) => inv.bookingId === bookingId || inv.reservationId === bookingId);
  };

  // Helper: format ISO dates into human readable times
  const formatDateTimeRange = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      
      const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

      return {
        date: start.toLocaleDateString('en-US', dateOptions),
        time: `${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`
      };
    } catch {
      return { date: 'Unknown Date', time: 'Unknown Hour' };
    }
  };

  // ----------------------------------------------------
  // 2. Mutations
  // ----------------------------------------------------
  const cancelBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await bookingApi.cancelBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setErrorBanner(null);
      setSuccessBanner('Booking has been cancelled.');
    },
    onError: (err: any) => {
      setErrorBanner(err.message || 'Failed to cancel reservation.');
    }
  });

  const approveBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await bookingApi.approveBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setErrorBanner(null);
      setSuccessBanner('Booking reservation request approved by administrator. Preparing agreement draft.');
    },
    onError: (err: any) => {
      setErrorBanner(err.message || 'Failed to approve booking.');
    }
  });

  const rejectBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await bookingApi.rejectBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setErrorBanner(null);
      setSuccessBanner('Booking reservation has been rejected.');
    },
    onError: (err: any) => {
      setErrorBanner(err.message || 'Failed to reject booking.');
    }
  });

  // Dynamic Lease Agreement Drafting Mutation
  const draftAgreementMutation = useMutation({
    mutationFn: async ({ bookingId, payload }: { bookingId: string; payload: any }) => {
      return await bookingApi.generateAgreement(bookingId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setDraftBookingId(null);
      setErrorBanner(null);
      setSuccessBanner('Corporate occupancy agreement has been drafted and dispatched successfully.');
    },
    onError: (err: any) => {
      setErrorBanner(err.message || 'Failed to draft agreement.');
    }
  });

  // Digital Signing Mutation
  const signAgreementMutation = useMutation({
    mutationFn: async ({ bookingId, customerName }: { bookingId: string; customerName: string }) => {
      return await bookingApi.signAgreement(bookingId, customerName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedBookingForSigning(null);
      setSignatureName('');
      setErrorBanner(null);
      setSuccessBanner('Lease agreement executed successfully! Inline payment invoice is now generated.');
    },
    onError: (err: any) => {
      setErrorBanner(err.message || 'Failed to digitally sign agreement.');
    }
  });

  // Manual Invoice Generation Mutation (Staff Only)
  const generateInvoiceMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return await bookingApi.generateInvoice(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSuccessBanner('Invoice generated and dispatched to the customer profile.');
    },
    onError: (err: any) => {
      setErrorBanner(err.message || 'Failed to trigger invoice generation.');
    }
  });

  const handleCancelClick = (id: string) => {
    if (confirm('Are you sure you want to cancel this booking reservation?')) {
      cancelBookingMutation.mutate(id);
    }
  };

  // Open digital signature modal and pre-load agreement guidelines
  const handleOpenSigningModal = async (bkg: BookingRecord) => {
    setSelectedBookingForSigning(bkg);
    setIsAgreementDetailsLoading(true);
    try {
      const details = await bookingApi.getAgreement(bkg.id);
      setAgreementDetails(details);
    } catch (e: any) {
      setErrorBanner('Failed to load lease agreement guidelines.');
    } finally {
      setIsAgreementDetailsLoading(false);
    }
  };

  // Navigate to Secure Checkout Gateway for Invoice Payment
  const handleCheckoutInvoice = (invoice: any) => {
    navigate('/dashboard/checkout', {
      state: {
        targetType: 'INVOICE',
        targetId: invoice.id,
        amount: invoice.outstandingBalance || invoice.amount,
        currency: invoice.currency || 'ETB',
        title: invoice.workspaceName ? `Invoice for ${invoice.workspaceName}` : `Invoice ${invoice.invoiceNumber}`,
        description: `WeVentureHub Approved Reservation Invoice (${invoice.invoiceNumber})`,
        invoiceNumber: invoice.invoiceNumber,
        billingDetails: invoice.billingDetails,
      }
    });
  };

  // Download printable invoice details format
  const handleDownloadInvoice = (id: string, invoiceNumber: string) => {
    try {
      const token = localStorage.getItem('weventure_jwt_token') || '';
      const tenantId = localStorage.getItem('weventure_tenant_id') || 'weventurehub';
      const url = `/api/v1/payments/invoices/${id}/download?token=${encodeURIComponent(token)}&tenantId=${encodeURIComponent(tenantId)}`;
      window.open(url, '_blank');
    } catch (e: any) {
      setErrorBanner('Failed to download invoice file.');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Reservations & Event Registrations</h1>
          <p className="text-sm text-neutral-slate-400 mt-1">Review WeVentureHub workspace passes, contact profiles, and event admission records.</p>
        </div>
        <Button 
          variant="secondary" 
          className="self-start text-xs flex items-center gap-2"
          onClick={() => {
            refetchBookings();
            refetchInvoices();
            refetchEventRegs();
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Synchronize Ledger</span>
        </Button>
      </div>

      {/* Success display */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-500 font-bold hover:text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* Error display */}
      {errorBanner && (
        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-500 font-bold hover:text-rose-700">Dismiss</button>
        </div>
      )}

      {/* Category Tabs: Workspace vs Event Bookings */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('WORKSPACES')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'WORKSPACES'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Workspace Reservations ({filteredWorkspaceBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'EVENTS'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Event Registrations ({filteredEventRegs.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, phone, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Status Filter buttons (Only for Workspace tab) */}
      {activeTab === 'WORKSPACES' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 border-b border-gray-200">
          <SlidersHorizontal className="w-4.5 h-4.5 text-neutral-slate-400 shrink-0" />
          {[
            { key: 'ALL', label: 'Show All' },
            { key: 'PENDING_REVIEW', label: 'Submitted (Review)' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'AGREEMENT_GENERATED', label: 'Lease Prepared' },
            { key: 'CUSTOMER_ACCEPTED', label: 'Agreement Executed' },
            { key: 'CONFIRMED', label: 'Active Passes' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                statusFilter === st.key 
                  ? 'bg-[#84CC16] text-[#111111]' 
                  : 'bg-white border border-gray-200 text-neutral-slate-600 hover:bg-neutral-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* TAB 1: WORKSPACE RESERVATIONS */}
      {activeTab === 'WORKSPACES' && (
        <>
          {isBookingsLoading ? (
            <div className="p-12 text-center text-neutral-slate-400">
              <div className="animate-spin w-8 h-8 border-4 border-[#84CC16] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm font-bold">Synchronizing workspace reservations cache...</p>
            </div>
          ) : filteredWorkspaceBookings.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-white border-[#E5E7EB]">
              <CalendarRange className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
              <h3 className="font-display font-bold text-base text-[#111827]">No Workspace Reservations Found</h3>
              <p className="text-xs text-[#4B5563] max-w-xs mx-auto mt-1">
                No workspace bookings match the current filter or search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkspaceBookings.map((bkg) => {
                const workspace = bkg.workspace || findWorkspace(bkg.spaceId);
                const { date, time } = formatDateTimeRange(bkg.startTime, bkg.endTime);
                const bkgInvoices = findInvoicesForBooking(bkg.id);

                // Extract all contact & profile information
                const customerName = bkg.billingDetails?.name || bkg.primaryName || bkg.userEmail || (bkg.userTypeDetails?.fullName || bkg.userTypeDetails?.teamLeaderName || bkg.userTypeDetails?.contactPerson);
                const customerEmail = bkg.billingDetails?.email || bkg.primaryEmail || bkg.userEmail || (bkg.userTypeDetails?.email || bkg.userTypeDetails?.groupEmail || bkg.userTypeDetails?.businessEmail);
                const customerPhone = bkg.billingDetails?.phone || bkg.phone || (bkg.userTypeDetails?.phone || bkg.userTypeDetails?.groupPhone || bkg.userTypeDetails?.companyPhone) || (bkg.emergencyContact?.phone);
                const customerCompany = bkg.billingDetails?.company || bkg.company || (bkg.userTypeDetails?.companyName || bkg.userTypeDetails?.groupName || bkg.userTypeDetails?.organization);
                const customerAddress = bkg.billingDetails?.address || bkg.address || bkg.userTypeDetails?.companyAddress;
                const userCategory = bkg.userType || (customerCompany ? 'company' : 'individual');
                const emergencyContact = bkg.billingDetails?.emergencyContact 
                  ? `${bkg.billingDetails.emergencyContact.name || ''} (${bkg.billingDetails.emergencyContact.relationship || 'Emergency'}): ${bkg.billingDetails.emergencyContact.phone || ''}`
                  : (bkg.emergencyContact ? `${bkg.emergencyContact.name || ''}: ${bkg.emergencyContact.phone || ''}` : null);
                const purposeText = bkg.purpose || bkg.workspaceBookingInfo?.specialRequests || bkg.notes;
                const docUrl = bkg.documentUrl || bkg.participantFile;

                return (
                  <div key={bkg.id} className="bento-card relative overflow-hidden flex flex-col justify-between border border-gray-150 shadow-sm rounded-2xl p-6 bg-white space-y-4">
                    {/* Visual Status bar top */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                      bkg.status === 'CONFIRMED' 
                        ? 'bg-[#84CC16]' 
                        : bkg.status === 'CUSTOMER_ACCEPTED' 
                        ? 'bg-cyan-500' 
                        : bkg.status === 'AGREEMENT_GENERATED' 
                        ? 'bg-purple-500' 
                        : bkg.status === 'APPROVED' 
                        ? 'bg-blue-500' 
                        : bkg.status === 'PENDING_REVIEW' 
                        ? 'bg-amber-500' 
                        : 'bg-neutral-slate-300'
                    }`} />

                    <div className="space-y-4 pt-1">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-display font-bold text-base text-gray-900">
                            {workspace ? workspace.name : 'Professional Space'}
                          </h3>
                          <p className="text-xs text-neutral-slate-400 font-mono mt-0.5">Reservation Ref: {bkg.id}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            <span className="text-[10px] bg-neutral-100 text-neutral-600 font-semibold px-2 py-0.5 rounded">
                              Plan: {bkg.billingPlanName || 'Hot Desk'}
                            </span>
                            {bkg.teamSize && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded">
                                Seats/Desks: {bkg.teamSize} pax
                              </span>
                            )}
                            {(bkg.formattedDuration || bkg.workspaceBookingInfo?.formattedDuration || (bkg.durationType && bkg.durationQuantity ? `${bkg.durationQuantity} ${bkg.durationType}` : null)) && (
                              <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Duration: {bkg.formattedDuration || bkg.workspaceBookingInfo?.formattedDuration || `${bkg.durationQuantity} ${bkg.durationType}`}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 ${
                          bkg.status === 'CONFIRMED' 
                            ? 'bg-[#84CC16]/20 text-[#4D7C0F]' 
                            : bkg.status === 'CUSTOMER_ACCEPTED' 
                            ? 'bg-cyan-50 text-cyan-600' 
                            : bkg.status === 'AGREEMENT_GENERATED' 
                            ? 'bg-purple-50 text-purple-600' 
                            : bkg.status === 'APPROVED' 
                            ? 'bg-blue-50 text-blue-600' 
                            : bkg.status === 'PENDING_REVIEW' 
                            ? 'bg-amber-50 text-amber-600' 
                            : 'bg-neutral-slate-100 text-neutral-slate-500'
                        }`}>
                          {bkg.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Booking schedule */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-slate-600 border-t pt-3">
                        <div className="flex items-center space-x-2">
                          <CalendarRange className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                          <span className="truncate">{time}</span>
                        </div>
                      </div>

                      {/* DETAILED REGISTRANT CONTACT INFORMATION PANEL */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2 text-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 font-bold text-slate-800">
                          <div className="flex items-center space-x-1.5 text-brand-primary">
                            <User className="w-3.5 h-3.5" />
                            <span>Registrant Profile & Contact Info</span>
                          </div>
                          {userCategory && (
                            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold">
                              {userCategory}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {customerName && (
                            <div className="flex items-center space-x-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span><strong className="text-slate-900">Name:</strong> {customerName}</span>
                            </div>
                          )}

                          {customerEmail && (
                            <div className="flex items-center space-x-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                <strong className="text-slate-900">Email:</strong>{' '}
                                <a href={`mailto:${customerEmail}`} className="text-blue-600 hover:underline">
                                  {customerEmail}
                                </a>
                              </span>
                            </div>
                          )}

                          {customerPhone && (
                            <div className="flex items-center space-x-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                <strong className="text-slate-900">Phone:</strong>{' '}
                                <a href={`tel:${customerPhone}`} className="text-emerald-700 font-bold hover:underline">
                                  {customerPhone}
                                </a>
                              </span>
                            </div>
                          )}

                          {customerCompany && (
                            <div className="flex items-center space-x-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span><strong className="text-slate-900">Company:</strong> {customerCompany}</span>
                            </div>
                          )}

                          {customerAddress && (
                            <div className="flex items-center space-x-1.5 sm:col-span-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span><strong className="text-slate-900">Address:</strong> {customerAddress}</span>
                            </div>
                          )}

                          {emergencyContact && (
                            <div className="flex items-center space-x-1.5 sm:col-span-2 text-rose-600 bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span><strong>Emergency Contact:</strong> {emergencyContact}</span>
                            </div>
                          )}
                        </div>

                        {purposeText && (
                          <div className="border-t border-slate-200/80 pt-1.5 text-[11px] text-slate-600">
                            <strong className="text-slate-900">Purpose / Special Requests:</strong> {purposeText}
                          </div>
                        )}

                        {docUrl && (
                          <div className="border-t border-slate-200/80 pt-1.5 text-[11px]">
                            <strong className="text-slate-900">Attached Document:</strong>{' '}
                            <a href={docUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">
                              View Attached Credentials File
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Customer Billing Portal - Inline Invoice Panel */}
                      {bkgInvoices.length > 0 && (
                        <div className="border-t border-dashed pt-3 mt-2 space-y-2.5">
                          <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-neutral-slate-400" />
                            <span>Corporate Invoices Ledger</span>
                          </h4>
                          {bkgInvoices.map((inv) => (
                            <div key={inv.id} className="bg-[#FAFDF6] border border-[#ECF7D7] rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <p className="text-xs font-mono font-bold text-[#3F6212]">{inv.invoiceNumber}</p>
                                <p className="text-[10px] text-neutral-slate-400">{inv.billingPeriod}</p>
                                <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {inv.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <span className="text-xs font-bold text-gray-900 mr-2">
                                  {inv.amount} {inv.currency || 'ETB'}
                                </span>
                                 {inv.status !== 'PAID' && (
                                  <button 
                                    onClick={() => handleCheckoutInvoice(inv)}
                                    className="px-2.5 py-1.5 bg-[#84CC16] hover:bg-[#73B612] text-[#111111] font-bold text-[10px] rounded flex items-center gap-1 transition shadow-xs"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Pay Invoice (Secure Gateway)</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDownloadInvoice(inv.id, inv.invoiceNumber)}
                                  className="p-1.5 border border-gray-200 hover:bg-neutral-100 rounded text-gray-600 transition"
                                  title="Download Invoice PDF representation"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer buttons & Action boundaries */}
                    <div className="border-t border-gray-200 pt-4 mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">
                        Grand Total: ETB {bkg.totalAmount.toLocaleString()}
                      </span>

                      <div className="flex flex-wrap gap-2 justify-end">
                        {/* View QR Access Token */}
                        {bkg.status === 'CONFIRMED' && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex items-center gap-1.5 text-xs"
                            onClick={() => setActiveBooking(bkg)}
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Verification Pass</span>
                          </Button>
                        )}

                        {/* Customer Workflow action: Review & Sign Lease */}
                        {bkg.status === 'AGREEMENT_GENERATED' && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 text-xs"
                            onClick={() => handleOpenSigningModal(bkg)}
                          >
                            <Signature className="w-4 h-4" />
                            <span>Review & Sign Lease</span>
                          </Button>
                        )}

                        {/* Admin Actions for submitted requests */}
                        {isAdminOrStaff && (bkg.status === 'PENDING_REVIEW' || bkg.status === 'PENDING_APPROVAL') && (
                          <>
                            <Button 
                              size="sm"
                              variant="primary" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-xs"
                              onClick={() => approveBookingMutation.mutate(bkg.id)}
                              isLoading={approveBookingMutation.isPending}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </Button>
                            <Button 
                              size="sm"
                              variant="danger" 
                              className="flex items-center gap-1 text-xs"
                              onClick={() => rejectBookingMutation.mutate(bkg.id)}
                              isLoading={rejectBookingMutation.isPending}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </Button>
                          </>
                        )}

                        {/* Admin Workflow: Generate Agreement Form */}
                        {isAdminOrStaff && bkg.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs"
                            onClick={() => {
                              setDraftBookingId(bkg.id);
                            }}
                          >
                            <FileText className="w-4 h-4" />
                            <span>Draft Corporate Lease</span>
                          </Button>
                        )}

                        {/* Admin Workflow: Staff manual Invoice scheduler trigger */}
                        {isAdminOrStaff && bkg.status === 'CUSTOMER_ACCEPTED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex items-center gap-1.5 text-xs"
                            onClick={() => generateInvoiceMutation.mutate(bkg.id)}
                            isLoading={generateInvoiceMutation.isPending}
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Trigger Recurring Invoice</span>
                          </Button>
                        )}

                        {/* Cancel button action */}
                        {bkg.status !== 'CANCELLED' && bkg.status !== 'REJECTED' && bkg.status !== 'CONFIRMED' && (
                          <button 
                            onClick={() => handleCancelClick(bkg.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition"
                            title="Cancel reservation guidelines"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: EVENT REGISTRATIONS & TICKETS */}
      {activeTab === 'EVENTS' && (
        <>
          {filteredEventRegs.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-white border-gray-200">
              <Ticket className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="font-display font-bold text-base text-gray-900">No Event Registrations Found</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                No event tickets or attendee registrations match your query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEventRegs.map((reg) => (
                <div key={reg.id} className="relative overflow-hidden flex flex-col justify-between border border-gray-150 shadow-sm rounded-2xl p-6 bg-white space-y-4">
                  
                  {/* Visual Status Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-accent" />

                  <div className="space-y-4 pt-1">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="inline-flex items-center space-x-1.5 text-[10px] font-extrabold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md mb-1">
                          <Ticket className="w-3 h-3" />
                          <span>Event Ticket Pass</span>
                        </div>
                        <h3 className="font-display font-bold text-base text-gray-900">
                          {reg.eventTitle || 'WeVentureHub Event'}
                        </h3>
                        <p className="text-xs text-neutral-slate-400 font-mono mt-0.5">Ticket Ref: {reg.ticketNumber || reg.id}</p>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        reg.checkedIn 
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {reg.checkedIn ? 'Checked In' : 'Valid Pass'}
                      </span>
                    </div>

                    {/* Event Schedule & Location */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-slate-600 border-t pt-3">
                      <div className="flex items-center space-x-2">
                        <CalendarRange className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                        <span>{reg.eventDate || 'Aug 20, 2026'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                        <span className="truncate">{reg.eventLocation || 'Main Hall'}</span>
                      </div>
                    </div>

                    {/* ATTENDEE DETAILED PROFILE & CONTACT CARD */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2 text-slate-700">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 font-bold text-slate-800">
                        <div className="flex items-center space-x-1.5 text-brand-primary">
                          <User className="w-3.5 h-3.5" />
                          <span>Attendee Contact Information</span>
                        </div>
                        {reg.userType && (
                          <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                            {reg.userType} Registration
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {reg.attendeeName && (
                          <div className="flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span><strong className="text-slate-900">Attendee:</strong> {reg.attendeeName}</span>
                          </div>
                        )}

                        {reg.attendeeEmail && (
                          <div className="flex items-center space-x-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              <strong className="text-slate-900">Email:</strong>{' '}
                              <a href={`mailto:${reg.attendeeEmail}`} className="text-blue-600 hover:underline">
                                {reg.attendeeEmail}
                              </a>
                            </span>
                          </div>
                        )}

                        {reg.attendeePhone && (
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              <strong className="text-slate-900">Phone:</strong>{' '}
                              <a href={`tel:${reg.attendeePhone}`} className="text-emerald-700 font-bold hover:underline">
                                {reg.attendeePhone}
                              </a>
                            </span>
                          </div>
                        )}

                        {reg.attendeeCompany && (
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span><strong className="text-slate-900">Organization:</strong> {reg.attendeeCompany}</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-gray-200 pt-4 mt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 font-mono">
                      Pass Ref: {reg.ticketNumber || reg.id}
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center space-x-1.5 text-xs"
                      onClick={() => setActiveBooking(reg)}
                    >
                      <QrCode className="w-4 h-4 text-brand-primary" />
                      <span>View Ticket QR Pass</span>
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* QR Access Modal */}
      <Modal isOpen={!!activeBooking} onClose={() => setActiveBooking(null)} title="Encrypted Digital Pass">
        {activeBooking && (
          <div className="text-center space-y-6 py-6 font-sans">
            <div className="p-4 bg-gray-50 rounded-2xl w-48 h-48 flex items-center justify-center mx-auto shadow-inner border border-gray-100">
              <div className="relative">
                <QrCode className="w-32 h-32 text-gray-900" />
                <div className="absolute inset-0 bg-[#84CC16]/5 rounded-lg border border-[#84CC16] animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg text-gray-900">
                {activeBooking.eventTitle || findWorkspace(activeBooking.spaceId)?.name || 'WeVentureHub Pass'}
              </h3>
              <p className="text-xs text-[#84CC16] font-mono font-bold uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full inline-block">
                TICKET REF: {activeBooking.ticketNumber || activeBooking.qrCode || activeBooking.id}
              </p>
              <div className="text-xs text-neutral-slate-500 space-y-1 pt-2">
                <p><strong>Name:</strong> {activeBooking.attendeeName || activeBooking.primaryName || activeBooking.userEmail}</p>
                <p><strong>Email:</strong> {activeBooking.attendeeEmail || activeBooking.primaryEmail || activeBooking.userEmail}</p>
                {(activeBooking.attendeePhone || activeBooking.phone) && <p><strong>Phone:</strong> {activeBooking.attendeePhone || activeBooking.phone}</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Dynamic Lease Drafting Form (Admin Only) */}
      <Modal isOpen={!!draftBookingId} onClose={() => setDraftBookingId(null)} title="WeVentureHub Custom Lease Builder">
        {draftBookingId && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              draftAgreementMutation.mutate({
                bookingId: draftBookingId,
                payload: {
                  rules: draftRules,
                  terms: draftTerms,
                  conditions: draftConditions
                }
              });
            }}
            className="space-y-4 max-h-[80vh] overflow-y-auto p-2"
          >
            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex items-start gap-2 text-xs text-indigo-700">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Customize specific workspace rules, utility caps, and financial conditions for the tenancy. The system automatically computes deposits based on workspace pricing models.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-1">Gigabit Internet Allocation</label>
                <input 
                  type="text" 
                  value={draftRules.internet} 
                  onChange={(e) => setDraftRules({ ...draftRules, internet: e.target.value })}
                  className="w-full text-xs p-2.5 bg-gray-50 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-1">Meeting Room Credits</label>
                <input 
                  type="text" 
                  value={draftRules.meetingRoom} 
                  onChange={(e) => setDraftRules({ ...draftRules, meetingRoom: e.target.value })}
                  className="w-full text-xs p-2.5 bg-gray-50 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-1">Basement Parking Space</label>
                <input 
                  type="text" 
                  value={draftRules.parking} 
                  onChange={(e) => setDraftRules({ ...draftRules, parking: e.target.value })}
                  className="w-full text-xs p-2.5 bg-gray-50 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-1">Utility Inclusion Policy</label>
                <input 
                  type="text" 
                  value={draftRules.utilities} 
                  onChange={(e) => setDraftRules({ ...draftRules, utilities: e.target.value })}
                  className="w-full text-xs p-2.5 bg-gray-50 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-1">Working Hours Restrictions</label>
                <input 
                  type="text" 
                  value={draftRules.workingHours} 
                  onChange={(e) => setDraftRules({ ...draftRules, workingHours: e.target.value })}
                  className="w-full text-xs p-2.5 bg-gray-50 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-1">Renewal Policy</label>
                <select 
                  value={draftRules.renewalPolicy} 
                  onChange={(e) => setDraftRules({ ...draftRules, renewalPolicy: e.target.value as any })}
                  className="w-full text-xs p-2.5 bg-gray-50 border rounded-lg"
                >
                  <option value="Manual">Manual Tenancy Review</option>
                  <option value="Automatic">Automatic Rolling Contract</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-1">Cancellation Policy Guidelines</label>
              <textarea 
                value={draftRules.cancellationPolicy} 
                onChange={(e) => setDraftRules({ ...draftRules, cancellationPolicy: e.target.value })}
                className="w-full text-xs p-2.5 bg-gray-50 border rounded-lg"
                rows={2}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-1">General Terms of Tenancy</label>
              <textarea 
                value={draftTerms} 
                onChange={(e) => setDraftTerms(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 border rounded-lg"
                rows={2}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-1">General Occupational Conditions</label>
              <textarea 
                value={draftConditions} 
                onChange={(e) => setDraftConditions(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 border rounded-lg"
                rows={2}
                required
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="secondary" onClick={() => setDraftBookingId(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={draftAgreementMutation.isPending}>Publish Agreement Draft</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Review & Sign Agreement Modal (Customer) */}
      <Modal 
        isOpen={!!selectedBookingForSigning} 
        onClose={() => {
          setSelectedBookingForSigning(null);
          setSignatureName('');
        }} 
        title="WeVentureHub Occupancy Lease Review Board"
      >
        {selectedBookingForSigning && (
          <div className="space-y-4 max-h-[85vh] overflow-y-auto p-1 font-sans">
            {isAgreementDetailsLoading ? (
              <div className="py-12 text-center text-neutral-slate-400">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs font-semibold">Retrieving corporate drafted parameters...</p>
              </div>
            ) : agreementDetails ? (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg flex items-start gap-2.5 text-xs text-purple-700">
                  <Signature className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold">Digital Lease Agreement Draft</h5>
                    <p className="mt-0.5">Please review the personalized inclusions, workspace rules, and terms customized for WeVentureHub premises below before execution.</p>
                  </div>
                </div>

                {/* Corporate Header */}
                <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50 space-y-3.5 text-xs text-gray-700">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-bold text-gray-900 text-sm">Agreement: {agreementDetails.agreementNumber}</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded uppercase">Awaiting Signature</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-neutral-slate-400 font-bold uppercase tracking-wider">Tenant Email</p>
                      <p className="font-semibold text-gray-900">{agreementDetails.userEmail}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-slate-400 font-bold uppercase tracking-wider">Premises Room</p>
                      <p className="font-semibold text-gray-900">{agreementDetails.workspaceName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-slate-400 font-bold uppercase tracking-wider">Start Date</p>
                      <p className="font-semibold text-gray-900">{new Date(agreementDetails.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-slate-400 font-bold uppercase tracking-wider">End Date</p>
                      <p className="font-semibold text-gray-900">{new Date(agreementDetails.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <h6 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider text-neutral-slate-500">Customized Premises Rules:</h6>
                    <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-neutral-slate-600">
                      <li><strong>Gigabit Fiber Internet:</strong> {agreementDetails.rules?.internet}</li>
                      <li><strong>Meeting Room Allocation:</strong> {agreementDetails.rules?.meetingRoom}</li>
                      <li><strong>Reserved Parking Slot:</strong> {agreementDetails.rules?.parking}</li>
                      <li><strong>Utility Services:</strong> {agreementDetails.rules?.utilities}</li>
                      <li><strong>Permitted Access Hours:</strong> {agreementDetails.rules?.workingHours}</li>
                      <li><strong>Renewal Rules:</strong> {agreementDetails.rules?.renewalPolicy} contract renewal</li>
                      <li><strong>Cancellation notice:</strong> {agreementDetails.rules?.cancellationPolicy}</li>
                    </ul>
                  </div>

                  <div className="border-t pt-3">
                    <h6 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider text-neutral-slate-500 mb-1">Primary Tenancy Terms:</h6>
                    <p className="text-[11px] leading-relaxed text-neutral-slate-600 bg-white p-2.5 rounded border border-gray-100">{agreementDetails.terms}</p>
                  </div>

                  <div className="border-t pt-3">
                    <h6 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider text-neutral-slate-500 mb-1">Breach occupancy conditions:</h6>
                    <p className="text-[11px] leading-relaxed text-neutral-slate-600 bg-white p-2.5 rounded border border-gray-100">{agreementDetails.conditions}</p>
                  </div>
                </div>

                {/* Digital Signature Interface */}
                <div className="space-y-2.5 border-t pt-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-slate-600 mb-1.5">Enter your full name as digital signature execution:</label>
                    <input 
                      type="text"
                      placeholder="e.g. Dawit Abraham"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      className="w-full text-sm p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="p-3 bg-gray-50 border rounded-lg flex items-start gap-2 text-[10px] text-neutral-slate-500">
                    <input type="checkbox" id="esign-cb" className="mt-0.5 rounded cursor-pointer" required />
                    <label htmlFor="esign-cb" className="cursor-pointer">
                      I hereby state that my digital signature above represents legal and binding corporate occupancy consent to WeVentureHub's workspace policies.
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => {
                        setSelectedBookingForSigning(null);
                        setSignatureName('');
                      }}
                    >
                      Dismiss
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={!signatureName.trim()}
                      onClick={() => {
                        signAgreementMutation.mutate({
                          bookingId: selectedBookingForSigning.id,
                          customerName: signatureName,
                        });
                      }}
                      isLoading={signAgreementMutation.isPending}
                    >
                      Submit Digital Signature
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-neutral-slate-400">
                <p className="text-xs">No active lease agreement found for this workspace reservation yet.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
