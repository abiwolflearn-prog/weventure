import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Building, 
  Calendar, 
  Tag, 
  Clock, 
  Plus, 
  Trash, 
  Globe, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Search,
  CheckCircle,
  HelpCircle,
  ClipboardList,
  Users,
  Award,
  Video,
  MessageSquare,
  MapPin,
  Sliders,
  Settings,
  ArrowRight,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ChevronRight,
  Lightbulb,
  Mail,
  Zap,
  Layout,
  Star,
  Percent,
  BarChart2,
  Tv,
  Phone,
  AppWindow,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { IEvent, EventStatus, EventVisibility, IEventSession, ICustomFormField, IEventModule } from '../../types';

interface EventBuilderDashboardProps {
  initialValues?: Partial<IEvent> | null;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

// 20 Core Modules mapping with metadata
interface ModuleMeta {
  id: string;
  name: string;
  description: string;
  category: 'logistics' | 'promotion' | 'experience' | 'feedback';
  icon: any;
}

const ALL_MODULES_META: ModuleMeta[] = [
  { id: 'registration', name: 'Registration', description: 'Enable RSVP forms and dynamic checkout questions.', category: 'logistics', icon: ClipboardList },
  { id: 'ticketing', name: 'Ticketing', description: 'Configure multiple ticket tiers, pricing, and caps.', category: 'logistics', icon: Tag },
  { id: 'agenda', name: 'Agenda & Tracks', description: 'Design chronological multi-session schedules.', category: 'logistics', icon: Clock },
  { id: 'workspaceBooking', name: 'Workspace Booking', description: 'Coordinate meeting rooms and desk assignments.', category: 'logistics', icon: Building },
  
  { id: 'speakers', name: 'Speakers Hub', description: 'Set up profiles of guest panels and bios.', category: 'promotion', icon: Users },
  { id: 'sponsors', name: 'Sponsors Console', description: 'Showcase support tiers (Gold, Silver, Bronze).', category: 'promotion', icon: Award },
  { id: 'exhibitors', name: 'Exhibitors Registry', description: 'Configure physical or virtual trade booths.', category: 'promotion', icon: Layout },
  { id: 'marketing', name: 'Marketing & SEO', description: 'Configure discount codes and SEO parameters.', category: 'promotion', icon: Percent },
  { id: 'mobileApp', name: 'Companion App', description: 'Push content to the attendee mobile container.', category: 'promotion', icon: Phone },

  { id: 'community', name: 'Community Hub', description: 'Enable group discussions and Welcome guidelines.', category: 'experience', icon: MessageSquare },
  { id: 'networking', name: 'Networking Matcher', description: 'Trigger interests-based match sessions.', category: 'experience', icon: Sliders },
  { id: 'certificates', name: 'Certificates Engine', description: 'Auto-issue PDF diplomas on session exit.', category: 'experience', icon: Award },
  { id: 'photoGallery', name: 'Photo Gallery', description: 'Media feed for past/live photo catalogs.', category: 'experience', icon: ImageIcon },
  { id: 'liveStreaming', name: 'Live Streaming', description: 'Embed RTMP stream players directly in-app.', category: 'experience', icon: Tv },

  { id: 'surveys', name: 'Surveys', description: 'Embed post-event polls and interactive QA.', category: 'feedback', icon: ClipboardList },
  { id: 'feedback', name: 'Feedback Ratings', description: 'Capture star evaluations and review texts.', category: 'feedback', icon: Star },
  { id: 'analytics', name: 'Live Analytics', description: 'SaaS metrics tracking revenue and leads.', category: 'feedback', icon: BarChart2 },
  { id: 'automation', name: 'Email Automation', description: 'Configure scheduled reminder notifications.', category: 'feedback', icon: Mail },
  { id: 'aiAssistant', name: 'AI Gen Assistant', description: 'Smarter agenda builders and customer helpbots.', category: 'feedback', icon: Sparkles },
  { id: 'integrations', name: 'Integrations / Webhooks', description: 'Connect third-party channels like Slack/Zapier.', category: 'feedback', icon: Zap },
];

export const EventBuilderDashboard: React.FC<EventBuilderDashboardProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const isEditMode = !!initialValues?.id;

  // Active navigation tab (for established event dashboard)
  const [activeTab, setActiveTab] = useState<'hub' | 'specs' | 'dashboard'>('hub');
  
  // Wizard flow states (for creation)
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');

  // Search/category filter for module hub
  const [searchQuery, setSearchQuery] = useState('');
  const [hubCategoryFilter, setHubCategoryFilter] = useState<'all' | 'logistics' | 'promotion' | 'experience' | 'feedback'>('all');

  // Interactive Configuration States (Simulating local configuration databases)
  const [modules, setModules] = useState<IEventModule[]>(() => {
    if (initialValues?.modules && initialValues.modules.length > 0) {
      return initialValues.modules;
    }
    // Default fallback
    return ALL_MODULES_META.map(m => ({
      id: m.id,
      enabled: ['registration', 'agenda'].includes(m.id),
      config: m.id === 'ticketing' ? {
        tiers: [
          { name: 'General Admission', price: 0, capacity: 100 },
          { name: 'VIP Pass', price: 99, capacity: 20 }
        ]
      } : m.id === 'speakers' ? {
        speakers: [
          { name: 'Alice Watson', role: 'VP of Product', company: 'Tech Corp', bio: 'AI researcher and author' }
        ]
      } : m.id === 'aiAssistant' ? {
        model: 'gemini-2.5-flash',
        tone: 'professional',
        role: 'Assistant Customer Support Bot'
      } : {}
    }));
  });

