import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  ClipboardList, 
  Settings, 
  LayoutDashboard, 
  Mail, 
  Ticket, 
  Globe, 
  Users, 
  BarChart2, 
  Plus, 
  Trash, 
  MoveUp, 
  MoveDown, 
  Copy, 
  QrCode, 
  CheckCircle,
  X,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  EyeOff,
  Palette,
  Send,
  Shield,
  History,
  Share2,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  RefreshCw,
  Sparkles,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { 
  IEvent, 
  IRsvpFormField, 
  IRsvpFormAppearance, 
  IRsvpEmailSettings, 
  IRsvpTicketSettings,
  UserRole
} from '../../types';
import { axiosInstance } from '../../lib/axiosInstance';
import { useAppSelector } from '../../store';
import { ImportRegistrationsModal } from './ImportRegistrationsModal';
import { format } from 'date-fns';

// RSVP Modular Suite
import { RsvpPalette } from './rsvp/RsvpPalette';
import { RsvpCanvas } from './rsvp/RsvpCanvas';
import { RsvpPropertiesPanel } from './rsvp/RsvpPropertiesPanel';
import { RsvpLivePreview } from './rsvp/RsvpLivePreview';
import { FORM_TEMPLATES, THEME_PRESETS, FIELD_DEFINITIONS } from './rsvp/rsvpConstants';

import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface RegistrationConfigProps {
  event: IEvent;
  onUpdate: (data: Partial<IEvent>) => void;
  onClose: () => void;
}

const DEFAULT_RSVP_FIELDS: IRsvpFormField[] = [
  { id: 'f_name', type: 'text', label: 'Full Name', required: true, placeholder: 'Jane Doe', order: 0, width: 'full' },
  { id: 'f_email', type: 'email', label: 'Email Address', required: true, placeholder: 'jane@company.com', order: 1, width: 'full' },
  { id: 'f_company', type: 'company', label: 'Company / Organization', required: false, placeholder: 'Acme Inc.', order: 2, width: 'half' },
  { id: 'f_job', type: 'job_title', label: 'Job Title', required: false, placeholder: 'Product Lead', order: 3, width: 'half' },
];

