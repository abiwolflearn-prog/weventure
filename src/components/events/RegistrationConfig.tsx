import React, { useState, useEffect } from 'react';
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
  Type,
  AlignLeft,
  AtSign,
  Phone,
  Hash,
  Calendar,
  Clock,
  ChevronDown,
  List,
  CheckSquare,
  CircleDot,
  ToggleLeft,
  FileUp,
  Image as ImageIcon,
  Building,
  Briefcase,
  MapPin,
  Link as LinkIcon,
  Heading,
  Minus,
  MessageSquare,
  Smartphone,
  Eye,
  Palette,
  Send,
  Shield,
  User,
  Star,
  PenTool,
  ShieldCheck,
  FileText,
  EyeOff,
  Code,
  Tablet,
  Monitor,
  Layout,
  RefreshCw,
  History,
  Lock,
  Unlock,
  Share2,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Undo2,
  Redo2,
  Trash2,
  Maximize2,
  Search
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { 
  IEvent, 
  IRsvpFormField, 
  IRsvpFormAppearance, 
  IRsvpEmailSettings, 
  IRsvpTicketSettings,
  RegistrationStatus
} from '../../types';
import { axiosInstance } from '../../lib/axiosInstance';
import { format } from 'date-fns';

import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface RegistrationConfigProps {
  event: IEvent;
  onUpdate: (data: Partial<IEvent>) => void;
  onClose: () => void;
}

const FIELD_TYPES = [
  { id: 'section_title', label: 'Section Title', icon: Heading, category: 'layout' },
  { id: 'paragraph', label: 'Paragraph', icon: MessageSquare, category: 'layout' },
  { id: 'divider', label: 'Divider', icon: Minus, category: 'layout' },
  { id: 'text', label: 'Single Line Text', icon: Type, category: 'basic' },
  { id: 'textarea', label: 'Multi Line Text', icon: AlignLeft, category: 'basic' },
  { id: 'name', label: 'Name', icon: User, category: 'basic' },
  { id: 'email', label: 'Email', icon: AtSign, category: 'basic' },
  { id: 'phone', label: 'Phone', icon: Phone, category: 'basic' },
  { id: 'company', label: 'Company', icon: Building, category: 'basic' },
  { id: 'job_title', label: 'Job Title', icon: Briefcase, category: 'basic' },
  { id: 'address', label: 'Address', icon: MapPin, category: 'basic' },
  { id: 'country', label: 'Country', icon: Globe, category: 'basic' },
  { id: 'city', label: 'City', icon: MapPin, category: 'basic' },
  { id: 'number', label: 'Number', icon: Hash, category: 'advanced' },
  { id: 'date', label: 'Date', icon: Calendar, category: 'advanced' },
  { id: 'time', label: 'Time', icon: Clock, category: 'advanced' },
  { id: 'dropdown', label: 'Dropdown', icon: ChevronDown, category: 'choice' },
  { id: 'multiselect', label: 'Multi Select', icon: List, category: 'choice' },
  { id: 'radio', label: 'Radio Group', icon: CircleDot, category: 'choice' },
  { id: 'checkbox', label: 'Checkbox Group', icon: CheckSquare, category: 'choice' },
  { id: 'yes_no', label: 'Yes / No', icon: ToggleLeft, category: 'choice' },
  { id: 'rating', label: 'Rating', icon: Star, category: 'advanced' },
  { id: 'file', label: 'File Upload', icon: FileUp, category: 'advanced' },
  { id: 'image', label: 'Image Upload', icon: ImageIcon, category: 'advanced' },
  { id: 'signature', label: 'Signature', icon: PenTool, category: 'advanced' },
  { id: 'consent', label: 'Consent Checkbox', icon: ShieldCheck, category: 'legal' },
  { id: 'terms', label: 'Terms & Conditions', icon: FileText, category: 'legal' },
  { id: 'hidden', label: 'Hidden Field', icon: EyeOff, category: 'system' },
  { id: 'html', label: 'HTML Block', icon: Code, category: 'system' },
  { id: 'qr_reference', label: 'QR Reference', icon: QrCode, category: 'system' },
  { id: 'custom', label: 'Custom Field', icon: Plus, category: 'system' },
];

const TEMPLATE_LIBRARY = [
  { id: 'conference', label: 'Conference', description: 'Standard professional summit layout with workshops and dietary questions.' },
  { id: 'workshop', label: 'Workshop', description: 'Focused on skills gathering and pre-requisite confirmations.' },
  { id: 'networking', label: 'Networking', description: 'Minimalist social mixer RSVP with LinkedIn integration fields.' },
  { id: 'seminar', label: 'Seminar', description: 'Educational lecture setup with student ID and academic fields.' },
  { id: 'hackathon', label: 'Hackathon', description: 'Detailed technical registration with GitHub and skills assessment.' },
  { id: 'training', label: 'Training', description: 'Corporate development tracking with employee ID and department.' },
];


const DEFAULT_RSVP_FIELDS: IRsvpFormField[] = [
  { id: 'f_name', type: 'text', label: 'Full Name', required: true, placeholder: 'Enter your full name', order: 1 },
  { id: 'f_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email', order: 2 },
  { id: 'f_company', type: 'company', label: 'Company / Organization', required: false, placeholder: 'Where do you work?', order: 3 }
];

