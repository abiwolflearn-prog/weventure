import React, { useState } from 'react';
import { 
  Mail, 
  Bell, 
  Send, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Receipt, 
  Calendar, 
  FileText,
  Sliders
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';

interface EmailNotificationsTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const EmailNotificationsTab: React.FC<EmailNotificationsTabProps> = ({ onSuccessToast }) => {
  const [senderName, setSenderName] = useState('WeVentureHub Concierge');
  const [senderEmail, setSenderEmail] = useState('notifications@weventurehub.com');
  const [replyToEmail, setReplyToEmail] = useState('info@weventurehub.com');
  const [adminNotificationEmail, setAdminNotificationEmail] = useState('admin@weventurehub.com');

  // Trigger Toggles
  const [notifyBookingConfirm, setNotifyBookingConfirm] = useState(true);
  const [notifyPaymentSuccess, setNotifyPaymentSuccess] = useState(true);
  const [notifyQuotationReady, setNotifyQuotationReady] = useState(true);
  const [notifyInvoiceOverdue, setNotifyInvoiceOverdue] = useState(true);
  const [notifyEventWelcome, setNotifyEventWelcome] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      if (onSuccessToast) onSuccessToast('Email & notification preferences saved');
      setTimeout(() => setSavedSuccess(false), 4000);
    }, 600);
  };

  return (
    <form id="email-notifications-form" onSubmit={handleSave} className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">Email & System Notifications</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Configure automated transactional emails for Quotations, Invoices, Booking receipts, and Event registrations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#84CC16]/15 border border-[#84CC16]/30 px-3 py-1.5 rounded-full text-[#65A30D] text-xs font-bold select-none">
            <ShieldCheck className="w-4 h-4" />
            <span>Dedicated WeVentureHub SMTP Pipeline</span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-[#84CC16]/15 border border-[#84CC16]/40 rounded-xl text-[#65A30D] text-sm flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Email routing and notification dispatch rules updated!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sender Identity & Routing */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Send className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Email Sender Identity</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              From Display Name *
            </label>
            <Input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="WeVentureHub Concierge"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                From Email Address *
              </label>
              <Input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="notifications@weventurehub.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Reply-To Email *
              </label>
              <Input
                type="email"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                placeholder="info@weventurehub.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Operations Alert Recipient (Internal)
            </label>
            <Input
              type="email"
              value={adminNotificationEmail}
              onChange={(e) => setAdminNotificationEmail(e.target.value)}
              placeholder="admin@weventurehub.com"
            />
            <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 font-medium">
              Internal staff address alerted on new high-value quotation requests and event hall bookings.
            </p>
          </div>
        </div>

        {/* Transactional Triggers */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Bell className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Automated Client Notifications</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-[14px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 cursor-pointer">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#84CC16]" />
                <div>
                  <span className="text-xs font-bold text-[#111111] dark:text-white">Workspace Booking Confirmations</span>
                  <p className="text-[11px] text-[#6B7280] dark:text-slate-400 font-medium">Send instant confirmation with access details and calendar invite.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyBookingConfirm}
                onChange={(e) => setNotifyBookingConfirm(e.target.checked)}
                className="rounded text-[#84CC16] focus:ring-[#84CC16] h-4 w-4 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-[14px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 cursor-pointer">
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4 text-[#84CC16]" />
                <div>
                  <span className="text-xs font-bold text-[#111111] dark:text-white">Payment Settlement Receipts</span>
                  <p className="text-[11px] text-[#6B7280] dark:text-slate-400 font-medium">Email official stamped receipt upon bank or online transaction verification.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyPaymentSuccess}
                onChange={(e) => setNotifyPaymentSuccess(e.target.checked)}
                className="rounded text-[#84CC16] focus:ring-[#84CC16] h-4 w-4 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-[14px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-[#84CC16]" />
                <div>
                  <span className="text-xs font-bold text-[#111111] dark:text-white">Official Quotations Delivery</span>
                  <p className="text-[11px] text-[#6B7280] dark:text-slate-400 font-medium">Dispatch customized PDF quotation with settlement banks and amenities.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyQuotationReady}
                onChange={(e) => setNotifyQuotationReady(e.target.checked)}
                className="rounded text-[#84CC16] focus:ring-[#84CC16] h-4 w-4 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-[14px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#84CC16]" />
                <div>
                  <span className="text-xs font-bold text-[#111111] dark:text-white">Event Registration & Welcome</span>
                  <p className="text-[11px] text-[#6B7280] dark:text-slate-400 font-medium">Dispatch digital pass and venue directions for upcoming WeVentureHub events.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyEventWelcome}
                onChange={(e) => setNotifyEventWelcome(e.target.checked)}
                className="rounded text-[#84CC16] focus:ring-[#84CC16] h-4 w-4 shrink-0"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-slate-800">
        <Button
          type="submit"
          disabled={saving}
          variant="primary"
          className="flex items-center gap-2 px-6"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Saving Notifications...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Email Configuration</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
