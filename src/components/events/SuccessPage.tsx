import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketingApi } from '../../lib/ticketingApi';
import { Button } from '../Button';
import { CheckCircle, Calendar, Sparkles, MapPin, Download, ArrowRight, ClipboardCheck } from 'lucide-react';
import { IOrder } from '../../types';

interface SuccessPageProps {
  order: IOrder;
  onDone: () => void;
  onGoToTickets: () => void;
}

export function SuccessPage({ order, onDone, onGoToTickets }: SuccessPageProps) {
  // Fetch all registrations for this user, then filter by orderId
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['myRegistrations'],
    queryFn: () => ticketingApi.getMyRegistrations(),
  });

  const orderTickets = registrations.filter((reg) => reg.orderId === order.id);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Visual Header confirmation */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5 animate-bounce">
          <CheckCircle className="w-9 h-9" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight">Reservation Confirmed!</h1>
          <p className="text-xs text-neutral-slate-400">Your seats have been booked in WeVentureHub's active registers.</p>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 border-gray-200 gap-2">
          <div>
            <span className="text-[10px] font-mono font-extrabold uppercase text-neutral-slate-400">Order Reference</span>
            <span className="font-mono text-sm font-extrabold text-gray-900 block mt-0.5">
              {order.paymentDetails?.reference || 'WH-ORDER-XYZ'}
            </span>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-mono font-extrabold uppercase text-neutral-slate-400">Total Charged</span>
            <span className="font-display font-extrabold text-lg text-brand-primary block mt-0.5">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tickets and QR Codes */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-sm text-neutral-slate-500 uppercase tracking-wider">Your Digital Entry Passes</h3>

          {isLoading ? (
            <div className="py-6 text-center text-xs text-neutral-slate-400 animate-pulse">
              Generating secure biometric passes...
            </div>
          ) : orderTickets.length === 0 ? (
            <div className="py-4 text-center text-xs text-neutral-slate-400">
              Pass generated. Head to "My Tickets" to view your QR codes.
            </div>
          ) : (
            <div className="space-y-4">
              {orderTickets.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-[#F9FAFB] rounded-2xl border border-neutral-slate-200/55 border-gray-200 p-5 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="space-y-3 text-center md:text-left flex-1 min-w-0">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Confirmed Attendee</span>
                      <h4 className="font-display font-extrabold text-base truncate">{reg.attendeeName}</h4>
                      <p className="text-xs text-neutral-slate-400 truncate">{reg.attendeeEmail}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 justify-center md:justify-start text-xs font-mono font-semibold text-neutral-slate-500">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Ticket No: {reg.ticketNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Image block */}
                  <div className="bg-white p-3 rounded-2xl border border-neutral-slate-200 shadow-sm flex flex-col items-center gap-1.5 select-none shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reg.qrCode)}`}
                      alt="Ticket QR Code"
                      className="w-28 h-28 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[9px] font-mono font-extrabold text-neutral-slate-400 tracking-wider">
                      SCAN AT ENTRY
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary Actions rows */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onGoToTickets}
          className="flex-1 text-xs font-bold py-2.5"
        >
          <span>View My Entry Passes</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
        <Button
          variant="secondary"
          onClick={onDone}
          className="flex-1 text-xs font-bold py-2.5"
        >
          Back to Events Catalog
        </Button>
      </div>
    </div>
  );
}
