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
      schedule: {
        ...data.schedule,
        startDate: data.schedule.startDate ? new Date(data.schedule.startDate).toISOString() : '',
        endDate: data.schedule.endDate ? new Date(data.schedule.endDate).toISOString() : '',
      },
      capacity: {
        maxCapacity: data.capacity.isUnlimited ? 0 : Number(data.capacity.maxCapacity),
        isUnlimited: data.capacity.isUnlimited,
      },
      registrationSettings: {
        ...data.registrationSettings,
        customFormFields,
        registrationOpenDate: data.registrationSettings.registrationOpenDate 
          ? new Date(data.registrationSettings.registrationOpenDate).toISOString() 
          : undefined,
        registrationCloseDate: data.registrationSettings.registrationCloseDate 
          ? new Date(data.registrationSettings.registrationCloseDate).toISOString() 
          : undefined,
      },
      seo: {
        ...data.seo,
        metaKeywords: data.seo.metaKeywords
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
    { id: 'formDesigner', name: 'Registration Form Designer', icon: ClipboardList },
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
          </div>
        )}

        {/* TAB: REGISTRATION FORM DESIGNER (CUSTOM FIELDS) */}
        {activeTab === 'formDesigner' && (
          <div className="space-y-6">
            <div className="border-b pb-3 border-gray-200">
              <h4 className="font-display font-bold text-base text-gray-900 text-left">Registration Custom Fields Designer</h4>
              <p className="text-xs text-neutral-slate-400 mt-1 text-left">
                Establish custom, dynamic checkout questionnaires. Perfect for capturing dietary preferences, badge names, file resumes, or company roles.
              </p>
            </div>

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
                      ? "border-[#2563EB] bg-[#EFF6FF]" 
                      : watchBannerUrl 
                        ? "border-emerald-200 bg-emerald-50/10" 
                        : "border-[#E5E7EB] hover:border-[#2563EB] bg-[#F9FAFB] hover:bg-white"
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
                      <div className="p-3 bg-[#EFF6FF] text-[#2563EB] rounded-full mb-3">
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
