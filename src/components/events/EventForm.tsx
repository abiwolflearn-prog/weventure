import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
  Image, 
  Search,
  CheckCircle,
  HelpCircle,
  FolderPlus,
  Users,
  ClipboardList,
  UploadCloud,
  X
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { IEvent, EventStatus, EventVisibility, IEventSession, ICustomFormField } from '../../types';

interface EventFormProps {
  initialValues?: Partial<IEvent>;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const isEdit = !!initialValues?.id;
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'capacity' | 'agenda' | 'seo' | 'media' | 'formDesigner'>('basic');

  // Convert Date strings to datetime-local friendly format (YYYY-MM-DDThh:mm)
  const formatForInput = (isoString?: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      return localISOTime;
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
      maxCapacity: initialValues?.capacity?.maxCapacity || 50,
      isUnlimited: initialValues?.capacity?.isUnlimited ?? false,
    },
    registrationSettings: {
      registrationOpenDate: formatForInput(initialValues?.registrationSettings?.registrationOpenDate),
      registrationCloseDate: formatForInput(initialValues?.registrationSettings?.registrationCloseDate),
      requiresApproval: initialValues?.registrationSettings?.requiresApproval || false,
      isInviteOnly: initialValues?.registrationSettings?.isInviteOnly || false,
    },
    media: {
      bannerUrl: initialValues?.media?.bannerUrl || '',
      videoUrl: initialValues?.media?.videoUrl || '',
    },
    seo: {
      metaTitle: initialValues?.seo?.metaTitle || '',
      metaDescription: initialValues?.seo?.metaDescription || '',
      metaKeywords: initialValues?.seo?.metaKeywords?.join(', ') || '',
    },
    sessions: (initialValues?.sessions || []).map((session) => ({
      title: session.title,
      description: session.description || '',
      startTime: formatForInput(session.startTime),
      endTime: formatForInput(session.endTime),
      location: session.location || '',
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sessions',
  });

  const watchIsUnlimited = watch('capacity.isUnlimited');
  const watchTags = watch('title'); // dummy, used for rendering or watching other values if needed
  const watchBannerUrl = watch('media.bannerUrl');

  const [eventDragActive, setEventDragActive] = useState(false);

  const handleEventDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setEventDragActive(true);
    } else if (e.type === "dragleave") {
      setEventDragActive(false);
    }
  };

  const handleEventDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEventDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleEventImageFile(file);
    }
  };

  const handleEventFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleEventImageFile(file);
    }
  };

  const handleEventImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, or WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setValue('media.bannerUrl', reader.result as string);
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  // Tag list management state
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);

  // Free RSVP Mode State
  const [isFreeRsvp, setIsFreeRsvp] = useState<boolean>(initialValues?.isFreeRsvp || false);
  const [rsvpFormFields, setRsvpFormFields] = useState<any[]>(
    initialValues?.rsvpFormFields && initialValues.rsvpFormFields.length > 0
      ? initialValues.rsvpFormFields
      : [
          { id: 'f_name', type: 'text', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
          { id: 'f_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
          { id: 'f_phone', type: 'phone', label: 'Phone Number', required: false, placeholder: 'Enter your phone number' },
          { id: 'f_company', type: 'text', label: 'Company / Organization', required: false, placeholder: 'Enter your company name' },
          { id: 'f_guest_count', type: 'number', label: 'Guest Count', required: false, placeholder: 'Number of extra guests (including yourself)' }
        ]
  );
  const [rsvpFormAppearance, setRsvpFormAppearance] = useState<any>(
    initialValues?.rsvpFormAppearance || {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      buttonColor: '#84cc16',
      cardStyle: 'shadowed',
      borderRadius: 12,
      thankYouMessage: 'Thank you for RSVPing! Your digital ticket is on its way.'
    }
  );

  const [rsvpSubTab, setRsvpSubTab] = useState<'fields' | 'appearance'>('fields');
  const [rsvpFieldLabel, setRsvpFieldLabel] = useState('');
  const [rsvpFieldType, setRsvpFieldType] = useState<any>('text');
  const [rsvpFieldRequired, setRsvpFieldRequired] = useState(false);
  const [rsvpFieldPlaceholder, setRsvpFieldPlaceholder] = useState('');
  const [rsvpFieldOptions, setRsvpFieldOptions] = useState('');

  const handleAddRsvpField = () => {
    if (!rsvpFieldLabel.trim()) {
      alert('Please enter a descriptive field label.');
      return;
    }
    const newField = {
      id: 'rsvp_' + Math.random().toString(36).substr(2, 9),
      type: rsvpFieldType,
      label: rsvpFieldLabel.trim(),
      required: rsvpFieldRequired,
      placeholder: rsvpFieldPlaceholder.trim(),
      options: ['dropdown', 'radio', 'multiselect'].includes(rsvpFieldType) && rsvpFieldOptions.trim()
        ? rsvpFieldOptions.split(',').map(o => o.trim()).filter(Boolean)
        : undefined
    };
    setRsvpFormFields([...rsvpFormFields, newField]);
    setRsvpFieldLabel('');
    setRsvpFieldPlaceholder('');
    setRsvpFieldOptions('');
    setRsvpFieldRequired(false);
  };

  const handleRemoveRsvpField = (id: string) => {
    setRsvpFormFields(rsvpFormFields.filter(f => f.id !== id));
  };

  const handleReorderRsvpField = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= rsvpFormFields.length) return;
    const reordered = [...rsvpFormFields];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;
    setRsvpFormFields(reordered);
  };

  const handleUpdateRsvpFieldInline = (id: string, key: string, value: any) => {
    setRsvpFormFields(rsvpFormFields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  // Custom Form Fields Designer States
  const [customFormFields, setCustomFormFields] = useState<ICustomFormField[]>(
    initialValues?.registrationSettings?.customFormFields || []
  );
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'email' | 'checkbox' | 'select' | 'file'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldConditional, setNewFieldConditional] = useState(false);
  const [newFieldCondId, setNewFieldCondId] = useState('');
  const [newFieldCondVal, setNewFieldCondVal] = useState('');

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) {
      alert('Please enter a descriptive field label.');
      return;
    }
    const fieldId = 'field_' + Math.random().toString(36).substr(2, 9);
    const options = ['select'].includes(newFieldType) && newFieldOptions.trim()
      ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean)
      : undefined;

    const field: ICustomFormField = {
      id: fieldId,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options,
      conditionalShow: newFieldConditional && newFieldCondId && newFieldCondVal
        ? { fieldId: newFieldCondId, value: newFieldCondVal }
        : undefined
    };

    setCustomFormFields([...customFormFields, field]);
    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldRequired(false);
    setNewFieldConditional(false);
    setNewFieldCondId('');
    setNewFieldCondVal('');
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFormFields(customFormFields.filter((f) => f.id !== id));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase();
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  const onFormSubmit = (data: typeof defaultValues) => {
    // Process input times back into ISO format
    const isoPayload = {
      ...data,
      tags,
      isFreeRsvp,
      rsvpFormFields,
      rsvpFormAppearance,
      schedule: {
        ...data?.schedule,
        startDate: data?.schedule?.startDate ? new Date(data.schedule.startDate).toISOString() : '',
        endDate: data?.schedule?.endDate ? new Date(data.schedule.endDate).toISOString() : '',
      },
      capacity: {
        maxCapacity: data?.capacity?.isUnlimited ? 0 : Number(data?.capacity?.maxCapacity || 0),
        isUnlimited: !!data?.capacity?.isUnlimited,
      },
      registrationSettings: {
        ...data?.registrationSettings,
        customFormFields,
        registrationOpenDate: data?.registrationSettings?.registrationOpenDate 
          ? new Date(data.registrationSettings.registrationOpenDate).toISOString() 
          : undefined,
        registrationCloseDate: data?.registrationSettings?.registrationCloseDate 
          ? new Date(data.registrationSettings.registrationCloseDate).toISOString() 
          : undefined,
      },
      seo: {
        ...data?.seo,
        metaKeywords: data?.seo?.metaKeywords
          ? data.seo.metaKeywords.split(',').map((kw) => kw.trim()).filter(Boolean)
          : [],
      },
      sessions: data.sessions.map((session) => ({
        ...session,
        startTime: session.startTime ? new Date(session.startTime).toISOString() : '',
        endTime: session.endTime ? new Date(session.endTime).toISOString() : '',
      })),
    };

    onSubmit(isoPayload);
  };

  const tabs: { id: typeof activeTab; name: string; icon: any }[] = [
    { id: 'basic', name: 'Basic Info & Dates', icon: FileText },
    { id: 'capacity', name: 'Capacity & RSVP', icon: Users },
    { id: 'formDesigner', name: isFreeRsvp ? 'RSVP Form & Design Builder' : 'Registration Form Designer', icon: ClipboardList },
    { id: 'agenda', name: 'Sessions Agenda', icon: Clock },
    { id: 'media', name: 'Event Media', icon: Image },
    { id: 'seo', name: 'SEO Specs', icon: Sparkles },
  ];

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      
      {/* Tab Header Selector */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none scroll-smooth">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors duration-150 ${
                isActive 
                  ? 'border-brand-primary text-brand-primary font-bold' 
                  : 'border-transparent text-neutral-slate-400 hover:text-neutral-slate-700 dark:hover:text-neutral-slate-200'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents Frame */}
      <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
        
        {/* TAB 1: BASIC INFORMATION & DATES */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Event Title"
                placeholder="e.g. Generative AI Dev Panel"
                error={errors.title?.message}
                {...register('title', { required: 'Event title is strictly required', minLength: { value: 3, message: 'Must be at least 3 characters' } })}
              />
              <Input
                label="Category / Vertical"
                placeholder="e.g. Technology, Incubation, Design"
                error={errors.category?.message}
                {...register('category', { required: 'Category is required' })}
              />
            </div>

            {/* Description Textarea */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Detailed Event Description
              </label>
              <textarea
                placeholder="Provide a comprehensive breakdown of WeVentureHub's upcoming meetup, speaking sessions, panels, and networking tracks..."
                rows={5}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-brand-primary/10 ${
                  errors.description ? 'border-rose-500 focus:border-rose-500' : 'border-gray-200 focus:border-brand-primary'
                }`}
                {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Must be at least 10 characters long' } })}
              />
              {errors.description && (
                <span className="text-xs font-medium text-rose-500">{errors.description.message}</span>
              )}
            </div>

            {/* Tags Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Event Tags / Key Phrases
              </label>
              <div className="flex flex-wrap gap-2 p-2 bg-[#F3F4F6] border border-gray-200 rounded-lg min-h-11">
                {tags.map((tag, i) => (
                  <span key={tag} className="inline-flex items-center bg-brand-primary/10 text-brand-primary text-xs font-bold px-2.5 py-1 rounded-full space-x-1 border border-brand-primary/20">
                    <span>{tag}</span>
                    <button type="button" onClick={() => handleRemoveTag(i)} className="hover:text-rose-600 transition font-black">
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Type tag and hit Enter or Comma..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-grow bg-transparent border-none text-xs outline-none px-2 min-w-[150px] dark:text-white"
                />
              </div>
              <span className="text-[10px] text-neutral-slate-400 font-medium">Add tag parameters (e.g. "ai", "scaling", "fintech") to maximize hub filtering.</span>
            </div>

            {/* Visibility and Draft Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Event Visibility Control
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none"
                  {...register('visibility')}
                >
                  <option value={EventVisibility.PUBLIC}>Public (Exposed on Main Tenant Catalog)</option>
                  <option value={EventVisibility.PRIVATE}>Private (Restricted to Hub Members only)</option>
                  <option value={EventVisibility.UNLISTED}>Unlisted (Exclusively viewable via Direct Shared link)</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Initial Pipeline Status
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none"
                  {...register('status')}
                >
                  <option value={EventStatus.DRAFT}>Draft Sandbox Mode</option>
                  <option value={EventStatus.PUBLISHED}>Published & Live Immediate</option>
                </select>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h4 className="font-display font-bold text-sm text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <span>Scheduling Matrix</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Event Starts"
                  type="datetime-local"
                  error={errors.schedule?.startDate?.message}
                  {...register('schedule.startDate', { required: 'Event start date/time is required' })}
                />
                <Input
                  label="Event Ends"
                  type="datetime-local"
                  error={errors.schedule?.endDate?.message}
                  {...register('schedule.endDate', { required: 'Event end date/time is required' })}
                />
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Target Timezone
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white text-gray-900 border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none"
                    {...register('schedule.timezone')}
                  >
                    <option value="UTC">UTC (Universal Coordinated)</option>
                    <option value="America/New_York">EST / EDT (America/New_York)</option>
                    <option value="America/Los_Angeles">PST / PDT (America/Los_Angeles)</option>
                    <option value="Europe/London">GMT / BST (Europe/London)</option>
                    <option value="Europe/Paris">CET / CEST (Europe/Paris)</option>
                    <option value="Asia/Tokyo">JST (Asia/Tokyo)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAPACITY MANAGEMENT & REGISTRATION SETTINGS */}
        {activeTab === 'capacity' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Capacity Limit Block */}
              <div className="space-y-4 bg-[#F9FAFB] p-6 rounded-2xl border border-gray-200">
                <h4 className="font-display font-bold text-sm text-gray-800">Seat Capacity Allocation</h4>
                <div className="flex items-center space-x-3.5 py-2">
                  <input
                    id="isUnlimited"
                    type="checkbox"
                    className="w-4 h-4 text-brand-primary border-neutral-slate-300 rounded focus:ring-brand-primary outline-none cursor-pointer"
                    {...register('capacity.isUnlimited')}
                  />
                  <label htmlFor="isUnlimited" className="text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer">
                    Unlimited Attendance seats
                  </label>
                </div>

                {!watchIsUnlimited && (
                  <Input
                    label="Maximum Admissions Cap"
                    type="number"
                    placeholder="e.g. 100"
                    error={errors.capacity?.maxCapacity?.message}
                    {...register('capacity.maxCapacity', {
                      min: { value: 1, message: 'Max capacity must be at least 1 seat' },
                    })}
                  />
                )}
              </div>

              {/* Approval settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F9FAFB] p-6 rounded-2xl border border-gray-200">
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-sm text-gray-800">RSVP Approvals Control</h4>
                  <div className="flex items-center space-x-3.5 py-1">
                    <input
                      id="requiresApproval"
                      type="checkbox"
                      className="w-4 h-4 text-brand-primary border-neutral-slate-300 rounded focus:ring-brand-primary outline-none cursor-pointer"
                      {...register('registrationSettings.requiresApproval')}
                    />
                    <label htmlFor="requiresApproval" className="text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer">
                      Requires Staff Approval
                    </label>
                  </div>
                  <p className="text-[11px] text-neutral-slate-400 leading-relaxed font-medium">
                    When enabled, registrants are held in PENDING_APPROVAL until operators approve them.
                  </p>
                </div>

                <div className="space-y-2 border-l border-neutral-slate-200/60 border-gray-200 pl-4">
                  <h4 className="font-display font-bold text-sm text-gray-800">Admission Scope Policy</h4>
                  <div className="flex items-center space-x-3.5 py-1">
                    <input
                      id="isInviteOnly"
                      type="checkbox"
                      className="w-4 h-4 text-brand-primary border-neutral-slate-300 rounded focus:ring-brand-primary outline-none cursor-pointer"
                      {...register('registrationSettings.isInviteOnly')}
                    />
                    <label htmlFor="isInviteOnly" className="text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer">
                      Invite Only Event
                    </label>
                  </div>
                  <p className="text-[11px] text-neutral-slate-400 leading-relaxed font-medium">
                    Restrict registrations to users with active guest passes issued in the dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Registration timeline limits */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h4 className="font-display font-bold text-sm text-gray-700">Registration Availability (Optional Window)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Booking Opens"
                  type="datetime-local"
                  {...register('registrationSettings.registrationOpenDate')}
                />
                <Input
                  label="Booking Closes"
                  type="datetime-local"
                  {...register('registrationSettings.registrationCloseDate')}
                />
              </div>
            </div>

            {/* Free RSVP Mode Block */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h4 className="font-display font-bold text-sm text-gray-700">Free RSVP Community Enlistment</h4>
              <div className="bg-[#F9FAFB] p-6 rounded-2xl border border-gray-200">
                <div className="flex items-start space-x-3.5">
                  <input
                    id="isFreeRsvp"
                    type="checkbox"
                    checked={isFreeRsvp}
                    onChange={(e) => setIsFreeRsvp(e.target.checked)}
                    className="w-5 h-5 text-brand-primary border-neutral-slate-300 rounded focus:ring-brand-primary outline-none cursor-pointer mt-0.5"
                  />
                  <div className="space-y-1 text-left">
                    <label htmlFor="isFreeRsvp" className="text-sm font-bold text-gray-900 uppercase tracking-wider cursor-pointer">
                      Free RSVP Event (No Hub Account Required)
                    </label>
                    <p className="text-xs text-neutral-slate-500 leading-relaxed">
                      Enable zero-barrier community registrations. Bypasses WeVentureHub account login requirements completely. Generates a custom public RSVP landing page with QR code scanning capabilities.
                    </p>
                  </div>
                </div>

                {isFreeRsvp && initialValues?.id && (
                  <div className="pt-4 mt-4 border-t border-gray-200/60 space-y-3 text-left">
                    <h5 className="text-xs font-extrabold uppercase text-gray-600 tracking-wider">Public RSVP Access Details</h5>
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-200">
                      <div className="flex-1 space-y-1 w-full">
                        <span className="text-[10px] font-black uppercase text-neutral-slate-400 block mb-1">Shareable RSVP Link</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/public/events/${initialValues.slug}/rsvp`}
                            className="w-full text-xs bg-neutral-50 px-3 py-2 border rounded-lg outline-none font-mono text-neutral-600"
                            id="rsvp-share-link"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('rsvp-share-link') as HTMLInputElement;
                              el.select();
                              document.execCommand('copy');
                              alert('Copied to clipboard!');
                            }}
                            className="bg-[#84cc16] hover:bg-[#72b012] text-white px-3 py-1.5 rounded-lg text-xs font-bold font-display shrink-0"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-neutral-50 rounded-lg border border-dashed border-gray-200 shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/public/events/${initialValues.slug}/rsvp`)}`}
                          alt="RSVP Page QR Code"
                          className="w-20 h-20 border rounded bg-white"
                        />
                        <span className="text-[9px] text-neutral-slate-400 mt-1 font-bold uppercase tracking-wider">Form QR Code</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: REGISTRATION FORM DESIGNER (CUSTOM FIELDS) */}
        {activeTab === 'formDesigner' && (
          <div className="space-y-6">
            <div className="border-b pb-3 border-gray-200">
              <h4 className="font-display font-bold text-base text-gray-900 text-left">
                {isFreeRsvp ? 'RSVP Form & Design Builder' : 'Registration Custom Fields Designer'}
              </h4>
              <p className="text-xs text-neutral-slate-400 mt-1 text-left">
                {isFreeRsvp
                  ? 'Design the dynamic checkout fields and custom visual theme of your community-facing RSVP registration form.'
                  : 'Establish custom, dynamic checkout questionnaires. Perfect for capturing dietary preferences, badge names, file resumes, or company roles.'}
              </p>
            </div>

            {isFreeRsvp ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                {/* Left Column: RSVP Editor Controls */}
                <div className="lg:col-span-5 bg-[#F9FAFB] p-5 rounded-2xl border border-gray-200 space-y-4">
                  {/* Selector Header */}
                  <div className="flex space-x-2 border-b border-gray-200 pb-3 mb-2">
                    <button
                      type="button"
                      onClick={() => setRsvpSubTab('fields')}
                      className={`text-[11px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg transition-all ${
                        rsvpSubTab === 'fields'
                          ? 'bg-[#84cc16] text-white'
                          : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-gray-200'
                      }`}
                    >
                      1. Manage RSVP Fields
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpSubTab('appearance')}
                      className={`text-[11px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg transition-all ${
                        rsvpSubTab === 'appearance'
                          ? 'bg-[#84cc16] text-white'
                          : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-gray-200'
                      }`}
                    >
                      2. Style & Appearance
                    </button>
                  </div>

                  {rsvpSubTab === 'fields' ? (
                    <div className="space-y-4">
                      {/* Field Creation Form */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                        <span className="text-[10px] font-extrabold uppercase text-neutral-slate-400 tracking-wider block">Add Field to Form</span>
                        
                        <Input
                          label="Field Question / Label text"
                          placeholder="e.g. Dietary Preferences"
                          value={rsvpFieldLabel}
                          onChange={(e) => setRsvpFieldLabel(e.target.value)}
                        />

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-neutral-slate-500 uppercase">Input Response Type</label>
                          <select
                            value={rsvpFieldType}
                            onChange={(e) => setRsvpFieldType(e.target.value as any)}
                            className="w-full text-xs px-3 py-2.5 bg-white border border-gray-200 rounded-lg outline-none"
                          >
                            <option value="text">Single Line Text</option>
                            <option value="textarea">Text Area (Multi-line)</option>
                            <option value="email">Email Address</option>
                            <option value="phone">Phone Number</option>
                            <option value="number">Number Input</option>
                            <option value="dropdown">Dropdown Menu</option>
                            <option value="radio">Radio Buttons List</option>
                            <option value="checkbox">Binary Checkbox</option>
                            <option value="multiselect">Multi-Select List</option>
                            <option value="date">Calendar Date Selection</option>
                            <option value="file">File Upload Component</option>
                            <option value="section_title">Visual Section Title</option>
                            <option value="paragraph">Paragraph / Instructions Text</option>
                          </select>
                        </div>

                        {['dropdown', 'radio', 'multiselect'].includes(rsvpFieldType) && (
                          <Input
                            label="Dropdown/Radio Options (Comma-Separated)"
                            placeholder="e.g. Vegan, Vegetarian, Halal, None"
                            value={rsvpFieldOptions}
                            onChange={(e) => setRsvpFieldOptions(e.target.value)}
                          />
                        )}

                        {!['section_title', 'paragraph', 'checkbox'].includes(rsvpFieldType) && (
                          <Input
                            label="Input Placeholder Text (Optional)"
                            placeholder="e.g. Any food allergies?"
                            value={rsvpFieldPlaceholder}
                            onChange={(e) => setRsvpFieldPlaceholder(e.target.value)}
                          />
                        )}

                        <div className="flex items-center space-x-2 py-1">
                          <input
                            id="rsvpFieldRequired"
                            type="checkbox"
                            checked={rsvpFieldRequired}
                            onChange={(e) => setRsvpFieldRequired(e.target.checked)}
                            className="rounded text-[#84cc16] focus:ring-[#84cc16]"
                          />
                          <label htmlFor="rsvpFieldRequired" className="text-xs font-bold text-neutral-slate-500 uppercase tracking-wide select-none cursor-pointer">
                            Strictly Required response
                          </label>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          className="w-full text-xs font-bold py-2"
                          onClick={handleAddRsvpField}
                        >
                          Add RSVP Question
                        </Button>
                      </div>

                      {/* Configured Fields List with reordering, inline edits & deletion */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-extrabold uppercase text-neutral-slate-400 tracking-wider block">Manage Field Ordering & Constraints</span>
                        
                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                          {rsvpFormFields.map((f, index) => (
                            <div key={f.id} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 relative shadow-xs text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-neutral-500 uppercase tracking-wide text-[9px] font-mono">
                                  Field {index + 1}: {f.type}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => handleReorderRsvpField(index, 'up')}
                                    className="p-1 hover:bg-neutral-100 rounded text-neutral-500 disabled:opacity-30 text-xs font-bold"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === rsvpFormFields.length - 1}
                                    onClick={() => handleReorderRsvpField(index, 'down')}
                                    className="p-1 hover:bg-neutral-100 rounded text-neutral-500 disabled:opacity-30 text-xs font-bold"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRsvpField(f.id)}
                                    className="p-1 hover:bg-rose-50 rounded text-rose-500"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  value={f.label}
                                  onChange={(e) => handleUpdateRsvpFieldInline(f.id, 'label', e.target.value)}
                                  placeholder="Question text or title"
                                  className="w-full text-xs px-2 py-1 bg-neutral-50 border rounded outline-none font-medium text-gray-800"
                                />
                                {!['checkbox', 'section_title', 'paragraph'].includes(f.type) && (
                                  <input
                                    type="text"
                                    value={f.placeholder || ''}
                                    onChange={(e) => handleUpdateRsvpFieldInline(f.id, 'placeholder', e.target.value)}
                                    placeholder="Input placeholder text..."
                                    className="w-full text-[11px] px-2 py-1 bg-neutral-50 border rounded outline-none text-neutral-500"
                                  />
                                )}
                                {['dropdown', 'radio', 'multiselect'].includes(f.type) && (
                                  <input
                                    type="text"
                                    value={f.options ? f.options.join(', ') : ''}
                                    onChange={(e) => handleUpdateRsvpFieldInline(f.id, 'options', e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                                    placeholder="Options (comma-separated): Option 1, Option 2, Option 3"
                                    className="w-full text-[11px] px-2 py-1 bg-neutral-50 border rounded outline-none text-neutral-500 font-mono"
                                  />
                                )}
                                {!['section_title', 'paragraph'].includes(f.type) && (
                                  <div className="flex items-center space-x-2 pt-0.5">
                                    <input
                                      id={`req-${f.id}`}
                                      type="checkbox"
                                      checked={f.required}
                                      onChange={(e) => handleUpdateRsvpFieldInline(f.id, 'required', e.target.checked)}
                                      className="rounded text-[#84cc16] focus:ring-[#84cc16]"
                                    />
                                    <label htmlFor={`req-${f.id}`} className="text-[10px] font-bold text-neutral-slate-500 uppercase cursor-pointer">
                                      Strictly Required response
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Form Style & Appearance Controllers */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                        <div>
                          <label className="text-[11px] font-bold text-neutral-slate-500 uppercase block mb-1">Background Theme Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={rsvpFormAppearance.backgroundColor || '#ffffff'}
                              onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, backgroundColor: e.target.value })}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={rsvpFormAppearance.backgroundColor || '#ffffff'}
                              onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, backgroundColor: e.target.value })}
                              className="flex-1 text-xs px-3 border rounded-lg outline-none font-mono text-neutral-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-neutral-slate-500 uppercase block mb-1">Text Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={rsvpFormAppearance.textColor || '#111827'}
                              onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, textColor: e.target.value })}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={rsvpFormAppearance.textColor || '#111827'}
                              onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, textColor: e.target.value })}
                              className="flex-1 text-xs px-3 border rounded-lg outline-none font-mono text-neutral-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-neutral-slate-500 uppercase block mb-1">Button Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={rsvpFormAppearance.buttonColor || '#84cc16'}
                              onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, buttonColor: e.target.value })}
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <input
                              type="text"
                              value={rsvpFormAppearance.buttonColor || '#84cc16'}
                              onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, buttonColor: e.target.value })}
                              className="flex-1 text-xs px-3 border rounded-lg outline-none font-mono text-neutral-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-neutral-slate-500 uppercase block mb-1">Card Container Style</label>
                          <select
                            value={rsvpFormAppearance.cardStyle || 'shadowed'}
                            onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, cardStyle: e.target.value })}
                            className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none"
                          >
                            <option value="flat">Flat Minimalist</option>
                            <option value="bordered">Bordered Accent</option>
                            <option value="shadowed">Standard Shadowed</option>
                            <option value="elevated">Elevated Floating</option>
                            <option value="glass">Semi-Transparent Glassmorphic</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-neutral-slate-500 uppercase block mb-1">Border Corner Radius (px)</label>
                          <div className="flex gap-3 items-center">
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={rsvpFormAppearance.borderRadius || 12}
                              onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, borderRadius: parseInt(e.target.value) })}
                              className="flex-1 cursor-pointer accent-[#84cc16]"
                            />
                            <span className="text-xs font-mono font-bold text-neutral-500 w-8 text-right">
                              {rsvpFormAppearance.borderRadius || 12}px
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-neutral-slate-500 uppercase block mb-1">Banner Image URL</label>
                          <input
                            type="text"
                            value={rsvpFormAppearance.bannerUrl || ''}
                            onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, bannerUrl: e.target.value })}
                            placeholder="e.g. https://images.unsplash.com/... or base64"
                            className="w-full text-xs px-3 py-2 border rounded-lg outline-none font-mono text-neutral-700"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-neutral-slate-500 uppercase block mb-1">Post-Submission Success Message</label>
                          <textarea
                            rows={3}
                            value={rsvpFormAppearance.thankYouMessage || ''}
                            onChange={(e) => setRsvpFormAppearance({ ...rsvpFormAppearance, thankYouMessage: e.target.value })}
                            placeholder="Thank you for RSVPing! Your spot has been secured."
                            className="w-full text-xs p-3 border rounded-lg outline-none text-neutral-700 leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Live Form Layout Preview */}
                <div className="lg:col-span-7 space-y-4">
                  <span className="text-xs font-extrabold uppercase text-neutral-slate-400 tracking-wider block text-left">Dynamic Form Live Preview</span>
                  
                  <div 
                    className="p-6 border transition-all duration-300 max-h-[600px] overflow-y-auto"
                    style={{
                      backgroundColor: rsvpFormAppearance.backgroundColor || '#ffffff',
                      color: rsvpFormAppearance.textColor || '#111827',
                      borderRadius: `${rsvpFormAppearance.borderRadius || 12}px`,
                      boxShadow: rsvpFormAppearance.cardStyle === 'elevated' ? '0 10px 25px rgba(0,0,0,0.1)' : rsvpFormAppearance.cardStyle === 'shadowed' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                      borderColor: rsvpFormAppearance.cardStyle === 'bordered' ? (rsvpFormAppearance.buttonColor || '#84cc16') : '#E5E7EB',
                      borderWidth: rsvpFormAppearance.cardStyle === 'bordered' ? '2px' : '1px'
                    }}
                  >
                    {rsvpFormAppearance.bannerUrl && (
                      <img 
                        src={rsvpFormAppearance.bannerUrl} 
                        alt="Banner Preview" 
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="font-display font-bold text-lg" style={{ color: rsvpFormAppearance.textColor || '#111827' }}>
                        RSVP Registration Preview
                      </h3>
                      <p className="text-xs opacity-70 mt-1">Please fill out this form to reserve your free digital ticket</p>
                    </div>

                    <div className="space-y-4">
                      {rsvpFormFields.map((f) => (
                        <div key={f.id} className="text-left space-y-1">
                          {f.type === 'section_title' ? (
                            <h4 className="font-display font-bold text-sm border-b pb-1 mt-4" style={{ color: rsvpFormAppearance.textColor || '#111827' }}>
                              {f.label}
                            </h4>
                          ) : f.type === 'paragraph' ? (
                            <p className="text-[11px] opacity-80 leading-relaxed font-medium">
                              {f.label}
                            </p>
                          ) : (
                            <>
                              <label className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                                {f.label} {f.required && <span className="text-rose-500 font-extrabold">*</span>}
                              </label>
                              
                              {f.type === 'textarea' ? (
                                <textarea
                                  readOnly
                                  rows={2}
                                  placeholder={f.placeholder || 'Your response...'}
                                  className="w-full text-xs p-2.5 bg-neutral-50/50 border border-gray-200 rounded-lg outline-none opacity-80"
                                  style={{ borderRadius: `${rsvpFormAppearance.borderRadius ? rsvpFormAppearance.borderRadius / 1.5 : 8}px` }}
                                />
                              ) : f.type === 'dropdown' ? (
                                <select
                                  disabled
                                  className="w-full text-xs p-2.5 bg-neutral-50/50 border border-gray-200 rounded-lg outline-none opacity-80"
                                  style={{ borderRadius: `${rsvpFormAppearance.borderRadius ? rsvpFormAppearance.borderRadius / 1.5 : 8}px` }}
                                >
                                  <option>{f.placeholder || 'Select an option...'}</option>
                                  {f.options?.map((opt: string, i: number) => <option key={i}>{opt}</option>)}
                                </select>
                              ) : f.type === 'radio' ? (
                                <div className="space-y-1.5 pt-1">
                                  {f.options?.map((opt: string, i: number) => (
                                    <div key={i} className="flex items-center space-x-2 text-xs">
                                      <input type="radio" disabled className="w-3.5 h-3.5" />
                                      <span className="opacity-80">{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : f.type === 'checkbox' ? (
                                <div className="flex items-center space-x-2 py-1">
                                  <input type="checkbox" disabled className="w-3.5 h-3.5" />
                                  <span className="text-xs opacity-80">{f.label}</span>
                                </div>
                              ) : f.type === 'multiselect' ? (
                                <div className="space-y-1.5 pt-1">
                                  {f.options?.map((opt: string, i: number) => (
                                    <div key={i} className="flex items-center space-x-2 text-xs">
                                      <input type="checkbox" disabled className="w-3.5 h-3.5" />
                                      <span className="opacity-80">{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <input
                                  type={f.type}
                                  readOnly
                                  placeholder={f.placeholder || `Enter your ${f.label.toLowerCase()}...`}
                                  className="w-full text-xs p-2.5 bg-neutral-50/50 border border-gray-200 rounded-lg outline-none opacity-80"
                                  style={{ borderRadius: `${rsvpFormAppearance.borderRadius ? rsvpFormAppearance.borderRadius / 1.5 : 8}px` }}
                                />
                              )}
                            </>
                          )}
                        </div>
                      ))}

                      <div className="pt-4">
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 text-white font-bold text-xs font-display shadow-sm transition-all uppercase tracking-wider"
                          style={{
                            backgroundColor: rsvpFormAppearance.buttonColor || '#84cc16',
                            borderRadius: `${rsvpFormAppearance.borderRadius || 12}px`
                          }}
                        >
                          Submit RSVP Reservation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                
                {/* Left Column: Create Field Form */}
                <div className="lg:col-span-5 bg-[#F9FAFB] p-5 rounded-2xl border border-gray-200 space-y-4">
                  <span className="text-xs font-extrabold uppercase text-neutral-slate-400 tracking-wider">Add Custom Questionnaire Field</span>
                  
                  <div className="space-y-3">
                    <Input
                      label="Field Title / Label"
                      placeholder="e.g. Provide Your Github Handle"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                    />

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-neutral-slate-500 uppercase">Input Response Type</label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as any)}
                        className="w-full text-xs px-3 py-2.5 bg-white border border-gray-200 rounded-lg outline-none"
                      >
                        <option value="text">Single Line Text</option>
                        <option value="number">Number Entry</option>
                        <option value="email">Email Address</option>
                        <option value="checkbox">Binary Checkbox</option>
                        <option value="select">Dropdown Menu Options</option>
                        <option value="file">Document/Image File Upload</option>
                      </select>
                    </div>

                    {newFieldType === 'select' && (
                      <Input
                        label="Dropdown Options (Comma-Separated)"
                        placeholder="e.g. Small, Medium, Large"
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                      />
                    )}

                    <div className="flex items-center space-x-2 py-1">
                      <input
                        id="newFieldRequired"
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded text-brand-primary"
                      />
                      <label htmlFor="newFieldRequired" className="text-xs font-bold text-neutral-slate-500 uppercase tracking-wide select-none cursor-pointer">
                        Strictly Required response
                      </label>
                    </div>

                    {/* Conditional Logic Toggle */}
                    {customFormFields.length > 0 && (
                      <div className="border-t pt-3 border-gray-200 space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            id="newFieldConditional"
                            type="checkbox"
                            checked={newFieldConditional}
                            onChange={(e) => setNewFieldConditional(e.target.checked)}
                            className="rounded text-brand-primary"
                          />
                          <label htmlFor="newFieldConditional" className="text-xs font-bold text-neutral-slate-500 uppercase tracking-wide select-none cursor-pointer">
                            Apply Conditional Display Logic
                          </label>
                        </div>

                        {newFieldConditional && (
                          <div className="bg-white border border-gray-200 shadow-sm p-3 rounded-xl space-y-2.5">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-neutral-slate-400">If Field</label>
                              <select
                                value={newFieldCondId}
                                onChange={(e) => setNewFieldCondId(e.target.value)}
                                className="w-full text-[11px] p-2 border border-gray-200 bg-transparent rounded-lg text-neutral-slate-800"
                              >
                                <option value="">Select Trigger Field...</option>
                                {customFormFields.map(f => (
                                  <option key={f.id} value={f.id}>{f.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            <Input
                              label="Has Answer Value"
                              placeholder="e.g. Yes"
                              value={newFieldCondVal}
                              onChange={(e) => setNewFieldCondVal(e.target.value)}
                              className="text-[11px] h-8"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="primary"
                      className="w-full text-xs font-bold py-2"
                      onClick={handleAddCustomField}
                    >
                      Add Field to Designer
                    </Button>
                  </div>
                </div>

                {/* Right Column: Live Form Layout Preview */}
                <div className="lg:col-span-7 space-y-4">
                  <span className="text-xs font-extrabold uppercase text-neutral-slate-400 tracking-wider">Dynamic Form Live Preview</span>
                  
                  {customFormFields.length === 0 ? (
                    <div className="py-12 border border-dashed border-gray-200 rounded-2xl text-center space-y-2">
                      <ClipboardList className="w-8 h-8 text-neutral-slate-300 mx-auto" />
                      <span className="text-xs font-bold text-neutral-slate-400 uppercase tracking-wider block">No custom questions designed</span>
                      <p className="text-[11px] text-neutral-slate-400 max-w-xs mx-auto leading-relaxed">
                        Only default profile inputs (Name, Email) will be prompted at checkout unless designed here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {customFormFields.map((f, index) => (
                        <div key={f.id} className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl flex items-center justify-between shadow-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-gray-900">
                                {f.label}
                              </span>
                              {f.required && (
                                <span className="text-rose-500 font-extrabold text-xs">*</span>
                              )}
                              <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-mono px-2 py-0.5 rounded-full font-bold uppercase select-none">
                                {f.type}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-slate-400 font-medium">
                              {f.options && f.options.length > 0 && `Options: ${f.options.join(', ')}`}
                              {f.conditionalShow && (
                                <span className="text-brand-primary font-bold ml-1">
                                   (Show conditional when field answer equals "{f.conditionalShow.value}")
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(f.id)}
                            className="p-1 text-neutral-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg transition-all"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 3: MULTI-SESSION AGENDA BUILDER */}
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display font-bold text-sm text-gray-800">Multi-Session Schedule Planner</h4>
                <p className="text-xs text-neutral-slate-400 mt-0.5">Design chronological tracks, panels, breaks, or guest speaking sessions.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs font-bold"
                onClick={() => append({ title: '', description: '', startTime: '', endTime: '', location: '' })}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Agenda Item</span>
              </Button>
            </div>

            {/* Fields List */}
            {fields.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl">
                <Clock className="w-8 h-8 text-neutral-slate-300 mx-auto mb-2" />
                <span className="text-xs font-bold text-neutral-slate-400 uppercase tracking-wider block">No sessions defined</span>
                <p className="text-[11px] text-neutral-slate-400 mt-1 max-w-sm mx-auto">This event acts as a single-session meetup unless you build structured agenda items.</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <div 
                    key={field.id} 
                    className="p-5 bg-[#F9FAFB]/40 border border-gray-200/80 rounded-2xl relative space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">
                        Session Track #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-neutral-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove session track"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Session Title"
                        placeholder="e.g. Registration & Morning Coffee"
                        {...register(`sessions.${index}.title` as const, { required: 'Session title is required' })}
                      />
                      <Input
                        label="Track Location (Room/Suite)"
                        placeholder="e.g. Tesla Boardroom / Hub Lobby"
                        {...register(`sessions.${index}.location` as const)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Track Start"
                        type="datetime-local"
                        {...register(`sessions.${index}.startTime` as const, { required: 'Start date/time is required' })}
                      />
                      <Input
                        label="Track End"
                        type="datetime-local"
                        {...register(`sessions.${index}.endTime` as const, { required: 'End date/time is required' })}
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Session Summary (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Networking reception with tech experts and keynote speakers..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10"
                        {...register(`sessions.${index}.description` as const)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EVENT MEDIA LINKS */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <h4 className="font-display font-bold text-sm text-gray-800">Creative Media Links</h4>
            <div className="space-y-5">
              
              {/* Local File Dropzone Uploader */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Event Banner Photo (Local Device)</label>
                <div 
                  onDragEnter={handleEventDrag}
                  onDragOver={handleEventDrag}
                  onDragLeave={handleEventDrag}
                  onDrop={handleEventDrop}
                  className={`border-2 border-dashed rounded-[14px] p-5 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    eventDragActive 
                      ? "border-[#84CC16] bg-[#A3E635]/15" 
                      : watchBannerUrl 
                        ? "border-emerald-200 bg-emerald-50/10" 
                        : "border-[#E5E7EB] hover:border-[#84CC16] bg-[#F9FAFB]"
                  }`}
                >
                  {watchBannerUrl ? (
                    <div className="relative w-full max-h-48 rounded-[10px] overflow-hidden group">
                      <img src={watchBannerUrl} alt="Event Banner Preview" className="w-full h-48 object-cover rounded-[10px]" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[10px]">
                        <button
                          type="button"
                          onClick={() => setValue('media.bannerUrl', '')}
                          className="p-2 bg-[#EF4444] text-white rounded-full hover:bg-red-600 transition shadow-lg animate-fade-in"
                          title="Remove Image"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEventFileChange}
                        className="hidden"
                      />
                      <div className="p-3 bg-[#A3E635]/15 text-[#65A30D] rounded-full mb-3">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-[13px] font-bold text-gray-800">
                        Click to upload event photo <span className="text-gray-500 font-medium">or drag & drop here</span>
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-1">
                        Accepts PNG, JPG, JPEG, WEBP. Max size: 5MB
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {/* Or manual URL string fallback option */}
              <div className="text-center py-2">
                <span className="px-3 py-1 bg-[#F1F5F9] rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-wider">or specify custom image URL link</span>
              </div>

              <Input
                label="Banner Image URL"
                placeholder="https://images.unsplash.com/photo-..."
                helperText="Provide a valid public URL link. High-definition horizontal images are best."
                error={errors.media?.bannerUrl?.message}
                {...register('media.bannerUrl', {
                  pattern: { value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, message: 'Must be a valid URL link' }
                })}
              />

              <Input
                label="Teaser Video URL"
                placeholder="https://www.youtube.com/watch?v=..."
                helperText="Link a YouTube, Vimeo or Vimeo live link to spark engagement."
                error={errors.media?.videoUrl?.message}
                {...register('media.videoUrl', {
                  pattern: { value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, message: 'Must be a valid URL link' }
                })}
              />
            </div>
          </div>
        )}

        {/* TAB 5: SEO METADATA SPECS */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-display font-bold text-sm text-gray-800">SEO Meta Tags</h4>
              <p className="text-xs text-neutral-slate-400 mt-0.5">Optimize crawl engines and shared social cards with targeted metadata parameters.</p>
            </div>
            <div className="space-y-5">
              <Input
                label="SEO Title / Meta Title"
                placeholder="Generative AI Summit WeVentureHub"
                {...register('seo.metaTitle')}
              />

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Meta Description Tag
                </label>
                <textarea
                  placeholder="Summarize the core values and learning outputs of this event in less than 160 characters..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-900 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  {...register('seo.metaDescription')}
                />
              </div>

              <Input
                label="Search Keywords (Comma-Separated)"
                placeholder="ai, dev-con, code-hub, startup-pitch"
                {...register('seo.metaKeywords')}
              />
            </div>
          </div>
        )}

      </div>

      {/* Button Console */}
      <div className="flex justify-end items-center gap-3.5 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="font-bold px-6 h-11"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="font-bold px-8 h-11 shadow-md bg-brand-primary"
        >
          {isEdit ? 'Save Changes' : 'Establish Core Event'}
        </Button>
      </div>

    </form>
  );
};