  // Active module open for custom configuration drawer
  const [configuringModuleId, setConfiguringModuleId] = useState<string | null>(null);

  // Form initialization using React Hook Form
  const formatForInput = (isoString?: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const tzOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const defaultValues = {
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    category: initialValues?.category || '',
    status: initialValues?.status || EventStatus.DRAFT,
    visibility: initialValues?.visibility || EventVisibility.PUBLIC,
    schedule: {
      startDate: formatForInput(initialValues?.schedule?.startDate),
      endDate: formatForInput(initialValues?.schedule?.endDate),
      timezone: initialValues?.schedule?.timezone || 'UTC',
    },
    capacity: {
      maxCapacity: initialValues?.capacity?.maxCapacity || 100,
      isUnlimited: initialValues?.capacity?.isUnlimited ?? false,
    },
    registrationSettings: {
      registrationOpenDate: formatForInput(initialValues?.registrationSettings?.registrationOpenDate),
      registrationCloseDate: formatForInput(initialValues?.registrationSettings?.registrationCloseDate),
      requiresApproval: initialValues?.registrationSettings?.requiresApproval || false,
      isInviteOnly: initialValues?.registrationSettings?.isInviteOnly || false,
    },
    media: {
      bannerUrl: initialValues?.media?.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200',
      videoUrl: initialValues?.media?.videoUrl || '',
    },
    seo: {
      metaTitle: initialValues?.seo?.metaTitle || '',
      metaDescription: initialValues?.seo?.metaDescription || '',
      metaKeywords: initialValues?.seo?.metaKeywords?.join(', ') || '',
    },
    sessions: (initialValues?.sessions || []).map((s) => ({
      title: s.title,
      description: s.description || '',
      startTime: formatForInput(s.startTime),
      endTime: formatForInput(s.endTime),
      location: s.location || '',
    })),
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const watchIsUnlimited = watch('capacity.isUnlimited');
  const watchTitle = watch('title');

  // Local state for tags
  const [tags, setTags] = useState<string[]>(initialValues?.tags || ['networking', 'innovation']);
  const [tagInput, setTagInput] = useState('');

  // Handle template selection and pre-set modules
  const applyTemplateModules = (template: string) => {
    setSelectedTemplate(template);
    let preEnabled: string[] = ['registration', 'agenda'];

    switch (template) {
      case 'conference':
        preEnabled = ['registration', 'ticketing', 'agenda', 'speakers', 'sponsors', 'exhibitors', 'certificates', 'networking', 'marketing', 'analytics'];
        break;
      case 'webinar':
        preEnabled = ['registration', 'agenda', 'speakers', 'surveys', 'aiAssistant', 'liveStreaming', 'marketing', 'analytics', 'integrations'];
        break;
      case 'workshop':
        preEnabled = ['registration', 'ticketing', 'agenda', 'speakers', 'certificates', 'workspaceBooking', 'feedback', 'analytics'];
        break;
      case 'hackathon':
        preEnabled = ['registration', 'agenda', 'community', 'networking', 'surveys', 'marketing', 'aiAssistant', 'photoGallery', 'integrations'];
        break;
      case 'expo':
        preEnabled = ['registration', 'ticketing', 'agenda', 'sponsors', 'exhibitors', 'workspaceBooking', 'marketing', 'analytics', 'mobileApp', 'integrations'];
        break;
      case 'meetup':
        preEnabled = ['registration', 'agenda', 'workspaceBooking', 'community', 'networking', 'feedback', 'photoGallery'];
        break;
    }

    setModules(prev => prev.map(m => ({
      ...m,
      enabled: preEnabled.includes(m.id)
    })));
  };

  const handleToggleModule = (id: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, enabled: !m.enabled };
      }
      return m;
    }));
  };

  // Specific Module Custom Configurations State Handlers
  const getModuleConfig = (id: string) => {
    return modules.find(m => m.id === id)?.config || {};
  };

  const updateModuleConfig = (id: string, newConfig: Record<string, any>) => {
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, config: { ...m.config, ...newConfig } };
      }
      return m;
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase();
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Submission handler translating UI data to database-friendly ISO format
  const handleFinalSubmit = (formData: typeof defaultValues) => {
    const payload = {
      ...formData,
      tags,
      template: selectedTemplate,
      modules,
      schedule: {
        ...formData.schedule,
        startDate: formData.schedule.startDate ? new Date(formData.schedule.startDate).toISOString() : '',
        endDate: formData.schedule.endDate ? new Date(formData.schedule.endDate).toISOString() : '',
      },
      capacity: {
        maxCapacity: formData.capacity.isUnlimited ? 0 : Number(formData.capacity.maxCapacity),
        isUnlimited: formData.capacity.isUnlimited,
      },
      registrationSettings: {
        ...formData.registrationSettings,
        registrationOpenDate: formData.registrationSettings.registrationOpenDate 
          ? new Date(formData.registrationSettings.registrationOpenDate).toISOString() 
          : undefined,
        registrationCloseDate: formData.registrationSettings.registrationCloseDate 
          ? new Date(formData.registrationSettings.registrationCloseDate).toISOString() 
          : undefined,
      },
      seo: {
        ...formData.seo,
        metaKeywords: formData.seo.metaKeywords
          ? formData.seo.metaKeywords.split(',').map(k => k.trim()).filter(Boolean)
          : [],
      },
      sessions: formData.sessions.map(s => ({
        ...s,
        startTime: s.startTime ? new Date(s.startTime).toISOString() : '',
        endTime: s.endTime ? new Date(s.endTime).toISOString() : '',
      })),
    };
    onSubmit(payload);
  };

  // Filtering module hub
  const filteredModules = ALL_MODULES_META.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = hubCategoryFilter === 'all' || m.category === hubCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeModulesCount = modules.filter(m => m.enabled).length;

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center space-x-3 text-left">
          <button 
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-xl transition text-neutral-slate-400 hover:text-neutral-slate-900 "
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-gray-900">
                {isEditMode ? `Manage: ${initialValues?.title}` : 'Event Builder Wizard'}
              </h1>
              {isEditMode && (
                <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                  Established
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isEditMode 
                ? 'Configure feature toggles, manage module configs, and track performance indicators.' 
                : 'Construct high-volume, professional events with plug-and-play feature modules.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode ? (
            <div className="flex items-center space-x-1 border border-gray-200 bg-[#F9FAFB] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('hub')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'hub' 
                    ? 'bg-brand-primary text-white shadow-xs' 
                    : 'text-neutral-slate-500 hover:text-neutral-slate-800 '
                }`}
              >
                <Sliders className="w-3.5 h-3.5 inline mr-1.5" />
                Feature Toggles
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'specs' 
                    ? 'bg-brand-primary text-white shadow-xs' 
                    : 'text-neutral-slate-500 hover:text-neutral-slate-800 '
                }`}
              >
                <Settings className="w-3.5 h-3.5 inline mr-1.5" />
                Event Specs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-brand-primary text-white shadow-xs' 
                    : 'text-neutral-slate-500 hover:text-neutral-slate-800 '
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 inline mr-1.5" />
                Live Dashboard
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-widest text-neutral-slate-400 bg-[#F3F4F6] px-4 py-2 rounded-full border border-gray-200">
              <span>Step {wizardStep} of 6</span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FLOW A: NEW EVENT MULTI-STEP BUILDER WIZARD */}
      {/* ------------------------------------------------------------- */}
      {!isEditMode && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Left Navigation Steps (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-3 space-y-2">
            {[
              { num: 1, label: 'Select Template' },
              { num: 2, label: 'Core Specs & Details' },
              { num: 3, label: 'Schedule & Timing' },
              { num: 4, label: 'Admission & Capacity' },
              { num: 5, label: 'Feature Toggles' },
              { num: 6, label: 'Review & Build' }
            ].map(s => (
              <div 
                key={s.num}
                className={`flex items-center space-x-3.5 p-3.5 rounded-2xl transition border ${
                  wizardStep === s.num 
                    ? 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary' 
                    : 'border-transparent text-neutral-slate-400'
                }`}
              >
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-extrabold border ${
                  wizardStep === s.num 
                    ? 'bg-brand-primary text-white border-brand-primary' 
                    : 'border-gray-200'
                }`}>
                  {s.num}
                </span>
                <span className="text-xs font-extrabold tracking-wider uppercase">{s.label}</span>
              </div>
            ))}

            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl mt-6">
              <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>Pro Tip</span>
              </h4>
              <p className="text-[11px] text-neutral-slate-500 leading-relaxed mt-1.5 font-medium">
                Selecting a template pre-configures a curated set of our 20 plug-and-play modules so your portal is built instantly.
              </p>
            </div>
          </div>

          {/* Right Form Wizard Panel */}
          <div className="lg:col-span-9 bg-white border border-[#E5E7EB] p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
            
            {/* STEP 1: SELECT EVENT TEMPLATE */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-[#111827]">Choose your Event Template</h3>
                  <p className="text-xs text-[#4B5563] mt-1">Bootstraps modules automatically based on event categories.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'conference', name: 'Conference / Summit', desc: 'Pre-configures Agenda, Speakers, Sponsors, Certifications, Networking, and Ticketing.', pre: 10 },
                    { id: 'webinar', name: 'Virtual Webinar', desc: 'Pre-configures Agenda, Speakers, Interactive Surveys, Live RTMP Streaming, and AI Support.', pre: 9 },
                    { id: 'workshop', name: 'Workshop / Masterclass', desc: 'Pre-configures Agenda, Speakers, Workspace desk booking, Tickets, and Feedbacks.', pre: 8 },
                    { id: 'hackathon', name: 'Hackathon / Contest', desc: 'Pre-configures Agenda, Community, Networking, Surveys, AI tools, and Integrations.', pre: 9 },
                    { id: 'expo', name: 'Expo / Trade Show', desc: 'Pre-configures Tickets, Sponsors, Exhibitors, Booking, Mobile, and Webhooks.', pre: 10 },
                    { id: 'meetup', name: 'Community Meetup', desc: 'Pre-configures Workspace desk booking, Discussions, Networking, and Photo Galleries.', pre: 7 },
                    { id: 'default', name: 'Standard (Blank Slate)', desc: 'Standard simple meetup with Registration and basic Agenda.', pre: 2 },
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => applyTemplateModules(t.id)}
                      className={`p-5 rounded-2xl border text-left space-y-3 transition-all bg-white ${
                        selectedTemplate === t.id 
                          ? 'border-[#2563EB] bg-blue-50/10 shadow-sm' 
                          : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-display font-bold text-sm text-[#111827]">
                          {t.name}
                        </span>
                        {selectedTemplate === t.id && (
                          <CheckCircle className="w-5 h-5 text-[#2563EB] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed font-medium">
                        {t.desc}
                      </p>
                      <div className="pt-2">
                        <span className="inline-block text-[10px] bg-[#2563EB]/10 text-[#2563EB] font-mono font-bold px-2.5 py-0.5 rounded-full">
                          {t.pre} active modules Curated
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="text-xs font-bold px-6 bg-brand-primary"
                  >
                    <span>Proceed to Specs</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: CORE SPECS & DETAILS */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-gray-900">Core Specifications</h3>
                  <p className="text-xs text-neutral-slate-400 mt-1">Provide basic metadata regarding this brand-new meetup slot.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Event Title"
                    placeholder="e.g. Next-Gen Enterprise Tech Summit"
                    error={errors.title?.message}
                    {...register('title', { required: 'Event title is required', minLength: { value: 3, message: 'Minimum 3 chars' } })}
                  />
                  <Input
                    label="Vertical / Category"
                    placeholder="e.g. Artificial Intelligence, SaaS, Web3"
                    error={errors.category?.message}
                    {...register('category', { required: 'Category is required' })}
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Comprehensive Description
                  </label>
                  <textarea
                    placeholder="Provide a detailed outline of WeVentureHub's upcoming meetup, speaking sessions, panels..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 border-gray-200 focus:border-brand-primary outline-none"
                    {...register('description', { required: 'Description is required' })}
                  />
                  {errors.description && (
                    <span className="text-xs text-rose-500">{errors.description.message}</span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Search keywords / Tag pills
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 bg-[#F3F4F6] border border-gray-200 rounded-lg min-h-11">
                    {tags.map((tag, i) => (
                      <span key={tag} className="inline-flex items-center bg-brand-primary/10 text-brand-primary text-xs font-bold px-2.5 py-1 rounded-full space-x-1">
                        <span>{tag}</span>
                        <button type="button" onClick={() => handleRemoveTag(i)} className="hover:text-rose-500 font-bold">
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Type tag and hit Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="flex-grow bg-transparent border-none text-xs outline-none px-2 min-w-[150px] dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="secondary" onClick={() => setWizardStep(1)} className="text-xs font-bold">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!watchTitle) {
                        alert('Please fill out the Event Title.');
                        return;
                      }
                      setWizardStep(3);
                    }}
                    className="text-xs font-bold px-6 bg-brand-primary"
                  >
                    <span>Proceed to Schedule</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: SCHEDULE & TIMING */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-gray-900">Schedule Matrix</h3>
                  <p className="text-xs text-neutral-slate-400 mt-1">Specify target dates, hours, and timezone parameters.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Event Opens"
                    type="datetime-local"
                    {...register('schedule.startDate', { required: 'Start time is required' })}
                  />
                  <Input
                    label="Event Closes"
                    type="datetime-local"
                    {...register('schedule.endDate', { required: 'End time is required' })}
                  />
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Timezone context
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 border-gray-200 outline-none"
                      {...register('schedule.timezone')}
                    >
                      <option value="UTC">UTC (Universal Coordinated)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="secondary" onClick={() => setWizardStep(2)} className="text-xs font-bold">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setWizardStep(4)}
                    className="text-xs font-bold px-6 bg-brand-primary"
                  >
                    <span>Proceed to Capacity</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: ADMISSION & CAPACITY */}
            {wizardStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-gray-900">Admission & Seat Limits</h3>
                  <p className="text-xs text-neutral-slate-400 mt-1">Restrict guest admissions or toggle unlimited RSVP spaces.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Capacity Allocation */}
                  <div className="space-y-4 bg-[#F9FAFB] p-6 rounded-2xl border border-gray-200">
                    <h4 className="font-display font-bold text-sm text-gray-900">Seat Capacity</h4>
                    <div className="flex items-center space-x-3 py-1">
                      <input
                        id="isUnlimited"
                        type="checkbox"
                        className="rounded text-brand-primary border-neutral-slate-300"
                        {...register('capacity.isUnlimited')}
                      />
                      <label htmlFor="isUnlimited" className="text-xs font-bold text-gray-600 uppercase select-none">
                        Unlimited Admissions
                      </label>
                    </div>

                    {!watchIsUnlimited && (
                      <Input
                        label="Maximum Admissions Cap"
                        type="number"
                        {...register('capacity.maxCapacity')}
                      />
                    )}
                  </div>

                  {/* Operational Approval */}
                  <div className="space-y-4 bg-[#F9FAFB] p-6 rounded-2xl border border-gray-200">
                    <h4 className="font-display font-bold text-sm text-gray-900">Admissions Policy</h4>
                    
                    <div className="flex items-center space-x-3 py-1">
                      <input
                        id="requiresApproval"
                        type="checkbox"
                        className="rounded text-brand-primary border-neutral-slate-300"
                        {...register('registrationSettings.requiresApproval')}
                      />
                      <label htmlFor="requiresApproval" className="text-xs font-bold text-gray-600 uppercase select-none">
                        Requires Staff Approval
                      </label>
                    </div>

                    <div className="flex items-center space-x-3 py-1">
                      <input
                        id="isInviteOnly"
                        type="checkbox"
                        className="rounded text-brand-primary border-neutral-slate-300"
                        {...register('registrationSettings.isInviteOnly')}
                      />
                      <label htmlFor="isInviteOnly" className="text-xs font-bold text-gray-600 uppercase select-none">
                        Invite-Only event
                      </label>
                    </div>
                  </div>

                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="secondary" onClick={() => setWizardStep(3)} className="text-xs font-bold">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setWizardStep(5)}
                    className="text-xs font-bold px-6 bg-brand-primary"
                  >
                    <span>Proceed to Feature Toggles</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: FEATURE TOGGLES (WIZARD VERSION) */}
            {wizardStep === 5 && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-gray-900">
                      Toggle Feature Modules
                    </h3>
                    <p className="text-xs text-neutral-slate-400 mt-1">
                      Bootstrapped with <b>{selectedTemplate}</b> template. Customize which of our 20 plug-and-play modules are pre-enabled.
                    </p>
                  </div>
                  <div className="text-xs font-extrabold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3.5 py-1.5 rounded-full">
                    {activeModulesCount} of 20 Enabled
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-2">
                  {ALL_MODULES_META.map(m => {
                    const isEnabled = modules.find(mod => mod.id === m.id)?.enabled;
                    const ModuleIcon = m.icon;
                    return (
                      <div 
                        key={m.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-colors ${
                          isEnabled 
                            ? 'bg-emerald-500/[0.02] border-emerald-500/25' 
                            : 'bg-neutral-slate-50/40 bg-white/10 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3 text-left">
                          <span className={`w-9 h-9 flex items-center justify-center rounded-xl ${
                            isEnabled 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-[#F3F4F6] text-neutral-slate-400'
                          }`}>
                            <ModuleIcon className="w-5 h-5" />
                          </span>
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-neutral-slate-400 leading-snug font-medium block">
                              {m.description}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleModule(m.id)}
                          className="shrink-0 outline-none text-neutral-slate-400 hover:text-brand-primary"
                        >
                          {isEnabled ? (
                            <ToggleRight className="w-9 h-9 text-emerald-500 shrink-0" />
                          ) : (
                            <ToggleLeft className="w-9 h-9 text-neutral-slate-300 dark:text-neutral-slate-700 shrink-0" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="secondary" onClick={() => setWizardStep(4)} className="text-xs font-bold">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setWizardStep(6)}
                    className="text-xs font-bold px-6 bg-brand-primary"
                  >
                    <span>Proceed to Review</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 6: REVIEW & ESTABLISH */}
            {wizardStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-gray-900">Review & Establish Event</h3>
                  <p className="text-xs text-neutral-slate-400 mt-1">Review all configured matrices before committing to the database.</p>
                </div>

                <div className="bg-[#F9FAFB] p-6 rounded-2xl border border-gray-200 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Event Title</span>
                      <span className="font-bold text-gray-900 mt-1 block">{watchTitle || 'Untitled Event'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Event Template</span>
                      <span className="font-mono bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-md font-bold uppercase mt-1 inline-block">
                        {selectedTemplate}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Admissions limits</span>
                      <span className="font-semibold text-gray-800 block">
                        {watchIsUnlimited ? 'Unlimited Attendance' : 'Restricted seats capacity'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Active modules</span>
                      <span className="font-semibold text-brand-primary block">{activeModulesCount} Curated Core Modules</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <h5 className="font-bold text-emerald-800 dark:text-emerald-400">Enterprise Ready Configuration</h5>
                    <p className="text-neutral-slate-500 mt-1 font-medium leading-relaxed">
                      All event parameters, RSVP channels, and multi-tenant security measures conform to enterprise tenant standards.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="secondary" onClick={() => setWizardStep(5)} className="text-xs font-bold">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit(handleFinalSubmit)}
                    isLoading={isLoading}
                    className="text-xs font-bold px-8 bg-brand-primary"
                  >
                    <span>Establish Modular Event</span>
                  </Button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLOW B: ESTABLISHED EVENT MANAGEMENT / SETTINGS CENTER */}
      {/* ------------------------------------------------------------- */}
      {isEditMode && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* TAB 1: FEATURE TOGGLE HUB (ALL 20 PLUG-AND-PLAY MODULES) */}
          {activeTab === 'hub' && (
            <div className="lg:col-span-12 space-y-6">
              
              {/* Filter and stats row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F9FAFB]/50 p-4 rounded-3xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'All Modules' },
                    { id: 'logistics', label: 'Logistics' },
                    { id: 'promotion', label: 'Promotion' },
                    { id: 'experience', label: 'Experience' },
                    { id: 'feedback', label: 'Feedback & Analytics' },
                  ].map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setHubCategoryFilter(c.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        hubCategoryFilter === c.id 
                          ? 'bg-brand-primary text-white shadow-xs' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-neutral-slate-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-gray-200 shadow-sm rounded-xl outline-none"
                  />
                  <Search className="absolute left-3 top-2.5 text-neutral-slate-400 w-4 h-4" />
                </div>
              </div>

              {/* Grid of Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredModules.map(m => {
                  const moduleState = modules.find(mod => mod.id === m.id);
                  const isEnabled = moduleState?.enabled;
                  const ModuleIcon = m.icon;

                  return (
                    <div 
                      key={m.id}
                      className={`bg-white rounded-3xl border p-5 space-y-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm ${
                        isEnabled 
                          ? 'border-emerald-500/25 bg-emerald-500/[0.01]' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`w-10 h-10 flex items-center justify-center rounded-2xl ${
                            isEnabled 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-[#F3F4F6] text-neutral-slate-400'
                          }`}>
                            <ModuleIcon className="w-5.5 h-5.5" />
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleModule(m.id)}
                            className="outline-none text-neutral-slate-400 hover:text-brand-primary"
                          >
                            {isEnabled ? (
                              <ToggleRight className="w-9 h-9 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-9 h-9 text-neutral-slate-300 dark:text-neutral-slate-700" />
                            )}
                          </button>
                        </div>

                        <div className="text-left">
                          <h4 className="font-display font-extrabold text-sm text-gray-900">
                            {m.name}
                          </h4>
                          <p className="text-[11px] text-neutral-slate-400 mt-1 leading-snug font-medium min-h-[34px]">
                            {m.description}
                          </p>
                        </div>
                      </div>

                      {/* Config Button Drawer Trigger */}
                      <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          isEnabled 
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-[#F3F4F6] text-neutral-slate-400'
                        }`}>
                          {isEnabled ? 'Active Module' : 'Disabled'}
                        </span>

                        {isEnabled && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfiguringModuleId(m.id)}
                            className="text-[11px] h-7 font-bold px-3 rounded-lg border border-neutral-slate-200"
                          >
                            <Settings className="w-3 h-3 mr-1 text-neutral-slate-400" />
                            <span>Configure</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Back console */}
              <div className="flex justify-end pt-4 gap-3 border-t border-gray-200">
                <Button variant="secondary" onClick={onCancel} className="text-xs font-bold">Cancel</Button>
                <Button 
                  type="button" 
                  onClick={handleSubmit(handleFinalSubmit)}
                  isLoading={isLoading} 
                  className="text-xs font-bold px-8 bg-brand-primary"
                >
                  Save Active Configurations
                </Button>
              </div>

            </div>
          )}

          {/* TAB 2: GENERAL EVENT SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div className="lg:col-span-12 bg-white border border-gray-200 shadow-sm p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
              <div className="border-b pb-3 border-gray-200">
                <h3 className="font-display font-extrabold text-base">General Specifications Settings</h3>
                <p className="text-xs text-neutral-slate-400 mt-1">Configure physical attributes, dates, descriptions, and metadata.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Event Title"
                  error={errors.title?.message}
                  {...register('title', { required: 'Event title is required' })}
                />
                <Input
                  label="Vertical / Category"
                  error={errors.category?.message}
                  {...register('category', { required: 'Category is required' })}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Detailed Description
                </label>
                <textarea
                  placeholder="Event detailed outline..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 border-gray-200 outline-none focus:border-brand-primary"
                  {...register('description', { required: 'Description is required' })}
                />
              </div>

              {/* Scheduling & capacity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <Input
                  label="Start Date"
                  type="datetime-local"
                  {...register('schedule.startDate')}
                />
                <Input
                  label="End Date"
                  type="datetime-local"
                  {...register('schedule.endDate')}
                />
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Target Timezone
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 border-gray-200 outline-none"
                    {...register('schedule.timezone')}
                  >
                    <option value="UTC">UTC (Universal Coordinated)</option>
                    <option value="America/New_York">EST (America/New_York)</option>
                    <option value="America/Los_Angeles">PST (America/Los_Angeles)</option>
                  </select>
                </div>
              </div>

              {/* Status and visibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status Pipeline
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 border-gray-200 outline-none"
                    {...register('status')}
                  >
                    <option value={EventStatus.DRAFT}>Draft Sandbox</option>
                    <option value={EventStatus.PUBLISHED}>Published & Live</option>
                    <option value={EventStatus.CANCELLED}>Cancelled</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Visibility Control
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 border-gray-200 outline-none"
                    {...register('visibility')}
                  >
                    <option value={EventVisibility.PUBLIC}>Public Catalog</option>
                    <option value={EventVisibility.PRIVATE}>Private (Members-only)</option>
                    <option value={EventVisibility.UNLISTED}>Unlisted (Direct Link)</option>
                  </select>
                </div>
              </div>

              {/* Button console */}
              <div className="flex justify-end pt-4 gap-3">
                <Button variant="secondary" onClick={onCancel} className="text-xs font-bold">Cancel</Button>
                <Button 
                  type="button" 
                  onClick={handleSubmit(handleFinalSubmit)}
                  isLoading={isLoading} 
                  className="text-xs font-bold px-8 bg-brand-primary"
                >
                  Save Core Specifications
                </Button>
              </div>

            </div>
          )}

          {/* TAB 3: DYNAMIC DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="lg:col-span-12 space-y-6">
              
              {/* Analytics Top Row cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-neutral-slate-200 p-5 rounded-3xl space-y-1 shadow-xs text-left">
                  <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Registrations</span>
                  <p className="font-display font-extrabold text-2xl text-gray-900">47 Admissions</p>
                  <span className="text-[10px] text-emerald-600 font-bold block">+12% this week</span>
                </div>
                <div className="bg-white border border-neutral-slate-200 p-5 rounded-3xl space-y-1 shadow-xs text-left">
                  <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Ticketing Revenue</span>
                  <p className="font-display font-extrabold text-2xl text-brand-primary">$3,490.00</p>
                  <span className="text-[10px] text-emerald-600 font-bold block">88% of target sold</span>
                </div>
                <div className="bg-white border border-neutral-slate-200 p-5 rounded-3xl space-y-1 shadow-xs text-left">
                  <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Workspace Bookings</span>
                  <p className="font-display font-extrabold text-2xl text-gray-900">4 Rooms Synced</p>
                  <span className="text-[10px] text-neutral-slate-500 block">Tesla Auditorium assigned</span>
                </div>
                <div className="bg-white border border-neutral-slate-200 p-5 rounded-3xl space-y-1 shadow-xs text-left">
                  <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">AI Conversational Leads</span>
                  <p className="font-display font-extrabold text-2xl text-gray-900">134 Sessions</p>
                  <span className="text-[10px] text-emerald-600 font-bold block">94% response helpfulness</span>
                </div>
              </div>

              {/* Telemetry charts simulation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Live Event Activity Feed */}
                <div className="bg-white border border-neutral-slate-200 p-6 rounded-3xl space-y-4 shadow-xs text-left">
                  <h3 className="font-display font-extrabold text-sm text-gray-900">Operational Activity Timeline</h3>
                  <div className="space-y-4">
                    {[
                      { time: '10 mins ago', desc: 'Alice Watson successfully added general slides deck for Keynote Panel.', op: 'Speakers Module' },
                      { time: '1 hour ago', desc: 'Mailchimp automation synced 12 pending invite-only leads.', op: 'Integrations / Webhooks' },
                      { time: '3 hours ago', desc: 'Discount code "SUMMIT20" updated to 20% off general admission.', op: 'Marketing Module' },
                      { time: '1 day ago', desc: 'Sponsor tier "Gold Sponsor" linked to Google Cloud Platform logo.', op: 'Sponsors Console' },
                    ].map((act, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <div className="pt-0.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-brand-primary inline-block" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-800 font-medium">{act.desc}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-neutral-slate-400 font-bold">
                            <span className="uppercase">{act.op}</span>
                            <span>•</span>
                            <span>{act.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engagement telemetry */}
                <div className="bg-white border border-neutral-slate-200 p-6 rounded-3xl space-y-4 shadow-xs text-left flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-display font-extrabold text-sm text-gray-900">Module Integration Health</h3>
                    <p className="text-xs text-neutral-slate-400">Telemetry tracking sync health of your active modular connections.</p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {[
                      { name: 'Admissions Checkout Pipeline', health: 100, label: 'Optimal' },
                      { name: 'Companion IOS/Android Shell App', health: 95, label: 'Optimal' },
                      { name: 'Live Video Broadcast (RTMP)', health: 80, label: 'Fair' },
                      { name: 'SaaS Analytics Synchronization', health: 100, label: 'Optimal' },
                    ].map((t, i) => (
                      <div key={i} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-gray-800">
                          <span>{t.name}</span>
                          <span className={t.health === 100 ? 'text-emerald-500' : 'text-amber-500'}>{t.label}</span>
                        </div>
                        <div className="w-full bg-[#F3F4F6] h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${t.health === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${t.health}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-slate-400">
                    ● CORE CLOUD SYSTEMS ONLINE
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLOW C: DYNAMIC DRAWER FOR SPECIFIC MODULE CONFIGURATION */}
      {/* ------------------------------------------------------------- */}
      {configuringModuleId && (() => {
        const moduleMeta = ALL_MODULES_META.find(m => m.id === configuringModuleId);
        if (!moduleMeta) return null;
        const config = getModuleConfig(configuringModuleId);

        return (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-neutral-slate-950/45 backdrop-blur-xs transition-opacity" onClick={() => setConfiguringModuleId(null)} />
            
            <div className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-2xl overflow-y-auto">
              
              {/* Drawer Header */}
              <div className="p-6 bg-[#F9FAFB] border-b border-gray-200 flex justify-between items-center text-left">
                <div className="flex items-center space-x-3">
                  <span className="w-10 h-10 bg-brand-primary/10 text-brand-primary flex items-center justify-center rounded-xl">
                    {React.createElement(moduleMeta.icon, { className: 'w-5 h-5' })}
                  </span>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-gray-900">
                      Configure: {moduleMeta.name}
                    </h3>
                    <p className="text-[11px] text-neutral-slate-400 mt-0.5">Plug-and-play config settings manager.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfiguringModuleId(null)}
                  className="text-neutral-slate-400 hover:text-neutral-900  text-xl font-black p-2"
                >
                  &times;
                </button>
              </div>

              {/* Drawer Config Body */}
              <div className="flex-1 p-6 space-y-6 text-left">
                
                {/* 1. REGISTRATION MODULE CONFIGS */}
                {configuringModuleId === 'registration' && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase text-neutral-slate-400 tracking-wider">Registration Policy Settings</span>
                    <div className="flex items-center space-x-3 py-2">
                      <input
                        id="drawerApproval"
                        type="checkbox"
                        className="rounded text-brand-primary"
                        checked={initialValues?.registrationSettings?.requiresApproval || false}
                        onChange={(e) => {}}
                        disabled
                      />
                      <label htmlFor="drawerApproval" className="text-xs font-bold text-neutral-slate-600 uppercase">
                        Requires Staff manual approval (Enabled in Specs)
                      </label>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border text-xs text-neutral-slate-500 leading-relaxed font-medium">
                      This module captures first names, last names, emails, and triggers the workspace check-in QR codes automatically. To design extra custom questions, use the registration form designer inside the specifications tab.
                    </div>
                  </div>
                )}

                {/* 2. TICKETING MODULE CONFIGS */}
                {configuringModuleId === 'ticketing' && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase text-neutral-slate-400 tracking-wider">Manage Pricing Tiers</span>
                    <div className="space-y-3">
                      {(config.tiers || []).map((tier: any, i: number) => (
                        <div key={i} className="p-4 bg-[#F9FAFB] border rounded-2xl text-xs space-y-2">
                          <div className="flex justify-between font-bold">
                            <span>{tier.name}</span>
                            <span className="text-brand-primary">${tier.price}.00</span>
                          </div>
                          <div className="text-neutral-slate-400 font-medium">
                            Allocation Cap: {tier.capacity} general passes
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-xs h-9 w-full font-bold"
                      onClick={() => alert('New ticket tiers are handled via the Ticketing Workspace dashboard.')}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Custom Ticket Tier
                    </Button>
                  </div>
                )}

                {/* 3. AGENDA CONFIGS */}
                {configuringModuleId === 'agenda' && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase text-neutral-slate-400 tracking-wider">Chronological Schedule Tracks</span>
                    <p className="text-xs text-neutral-slate-400 leading-relaxed">
                      Define multi-session chronological blocks (Tesla Boardroom, Auditorium B) which Attendees see in real time. Customize inside the Event Specs tab.
                    </p>
                  </div>
                )}

                {/* 4. SPEAKERS CONFIGS */}
                {configuringModuleId === 'speakers' && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase text-neutral-slate-400 tracking-wider font-extrabold block">Guest Speakers Directory</span>
                    
                    {(config.speakers || []).map((sp: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#F9FAFB] border rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-gray-900 block">{sp.name}</span>
                          <span className="text-neutral-slate-400 block font-medium">{sp.role} at {sp.company}</span>
                        </div>
                        <button
                          type="button"
                          className="text-neutral-slate-400 hover:text-rose-500 font-bold"
                          onClick={() => {
                            const remaining = (config.speakers || []).filter((_: any, sIdx: number) => sIdx !== idx);
                            updateModuleConfig('speakers', { speakers: remaining });
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}

                    <div className="border-t pt-4 space-y-3">
                      <Input id="speakerName" label="Speaker Full Name" placeholder="e.g. Dr. Emily Johnson" />
                      <Input id="speakerRole" label="Role / Title" placeholder="e.g. Lead AI Specialist" />
                      <Input id="speakerCompany" label="Company" placeholder="e.g. OpenAI Inc" />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="w-full text-xs font-bold bg-brand-primary"
                        onClick={() => {
                          const name = (document.getElementById('speakerName') as HTMLInputElement)?.value;
                          const role = (document.getElementById('speakerRole') as HTMLInputElement)?.value;
                          const company = (document.getElementById('speakerCompany') as HTMLInputElement)?.value;
                          if (!name || !role) {
                            alert('Speaker Name and Role are required.');
                            return;
                          }
                          const existing = config.speakers || [];
                          updateModuleConfig('speakers', { speakers: [...existing, { name, role, company, bio: '' }] });
                          (document.getElementById('speakerName') as HTMLInputElement).value = '';
                          (document.getElementById('speakerRole') as HTMLInputElement).value = '';
                          (document.getElementById('speakerCompany') as HTMLInputElement).value = '';
                        }}
                      >
                        Add Speaker
                      </Button>
                    </div>
                  </div>
                )}

                {/* 5. AI ASSISTANT CONFIGS */}
                {configuringModuleId === 'aiAssistant' && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase text-neutral-slate-400 tracking-wider font-extrabold block">AI Assistant Configuration</span>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-neutral-slate-500 uppercase">Target Gemini Engine</label>
                      <select
                        value={config.model || 'gemini-2.5-flash'}
                        onChange={(e) => updateModuleConfig('aiAssistant', { model: e.target.value })}
                        className="w-full text-xs px-3 py-2.5 bg-[#F3F4F6] border rounded-lg outline-none"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Sub-second response speed)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Extreme high-quality reasoning)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-neutral-slate-500 uppercase">System Persona</label>
                      <select
                        value={config.role || 'Assistant Customer Support Bot'}
                        onChange={(e) => updateModuleConfig('aiAssistant', { role: e.target.value })}
                        className="w-full text-xs px-3 py-2.5 bg-[#F3F4F6] border rounded-lg outline-none"
                      >
                        <option value="Assistant Customer Support Bot">Interactive Attendee Support Guide</option>
                        <option value="Content Summary Generator">Keynote Transcriber & Summarizer</option>
                        <option value="Networking Matchmaker">AI-Powered Contact Recommender</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* GENERAL FALLBACK FOR PLUG AND PLAY MODULES CONFIG */}
                {!['registration', 'ticketing', 'agenda', 'speakers', 'aiAssistant'].includes(configuringModuleId) && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-bold uppercase text-neutral-slate-400 tracking-wider font-extrabold block">Module Configurations</span>
                    
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start space-x-2.5">
                      <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                      <div className="text-xs">
                        <h5 className="font-bold text-amber-800 dark:text-amber-500">Live Dynamic Playgrounds</h5>
                        <p className="text-neutral-slate-500 leading-relaxed mt-1 font-medium">
                          The configurations for <b>{moduleMeta.name}</b> are synced directly inside this multi-tenant workspace isolation container. 
                        </p>
                      </div>
                    </div>

                    <Input
                      label="Integration Hub API Webhook URL"
                      placeholder="https://hooks.zapier.com/..."
                      value={config.webhookUrl || ''}
                      onChange={(e) => updateModuleConfig(configuringModuleId, { webhookUrl: e.target.value })}
                    />

                    <div className="flex items-center space-x-3 pt-2">
                      <input
                        id="generalSandbox"
                        type="checkbox"
                        checked={config.sandboxMode ?? true}
                        onChange={(e) => updateModuleConfig(configuringModuleId, { sandboxMode: e.target.checked })}
                        className="rounded text-brand-primary"
                      />
                      <label htmlFor="generalSandbox" className="text-xs font-bold text-neutral-slate-500 uppercase tracking-wider select-none">
                        Enable Operations Sandbox logs
                      </label>
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Footer */}
              <div className="p-6 bg-[#F9FAFB] border-t border-gray-200 flex justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setConfiguringModuleId(null)}
                  className="text-xs font-bold px-6 bg-brand-primary"
                >
                  Save configuration
                </Button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
