import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  AlertCircle
} from 'lucide-react';
import { useAppSelector } from '../store';
import { bookingApi } from '../lib/bookingApi';
import { workspaceApi } from '../lib/workspaceApi';
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
  status: 'PENDING_APPROVAL' | 'CONFIRMED' | 'CANCELLED';
  purpose?: string;
  qrCode: string;
}

export default function BookingList() {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal display state
  const [activeBooking, setActiveBooking] = useState<BookingRecord | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // User Roles Check
  const isAdminOrStaff = 
    user?.role === UserRole.SUPER_ADMIN || 
    user?.role === UserRole.TENANT_ADMIN || 
    user?.role === UserRole.STAFF;

  // ----------------------------------------------------
  // 1. Live Queries (TanStack Query)
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

  const bookings: BookingRecord[] = bookingsResponse?.data || [];
  const workspaces: any[] = workspacesResponse?.data || [];

  // Helper to find workspace name
  const findWorkspace = (spaceId: string) => {
    return workspaces.find((w) => w.id === spaceId);
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
  // 2. Mutations (Cancel / Approve / Reject)
  // ----------------------------------------------------
  const cancelBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await bookingApi.cancelBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setErrorBanner(null);
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
    },
    onError: (err: any) => {
      setErrorBanner(err.message || 'Failed to reject booking.');
    }
  });

  const handleCancelClick = (id: string) => {
    if (confirm('Are you sure you want to cancel this booking reservation?')) {
      cancelBookingMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl">My Reservations</h1>
          <p className="text-sm text-neutral-slate-400 mt-1">Review active passes, boardroom entries, and operator approval timelines.</p>
        </div>
        <Button 
          variant="secondary" 
          className="self-start text-xs flex items-center gap-2"
          onClick={() => {
            refetchBookings();
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Synchronize Reservations</span>
        </Button>
      </div>

      {/* Error display */}
      {errorBanner && (
        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Interactive status selectors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 border-b border-gray-200">
        <SlidersHorizontal className="w-4.5 h-4.5 text-neutral-slate-400 shrink-0" />
        {['ALL', 'CONFIRMED', 'PENDING_APPROVAL', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              statusFilter === st 
                ? 'bg-brand-primary text-white' 
                : 'bg-white border border-gray-200 text-neutral-slate-600 hover:bg-neutral-slate-50'
            }`}
          >
            {st === 'ALL' ? 'Show All' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {isBookingsLoading ? (
        <div className="p-12 text-center text-neutral-slate-400">
          <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm font-bold">Synchronizing reservations cache...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-white border-[#E5E7EB]">
          <CalendarRange className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="font-display font-bold text-base text-[#111827]">No Reservations Found</h3>
          <p className="text-xs text-[#4B5563] max-w-xs mx-auto mt-1">
            You don't have any bookings matching this category. Select and reserve an open space in our catalog page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((bkg) => {
            const workspace = findWorkspace(bkg.spaceId);
            const { date, time } = formatDateTimeRange(bkg.startTime, bkg.endTime);

            return (
              <div key={bkg.id} className="bento-card relative overflow-hidden flex flex-col justify-between">
                {/* Visual Status bar top */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  bkg.status === 'CONFIRMED' 
                    ? 'bg-emerald-500' 
                    : bkg.status === 'PENDING_APPROVAL' 
                    ? 'bg-amber-500' 
                    : 'bg-neutral-slate-300'
                }`} />

                <div className="space-y-4 pt-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-bold text-base text-gray-900">
                        {workspace ? workspace.name : 'Professional Space'}
                      </h3>
                      <p className="text-xs text-neutral-slate-400 font-mono mt-0.5">Reference: {bkg.id}</p>
                      {bkg.purpose && (
                        <p className="text-xs text-neutral-slate-500 italic mt-1 bg-[#F3F4F6] px-2 py-1 rounded">
                          Purpose: {bkg.purpose}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      bkg.status === 'CONFIRMED' 
                        ? 'bg-emerald-50/70 text-emerald-600' 
                        : bkg.status === 'PENDING_APPROVAL' 
                        ? 'bg-amber-50/70 text-amber-600' 
                        : 'bg-neutral-slate-100 text-neutral-slate-500'
                    }`}>
                      {bkg.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Booking schedule */}
                  <div className="space-y-2 text-xs text-neutral-slate-600 dark:text-neutral-slate-400">
                    <div className="flex items-center space-x-2">
                      <CalendarRange className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                      <span>{time}</span>
                    </div>
                    {isAdminOrStaff && (
                      <div className="flex items-center space-x-2 border-t pt-2 mt-2">
                        <User className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                        <span className="font-semibold text-brand-primary">User: {bkg.userEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="border-t border-gray-200 pt-4 mt-6 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">
                    Total: USD {bkg.totalAmount.toFixed(2)}
                  </span>

                  <div className="flex space-x-2">
                    {/* View QR dynamic ticket */}
                    {bkg.status === 'CONFIRMED' && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex items-center gap-1.5"
                        onClick={() => setActiveBooking(bkg)}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>View pass</span>
                      </Button>
                    )}

                    {/* Admin Actions */}
                    {isAdminOrStaff && bkg.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button 
                          size="sm"
                          variant="primary" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                          onClick={() => approveBookingMutation.mutate(bkg.id)}
                          isLoading={approveBookingMutation.isPending}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </Button>
                        <Button 
                          size="sm"
                          variant="danger" 
                          className="flex items-center gap-1"
                          onClick={() => rejectBookingMutation.mutate(bkg.id)}
                          isLoading={rejectBookingMutation.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </Button>
                      </>
                    )}

                    {/* Cancel button */}
                    {bkg.status !== 'CANCELLED' && (!isAdminOrStaff || bkg.status !== 'PENDING_APPROVAL') && (
                      <button 
                        onClick={() => handleCancelClick(bkg.id)}
                        className="p-2.5 text-rose-500 border border-transparent hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded-lg transition"
                        title="Cancel this reservation pass"
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

      {/* QR Code detailed pass overlay */}
      <Modal isOpen={!!activeBooking} onClose={() => setActiveBooking(null)} title="Dynamic Boarding Token">
        {activeBooking && (
          <div className="text-center space-y-6 py-6">
            <div className="p-4 bg-[#F3F4F6] rounded-2xl w-48 h-48 flex items-center justify-center mx-auto shadow-inner border">
              <div className="relative">
                <QrCode className="w-32 h-32 text-gray-900" />
                <div className="absolute inset-0 bg-brand-primary/5 rounded-lg border border-brand-primary animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg">
                {findWorkspace(activeBooking.spaceId)?.name || 'Professional Workspace'}
              </h3>
              <p className="text-xs text-neutral-slate-400 font-mono">CODE: {activeBooking.qrCode}</p>
              <p className="text-xs text-neutral-slate-500 leading-relaxed px-4">
                Present this encrypted access ticket pass to the hub check-in kiosk or onsite personnel to verify reservation boundaries.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl text-xs font-semibold inline-flex items-center space-x-2 mx-auto">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Dynamic Active Ticket Pass</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
