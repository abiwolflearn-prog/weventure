import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ticketingApi } from '../../lib/ticketingApi';
import { IEvent, ITicketType, TicketVisibility } from '../../types';
import { Button } from '../Button';
import { Input } from '../Input';
import { Ticket, Users, Clock, Plus, Minus, AlertCircle, Sparkles, CheckCircle, Upload, Eye, FileText } from 'lucide-react';

interface TicketSelectionProps {
  event: IEvent;
  onSuccess: (orderData: any) => void;
  onCancel: () => void;
}

interface AttendeeData {
  name: string;
  email: string;
  ticketTypeId: string;
  customAnswers: Record<string, any>;
}

export function TicketSelection({ event, onSuccess, onCancel }: TicketSelectionProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [attendeesData, setAttendeesData] = useState<AttendeeData[]>([]);

  // 1. Fetch Ticket Types
  const { data: ticketTypes = [], isLoading, isError } = useQuery({
    queryKey: ['ticketTypes', event.id],
    queryFn: () => ticketingApi.getTicketTypes(event.id),
  });

  // 2. Mutations
  const checkoutMutation = useMutation({
    mutationFn: (data: { 
      eventId: string; 
      attendeeName: string; 
      attendeeEmail: string; 
      tickets: { ticketTypeId: string; quantity: number }[];
      customAnswers?: Record<string, any>;
      groupAttendees?: { name: string; email: string; ticketTypeId: string; customAnswers?: Record<string, any> }[];
    }) => ticketingApi.createOrder(data),
    onSuccess: (data) => {
      onSuccess(data);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Check-out allocation failed. Please retry.');
    },
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: (data: { eventId: string; ticketTypeId: string; name: string }) =>
      ticketingApi.joinWaitlist(data),
    onSuccess: () => {
      alert('Successfully added to the event waitlist queue! We will notify you when a slot opens.');
      onCancel();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Waitlist entry failed. Please retry.');
    },
  });

  // Extract selected seats
  const selectedSeats: { ticketTypeId: string; ticketName: string; index: number }[] = [];
  Object.entries(quantities).forEach(([ticketTypeId, val]) => {
    const qty = val as number;
    const ticket = ticketTypes.find(t => t.id === ticketTypeId);
    if (ticket) {
      for (let i = 0; i < qty; i++) {
        selectedSeats.push({ ticketTypeId, ticketName: ticket.name, index: i });
      }
    }
  });

  // Sync attendee list when quantities change
  useEffect(() => {
    const nextData: AttendeeData[] = selectedSeats.map((seat, i) => {
      const existing = attendeesData[i];
      if (existing && existing.ticketTypeId === seat.ticketTypeId) return existing;
      return {
        name: existing?.name || '',
        email: existing?.email || '',
        ticketTypeId: seat.ticketTypeId,
        customAnswers: existing?.customAnswers || {},
      };
    });
    setAttendeesData(nextData);
  }, [quantities]);

  const handleQtyChange = (ticketTypeId: string, change: number, min: number, max: number, remaining: number) => {
    const current = quantities[ticketTypeId] || 0;
    let next = current + change;
    
    if (next < 0) next = 0;
    if (next > max) next = max;
    if (next > remaining) next = remaining;
    
    setQuantities({
      ...quantities,
      [ticketTypeId]: next,
    });
  };

  const calculateTotal = () => {
    return ticketTypes.reduce((sum, ticket) => {
      const qty = quantities[ticket.id] || 0;
      return sum + ticket.price * qty;
    }, 0);
  };

  const hasSelections = () => {
    return Object.values(quantities).some((qty) => (qty as number) > 0);
  };

  const handleCustomAnswerChange = (attendeeIdx: number, fieldId: string, value: any) => {
    setAttendeesData(prev => {
      const updated = [...prev];
      if (updated[attendeeIdx]) {
        updated[attendeeIdx] = {
          ...updated[attendeeIdx],
          customAnswers: {
            ...updated[attendeeIdx].customAnswers,
            [fieldId]: value
          }
        };
      }
      return updated;
    });
  };

  const handleAttendeeDetailsChange = (attendeeIdx: number, field: 'name' | 'email', value: string) => {
    setAttendeesData(prev => {
      const updated = [...prev];
      if (updated[attendeeIdx]) {
        updated[attendeeIdx] = {
          ...updated[attendeeIdx],
          [field]: value
        };
      }
      return updated;
    });
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!hasSelections()) {
      setFormError('Please select at least one ticket to continue.');
      return;
    }

    // Validation
    for (let i = 0; i < attendeesData.length; i++) {
      const att = attendeesData[i];
      const labelPrefix = attendeesData.length > 1 ? `Attendee #${i + 1}: ` : '';
      
      if (!att.name.trim() || !att.email.trim()) {
        setFormError(`${labelPrefix}Name and Email are required.`);
        return;
      }

      // Check dynamic fields
      const customFormFields = event.registrationSettings?.customFormFields || [];
      for (const field of customFormFields) {
        // Evaluate conditional rendering logic
        if (field.conditionalShow) {
          const dependentVal = att.customAnswers[field.conditionalShow.fieldId];
          if (dependentVal !== field.conditionalShow.value) {
            continue;
          }
        }

        const ansValue = att.customAnswers[field.id];
        if (field.required && (ansValue === undefined || ansValue === null || ansValue === '' || ansValue === false)) {
          setFormError(`${labelPrefix}Field "${field.label}" is required.`);
          return;
        }
      }
    }

    const ticketsPayload = Object.entries(quantities)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([ticketTypeId, qty]) => ({
        ticketTypeId,
        quantity: qty as number,
      }));

    if (attendeesData.length === 1) {
      checkoutMutation.mutate({
        eventId: event.id,
        attendeeName: attendeesData[0].name.trim(),
        attendeeEmail: attendeesData[0].email.trim(),
        tickets: ticketsPayload,
        customAnswers: attendeesData[0].customAnswers,
      });
    } else {
      checkoutMutation.mutate({
        eventId: event.id,
        attendeeName: attendeesData[0].name.trim(),
        attendeeEmail: attendeesData[0].email.trim(),
        tickets: ticketsPayload,
        groupAttendees: attendeesData.map(att => ({
          name: att.name.trim(),
          email: att.email.trim(),
          ticketTypeId: att.ticketTypeId,
          customAnswers: att.customAnswers,
        })),
      });
    }
  };

  // Drag and drop File Upload renderer
  const FileUploadInput = ({ 
    label, 
    required, 
    value, 
    onChange 
  }: { 
    key?: any;
    label: string; 
    required: boolean; 
    value: any; 
    onChange: (val: any) => void;
  }) => {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        onChange({ name: file.name, size: file.size, type: file.type });
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        onChange({ name: file.name, size: file.size, type: file.type });
      }
    };

    return (
      <div className="space-y-1 text-left">
        <label className="block text-[11px] font-bold text-neutral-slate-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
            dragActive 
              ? 'border-brand-primary bg-brand-primary/5' 
              : value 
                ? 'border-emerald-500 bg-emerald-500/5' 
                : 'border-gray-200 hover:bg-neutral-slate-50'
          }`}
        >
          <input 
            type="file" 
            id={`file-${label}`}
            className="hidden" 
            onChange={handleChange} 
          />
          <label htmlFor={`file-${label}`} className="cursor-pointer space-y-1 block">
            {value ? (
              <div className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>✓ {value.name} ({(value.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div className="text-xs text-neutral-slate-400 flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-neutral-slate-300" />
                <span>Drag & drop file here, or <span className="text-brand-primary font-bold">browse</span></span>
              </div>
            )}
          </label>
        </div>
      </div>
    );
  };

  const renderCustomFormField = (field: any, attendeeIdx: number, attAnswers: Record<string, any>) => {
    // Check conditional show
    if (field.conditionalShow) {
      const dependentVal = attAnswers[field.conditionalShow.fieldId];
      if (dependentVal !== field.conditionalShow.value) {
        return null;
      }
    }

    const value = attAnswers[field.id] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.id} className="space-y-1 text-left">
            <label className="block text-[11px] font-bold text-neutral-slate-500">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              required={field.required}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value}
              onChange={(e) => handleCustomAnswerChange(attendeeIdx, field.id, e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:border-brand-primary outline-none"
              rows={2}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-1 text-left">
            <label className="block text-[11px] font-bold text-neutral-slate-500">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              required={field.required}
              value={value}
              onChange={(e) => handleCustomAnswerChange(attendeeIdx, field.id, e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:border-brand-primary outline-none"
            >
              <option value="">Select an option</option>
              {field.options?.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center gap-2 text-left pt-1">
            <input
              type="checkbox"
              id={`${attendeeIdx}-${field.id}`}
              checked={!!value}
              onChange={(e) => handleCustomAnswerChange(attendeeIdx, field.id, e.target.checked)}
              className="rounded border-neutral-slate-300 text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor={`${attendeeIdx}-${field.id}`} className="text-[11px] font-bold text-neutral-slate-500 cursor-pointer">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-1 text-left">
            <label className="block text-[11px] font-bold text-neutral-slate-500">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-wrap gap-3.5 pt-0.5">
              {field.options?.map((opt: string) => (
                <label key={opt} className="flex items-center gap-1.5 text-xs text-neutral-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name={`${attendeeIdx}-${field.id}`}
                    value={opt}
                    checked={value === opt}
                    onChange={() => handleCustomAnswerChange(attendeeIdx, field.id, opt)}
                    className="text-brand-primary focus:ring-brand-primary"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'file':
        return (
          <FileUploadInput
            key={field.id}
            label={field.label}
            required={field.required}
            value={value}
            onChange={(val) => handleCustomAnswerChange(attendeeIdx, field.id, val)}
          />
        );

      default:
        return (
          <div key={field.id} className="space-y-1 text-left">
            <label className="block text-[11px] font-bold text-neutral-slate-500">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <Input
              required={field.required}
              type={field.type || 'text'}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              value={value}
              onChange={(e) => handleCustomAnswerChange(attendeeIdx, field.id, e.target.value)}
              className="text-xs h-10"
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-slate-400 font-mono">Synchronizing WeVentureHub Seat Matrix...</p>
      </div>
    );
  }

  if (isError || ticketTypes.length === 0) {
    return (
      <div className="py-10 text-center border border-gray-200 rounded-3xl space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-display font-bold">No active tickets listed</h3>
        <p className="text-xs text-neutral-slate-400 max-w-sm mx-auto">
          The event hosts haven't established public ticketing categories yet, or registration settings are private.
        </p>
        <Button size="sm" onClick={onCancel} variant="secondary">Back to Details</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Ticket Selection list (Left) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-1.5 border-b pb-3 border-gray-200 text-left">
          <h2 className="font-display font-extrabold text-xl">Select Ticket Tier</h2>
          <p className="text-xs text-neutral-slate-400">Choose your admission tier. Multi-checkout is active under tenant policy.</p>
        </div>

        <div className="space-y-4">
          {ticketTypes.map((ticket) => {
            const isSoldOut = !ticket.capacity.isUnlimited && ticket.capacity.soldQuantity >= ticket.capacity.maxQuantity;
            const remaining = ticket.capacity.isUnlimited ? Infinity : ticket.capacity.maxQuantity - ticket.capacity.soldQuantity;
            const qtySelected = quantities[ticket.id] || 0;

            return (
              <div
                key={ticket.id}
                className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
                  qtySelected > 0
                    ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-md text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base">{ticket.name}</h3>
                      {ticket.price === 0 && (
                        <span className="bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full">
                          FREE
                        </span>
                      )}
                    </div>
                    {ticket.description && (
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {ticket.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3.5 pt-1 text-[11px] font-mono text-neutral-slate-400 font-semibold">
                      <span>Min limit: {ticket.settings.minOrderQty}</span>
                      <span>•</span>
                      <span>Max limit: {ticket.settings.maxOrderQty}</span>
                      <span>•</span>
                      {!ticket.capacity.isUnlimited ? (
                        <span className={isSoldOut ? 'text-rose-500 font-bold' : 'text-neutral-slate-400'}>
                          {isSoldOut ? 'SOLD OUT' : `${remaining} remaining`}
                        </span>
                      ) : (
                        <span className="text-emerald-500">Unlimited slots</span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end gap-3 justify-between sm:justify-start">
                    <div className="text-right">
                      <span className="font-display font-extrabold text-lg text-gray-900">
                        {ticket.price === 0 ? '$0.00' : `$${ticket.price.toFixed(2)}`}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-slate-400 block tracking-wider font-mono">
                        {ticket.currency}
                      </span>
                    </div>

                    {isSoldOut ? (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => {
                          const name = prompt('Enter your name to join the waitlist:');
                          if (name && name.trim()) {
                            joinWaitlistMutation.mutate({
                              eventId: event.id,
                              ticketTypeId: ticket.id,
                              name: name.trim(),
                            });
                          }
                        }}
                        className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 rounded-full shrink-0"
                        isLoading={joinWaitlistMutation.isPending}
                      >
                        Join Waitlist
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-2.5">
                        <button
                          type="button"
                          disabled={qtySelected === 0}
                          onClick={() => handleQtyChange(ticket.id, -1, ticket.settings.minOrderQty, ticket.settings.maxOrderQty, remaining)}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-neutral-slate-500 hover:bg-neutral-slate-100 hover:bg-gray-150 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-sm font-extrabold w-5 text-center">
                          {qtySelected}
                        </span>
                        <button
                          type="button"
                          disabled={qtySelected >= remaining || qtySelected >= ticket.settings.maxOrderQty}
                          onClick={() => {
                            const step = qtySelected === 0 ? ticket.settings.minOrderQty : 1;
                            handleQtyChange(ticket.id, step, ticket.settings.minOrderQty, ticket.settings.maxOrderQty, remaining);
                          }}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-neutral-slate-500 hover:bg-neutral-slate-100 hover:bg-gray-150 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout details Form (Right Sidebar) */}
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b pb-3 border-gray-200 text-left">
            <h3 className="font-display font-bold text-base flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-brand-primary" />
              <span>Checkout Ledger</span>
            </h3>
            <p className="text-[11px] text-neutral-slate-400">Review selected quantities and attendee particulars.</p>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="space-y-6">
            
            {/* Dynamic fields rendered for each seat index */}
            {attendeesData.map((att, index) => (
              <div 
                key={index} 
                className={`space-y-4 text-left ${
                  index > 0 ? 'pt-4 border-t border-gray-200 mt-4' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-extrabold text-gray-700">
                    {index === 0 ? 'Primary Buyer Profile' : `Attendee #${index + 1} details`}
                  </span>
                </div>

                <div className="space-y-3">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Alice Vance"
                    value={att.name}
                    onChange={(e) => handleAttendeeDetailsChange(index, 'name', e.target.value)}
                    required
                    className="text-xs h-10"
                  />
                  <Input
                    label="Email Address"
                    placeholder="e.g. alice@weventurehub.com"
                    type="email"
                    value={att.email}
                    onChange={(e) => handleAttendeeDetailsChange(index, 'email', e.target.value)}
                    required
                    className="text-xs h-10"
                  />
                </div>

                {/* Custom Form Fields inside the dynamic form context */}
                {event.registrationSettings?.customFormFields && event.registrationSettings.customFormFields.length > 0 && (
                  <div className="space-y-3 pt-2 bg-neutral-slate-50/50 bg-white p-3 rounded-2xl border border-neutral-slate-100 border-gray-200">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-slate-400 block pb-1 border-b border-neutral-slate-100 border-gray-200">
                      Required Event Details
                    </span>
                    {event.registrationSettings.customFormFields.map((field: any) => 
                      renderCustomFormField(field, index, att.customAnswers)
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Price Calculations */}
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-neutral-slate-200/50 border-gray-200 space-y-3.5">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-neutral-slate-400 block text-left">Checkout Breakdown</span>
              
              <div className="space-y-2.5 max-h-32 overflow-y-auto">
                {ticketTypes.map((ticket) => {
                  const qty = quantities[ticket.id] || 0;
                  if (qty === 0) return null;
                  return (
                    <div key={ticket.id} className="flex justify-between items-center text-xs">
                      <span className="text-neutral-slate-500 font-medium max-w-[120px] truncate">
                        {ticket.name} <b className="text-gray-900">x{qty}</b>
                      </span>
                      <span className="font-mono text-gray-900 font-bold">
                        ${(ticket.price * qty).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                {!hasSelections() && (
                  <div className="text-center py-2 text-xs text-neutral-slate-400 font-medium">
                    No tickets selected yet
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200">
                <span className="text-xs font-bold">Total Cost</span>
                <span className="font-display font-extrabold text-lg text-brand-primary">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{formError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={!hasSelections() || checkoutMutation.isPending}
                className="w-full text-xs font-bold py-2.5"
                isLoading={checkoutMutation.isPending}
              >
                {event.registrationSettings?.requiresApproval ? 'Request Admission' : 'Complete Reservation'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="w-full text-xs font-bold py-2.5"
              >
                Back to Details
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
