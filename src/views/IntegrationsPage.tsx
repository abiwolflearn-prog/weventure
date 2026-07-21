import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { axiosInstance } from '../lib/axiosInstance';
import { 
  Key, 
  Webhook, 
  Cpu, 
  Play, 
  TrendingUp, 
  ToggleLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCw, 
  Trash2, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Terminal, 
  Send, 
  Activity, 
  AlertCircle, 
  Sliders,
  Sparkles,
  RefreshCw,
  Search,
  Check,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { paymentApi } from '../lib/paymentApi';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'inbound' | 'playground' | 'apps' | 'rules' | 'analytics'>('keys');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ArifPay Config States
  const [arifpayEnabled, setArifpayEnabled] = useState<boolean>(true);
  const [arifpayMethods, setArifpayMethods] = useState<Record<string, boolean>>({
    TELEBIRR: true,
    CBE: true,
    AWASH: true,
    DASHEN: true,
    ABYSSINIA: true
  });
  const [arifpaySaveSuccess, setArifpaySaveSuccess] = useState<string | null>(null);
  const [arifpayLoadingState, setArifpayLoadingState] = useState<boolean>(false);

  // 1. API Keys State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [showCreatedKeyModal, setShowCreatedKeyModal] = useState(false);
  const [createdRawKey, setCreatedRawKey] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 2. Outbound Webhooks State
  const [webhookSubs, setWebhookSubs] = useState<any[]>([]);
  const [subName, setSubName] = useState('');
  const [subUrl, setSubUrl] = useState('');
  const [subEnv, setSubEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['ticket.purchased']);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  // 3. Webhook Delivery Logs State
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // 4. Playground Console State
  const [playgroundApiKey, setPlaygroundApiKey] = useState('');
  const [playgroundMethod, setPlaygroundMethod] = useState<'GET' | 'POST'>('GET');
  const [playgroundPath, setPlaygroundPath] = useState('/api/events');
  const [playgroundBody, setPlaygroundBody] = useState('{\n  "title": "Enterprise Dev Meetup",\n  "category": "CONFERENCE",\n  "price": 1500\n}');
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [activeCodeLang, setActiveCodeLang] = useState<'curl' | 'node' | 'python'>('curl');

  // 5. Automation Rules State
  const [rules, setRules] = useState<any[]>([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState('ticket.purchased');
  const [newRuleAction, setNewRuleAction] = useState('slack_notify');
  const [newRuleSlackUrl, setNewRuleSlackUrl] = useState('');

  // 6. Connected Apps (Marketplace)
  const [connectedApps, setConnectedApps] = useState<any[]>([]);

  // 7. Analytics Data State
  const [analytics, setAnalytics] = useState<any>({
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
    errorRate: 0,
    avgLatency: 0,
    timelineData: [],
    recentLogs: []
  });
  const [analyticsEnv, setAnalyticsEnv] = useState<'sandbox' | 'production'>('sandbox');

  // Load baseline configurations
  useEffect(() => {
    fetchApiKeys();
    fetchWebhookSubs();
    fetchDeliveryLogs();
    fetchAutomationRules();
    fetchConnectedApps();
    fetchAnalytics();
    fetchArifPayConfig();
  }, []);

  // Fetch functions
  const fetchApiKeys = async () => {
    try {
      const res = await axiosInstance.get('/integrations/apikeys');
      if (res.data?.success) setApiKeys(res.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchWebhookSubs = async () => {
    try {
      const res = await axiosInstance.get('/integrations/webhooks');
      if (res.data?.success) setWebhookSubs(res.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchDeliveryLogs = async () => {
    try {
      const res = await axiosInstance.get('/integrations/logs');
      if (res.data?.success) setDeliveryLogs(res.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchAutomationRules = async () => {
    try {
      const res = await axiosInstance.get('/integrations/rules');
      if (res.data?.success) setRules(res.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchConnectedApps = async () => {
    try {
      const res = await axiosInstance.get('/integrations/connected-apps');
      if (res.data?.success) setConnectedApps(res.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchArifPayConfig = async () => {
    try {
      const config = await paymentApi.getArifPayConfig();
      if (config) {
        setArifpayEnabled(config.enabled !== false);
        if (config.settings) {
          setArifpayMethods(config.settings);
        }
      }
    } catch (err) {
      console.error('Error fetching ArifPay config:', err);
    }
  };

  const handleSaveArifPayConfig = async () => {
    setArifpayLoadingState(true);
    setArifpaySaveSuccess(null);
    try {
      await paymentApi.saveArifPayConfig({
        enabled: arifpayEnabled,
        settings: arifpayMethods
      });
      setArifpaySaveSuccess('ArifPay payment configuration saved successfully!');
      setTimeout(() => setArifpaySaveSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setArifpayLoadingState(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axiosInstance.get(`/integrations/analytics?environment=${analyticsEnv}`);
      if (res.data?.success) setAnalytics(res.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [analyticsEnv]);

  // Handle API Key Creation
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post('/integrations/apikeys', {
        name: newKeyName,
        environment: newKeyEnv,
      });
      if (res.data?.success) {
        setCreatedRawKey(res.data.data.rawKey);
        setShowCreatedKeyModal(true);
        setNewKeyName('');
        fetchApiKeys();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create key');
    } finally {
      setLoading(false);
    }
  };

  // Revoke Key
  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API credential key? It will be permanently invalidated immediately.')) return;
    try {
      await axiosInstance.delete(`/integrations/apikeys/${id}`);
      fetchApiKeys();
    } catch (err: any) {
      alert(err.message || 'Revocation failed');
    }
  };

  // Create Webhook Subscription
  const handleCreateWebhookSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !subUrl.trim()) return;
    try {
      const res = await axiosInstance.post('/integrations/webhooks', {
        name: subName,
        url: subUrl,
        events: selectedEvents,
        environment: subEnv,
      });
      if (res.data?.success) {
        setSubName('');
        setSubUrl('');
        setSelectedEvents(['ticket.purchased']);
        fetchWebhookSubs();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add webhook');
    }
  };

  // Test Outbound Webhook
  const handleTestWebhook = async (id: string) => {
    try {
      await axiosInstance.post(`/integrations/webhooks/${id}/test`);
      alert('Mock webhook ping event queued! Check Delivery Logs in a few seconds.');
      fetchDeliveryLogs();
    } catch (err: any) {
      alert(err.message || 'Webhook ping failed');
    }
  };

  // Delete Webhook Subscription
  const handleDeleteWebhookSub = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    try {
      await axiosInstance.delete(`/integrations/webhooks/${id}`);
      fetchWebhookSubs();
    } catch (err: any) {
      alert('Failed to delete subscription');
    }
  };

  // Retry Outbound Log
  const handleRetryWebhook = async (id: string) => {
    try {
      await axiosInstance.post(`/integrations/logs/${id}/retry`);
      alert('Manual dispatch queued! Checking logs again.');
      fetchDeliveryLogs();
    } catch (err: any) {
      alert('Retry trigger failed');
    }
  };

  // Create Automation Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    try {
      const config = newRuleAction === 'slack_notify' ? { webhookUrl: newRuleSlackUrl } : { template: 'Custom rule alerts triggered!' };
      const res = await axiosInstance.post('/integrations/rules', {
        name: newRuleName,
        triggerEvent: newRuleTrigger,
        actionType: newRuleAction,
        actionConfig: config,
      });
      if (res.data?.success) {
        setNewRuleName('');
        setNewRuleSlackUrl('');
        fetchAutomationRules();
      }
    } catch (err: any) {
      alert('Rule creation failed');
    }
  };

  // Delete Automation Rule
  const handleDeleteRule = async (id: string) => {
    if (!confirm('Remove this rule?')) return;
    try {
      await axiosInstance.delete(`/integrations/rules/${id}`);
      fetchAutomationRules();
    } catch (err: any) {
      alert('Failed to remove rule');
    }
  };

  // App toggle
  const handleToggleApp = async (appId: string, currentlyEnabled: boolean) => {
    try {
      await axiosInstance.post(`/integrations/connected-apps/${appId}/toggle`, {
        enabled: !currentlyEnabled,
      });
      fetchConnectedApps();
    } catch (err: any) {
      alert('Failed to toggle app integrations state');
    }
  };

  // Playground API testing console
  const runPlayground = async () => {
    if (!playgroundApiKey.trim()) {
      alert('Please provide a valid Client API Key to authenticate your live console call.');
      return;
    }
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${playgroundApiKey}`,
        'Content-Type': 'application/json',
      };

      const url = `/api/v1/integrations${playgroundPath}`;
      let response;

      if (playgroundMethod === 'GET') {
        response = await axios.get(url, { headers });
      } else {
        const parsedBody = JSON.parse(playgroundBody);
        response = await axios.post(url, parsedBody, { headers });
      }

      setPlaygroundResponse(response.data);
      fetchAnalytics();
      fetchDeliveryLogs();
    } catch (err: any) {
      setPlaygroundResponse(err.response?.data || { success: false, message: err.message });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  // Toggle Visibility Secret keys
  const toggleSecret = (id: string) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Generate dynamic code templates
  const getPlaygroundCodeTemplate = () => {
    const baseUrl = window.location.origin;
    if (activeCodeLang === 'curl') {
      return `curl -X ${playgroundMethod} "${baseUrl}/api/v1/integrations${playgroundPath}" \\
  -H "Authorization: Bearer ${playgroundApiKey || '<YOUR_API_KEY>'}" \\
  -H "Content-Type: application/json"${playgroundMethod === 'POST' ? ` \\\n  -d '${playgroundBody.replace(/\n/g, '')}'` : ''}`;
    }
    if (activeCodeLang === 'node') {
      return `import axios from 'axios';

axios.${playgroundMethod.toLowerCase()}('${baseUrl}/api/v1/integrations${playgroundPath}', ${playgroundMethod === 'POST' ? `${playgroundBody.replace(/\n/g, '\n  ')}, ` : ''}{
  headers: {
    'Authorization': 'Bearer ${playgroundApiKey || '<YOUR_API_KEY>'}',
    'Content-Type': 'application/json'
  }
})
.then(res => console.log(res.data))
.catch(err => console.error(err.response?.data || err.message));`;
    }
    return `import requests

url = "${baseUrl}/api/v1/integrations${playgroundPath}"
headers = {
    "Authorization": "Bearer ${playgroundApiKey || '<YOUR_API_KEY>'}",
    "Content-Type": "application/json"
}

response = requests.${playgroundMethod.toLowerCase()}(
    url, 
    headers=headers${playgroundMethod === 'POST' ? `, \n    json=${playgroundBody.replace(/\n/g, '\n    ')}` : ''}
)

print(response.json())`;
  };

  const webhookMockPayload = {
    eventId: "unique-event-id-12345",
    eventType: "ticket.purchased",
    timestamp: new Date().toISOString(),
    source: "Partner Website",
    data: {
      customerId: "998",
      customerName: "Alice Wonderland",
      email: "alice@adventure.com",
      ticketId: "TKT-007",
      eventName: "Cybersecurity Summit 2026",
      amount: 450,
      currency: "USD",
      paymentStatus: "completed"
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 text-slate-800">
      
      {/* Upper Brand Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#84CC16]/10 text-[#65A30D] text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#84CC16]" /> Enterprise Console
            </span>
          </div>
          <h1 id="integration-hub-header" className="text-3xl font-bold tracking-tight text-slate-900 mt-2">
            API & Integrations Platform
          </h1>
          <p className="text-slate-500 mt-1">
            Build custom apps, configure secure inbound/outbound real-time webhook systems, and govern WeVentureHub automation pipelines.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200/60 w-fit">
          <button 
            onClick={() => { setAnalyticsEnv('sandbox'); fetchAnalytics(); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${analyticsEnv === 'sandbox' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Sandbox Env
          </button>
          <button 
            onClick={() => { setAnalyticsEnv('production'); fetchAnalytics(); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${analyticsEnv === 'production' ? 'bg-[#84CC16] text-[#111111] shadow font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Production Env
          </button>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-0.5">
        {[
          { id: 'keys', label: 'Client API Keys', icon: Key },
          { id: 'webhooks', label: 'Outbound Webhooks', icon: Webhook },
          { id: 'inbound', label: 'Inbound Listener', icon: Play },
          { id: 'playground', label: 'Developer Portal (Playground)', icon: Code },
          { id: 'apps', label: 'Connected Apps', icon: ToggleLeft },
          { id: 'rules', label: 'Automation Rules', icon: Sliders },
          { id: 'analytics', label: 'API Analytics & Audit Logs', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? 'border-[#84CC16] text-[#65A30D]' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs view blocks */}
      <div className="mt-4">
        
        {/* TAB 1: API Keys */}
        {activeTab === 'keys' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
              <h2 className="text-lg font-bold text-[#111111] mb-2">Create New Client API Key</h2>
              <p className="text-sm text-[#6B7280] mb-6">
                Generate secure keys to authenticate external software requests with our Event & Workspace platform. Keep keys confidential.
              </p>
              
              <form onSubmit={handleCreateApiKey} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Key Label</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Salesforce Sync Pipeline"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                    required
                  />
                </div>
                
                <div className="w-full md:w-48 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Environment</label>
                  <select
                    value={newKeyEnv}
                    onChange={(e) => setNewKeyEnv(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84CC16] bg-white"
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#84CC16] text-[#111111] font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#A3E635] disabled:opacity-50 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {loading ? 'Creating...' : 'Generate Key'}
                </button>
              </form>
            </div>

            {/* List of Keys */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#111111]">Active API Credentials</h3>
                  <p className="text-xs text-[#6B7280]">Total keys configured for system access</p>
                </div>
                <button onClick={fetchApiKeys} className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200/60">
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200 uppercase">
                      <th className="p-4">Label</th>
                      <th className="p-4">Environment</th>
                      <th className="p-4">Key Token</th>
                      <th className="p-4">Rate Limit</th>
                      <th className="p-4">Last Used</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {apiKeys.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No active API keys found. Generate a key above to start integrating.
                        </td>
                      </tr>
                    ) : (
                      apiKeys.map((key) => (
                        <tr key={key.id} className="hover:bg-slate-50/80">
                          <td className="p-4 font-semibold text-slate-800">{key.name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${key.environment === 'production' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                              {key.environment}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{key.maskedKey}</code>
                              <button 
                                onClick={() => copyToClipboard(key.maskedKey, key.id)}
                                className="text-slate-400 hover:text-slate-800"
                              >
                                {copiedKey === key.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500">{key.rateLimit} req/min</td>
                          <td className="p-4 text-slate-500">
                            {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleRevokeKey(key.id)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Outbound Webhooks */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
              <h2 className="text-lg font-bold text-[#111111] mb-2">Configure Outbound Webhook Subscriptions</h2>
              <p className="text-sm text-[#6B7280] mb-6">
                Whenever key events fire (e.g. ticket purchase, registration check-in), we will send an HTTPS POST request to your designated endpoint with signature verification payload.
              </p>

              <form onSubmit={handleCreateWebhookSub} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase">Subscription Name</label>
                    <input
                      type="text"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      placeholder="e.g., Salesforce Booking Relay"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase">Endpoint URL (Must be HTTPS)</label>
                    <input
                      type="url"
                      value={subUrl}
                      onChange={(e) => setSubUrl(e.target.value)}
                      placeholder="https://yourdomain.com/webhook-receiver"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase">Environment</label>
                    <select
                      value={subEnv}
                      onChange={(e) => setSubEnv(e.target.value as any)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84CC16] bg-white"
                    >
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="production">Production</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase">Events Selection</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {[
                        'ticket.purchased', 
                        'payment.completed', 
                        'payment.failed', 
                        'registration.completed',
                        'booking.confirmed',
                        'event.created'
                      ].map((evt) => {
                        const hasSelected = selectedEvents.includes(evt);
                        return (
                          <button
                            type="button"
                            key={evt}
                            onClick={() => {
                              if (hasSelected) {
                                setSelectedEvents(selectedEvents.filter(e => e !== evt));
                              } else {
                                setSelectedEvents([...selectedEvents, evt]);
                              }
                            }}
                            className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                              hasSelected 
                                ? 'bg-[#84CC16] border-[#84CC16] text-[#111111] font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {evt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-[#84CC16] text-[#111111] font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#A3E635] transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Save Subscription
                  </button>
                </div>
              </form>
            </div>

            {/* List of Subscriptions */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-[#111111]">Your Webhook Subscriptions</h3>
                <p className="text-xs text-[#6B7280]">Endpoints receiving real-time outgoing system triggers</p>
              </div>

              <div className="divide-y divide-slate-100">
                {webhookSubs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No webhook endpoints configured. Set one up above to receive push alerts.
                  </div>
                ) : (
                  webhookSubs.map((sub) => (
                    <div key={sub.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{sub.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${sub.environment === 'production' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                            {sub.environment}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${sub.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {sub.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <code className="text-xs text-slate-500 font-mono block">{sub.url}</code>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {sub.events.map((evt: string) => (
                            <span key={evt} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md">
                              {evt}
                            </span>
                          ))}
                        </div>
                        
                        {/* Hidden signature secret key */}
                        <div className="flex items-center gap-2 pt-2 text-xs">
                          <span className="text-slate-400 font-medium">Shared Signature Secret:</span>
                          <code className="bg-slate-50 px-2 py-0.5 rounded font-mono text-slate-600 text-[11px]">
                            {visibleSecrets[sub.id] ? sub.secret : '••••••••••••••••••••••••••••••••'}
                          </code>
                          <button onClick={() => toggleSecret(sub.id)} className="text-slate-400 hover:text-slate-800">
                            {visibleSecrets[sub.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestWebhook(sub.id)}
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200/60 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" /> Test Webhook
                        </button>
                        <button
                          onClick={() => handleDeleteWebhookSub(sub.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg border border-slate-100 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Inbound Listener */}
        {activeTab === 'inbound' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 space-y-4">
              <h2 className="text-lg font-bold text-[#111111]">Secure Inbound Webhook Portal</h2>
              <p className="text-sm text-[#6B7280]">
                Integrate external platforms (e.g. payment portals, third-party ticket agents) to trigger custom event flows in our SaaS platform.
              </p>

              <div className="bg-slate-900 text-slate-200 p-5 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-semibold uppercase">Endpoint Parameters</span>
                  <span className="bg-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded text-[10px]">POST</span>
                </div>
                <div>
                  <span className="text-amber-400 font-semibold">Webhook Target URL:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-green-400 break-all">{window.location.origin}/api/webhooks/events</code>
                    <button 
                      onClick={() => copyToClipboard(`${window.location.origin}/api/webhooks/events`, 'inbound_url')}
                      className="text-slate-500 hover:text-white"
                    >
                      {copiedKey === 'inbound_url' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Security Header:</span>
                  <p className="mt-1 text-slate-300">
                     Include an <code className="text-amber-400">X-Signature</code> header containing an HMAC SHA-256 hex digest of the raw request payload signed with your webhook subscription secret.
                  </p>
                </div>
              </div>

              {/* Sample Webhook Payloads */}
              <div className="space-y-2">
                <h3 className="font-bold text-[#374151] text-sm">Sample JSON Payload Body</h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono text-[#374151] overflow-x-auto">
                  <pre>{JSON.stringify(webhookMockPayload, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Playground Developer Portal */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Console Configuration */}
            <div className="lg:col-span-5 bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 space-y-4">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#65A30D]" /> Live WVH API Playground
              </h2>
              <p className="text-xs text-[#6B7280]">
                Invoke real sandbox REST APIs using your newly generated API credentials directly inside your browser frame.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase">1. Authorize API Key</label>
                  <select
                    value={playgroundApiKey}
                    onChange={(e) => setPlaygroundApiKey(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="">-- Choose generated key --</option>
                    {apiKeys.map(k => (
                      <option key={k.id} value={k.maskedKey}>{k.name} ({k.maskedKey})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    For security, choose any active client API key above. Or copy-paste a raw key.
                  </p>
                  <input
                    type="text"
                    placeholder="Or enter raw wvh_test_... key directly"
                    value={playgroundApiKey}
                    onChange={(e) => setPlaygroundApiKey(e.target.value)}
                    className="w-full mt-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase">2. Select Endpoint</label>
                  <div className="flex gap-2">
                    <select
                      value={playgroundMethod}
                      onChange={(e) => {
                        const m = e.target.value as any;
                        setPlaygroundMethod(m);
                        if (m === 'GET') {
                          setPlaygroundPath('/api/events');
                        } else {
                          setPlaygroundPath('/api/events');
                        }
                      }}
                      className="px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50 text-slate-700"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                    
                    <select
                      value={playgroundPath}
                      onChange={(e) => setPlaygroundPath(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="/api/events">/api/events (Fetch/Create Events)</option>
                      <option value="/api/bookings">/api/bookings (Fetch Space Bookings)</option>
                    </select>
                  </div>
                </div>

                {playgroundMethod === 'POST' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase">3. Request Body (JSON)</label>
                    <textarea
                      value={playgroundBody}
                      onChange={(e) => setPlaygroundBody(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 focus:outline-none"
                    />
                  </div>
                )}

                <button
                  onClick={runPlayground}
                  disabled={playgroundLoading}
                  className="w-full bg-[#84CC16] text-[#111111] font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#A3E635] transition cursor-pointer"
                >
                  <Send className="w-4 h-4" /> {playgroundLoading ? 'Sending HTTP Request...' : 'Fire API Request'}
                </button>
              </div>
            </div>

            {/* Right Output Console and SDK Code Snippet Generator */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* SDK Code Snippets tab selection */}
              <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-[#111111] text-sm">Copyable SDK Snippet</h3>
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                    {['curl', 'node', 'python'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => setActiveCodeLang(lang as any)}
                        className={`px-2.5 py-1 text-[10px] font-semibold uppercase rounded-md transition-all ${
                          activeCodeLang === lang ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                    {getPlaygroundCodeTemplate()}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(getPlaygroundCodeTemplate(), 'playground_code')}
                    className="absolute top-2.5 right-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white p-1.5 rounded-md border border-slate-700/60 transition"
                  >
                    {copiedKey === 'playground_code' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Server Live Console Response */}
              <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 flex-1 flex flex-col min-h-64">
                <h3 className="font-bold text-[#111111] text-sm mb-3">Gateway Server Response Output</h3>
                
                <div className="bg-slate-950 text-green-400 p-4 rounded-lg font-mono text-xs flex-1 overflow-y-auto max-h-96 min-h-48">
                  {playgroundLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#65A30D]" /> Waiting for response gateway stream...
                    </div>
                  ) : playgroundResponse ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(playgroundResponse, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-500">API console ready. Configure fields on left panel and press "Fire API Request".</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: Connected Apps (Marketplace) */}
        {activeTab === 'apps' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">App Integration Marketplace</h2>
              <p className="text-sm text-slate-500">
                Instantly connect your WeVentureHub account to leading third party enterprise software suites. No coding required.
              </p>
            </div>

            {/* ArifPay Integration Panel */}
            <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                    <span className="text-2xl">💳</span> ArifPay Payment Gateway & Methods Configuration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage active payment methods for your community and toggle online transaction channels dynamically.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600">ArifPay Integration Status:</label>
                  <button
                    onClick={() => setArifpayEnabled(!arifpayEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      arifpayEnabled ? 'bg-brand-primary' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        arifpayEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-semibold ${arifpayEnabled ? 'text-brand-primary' : 'text-slate-400'}`}>
                    {arifpayEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>

              {/* Individual payment methods toggle checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { id: 'TELEBIRR', name: 'Telebirr', desc: 'Ethio Telecom Mobile Money', icon: '📱' },
                  { id: 'CBE', name: 'CBE Birr', desc: 'Commercial Bank of Ethiopia', icon: '🏦' },
                  { id: 'AWASH', name: 'Awash Bank', desc: 'Awash Birr Wallet & Cards', icon: '💳' },
                  { id: 'DASHEN', name: 'Dashen Amole', desc: 'Dashen Bank Amole Pay', icon: '⚡' },
                  { id: 'ABYSSINIA', name: 'Abyssinia', desc: 'Bank of Abyssinia Apollo', icon: '💫' },
                ].map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => {
                      if (!arifpayEnabled) return;
                      setArifpayMethods({
                        ...arifpayMethods,
                        [channel.id]: !arifpayMethods[channel.id]
                      });
                    }}
                    className={`p-4 rounded-xl border transition-all duration-250 cursor-pointer relative select-none flex flex-col justify-between h-28 ${
                      !arifpayEnabled ? 'opacity-40 cursor-not-allowed border-slate-100 bg-slate-50' :
                      arifpayMethods[channel.id]
                        ? 'border-brand-primary bg-brand-primary/5 shadow-xs'
                        : 'border-slate-200 hover:border-slate-350 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">{channel.icon}</span>
                      <input
                        type="checkbox"
                        checked={arifpayEnabled && !!arifpayMethods[channel.id]}
                        disabled={!arifpayEnabled}
                        readOnly
                        className="rounded text-brand-primary focus:ring-brand-primary pointer-events-none"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{channel.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{channel.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  {arifpaySaveSuccess && (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                      ✓ {arifpaySaveSuccess}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSaveArifPayConfig}
                  disabled={arifpayLoadingState}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-primary-hover shadow-md shadow-brand-primary/10 transition cursor-pointer flex items-center gap-1.5"
                >
                  {arifpayLoadingState ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>Save Configuration</>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectedApps.map((app) => (
                <div key={app.id} className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl">{app.logo}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${app.enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className="text-xs font-semibold text-slate-500">{app.enabled ? 'Connected' : 'Offline'}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{app.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{app.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Native OAuth2</span>
                    <button
                      onClick={() => handleToggleApp(app.id, app.enabled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        app.enabled 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                          : 'bg-[#84CC16] text-[#111111] font-bold hover:bg-[#A3E635]'
                      }`}
                    >
                      {app.enabled ? 'Disconnect App' : 'Connect & Authorize'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Automation Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
              <h2 className="text-lg font-bold text-[#111111] mb-2">Create Custom Event Automation Rule</h2>
              <p className="text-sm text-[#6B7280] mb-6">
                Create serverless workflows. When a specified event occurs, WeVentureHub will execute matching actions automatically.
              </p>

              <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Rule Title</label>
                  <input
                    type="text"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="Slack ping on purchase"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase">IF Event Triggers</label>
                  <select
                    value={newRuleTrigger}
                    onChange={(e) => setNewRuleTrigger(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="ticket.purchased">ticket.purchased</option>
                    <option value="payment.completed">payment.completed</option>
                    <option value="payment.failed">payment.failed</option>
                    <option value="booking.confirmed">booking.confirmed</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase">THEN Execute Action</label>
                  <select
                    value={newRuleAction}
                    onChange={(e) => setNewRuleAction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="slack_notify">Slack Channel Dispatch</option>
                    <option value="push_notify">Push Notification Alert</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <button
                    type="submit"
                    className="w-full bg-[#84CC16] text-[#111111] font-bold py-2.5 rounded-lg text-xs hover:bg-[#A3E635] transition cursor-pointer"
                  >
                    Add Trigger Rule
                  </button>
                </div>

                {newRuleAction === 'slack_notify' && (
                  <div className="space-y-1.5 md:col-span-4 mt-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase">Slack Webhook Destination URL</label>
                    <input
                      type="url"
                      value={newRuleSlackUrl}
                      onChange={(e) => setNewRuleSlackUrl(e.target.value)}
                      placeholder="Paste your Slack Incoming Webhook URL"
              
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                )}
              </form>
            </div>

            {/* List of Rules */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-[#111111]">Current Automation Workflows</h3>
                <p className="text-xs text-[#6B7280]">Rules controlling trigger actions</p>
              </div>

              <div className="divide-y divide-slate-100">
                {rules.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No automation rules defined. Create one above to link workflows.
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div key={rule.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{rule.name}</span>
                          <span className="bg-green-100 text-green-800 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase">Active</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          When <code className="text-amber-600 font-mono font-semibold">{rule.triggerEvent}</code> triggers, execute <span className="font-semibold text-slate-700">{rule.actionType}</span>.
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg border border-slate-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: Analytics & Audit Logs */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">Total Requests</span>
                  <span className="text-2xl font-bold text-[#111111] mt-1">{analytics.totalRequests}</span>
                </div>
                <div className="p-3 bg-[#84CC16]/10 rounded-lg text-[#65A30D]"><TrendingUp className="w-5 h-5" /></div>
              </div>

              <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">Avg Latency</span>
                  <span className="text-2xl font-bold text-[#111111] mt-1">{analytics.avgLatency} ms</span>
                </div>
                <div className="p-3 bg-[#84CC16]/10 rounded-lg text-[#65A30D]"><Clock className="w-5 h-5" /></div>
              </div>

              <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">Error Rate</span>
                  <span className="text-2xl font-bold mt-1 text-[#111111]">
                    {analytics.errorRate}%
                  </span>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-red-600"><AlertCircle className="w-5 h-5" /></div>
              </div>

              <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">Success rate</span>
                  <span className="text-2xl font-bold mt-1 text-[#111111]">
                    {analytics.totalRequests > 0 ? Math.round(((analytics.totalRequests - analytics.errorRequests) / analytics.totalRequests) * 100) : 100}%
                  </span>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-green-600"><CheckCircle className="w-5 h-5" /></div>
              </div>
            </div>

            {/* Performance charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                <h3 className="font-bold text-[#111111] text-sm mb-4">Request Volume Timeline</h3>
                <div className="h-64">
                  {analytics.timelineData && analytics.timelineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.timelineData}>
                        <defs>
                          <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#84CC16" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#84CC16" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} />
                        <YAxis stroke="#94A3B8" fontSize={10} />
                        <Tooltip />
                        <Area type="monotone" dataKey="requests" stroke="#65A30D" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" name="HTTP Requests" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No analytics logs recorded yet in this environment</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                <h3 className="font-bold text-[#111111] text-sm mb-4">Latency Distribution</h3>
                <div className="h-64">
                  {analytics.timelineData && analytics.timelineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.timelineData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} />
                        <YAxis stroke="#94A3B8" fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="latency" fill="#84CC16" name="Average Latency (ms)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No latency logs recorded yet in this environment</div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery logs table */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-[#111111]">Webhook Delivery Attempt History</h3>
                  <p className="text-xs text-[#6B7280]">Governed logs of inbound and outbound event deliveries</p>
                </div>
                <button onClick={fetchDeliveryLogs} className="p-2 hover:bg-slate-50 border border-slate-200/60 rounded-lg">
                  <RotateCw className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200 uppercase">
                      <th className="p-4">Event ID</th>
                      <th className="p-4">Direction</th>
                      <th className="p-4">Event Type</th>
                      <th className="p-4">Target / Source</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Code</th>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {deliveryLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">No delivery logs registered. Ensure webhooks are configured and triggered.</td>
                      </tr>
                    ) : (
                      deliveryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-mono text-xs">{log.eventId}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.direction === 'inbound' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {log.direction}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-800">{log.eventType}</td>
                          <td className="p-4 text-xs font-mono text-slate-500 break-all max-w-[150px]">{log.url}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              log.status === 'success' ? 'text-green-600' : log.status === 'failed' ? 'text-red-600' : 'text-amber-600 animate-pulse'
                            }`}>
                              {log.status === 'success' ? 'Delivered' : log.status === 'failed' ? 'Failed' : 'Pending'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500">{log.statusCode || '-'}</td>
                          <td className="p-4 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded"
                              >
                                {selectedLog?.id === log.id ? 'Hide Detail' : 'Inspect'}
                              </button>
                              {log.direction === 'outbound' && log.status === 'failed' && (
                                <button
                                  onClick={() => handleRetryWebhook(log.id)}
                                  className="text-[#65A30D] hover:bg-[#84CC16]/10 px-2 py-1 rounded text-xs border border-[#84CC16]/20 transition"
                                >
                                  Retry
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Collapsible log visualizer */}
              <AnimatePresence>
                {selectedLog && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-50 p-6 border-t border-slate-200 overflow-hidden text-xs space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-800 uppercase">Inspecting Webhook Deliver Envelope</span>
                      <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700">Close</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="space-y-2">
                        <span className="font-bold text-slate-600 uppercase block text-[10px]">HTTP Request Payload Body</span>
                        <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg overflow-x-auto max-h-60">
                          {JSON.stringify(selectedLog.payload, null, 2)}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold text-slate-600 uppercase block text-[10px]">Last Server Response Envelope</span>
                        <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg overflow-x-auto max-h-60">
                          {selectedLog.responseBody || selectedLog.errorMessage || 'No response captured'}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}

      </div>

      {/* MODAL: API Key display once warning */}
      <AnimatePresence>
        {showCreatedKeyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-amber-600">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-bold text-lg text-slate-900">Copy Your New Client API Key</h3>
              </div>
              
              <p className="text-sm text-slate-500 leading-relaxed">
                Please copy this key and store it securely. For safety, this credentials secret token will **NEVER** be displayed to you again. If lost, you must delete and generate a new key.
              </p>

              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs font-bold text-slate-800">
                <code className="break-all">{createdRawKey}</code>
                <button 
                  onClick={() => copyToClipboard(createdRawKey, 'raw_creation_key')}
                  className="bg-white hover:bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition"
                >
                  {copiedKey === 'raw_creation_key' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowCreatedKeyModal(false)}
                  className="bg-slate-900 hover:bg-slate-850 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition cursor-pointer"
                >
                  I've Saved the Key safely
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
