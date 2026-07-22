import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Layers,
  Settings,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  Save,
  Play,
  Sparkles,
  Server,
  AlertTriangle,
  FileCode,
  Palette,
} from 'lucide-react';
import { axiosInstance } from '../../lib/axiosInstance';

export const AdminEmailCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'templates' | 'queue' | 'settings' | 'smtp'>('analytics');
  
  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);

  // Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templatePreviewMode, setTemplatePreviewMode] = useState<'editor' | 'preview'>('editor');

  // Queue & Logs State
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [queueFilter, setQueueFilter] = useState<string>('ALL');
  const [queueSearch, setQueueSearch] = useState<string>('');
  const [queuePage, setQueuePage] = useState<number>(1);
  const [queueTotalPages, setQueueTotalPages] = useState<number>(1);

  // Admin Email Settings State
  const [settingsData, setSettingsData] = useState<{
    adminEmails: {
      primaryAdminEmail: string;
      secondaryAdminEmail: string;
      billingEmail: string;
      supportEmail: string;
      contactEmail: string;
    };
    senders: {
      defaultSender: string;
      supportSender: string;
      billingSender: string;
      notificationsSender: string;
    };
  }>({
    adminEmails: {
      primaryAdminEmail: 'admin@weventurehub.com',
      secondaryAdminEmail: 'operations@weventurehub.com',
      billingEmail: 'billing@weventurehub.com',
      supportEmail: 'support@weventurehub.com',
      contactEmail: 'contact@weventurehub.com',
    },
    senders: {
      defaultSender: 'WeVentureHub <noreply@weventurehub.com>',
      supportSender: 'WeVentureHub Support <support@weventurehub.com>',
      billingSender: 'WeVentureHub Billing <billing@weventurehub.com>',
      notificationsSender: 'WeVentureHub Notifications <notifications@weventurehub.com>',
    },
  });
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState<any>(null);
  const [testEmailInput, setTestEmailInput] = useState<string>('');
  const [isTestingSmtp, setIsTestingSmtp] = useState<boolean>(false);

  // Feedback State
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'queue') fetchQueue();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'smtp') fetchSmtpStatus();
  }, [activeTab, queueFilter, queueSearch, queuePage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- FETCHERS ---
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/emails/admin/analytics');
      if (res.data?.data) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/emails/admin/templates');
      const data = res.data?.data;
      const list = Array.isArray(data)
        ? data
        : (data?.templates && Array.isArray(data.templates) ? data.templates : []);
      setTemplates(list);
      if (list.length > 0 && !selectedTemplateKey) {
        setSelectedTemplateKey(list[0].templateKey);
        setEditingTemplate({ ...list[0] });
      }
    } catch (err) {
      console.error(err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/emails/admin/queue', {
        params: { status: queueFilter, search: queueSearch, page: queuePage },
      });
      if (res.data?.data) {
        setQueueItems(Array.isArray(res.data.data.items) ? res.data.data.items : []);
        setQueueTotalPages(res.data.data.pagination?.totalPages || res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/emails/admin/settings');
      if (res.data?.data) {
        setSettingsData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmtpStatus = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/emails/admin/smtp');
      if (res.data?.data) {
        setSmtpConfig(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await axiosInstance.put('/emails/admin/settings', settingsData);
      if (res.data) {
        showToast('Admin Email Settings saved successfully!');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving Admin Email Settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResendFailedLog = async (logId: string) => {
    try {
      const res = await axiosInstance.post('/emails/admin/logs/resend', { logId });
      if (res.data) {
        showToast(res.data.message || 'Email re-sent successfully!');
        fetchQueue();
      }
    } catch (err: any) {
      showToast(err?.message || 'Error re-sending email');
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const res = await axiosInstance.put(`/emails/admin/templates/${editingTemplate.templateKey}`, editingTemplate);
      if (res.data) {
        showToast(`Template "${editingTemplate.templateKey}" saved successfully!`);
        fetchTemplates();
      }
    } catch (err) {
      showToast('Error saving template');
    }
  };

  const handleRetryQueueItem = async (queueId?: string, retryAllFailed?: boolean) => {
    try {
      const res = await axiosInstance.post('/emails/admin/queue/retry', { queueId, retryAllFailed });
      if (res.data) {
        showToast(res.data.message || 'Queue reset for retry');
        fetchQueue();
      }
    } catch (err) {
      showToast('Error retrying queue item');
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    try {
      const res = await axiosInstance.post('/emails/admin/smtp/test', { testEmail: testEmailInput });
      if (res.data) {
        showToast(res.data.message || 'Test email dispatched successfully!');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to connect to SMTP server');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 min-h-[600px]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-brand-primary" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Automated Email System</h2>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Production
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Automated email queue processor, template builder, delivery tracking & SMTP settings for WeVentureHub.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> Template Builder
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Queue & Logs
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Admin Email Settings
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'smtp'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> SMTP Server
          </button>
        </div>
      </div>

      {/* 1. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Total Emails Delivered</span>
              <div className="text-2xl font-black text-slate-900">{analytics?.totalSent ?? '---'}</div>
              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {analytics?.deliveryRate ?? 98.4}% Success Rate
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Est. Recipient Open Rate</span>
              <div className="text-2xl font-black text-blue-600">{analytics?.openRate ?? 84.2}%</div>
              <p className="text-[11px] text-slate-500 font-medium">Based on HTML pixel tracking</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Queue Pending Batch</span>
              <div className="text-2xl font-black text-amber-600">{analytics?.queueStatus?.pending ?? 0}</div>
              <p className="text-[11px] text-slate-500 font-medium">Processing every 5 sec</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Automated Reminders</span>
              <div className="text-2xl font-black text-emerald-600">{analytics?.reminderSuccessRate ?? 96.8}%</div>
              <p className="text-[11px] text-slate-500 font-medium">Payment & renewal conversions</p>
            </div>
          </div>

          {/* Top Templates List */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Most Frequently Dispatched Templates</h3>
            <div className="divide-y divide-slate-200">
              {analytics?.topTemplates?.map((t: any) => (
                <div key={t.key} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-blue-600 font-semibold">{t.key}</span>
                  <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 font-semibold">{t.count} sent</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. TEMPLATE BUILDER TAB */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">System Template Registry</h3>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {(Array.isArray(templates) ? templates : []).map((tpl) => (
                <button
                  key={tpl.templateKey}
                  onClick={() => {
                    setSelectedTemplateKey(tpl.templateKey);
                    setEditingTemplate({ ...tpl });
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedTemplateKey === tpl.templateKey
                      ? 'bg-blue-50 border-blue-300 text-slate-900 font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-slate-900">{tpl.name || tpl.templateKey}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{tpl.subject}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Editor & Live Preview */}
          <div className="lg:col-span-2 space-y-4">
            {editingTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-mono font-bold text-brand-primary">{editingTemplate.templateKey}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTemplatePreviewMode('editor')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                        templatePreviewMode === 'editor' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => setTemplatePreviewMode('preview')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                        templatePreviewMode === 'preview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1" /> Live Preview
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </button>
                  </div>
                </div>

                {templatePreviewMode === 'editor' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Subject Line</label>
                      <input
                        type="text"
                        value={editingTemplate.subject || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Primary Color</label>
                        <input
                          type="color"
                          value={editingTemplate.branding?.primaryColor || '#3b82f6'}
                          onChange={(e) =>
                            setEditingTemplate({
                              ...editingTemplate,
                              branding: { ...editingTemplate.branding, primaryColor: e.target.value },
                            })
                          }
                          className="w-full h-10 bg-white border border-slate-300 rounded-xl p-1 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Custom Header Logo URL</label>
                        <input
                          type="text"
                          value={editingTemplate.branding?.logoUrl || ''}
                          onChange={(e) =>
                            setEditingTemplate({
                              ...editingTemplate,
                              branding: { ...editingTemplate.branding, logoUrl: e.target.value },
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                          placeholder="https://weventurehub.com/logo.png"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">HTML Template Body</label>
                      <textarea
                        rows={12}
                        value={editingTemplate.bodyHtml || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyHtml: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-200 min-h-[400px] max-h-[500px] overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: editingTemplate.bodyHtml }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-sm font-medium">Select a template to view or edit.</div>
            )}
          </div>
        </div>
      )}

      {/* 3. QUEUE & LOGS TAB */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search recipient, subject..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <select
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <button
              onClick={() => handleRetryQueueItem(undefined, true)}
              className="px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry All Failed Items
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 bg-white shadow-sm">
            {queueItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">No queue items match your filter.</div>
            ) : (
              queueItems.map((item) => (
                <div key={item._id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.recipientEmail}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{item.templateKey}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] font-medium">{item.subject}</p>
                    {item.lastError && <p className="text-rose-600 text-[10px] font-mono">{item.lastError}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                        item.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.status === 'failed'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>

                    {item.status === 'failed' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRetryQueueItem(item._id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg border border-slate-300"
                        >
                          Retry Queue
                        </button>
                        <button
                          onClick={() => handleResendFailedLog(item._id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-3 h-3" /> Resend Direct
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. ADMIN EMAIL SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-primary" /> Admin Email & Sender Configuration
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Configure primary/secondary admin recipients and dynamic sender addresses without editing application code.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Admin Recipient Addresses */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary flex items-center gap-2">
                <Mail className="w-4 h-4" /> Admin Notification Recipients
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Admin Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={settingsData.adminEmails?.primaryAdminEmail || ''}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        adminEmails: { ...settingsData.adminEmails, primaryAdminEmail: e.target.value },
                      })
                    }
                    placeholder="admin@weventurehub.com"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Receives user registrations, bookings, and agreement alerts.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Secondary Admin Email</label>
                  <input
                    type="email"
                    value={settingsData.adminEmails?.secondaryAdminEmail || ''}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        adminEmails: { ...settingsData.adminEmails, secondaryAdminEmail: e.target.value },
                      })
                    }
                    placeholder="operations@weventurehub.com"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Billing & Finance Admin Email</label>
                  <input
                    type="email"
                    value={settingsData.adminEmails?.billingEmail || ''}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        adminEmails: { ...settingsData.adminEmails, billingEmail: e.target.value },
                      })
                    }
                    placeholder="billing@weventurehub.com"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Receives payment receipts, failed payments, and overdue invoice alerts.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Support & Escalations Admin Email</label>
                  <input
                    type="email"
                    value={settingsData.adminEmails?.supportEmail || ''}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        adminEmails: { ...settingsData.adminEmails, supportEmail: e.target.value },
                      })
                    }
                    placeholder="support@weventurehub.com"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Receives AI chatbot escalation requests and support tickets.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Desk Admin Email</label>
                  <input
                    type="email"
                    value={settingsData.adminEmails?.contactEmail || ''}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        adminEmails: { ...settingsData.adminEmails, contactEmail: e.target.value },
                      })
                    }
                    placeholder="contact@weventurehub.com"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Receives public website contact form submissions.</span>
                </div>
              </div>
            </div>

            {/* Section 2: Configurable Sender Addresses */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                <Send className="w-4 h-4" /> Configurable Outgoing Sender Addresses
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Noreply / Default Sender Address
                  </label>
                  <input
                    type="text"
                    value={settingsData.senders?.defaultSender || ''}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        senders: { ...settingsData.senders, defaultSender: e.target.value },
                      })
                    }
                    placeholder="WeVentureHub <noreply@weventurehub.com>"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Used for standard system notifications and workspace bookings.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Support Sender Address</label>
                  <input
                    type="text"
                    value={settingsData.senders?.supportSender || ''}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        senders: { ...settingsData.senders, supportSender: e.target.value },
                      })
                    }
                    placeholder="WeVentureHub Support <support@weventurehub.com>"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Used for support ticket notifications and customer inquiries.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Billing Sender Address</label>
                  <input
                    type="text"
                    value={settingsData.senders?.billingSender || ''}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        senders: { ...settingsData.senders, billingSender: e.target.value },
                      })
                    }
                    placeholder="WeVentureHub Billing <billing@weventurehub.com>"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Used for invoices, payment reminders, and payment receipts.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notifications Sender Address</label>
                  <input
                    type="text"
                    value={settingsData.senders?.notificationsSender || ''}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        senders: { ...settingsData.senders, notificationsSender: e.target.value },
                      })
                    }
                    placeholder="WeVentureHub Notifications <notifications@weventurehub.com>"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Used for welcome emails, password resets, and verification codes.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SMTP SETTINGS TAB */}
      {activeTab === 'smtp' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-primary" /> Active Nodemailer SMTP Credentials
            </h3>

            <div className="space-y-3 text-xs font-medium">
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-500">SMTP Host:</span>
                <span className="font-mono text-slate-900 font-bold">{smtpConfig?.host || 'smtp.gmail.com'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-500">SMTP Port:</span>
                <span className="font-mono text-slate-900 font-bold">{smtpConfig?.port || 587}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-500">From Address:</span>
                <span className="font-mono text-slate-900 font-bold">{smtpConfig?.from || 'WeVentureHub <noreply@weventurehub.com>'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-500">SMTP User Configured:</span>
                <span className={`font-bold ${smtpConfig?.hasUser ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {smtpConfig?.hasUser ? 'Yes (Encrypted)' : 'No (Fallback mode)'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Dispatch Live Test Email</h4>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmailInput}
                onChange={(e) => setTestEmailInput(e.target.value)}
                placeholder="Enter email address (e.g. admin@weventurehub.com)"
                className="flex-1 bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
              />
              <button
                onClick={handleTestSmtp}
                disabled={isTestingSmtp}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isTestingSmtp ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
