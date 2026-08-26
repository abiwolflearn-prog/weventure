import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Users, 
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { axiosInstance } from '../../lib/axiosInstance';

interface BookingSettingsTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const BookingSettingsTab: React.FC<BookingSettingsTabProps> = ({ onSuccessToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking Rule States
  const [minDurationHours, setMinDurationHours] = useState<number>(1);
  const [bufferMinutes, setBufferMinutes] = useState<number>(15);
  const [advanceNoticeHours, setAdvanceNoticeHours] = useState<number>(2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(90);
  const [autoApprove, setAutoApprove] = useState<boolean>(true);
  const [cancellationHours, setCancellationHours] = useState<number>(24);
  const [cancellationRefundPercentage, setCancellationRefundPercentage] = useState<number>(100);
  const [eventDepositPercentage, setEventDepositPercentage] = useState<number>(20);
  const [eventReviewRequired, setEventReviewRequired] = useState<boolean>(true);
  const [cancellationPolicyText, setCancellationPolicyText] = useState<string>(
    'Free cancellation up to 24 hours prior to reservation. Cancellations within 24 hours are subject to a 50% reservation fee.'
  );

  useEffect(() => {
    fetchBookingRules();
  }, []);

  const fetchBookingRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/cms/company-info');
      const data = res.data?.data;
      if (data?.bookingRules) {
        const r = data.bookingRules;
        if (r.minDurationHours !== undefined) setMinDurationHours(r.minDurationHours);
        if (r.bufferMinutes !== undefined) setBufferMinutes(r.bufferMinutes);
        if (r.advanceNoticeHours !== undefined) setAdvanceNoticeHours(r.advanceNoticeHours);
        if (r.maxAdvanceDays !== undefined) setMaxAdvanceDays(r.maxAdvanceDays);
        if (r.autoApprove !== undefined) setAutoApprove(r.autoApprove);
        if (r.cancellationHours !== undefined) setCancellationHours(r.cancellationHours);
        if (r.cancellationRefundPercentage !== undefined) setCancellationRefundPercentage(r.cancellationRefundPercentage);
        if (r.eventDepositPercentage !== undefined) setEventDepositPercentage(r.eventDepositPercentage);
        if (r.eventReviewRequired !== undefined) setEventReviewRequired(r.eventReviewRequired);
        if (r.cancellationPolicyText) setCancellationPolicyText(r.cancellationPolicyText);
      }
    } catch (err: any) {
      console.warn('Using default booking rules', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload = {
        bookingRules: {
          minDurationHours: Number(minDurationHours),
          bufferMinutes: Number(bufferMinutes),
          advanceNoticeHours: Number(advanceNoticeHours),
          maxAdvanceDays: Number(maxAdvanceDays),
          autoApprove: Boolean(autoApprove),
          cancellationHours: Number(cancellationHours),
          cancellationRefundPercentage: Number(cancellationRefundPercentage),
          eventDepositPercentage: Number(eventDepositPercentage),
          eventReviewRequired: Boolean(eventReviewRequired),
          cancellationPolicyText,
        },
      };

      await axiosInstance.put('/cms/company-info', payload);
      setSavedSuccess(true);
      if (onSuccessToast) onSuccessToast('Booking parameters successfully updated');
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save booking rules.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <span>Loading booking parameters...</span>
      </div>
    );
  }

  return (
    <form id="booking-settings-form" onSubmit={handleSave} className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">Booking & Reservation Policies</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Set minimum session durations, buffer cleaning times, auto-approval workflows, and cancellation refund percentages.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#84CC16]/15 border border-[#84CC16]/30 px-3 py-1.5 rounded-full text-[#65A30D] text-xs font-bold select-none">
            <ShieldCheck className="w-4 h-4" />
            <span>Automated Conflict Protection</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 bg-[#84CC16]/15 border border-[#84CC16]/40 rounded-xl text-[#65A30D] text-sm flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Booking rules and reservation policies updated!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservation Rules */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Clock className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Timing & Availability Constraints</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Minimum Duration (Hours) *
              </label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={minDurationHours}
                onChange={(e) => setMinDurationHours(Number(e.target.value))}
                placeholder="1"
                required
              />
              <p className="text-xs text-slate-400 mt-1 font-medium">Shortest allowable meeting room booking.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Buffer Time Between Slots (Mins) *
              </label>
              <Input
                type="number"
                min="0"
                step="5"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
                placeholder="15"
                required
              />
              <p className="text-xs text-slate-400 mt-1 font-medium">Cleaning and equipment turnover buffer.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Advance Notice Required (Hours) *
              </label>
              <Input
                type="number"
                min="0"
                value={advanceNoticeHours}
                onChange={(e) => setAdvanceNoticeHours(Number(e.target.value))}
                placeholder="2"
                required
              />
              <p className="text-xs text-slate-400 mt-1 font-medium">Lead time before a session can begin.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Maximum Advance Days *
              </label>
              <Input
                type="number"
                min="1"
                value={maxAdvanceDays}
                onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                placeholder="90"
                required
              />
              <p className="text-xs text-slate-400 mt-1 font-medium">Furthest ahead members can book.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-slate-800">
            <label className="flex items-center justify-between p-3.5 rounded-[14px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="text-sm font-bold text-[#111111] dark:text-white">Auto-Approve Meeting Rooms & Desks</span>
                <p className="text-xs text-[#6B7280] dark:text-slate-400 font-medium">Automatically confirm reservations when space is available and payment is made.</p>
              </div>
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded text-[#84CC16] focus:ring-[#84CC16] h-4 w-4 shrink-0"
              />
            </label>
          </div>
        </div>

        {/* Cancellation & Events */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Layers className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Cancellation & Event Hall Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Free Cancellation Window (Hours) *
              </label>
              <Input
                type="number"
                min="0"
                value={cancellationHours}
                onChange={(e) => setCancellationHours(Number(e.target.value))}
                placeholder="24"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Standard Refund Percentage (%) *
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={cancellationRefundPercentage}
                onChange={(e) => setCancellationRefundPercentage(Number(e.target.value))}
                placeholder="100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Event Hall Deposit Required (%) *
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={eventDepositPercentage}
                onChange={(e) => setEventDepositPercentage(Number(e.target.value))}
                placeholder="20"
                required
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs font-bold text-[#111111] dark:text-slate-300 cursor-pointer p-3 rounded-[14px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={eventReviewRequired}
                  onChange={(e) => setEventReviewRequired(e.target.checked)}
                  className="rounded text-[#84CC16] focus:ring-[#84CC16]"
                />
                <span>Mandatory Admin Review for Event Hall</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Cancellation Policy Text (Client Facing)
            </label>
            <textarea
              rows={2}
              value={cancellationPolicyText}
              onChange={(e) => setCancellationPolicyText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-slate-800">
        <Button
          id="save-booking-rules-btn"
          type="submit"
          disabled={saving}
          variant="primary"
          className="flex items-center gap-2 px-6"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Booking Parameters</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
