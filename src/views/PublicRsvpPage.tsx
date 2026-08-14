import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  Ticket,
  QrCode,
  Download,
  LayoutDashboard,
  ShieldCheck,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { axiosInstance } from '../lib/axiosInstance';
import { IEvent, IRsvpFormField, IRsvpFormAppearance } from '../types';
import { Button } from '../components/Button';
import { format } from 'date-fns';

export default function PublicRsvpPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registration, setRegistration] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[RSVP Frontend Fetch] Fetching event & RSVP configuration for slug/id: ${slug}`);

      const response = await axiosInstance.get(`/public/events/slug/${slug}`);
      const eventData = response.data.data;

      if (!eventData) {
        throw new Error('Event not found');
      }

      console.log(`[RSVP Frontend Fetch] Successfully loaded event '${eventData.title}' (${eventData._id || eventData.id}). Fields count: ${eventData.rsvpFormFields?.length || 0}`);
      
      // Initialize form defaults if specified
      if (eventData.rsvpFormFields && Array.isArray(eventData.rsvpFormFields)) {
        const initialDefaults: Record<string, any> = {};
        eventData.rsvpFormFields.forEach((field: IRsvpFormField) => {
          if (field.defaultValue !== undefined && field.defaultValue !== null) {
            initialDefaults[field.id] = field.defaultValue;
          }
        });
        setFormData(initialDefaults);
      }

      setEvent(eventData);
    } catch (err: any) {
      console.error('[RSVP Frontend Fetch] Error loading event:', err);
      setError(err?.response?.data?.message || err?.message || 'Event not found or registration is closed.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    if (validationErrors[id]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  // Evaluate conditional logic
  const isFieldVisible = (field: IRsvpFormField): boolean => {
    if (field.hidden) return false;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    const visibleFields = (event.rsvpFormFields || []).filter(isFieldVisible);
    const errors: Record<string, string> = {};

    visibleFields.forEach(f => {
      if (['section_title', 'paragraph', 'divider', 'html'].includes(f.type)) return;
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
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      // Find standard identity fields if mapped
      const nameField = (event.rsvpFormFields || []).find(f => 
        (f.id && f.id.toLowerCase().includes('name')) || 
        (f.label && f.label.toLowerCase().includes('name')) ||
        f.type === 'text'
      );
      const emailField = (event.rsvpFormFields || []).find(f => 
        f.type === 'email' || 
        (f.id && (f.id.toLowerCase().includes('email') || f.id.toLowerCase().includes('mail'))) ||
        (f.label && (f.label.toLowerCase().includes('email') || f.label.toLowerCase().includes('mail')))
      );
      const phoneField = (event.rsvpFormFields || []).find(f => 
        f.type === 'phone' || 
        (f.id && (f.id.toLowerCase().includes('phone') || f.id.toLowerCase().includes('tel'))) ||
        (f.label && (f.label.toLowerCase().includes('phone') || f.label.toLowerCase().includes('mobile')))
      );
      const companyField = (event.rsvpFormFields || []).find(f => 
        f.type === 'company' || 
        (f.id && (f.id.toLowerCase().includes('company') || f.id.toLowerCase().includes('org'))) ||
        (f.label && (f.label.toLowerCase().includes('company') || f.label.toLowerCase().includes('organization')))
      );

      // Search for any email in formData
      let detectedEmail = (emailField ? formData[emailField.id] : null) || 
        formData.email || formData.f_email || formData.emailAddress || '';

      if (!detectedEmail) {
        for (const [_, val] of Object.entries(formData)) {
          if (typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
            detectedEmail = val.trim();
            break;
          }
        }
      }

      // Search for name in formData
      let detectedName = (nameField ? formData[nameField.id] : null) || 
        formData.name || formData.f_name || formData.fullName || 
        `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || '';

      if (!detectedName) {
        for (const [_, val] of Object.entries(formData)) {
          if (typeof val === 'string' && val.trim() && val.trim() !== detectedEmail && !val.includes('@') && val.length < 80) {
            detectedName = val.trim();
            break;
          }
        }
      }

      if (!detectedName) detectedName = 'WeVentureHub Guest';
      if (!detectedEmail) detectedEmail = `attendee_${Date.now().toString(36)}@weventurehub.org`;

      const attendeePhone = (phoneField ? formData[phoneField.id] : null) || 
        formData.phone || formData.f_phone || '';

      const attendeeCompany = (companyField ? formData[companyField.id] : null) || 
        formData.company || formData.f_company || '';

      const targetId = event?._id || event?.id || event?.slug || slug || 'event';

      const payload = {
        name: detectedName,
        email: detectedEmail,
        phone: attendeePhone,
        company: attendeeCompany,
        eventId: targetId,
        answers: formData
      };

      console.log(`[RSVP Frontend Submission] Submitting RSVP for event '${event.title}' (ID: ${targetId}) with payload:`, payload);

      const response = await axiosInstance.post(`/public/events/${targetId}/rsvp`, payload);
      
      console.log(`[RSVP Frontend Submission] Success response received:`, response.data.data);
      setRegistration(response.data.data);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[RSVP Frontend Submission] Submission error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit RSVP. Please try again.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
        <div className="w-12 h-12 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Loading RSVP Form...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900 mb-2">Registration Unavailable</h1>
        <p className="text-neutral-500 mb-8 max-w-sm">{error || 'Something went wrong.'}</p>
        <Link to="/events">
          <Button variant="secondary">Browse WeVentureHub Events</Button>
        </Link>
      </div>
    );
  }

  const appearance: IRsvpFormAppearance = event.rsvpFormAppearance || {};
  const borderRadius = appearance.borderRadius !== undefined ? appearance.borderRadius : 16;
  const buttonRadius = appearance.buttonRadius !== undefined ? appearance.buttonRadius : borderRadius;
  const buttonColor = appearance.buttonColor || '#84CC16';
  const buttonTextColor = appearance.buttonTextColor || '#FFFFFF';

  // Sort fields strictly according to configured builder order
  const fields: IRsvpFormField[] = (event.rsvpFormFields || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  console.log(`[RSVP Frontend Renderer] Rendering ${fields.length} RSVP fields for event '${event.title}' in configured order.`);

  const formattedDate = event.schedule?.startDate ? (() => {
    try {
      return format(new Date(event.schedule.startDate), 'EEEE, MMM dd, yyyy');
    } catch {
      return 'Date TBA';
    }
  })() : 'Date TBA';

  const formattedTime = event.schedule?.startDate ? (() => {
    try {
      return format(new Date(event.schedule.startDate), 'HH:mm');
    } catch {
      return '';
    }
  })() : '';

  // Background style computation
  const backgroundStyle: React.CSSProperties = {
    backgroundColor: appearance.backgroundColor || '#F8FAFC',
    backgroundImage: appearance.backgroundGradient 
      ? appearance.backgroundGradient 
      : appearance.backgroundImage 
      ? `url(${appearance.backgroundImage})` 
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: appearance.fontFamily || 'inherit'
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center overflow-y-auto overflow-x-hidden py-8 sm:py-12 px-3 sm:px-6"
      style={backgroundStyle}
    >
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-white overflow-visible shadow-2xl border border-neutral-200 h-auto mb-16"
            style={{ 
              borderRadius: `${borderRadius}px`,
              backgroundColor: appearance.cardBackground || '#FFFFFF'
            }}
          >
            {/* 1. Event Banner / Header */}
            {(appearance.bannerUrl || appearance.headerImage || event.media?.bannerUrl) ? (
              <div 
                className="w-full h-48 sm:h-56 md:h-64 overflow-hidden bg-neutral-950"
                style={{
                  borderTopLeftRadius: `${borderRadius}px`,
                  borderTopRightRadius: `${borderRadius}px`,
                }}
              >
                <img 
                  src={appearance.bannerUrl || appearance.headerImage || event.media?.bannerUrl} 
                  alt={event.title || 'Event Banner'} 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : null}

            <div className="p-6 md:p-10 space-y-6">
               {/* Event Header Info */}
               <div className="flex flex-col items-center text-center space-y-4">
                 {appearance.eventLogo && (
                   <img src={appearance.eventLogo} alt="Logo" className="h-12 mb-2 object-contain" />
                 )}
                 <h1 
                   className="text-2xl md:text-3xl font-black tracking-tight break-words whitespace-normal"
                   style={{ color: appearance.textColor || '#0F172A' }}
                 >
                   {event.title}
                 </h1>
                 <p className="text-xs md:text-sm text-neutral-500 max-w-lg mx-auto font-medium leading-relaxed break-words whitespace-normal">
                   {event.description}
                 </p>
                 
                 <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
                      <Calendar className="w-3.5 h-3.5 text-neutral-800" />
                      <span>{formattedDate}</span>
                    </div>
                    {formattedTime && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-neutral-800" />
                        <span>{formattedTime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
                      <MapPin className="w-3.5 h-3.5 text-neutral-800" />
                      <span>WeVentureHub Hall</span>
                    </div>
                 </div>
               </div>

               <hr className="border-neutral-100 my-6" />

               {/* Dynamic RSVP Form Fields */}
               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                   {fields.filter(isFieldVisible).map((field) => {
                     const widthClass = 
                       field.width === 'half' ? 'col-span-12 md:col-span-6' :
                       field.width === 'third' ? 'col-span-12 md:col-span-4' : 'col-span-12';

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
                       <div key={field.id} id={`field-${field.id}`} className={`${widthClass} space-y-1.5`}>
                          {field.type === 'section_title' ? (
                            <h3 className="text-base font-black text-neutral-900 pt-4 pb-1 border-b border-neutral-200 break-words whitespace-normal">
                              {field.label}
                            </h3>
                          ) : field.type === 'paragraph' ? (
                            <p className="text-xs text-neutral-600 leading-relaxed italic break-words whitespace-pre-line p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
                              {field.label}
                            </p>
                          ) : field.type === 'divider' ? (
                            <hr className="my-2 border-neutral-200" />
                          ) : (
                            <>
                              <label className="text-xs font-bold text-neutral-800 flex items-center justify-between gap-2">
                                <span className="break-words whitespace-normal leading-snug">
                                  {field.label}
                                  {field.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                                </span>
                              </label>

                              {field.type === 'textarea' ? (
                                <textarea
                                  placeholder={field.placeholder || 'Enter your message...'}
                                  rows={3}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                                  className={`w-full p-3 bg-neutral-50 border rounded-xl text-xs focus:bg-white focus:outline-none transition-all ${
                                    hasError ? 'border-rose-400 bg-rose-50/30' : 'border-neutral-200 focus:border-[#0F172A]'
                                  }`}
                                />
                              ) : ['dropdown'].includes(field.type) ? (
                                <select
                                  value={formData[field.id] || ''}
                                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                                  className={`w-full p-3 bg-neutral-50 border rounded-xl text-xs focus:bg-white focus:outline-none transition-all ${
                                    hasError ? 'border-rose-400 bg-rose-50/30' : 'border-neutral-200 focus:border-[#0F172A]'
                                  }`}
                                >
                                  <option value="">{field.placeholder || 'Select an option...'}</option>
                                  {(field.options || []).map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : field.type === 'radio' ? (
                                <div className="space-y-2">
                                  {(field.options || ['Option 1', 'Option 2']).map((opt, i) => (
                                    <label key={i} className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-100/60 transition-colors">
                                      <input
                                        type="radio"
                                        name={field.id}
                                        value={opt}
                                        checked={formData[field.id] === opt}
                                        onChange={() => handleInputChange(field.id, opt)}
                                        className="w-4 h-4 text-[#0F172A] mt-0.5 shrink-0"
                                      />
                                      <span className="text-xs text-neutral-800 font-medium break-words whitespace-normal flex-1">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : field.type === 'checkbox' || field.type === 'multiselect' ? (
                                <div className="space-y-2">
                                  {(field.options || ['Option 1', 'Option 2']).map((opt, i) => {
                                    const currentArr = Array.isArray(formData[field.id]) ? formData[field.id] : [];
                                    const isChecked = currentArr.includes(opt);
                                    return (
                                      <label key={i} className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-100/60 transition-colors">
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
                                          className="w-4 h-4 rounded text-[#0F172A] mt-0.5 shrink-0"
                                        />
                                        <span className="text-xs text-neutral-800 font-medium break-words whitespace-normal flex-1">{opt}</span>
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
                                      className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                        formData[field.id] === choice
                                          ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                                      }`}
                                    >
                                      {choice}
                                    </button>
                                  ))}
                                </div>
                              ) : field.type === 'rating' ? (
                                <div className="flex gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200 w-fit">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleInputChange(field.id, star)}
                                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                    >
                                      <Star className={`w-5 h-5 ${
                                        (formData[field.id] || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                                      }`} />
                                    </button>
                                  ))}
                                </div>
                              ) : ['consent', 'terms'].includes(field.type) ? (
                                <label className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-100/60 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={!!formData[field.id]}
                                    onChange={(e) => handleInputChange(field.id, e.target.checked)}
                                    className="w-4 h-4 rounded text-[#0F172A] mt-0.5 shrink-0"
                                  />
                                  <span className="text-xs text-neutral-700 leading-relaxed font-medium break-words whitespace-normal flex-1">
                                    {field.label}
                                  </span>
                                </label>
                              ) : field.type === 'signature' ? (
                                <div className="space-y-1.5">
                                  <div className="h-20 w-full bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl p-3 flex flex-col justify-end">
                                    <input
                                      type="text"
                                      placeholder="Type your full legal name as digital signature..."
                                      value={formData[field.id] || ''}
                                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                                      className="w-full bg-transparent border-b border-neutral-400 font-serif italic text-sm text-neutral-900 focus:outline-none focus:border-[#0F172A]"
                                    />
                                  </div>
                                </div>
                              ) : ['file', 'image'].includes(field.type) ? (
                                <div className="p-4 border-2 border-dashed border-neutral-300 rounded-xl bg-neutral-50 text-center space-y-1">
                                  <p className="text-xs font-bold text-neutral-700">{field.placeholder || 'Choose file or drag & drop'}</p>
                                  <p className="text-[10px] text-neutral-400">PDF, JPG, PNG up to 10MB</p>
                                </div>
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
                                  className={`w-full px-3.5 py-3 bg-neutral-50 border rounded-xl text-xs focus:bg-white focus:outline-none transition-all ${
                                    hasError ? 'border-rose-400 bg-rose-50/30' : 'border-neutral-200 focus:border-[#0F172A]'
                                  }`}
                                />
                              )}

                              {field.description && (
                                <p className="text-[10px] text-neutral-400 break-words whitespace-normal">{field.description}</p>
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

                 {/* Submit Button */}
                 <div className="pt-6 space-y-3">
                   <button
                     type="submit"
                     disabled={submitting}
                     className="w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl transition-all hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                     style={{ 
                       backgroundColor: buttonColor,
                       color: buttonTextColor,
                       borderRadius: `${buttonRadius}px` 
                     }}
                   >
                     {submitting ? (
                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     ) : (
                       <>
                          <span>{appearance.buttonText || 'Complete Registration'}</span>
                          <ChevronRight className="w-4 h-4" />
                       </>
                     )}
                   </button>

                   <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                     <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                     <span>{appearance.footerText || "SECURE EVENT REGISTRATION POWERED BY WEVENTUREHUB"}</span>
                   </div>
                 </div>
               </form>
            </div>
          </motion.div>
        ) : (
          /* Confirmation Success Screen */
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl text-center mb-16"
          >
            <div 
              className="bg-white p-8 md:p-12 shadow-2xl mb-8 border border-neutral-200" 
              style={{ borderRadius: `${borderRadius}px` }}
            >
               <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle className="w-10 h-10 text-emerald-500" />
               </div>
               
               <h2 className="text-2xl md:text-3xl font-black text-neutral-900 mb-2">You're Registered!</h2>
               <p className="text-xs md:text-sm text-neutral-500 mb-8 leading-relaxed">
                 {appearance.successMessage || `Thank you for registering for ${event.title}. We've confirmed your spot and generated your official attendee pass.`}
               </p>

               {/* Digital Ticket Preview */}
               <div id="printable-ticket" className="bg-neutral-900 rounded-3xl p-6 text-white text-left shadow-2xl relative overflow-hidden mb-6">
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Official Event Pass</p>
                      <h3 className="text-lg font-black leading-tight mt-0.5">{event.title}</h3>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                       <Ticket className="w-5 h-5 text-lime-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 relative z-10 text-xs">
                     <div>
                       <p className="text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Attendee</p>
                       <p className="font-black text-white">{registration?.attendeeName || 'Guest'}</p>
                     </div>
                     <div>
                       <p className="text-[9px] font-bold text-neutral-400 uppercase mb-0.5">Ticket ID</p>
                       <p className="font-black font-mono text-emerald-400">{registration?.ticketNumber || 'WVH-PASS-CONFIRMED'}</p>
                     </div>
                  </div>

                  <div className="flex items-center space-x-4 relative z-10 bg-white rounded-2xl p-4 text-neutral-900">
                     <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center shrink-0">
                        {registration?.qrCode ? (
                           <img 
                             src={registration.qrCode} 
                             alt="QR Code" 
                             className="w-full h-full object-contain"
                             referrerPolicy="no-referrer"
                           />
                         ) : (
                           <QrCode className="w-full h-full text-neutral-900 p-1" />
                         )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase">Scan at Entrance</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Show this pass on your phone upon arrival at WeVentureHub Hall.</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="primary" 
                    className="w-full h-12 font-black text-xs space-x-2 cursor-pointer"
                    onClick={() => window.print()}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Pass</span>
                  </Button>
                  <Link to="/events" className="w-full">
                    <Button variant="secondary" className="w-full h-12 font-black text-xs cursor-pointer">
                      More Events
                    </Button>
                  </Link>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

