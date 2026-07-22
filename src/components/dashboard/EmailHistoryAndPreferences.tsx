import React, { useState, useEffect } from 'react';
import { Mail, Bell, RefreshCw, CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { axiosInstance } from '../../lib/axiosInstance';

export interface IEmailLogItem {
  _id: string;
  recipientEmail: string;
  subject: string;
  category: string;
  templateKey: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt: string;
  errorMessage?: string;
}

export interface IEmailPreference {
  marketingEmails: boolean;
  bookingAlerts: boolean;
  paymentReminders: boolean;
  eventUpdates: boolean;
  securityAlerts: boolean;
}

export const EmailHistoryAndPreferences: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'preferences'>('history');
  const [logs, setLogs] = useState<IEmailLogItem[]>([]);
  const [preferences, setPreferences] = useState<IEmailPreference>({
    marketingEmails: true,
    bookingAlerts: true,
    paymentReminders: true,
    eventUpdates: true,
    securityAlerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoryAndPreferences();
  }, []);

  const fetchHistoryAndPreferences = async () => {
    setLoading(true);
    try {
      const [histRes, prefRes] = await Promise.all([
        axiosInstance.get('/emails/me/history'),
        axiosInstance.get('/emails/me/preferences'),
      ]);

      if (histRes.data?.data) {
        setLogs(histRes.data.data.logs || []);
      }
      if (prefRes.data?.data) {
        if (prefRes.data.data.preferences) {
          setPreferences(prefRes.data.data.preferences);
        }
      }
    } catch (err) {
      console.error('Failed to load email history/preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePreference = async (key: keyof IEmailPreference) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);

    try {
      const res = await axiosInstance.put('/emails/me/preferences', updated);
      if (res.data) {
        showToast('Preferences updated successfully!');
      }
    } catch (err) {
      console.error('Failed to update email preferences:', err);
    }
  };

  const handleResendEmail = async (logId: string) => {
    setResendingId(logId);
    try {
      const res = await axiosInstance.post('/emails/me/resend', { logId });
      if (res.data) {
        showToast('Email resent to your inbox!');
      } else {
        showToast('Failed to resend email');
      }
    } catch (err) {
      showToast('Error requesting email resend');
    } finally {
      setResendingId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Email Notifications & History
          </h2>
          <p className="text-xs text-slate-5-00 text-slate-500 mt-1">
            Manage your WeVentureHub email delivery logs and notification preferences.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delivery History ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'preferences'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preferences
          </button>
        </div>
      </div>

      {/* Tab 1: Delivery History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recent Sent Emails
            </span>
            <button
              onClick={fetchHistoryAndPreferences}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Loading your email history...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No sent emails recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">
                You will see a log of all booking confirmations, receipts, and account notices here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{log.subject}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                        {log.category || 'Notification'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.sentAt).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>Key: {log.templateKey}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {log.status === 'delivered' || log.status === 'sent' ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                        <XCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}

                    <button
                      onClick={() => handleResendEmail(log._id)}
                      disabled={resendingId === log._id}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${resendingId === log._id ? 'animate-spin' : ''}`} />
                      Resend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              WeVentureHub respects your inbox. Critical security and account verification emails are always enabled. You can toggle optional email notifications below.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Booking Alerts */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Workspace Booking Alerts</h4>
                <p className="text-xs text-slate-500">Confirmations, approval status updates, and space access codes.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={preferences.bookingAlerts}
                  onChange={() => handleTogglePreference('bookingAlerts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Payment Reminders */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Payment & Invoicing Notices</h4>
                <p className="text-xs text-slate-500">Invoices, payment receipts, and upcoming billing due date reminders.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={preferences.paymentReminders}
                  onChange={() => handleTogglePreference('paymentReminders')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Event Updates */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Events & Workshop Tickets</h4>
                <p className="text-xs text-slate-500">Admission passes, schedule updates, and venue reminders.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={preferences.eventUpdates}
                  onChange={() => handleTogglePreference('eventUpdates')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Marketing Emails */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Community News & Special Offers</h4>
                <p className="text-xs text-slate-500">WeVentureHub monthly newsletters, community highlights, and promotions.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={preferences.marketingEmails}
                  onChange={() => handleTogglePreference('marketingEmails')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Security Alerts (Always Enabled) */}
            <div className="py-4 flex items-center justify-between gap-4 opacity-75">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security & Authentication (Required)
                </h4>
                <p className="text-xs text-slate-500">OTP codes, password reset requests, and urgent account security updates.</p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">ALWAYS ON</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
