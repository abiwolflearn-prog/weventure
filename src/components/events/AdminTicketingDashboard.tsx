import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketingApi } from '../../lib/ticketingApi';
import { eventApi } from '../../lib/eventApi';
import { paymentApi } from '../../lib/paymentApi';
import { Button } from '../Button';
import { Input } from '../Input';
import {
  Ticket,
  Users,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
  ClipboardList,
  Calendar,
  DollarSign,
  Scan,
  Sparkles,
  Search,
  AlertCircle,
  Eye,
  Check,
  Clock,
  Download,
  Mail,
  UserPlus,
  Trash,
  Tag
} from 'lucide-react';
import { TicketVisibility, TicketStatus, OrderStatus, RegistrationStatus, WaitlistStatus } from '../../types';

export function AdminTicketingDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'REGISTRATIONS' | 'ORDERS' | 'INVITATIONS' | 'PROMOS'>('TICKETS');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  // Ticket Form States
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [ticketFormName, setTicketFormName] = useState('');
  const [ticketFormDesc, setTicketFormDesc] = useState('');
  const [ticketFormPrice, setTicketFormPrice] = useState('0');
  const [ticketFormCapacity, setTicketFormCapacity] = useState('100');
  const [ticketFormUnlimited, setTicketFormUnlimited] = useState(false);
  const [ticketFormVisibility, setTicketFormVisibility] = useState<TicketVisibility>(TicketVisibility.PUBLIC);
  const [ticketFormSalesStart, setTicketFormSalesStart] = useState('');
  const [ticketFormSalesEnd, setTicketFormSalesEnd] = useState('');

  // QR Validator States
  const [qrInput, setQrInput] = useState('');
  const [qrScanResult, setQrScanResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // Search & Filter states
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [checkedInFilter, setCheckedInFilter] = useState<string>('ALL');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string>('ALL');

  // Invitations States
  const [inviteEmail, setInviteEmail] = useState('');

  // Promo Code Admin Panel States
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoFormCode, setPromoFormCode] = useState('');
  const [promoFormType, setPromoFormType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [promoFormValue, setPromoFormValue] = useState('');
  const [promoFormMaxUses, setPromoFormMaxUses] = useState('');
  const [promoFormExpiry, setPromoFormExpiry] = useState('');

  // 1. Queries
  const { data: eventsResponse } = useQuery({
    queryKey: ['events-admin-lookup'],
    queryFn: () => eventApi.getEvents({ limit: 100 }),
  });
  const events = eventsResponse?.data || [];

  // Default to first event if not selected
  React.useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Fetch ticket types for the selected event
  const { data: ticketTypes = [], isLoading: isTicketsLoading } = useQuery({
    queryKey: ['ticketTypes-admin', selectedEventId],
    queryFn: () => ticketingApi.getTicketTypes(selectedEventId, true),
    enabled: !!selectedEventId,
  });

  // Fetch Registrations
  const { data: registrations = [], refetch: refetchRegistrations } = useQuery({
    queryKey: ['registrations-admin', selectedEventId],
    queryFn: () => ticketingApi.getEventRegistrations(selectedEventId),
    enabled: !!selectedEventId,
  });

  // Fetch Waitlist
  const { data: waitlist = [] } = useQuery({
    queryKey: ['waitlist-admin', selectedEventId],
    queryFn: () => ticketingApi.getEventWaitlist(selectedEventId),
    enabled: !!selectedEventId,
  });

  // Fetch Orders
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-admin', selectedEventId],
    queryFn: () => ticketingApi.getEventOrders(selectedEventId),
    enabled: !!selectedEventId,
  });

  // Fetch Invitations
  const { data: invitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ['invitations-admin', selectedEventId],
    queryFn: () => ticketingApi.getEventInvitations(selectedEventId),
    enabled: !!selectedEventId && activeTab === 'INVITATIONS',
  });

  // Fetch Promo Codes
  const { data: promoCodes = [], refetch: refetchPromos } = useQuery({
    queryKey: ['promos-admin'],
    queryFn: () => paymentApi.getPromoCodes(),
    enabled: activeTab === 'PROMOS',
  });

  // 2. Mutations
  const createPromoMutation = useMutation({
    mutationFn: (data: any) => paymentApi.createPromoCode(data),
    onSuccess: () => {
      alert('Promo code created successfully!');
      refetchPromos();
      setShowPromoForm(false);
      setPromoFormCode('');
      setPromoFormValue('');
      setPromoFormMaxUses('');
      setPromoFormExpiry('');
    },
    onError: (err: any) => {
      alert(err.message || 'Promo code creation failed');
    },
  });

  const togglePromoMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => paymentApi.togglePromoCode(id, isActive),
    onSuccess: () => {
      refetchPromos();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to toggle promo code status');
    },
  });
  const createTicketMutation = useMutation({
    mutationFn: (data: any) => ticketingApi.createTicketType(data),
    onSuccess: () => {
      alert('Ticket category successfully created!');
      queryClient.invalidateQueries({ queryKey: ['ticketTypes-admin', selectedEventId] });
      resetTicketForm();
    },
    onError: (err: any) => {
      alert(err.message || 'Ticket creation failed');
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ticketingApi.updateTicketType(id, data),
    onSuccess: () => {
      alert('Ticket category updated!');
      queryClient.invalidateQueries({ queryKey: ['ticketTypes-admin', selectedEventId] });
      resetTicketForm();
    },
    onError: (err: any) => {
      alert(err.message || 'Ticket update failed');
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id: string) => ticketingApi.deleteTicketType(id),
    onSuccess: () => {
      alert('Ticket category successfully archived/deleted!');
      queryClient.invalidateQueries({ queryKey: ['ticketTypes-admin', selectedEventId] });
    },
    onError: (err: any) => {
      alert(err.message || 'Ticket deletion failed');
    },
  });

  const validateQrMutation = useMutation({
    mutationFn: (qrCode: string) => ticketingApi.validateQrCode(qrCode),
    onSuccess: (data) => {
      setQrScanResult({
        success: true,
        message: `Validated! Dynamic check-in confirmed for ${data.attendeeName}.`,
        data,
      });
      refetchRegistrations();
      setQrInput('');
    },
    onError: (err: any) => {
      setQrScanResult({
        success: false,
        message: err.message || 'Invalid or cancelled QR payload.',
      });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (id: string) => ticketingApi.promoteWaitlistEntry(id),
    onSuccess: () => {
      alert('Waitlisted attendee promoted successfully!');
      queryClient.invalidateQueries({ queryKey: ['waitlist-admin', selectedEventId] });
      refetchRegistrations();
    },
    onError: (err: any) => {
      alert(err.message || 'Promotion failed.');
    },
  });

  // Workflow Approvals Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => ticketingApi.approveRegistration(id),
    onSuccess: () => {
      alert('Registration approved successfully! Attendee ticket has been issued.');
      refetchRegistrations();
    },
    onError: (err: any) => {
      alert(err.message || 'Approval workflow failed.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => ticketingApi.rejectRegistration(id),
    onSuccess: () => {
      alert('Registration request rejected. Notification sent.');
      refetchRegistrations();
    },
    onError: (err: any) => {
      alert(err.message || 'Rejection workflow failed.');
    },
  });

  // Event Invitations Mutations
  const inviteMutation = useMutation({
    mutationFn: (email: string) => ticketingApi.inviteAttendee(selectedEventId, email),
    onSuccess: () => {
      alert('Invitation protocol successfully dispatched to attendee email!');
      setInviteEmail('');
      refetchInvitations();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to dispatch event invitation.');
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: (id: string) => ticketingApi.revokeInvitation(id),
    onSuccess: () => {
      alert('Invitation revoked successfully.');
      refetchInvitations();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to revoke invitation.');
    },
  });

  // 3. Handlers
  const resetTicketForm = () => {
    setShowTicketForm(false);
    setEditingTicketId(null);
    setTicketFormName('');
    setTicketFormDesc('');
    setTicketFormPrice('0');
    setTicketFormCapacity('100');
    setTicketFormUnlimited(false);
    setTicketFormVisibility(TicketVisibility.PUBLIC);
    setTicketFormSalesStart('');
    setTicketFormSalesEnd('');
  };

  const handleEditTicket = (ticket: any) => {
    setEditingTicketId(ticket.id);
    setTicketFormName(ticket.name);
    setTicketFormDesc(ticket.description || '');
    setTicketFormPrice(ticket.price.toString());
    setTicketFormCapacity(ticket.capacity?.maxQuantity.toString() || '0');
    setTicketFormUnlimited(!!ticket.capacity?.isUnlimited);
    setTicketFormVisibility(ticket.settings?.visibility || TicketVisibility.PUBLIC);
    setTicketFormSalesStart(ticket.availability?.salesStart ? new Date(ticket.availability.salesStart).toISOString().slice(0, 16) : '');
    setTicketFormSalesEnd(ticket.availability?.salesEnd ? new Date(ticket.availability.salesEnd).toISOString().slice(0, 16) : '');
    setShowTicketForm(true);
  };

  const handleTicketFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketFormName.trim()) {
      alert('Ticket name is required');
      return;
    }

    const payload = {
      eventId: selectedEventId,
      name: ticketFormName.trim(),
      description: ticketFormDesc.trim(),
      price: Number(ticketFormPrice) || 0,
      currency: 'USD',
      capacity: {
        maxQuantity: Number(ticketFormCapacity) || 0,
        isUnlimited: ticketFormUnlimited,
      },
      availability: {
        salesStart: ticketFormSalesStart || undefined,
        salesEnd: ticketFormSalesEnd || undefined,
      },
      settings: {
        minOrderQty: 1,
        maxOrderQty: 10,
        visibility: ticketFormVisibility,
      },
    };

    if (editingTicketId) {
      updateTicketMutation.mutate({ id: editingTicketId, data: payload });
    } else {
      createTicketMutation.mutate(payload);
    }
  };

  const handleQrValidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setQrScanResult(null);
    validateQrMutation.mutate(qrInput.trim());
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      alert('No attendee records match the current filter scope.');
      return;
    }

    const headers = ['Attendee Name', 'Attendee Email', 'Ticket Identifier', 'Admission Status', 'Check-In Status', 'Created At'];
    const rows = filteredRegistrations.map((reg) => [
      reg.attendeeName,
      reg.attendeeEmail,
      reg.ticketNumber,
      reg.status,
      reg.checkedIn ? 'Checked In' : 'Pending',
      new Date(reg.createdAt).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `weventurehub_attendees_${selectedEventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Analytics Calculations
  const calculatedStats = React.useMemo(() => {
    const totalSold = ticketTypes.reduce((acc, t) => acc + (t.capacity?.soldQuantity || 0), 0);
    const totalMax = ticketTypes.reduce((acc, t) => acc + (t.capacity?.isUnlimited ? 0 : t.capacity?.maxQuantity || 0), 0);
    const revenue = ticketTypes.reduce((acc, t) => acc + (t.price * (t.capacity?.soldQuantity || 0)), 0);
    const checkedInCount = registrations.filter((r) => r.checkedIn).length;
    return { totalSold, totalMax, revenue, checkedInCount };
  }, [ticketTypes, registrations]);

  // Filtered registrations
  const filteredRegistrations = registrations.filter((reg) => {
    // 1. Search Query
    const query = attendeeSearch.toLowerCase().trim();
    const matchesSearch = !query || 
      reg.attendeeName.toLowerCase().includes(query) ||
      reg.attendeeEmail.toLowerCase().includes(query) ||
      reg.ticketNumber.toLowerCase().includes(query);

    // 2. Status Filter
    const matchesStatus = statusFilter === 'ALL' || reg.status === statusFilter;

    // 3. Checked In Filter
    const matchesCheckedIn = checkedInFilter === 'ALL' || 
      (checkedInFilter === 'CHECKED_IN' && reg.checkedIn) ||
      (checkedInFilter === 'PENDING_GATE' && !reg.checkedIn);

    // 4. Ticket Type Filter
    const matchesTicketType = ticketTypeFilter === 'ALL' || reg.ticketTypeId === ticketTypeFilter;

    return matchesSearch && matchesStatus && matchesCheckedIn && matchesTicketType;
  });

  return (
    <div className="space-y-6">
      {/* Top filter selector row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-gray-200">
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-gray-900">Enterprise Ticketing Workspace</h1>
          <p className="text-xs text-neutral-slate-400 mt-1">Configure admission metrics, evaluate transaction history, and check-in attendees.</p>
        </div>

        {/* Dropdown to choose event */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-slate-400 shrink-0 select-none">Active Scope:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-xs pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl font-bold focus:outline-none focus:border-brand-primary cursor-pointer"
          >
            <option value="" disabled>Choose Event</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>{evt.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4.5 shadow-sm space-y-1.5">
          <span className="text-[10px] font-mono font-extrabold text-neutral-slate-400 uppercase block tracking-wider">Tickets Sold</span>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-extrabold text-xl md:text-2xl">{calculatedStats.totalSold}</span>
            <span className="text-xs text-neutral-slate-400">/ {calculatedStats.totalMax || '∞'}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4.5 shadow-sm space-y-1.5">
          <span className="text-[10px] font-mono font-extrabold text-neutral-slate-400 uppercase block tracking-wider">Estimated Revenue</span>
          <div className="flex items-baseline gap-0.5 text-brand-primary">
            <DollarSign className="w-4 h-4 shrink-0" />
            <span className="font-display font-extrabold text-xl md:text-2xl">{calculatedStats.revenue.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4.5 shadow-sm space-y-1.5">
          <span className="text-[10px] font-mono font-extrabold text-neutral-slate-400 uppercase block tracking-wider">Attendance Rate</span>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-extrabold text-xl md:text-2xl">
              {registrations.length > 0 ? Math.round((calculatedStats.checkedInCount / registrations.length) * 100) : 0}%
            </span>
            <span className="text-xs text-neutral-slate-400">({calculatedStats.checkedInCount} checked-in)</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4.5 shadow-sm space-y-1.5">
          <span className="text-[10px] font-mono font-extrabold text-neutral-slate-400 uppercase block tracking-wider">Active Waitlist</span>
          <div className="flex items-baseline gap-1 text-amber-500">
            <span className="font-display font-extrabold text-xl md:text-2xl">
              {waitlist.filter((w) => w.status === WaitlistStatus.WAITLISTED).length}
            </span>
            <span className="text-xs text-neutral-slate-400">in queue</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 gap-6 select-none overflow-x-auto">
        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`pb-3.5 text-xs font-extrabold uppercase tracking-wider relative transition-colors whitespace-nowrap ${
            activeTab === 'TICKETS' ? 'text-brand-primary font-bold' : 'text-neutral-slate-400 hover:text-neutral-slate-600'
          }`}
        >
          <span>Ticket Dashboard</span>
          {activeTab === 'TICKETS' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('REGISTRATIONS')}
          className={`pb-3.5 text-xs font-extrabold uppercase tracking-wider relative transition-colors whitespace-nowrap ${
            activeTab === 'REGISTRATIONS' ? 'text-brand-primary font-bold' : 'text-neutral-slate-400 hover:text-neutral-slate-600'
          }`}
        >
          <span>Registrations Dashboard</span>
          {activeTab === 'REGISTRATIONS' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`pb-3.5 text-xs font-extrabold uppercase tracking-wider relative transition-colors whitespace-nowrap ${
            activeTab === 'ORDERS' ? 'text-brand-primary font-bold' : 'text-neutral-slate-400 hover:text-neutral-slate-600'
          }`}
        >
          <span>Orders Dashboard</span>
          {activeTab === 'ORDERS' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('INVITATIONS');
            refetchInvitations();
          }}
          className={`pb-3.5 text-xs font-extrabold uppercase tracking-wider relative transition-colors whitespace-nowrap ${
            activeTab === 'INVITATIONS' ? 'text-brand-primary font-bold' : 'text-neutral-slate-400 hover:text-neutral-slate-600'
          }`}
        >
          <span>Invitations Manager</span>
          {activeTab === 'INVITATIONS' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('PROMOS');
            refetchPromos();
          }}
          className={`pb-3.5 text-xs font-extrabold uppercase tracking-wider relative transition-colors whitespace-nowrap ${
            activeTab === 'PROMOS' ? 'text-brand-primary font-bold' : 'text-neutral-slate-400 hover:text-neutral-slate-600'
          }`}
        >
          <span>Promotions & Coupons</span>
          {activeTab === 'PROMOS' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
          )}
        </button>
      </div>

      {/* ========================================================
          TAB 1: TICKET DASHBOARD (INVENTORY & CONFIGS)
          ======================================================== */}
      {activeTab === 'TICKETS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-gray-900">Configured Admission Categories</h3>
            <Button size="xs" onClick={() => { resetTicketForm(); setShowTicketForm(true); }} className="text-[10px] font-extrabold uppercase tracking-wider">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Ticket Tier</span>
            </Button>
          </div>

          {showTicketForm && (
            <form onSubmit={handleTicketFormSubmit} className="p-6 bg-[#F9FAFB] border border-gray-200 rounded-3xl space-y-4">
              <h4 className="font-display font-bold text-sm text-brand-primary">
                {editingTicketId ? 'Modify Admission Tier Specifications' : 'Establish New Admission Tier'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <Input
                  label="Category Name"
                  placeholder="e.g. VIP Access Pass"
                  value={ticketFormName}
                  onChange={(e) => setTicketFormName(e.target.value)}
                  required
                />
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-slate-500 uppercase">Visibility Policy</label>
                  <select
                    value={ticketFormVisibility}
                    onChange={(e) => setTicketFormVisibility(e.target.value as TicketVisibility)}
                    className="w-full text-xs pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl font-bold focus:outline-none focus:border-brand-primary"
                  >
                    <option value={TicketVisibility.PUBLIC}>PUBLIC</option>
                    <option value={TicketVisibility.PRIVATE}>PRIVATE</option>
                    <option value={TicketVisibility.UNLISTED}>UNLISTED</option>
                  </select>
                </div>
              </div>

              <div className="text-left">
                <Input
                  label="Tier Benefits / Description"
                  placeholder="Include meals, workbook logs, or premium seating location."
                  value={ticketFormDesc}
                  onChange={(e) => setTicketFormDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <Input
                  label="Ticket Price (USD)"
                  type="number"
                  placeholder="0 for free"
                  value={ticketFormPrice}
                  onChange={(e) => setTicketFormPrice(e.target.value)}
                  required
                />
                
                <div className="space-y-1.5">
                  <Input
                    label="Maximum Capacity Allocation"
                    type="number"
                    placeholder="e.g. 100"
                    value={ticketFormCapacity}
                    onChange={(e) => setTicketFormCapacity(e.target.value)}
                    disabled={ticketFormUnlimited}
                    required={!ticketFormUnlimited}
                  />
                  <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketFormUnlimited}
                      onChange={(e) => setTicketFormUnlimited(e.target.checked)}
                      className="rounded text-brand-primary"
                    />
                    <span>Unlimited Inventory Slots</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-slate-500 uppercase">Sales Start</label>
                    <input
                      type="datetime-local"
                      value={ticketFormSalesStart}
                      onChange={(e) => setTicketFormSalesStart(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 shadow-sm rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-slate-500 uppercase">Sales End</label>
                    <input
                      type="datetime-local"
                      value={ticketFormSalesEnd}
                      onChange={(e) => setTicketFormSalesEnd(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 shadow-sm rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={resetTicketForm}>Cancel</Button>
                <Button type="submit" size="sm" isLoading={createTicketMutation.isPending || updateTicketMutation.isPending}>
                  {editingTicketId ? 'Save Changes' : 'Establish Tier'}
                </Button>
              </div>
            </form>
          )}

          {isTicketsLoading ? (
            <div className="py-6 text-center text-xs text-neutral-slate-400 font-mono animate-pulse">Loading tickets...</div>
          ) : ticketTypes.length === 0 ? (
            <div className="text-center py-10 bg-white border border-gray-200 shadow-sm rounded-3xl">
              <p className="text-xs text-neutral-slate-400 font-medium">No admission categories are configured for this event scope.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB] text-neutral-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                    <th className="p-4">Tier Name</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Sold / Limit</th>
                    <th className="p-4">Visibility</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-slate-100 divide-gray-200">
                  {ticketTypes.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-neutral-slate-50/50 dark:hover:bg-neutral-slate-950/20">
                      <td className="p-4 text-left">
                        <span className="font-extrabold text-gray-900 block">{ticket.name}</span>
                        {ticket.description && <span className="text-[11px] text-neutral-slate-400 block mt-0.5 truncate max-w-[250px]">{ticket.description}</span>}
                      </td>
                      <td className="p-4 font-bold text-gray-900">${ticket.price.toFixed(2)}</td>
                      <td className="p-4">
                        <span className="font-bold">{ticket.capacity?.soldQuantity}</span>
                        <span className="text-neutral-slate-400"> / {ticket.capacity?.isUnlimited ? '∞' : ticket.capacity?.maxQuantity}</span>
                      </td>
                      <td className="p-4">
                        <span className="bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full text-[10px] font-bold">
                          {ticket.settings?.visibility || 'PUBLIC'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleEditTicket(ticket)} className="p-1.5 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg text-neutral-slate-500 hover:text-brand-primary transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Delete ticket type?')) deleteTicketMutation.mutate(ticket.id); }} className="p-1.5 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg text-neutral-slate-500 hover:text-rose-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: REGISTRATIONS DASHBOARD (ATTENDEE & CHECK-IN)
          ======================================================== */}
      {activeTab === 'REGISTRATIONS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Attendees and Queue list (Left) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Filter panel */}
              <div className="bg-[#F9FAFB] border border-neutral-slate-200/60 border-gray-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-slate-100 border-gray-200 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-slate-500">Filter Admissions Ledger</span>
                  <Button size="xs" variant="secondary" onClick={handleExportCSV} className="text-[10px] font-extrabold flex items-center gap-1.5 py-1 px-3">
                    <Download className="w-3.5 h-3.5 text-neutral-slate-500" />
                    <span>Export CSV</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
                  {/* Search Query Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-neutral-slate-400">Search Keyword</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search name, email, ticket..."
                        value={attendeeSearch}
                        onChange={(e) => setAttendeeSearch(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 bg-white rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-neutral-slate-400">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg font-semibold"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value={RegistrationStatus.CONFIRMED}>Confirmed</option>
                      <option value={RegistrationStatus.PENDING_APPROVAL}>Pending Approval</option>
                      <option value={RegistrationStatus.CANCELLED}>Cancelled</option>
                    </select>
                  </div>

                  {/* Check-In Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-neutral-slate-400">Gate Entry Status</label>
                    <select
                      value={checkedInFilter}
                      onChange={(e) => setCheckedInFilter(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg font-semibold"
                    >
                      <option value="ALL">All Check-Ins</option>
                      <option value="CHECKED_IN">Checked In</option>
                      <option value="PENDING_GATE">Pending Gate</option>
                    </select>
                  </div>

                  {/* Ticket Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-neutral-slate-400">Admission Ticket</label>
                    <select
                      value={ticketTypeFilter}
                      onChange={(e) => setTicketTypeFilter(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg font-semibold"
                    >
                      <option value="ALL">All Tiers</option>
                      {ticketTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Attendee registrations list table */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F9FAFB] text-neutral-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                      <th className="p-4">Name & Email</th>
                      <th className="p-4">Ticket Identifier</th>
                      <th className="p-4">Admission Status</th>
                      <th className="p-4">Check-In</th>
                      <th className="p-4 text-right">Workflow Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-slate-100 divide-gray-200">
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-slate-400">No active registrations mapped.</td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-neutral-slate-50/50 dark:hover:bg-neutral-slate-950/20">
                          <td className="p-4 text-left">
                            <span className="font-bold text-gray-900 block">{reg.attendeeName}</span>
                            <span className="text-[11px] text-neutral-slate-400 block mt-0.5">{reg.attendeeEmail}</span>
                          </td>
                          <td className="p-4 font-mono font-semibold text-left">{reg.ticketNumber}</td>
                          <td className="p-4 text-left">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              reg.status === RegistrationStatus.CONFIRMED
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : reg.status === RegistrationStatus.CANCELLED
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {reg.status}
                            </span>
                          </td>
                          <td className="p-4 text-left">
                            {reg.checkedIn ? (
                              <span className="text-emerald-500 flex items-center gap-1 font-bold">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span>Checked In</span>
                              </span>
                            ) : (
                              <span className="text-neutral-slate-400 flex items-center gap-1">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>Pending Gate</span>
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {reg.status === RegistrationStatus.PENDING_APPROVAL ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => approveMutation.mutate(reg.id)}
                                  disabled={approveMutation.isPending}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all"
                                  title="Approve registration"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => rejectMutation.mutate(reg.id)}
                                  disabled={rejectMutation.isPending}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all"
                                  title="Reject registration"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-neutral-slate-400 font-semibold select-none">BLUEPRINT LOCKED</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Waitlist queues */}
              <div className="space-y-3.5 pt-4">
                <h3 className="font-display font-bold text-base text-gray-900">Waitlist Active Queue</h3>
                <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden shadow-sm">
                  {waitlist.filter((w) => w.status === WaitlistStatus.WAITLISTED).length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-slate-400 font-medium">Waitlist queue is empty.</div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F9FAFB] text-neutral-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                          <th className="p-4">Queue Pos</th>
                          <th className="p-4">User Details</th>
                          <th className="p-4">Joined At</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-slate-100 divide-gray-200">
                        {waitlist
                          .filter((w) => w.status === WaitlistStatus.WAITLISTED)
                          .map((entry, index) => (
                            <tr key={entry.id} className="hover:bg-neutral-slate-50/50 dark:hover:bg-neutral-slate-950/20">
                              <td className="p-4 font-mono font-extrabold text-brand-primary text-sm text-left">#{index + 1}</td>
                              <td className="p-4 text-left">
                                <span className="font-bold text-gray-900 block">{entry.name}</span>
                                <span className="text-[11px] text-neutral-slate-400 block mt-0.5">{entry.userEmail}</span>
                              </td>
                              <td className="p-4 text-neutral-slate-500 text-left">{new Date(entry.joinedAt).toLocaleDateString()}</td>
                              <td className="p-4 text-right">
                                <Button
                                  size="xs"
                                  onClick={() => promoteMutation.mutate(entry.id)}
                                  className="text-[10px] font-extrabold uppercase py-1 px-3"
                                  isLoading={promoteMutation.isPending}
                                >
                                  Promote User
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            {/* QR Scanner Mockup Validator (Right) */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 shadow-sm sticky top-6 space-y-5">
                <div className="text-center space-y-2 border-b pb-4 border-gray-200">
                  <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Scan className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-base">QR Check-In Terminal</h3>
                  <p className="text-[11px] text-neutral-slate-400">Scan or type customer QR references to confirm gate entry logs.</p>
                </div>

                <form onSubmit={handleQrValidateSubmit} className="space-y-3">
                  <Input
                    placeholder="Paste/Type ticket number (e.g. WH-REG-...)"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    required
                    className="text-xs h-10 text-center font-mono font-bold"
                  />
                  <Button type="submit" className="w-full text-xs font-bold py-2.5" isLoading={validateQrMutation.isPending}>
                    Validate Gate Entry Pass
                  </Button>
                </form>

                {qrScanResult && (
                  <div className={`p-4 rounded-2xl border text-center space-y-3 ${
                    qrScanResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-500'
                  }`}>
                    <div className="flex justify-center">
                      {qrScanResult.success ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-500" />
                        </div>
                      ) : (
                        <XCircle className="w-8 h-8 text-rose-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-extrabold text-sm">
                        {qrScanResult.success ? 'Gate Access CONFIRMED' : 'Gate Access DENIED'}
                      </h4>
                      <p className="text-[11px] leading-relaxed font-semibold">
                        {qrScanResult.message}
                      </p>
                    </div>

                    {qrScanResult.success && qrScanResult.data && (
                      <div className="bg-white p-2.5 rounded-xl text-left border border-neutral-slate-200/50 border-gray-200 text-[10px] font-mono space-y-1">
                        <div>Attendee: <b className="text-gray-900">{qrScanResult.data.attendeeName}</b></div>
                        <div>Ticket: <b>{qrScanResult.data.ticketNumber}</b></div>
                        <div>Gate Log: <b>{new Date().toLocaleTimeString()}</b></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: ORDERS DASHBOARD (TRANSACTIONS)
          ======================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900 text-left">Historic Transaction Log</h3>
          
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden shadow-sm">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-neutral-slate-400 text-xs">No orders completed for this event scope.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB] text-neutral-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Order Reference</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Ticket Matrix</th>
                    <th className="p-4 text-right">Charged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-slate-100 divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-slate-50/50 dark:hover:bg-neutral-slate-950/20">
                      <td className="p-4 text-left">
                        <span className="font-bold text-gray-900 block">{order.userEmail}</span>
                        <span className="text-[11px] text-neutral-slate-400 block mt-0.5">ID: {order.userId.substring(18)}</span>
                      </td>
                      <td className="p-4 font-mono font-semibold text-left">{order.paymentDetails?.reference || 'WH-REF-N/A'}</td>
                      <td className="p-4 text-neutral-slate-500 text-left">{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td className="p-4 space-y-1 text-left">
                        {order.tickets?.map((t: any, i: number) => (
                          <div key={i} className="font-medium text-gray-600">
                            {t.name} <b className="text-neutral-slate-950 dark:text-white">x{t.quantity}</b>
                          </div>
                        ))}
                      </td>
                      <td className="p-4 text-right font-display font-extrabold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: INVITATIONS MANAGER (INVITE-ONLY EVENTS)
          ======================================================== */}
      {activeTab === 'INVITATIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Invitations List (Left) */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="font-display font-bold text-base text-gray-900 text-left">Dispatched Admission Invitations</h3>
            
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden shadow-sm">
              {invitations.length === 0 ? (
                <div className="py-12 text-center text-neutral-slate-400 text-xs">No active guest invitations have been generated for this event.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F9FAFB] text-neutral-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                      <th className="p-4">Invited Email</th>
                      <th className="p-4">Invitation Status</th>
                      <th className="p-4">Sent At</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-slate-100 divide-gray-200">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-neutral-slate-50/50 dark:hover:bg-neutral-slate-950/20">
                        <td className="p-4 text-left font-bold text-gray-900">{inv.email}</td>
                        <td className="p-4 text-left">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inv.status === 'ACCEPTED'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : inv.status === 'REVOKED'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-left text-neutral-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          {inv.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                if (confirm('Revoke invitation guest pass?')) {
                                  revokeInvitationMutation.mutate(inv.id);
                                }
                              }}
                              disabled={revokeInvitationMutation.isPending}
                              className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 text-neutral-slate-500 rounded-lg transition-all"
                              title="Revoke invitation"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-neutral-slate-400 select-none">HISTORIC</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Issue New Invitation Form (Right) */}
          <div className="lg:col-span-4 text-left">
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 shadow-sm sticky top-6 space-y-4">
              <div className="border-b pb-3 border-gray-200">
                <h3 className="font-display font-bold text-base flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-brand-primary" />
                  <span>Issue Guest Pass</span>
                </h3>
                <p className="text-[11px] text-neutral-slate-400">Invite a guest attendee via secure invite-only email links.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inviteEmail.trim()) {
                    inviteMutation.mutate(inviteEmail.trim());
                  }
                }}
                className="space-y-4"
              >
                <Input
                  label="Guest Email Address"
                  type="email"
                  placeholder="colleague@enterprise.com"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-xs h-10"
                />

                <Button
                  type="submit"
                  className="w-full text-xs font-bold py-2.5"
                  isLoading={inviteMutation.isPending}
                >
                  Dispatch Invitation
                </Button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 5: PROMOTIONS & COUPONS MANAGER
          ======================================================== */}
      {activeTab === 'PROMOS' && (
        <div className="space-y-6 text-left">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-gray-900">Workspace Discount & Coupon Codes</h3>
            <Button size="xs" onClick={() => setShowPromoForm(!showPromoForm)} className="text-[10px] font-extrabold uppercase tracking-wider">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Promo Code</span>
            </Button>
          </div>

          {showPromoForm && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!promoFormCode.trim() || !promoFormValue) {
                  alert('Code and discount value are required');
                  return;
                }
                createPromoMutation.mutate({
                  code: promoFormCode.toUpperCase().trim(),
                  discountType: promoFormType,
                  discountValue: Number(promoFormValue),
                  maxUses: promoFormMaxUses ? Number(promoFormMaxUses) : undefined,
                  expiryDate: promoFormExpiry || undefined
                });
              }}
              className="p-6 bg-[#F9FAFB] border border-gray-200 rounded-3xl space-y-4"
            >
              <h4 className="font-display font-bold text-sm text-brand-primary">Establish New Coupon Rules</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <Input
                  label="Promo / Coupon Code"
                  placeholder="e.g. SUMMER20"
                  value={promoFormCode}
                  onChange={(e) => setPromoFormCode(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-slate-500 uppercase">Discount Category</label>
                  <select
                    value={promoFormType}
                    onChange={(e) => setPromoFormType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                    className="w-full text-xs pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl font-bold focus:outline-none focus:border-brand-primary"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED VALUE (ETB / USD)</option>
                  </select>
                </div>

                <Input
                  label="Discount Value"
                  type="number"
                  placeholder="e.g. 20 or 250"
                  value={promoFormValue}
                  onChange={(e) => setPromoFormValue(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <Input
                  label="Usage Limit Count (Leave blank for unlimited)"
                  type="number"
                  placeholder="e.g. 100"
                  value={promoFormMaxUses}
                  onChange={(e) => setPromoFormMaxUses(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-slate-500 uppercase">Expiration Date</label>
                  <input
                    type="date"
                    value={promoFormExpiry}
                    onChange={(e) => setPromoFormExpiry(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 shadow-sm rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowPromoForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" isLoading={createPromoMutation.isPending}>Establish Rule</Button>
              </div>
            </form>
          )}

          {promoCodes.length === 0 ? (
            <div className="text-center py-10 bg-white border border-gray-200 shadow-sm rounded-3xl">
              <Tag className="w-8 h-8 text-neutral-slate-300 mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-neutral-slate-400 font-medium">No discount promo codes have been registered yet for this workspace.</p>
              <p className="text-[10px] text-neutral-slate-400/80 mt-1">Create coupons to boost registration conversion rates!</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB] text-neutral-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Benefit Type & Value</th>
                    <th className="p-4">Uses Count</th>
                    <th className="p-4">Expires</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-slate-100 divide-gray-200">
                  {promoCodes.map((promo: any) => (
                    <tr key={promo._id || promo.id} className="hover:bg-neutral-slate-50/50 dark:hover:bg-neutral-slate-950/20">
                      <td className="p-4 text-left font-extrabold font-mono tracking-wider text-brand-primary">{promo.code}</td>
                      <td className="p-4 font-bold">
                        {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}% OFF` : `${promo.discountValue} Off Flat`}
                      </td>
                      <td className="p-4 text-neutral-slate-500 font-medium">
                        {promo.uses} / {promo.maxUses || '∞'}
                      </td>
                      <td className="p-4 text-neutral-slate-400">
                        {promo.expiryDate ? new Date(promo.expiryDate).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          promo.isActive 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {promo.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          size="xs" 
                          variant={promo.isActive ? "secondary" : "primary"}
                          onClick={() => togglePromoMutation.mutate({ id: promo._id || promo.id, isActive: !promo.isActive })}
                          className="text-[10px] font-bold py-1 px-2.5 rounded-lg"
                        >
                          {promo.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
