import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  ChevronRight, 
  RefreshCw, 
  ShieldCheck, 
  Star, 
  FileUp, 
  AlertCircle,
  QrCode,
  Ticket,
  LayoutDashboard,
  Check,
  PenTool,
  UploadCloud,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { IEvent, IRsvpFormField, IRsvpFormAppearance } from '../../../types';

interface RsvpLivePreviewProps {
  event?: IEvent;
  eventTitle?: string;
  eventDescription?: string;
  startDate?: string;
  fields: IRsvpFormField[];
  appearance: IRsvpFormAppearance;
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
  onClose?: () => void;
}

export const RsvpLivePreview: React.FC<RsvpLivePreviewProps> = ({
  event,
  eventTitle,
  eventDescription,
  startDate,
  fields,
  appearance,
  previewDevice = 'desktop',
  onClose
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Evaluate conditional logic for each field
  const isFieldVisible = (field: IRsvpFormField): boolean => {
    if (field.hidden && field.type !== 'hidden') return false;
    if (!field.conditionalLogic || field.conditionalLogic.length === 0) return true;

    return field.conditionalLogic.every(rule => {
      const parentValue = formData[rule.fieldId];
      let matches = false;

      if (rule.operator === 'equals') {
        matches = String(parentValue || '').toLowerCase() === String(rule.value || '').toLowerCase();
      } else if (rule.operator === 'not_equals') {
        matches = String(parentValue || '').toLowerCase() !== String(rule.value || '').toLowerCase();
      } else if (rule.operator === 'contains') {
        matches = String(parentValue || '').toLowerCase().includes(String(rule.value || '').toLowerCase());
      }

      return rule.action === 'show' ? matches : !matches;
    });
  };

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Validate required visible fields
    fields.forEach(f => {
      if (['section_title', 'paragraph', 'divider', 'hidden'].includes(f.type)) return;
      if (!isFieldVisible(f)) return;

      if (f.required) {
        const val = formData[f.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          errors[f.id] = `${f.label || 'This field'} is required`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`preview-field-${firstErrorKey}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitted(true);
  };

  const resetForm = () => {
    setFormData({});
    setValidationErrors({});
    setIsSubmitted(false);
  };

  const titleValue = eventTitle || event?.title || 'Event Registration';
  const descValue = eventDescription || event?.description || 'Please complete the form below to register for this event.';
  const dateValue = startDate || event?.schedule?.startDate;

  const formattedDate = dateValue ? (() => {
    try {
      return format(new Date(dateValue), 'EEE, MMM dd, yyyy');
    } catch {
      return 'Date TBA';
    }
  })() : 'Date TBA';

  const formattedTime = dateValue ? (() => {
    try {
      return format(new Date(dateValue), 'HH:mm');
    } catch {
      return '';
    }
  })() : '';

  const deviceWidthClass = 
    previewDevice === 'mobile' ? 'max-w-[420px]' :
    previewDevice === 'tablet' ? 'max-w-[720px]' : 'max-w-3xl';

  const cardStyleClass = 
    appearance.cardStyle === 'bordered' ? 'border-2 border-neutral-200 shadow-none' :
    appearance.cardStyle === 'glass' ? 'bg-white/80 backdrop-blur-md border border-white/60 shadow-xl' :
    appearance.cardStyle === 'flat' ? 'border border-neutral-100 shadow-none' : 'shadow-2xl border border-neutral-200';

  // Responsive column widths for fields
  const getFieldColSpan = (fieldWidth?: string) => {
    if (previewDevice === 'mobile') return 'col-span-12';
    if (previewDevice === 'tablet') {
      if (fieldWidth === 'half' || fieldWidth === 'third') return 'col-span-6';
      return 'col-span-12';
    }
    if (fieldWidth === 'half') return 'col-span-12 md:col-span-6';
    if (fieldWidth === 'third') return 'col-span-12 md:col-span-4';
    return 'col-span-12';
  };

  return (
    <div 
      className="absolute inset-0 z-30 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-10 flex flex-col items-center justify-start select-text"
      style={{ backgroundColor: appearance.backgroundColor || '#F8FAFC' }}
    >
      {/* Interactive test notice */}
      <div className="mb-6 flex items-center justify-between gap-4 w-full max-w-3xl bg-neutral-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="font-black text-white">Live RSVP Preview:</span>
          <span className="text-neutral-400 truncate hidden sm:inline">
            Showing complete form with all questions, styling, and submit actions
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isSubmitted && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl font-bold text-[11px] transition-colors"
            >
              Exit Preview
            </button>
          )}
        </div>
      </div>

      <div className={`w-full ${deviceWidthClass} transition-all duration-300 pb-28`}>
        {!isSubmitted ? (
          <div
            className={`bg-white rounded-3xl overflow-hidden transition-all h-auto ${cardStyleClass}`}
            style={{
              borderRadius: `${appearance.borderRadius || 16}px`,
              backgroundColor: appearance.cardBackground || '#FFFFFF',
              fontFamily: appearance.fontFamily || 'inherit'
            }}
          >
            {/* 1. Event Banner / Header */}
            {(appearance.bannerUrl || appearance.headerImage || event?.media?.bannerUrl) ? (
              <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden bg-neutral-950">
                <img 
                  src={appearance.bannerUrl || appearance.headerImage || event?.media?.bannerUrl} 
                  alt="Event Banner" 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : null}

            <div className="p-6 md:p-10 space-y-6">
              {/* Event Title & Schedule Info */}
              <div className="space-y-4 text-center">
                {appearance.eventLogo && (
                  <img src={appearance.eventLogo} alt="Logo" className="h-12 max-w-[180px] mx-auto object-contain mb-2" />
                )}
                <h1 
                  className="text-2xl sm:text-3xl font-black tracking-tight break-words whitespace-normal"
                  style={{ color: appearance.textColor || '#0F172A' }}
                >
                  {titleValue}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto font-medium leading-relaxed break-words whitespace-normal">
                  {descValue}
                </p>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
                    <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{formattedDate}</span>
                  </div>
                  {formattedTime && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{formattedTime}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                    <span>WeVentureHub Innovation Hall</span>
                  </div>
                </div>
              </div>

              <hr className="border-neutral-100 my-6" />

              {/* Dynamic Interactive Fields - Displays EVERY Field */}
              <form onSubmit={handleTestSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {fields.filter(isFieldVisible).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((field) => {
                    const widthClass = getFieldColSpan(field.width);
                    const hasError = validationErrors[field.id];

                    if (field.type === 'hidden') {
                      return (
                        <input
                          key={field.id}
                          type="hidden"
                          name={field.id}
                          value={formData[field.id] || field.placeholder || 'default'}
                        />
                      );
                    }

                    return (
                      <div 
                        key={field.id} 
                        id={`preview-field-${field.id}`}
                        className={`${widthClass} space-y-1.5`}
                      >
                        {field.type === 'section_title' ? (
                          <div className="pt-4 pb-1 border-b-2 border-neutral-200">
                            <h3 className="text-base font-black text-neutral-900 uppercase tracking-wide break-words whitespace-normal">
                              {field.label}
                            </h3>
                          </div>
                        ) : field.type === 'paragraph' ? (
                          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs text-neutral-600 leading-relaxed italic break-words whitespace-pre-line">
                            {field.label}
                          </div>
                        ) : field.type === 'divider' ? (
                          <hr className="my-3 border-neutral-200 border-dashed" />
                        ) : (
                          <>
                            <label className="text-xs font-bold text-neutral-800 flex items-center justify-between gap-2">
                              <span className="break-words whitespace-normal leading-snug">
                                {field.label || 'Question'}
                                {field.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                              </span>
                            </label>

                            {field.type === 'textarea' ? (
                              <textarea
                                rows={3}
                                placeholder={field.placeholder || 'Enter your response...'}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className={`w-full p-3.5 bg-neutral-50 border rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none transition-all ${
                                  hasError ? 'border-rose-400 bg-rose-50/30' : 'border-neutral-200 focus:border-brand-primary'
                                }`}
                              />
                            ) : ['dropdown'].includes(field.type) ? (
                              <select
                                value={formData[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className={`w-full p-3.5 bg-neutral-50 border rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none transition-all ${
                                  hasError ? 'border-rose-400 bg-rose-50/30' : 'border-neutral-200 focus:border-brand-primary'
                                }`}
                              >
                                <option value="" className="text-neutral-900">{field.placeholder || 'Select an option...'}</option>
                                {(field.options || ['Option 1', 'Option 2']).map((opt, i) => (
                                  <option key={i} value={opt} className="text-neutral-900">{opt}</option>
                                ))}
                              </select>
                            ) : field.type === 'radio' ? (
                              <div className="space-y-2">
                                {(field.options || ['Option 1', 'Option 2']).map((opt, i) => (
                                  <label 
                                    key={i} 
                                    className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-100/70 transition-colors"
                                  >
                                    <input
                                      type="radio"
                                      name={field.id}
                                      value={opt}
                                      checked={formData[field.id] === opt}
                                      onChange={() => handleInputChange(field.id, opt)}
                                      className="w-4 h-4 text-brand-primary mt-0.5 shrink-0"
                                    />
                                    <span className="text-xs text-neutral-800 font-medium break-words whitespace-normal flex-1">
                                      {opt}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            ) : field.type === 'checkbox' || field.type === 'multiselect' ? (
                              <div className="space-y-2">
                                {(field.options || ['Option 1', 'Option 2', 'Option 3']).map((opt, i) => {
                                  const currentArr = Array.isArray(formData[field.id]) ? formData[field.id] : [];
                                  const isChecked = currentArr.includes(opt);
                                  return (
                                    <label 
                                      key={i} 
                                      className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-100/70 transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            handleInputChange(field.id, [...currentArr, opt]);
                                          } else {
                                            handleInputChange(field.id, currentArr.filter((item: string) => item !== opt));
                                          }
                                        }}
                                        className="w-4 h-4 rounded text-brand-primary mt-0.5 shrink-0"
                                      />
                                      <span className="text-xs text-neutral-800 font-medium break-words whitespace-normal flex-1">
                                        {opt}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : field.type === 'yes_no' ? (
                              <div className="grid grid-cols-2 gap-3">
                                {['Yes', 'No'].map((choice) => (
                                  <button
                                    key={choice}
                                    type="button"
                                    onClick={() => handleInputChange(field.id, choice)}
                                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                                      formData[field.id] === choice
                                        ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                ))}
                              </div>
                            ) : field.type === 'rating' ? (
                              <div className="flex gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 w-fit">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleInputChange(field.id, star)}
                                    className="p-1 hover:scale-110 transition-transform"
                                  >
                                    <Star className={`w-6 h-6 ${
                                      (formData[field.id] || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                                    }`} />
                                  </button>
                                ))}
                              </div>
                            ) : ['file', 'image'].includes(field.type) ? (
                              <div className="p-5 border-2 border-dashed border-neutral-300 hover:border-brand-primary rounded-2xl bg-neutral-50/80 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-colors">
                                {field.type === 'image' ? (
                                  <ImageIcon className="w-7 h-7 text-neutral-400" />
                                ) : (
                                  <FileUp className="w-7 h-7 text-neutral-400" />
                                )}
                                <div>
                                  <p className="text-xs font-bold text-neutral-800">{field.placeholder || 'Choose file or drag & drop'}</p>
                                  <p className="text-[10px] text-neutral-400 mt-0.5">PDF, PNG, JPG or DOC up to 10MB</p>
                                </div>
                                {formData[field.id] && (
                                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                    File Attached: {String(formData[field.id])}
                                  </span>
                                )}
                              </div>
                            ) : field.type === 'signature' ? (
                              <div className="space-y-2">
                                <div className="h-24 w-full bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl p-3 flex flex-col justify-end">
                                  <input
                                    type="text"
                                    placeholder="Type your full legal name as digital signature..."
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    className="w-full bg-transparent border-b border-neutral-400 font-serif italic text-sm text-neutral-900 focus:outline-none focus:border-brand-primary"
                                  />
                                </div>
                                <span className="text-[10px] text-neutral-400 block text-right">Legally binding electronic signature</span>
                              </div>
                            ) : ['consent', 'terms'].includes(field.type) ? (
                              <label className="flex items-start gap-3 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-100/60 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={!!formData[field.id]}
                                  onChange={(e) => handleInputChange(field.id, e.target.checked)}
                                  className="w-4 h-4 rounded text-brand-primary mt-0.5 shrink-0"
                                />
                                <span className="text-xs text-neutral-700 leading-relaxed font-medium break-words whitespace-normal flex-1">
                                  {field.label}
                                </span>
                              </label>
                            ) : (
                              <input
                                type={
                                  field.type === 'number' ? 'number' : 
                                  field.type === 'email' ? 'email' : 
                                  field.type === 'phone' ? 'tel' :
                                  field.type === 'date' ? 'date' :
                                  field.type === 'time' ? 'time' :
                                  field.type === 'url' ? 'url' : 'text'
                                }
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className={`w-full px-3.5 py-3 bg-neutral-50 border rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none transition-all ${
                                  hasError ? 'border-rose-400 bg-rose-50/30' : 'border-neutral-200 focus:border-brand-primary'
                                }`}
                              />
                            )}

                            {field.description && (
                              <p className="text-[11px] text-neutral-500 font-medium break-words whitespace-normal">
                                {field.description}
                              </p>
                            )}

                            {hasError && (
                              <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{hasError}</span>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit Action - Always Rendered & Visible at Bottom */}
                <div className="pt-8 space-y-3">
                  <button
                    type="submit"
                    className="w-full py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: appearance.buttonColor || '#84CC16',
                      color: appearance.buttonTextColor || '#FFFFFF',
                      borderRadius: `${appearance.buttonRadius ?? appearance.borderRadius ?? 12}px`
                    }}
                  >
                    <span>{appearance.buttonText || 'Complete Registration'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{appearance.footerText || 'SECURE EVENT REGISTRATION POWERED BY WEVENTUREHUB'}</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Confirmation / Success Screen Simulation */
          <div 
            className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl text-center space-y-6 border border-neutral-200"
            style={{ borderRadius: `${appearance.borderRadius || 16}px` }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-neutral-900">Registration Confirmed!</h2>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {appearance.successMessage || `Your attendance has been secured for ${titleValue}. An official pass has been generated.`}
              </p>
            </div>

            {/* Pass Preview Card */}
            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl text-left space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Attendee Pass</span>
                  <span className="text-xs font-black text-neutral-900">{formData.name || formData.f_name || formData.fullName || 'Guest Attendee'}</span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                  Confirmed
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase block">Event Date</span>
                  <span className="font-bold text-neutral-800">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase block">Pass ID</span>
                  <span className="font-mono font-bold text-neutral-800">WVH-RSVP-LIVE</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="w-full py-3.5 bg-neutral-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-neutral-800 transition-colors"
            >
              Test Form Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
