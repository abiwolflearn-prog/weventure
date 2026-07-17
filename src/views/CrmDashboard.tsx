import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Activity as ActivityIcon, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  StickyNote, 
  Building, 
  Ticket, 
  Layers, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { crmApi, ICrmContact, ICrmCompany, ICrmLead, ICrmActivity } from '../lib/crmApi';
import { useAppSelector } from '../store';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

type ActiveTab = 'dashboard' | 'contacts' | 'companies' | 'leads' | 'activities';

export default function CrmDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Data State
  const [analytics, setAnalytics] = useState<any>(null);
  const [contacts, setContacts] = useState<ICrmContact[]>([]);
  const [companies, setCompanies] = useState<ICrmCompany[]>([]);
  const [leads, setLeads] = useState<ICrmLead[]>([]);
  const [activities, setActivities] = useState<ICrmActivity[]>([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatus, setContactStatus] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [leadStage, setLeadStage] = useState('');
  
  // Detail Modal / Active selection
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [contactDetailsLoading, setContactDetailsLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  // Form Modals State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // Form Editing IDs
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  // Form input states
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'ACTIVE' as 'ACTIVE' | 'LEAD' | 'INACTIVE',
    ecosystemRole: 'MEMBER' as 'MEMBER' | 'MENTOR' | 'SPEAKER' | 'SPONSOR' | 'PARTNER' | 'VOLUNTEER',
    leadSource: '',
    companyId: '',
    tagsString: '',
    customFields: {} as Record<string, any>
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '',
    website: '',
    phone: '',
    tagsString: '',
    customFields: {} as Record<string, any>
  });

  const [leadForm, setLeadForm] = useState({
    title: '',
    contactId: '',
    companyId: '',
    dealValue: 0,
    pipelineStage: 'NEW' as 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST',
    status: 'ACTIVE' as 'ACTIVE' | 'WON' | 'LOST' | 'ARCHIVED',
    customFields: {} as Record<string, any>
  });

  const [activityForm, setActivityForm] = useState({
    contactId: '',
    leadId: '',
    type: 'CALL' as any,
    title: '',
    description: '',
    assignedTo: '',
    outcome: ''
  });

  // Dynamic Custom Field inputs
  const [cfKey, setCfKey] = useState('');
  const [cfValue, setCfValue] = useState('');

  // Load initial data
  const loadCrmData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, contactsData, companiesData, leadsData, activitiesData] = await Promise.all([
        crmApi.getAnalytics(),
        crmApi.getContacts(),
        crmApi.getCompanies(),
        crmApi.getLeads(),
        crmApi.getActivities()
      ]);
      setAnalytics(analyticsData);
      setContacts(contactsData);
      setCompanies(companiesData);
      setLeads(leadsData);
      setActivities(activitiesData);
    } catch (err: any) {
      console.error('Failed to fetch CRM coordinates:', err);
      setError(err?.message || 'Error initializing Ecosystem CRM pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrmData();
  }, []);

  // Filter Contacts
  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const searchMatch = !contactSearch || 
      fullName.includes(contactSearch.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (contact.phone && contact.phone.includes(contactSearch));
    const statusMatch = !contactStatus || contact.status === contactStatus;
    const roleMatch = !contactRole || (contact.customFields && contact.customFields.ecosystemRole === contactRole);
    return searchMatch && statusMatch && roleMatch;
  });

  // Filter Companies
  const filteredCompanies = companies.filter((company) => {
    return !companySearch || company.name.toLowerCase().includes(companySearch.toLowerCase()) || 
      (company.domain && company.domain.toLowerCase().includes(companySearch.toLowerCase()));
  });

  // View contact details with integrations (Dynamic lookups)
  const handleViewContact = async (id: string) => {
    setContactDetailsLoading(true);
    try {
      const details = await crmApi.getContact(id);
      setSelectedContact(details);
    } catch (err: any) {
      alert(err?.message || 'Failed to load contact records.');
    } finally {
      setContactDetailsLoading(false);
    }
  };

  // Add Contact Note
  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedContact) return;
    try {
      const updated = await crmApi.addContactNote(
        selectedContact.id,
        user?.email || 'System Staff',
        newNoteText.trim()
      );
      setNewNoteText('');
      // Reload contact view
      handleViewContact(selectedContact.id);
      loadCrmData();
    } catch (err: any) {
      alert(err?.message || 'Failed to persist interaction note.');
    }
  };

  // Move Lead Stage (Interactive Pipeline lane move)
  const handleMoveLeadStage = async (leadId: string, newStage: any) => {
    try {
      let leadStatus: 'ACTIVE' | 'WON' | 'LOST' | 'ARCHIVED' = 'ACTIVE';
      if (newStage === 'WON') leadStatus = 'WON';
      else if (newStage === 'LOST') leadStatus = 'LOST';
      
      await crmApi.updateLead(leadId, { pipelineStage: newStage, status: leadStatus });
      
      // Auto log a pipeline change activity
      const leadObj = leads.find(l => l.id === leadId);
      if (leadObj) {
        await crmApi.createActivity({
          leadId,
          type: 'SYSTEM',
          title: `Opportunity Stage Progression`,
          description: `Lead [${leadObj.title}] was progressed to stage ${newStage}`,
          date: new Date().toISOString(),
          assignedTo: user?.email || 'System CRM Coordinator'
        });
      }
      
      loadCrmData();
    } catch (err: any) {
      alert(err?.message || 'Stage transfer failed.');
    }
  };

  // Submit Contact Form (Create/Edit)
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...contactForm,
        tags: contactForm.tagsString.split(',').map(t => t.trim()).filter(Boolean),
        customFields: {
          ...contactForm.customFields,
          ecosystemRole: contactForm.ecosystemRole
        }
      };
      if (editingContactId) {
        await crmApi.updateContact(editingContactId, payload);
      } else {
        await crmApi.createContact(payload);
      }
      setIsContactModalOpen(false);
      setEditingContactId(null);
      setContactForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        status: 'ACTIVE',
        ecosystemRole: 'MEMBER',
        leadSource: '',
        companyId: '',
        tagsString: '',
        customFields: {}
      });
      loadCrmData();
    } catch (err: any) {
      alert(err?.message || 'Error submitting contact details.');
    }
  };

  // Submit Company Form
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...companyForm,
        tags: companyForm.tagsString.split(',').map(t => t.trim()).filter(Boolean)
      };
      if (editingCompanyId) {
        await crmApi.updateCompany(editingCompanyId, payload);
      } else {
        await crmApi.createCompany(payload);
      }
      setIsCompanyModalOpen(false);
      setEditingCompanyId(null);
      setCompanyForm({
        name: '',
        domain: '',
        industry: '',
        size: '',
        website: '',
        phone: '',
        tagsString: '',
        customFields: {}
      });
      loadCrmData();
    } catch (err: any) {
      alert(err?.message || 'Error submitting company details.');
    }
  };

  // Submit Lead Form
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLeadId) {
        await crmApi.updateLead(editingLeadId, leadForm);
      } else {
        const created = await crmApi.createLead(leadForm);
        // Automatically log system CRM event
        await crmApi.createActivity({
          leadId: created.id,
          type: 'SYSTEM',
          title: `New Business Lead Configured`,
          description: `Opportunity [${leadForm.title}] initialized with a value of $${leadForm.dealValue}`,
          date: new Date().toISOString()
        });
      }
      setIsLeadModalOpen(false);
      setEditingLeadId(null);
      setLeadForm({
        title: '',
        contactId: '',
        companyId: '',
        dealValue: 0,
        pipelineStage: 'NEW',
        status: 'ACTIVE',
        customFields: {}
      });
      loadCrmData();
    } catch (err: any) {
      alert(err?.message || 'Error submitting lead details.');
    }
  };

  // Submit Activity Form
  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...activityForm,
        date: new Date().toISOString(),
        assignedTo: activityForm.assignedTo || user?.email || 'System Staff'
      };
      await crmApi.createActivity(payload);
      setIsActivityModalOpen(false);
      setActivityForm({
        contactId: '',
        leadId: '',
        type: 'CALL',
        title: '',
        description: '',
        assignedTo: '',
        outcome: ''
      });
      loadCrmData();
    } catch (err: any) {
      alert(err?.message || 'Error logging CRM activity.');
    }
  };

  // Handle deletes
  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact and its associated opportunities?')) return;
    try {
      await crmApi.deleteContact(id);
      if (selectedContact?.id === id) setSelectedContact(null);
      loadCrmData();
    } catch (err: any) {
      alert(err?.message || 'Deletion failed.');
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Are you sure you want to retire this company portfolio?')) return;
    try {
      await crmApi.deleteCompany(id);
      loadCrmData();
    } catch (err: any) {
      alert(err?.message || 'Deletion failed.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to dismiss this business lead opportunity?')) return;
    try {
      await crmApi.deleteLead(id);
      loadCrmData();
    } catch (err: any) {
      alert(err?.message || 'Deletion failed.');
    }
  };

  // Add custom fields handler
  const handleAddCustomField = (formType: 'contact' | 'company' | 'lead') => {
    if (!cfKey.trim() || !cfValue.trim()) return;
    if (formType === 'contact') {
      setContactForm({
        ...contactForm,
        customFields: { ...contactForm.customFields, [cfKey.trim()]: cfValue.trim() }
      });
    } else if (formType === 'company') {
      setCompanyForm({
        ...companyForm,
        customFields: { ...companyForm.customFields, [cfKey.trim()]: cfValue.trim() }
      });
    } else if (formType === 'lead') {
      setLeadForm({
        ...leadForm,
        customFields: { ...leadForm.customFields, [cfKey.trim()]: cfValue.trim() }
      });
    }
    setCfKey('');
    setCfValue('');
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-neutral-slate-500 font-semibold">Decrypting Ecosystem CRM & member directories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 text-rose-700 rounded-xl max-w-lg mx-auto mt-12 text-center border">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-pulse" />
        <h3 className="font-bold text-base mb-1">CRM Launch Failure</h3>
        <p className="text-xs">{error}</p>
        <button onClick={loadCrmData} className="mt-4 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700 transition">
          Retry System Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Upper Module Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5E7EB] pb-6">
        <div>
          <span className="text-[14px] font-bold text-[#2563EB] tracking-wide uppercase">
            Ecosystem Pipeline Coordinates
          </span>
          <h1 className="font-display font-bold text-[32px] text-[#111827] tracking-tight mt-1">
            CRM & Contacts
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Manage sales leads, attendee directories, corporate accounts, and automated reservation histories.
          </p>
        </div>

        {/* Dynamic Context Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {activeTab === 'contacts' && (
            <Button
              size="sm"
              onClick={() => { setEditingContactId(null); setIsContactModalOpen(true); }}
              className="bg-[#2563EB] text-[#FFFFFF] hover:bg-[#1D4ED8] h-[44px] px-5 rounded-[12px] font-bold shadow-[0_2px_10px_rgba(37,99,235,0.2)] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register Contact</span>
            </Button>
          )}
          {activeTab === 'companies' && (
            <Button
              size="sm"
              onClick={() => { setEditingCompanyId(null); setIsCompanyModalOpen(true); }}
              className="bg-[#2563EB] text-[#FFFFFF] hover:bg-[#1D4ED8] h-[44px] px-5 rounded-[12px] font-bold shadow-[0_2px_10px_rgba(37,99,235,0.2)] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company Profile</span>
            </Button>
          )}
          {activeTab === 'leads' && (
            <Button
              size="sm"
              onClick={() => { setEditingLeadId(null); setIsLeadModalOpen(true); }}
              className="bg-[#2563EB] text-[#FFFFFF] hover:bg-[#1D4ED8] h-[44px] px-5 rounded-[12px] font-bold shadow-[0_2px_10px_rgba(37,99,235,0.2)] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Opportunity</span>
            </Button>
          )}
          {activeTab === 'activities' && (
            <Button
              size="sm"
              onClick={() => setIsActivityModalOpen(true)}
              className="bg-[#2563EB] text-[#FFFFFF] hover:bg-[#1D4ED8] h-[44px] px-5 rounded-[12px] font-bold shadow-[0_2px_10px_rgba(37,99,235,0.2)] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record Action</span>
            </Button>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="border-b border-[#E5E7EB] flex overflow-x-auto gap-2 pb-px mb-6">
        {(['dashboard', 'contacts', 'companies', 'leads', 'activities'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3.5 px-4 text-[14px] font-bold border-b-2 uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === tab
                ? 'border--[#2563EB] border-[#2563EB] text-[#2563EB] font-bold'
                : 'border-transparent text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            {tab === 'leads' ? 'Pipelines & Leads' : tab}
          </button>
        ))}
      </div>

      {/* =======================================================
          TAB: DASHBOARD OVERVIEW
          ======================================================= */}
      {activeTab === 'dashboard' && analytics && (
        <div className="space-y-8 animate-fadeIn">
          {/* Quick Stats Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block">Sales Conversion Rate</span>
                <h3 className="text-[28px] font-bold text-[#111827] tracking-tight">{analytics.metrics.conversionRate}%</h3>
              </div>
              <div className="p-3 bg-[#E0F2FE] text-[#0369A1] rounded-[14px]">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block">Active Pipeline Value</span>
                <h3 className="text-[28px] font-bold text-[#2563EB] tracking-tight">${analytics.metrics.activeValue.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-[#2563EB] rounded-[14px]">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block">Total CRM Accounts</span>
                <h3 className="text-[28px] font-bold text-[#111827] tracking-tight">{contacts.length}</h3>
              </div>
              <div className="p-3 bg-[#FEF3C7] text-[#D97706] rounded-[14px]">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider block">Linked Reservations</span>
                <h3 className="text-[28px] font-bold text-[#4F46E5] tracking-tight">{analytics.metrics.registrationsCount + analytics.metrics.bookingsCount}</h3>
              </div>
              <div className="p-3 bg-[#EEF2FF] text-[#4F46E5] rounded-[14px]">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Integration Stats Callout */}
          <div className="p-6 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#EEF2FF] text-[#4F46E5] rounded-[14px] shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[16px] text-[#111827]">Active Workspace Experience Integrations Active</h4>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">
                  The Ecosystem CRM automatically reads and compiles live ticket registrations (<b>{analytics.metrics.registrationsCount}</b>) and coworking desk bookings (<b>{analytics.metrics.bookingsCount}</b>) for your members.
                </p>
              </div>
            </div>
            <button onClick={() => setActiveTab('contacts')} className="text-[14px] font-bold text-[#2563EB] hover:underline flex items-center gap-1 shrink-0">
              <span>Inspect Linked Member Logs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Recharts Analytics Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-2">
                <h3 className="text-[14px] font-bold uppercase tracking-wider text-[#6B7280]">Opportunity Pipeline Stages</h3>
                <span className="text-[12px] bg-blue-50 text-[#2563EB] font-bold px-2.5 py-1 rounded-md">Live Valuations</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.pipeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="stage" tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#111827', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" name="Deal Value ($)" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-2">
                <h3 className="text-[14px] font-bold uppercase tracking-wider text-[#6B7280]">Contact Growth Metric</h3>
                <span className="text-[12px] bg-[#A3E635]/20 text-[#4D7C0F] font-bold px-2.5 py-1 rounded-md">Real-time Growth</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.contactGrowth.length > 0 ? analytics.contactGrowth : [{ date: 'None', count: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#111827', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Area type="monotone" dataKey="count" name="New Accounts" stroke="#65A30D" fillOpacity={0.1} fill="#A3E635" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Timeline Activities */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-[14px] font-bold uppercase tracking-wider text-[#6B7280]">Recent CRM Activities Log</h3>
            </div>
            {analytics.recentActivities.length === 0 ? (
              <p className="text-[14px] text-[#6B7280] py-6 text-center">No recent CRM interactions recorded.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 divide-y divide-gray-100">
                {analytics.recentActivities.map((act: any, idx: number) => (
                  <div key={act.id} className={`flex gap-4 text-[13px] ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="p-2.5 bg-blue-50 text-[#2563EB] rounded-[12px] h-fit shrink-0">
                      <ActivityIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#111827] flex items-center gap-2 flex-wrap">
                        <span>{act.title}</span>
                        <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[10px] uppercase tracking-wider font-bold rounded-full">
                          {act.type}
                        </span>
                      </h4>
                      <p className="text-[#6B7280] text-[13px] leading-relaxed">{act.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF] mt-1 font-medium">
                        {act.assignedTo && <span>Logged by: {act.assignedTo}</span>}
                        <span>•</span>
                        <span>{new Date(act.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filtering Block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, or phone..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] pl-10 pr-4 py-3 rounded-[12px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition"
              />
            </div>
            <select
              value={contactStatus}
              onChange={(e) => setContactStatus(e.target.value)}
              className="text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] p-3 rounded-[12px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm font-semibold transition"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Account</option>
              <option value="LEAD">Prospect / Lead</option>
              <option value="INACTIVE">Inactive Client</option>
            </select>
            <select
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              className="text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] p-3 rounded-[12px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm font-semibold transition"
            >
              <option value="">All Ecosystem Roles</option>
              <option value="MEMBER">Hub Member</option>
              <option value="MENTOR">Mentor</option>
              <option value="SPEAKER">Guest Speaker</option>
              <option value="SPONSOR">Sponsor</option>
              <option value="PARTNER">Corporate Partner</option>
              <option value="VOLUNTEER">Volunteer</option>
            </select>
          </div>

          {/* Grid Layout (Master-Detail Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Contacts Table Column */}
            <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB]">
                      <th className="p-4 pl-6">Contact Info</th>
                      <th className="p-4">Business Link</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
                    {filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-[#6B7280]">
                          No Ecosystem contacts found matching query parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                          <td className="p-4 pl-6 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-[#111827]">
                                {contact.firstName} {contact.lastName}
                              </p>
                              {contact.customFields?.ecosystemRole && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                  contact.customFields.ecosystemRole === 'MENTOR' ? 'bg-[#FAF5FF] text-[#7E22CE] border border-[#F3E8FF]' :
                                  contact.customFields.ecosystemRole === 'SPEAKER' ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7]' :
                                  contact.customFields.ecosystemRole === 'SPONSOR' ? 'bg-[#FDF2F8] text-[#BE185D] border border-[#FCE7F3]' :
                                  contact.customFields.ecosystemRole === 'PARTNER' ? 'bg-[#EEF2FF] text-[#4338CA] border border-[#E0E7FF]' :
                                  contact.customFields.ecosystemRole === 'VOLUNTEER' ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]' :
                                  'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]'
                                }`}>
                                  {contact.customFields.ecosystemRole}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6B7280] font-medium flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              <span>{contact.email}</span>
                            </p>
                          </td>
                          <td className="p-4">
                            {contact.companyId ? (
                              <p className="font-semibold text-[#374151]">
                                {typeof contact.companyId === 'object' ? contact.companyId.name : 'Linked Company'}
                              </p>
                            ) : (
                              <span className="text-[12px] text-[#9CA3AF] italic font-medium">None linked</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              contact.status === 'ACTIVE' ? 'bg-[#D9F99D] text-[#4D7C0F]' :
                              contact.status === 'LEAD' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                              'bg-[#F3F4F6] text-[#4B5563]'
                            }`}>
                              {contact.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleViewContact(contact.id!)}
                              className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#2563EB] transition-colors"
                              title="Inspect Customer Portfolio"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingContactId(contact.id!);
                                setContactForm({
                                  firstName: contact.firstName,
                                  lastName: contact.lastName,
                                  email: contact.email,
                                  phone: contact.phone || '',
                                  status: contact.status,
                                  ecosystemRole: contact.customFields?.ecosystemRole || 'MEMBER',
                                  leadSource: contact.leadSource || '',
                                  companyId: typeof contact.companyId === 'object' ? contact.companyId._id : (contact.companyId || ''),
                                  tagsString: (contact.tags || []).join(', '),
                                  customFields: contact.customFields || {}
                                });
                                setIsContactModalOpen(true);
                              }}
                              className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#4B5563] transition-colors"
                              title="Update Records"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id!)}
                              className="p-2 hover:bg-red-50 rounded-lg text-[#EF4444] transition-colors"
                              title="Delete Record"
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

            {/* Right: Contact Details Column (Dynamic Integrations panel!) */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-fit space-y-6">
              {contactDetailsLoading ? (
                <div className="py-24 text-center space-y-3">
                  <div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full mx-auto" />
                  <p className="text-[13px] text-[#6B7280] font-semibold">Pulling workspace reservations & ticket databases...</p>
                </div>
              ) : selectedContact ? (
                <div className="space-y-6">
                  {/* Avatar & Basic Info */}
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                    <div className="w-14 h-14 bg-blue-50 text-[#2563EB] border border-[#DBEAFE] rounded-[16px] flex items-center justify-center font-bold text-xl uppercase shrink-0">
                      {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#111827] text-[18px] tracking-tight leading-none">
                          {selectedContact.firstName} {selectedContact.lastName}
                        </h3>
                        {selectedContact.customFields?.ecosystemRole && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            selectedContact.customFields.ecosystemRole === 'MENTOR' ? 'bg-[#FAF5FF] text-[#7E22CE] border border-[#F3E8FF]' :
                            selectedContact.customFields.ecosystemRole === 'SPEAKER' ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7]' :
                            selectedContact.customFields.ecosystemRole === 'SPONSOR' ? 'bg-[#FDF2F8] text-[#BE185D] border border-[#FCE7F3]' :
                            selectedContact.customFields.ecosystemRole === 'PARTNER' ? 'bg-[#EEF2FF] text-[#4338CA] border border-[#E0E7FF]' :
                            selectedContact.customFields.ecosystemRole === 'VOLUNTEER' ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]' :
                            'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]'
                          }`}>
                            {selectedContact.customFields.ecosystemRole}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] font-medium font-mono">CRM Account: {selectedContact.id}</p>
                    </div>
                  </div>

                  {/* Portfolio Fields */}
                  <div className="space-y-3.5 text-[13px]">
                    <div className="flex items-center gap-2.5 text-[#374151]">
                      <Mail className="w-4 h-4 text-[#9CA3AF]" />
                      <span className="font-medium">{selectedContact.email}</span>
                    </div>
                    {selectedContact.phone && (
                      <div className="flex items-center gap-2.5 text-[#374151]">
                        <Phone className="w-4 h-4 text-[#9CA3AF]" />
                        <span className="font-medium">{selectedContact.phone}</span>
                      </div>
                    )}
                    {selectedContact.leadSource && (
                      <div className="flex items-center gap-2.5 text-[#374151]">
                        <Plus className="w-4 h-4 text-[#9CA3AF]" />
                        <span className="font-medium">Lead Source: <b className="text-[#111827]">{selectedContact.leadSource}</b></span>
                      </div>
                    )}
                    {selectedContact.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedContact.tags.map((t: string) => (
                          <span key={t} className="px-2 py-0.5 bg-gray-100 text-[11px] font-bold text-[#4B5563] rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Custom Fields */}
                  {selectedContact.customFields && Object.keys(selectedContact.customFields).length > 0 && (
                    <div className="border-t border-gray-100 pt-5 space-y-3">
                      <h4 className="text-[11px] uppercase font-bold tracking-wider text-[#6B7280]">Ecosystem Custom Fields</h4>
                      <div className="grid grid-cols-2 gap-3 text-[12px]">
                        {Object.entries(selectedContact.customFields).map(([key, val]: any) => (
                          <div key={key} className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px]">
                            <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">{key}</p>
                            <p className="font-bold text-[#111827] mt-1">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* INTEGRATION PANEL 1: Event Registrations */}
                  <div className="border-t border-gray-100 pt-5 space-y-3">
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-[#6B7280] flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#2563EB]" />
                      <span>Live Event Registrations ({selectedContact.integrations?.registrations?.length || 0})</span>
                    </h4>
                    {(!selectedContact.integrations?.registrations || selectedContact.integrations.registrations.length === 0) ? (
                      <p className="text-[12px] text-[#6B7280] italic">No associated event reservations.</p>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {selectedContact.integrations.registrations.map((reg: any) => (
                          <div key={reg.id || reg._id} className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] text-[13px] space-y-2">
                            <p className="font-bold text-[#111827]">
                              {reg.eventId?.title || 'Unknown Event'}
                            </p>
                            <p className="text-[11px] text-[#6B7280] font-mono">Ticket #: {reg.ticketNumber}</p>
                            <div className="flex items-center justify-between mt-1 text-[11px]">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                reg.status === 'CONFIRMED' ? 'bg-[#D9F99D] text-[#4D7C0F]' : 'bg-[#FEE2E2] text-[#991B1B]'
                              }`}>
                                {reg.status}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                reg.checkedIn ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {reg.checkedIn ? 'Checked In' : 'Registered'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* INTEGRATION PANEL 2: Workspace Bookings */}
                  <div className="border-t border-gray-100 pt-5 space-y-3">
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-[#6B7280] flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#4F46E5]" />
                      <span>Physical Workspace Bookings ({selectedContact.integrations?.bookings?.length || 0})</span>
                    </h4>
                    {(!selectedContact.integrations?.bookings || selectedContact.integrations.bookings.length === 0) ? (
                      <p className="text-[12px] text-[#6B7280] italic">No associated co-working room reservations.</p>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {selectedContact.integrations.bookings.map((bk: any) => (
                          <div key={bk.id || bk._id} className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] text-[13px] space-y-2">
                            <p className="font-bold text-[#111827]">
                              {bk.spaceId?.name || 'Workspace Space'}
                            </p>
                            <p className="text-[11px] text-[#6B7280]">
                              {new Date(bk.startTime).toLocaleDateString()} at {new Date(bk.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="font-mono text-[#4F46E5] font-bold">${bk.totalAmount}</span>
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                bk.status === 'CONFIRMED' ? 'bg-[#D9F99D] text-[#4D7C0F]' : 'bg-[#FEF3C7] text-[#92400E]'
                              }`}>
                                {bk.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CRM Note Log */}
                  <div className="border-t border-gray-100 pt-5 space-y-4">
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-[#6B7280]">Interaction Notebook</h4>
                    
                    <form onSubmit={handleAddNoteSubmit} className="space-y-3">
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Log contact feedback, email response, call outcome..."
                        className="w-full text-[13px] p-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition"
                        rows={2}
                        required
                      />
                      <Button
                        size="sm"
                        type="submit"
                        className="w-full text-xs bg-gray-950 text-white hover:bg-gray-800 h-[38px] rounded-[10px] font-bold shadow-sm"
                      >
                        Log Notes Entry
                      </Button>
                    </form>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {selectedContact.notes?.length === 0 ? (
                        <p className="text-[12px] text-[#6B7280] italic py-2">No notes registered yet.</p>
                      ) : (
                        selectedContact.notes.map((note: any, i: number) => (
                          <div key={i} className="p-3 bg-[#FEFCE8] border border-[#FEF08A] rounded-[12px] space-y-1.5 shadow-sm">
                            <p className="text-[13px] text-[#854D0E] leading-relaxed">{note.content}</p>
                            <div className="flex justify-between items-center text-[10px] text-[#A16207] font-semibold">
                              <span>By: {note.author}</span>
                              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 text-[#6B7280] space-y-3">
                  <StickyNote className="w-12 h-12 mx-auto text-[#9CA3AF]" />
                  <p className="text-[15px] font-bold text-[#111827]">Select a Customer Portfolio</p>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">
                    Click the eye icon next to any contact to inspect live ticketing, coworking, and notes interactions.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* =======================================================
          TAB: COMPANIES DIRECTORY
          ======================================================= */}
      {activeTab === 'companies' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies by name or domain..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="w-full text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] pl-10 pr-4 py-3 rounded-[12px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition"
            />
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB]">
                  <th className="p-4 pl-6">Business Name</th>
                  <th className="p-4">Industry Sector</th>
                  <th className="p-4">Operational Size</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-[#6B7280]">
                      No corporate profiles loaded yet.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="p-4 pl-6 space-y-1">
                        <p className="font-bold text-[#111827]">{company.name}</p>
                        {company.domain && (
                          <p className="text-[11px] text-[#6B7280] font-medium font-mono">{company.domain}</p>
                        )}
                      </td>
                      <td className="p-4 text-[#374151] font-medium">
                        {company.industry || 'General Business'}
                      </td>
                      <td className="p-4 text-[#374151] font-medium">
                        {company.size || 'Unspecified'}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingCompanyId(company.id!);
                            setCompanyForm({
                              name: company.name,
                              domain: company.domain || '',
                              industry: company.industry || '',
                              size: company.size || '',
                              website: company.website || '',
                              phone: company.phone || '',
                              tagsString: (company.tags || []).join(', '),
                              customFields: company.customFields || {}
                            });
                            setIsCompanyModalOpen(true);
                          }}
                          className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#4B5563] transition-colors"
                          title="Edit corporate profile"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id!)}
                          className="p-2 hover:bg-red-50 rounded-lg text-[#EF4444] transition-colors"
                          title="Retire company portfolio"
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
      )}

      {/* =======================================================
          TAB: LEADS & PIPELINES BOARD
          ======================================================= */}
      {activeTab === 'leads' && (
        <div className="space-y-6 animate-fadeIn">
          <p className="text-[14px] text-[#6B7280] leading-relaxed">
            Ecosystem Sales Stages & pipeline boards control values, deal flows, and qualification outcomes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 overflow-x-auto pb-4">
            {(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const).map((stage) => {
              const stageLeads = leads.filter(l => l.pipelineStage === stage);
              const stageValue = stageLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);
              
              return (
                <div key={stage} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-4 min-w-[210px] space-y-4 flex flex-col justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                  <div>
                    {/* Header Stage Info */}
                    <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                      <span className={`text-[12px] font-bold tracking-wider uppercase ${
                        stage === 'WON' ? 'text-[#4D7C0F]' :
                        stage === 'LOST' ? 'text-[#EF4444]' :
                        'text-[#4B5563]'
                      }`}>
                        {stage}
                      </span>
                      <span className="px-2.5 py-0.5 bg-gray-100 text-[11px] font-bold text-[#4B5563] rounded-full">
                        {stageLeads.length}
                      </span>
                    </div>

                    {/* Stage deals value sum */}
                    <p className="text-[14px] font-bold text-[#2563EB] mt-2 font-mono">
                      ${stageValue.toLocaleString()}
                    </p>

                    {/* Stage cards */}
                    <div className="space-y-3 mt-4 max-h-[440px] overflow-y-auto pr-1">
                      {stageLeads.length === 0 ? (
                        <p className="text-[11px] text-[#9CA3AF] italic text-center py-6 font-medium">Empty lane</p>
                      ) : (
                        stageLeads.map((lead) => (
                          <div key={lead.id} className="p-3.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] shadow-sm space-y-3 text-[13px] hover:border-[#2563EB] hover:shadow-md transition duration-200">
                            <div className="space-y-1">
                              <p className="font-bold text-[#111827] leading-tight">{lead.title}</p>
                              {lead.companyId && (
                                <p className="text-[11px] text-[#6B7280] font-semibold">{lead.companyId.name}</p>
                              )}
                            </div>

                            <p className="font-mono text-[12px] font-bold text-[#111827]">
                              ${lead.dealValue.toLocaleString()}
                            </p>

                            {/* Easy Lane stage actions */}
                            <div className="flex items-center gap-2 border-t border-gray-100 pt-2.5 justify-between">
                              <select
                                value={lead.pipelineStage}
                                onChange={(e) => handleMoveLeadStage(lead.id!, e.target.value as any)}
                                className="text-[11px] p-1 border border-[#E5E7EB] bg-[#F8FAFC] rounded-[6px] font-bold w-full text-[#374151] focus:outline-none focus:border-[#2563EB]"
                              >
                                <option value="NEW">New</option>
                                <option value="QUALIFIED">Qualified</option>
                                <option value="PROPOSAL">Proposal</option>
                                <option value="NEGOTIATION">Negotiate</option>
                                <option value="WON">Won</option>
                                <option value="LOST">Lost</option>
                              </select>
                              <button onClick={() => handleDeleteLead(lead.id!)} className="text-[#EF4444] hover:text-red-700 shrink-0 p-1 rounded hover:bg-red-50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB: CENTRAL INTERACTION LOGS
          ======================================================= */}
      {activeTab === 'activities' && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] p-6 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] animate-fadeIn">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-[16px] font-bold text-[#111827]">CRM Central Activities History</h3>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 divide-y divide-gray-100">
            {activities.length === 0 ? (
              <p className="text-[14px] text-[#6B7280] text-center py-16">No interactive contact touchpoints logged yet.</p>
            ) : (
              activities.map((act, idx) => (
                <div key={act.id} className={`flex gap-4 text-[13px] ${idx > 0 ? 'pt-4' : ''}`}>
                  <div className="p-2.5 bg-blue-50 text-[#2563EB] rounded-[12px] h-fit shrink-0">
                    <ActivityIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-[#111827] flex items-center gap-2 flex-wrap">
                      <span>{act.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        act.type === 'CALL' ? 'bg-[#FEF3C7] text-[#D97706]' :
                        act.type === 'EMAIL' ? 'bg-[#EEF2FF] text-[#4F46E5]' :
                        act.type === 'MEETING' ? 'bg-[#D9F99D] text-[#4D7C0F]' :
                        act.type === 'SYSTEM' ? 'bg-[#E0F2FE] text-[#0369A1]' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {act.type}
                      </span>
                    </h4>
                    {act.description && <p className="text-[#6B7280] leading-relaxed mt-0.5">{act.description}</p>}
                    {act.outcome && <p className="text-[12px] text-[#4B5563] font-semibold mt-1">Outcome: <span className="text-[#111827]">{act.outcome}</span></p>}
                    <div className="flex gap-4 text-[11px] text-[#9CA3AF] mt-1.5 font-medium">
                      <span>Logged by: {act.assignedTo || 'Staff Coordinator'}</span>
                      <span>•</span>
                      <span>{new Date(act.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          FORM MODAL: CONTACT REGISTRATION
          ======================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-display font-bold text-lg text-[#111827] border-b border-[#E5E7EB] pb-2">
              {editingContactId ? 'Update Contact Record' : 'Register CRM Contact'}
            </h3>

            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  required
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                required
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />

              <Input
                label="Phone Number"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Account Status</label>
                  <select
                    value={contactForm.status}
                    onChange={(e) => setContactForm({ ...contactForm, status: e.target.value as any })}
                    className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                  >
                    <option value="ACTIVE">Active Account</option>
                    <option value="LEAD">Prospect / Lead</option>
                    <option value="INACTIVE">Inactive Client</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Ecosystem Role</label>
                  <select
                    value={contactForm.ecosystemRole}
                    onChange={(e) => setContactForm({ ...contactForm, ecosystemRole: e.target.value as any })}
                    className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                  >
                    <option value="MEMBER">Hub Member</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="SPEAKER">Guest Speaker</option>
                    <option value="SPONSOR">Sponsor</option>
                    <option value="PARTNER">Corporate Partner</option>
                    <option value="VOLUNTEER">Volunteer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Linked Business Portfolio</label>
                <select
                  value={contactForm.companyId}
                  onChange={(e) => setContactForm({ ...contactForm, companyId: e.target.value })}
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                >
                  <option value="">No Company Match</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Lead Source"
                placeholder="e.g. Website, Event, Cold Outreach..."
                value={contactForm.leadSource}
                onChange={(e) => setContactForm({ ...contactForm, leadSource: e.target.value })}
              />

              <Input
                label="Tags (Comma separated)"
                placeholder="VIP, Hub-Member, Corporate"
                value={contactForm.tagsString}
                onChange={(e) => setContactForm({ ...contactForm, tagsString: e.target.value })}
              />

              {/* CRM CUSTOM FIELDS SECTION */}
              <div className="border-t border-[#E5E7EB] pt-3 space-y-2">
                <h4 className="text-[10px] uppercase text-[#6B7280] font-bold tracking-wider">Dynamic CRM Custom Fields</h4>
                {Object.keys(contactForm.customFields).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pb-2">
                    {Object.entries(contactForm.customFields).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center bg-[#F8FAFC] border border-[#E5E7EB] p-2 rounded-lg text-[#111827]">
                        <div>
                          <p className="text-[9px] text-[#6B7280]">{key}</p>
                          <p className="font-bold">{val}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = { ...contactForm.customFields };
                            delete copy[key];
                            setContactForm({ ...contactForm, customFields: copy });
                          }}
                          className="text-rose-500 text-[10px] font-bold hover:text-rose-700 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Field Name"
                    value={cfKey}
                    onChange={(e) => setCfKey(e.target.value)}
                    className="col-span-1 p-3 border border-[#E5E7EB] bg-white text-xs rounded-xl text-[#111827] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition"
                  />
                  <input
                    type="text"
                    placeholder="Field Value"
                    value={cfValue}
                    onChange={(e) => setCfValue(e.target.value)}
                    className="col-span-1 p-3 border border-[#E5E7EB] bg-white text-xs rounded-xl text-[#111827] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition"
                  />
                  <Button type="button" size="sm" onClick={() => handleAddCustomField('contact')} className="text-xs bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                    Apply Field
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-[#E5E7EB] pt-3">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsContactModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                  {editingContactId ? 'Save Changes' : 'Register Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          FORM MODAL: COMPANY PROFILE
          ======================================================= */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-display font-bold text-lg text-[#111827] border-b border-[#E5E7EB] pb-2">
              {editingCompanyId ? 'Update Corporate Portfolio' : 'Add Corporate Account'}
            </h3>

            <form onSubmit={handleCompanySubmit} className="space-y-4 text-xs font-semibold">
              <Input
                label="Company Name"
                required
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email Domain (e.g. google.com)"
                  value={companyForm.domain}
                  onChange={(e) => setCompanyForm({ ...companyForm, domain: e.target.value })}
                />
                <Input
                  label="Website Address"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Industry Sector"
                  placeholder="Tech, Finance, Retail..."
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                />
                <Input
                  label="Company Size"
                  placeholder="e.g. 50-100 employees"
                  value={companyForm.size}
                  onChange={(e) => setCompanyForm({ ...companyForm, size: e.target.value })}
                />
              </div>

              <Input
                label="Phone Number"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              />

              <Input
                label="Tags (Comma separated)"
                placeholder="Enterprise, High-growth"
                value={companyForm.tagsString}
                onChange={(e) => setCompanyForm({ ...companyForm, tagsString: e.target.value })}
              />

              <div className="flex gap-2 justify-end border-t border-[#E5E7EB] pt-3">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCompanyModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                  {editingCompanyId ? 'Save Corporate Profile' : 'Initiate Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          FORM MODAL: INITIATE LEAD OPPORTUNITY
          ======================================================= */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-display font-bold text-lg text-[#111827] border-b border-[#E5E7EB] pb-2">
              {editingLeadId ? 'Modify Opportunity Parameters' : 'Launch New Business Opportunity'}
            </h3>

            <form onSubmit={handleLeadSubmit} className="space-y-4 text-xs font-semibold">
              <Input
                label="Deal Title"
                placeholder="e.g. Q3 Space Membership Retainer"
                required
                value={leadForm.title}
                onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Associated Contact Target</label>
                  <select
                    value={leadForm.contactId}
                    onChange={(e) => setLeadForm({ ...leadForm, contactId: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                  >
                    <option value="">No Contact Linked</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Company Target Match</label>
                  <select
                    value={leadForm.companyId}
                    onChange={(e) => setLeadForm({ ...leadForm, companyId: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                  >
                    <option value="">No Company Linked</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Expected Contract Value ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={leadForm.dealValue}
                    onChange={(e) => setLeadForm({ ...leadForm, dealValue: Number(e.target.value) })}
                    className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Pipeline Stage</label>
                  <select
                    value={leadForm.pipelineStage}
                    onChange={(e) => setLeadForm({ ...leadForm, pipelineStage: e.target.value as any })}
                    className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                  >
                    <option value="NEW">New Prospect</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal Shared</option>
                    <option value="NEGOTIATION">Negotiating Terms</option>
                    <option value="WON">Closed Won 🎉</option>
                    <option value="LOST">Closed Lost</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Lead State Status</label>
                <select
                  value={leadForm.status}
                  onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as any })}
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                >
                  <option value="ACTIVE">Active Negotiation</option>
                  <option value="WON">Closed Won Portfolio</option>
                  <option value="LOST">Dismissed</option>
                  <option value="ARCHIVED">Archived Context</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end border-t border-[#E5E7EB] pt-3">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsLeadModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                  {editingLeadId ? 'Commit Changes' : 'Initialize Opportunity'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          FORM MODAL: RECORD INTERACTION ACTION
          ======================================================= */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-display font-bold text-lg text-[#111827] border-b border-[#E5E7EB] pb-2">
              Log Touchpoint Action
            </h3>

            <form onSubmit={handleActivitySubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Interactive Category</label>
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as any })}
                    className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                  >
                    <option value="CALL">Outgoing Call</option>
                    <option value="EMAIL">Email Despatched</option>
                    <option value="MEETING">In-person Meeting</option>
                    <option value="NOTE">Interactive Memo</option>
                    <option value="TASK">Assigned Action Task</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Target Contact Client</label>
                  <select
                    value={activityForm.contactId}
                    onChange={(e) => setActivityForm({ ...activityForm, contactId: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                  >
                    <option value="">No Contact Target</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Interaction Subject"
                placeholder="e.g. Q3 Agreement Follow-up call"
                required
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              />

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#374151] select-none block mb-1">Discussion Details</label>
                <textarea
                  placeholder="Log core bullet points and discussion agreements..."
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  className="w-full bg-white border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none p-3 rounded-xl text-xs font-semibold text-[#111827] transition"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Logged By (Email)"
                  placeholder={user?.email || 'staff@weventurehub.com'}
                  value={activityForm.assignedTo}
                  onChange={(e) => setActivityForm({ ...activityForm, assignedTo: e.target.value })}
                />
                <Input
                  label="Interaction Outcome"
                  placeholder="e.g. Proposal scheduled, positive feedback..."
                  value={activityForm.outcome}
                  onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end border-t border-[#E5E7EB] pt-3">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsActivityModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                  Log Action Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