export const RegistrationConfig: React.FC<RegistrationConfigProps> = ({
  event,
  onUpdate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'builder' | 'design' | 'email' | 'ticket' | 'access' | 'registrations' | 'performance' | 'versions'>('general');
  const [isPreview, setIsPreview] = useState(false);
  
  const [configVersions, setConfigVersions] = useState<any[]>([]);
  const [publishedVersion, setPublishedVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const [fields, setFields] = useState<IRsvpFormField[]>(event.rsvpFormFields?.length ? event.rsvpFormFields : DEFAULT_RSVP_FIELDS);
  const [appearance, setAppearance] = useState<IRsvpFormAppearance>(event.rsvpFormAppearance || {
    backgroundColor: '#F9FAFB',
    primaryColor: '#0F172A',
    textColor: '#111827',
    buttonColor: '#84CC16',
    buttonText: 'Submit Registration',
    borderRadius: 12,
    cardStyle: 'elevated'
  });
  const [emailSettings, setEmailSettings] = useState<IRsvpEmailSettings>(event.rsvpEmailSettings || {
    confirmationEmail: {
      enabled: true,
      subject: `Registration Confirmed: ${event.title}`,
      body: `Hello {name},\n\nYour registration for ${event.title} is confirmed!\n\nDate: ${event.schedule.startDate}\n\nSee you there!`,
      senderName: 'WeVentureHub Events',
      replyTo: 'events@weventurehub.com',
      attachTicket: true,
      attachQrCode: true
    },
    reminderEmail: {
      enabled: true,
      subject: `Reminder: ${event.title} starts soon!`,
      body: `Hello {name},\n\nThis is a reminder that ${event.title} is happening soon.`,
      senderName: 'WeVentureHub Events',
      replyTo: 'events@weventurehub.com',
      attachTicket: true,
      attachQrCode: true
    },
    followUpEmail: {
      enabled: false,
      subject: `Thank you for attending ${event.title}`,
      body: `Hello {name},\n\nThank you for attending our event!`,
      senderName: 'WeVentureHub Events',
      replyTo: 'events@weventurehub.com'
    }
  });
  const [ticketSettings, setTicketSettings] = useState<IRsvpTicketSettings>(event.rsvpTicketSettings || {
    layout: 'standard',
    qrPosition: 'bottom_right',
    numberFormat: `WVH-${event.id.slice(-5).toUpperCase()}-XXXXX`
  });
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoadingRegs, setIsLoadingRegs] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [history, setHistory] = useState<IRsvpFormField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
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
      const response = await axiosInstance.get(`/api/v1/events/${event.id}/rsvp-configuration`);
      const config = response.data?.data;
      if (config) {
        
        if (config.draft?.fields?.length) {
          setFields(config.draft.fields);
        } else {
          setFields(event.rsvpFormFields?.length ? event.rsvpFormFields : DEFAULT_RSVP_FIELDS);
        }

        if (config.draft?.appearance) setAppearance(config.draft.appearance);
        if (config.draft?.emailSettings) setEmailSettings(config.draft.emailSettings);
        if (config.draft?.ticketSettings) setTicketSettings(config.draft.ticketSettings);
        
        setConfigVersions(config.versions || []);
        setPublishedVersion(config.publishedVersion || 0);
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
    if (isLoadingConfig) return; // don't auto-save while loading
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
      const response = await axiosInstance.get(`/api/v1/ticketing/registrations/event/${event.id}`);
      setRegistrations(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setIsLoadingRegs(false);
    }
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
      setHistoryIndex(historyIndex - 1);
      setFields(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFields(history[historyIndex + 1]);
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
      
      const response = await axiosInstance.put(`/api/v1/events/${event.id}/rsvp-configuration/draft`, draftData);
      setLastSaved(response.data.data.draft.updatedAt);
      
      if (isPublish) {
        const pubResponse = await axiosInstance.post(`/api/v1/events/${event.id}/rsvp-configuration/publish`);
        setConfigVersions(pubResponse.data.data.versions);
        setPublishedVersion(pubResponse.data.data.publishedVersion);
      }
      
      // Keep event object in sync for dashboard
      await onUpdate({
        rsvpFormFields: fields,
        rsvpFormAppearance: appearance,
        rsvpEmailSettings: emailSettings,
        rsvpTicketSettings: ticketSettings,
      });
      
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    }
  };

  const handleRestoreVersion = async (version: number) => {
    if (!confirm(`Are you sure you want to restore Version ${version}? Unsaved changes will be lost.`)) return;
    
    try {
      const response = await axiosInstance.post(`/api/v1/events/${event.id}/rsvp-configuration/restore/${version}`);
      const config = response.data.data;
      if (config) {
        if (config.draft?.fields) setFields(config.draft.fields);
        if (config.draft?.appearance) setAppearance(config.draft.appearance);
        if (config.draft?.emailSettings) setEmailSettings(config.draft.emailSettings);
        if (config.draft?.ticketSettings) setTicketSettings(config.draft.ticketSettings);
        setLastSaved(config.draft?.updatedAt);
      }
    } catch (error) {
      console.error("Failed to restore version", error);
    }
  };

  const addField = (type: string) => {
    const newField: IRsvpFormField = {
      id: Math.random().toString(36).substring(2, 9),
      type: type as any,
      label: `New ${type.replace('_', ' ')} field`,
      required: false,
      order: fields.length,
      placeholder: '',
      description: '',
      width: 'full'
    };
    const newFields = [...fields, newField];
    setFields(newFields);
    addToHistory(newFields);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    const newFields = fields.filter(f => f.id !== id);
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
    const fieldToDuplicate = fields.find(f => f.id === id);
    if (!fieldToDuplicate) return;
    const newField = { 
      ...fieldToDuplicate, 
      id: Math.random().toString(36).substring(2, 9),
      order: fields.length
    };
    const newFields = [...fields, newField];
    setFields(newFields);
    addToHistory(newFields);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    const updatedFields = newFields.map((f, i) => ({ ...f, order: i }));
    setFields(updatedFields);
    addToHistory(updatedFields);
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const publicUrl = `${window.location.origin}/#/events/${event.slug}/rsvp`;

  return (
    <div className="flex h-full min-h-screen bg-white overflow-hidden">
      {/* Immersive Vertical Sidebar */}
      <div className="w-20 lg:w-64 border-r bg-neutral-900 flex flex-col shrink-0 overflow-hidden">
        <div className="p-6 border-b border-white/5 shrink-0 hidden lg:block">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Builder</h2>
          <p className="text-[10px] text-neutral-500 font-bold">EVENT REGISTRATION</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2">
          {[
            { id: 'general', label: 'Basics', icon: Settings },
            { id: 'builder', label: 'Forms', icon: ClipboardList },
            { id: 'design', label: 'Design', icon: Palette },
            { id: 'email', label: 'Automation', icon: Mail },
            { id: 'ticket', label: 'Tickets', icon: Ticket },
            { id: 'access', label: 'Access', icon: Globe },
            { id: 'registrations', label: 'Attendees', icon: Users },
            { id: 'performance', label: 'Analytics', icon: BarChart2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsPreview(false);
              }}
              className={`w-full flex flex-col lg:flex-row items-center lg:space-x-3 p-3 rounded-2xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5 lg:w-4 lg:h-4" />
              <span className="text-[9px] lg:text-[11px] font-black uppercase mt-1 lg:mt-0">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 space-y-2 shrink-0">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`w-full flex items-center justify-center space-x-2 p-4 rounded-2xl font-black text-[10px] uppercase transition-all ${
              isPreview 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden lg:block">{isPreview ? 'Edit Form' : 'Live Preview'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col bg-neutral-50/50 overflow-hidden">
        {/* Workspace Header */}
        <div className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white">
               {(() => {
                 const current = [
                   { id: 'general', icon: Settings },
                   { id: 'builder', icon: ClipboardList },
                   { id: 'design', icon: Palette },
                   { id: 'email', icon: Mail },
                   { id: 'ticket', icon: Ticket },
                   { id: 'access', icon: Globe },
                   { id: 'registrations', icon: Users },
                   { id: 'performance', icon: BarChart2 },
                 ].find(t => t.id === activeTab);
                 return current ? <current.icon className="w-4 h-4" /> : <Settings className="w-4 h-4" />;
               })()}
            </div>
            <div>
               <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">{activeTab} Configuration</h3>
               <p className="text-[10px] text-neutral-400 font-bold">WEVENTUREHUB EVENT ENGINE</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
             {saveStatus === 'saving' && (
               <div className="flex items-center space-x-2 text-neutral-400">
                 <RefreshCw className="w-3 h-3 animate-spin" />
                 <span className="text-[10px] font-bold uppercase">Saving Changes...</span>
               </div>
             )}
             {saveStatus === 'saved' && (
               <div className="flex items-center space-x-2 text-emerald-500">
                 <CheckCircle className="w-3 h-3" />
                 <span className="text-[10px] font-bold uppercase">All Changes Saved</span>
               </div>
             )}
             <div className="w-px h-6 bg-neutral-200" />
             <button 
               onClick={onClose}
               className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-neutral-900"
             >
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {isPreview ? (
            <div className="h-full overflow-y-auto bg-neutral-100/50 p-12">
               <div className="max-w-4xl mx-auto">
                  <div className="bg-white shadow-2xl rounded-[48px] overflow-hidden border border-neutral-200">
                    {/* Render high-fidelity preview */}
                    <div 
                      className="min-h-[800px]"
                      style={{ 
                        backgroundColor: appearance.backgroundColor || '#FFFFFF',
                        color: appearance.textColor || '#111827'
                      }}
                    >
                      {appearance.bannerUrl ? (
                        <img src={appearance.bannerUrl} alt="Banner" className="w-full h-64 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-neutral-900 flex items-center justify-center">
                           <Layout className="w-20 h-20 text-white/5" />
                        </div>
                      )}

                      <div className="max-w-2xl mx-auto px-8 py-16 space-y-12">
                         <div className="space-y-4 text-center">
                            {appearance.eventLogo && <img src={appearance.eventLogo} alt="Logo" className="h-16 mx-auto mb-8" />}
                            <h1 className="text-4xl font-black">{event.title}</h1>
                            <p className="text-neutral-500 text-lg">{event.description}</p>
                         </div>

                         <div className="space-y-6">
                             {fields.map((field) => (
                              <div key={field.id} className="space-y-2">
                                 {field.type === 'section_title' ? (
                                   <h3 className="text-xl font-black pt-8 border-b-2 border-neutral-100 pb-2">{field.label}</h3>
                                 ) : field.type === 'paragraph' ? (
                                   <p className="text-neutral-500 leading-relaxed">{field.label}</p>
                                 ) : field.type === 'divider' ? (
                                   <hr className="my-8" />
                                 ) : (
                                   <div className="space-y-2">
                                      <label className="text-xs font-black uppercase tracking-widest text-neutral-400">
                                         {field.label}
                                         {field.required && <span className="text-rose-500 ml-1">*</span>}
                                      </label>
                                      <input 
                                        type={field.type === 'email' ? 'email' : 'text'}
                                        placeholder={field.placeholder}
                                        className="w-full px-6 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl outline-none focus:border-brand-primary transition-all text-sm font-bold"
                                        disabled
                                      />
                                   </div>
                                 )}
                              </div>
                            ))}
                         </div>

                         <button 
                           className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest text-white shadow-2xl transition-all transform hover:scale-[1.02]"
                           style={{ backgroundColor: appearance.buttonColor || appearance.primaryColor }}
                           disabled
                         >
                           {appearance.buttonText || 'Complete Registration'}
                         </button>

                         <p className="text-center text-[10px] font-black uppercase text-neutral-300 tracking-[0.2em]">
                           {appearance.footerText || "SECURE PAYMENT POWERED BY WEVENTUREHUB"}
                         </p>
                      </div>
                    </div>
                  </div>
               </div>
              </div>
          ) : (
            <div className="h-full overflow-y-auto p-8">
              {activeTab === 'general' && (
          <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900">Registration Status</h3>
                <div className="flex items-center justify-between p-4 bg-neutral-slate-50 rounded-2xl border">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-700">Enable Registration</span>
                    <p className="text-[10px] text-neutral-slate-400">Allow visitors to RSVP for this event.</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 text-brand-primary rounded" defaultChecked />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-neutral-slate-400 tracking-wider">Registration Type</label>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => onUpdate({ isFreeRsvp: true })}
                      className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${event.isFreeRsvp ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'bg-white text-neutral-slate-400'}`}
                    >
                      Free RSVP
                    </button>
                    <button 
                      onClick={() => onUpdate({ isFreeRsvp: false })}
                      className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${!event.isFreeRsvp ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'bg-white text-neutral-slate-400'}`}
                    >
                      Paid Ticket
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900">Capacity & Waitlist</h3>
                <Input
                  label="Maximum Capacity"
                  type="number"
                  placeholder="0 for unlimited"
                  defaultValue={event.capacity.maxCapacity}
                  onChange={(e) => onUpdate({ capacity: { ...event.capacity, maxCapacity: parseInt(e.target.value) || 0 } })}
                />
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="unlimited" 
                    defaultChecked={event.capacity.isUnlimited}
                    onChange={(e) => onUpdate({ capacity: { ...event.capacity, isUnlimited: e.target.checked } })}
                  />
                  <label htmlFor="unlimited" className="text-xs font-medium text-neutral-600">Unlimited capacity</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="waitlist" 
                    defaultChecked={event.capacity.enableWaitlist}
                    onChange={(e) => onUpdate({ capacity: { ...event.capacity, enableWaitlist: e.target.checked } })}
                  />
                  <label htmlFor="waitlist" className="text-xs font-medium text-neutral-600">Enable Waitlist</label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900">Lifecycle Dates</h3>
                <Input
                  label="Registration Opens"
                  type="datetime-local"
                  defaultValue={event.registrationSettings.registrationOpenDate ? format(new Date(event.registrationSettings.registrationOpenDate), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => onUpdate({ registrationSettings: { ...event.registrationSettings, registrationOpenDate: e.target.value } })}
                />
                <Input
                  label="Registration Closes"
                  type="datetime-local"
                  defaultValue={event.registrationSettings.registrationCloseDate ? format(new Date(event.registrationSettings.registrationCloseDate), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => onUpdate({ registrationSettings: { ...event.registrationSettings, registrationCloseDate: e.target.value } })}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900">Features</h3>
                {[
                  { id: 'qr', label: 'QR Code Check-in', enabled: event.registrationSettings.enableQrCheckIn },
                  { id: 'tickets', label: 'Digital Tickets', enabled: event.registrationSettings.enableDigitalTickets },
                  { id: 'approval', label: 'Manual Staff Approval', enabled: event.registrationSettings.requiresApproval },
                ].map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-3 bg-neutral-slate-50/50 rounded-xl border border-dashed">
                    <span className="text-xs font-bold text-neutral-600">{feature.label}</span>
                    <input 
                      type="checkbox" 
                      defaultChecked={feature.enabled}
                      onChange={(e) => {
                        const settings = { ...event.registrationSettings };
                        if (feature.id === 'qr') settings.enableQrCheckIn = e.target.checked;
                        if (feature.id === 'tickets') settings.enableDigitalTickets = e.target.checked;
                        if (feature.id === 'approval') settings.requiresApproval = e.target.checked;
                        onUpdate({ registrationSettings: settings });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="flex h-full min-h-[600px] overflow-hidden bg-neutral-100/30">
            {/* 1. LEFT SIDEBAR: Form Components */}
            <div className="w-72 border-r bg-neutral-slate-50 overflow-y-auto p-4 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Components</h3>
                <div className="flex items-center space-x-1">
                   <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-white rounded-lg disabled:opacity-30"><Undo2 className="w-3.5 h-3.5" /></button>
                   <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-white rounded-lg disabled:opacity-30"><Redo2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {['layout', 'basic', 'choice', 'advanced', 'legal', 'system'].map((cat) => (
                <div key={cat} className="space-y-2">
                  <p className="text-[9px] font-bold text-neutral-slate-400 uppercase tracking-wider">{cat}</p>
                  <div className="grid grid-cols-1 gap-1">
                    {FIELD_TYPES.filter(ft => ft.category === cat).map((ft) => (
                      <button
                        key={ft.id}
                        onClick={() => addField(ft.id)}
                        className="flex items-center space-x-3 p-2.5 rounded-xl border bg-white hover:border-brand-primary hover:shadow-sm transition-all text-left group"
                      >
                        <div className="p-1.5 bg-neutral-slate-50 rounded-lg group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                          <ft.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-bold text-neutral-600">{ft.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 2. CENTER CANVAS: Live Preview */}
            <div className="flex-1 bg-neutral-100/50 overflow-y-auto p-12 flex flex-col items-center">
              <div className="w-full max-w-4xl space-y-8">
                 {/* Toolbar */}
                 <div className="flex items-center justify-between bg-white p-2 rounded-2xl border shadow-sm">
                     <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-2 rounded-xl transition-colors ${previewDevice === 'desktop' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50 text-neutral-400'}`}
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setPreviewDevice('tablet')}
                        className={`p-2 rounded-xl transition-colors ${previewDevice === 'tablet' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50 text-neutral-400'}`}
                      >
                        <Tablet className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-2 rounded-xl transition-colors ${previewDevice === 'mobile' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50 text-neutral-400'}`}
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-3 pr-2">
                       <div className="flex items-center space-x-1.5">
                          {saveStatus === 'saving' ? (
                            <>
                              <RefreshCw className="w-3 h-3 text-neutral-400 animate-spin" />
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Saving...</span>
                            </>
                          ) : saveStatus === 'saved' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">All changes saved</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3 text-rose-500" />
                              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Save Error</span>
                            </>
                          )}
                       </div>
                       <Button size="sm" variant="primary" className="h-9 px-4 text-[10px] font-black uppercase">Publish Form</Button>
                    </div>
                 </div>

                 {/* The Canvas */}
                 <div 
                   className={`mx-auto bg-white shadow-2xl transition-all duration-500 overflow-hidden relative ${
                      previewDevice === 'mobile' ? 'max-w-[375px]' : 
                      previewDevice === 'tablet' ? 'max-w-[768px]' : 'max-w-full'
                   }`}
                   style={{ 
                     borderRadius: `${appearance.borderRadius}px`,
                     backgroundColor: appearance.backgroundColor || '#FFFFFF',
                     fontFamily: appearance.fontFamily || 'inherit'
                   }}
                 >
                   {/* Banner */}
                   {appearance.bannerUrl ? (
                     <img src={appearance.bannerUrl} alt="Banner" className="w-full h-48 object-cover" />
                   ) : (
                     <div className="w-full h-32 bg-neutral-900 flex items-center justify-center text-white/10">
                        <LayoutDashboard className="w-16 h-16" />
                     </div>
                   )}

                   <div className="p-8 md:p-12 space-y-8">
                      {/* Header */}
                      <div className="flex flex-col items-center text-center">
                        {appearance.eventLogo && (
                          <img src={appearance.eventLogo} alt="Logo" className="h-12 mb-6 object-contain" />
                        )}
                        <h1 className="text-3xl font-black text-neutral-900 mb-2">{event.title}</h1>
                        <p className="text-sm text-neutral-500 font-medium">{event.description.substring(0, 100)}...</p>
                      </div>

                      {/* Fields */}
                      <div className="space-y-4">
                        {fields.length === 0 ? (
                          <div className="h-48 border-2 border-dashed border-neutral-100 rounded-3xl flex flex-col items-center justify-center space-y-3 bg-neutral-50/50">
                            <Plus className="w-8 h-8 text-neutral-200" />
                            <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest">Canvas is empty</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {fields.map((field, index) => (
                              <div 
                                key={field.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFieldId(field.id);
                                }}
                                className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                  selectedFieldId === field.id 
                                    ? 'border-brand-primary bg-brand-primary/5 shadow-md' 
                                    : 'border-transparent hover:border-neutral-200 hover:bg-neutral-50/50'
                                }`}
                              >
                                {/* Field Actions */}
                                {selectedFieldId === field.id && (
                                  <div className="absolute -top-3 right-4 flex items-center space-x-1 z-10">
                                     <button onClick={() => duplicateField(field.id)} className="p-1.5 bg-white border shadow-sm rounded-lg hover:text-brand-primary transition-colors"><Copy className="w-3 h-3" /></button>
                                     <button onClick={() => moveField(index, 'up')} className="p-1.5 bg-white border shadow-sm rounded-lg hover:text-brand-primary transition-colors"><MoveUp className="w-3 h-3" /></button>
                                     <button onClick={() => moveField(index, 'down')} className="p-1.5 bg-white border shadow-sm rounded-lg hover:text-brand-primary transition-colors"><MoveDown className="w-3 h-3" /></button>
                                     <button onClick={() => removeField(field.id)} className="p-1.5 bg-white border shadow-sm rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                )}

                                {field.type === 'section_title' ? (
                                  <h3 className="text-lg font-black text-neutral-900 border-b pb-2 mb-2">{field.label}</h3>
                                ) : field.type === 'paragraph' ? (
                                  <p className="text-sm text-neutral-500 leading-relaxed">{field.label}</p>
                                ) : field.type === 'divider' ? (
                                  <hr className="my-2" />
                                ) : (
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-neutral-700 uppercase tracking-widest flex items-center space-x-1">
                                      <span>{field.label}</span>
                                      {field.required && <span className="text-rose-500">*</span>}
                                    </label>
                                    <div className="h-12 w-full bg-neutral-50 border rounded-xl flex items-center px-4 text-[11px] text-neutral-400">
                                      {field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                                    </div>
                                    {field.description && <p className="text-[9px] text-neutral-400 italic">{field.description}</p>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Submit Button Preview */}
                      <div className="pt-6 border-t border-dashed">
                        <button 
                          disabled
                          className="w-full py-4 text-xs font-black text-white shadow-xl opacity-90"
                          style={{ 
                             backgroundColor: appearance.buttonColor || appearance.primaryColor,
                             borderRadius: `${appearance.buttonRadius || appearance.borderRadius}px`
                          }}
                        >
                          {appearance.buttonText || 'Complete Registration'}
                        </button>
                        <p className="text-center text-[9px] text-neutral-400 mt-4 uppercase font-bold tracking-widest">
                           {appearance.footerText || "SECURE PAYMENT POWERED BY WEVENTUREHUB"}
                        </p>
                      </div>
                   </div>
                 </div>
              </div>
            </div>

            {/* 3. RIGHT SIDEBAR: Properties Panel */}
            <div className="w-80 border-l bg-white overflow-y-auto">
              {selectedField ? (
                <div className="p-6 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Field Properties</h3>
                    <button onClick={() => setSelectedFieldId(null)} className="p-1 hover:bg-neutral-100 rounded-lg"><X className="w-4 h-4 text-neutral-400" /></button>
                  </div>

                  <div className="space-y-6">
                    <Input
                      label="Field Label"
                      value={selectedField.label || ""}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    />
                    
                    {!['section_title', 'paragraph', 'divider'].includes(selectedField.type) && (
                      <Input
                        label="Placeholder Text"
                        value={selectedField.placeholder || ""}
                        onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                      />
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Field Description</label>
                       <textarea 
                         className="w-full p-3 border rounded-xl text-xs min-h-[80px]"
                         value={selectedField.description || ""}
                         onChange={(e) => updateField(selectedField.id, { description: e.target.value })}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex items-center justify-between p-3 border rounded-xl bg-neutral-slate-50/50">
                          <span className="text-[11px] font-bold text-neutral-600">Required</span>
                          <input 
                            type="checkbox" 
                            checked={selectedField.required} 
                            onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                            className="w-4 h-4 rounded text-brand-primary"
                          />
                       </div>
                       <div className="flex items-center justify-between p-3 border rounded-xl bg-neutral-slate-50/50">
                          <span className="text-[11px] font-bold text-neutral-600">Hidden</span>
                          <input 
                            type="checkbox" 
                            checked={selectedField.hidden} 
                            onChange={(e) => updateField(selectedField.id, { hidden: e.target.checked })}
                            className="w-4 h-4 rounded text-brand-primary"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Field Width</label>
                       <div className="grid grid-cols-3 gap-2">
                          {(['full', 'half', 'third'] as const).map(w => (
                            <button
                              key={w}
                              onClick={() => updateField(selectedField.id, { width: w })}
                              className={`py-2 border rounded-lg text-[10px] font-bold uppercase transition-all ${selectedField.width === w ? 'border-brand-primary bg-brand-primary text-white' : 'bg-white text-neutral-400'}`}
                            >
                              {w}
                            </button>
                          ))}
                       </div>
                    </div>

                    {['dropdown', 'radio', 'checkbox', 'multiselect'].includes(selectedField.type) && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Options (One per line)</label>
                         <textarea 
                           className="w-full p-4 border rounded-xl text-xs min-h-[120px] font-mono"
                           value={selectedField.options?.join('\n') || ''}
                           onChange={(e) => updateField(selectedField.id, { options: e.target.value.split('\n').filter(Boolean) })}
                         />
                      </div>
                    )}

                    <div className="pt-6 border-t space-y-4">
                       <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Conditional Logic</h4>
                       <button className="w-full py-3 border-2 border-dashed border-neutral-100 rounded-xl text-[10px] font-black text-neutral-400 uppercase hover:border-brand-primary hover:text-brand-primary transition-all">
                          Add Logic Rule
                       </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                   <div className="w-16 h-16 bg-neutral-slate-50 rounded-full flex items-center justify-center">
                      <Settings className="w-8 h-8 text-neutral-200" />
                   </div>
                   <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                     Select a field on the canvas to edit its properties, validation, and logic.
                   </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="flex h-full min-h-[600px] overflow-hidden bg-neutral-100/30">
            {/* Design Controls */}
            <div className="w-80 border-r bg-white overflow-y-auto p-6 space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Theme & Colors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Background</label>
                      <div className="flex items-center space-x-2 border rounded-xl p-2">
                        <input 
                          type="color" 
                          value={appearance.backgroundColor || ""}
                          onChange={(e) => setAppearance({ ...appearance, backgroundColor: e.target.value })}
                          className="w-6 h-6 rounded border-none p-0 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold">{appearance.backgroundColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Primary</label>
                      <div className="flex items-center space-x-2 border rounded-xl p-2">
                        <input 
                          type="color" 
                          value={appearance.primaryColor || ""}
                          onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                          className="w-6 h-6 rounded border-none p-0 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold">{appearance.primaryColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Text</label>
                      <div className="flex items-center space-x-2 border rounded-xl p-2">
                        <input 
                          type="color" 
                          value={appearance.textColor || ""}
                          onChange={(e) => setAppearance({ ...appearance, textColor: e.target.value })}
                          className="w-6 h-6 rounded border-none p-0 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold">{appearance.textColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Accent</label>
                      <div className="flex items-center space-x-2 border rounded-xl p-2">
                        <input 
                          type="color" 
                          value={appearance.accentColor || '#84CC16'}
                          onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                          className="w-6 h-6 rounded border-none p-0 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold">{appearance.accentColor || '#84CC16'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Typography</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Font Family</label>
                      <select 
                        className="w-full p-3 border rounded-xl text-xs font-bold"
                        value={appearance.fontFamily || ""}
                        onChange={(e) => setAppearance({ ...appearance, fontFamily: e.target.value })}
                      >
                        <option value="inherit">Default Sans</option>
                        <option value="'Inter', sans-serif">Inter</option>
                        <option value="'Playfair Display', serif">Playfair Display</option>
                        <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                        <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                        <option value="'Fira Code', monospace">Fira Code</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Font Size (Base: {appearance.fontSize || 16}px)</label>
                      <input 
                        type="range" 
                        min="12" 
                        max="20" 
                        value={appearance.fontSize || 16}
                        onChange={(e) => setAppearance({ ...appearance, fontSize: parseInt(e.target.value) })}
                        className="w-full accent-brand-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Layout & Styling</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Page Width</label>
                      <div className="grid grid-cols-2 gap-2">
                         {(['narrow', 'standard', 'wide', 'full'] as const).map(w => (
                           <button
                             key={w}
                             onClick={() => setAppearance({ ...appearance, pageWidth: w })}
                             className={`py-2 border rounded-lg text-[10px] font-bold uppercase transition-all ${appearance.pageWidth === w ? 'border-brand-primary bg-brand-primary text-white' : 'bg-white text-neutral-400'}`}
                           >
                             {w}
                           </button>
                         ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Card Style</label>
                      <select 
                        className="w-full p-3 border rounded-xl text-xs font-bold"
                        value={appearance.cardStyle || ""}
                        onChange={(e) => setAppearance({ ...appearance, cardStyle: e.target.value as any })}
                      >
                        <option value="flat">Flat</option>
                        <option value="elevated">Elevated</option>
                        <option value="bordered">Bordered</option>
                        <option value="glass">Glassmorphism</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Border Radius ({appearance.borderRadius}px)</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="32" 
                        value={appearance.borderRadius || 0}
                        onChange={(e) => setAppearance({ ...appearance, borderRadius: parseInt(e.target.value) })}
                        className="w-full accent-brand-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Branding Assets</h3>
                  <div className="space-y-4">
                    <Input
                      label="Banner Image URL"
                      placeholder="https://..."
                      value={appearance.bannerUrl || ""}
                      onChange={(e) => setAppearance({ ...appearance, bannerUrl: e.target.value })}
                    />
                    <Input
                      label="Event Logo URL"
                      placeholder="https://..."
                      value={appearance.eventLogo || ""}
                      onChange={(e) => setAppearance({ ...appearance, eventLogo: e.target.value })}
                    />
                    <Input
                      label="Success Icon URL"
                      placeholder="Custom checkmark or logo"
                      value={appearance.successIcon || ""}
                      onChange={(e) => setAppearance({ ...appearance, successIcon: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="flex-1 bg-neutral-100/50 p-12 flex flex-col items-center overflow-y-auto">
               <div className="w-full max-w-4xl space-y-6">
                  <div className="flex items-center justify-between bg-white p-2 rounded-2xl border shadow-sm">
                    <div className="flex items-center space-x-1">
                      <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded-xl transition-colors ${previewDevice === 'desktop' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50 text-neutral-400'}`}><Monitor className="w-4 h-4" /></button>
                      <button onClick={() => setPreviewDevice('tablet')} className={`p-2 rounded-xl transition-colors ${previewDevice === 'tablet' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50 text-neutral-400'}`}><Tablet className="w-4 h-4" /></button>
                      <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded-xl transition-colors ${previewDevice === 'mobile' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50 text-neutral-400'}`}><Smartphone className="w-4 h-4" /></button>
                    </div>
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Styling Preview</p>
                  </div>

                  <div 
                    className={`mx-auto bg-white shadow-2xl transition-all duration-500 overflow-hidden relative ${
                       previewDevice === 'mobile' ? 'max-w-[375px]' : 
                       previewDevice === 'tablet' ? 'max-w-[768px]' : 'max-w-full'
                    }`}
                    style={{ 
                      borderRadius: `${appearance.borderRadius}px`,
                      backgroundColor: appearance.backgroundColor || '#FFFFFF',
                      fontFamily: appearance.fontFamily || 'inherit',
                      fontSize: `${appearance.fontSize || 16}px`
                    }}
                  >
                    {appearance.bannerUrl ? (
                      <img src={appearance.bannerUrl} alt="Banner" className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-neutral-900" />
                    )}

                    <div className="p-8 md:p-12 space-y-8">
                       <div className="flex flex-col items-center text-center">
                         {appearance.eventLogo && (
                           <img src={appearance.eventLogo} alt="Logo" className="h-12 mb-6 object-contain" />
                         )}
                         <h1 className="text-3xl font-black text-neutral-900 mb-2">{event.title}</h1>
                         <p className="text-sm text-neutral-500 font-medium">Join us for this exclusive event experience.</p>
                       </div>

                       <div 
                         className={`p-8 space-y-6 ${
                            appearance.cardStyle === 'elevated' ? 'shadow-xl' : 
                            appearance.cardStyle === 'bordered' ? 'border' : 
                            appearance.cardStyle === 'glass' ? 'bg-white/40 backdrop-blur-md border border-white/50' : ''
                         }`}
                         style={{ 
                           borderRadius: `${appearance.borderRadius}px`,
                           backgroundColor: appearance.cardStyle === 'glass' ? undefined : (appearance.cardBackground || '#FFFFFF')
                         }}
                       >
                          <div className="space-y-4">
                            <div className="space-y-2">
                               <div className="h-2 w-24 bg-neutral-100 rounded" />
                               <div className="h-12 w-full bg-neutral-50 border rounded-xl" />
                            </div>
                            <div className="space-y-2">
                               <div className="h-2 w-32 bg-neutral-100 rounded" />
                               <div className="h-12 w-full bg-neutral-50 border rounded-xl" />
                            </div>
                          </div>

                          <button 
                            disabled
                            className="w-full py-4 text-xs font-black text-white shadow-xl"
                            style={{ 
                               backgroundColor: appearance.buttonColor || appearance.primaryColor,
                               borderRadius: `${appearance.buttonRadius || appearance.borderRadius}px`
                            }}
                          >
                            {appearance.buttonText || 'Complete Registration'}
                          </button>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
            <div className="space-y-6">
               <div className="flex p-1 bg-neutral-100 rounded-xl w-fit">
                  <button className="px-4 py-1.5 text-[11px] font-bold bg-white shadow-sm rounded-lg">Confirmation</button>
                  <button className="px-4 py-1.5 text-[11px] font-bold text-neutral-400">Reminder</button>
                  <button className="px-4 py-1.5 text-[11px] font-bold text-neutral-400">Follow-up</button>
               </div>

               <div className="space-y-4 p-5 bg-neutral-slate-50 border rounded-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-900">Confirmation Email Settings</h3>
                    <input 
                      type="checkbox" 
                      checked={emailSettings.confirmationEmail.enabled}
                      onChange={(e) => setEmailSettings({
                        ...emailSettings,
                        confirmationEmail: { ...emailSettings.confirmationEmail, enabled: e.target.checked }
                      })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Message Body</label>
                    <textarea 
                      className="w-full p-4 border rounded-xl text-xs min-h-[150px] focus:ring-1 focus:ring-brand-primary bg-white"
                      value={emailSettings.confirmationEmail.body || ""}
                      onChange={(e) => setEmailSettings({
                        ...emailSettings,
                        confirmationEmail: { ...emailSettings.confirmationEmail, body: e.target.value }
                      })}
                    />
                    <p className="text-[10px] text-neutral-slate-400 italic">Use {"{name}"}, {"{event_title}"}, {"{event_date}"} as placeholders.</p>
                  </div>

                  <div className="flex items-center space-x-6 pt-2">
                     <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={emailSettings.confirmationEmail.attachTicket}
                          onChange={(e) => setEmailSettings({
                            ...emailSettings,
                            confirmationEmail: { ...emailSettings.confirmationEmail, attachTicket: e.target.checked }
                          })}
                        />
                        <span className="text-xs font-medium text-neutral-600">Attach Ticket</span>
                     </div>
                     <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={emailSettings.confirmationEmail.attachQrCode}
                          onChange={(e) => setEmailSettings({
                            ...emailSettings,
                            confirmationEmail: { ...emailSettings.confirmationEmail, attachQrCode: e.target.checked }
                          })}
                        />
                        <span className="text-xs font-medium text-neutral-600">Attach QR Code</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Email Preview</h3>
               <div className="bg-white border rounded-3xl shadow-xl overflow-hidden flex flex-col h-[500px]">
                  <div className="p-4 border-b bg-neutral-50 flex items-center space-x-3">
                     <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white font-black text-xs">WV</div>
                     <div>
                        <p className="text-[11px] font-bold text-neutral-900">{emailSettings.confirmationEmail.senderName}</p>
                        <p className="text-[10px] text-neutral-400">to: attendee@example.com</p>
                     </div>
                  </div>
                  <div className="p-8 flex-1 overflow-y-auto">
                    <h2 className="text-lg font-black text-neutral-900 mb-6">{emailSettings.confirmationEmail.subject}</h2>
                    <div className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">
                      {emailSettings.confirmationEmail.body.replace('{name}', 'Attendee').replace('{event_title}', event.title)}
                    </div>
                    
                    {emailSettings.confirmationEmail.attachTicket && (
                      <div className="mt-8 p-4 border border-dashed border-neutral-slate-200 rounded-2xl flex items-center justify-between bg-neutral-slate-50/30">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg border shadow-sm">
                            <Ticket className="w-5 h-5 text-brand-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-neutral-900">Digital_Ticket.pdf</p>
                            <p className="text-[9px] text-neutral-400">1.2 MB</p>
                          </div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'ticket' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900">Ticket Customization</h3>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Ticket Layout</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['standard', 'minimal', 'modern', 'badge'].map((layout) => (
                      <button
                        key={layout}
                        onClick={() => setTicketSettings({ ...ticketSettings, layout: layout as any })}
                        className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all ${ticketSettings.layout === layout ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'bg-white text-neutral-600'}`}
                      >
                        {layout}
                      </button>
                    ))}
                  </div>
                </div>

                <Input 
                  label="Ticket ID Format" 
                  placeholder="WH-EVENT-XXXXX" 
                  value={ticketSettings.numberFormat || ""}
                  onChange={(e) => setTicketSettings({ ...ticketSettings, numberFormat: e.target.value })}
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">QR Code Position</label>
                  <select 
                    className="w-full p-3 border rounded-xl text-xs font-bold bg-white"
                    value={ticketSettings.qrPosition || ""}
                    onChange={(e) => setTicketSettings({ ...ticketSettings, qrPosition: e.target.value as any })}
                  >
                    <option value="top_right">Top Right</option>
                    <option value="bottom_right">Bottom Right</option>
                    <option value="center">Center</option>
                    <option value="bottom_center">Bottom Center</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Entry Instructions</label>
                  <textarea 
                    className="w-full p-4 border rounded-xl text-xs min-h-[100px]"
                    placeholder="Show this ticket at the main gate..."
                    value={ticketSettings.entryInstructions || ""}
                    onChange={(e) => setTicketSettings({ ...ticketSettings, entryInstructions: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Ticket Preview</h3>
               <div className="bg-white border-2 border-neutral-100 rounded-[32px] shadow-2xl overflow-hidden relative">
                  <div className="bg-neutral-900 p-6 text-white flex justify-between items-center">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Official Event Pass</h4>
                      <h2 className="text-lg font-black leading-tight truncate max-w-[200px]">{event.title}</h2>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <Ticket className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between border-b pb-6 border-dashed border-neutral-200">
                      <div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase mb-1">Attendee</p>
                        <p className="text-xs font-black">Alex M. Johnson</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase mb-1">Status</p>
                        <p className="text-xs font-black text-emerald-500 uppercase">Confirmed</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-b pb-6 border-dashed border-neutral-200">
                      <div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase mb-1">Date</p>
                        <p className="text-xs font-black">{format(new Date(event.schedule.startDate), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase mb-1">Time</p>
                        <p className="text-xs font-black">{format(new Date(event.schedule.startDate), 'HH:mm')} onwards</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                       <div className="space-y-4 flex-1 pr-4">
                          <div>
                            <p className="text-[9px] font-bold text-neutral-400 uppercase mb-1">Ticket ID</p>
                            <p className="text-sm font-mono font-black">{ticketSettings.numberFormat.replace('XXXXX', '94215')}</p>
                          </div>
                          <p className="text-[10px] text-neutral-500 leading-relaxed italic">
                            {ticketSettings.entryInstructions || "No additional instructions provided."}
                          </p>
                       </div>
                       <div className="w-24 h-24 border-2 border-neutral-900 rounded-2xl p-2 flex items-center justify-center">
                          <QrCode className="w-full h-full text-neutral-900" />
                       </div>
                    </div>
                  </div>

                  {/* Decorative Ticket Cutouts */}
                  <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-r-2 border-neutral-100" />
                  <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-l-2 border-neutral-100" />
               </div>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="flex h-full min-h-[600px] overflow-hidden bg-neutral-100/30">
             <div className="w-80 border-r bg-white p-6 space-y-8 overflow-y-auto">
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Public Access Settings</h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                         <div>
                            <p className="text-[11px] font-bold text-neutral-900">Invite-Only Mode</p>
                            <p className="text-[9px] text-neutral-400">Only people with a direct link or secret code can RSVP.</p>
                         </div>
                         <input 
                           type="checkbox" 
                           checked={event.rsvpSettings?.isInviteOnly}
                           onChange={(e) => onUpdate({ rsvpSettings: { ...event.rsvpSettings, isInviteOnly: e.target.checked } })}
                           className="w-4 h-4 rounded text-brand-primary" 
                         />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                         <div>
                            <p className="text-[11px] font-bold text-neutral-900">Password Protected</p>
                            <p className="text-[9px] text-neutral-400">Require a password to access the RSVP page.</p>
                         </div>
                         <input 
                           type="checkbox" 
                           checked={event.rsvpSettings?.passwordProtected}
                           onChange={(e) => onUpdate({ rsvpSettings: { ...event.rsvpSettings, passwordProtected: e.target.checked } })}
                           className="w-4 h-4 rounded text-brand-primary" 
                         />
                      </div>
                      {event.rsvpSettings?.passwordProtected && (
                         <Input 
                            label="Registration Password" 
                            type="password"
                            value={event.rsvpSettings?.registrationPassword || ""}
                            onChange={(e) => onUpdate({ rsvpSettings: { ...event.rsvpSettings, registrationPassword: e.target.value } })}
                         />
                      )}
                      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                         <div>
                            <p className="text-[11px] font-bold text-neutral-900">Secret Link</p>
                            <p className="text-[9px] text-neutral-400">RSVP page will not be indexed by search engines.</p>
                         </div>
                         <input 
                           type="checkbox" 
                           checked={event.rsvpSettings?.secretLink}
                           onChange={(e) => onUpdate({ rsvpSettings: { ...event.rsvpSettings, secretLink: e.target.checked } })}
                           className="w-4 h-4 rounded text-brand-primary" 
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                   <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Guest Registration</h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                         <div>
                            <p className="text-[11px] font-bold text-neutral-900">Allow Guests</p>
                            <p className="text-[9px] text-neutral-400">Attendees can add guests to their registration.</p>
                         </div>
                         <input 
                           type="checkbox" 
                           checked={event.rsvpSettings?.allowGuestRegistration}
                           onChange={(e) => onUpdate({ rsvpSettings: { ...event.rsvpSettings, allowGuestRegistration: e.target.checked } })}
                           className="w-4 h-4 rounded text-brand-primary" 
                         />
                      </div>
                      {event.rsvpSettings?.allowGuestRegistration && (
                         <Input 
                            label="Max Guests per Person" 
                            type="number"
                            value={event.rsvpSettings?.maxGuestsPerRegistration || 0}
                            onChange={(e) => onUpdate({ rsvpSettings: { ...event.rsvpSettings, maxGuestsPerRegistration: parseInt(e.target.value) || 0 } })}
                         />
                      )}
                   </div>
                </div>
             </div>

             <div className="flex-1 bg-neutral-100/50 p-12 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-8">
                   <div className="p-8 bg-white rounded-[40px] shadow-2xl border border-neutral-200 space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 text-neutral-50">
                         <Globe className="w-48 h-48 -mr-12 -mt-12" />
                      </div>

                      <div className="relative space-y-6">
                        <div className="flex items-center space-x-4">
                           <div className="w-16 h-16 bg-brand-primary rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-brand-primary/20">
                              <Share2 className="w-8 h-8" />
                           </div>
                           <div>
                              <h2 className="text-xl font-black text-neutral-900">Live RSVP Channel</h2>
                              <p className="text-sm text-neutral-500 font-medium">Your event is ready to accept registrations.</p>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Public URL Slug</label>
                           <div className="flex items-stretch bg-neutral-50 rounded-2xl border-2 border-neutral-100 overflow-hidden focus-within:border-brand-primary transition-all">
                              <div className="px-4 flex items-center bg-neutral-100 text-[11px] font-black text-neutral-400 border-r font-mono">
                                 .../rsvp/
                              </div>
                              <input 
                                className="flex-1 px-4 py-4 bg-transparent text-sm font-bold text-neutral-900 outline-none"
                                value={event.slug || ""}
                                onChange={(e) => onUpdate({ slug: e.target.value })}
                              />
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(publicUrl);
                                  alert('Copied!');
                                }}
                                className="px-6 bg-neutral-900 text-white text-[11px] font-black uppercase hover:bg-black transition-colors"
                              >
                                Copy
                              </button>
                           </div>
                           <p className="text-[10px] text-neutral-slate-400 font-medium">Changing the slug will break old links. Use with caution.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-dashed">
                           <div className="flex flex-col items-center p-8 bg-neutral-50 rounded-[32px] border border-dashed border-neutral-200 text-center space-y-4 group transition-all hover:bg-white hover:shadow-xl">
                              <div className="w-32 h-32 bg-white rounded-2xl p-4 shadow-sm border group-hover:border-brand-primary transition-all">
                                 <QrCode className="w-full h-full text-neutral-900" />
                              </div>
                              <div className="space-y-1">
                                 <h4 className="text-xs font-black text-neutral-900">Access QR Code</h4>
                                 <p className="text-[10px] text-neutral-500">Scan to open RSVP page</p>
                              </div>
                              <Button size="sm" variant="secondary" className="w-full text-[10px] font-black uppercase rounded-xl h-10">Download PNG</Button>
                           </div>
                           <div className="flex flex-col items-center p-8 bg-neutral-50 rounded-[32px] border border-dashed border-neutral-200 text-center space-y-4 group transition-all hover:bg-white hover:shadow-xl">
                              <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-sm border group-hover:border-brand-primary transition-all">
                                 <div className="flex flex-wrap gap-2 justify-center px-4">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Twitter className="w-5 h-5" /></div>
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Linkedin className="w-5 h-5" /></div>
                                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Instagram className="w-5 h-5" /></div>
                                    <div className="p-2 bg-blue-100 text-blue-800 rounded-lg"><Facebook className="w-5 h-5" /></div>
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <h4 className="text-xs font-black text-neutral-900">Social Sharing</h4>
                                 <p className="text-[10px] text-neutral-500">Generate sharing assets</p>
                              </div>
                              <Button size="sm" variant="secondary" className="w-full text-[10px] font-black uppercase rounded-xl h-10">Configure Meta</Button>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-900">Event Registrations</h3>
              <div className="flex space-x-2">
                 <Button variant="secondary" size="sm" className="text-xs font-bold px-4" onClick={fetchRegistrations}>
                    Refresh Data
                 </Button>
                 <Button variant="primary" size="sm" className="text-xs font-bold px-4">
                    Export CSV
                 </Button>
              </div>
            </div>

            {isLoadingRegs ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-neutral-slate-400">Syncing registration data...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-neutral-100 rounded-3xl flex flex-col items-center justify-center space-y-3">
                <Users className="w-8 h-8 text-neutral-100" />
                <p className="text-xs text-neutral-slate-400 font-medium">No registrations yet for this event.</p>
              </div>
            ) : (
              <div className="overflow-hidden border rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Attendee</th>
                      <th className="px-4 py-3 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Ticket ID</th>
                      <th className="px-4 py-3 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Status</th>
                      <th className="px-4 py-3 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Registration Date</th>
                      <th className="px-4 py-3 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Check-in</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-neutral-slate-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-[10px] font-black text-neutral-600">
                              {reg.attendeeName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900">{reg.attendeeName}</p>
                              <p className="text-[10px] text-neutral-slate-400">{reg.attendeeEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-[10px]">{reg.ticketNumber}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            reg.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-neutral-slate-500">{format(new Date(reg.registrationDate), 'MMM dd, HH:mm')}</td>
                        <td className="px-4 py-4">
                           <div className="flex items-center space-x-1.5">
                              {reg.checkedIn ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-[10px] font-bold text-emerald-600">Attended</span>
                                </>
                              ) : (
                                <span className="text-[10px] font-medium text-neutral-400 italic">Not yet</span>
                              )}
                           </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                           <button className="text-[10px] font-black text-brand-primary hover:underline">View Answers</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-8 max-w-6xl mx-auto pb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {[
                 { label: 'Total Registrations', value: registrations.length, icon: Users, color: 'bg-brand-primary', trend: '+12% from yesterday' },
                 { label: 'Check-in Rate', value: registrations.length > 0 ? `${Math.round((registrations.filter(r => r.checkedIn).length / registrations.length) * 100)}%` : '0%', icon: CheckCircle, color: 'bg-emerald-500', trend: 'Target: 85%' },
                 { label: 'Remaining Capacity', value: event.capacity.isUnlimited ? 'Unlimited' : Math.max(0, event.capacity.maxCapacity - registrations.length), icon: LayoutDashboard, color: 'bg-amber-500', trend: `${registrations.length} spots filled` },
                 { label: 'Conversion Rate', value: '64.2%', icon: BarChart2, color: 'bg-indigo-500', trend: 'Avg: 42%' },
               ].map((stat, i) => (
                 <div key={i} className="p-6 bg-white border rounded-[32px] shadow-sm space-y-4">
                   <div className="flex items-center justify-between">
                     <div className={`w-10 h-10 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20`}>
                       <stat.icon className="w-5 h-5" />
                     </div>
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{stat.trend}</span>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-widest">{stat.label}</p>
                     <p className="text-2xl font-black text-neutral-900">{stat.value}</p>
                   </div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 p-8 bg-white border rounded-[40px] shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h3 className="text-sm font-black text-neutral-900">Registration Velocity</h3>
                        <p className="text-[11px] text-neutral-slate-400 font-medium">Daily signups over the last 14 days</p>
                     </div>
                     <div className="flex p-1 bg-neutral-100 rounded-lg">
                        <button className="px-3 py-1 text-[9px] font-black uppercase bg-white shadow-sm rounded-md">Daily</button>
                        <button className="px-3 py-1 text-[9px] font-black uppercase text-neutral-400">Weekly</button>
                     </div>
                  </div>
                  <div className="h-72 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                           { name: 'Day 1', value: 4 }, { name: 'Day 2', value: 7 }, { name: 'Day 3', value: 5 },
                           { name: 'Day 4', value: 12 }, { name: 'Day 5', value: 18 }, { name: 'Day 6', value: 15 },
                           { name: 'Day 7', value: 24 }, { name: 'Day 8', value: 32 }, { name: 'Day 9', value: 28 },
                           { name: 'Day 10', value: 45 }, { name: 'Day 11', value: 38 }, { name: 'Day 12', value: 52 },
                           { name: 'Day 13', value: 48 }, { name: 'Day 14', value: 64 },
                        ]}>
                           <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                           <XAxis dataKey="name" hide />
                           <YAxis hide />
                           <RechartsTooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                           />
                           <Area type="monotone" dataKey="value" stroke="#0F172A" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="p-8 bg-white border rounded-[40px] shadow-sm space-y-8 flex flex-col">
                  <div className="space-y-1">
                     <h3 className="text-sm font-black text-neutral-900">Traffic Sources</h3>
                     <p className="text-[11px] text-neutral-slate-400 font-medium">Where attendees are coming from</p>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                     <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    { name: 'Social', value: 45 },
                                    { name: 'Direct', value: 25 },
                                    { name: 'Email', value: 20 },
                                    { name: 'Partner', value: 10 },
                                 ]}
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={8}
                                 dataKey="value"
                              >
                                 <Cell fill="#0F172A" />
                                 <Cell fill="#84CC16" />
                                 <Cell fill="#6366F1" />
                                 <Cell fill="#F59E0B" />
                              </Pie>
                              <RechartsTooltip />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="space-y-3 pt-6">
                        {[
                           { label: 'Social Media', value: '45%', color: 'bg-neutral-900' },
                           { label: 'Direct Link', value: '25%', color: 'bg-brand-success' },
                           { label: 'Email Campaigns', value: '20%', color: 'bg-indigo-500' },
                           { label: 'Partners', value: '10%', color: 'bg-amber-500' },
                        ].map((item, i) => (
                           <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                 <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                 <span className="text-[11px] font-bold text-neutral-600">{item.label}</span>
                              </div>
                              <span className="text-[11px] font-black text-neutral-900">{item.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-8 bg-white border rounded-[40px] shadow-sm space-y-6">
                  <h3 className="text-sm font-black text-neutral-900">Device Breakdown</h3>
                  <div className="space-y-6">
                     {[
                        { label: 'Mobile App', value: 68, icon: Smartphone, color: 'bg-emerald-500' },
                        { label: 'Desktop Browser', value: 24, icon: Monitor, color: 'bg-blue-500' },
                        { label: 'Tablet', value: 8, icon: Tablet, color: 'bg-amber-500' },
                     ].map((device, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                 <device.icon className="w-4 h-4 text-neutral-400" />
                                 <span className="text-[11px] font-bold text-neutral-700">{device.label}</span>
                              </div>
                              <span className="text-[11px] font-black text-neutral-900">{device.value}%</span>
                           </div>
                           <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                              <div className={`h-full ${device.color}`} style={{ width: `${device.value}%` }} />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="p-8 bg-white border rounded-[40px] shadow-sm space-y-6">
                  <h3 className="text-sm font-black text-neutral-900">Waitlist Management</h3>
                  <h3 className="text-sm font-black text-neutral-900">Waitlist Management</h3>
                  <div className="flex flex-col items-center justify-center h-48 text-center space-y-4">
                     <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-neutral-200" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-xs font-black text-neutral-900">No one on waitlist</p>
                        <p className="text-[10px] text-neutral-slate-400 max-w-[200px]">The event hasn't reached capacity yet. Waitlist will activate automatically when full.</p>
                     </div>
                  </div>
               </div>
            </div>
           </div>
        )}
      </div>
    )}
    </div>
  </div>
</div>
);
};
