import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketingApi } from '../../lib/ticketingApi';
import { eventApi } from '../../lib/eventApi';
import { Button } from '../Button';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Search, 
  ChevronRight, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { RegistrationStatus } from '../../types';

export function MyRegistrations() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegId, setActiveRegId] = useState<string | null>(null);

  // 1. Fetch Registrations
  const { data: registrations = [], isLoading: isRegsLoading } = useQuery({
    queryKey: ['myRegistrations'],
    queryFn: () => ticketingApi.getMyRegistrations(),
  });

  // 2. Fetch Events list to map event details
  const { data: eventsResponse, isLoading: isEventsLoading } = useQuery({
    queryKey: ['events-all-lookup'],
    queryFn: () => eventApi.getEvents({ limit: 100 }),
  });

  const eventsList = eventsResponse?.data || [];

  // 3. Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => ticketingApi.cancelRegistration(id),
    onSuccess: () => {
      alert('Registration successfully cancelled. We have released your ticket allocation.');
      queryClient.invalidateQueries({ queryKey: ['myRegistrations'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Cancellation failed. Please contact support.');
    },
  });

  const handleCancelClick = (id: string) => {
    if (window.confirm('Are you absolutely sure you want to cancel this registration? This will release your seat and is irreversible.')) {
      cancelMutation.mutate(id);
    }
  };

  const getEventDetails = (eventId: string) => {
    return eventsList.find((evt) => evt.id === eventId);
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const event = getEventDetails(reg.eventId);
    const titleMatch = event?.title.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const numberMatch = reg.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || numberMatch;
  });

  const selectedReg = registrations.find((r) => r.id === activeRegId) || registrations[0];
  const selectedEvent = selectedReg ? getEventDetails(selectedReg.eventId) : null;

  if (isRegsLoading || isEventsLoading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-slate-400 font-mono">Synchronizing WeVentureHub Registries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-gray-200">
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">My Registered Tickets</h1>
          <p className="text-xs text-neutral-slate-400 mt-1">Manage your active event seats, RSVP parameters, and scanned passes.</p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets or event names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-brand-primary transition-colors"
          />
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-20 bg-neutral-slate-50/50 bg-white/15 border border-dashed border-gray-200 rounded-3xl">
          <Ticket className="w-12 h-12 text-neutral-slate-300 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg">No tickets found</h3>
          <p className="text-xs text-neutral-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
            You haven't reserved any tickets for active events yet. Head over to the Events Catalog to secure your seats.
          </p>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-8 h-8 text-neutral-slate-300 mx-auto mb-2" />
          <p className="text-xs text-neutral-slate-400">No tickets match your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Ticket Passes list (Left) */}
          <div className="lg:col-span-7 space-y-4">
            {filteredRegistrations.map((reg) => {
              const event = getEventDetails(reg.eventId);
              const isActive = reg.id === activeRegId || (!activeRegId && reg.id === registrations[0].id);

              return (
                <div
                  key={reg.id}
                  onClick={() => setActiveRegId(reg.id)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                    isActive
                      ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-neutral-slate-300 dark:hover:border-neutral-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            reg.status === RegistrationStatus.CONFIRMED
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : reg.status === RegistrationStatus.CANCELLED
                              ? 'bg-rose-500/15 text-rose-500'
                              : 'bg-amber-500/15 text-amber-500'
                          }`}>
                            {reg.status}
                          </span>
                          {reg.checkedIn && (
                            <span className="bg-brand-accent/15 text-brand-accent font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full">
                              Checked In
                            </span>
                          )}
                        </div>
                        <h3 className="font-display font-extrabold text-base text-gray-900 truncate">
                          {event?.title || 'Unknown Event'}
                        </h3>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {event?.schedule.startDate
                              ? new Date(event.schedule.startDate).toLocaleDateString()
                              : 'TBD'}
                          </span>
                        </div>
                        <span className="hidden sm:inline text-neutral-slate-300 dark:text-neutral-slate-700">•</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <Ticket className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{reg.ticketNumber}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`w-5 h-5 text-neutral-slate-400 shrink-0 self-center transition-transform ${isActive ? 'translate-x-1 text-brand-primary' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ticket QR Viewer & Action Panel (Right) */}
          <div className="lg:col-span-5">
            {selectedReg && (
              <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 shadow-sm sticky top-6 space-y-6">
                <div className="text-center space-y-2 pb-4 border-b border-gray-200">
                  <span className="text-[10px] font-mono font-extrabold text-neutral-slate-400 uppercase tracking-wider block">Attendee Pass Pocket</span>
                  <h2 className="font-display font-extrabold text-lg text-gray-900 truncate">
                    {selectedEvent?.title || 'Event Details'}
                  </h2>
                </div>

                {/* Digital Ticket Visualizer */}
                <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-neutral-slate-200/50 border-gray-200 space-y-5 text-center">
                  
                  {/* Event Metadata row */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wider">Attendee Name</span>
                    <h3 className="font-display font-extrabold text-base truncate">{selectedReg.attendeeName}</h3>
                    <p className="text-xs text-neutral-slate-400 truncate">{selectedReg.attendeeEmail}</p>
                  </div>

                  {/* QR Core Container */}
                  {selectedReg.status === RegistrationStatus.CANCELLED ? (
                    <div className="h-44 w-full bg-rose-500/5 rounded-xl border border-dashed border-rose-500/20 flex flex-col items-center justify-center p-4">
                      <XCircle className="w-10 h-10 text-rose-500 mb-2" />
                      <span className="text-xs font-bold text-rose-500 uppercase">Ticket Cancelled</span>
                      <p className="text-[10px] text-neutral-slate-400 mt-1 max-w-[200px] leading-relaxed">
                        This pass code was blacklisted upon self-service ticket cancellation.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-2xl border border-neutral-slate-200 shadow-sm inline-block select-none mx-auto">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedReg.qrCode)}`}
                        alt="Ticket pass QR Code"
                        className="w-36 h-36 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[9px] font-mono font-extrabold text-neutral-slate-400 tracking-wider block mt-2">
                        SCAN PASS AT CHECK-IN
                      </span>
                    </div>
                  )}

                  {/* Code Details */}
                  <div className="bg-white rounded-xl p-3 border border-neutral-slate-200/40 border-gray-200 text-left space-y-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-slate-400 font-semibold">TICKET ID</span>
                      <span className="text-gray-900 font-extrabold truncate max-w-[140px]">{selectedReg.ticketNumber}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-slate-400 font-semibold">CHECK-IN</span>
                      <span className={`font-extrabold ${selectedReg.checkedIn ? 'text-brand-accent' : 'text-neutral-slate-500'}`}>
                        {selectedReg.checkedIn ? 'Scanned & Confirmed' : 'Awaiting Entry'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Self service cancel block */}
                {selectedReg.status !== RegistrationStatus.CANCELLED && (
                  <Button
                    variant="secondary"
                    className="w-full text-xs font-bold py-2.5 text-rose-500 border-rose-500/10 hover:bg-rose-500/10 hover:text-rose-600 transition"
                    onClick={() => handleCancelClick(selectedReg.id)}
                    isLoading={cancelMutation.isPending}
                  >
                    Cancel Seat RSVP
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