export const RegistrationConfig: React.FC<RegistrationConfigProps> = ({
  event,
  onUpdate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'builder' | 'design' | 'email' | 'ticket' | 'access' | 'registrations' | 'performance' | 'versions'>('builder');
  const [isPreview, setIsPreview] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  
  const [configVersions, setConfigVersions] = useState<any[]>([]);
  const [publishedVersion, setPublishedVersion] = useState(0);
  const [publicUrl, setPublicUrl] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [fields, setFields] = useState<IRsvpFormField[]>(event.rsvpFormFields?.length ? event.rsvpFormFields : DEFAULT_RSVP_FIELDS);
  const [appearance, setAppearance] = useState<IRsvpFormAppearance>(event.rsvpFormAppearance || {
    backgroundColor: '#F8FAFC',
    primaryColor: '#0F172A',
    textColor: '#0F172A',
    accentColor: '#84CC16',
    buttonColor: '#84CC16',
    buttonText: 'Confirm My RSVP',
    borderRadius: 16,
    cardStyle: 'elevated',
    fontFamily: 'inherit',
    fontSize: 16
  });

  const [emailSettings, setEmailSettings] = useState<IRsvpEmailSettings>(event.rsvpEmailSettings || {
    confirmationEmail: {
      enabled: true,
      subject: `Registration Confirmed: ${event.title}`,
      body: `Hello {name},\n\nYour registration for ${event.title} is confirmed!\n\nDate: ${event.schedule?.startDate || 'Upcoming'}\nVenue: WeVentureHub Hall\n\nSee you there!`,
      senderName: 'WeVentureHub Events',
      replyTo: 'events@weventurehub.com',
      attachTicket: true,
      attachQrCode: true
    },
    reminderEmail: {
      enabled: true,
      subject: `Reminder: ${event.title} starts soon!`,
      body: `Hello {name},\n\nThis is a friendly reminder that ${event.title} is happening soon.`,
      senderName: 'WeVentureHub Events',
      replyTo: 'events@weventurehub.com',
      attachTicket: true,
      attachQrCode: true
    },
    followUpEmail: {
      enabled: false,
      subject: `Thank you for attending ${event.title}`,
      body: `Hello {name},\n\nThank you for attending our event at WeVentureHub!`,
      senderName: 'WeVentureHub Events',
      replyTo: 'events@weventurehub.com'
    }
  });

  const [ticketSettings, setTicketSettings] = useState<IRsvpTicketSettings>(event.rsvpTicketSettings || {
    layout: 'standard',
    qrPosition: 'bottom_right',
    numberFormat: `WVH-${event.id?.slice(-5).toUpperCase() || 'PASS'}-XXXXX`
  });

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoadingRegs, setIsLoadingRegs] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [history, setHistory] = useState<IRsvpFormField[][]>([event.rsvpFormFields?.length ? event.rsvpFormFields : DEFAULT_RSVP_FIELDS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Config fetching
  useEffect(() => {
    if (event?.id) {
      fetchConfig();
    }
  }, [event?.id]);

  const fetchConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await axiosInstance.get(`/events/${event.id}/rsvp-configuration`);
      const config = response.data?.data;
      if (config) {
        if (config.draft?.fields?.length) {
          setFields(config.draft.fields);
          setHistory([config.draft.fields]);
          setHistoryIndex(0);
        } else {
          setFields(event.rsvpFormFields?.length ? event.rsvpFormFields : DEFAULT_RSVP_FIELDS);
        }

        if (config.draft?.appearance) setAppearance(config.draft.appearance);
        if (config.draft?.emailSettings) setEmailSettings(config.draft.emailSettings);
        if (config.draft?.ticketSettings) setTicketSettings(config.draft.ticketSettings);
        
        setConfigVersions(config.versions || []);
        setPublishedVersion(config.publishedVersion || 0);
        setPublicUrl(`${window.location.origin}/#/events/${event.slug || event.id}/rsvp`);
        setLastSaved(config.draft?.updatedAt);
      }
    } catch (error) {
      console.error("Failed to load RSVP configuration", error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Auto-save trigger
  useEffect(() => {
    if (isLoadingConfig) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      handleSave(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [fields, appearance, emailSettings, ticketSettings]);

  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchRegistrations();
    }
  }, [activeTab]);

  const fetchRegistrations = async () => {
    setIsLoadingRegs(true);
    try {
      const response = await axiosInstance.get(`/ticketing/registrations/event/${event.id}`);
      setRegistrations(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setIsLoadingRegs(false);
    }
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) {
      alert('No registration records to export.');
      return;
    }

    const headers = [
      'Attendee Name',
      'Attendee Email',
      'Ticket Number',
      'Status',
      'Registration Date',
      'Checked-In (Attended)'
    ];

    const rows = registrations.map((reg) => [
      reg.attendeeName || '',
      reg.attendeeEmail || '',
      reg.ticketNumber || '',
      reg.status || '',
      reg.registrationDate ? new Date(reg.registrationDate).toLocaleString() : '',
      reg.checkedIn ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weventurehub_event_registrations_${event.slug || event.id || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addToHistory = (newFields: IRsvpFormField[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFields);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSaveStatus('saving');
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFields(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFields(history[newIndex]);
    }
  };

  const handleSave = async (isPublish = false) => {
    setSaveStatus('saving');
    try {
      const draftData = {
        fields,
        appearance,
        emailSettings,
        ticketSettings
      };
      
      const response = await axiosInstance.put(`/events/${event.id}/rsvp-configuration/draft`, draftData);
      setLastSaved(response.data.data.draft.updatedAt);
      
      // Notify parent component
      onUpdate({
        rsvpFormFields: fields,
        rsvpFormAppearance: appearance,
        media: {
          ...event.media,
          bannerUrl: appearance.bannerUrl || appearance.headerImage || event.media?.bannerUrl,
          imageUrls: event.media?.imageUrls || []
        }
      });
      
      if (isPublish) {
        const pubResponse = await axiosInstance.post(`/events/${event.id}/rsvp-configuration/publish`);
        setConfigVersions(pubResponse.data.data.versions || []);
        setPublishedVersion(pubResponse.data.data.publishedVersion || 1);
        setPublicUrl(`${window.location.origin}/#/events/${event.slug || event.id}/rsvp`);
        alert('Form published successfully! Attendees can now register.');
      }
      
      setSaveStatus('saved');
    } catch (error: any) {
      console.error('RSVP Configuration Save Error:', error.response?.data || error.message);
      setSaveStatus('error');
    }
  };

  const addField = (type: string) => {
    const fieldDef = FIELD_DEFINITIONS.find(f => f.id === type);
    const label = fieldDef ? fieldDef.label : `New ${type.replace(/_/g, ' ')}`;
    const defaultPlaceholder = fieldDef?.defaultPlaceholder || '';

    const newField: IRsvpFormField = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: type as any,
      label: label,
      required: false,
      order: fields.length,
      placeholder: defaultPlaceholder,
      description: '',
      width: 'full',
      options: ['dropdown', 'radio', 'checkbox', 'multiselect'].includes(type)
        ? ['Option 1', 'Option 2', 'Option 3']
        : undefined
    };

    const newFields = [...fields, newField];
    setFields(newFields);
    addToHistory(newFields);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    const newFields = fields.filter(f => f.id !== id).map((f, idx) => ({ ...f, order: idx }));
    setFields(newFields);
    addToHistory(newFields);
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const updateField = (id: string, updates: Partial<IRsvpFormField>) => {
    const newFields = fields.map(f => f.id === id ? { ...f, ...updates } : f);
    setFields(newFields);
    addToHistory(newFields);
  };

  const duplicateField = (id: string) => {
    const target = fields.find(f => f.id === id);
    if (!target) return;
    const targetIdx = fields.findIndex(f => f.id === id);
    const newField: IRsvpFormField = {
      ...target,
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: `${target.label} (Copy)`,
      order: targetIdx + 1
    };
    const newFields = [...fields.slice(0, targetIdx + 1), newField, ...fields.slice(targetIdx + 1)].map((f, i) => ({
      ...f,
      order: i
    }));
    setFields(newFields);
    addToHistory(newFields);
    setSelectedFieldId(newField.id);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    const updated = newFields.map((f, i) => ({ ...f, order: i }));
    setFields(updated);
    addToHistory(updated);
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = FORM_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    if (fields.length > 0 && !confirm(`Applying "${template.label}" will replace current fields. Continue?`)) {
      return;
    }
    const newFields = template.fields.map((f, i) => ({
      ...f,
      id: `f_tpl_${templateId}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      order: i
    }));
    setFields(newFields);
    addToHistory(newFields);
    if (newFields.length > 0) setSelectedFieldId(newFields[0].id);
  };

  const handleApplyTheme = (themeId: string) => {
    const theme = THEME_PRESETS.find(t => t.id === themeId);
    if (!theme) return;
    setAppearance(prev => ({
      ...prev,
      ...theme.appearance
    }));
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="flex h-screen w-full bg-neutral-900 overflow-hidden font-sans">
      {/* 1. PRIMARY APP VERTICAL NAVIGATION SIDEBAR */}
      <div className="w-16 lg:w-60 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-neutral-800 hidden lg:flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
              <h2 className="text-xs font-black text-white uppercase tracking-wider">RSVP Studio</h2>
            </div>
            <p className="text-[10px] text-neutral-500 font-bold mt-0.5 truncate max-w-[180px]">{event.title}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-1.5">
          {[
            { id: 'builder', label: 'Form Builder', icon: ClipboardList, badge: `${fields.length}` },
            { id: 'design', label: 'Theme & Style', icon: Palette },
            { id: 'general', label: 'Settings', icon: Settings },
            { id: 'email', label: 'Email Automation', icon: Mail },
            { id: 'ticket', label: 'Digital Passes', icon: Ticket },
            { id: 'access', label: 'Public Access', icon: Globe },
            { id: 'registrations', label: 'Attendees', icon: Users, badge: registrations.length > 0 ? `${registrations.length}` : undefined },
            { id: 'performance', label: 'Analytics', icon: BarChart2 },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setIsPreview(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25 font-bold' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80 font-medium'
                }`}
                title={tab.label}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs hidden lg:block">{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold hidden lg:block ${
                    isActive ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Preview / Close Workspace */}
        <div className="p-3 border-t border-neutral-800 space-y-2 shrink-0">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              isPreview 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden lg:inline">{isPreview ? 'Exit Test' : 'Test Form'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col bg-neutral-100/60 overflow-hidden">
        {/* Top Control Bar */}
        <div className="h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-neutral-900 leading-none capitalize">
                {activeTab === 'builder' ? 'RSVP Form Builder' : `${activeTab} Management`}
              </h3>
              <p className="text-[10px] text-neutral-400 font-bold mt-1">
                WeVentureHub Event Engine • Event ID: {event.id.slice(-6)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto-save status */}
            <div className="flex items-center gap-2 text-[11px] font-bold">
              {saveStatus === 'saving' ? (
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="uppercase text-[10px] tracking-wider">Saving...</span>
                </div>
              ) : saveStatus === 'saved' ? (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="uppercase text-[10px] tracking-wider">Auto-Saved</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-500">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="uppercase text-[10px] tracking-wider">Save Error</span>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-neutral-200" />

            {/* Quick Actions */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 px-3 font-bold"
              onClick={() => handleSave(false)}
            >
              Save Draft
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="text-xs h-8 px-4 font-black uppercase tracking-wider bg-brand-primary hover:bg-neutral-900"
              onClick={() => handleSave(true)}
            >
              Publish Form
            </Button>

            <div className="w-px h-5 bg-neutral-200" />

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors"
              title="Close Builder"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WORKSPACE CONTENT AREA */}
        <div className="flex-1 overflow-hidden relative">
          {/* LIVE PREVIEW MODAL OVERLAY */}
          {isPreview && (
            <RsvpLivePreview
              event={event}
              fields={fields}
              appearance={appearance}
              eventTitle={event.title}
              eventDescription={event.description}
              startDate={event.schedule?.startDate}
              previewDevice={previewDevice}
              onClose={() => setIsPreview(false)}
            />
          )}

          {/* TAB 1: FORM BUILDER (3-SECTION LAYOUT) */}
          {activeTab === 'builder' && !isPreview && (
            <div className="flex h-full w-full overflow-hidden">
              {/* SECTION A: LEFT PALETTE */}
              <RsvpPalette
                onAddField={addField}
                onApplyTemplate={handleApplyTemplate}
                onUndo={undo}
                onRedo={redo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
              />

              {/* SECTION B: CENTER CANVAS */}
              <RsvpCanvas
                event={event}
                fields={fields}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onUpdateField={updateField}
                onDuplicateField={duplicateField}
                onDeleteField={removeField}
                onMoveField={moveField}
                onReorderFields={(newFields) => {
                  setFields(newFields);
                  addToHistory(newFields);
                }}
                appearance={appearance}
                onUpdateAppearance={(updates) => {
                  setAppearance(prev => ({ ...prev, ...updates }));
                }}
                eventTitle={event.title}
                eventDescription={event.description}
                startDate={event.schedule?.startDate}
                previewDevice={previewDevice}
                setPreviewDevice={setPreviewDevice}
                onSave={() => handleSave(false)}
                onPublish={() => handleSave(true)}
                saveStatus={saveStatus}
                onTogglePreview={() => setIsPreview(!isPreview)}
                isPreview={isPreview}
              />

              {/* SECTION C: RIGHT PROPERTIES & STYLING PANEL */}
              <RsvpPropertiesPanel
                selectedField={selectedField}
                allFields={fields || []}
                availableFields={(fields || []).filter(f => f.id !== selectedFieldId)}
                appearance={appearance}
                onUpdateField={(idOrUpdates, maybeUpdates) => {
                  if (typeof idOrUpdates === 'string' && maybeUpdates) {
                    updateField(idOrUpdates, maybeUpdates);
                  } else if (selectedFieldId && typeof idOrUpdates === 'object') {
                    updateField(selectedFieldId, idOrUpdates);
                  }
                }}
                onDuplicateField={duplicateField}
                onDeleteField={removeField}
                onUpdateAppearance={(updates) => {
                  setAppearance(prev => ({ ...prev, ...updates }));
                }}
                onClose={() => setSelectedFieldId(null)}
              />
            </div>
          )}

          {/* TAB 2: DESIGN & THEME PRESETS */}
          {activeTab === 'design' && !isPreview && (
            <div className="flex h-full w-full overflow-hidden bg-neutral-100/40">
              <div className="w-96 bg-white border-r border-neutral-200 p-6 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">Form Theme Presets</h3>
                  <p className="text-xs text-neutral-500 mt-1">One-click designer presets crafted for WeVentureHub events.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyTheme(preset.id)}
                      className="p-3 border rounded-2xl text-left hover:border-brand-primary hover:shadow-md transition-all group bg-neutral-50/50"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-3.5 h-3.5 rounded-full border shadow-2xs" style={{ backgroundColor: preset.appearance.backgroundColor }} />
                        <span className="w-3.5 h-3.5 rounded-full border shadow-2xs" style={{ backgroundColor: preset.appearance.primaryColor }} />
                        <span className="w-3.5 h-3.5 rounded-full border shadow-2xs" style={{ backgroundColor: preset.appearance.accentColor || '#84CC16' }} />
                      </div>
                      <p className="text-xs font-black text-neutral-900 group-hover:text-brand-primary">{preset.label}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{preset.description}</p>
                    </button>
                  ))}
                </div>

                <hr className="border-neutral-200" />

                {/* Granular Properties */}
                <RsvpPropertiesPanel
                  selectedField={null}
                  allFields={fields || []}
                  availableFields={fields || []}
                  onUpdateField={() => {}}
                  appearance={appearance}
                  onUpdateAppearance={(updates) => setAppearance(prev => ({ ...prev, ...updates }))}
                />
              </div>

              {/* Design Preview Canvas */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
                <div 
                  className="w-full max-w-xl bg-white shadow-2xl p-8 border border-neutral-200 transition-all"
                  style={{ 
                    borderRadius: `${appearance.borderRadius || 16}px`,
                    backgroundColor: appearance.cardBackground || '#FFFFFF',
                    fontFamily: appearance.fontFamily || 'inherit'
                  }}
                >
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Theme Preview</span>
                    <h2 className="text-2xl font-black text-neutral-900 mt-1">{event.title}</h2>
                    <p className="text-xs text-neutral-500 mt-1">Live demonstration of selected colors, typography, and button radius.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <label className="text-xs font-bold text-neutral-700">Sample Text Field</label>
                      <input 
                        type="text" 
                        placeholder="Interactive preview input..." 
                        className="w-full mt-1.5 p-3 bg-white border border-neutral-200 rounded-lg text-xs" 
                        readOnly 
                      />
                    </div>

                    <button
                      className="w-full py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all"
                      style={{ 
                        backgroundColor: appearance.buttonColor || appearance.primaryColor,
                        borderRadius: `${appearance.buttonRadius ?? appearance.borderRadius}px`
                      }}
                    >
                      {appearance.buttonText || 'Confirm Registration'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">Registration Capacity & Status</h3>
                  <p className="text-xs text-neutral-500">Configure attendee limits and ticket pricing for this event.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Registration Mode</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => onUpdate({ isFreeRsvp: true })}
                        className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${
                          event.isFreeRsvp ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'bg-white text-neutral-500'
                        }`}
                      >
                        Free RSVP
                      </button>
                      <button 
                        onClick={() => onUpdate({ isFreeRsvp: false })}
                        className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${
                          !event.isFreeRsvp ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'bg-white text-neutral-500'
                        }`}
                      >
                        Paid Ticket
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Maximum Capacity"
                      type="number"
                      placeholder="0 for unlimited"
                      defaultValue={event.capacity?.maxCapacity || 0}
                      onChange={(e) => onUpdate({ capacity: { ...event.capacity, maxCapacity: parseInt(e.target.value) || 0 } })}
                    />
                    <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked={event.capacity?.isUnlimited}
                        onChange={(e) => onUpdate({ capacity: { ...event.capacity, isUnlimited: e.target.checked } })}
                        className="rounded text-brand-primary"
                      />
                      <span>Unlimited capacity</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EMAIL AUTOMATION */}
          {activeTab === 'email' && (
            <div className="h-full overflow-y-auto p-8 max-w-5xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">Confirmation Email Automation</h3>
                    <p className="text-xs text-neutral-500">Automatically dispatched immediately upon successful registration.</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={emailSettings.confirmationEmail.enabled}
                      onChange={(e) => setEmailSettings({
                        ...emailSettings,
                        confirmationEmail: { ...emailSettings.confirmationEmail, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 text-brand-primary rounded"
                    />
                    <span className="text-xs font-bold text-neutral-800">Enabled</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Sender Name" 
                    value={emailSettings.confirmationEmail.senderName || ""}
                    onChange={(e) => setEmailSettings({
                      ...emailSettings,
                      confirmationEmail: { ...emailSettings.confirmationEmail, senderName: e.target.value }
                    })}
                  />
                  <Input 
                    label="Reply-To Email" 
                    value={emailSettings.confirmationEmail.replyTo || ""}
                    onChange={(e) => setEmailSettings({
                      ...emailSettings,
                      confirmationEmail: { ...emailSettings.confirmationEmail, replyTo: e.target.value }
                    })}
                  />
                </div>

                <Input 
                  label="Email Subject" 
                  value={emailSettings.confirmationEmail.subject || ""}
                  onChange={(e) => setEmailSettings({
                    ...emailSettings,
                    confirmationEmail: { ...emailSettings.confirmationEmail, subject: e.target.value }
                  })}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Message Body</label>
                  <textarea 
                    rows={6}
                    className="w-full p-4 border border-neutral-200 rounded-xl text-xs font-sans focus:border-brand-primary"
                    value={emailSettings.confirmationEmail.body || ""}
                    onChange={(e) => setEmailSettings({
                      ...emailSettings,
                      confirmationEmail: { ...emailSettings.confirmationEmail, body: e.target.value }
                    })}
                  />
                  <p className="text-[11px] text-neutral-400">Available variables: {"{name}"}, {"{event_title}"}, {"{event_date}"}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TICKETS */}
          {activeTab === 'ticket' && (
            <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">Digital Pass Format</h3>
                  <p className="text-xs text-neutral-500">Configure ticket numbering format and verification parameters.</p>
                </div>

                <Input 
                  label="Ticket ID Prefix Format" 
                  placeholder="WVH-EVENT-XXXXX" 
                  value={ticketSettings.numberFormat || ""}
                  onChange={(e) => setTicketSettings({ ...ticketSettings, numberFormat: e.target.value })}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Entry Instructions</label>
                  <textarea 
                    rows={3}
                    className="w-full p-3 border border-neutral-200 rounded-xl text-xs"
                    placeholder="Please present this digital pass upon arrival at WeVentureHub reception."
                    value={ticketSettings.entryInstructions || ""}
                    onChange={(e) => setTicketSettings({ ...ticketSettings, entryInstructions: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PUBLIC ACCESS */}
          {activeTab === 'access' && (
            <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">Public Registration Link</h3>
                  <p className="text-xs text-neutral-500">Share this direct link with prospective attendees or embed on your website.</p>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={publicUrl || `${window.location.origin}/#/events/${event.slug || event.id}/rsvp`}
                    className="flex-1 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    className="px-4 text-xs font-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl || `${window.location.origin}/#/events/${event.slug || event.id}/rsvp`);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                  >
                    {copiedUrl ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-neutral-100">
                  <div className="w-24 h-24 bg-white p-2 border rounded-xl shadow-xs shrink-0">
                    <QRCodeCanvas value={publicUrl || `${window.location.origin}/#/events/${event.slug || event.id}/rsvp`} size={80} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-neutral-900">QR Code Direct Access</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Attendees can scan this QR code on posters or badges to open the registration form.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ATTENDEES */}
          {activeTab === 'registrations' && (
            <div className="h-full overflow-y-auto p-8 max-w-6xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">Attendee Registrations</h3>
                  <p className="text-xs text-neutral-500">View and manage registered participants.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={fetchRegistrations}>
                    Refresh
                  </Button>
                  {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.TENANT_ADMIN) && (
                    <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
                      Import CSV
                    </Button>
                  )}
                  <Button variant="primary" size="sm" onClick={handleExportCSV}>
                    Export CSV
                  </Button>
                </div>
              </div>

              {isLoadingRegs ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-neutral-400">Loading attendees...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="h-64 border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center space-y-2 bg-white">
                  <Users className="w-8 h-8 text-neutral-300" />
                  <p className="text-xs font-bold text-neutral-500">No registrations yet for this event.</p>
                </div>
              ) : (
                <div className="overflow-hidden bg-white border border-neutral-200 rounded-2xl shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 font-bold text-neutral-500 uppercase text-[10px]">Attendee</th>
                        <th className="px-4 py-3 font-bold text-neutral-500 uppercase text-[10px]">Pass ID</th>
                        <th className="px-4 py-3 font-bold text-neutral-500 uppercase text-[10px]">Status</th>
                        <th className="px-4 py-3 font-bold text-neutral-500 uppercase text-[10px]">Date</th>
                        <th className="px-4 py-3 font-bold text-neutral-500 uppercase text-[10px]">Attended</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {registrations.map((reg) => (
                        <tr key={reg.id || reg._id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-neutral-900">{reg.attendeeName}</p>
                            <p className="text-[10px] text-neutral-400">{reg.attendeeEmail}</p>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[10px] text-neutral-700">{reg.ticketNumber}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600">
                              {reg.status || 'CONFIRMED'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-500 text-[11px]">
                            {reg.registrationDate ? format(new Date(reg.registrationDate), 'MMM dd, HH:mm') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {reg.checkedIn ? (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Checked In
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400 italic">Not checked in</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showImportModal && (
                <ImportRegistrationsModal 
                  eventId={event.id}
                  eventTitle={event.title}
                  registrations={registrations}
                  onClose={() => setShowImportModal(false)}
                  onSuccess={() => {
                    fetchRegistrations();
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 8: PERFORMANCE / ANALYTICS */}
          {activeTab === 'performance' && (
            <div className="h-full overflow-y-auto p-8 max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Registrations', value: registrations.length, icon: Users, color: 'bg-brand-primary' },
                  { label: 'Check-in Rate', value: registrations.length > 0 ? `${Math.round((registrations.filter(r => r.checkedIn).length / registrations.length) * 100)}%` : '0%', icon: CheckCircle, color: 'bg-emerald-500' },
                  { label: 'Remaining Capacity', value: event.capacity?.isUnlimited ? 'Unlimited' : Math.max(0, (event.capacity?.maxCapacity || 0) - registrations.length), icon: LayoutDashboard, color: 'bg-amber-500' },
                  { label: 'Form Completion', value: '94.8%', icon: BarChart2, color: 'bg-indigo-500' },
                ].map((stat, i) => (
                  <div key={i} className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                        <stat.icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xl font-black text-neutral-900 mt-0.5">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
