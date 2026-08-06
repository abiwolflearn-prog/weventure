import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Ticket,
  QrCode,
  Download,
  Share2,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { axiosInstance } from '../lib/axiosInstance';
import { IEvent, IRsvpFormField, IRsvpFormAppearance } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
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

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const fetchEvent = async () => {
    try {
      const response = await axiosInstance.get(`/public/events/slug/${slug}`);
      setEvent(response.data.data);
    } catch (err) {
      setError('Event not found or registration is closed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSubmitting(true);
    try {
      // Basic fields mapping
      const payload = {
        name: formData.name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim(),
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        answers: formData
      };

      const response = await axiosInstance.post(`/public/events/${event.id}/rsvp`, payload);
      setRegistration(response.data.data);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-slate-50">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900 mb-2">Oops!</h1>
        <p className="text-neutral-500 mb-8 max-w-sm">{error || 'Something went wrong.'}</p>
        <Link to="/events">
          <Button variant="secondary">Browse Other Events</Button>
        </Link>
      </div>
    );
  }

  const appearance: IRsvpFormAppearance = event.rsvpFormAppearance || {};
  const primaryColor = appearance.primaryColor || '#0F172A';
  const buttonColor = appearance.buttonColor || primaryColor;
  const borderRadius = appearance.borderRadius || 16;
  const fields: IRsvpFormField[] = event.rsvpFormFields?.length ? event.rsvpFormFields : [
    { id: 'name', type: 'text', label: 'Full Name', required: true, order: 0 },
    { id: 'email', type: 'email', label: 'Email Address', required: true, order: 1 },
    { id: 'phone', type: 'phone', label: 'Phone Number', required: false, order: 2 },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-12 px-6"
      style={{ backgroundColor: appearance.backgroundColor || '#F9FAFB' }}
    >
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-white overflow-hidden shadow-2xl"
            style={{ 
                borderRadius: `${borderRadius}px`,
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

            <div className="p-8 md:p-12">
               {/* Event Header */}
               <div className="flex flex-col items-center text-center mb-10">
                 {appearance.eventLogo && (
                   <img src={appearance.eventLogo} alt="Logo" className="h-12 mb-6 object-contain" />
                 )}
                 <h1 className="text-3xl font-black text-neutral-900 mb-4">{event.title}</h1>
                 
                 <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-500 font-medium">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      <span>{format(new Date(event.schedule.startDate), 'EEEE, MMM dd')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-brand-primary" />
                      <span>{format(new Date(event.schedule.startDate), 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-brand-primary" />
                      <span>WeVentureHub Hall</span>
                    </div>
                 </div>
               </div>

               {/* RSVP Form */}
               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 gap-6">
                   {fields.sort((a, b) => a.order - b.order).map((field) => (
                     <div key={field.id} className="space-y-2">
                        {field.type === 'section_title' ? (
                          <h3 className="text-lg font-black text-neutral-900 mt-6 pt-6 border-t">{field.label}</h3>
                        ) : field.type === 'divider' ? (
                          <hr className="my-6" />
                        ) : field.type === 'paragraph' ? (
                          <p className="text-sm text-neutral-500 leading-relaxed">{field.label}</p>
                        ) : (
                          <>
                            <label className="text-xs font-black text-neutral-700 flex items-center space-x-1 uppercase tracking-wider">
                              <span>{field.label}</span>
                              {field.required && <span className="text-rose-500">*</span>}
                            </label>
                            
                            {field.type === 'textarea' ? (
                              <textarea
                                required={field.required}
                                placeholder={field.placeholder}
                                className="w-full p-4 border-2 border-neutral-100 rounded-2xl text-sm focus:border-brand-primary focus:ring-0 transition-colors min-h-[120px]"
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                              />
                            ) : field.type === 'dropdown' || field.type === 'multiselect' ? (
                               <select
                                 required={field.required}
                                 className="w-full p-4 border-2 border-neutral-100 rounded-2xl text-sm focus:border-brand-primary focus:ring-0 transition-colors appearance-none bg-white"
                                 onChange={(e) => handleInputChange(field.id, e.target.value)}
                               >
                                 <option value="">Select an option</option>
                                 {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                               </select>
                            ) : (
                              <Input
                                type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                                required={field.required}
                                placeholder={field.placeholder}
                                className="h-14 border-2 border-neutral-100 rounded-2xl"
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                              />
                            )}
                            {field.description && <p className="text-[10px] text-neutral-400">{field.description}</p>}
                          </>
                        )}
                     </div>
                   ))}
                 </div>

                 <button
                   type="submit"
                   disabled={submitting}
                   className="w-full py-5 text-sm font-black text-white shadow-xl transform active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                   style={{ 
                     backgroundColor: buttonColor,
                     borderRadius: `${borderRadius}px` 
                   }}
                 >
                   {submitting ? (
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <>
                        <span>{appearance.buttonText || 'Confirm My RSVP'}</span>
                        <ChevronRight className="w-4 h-4" />
                     </>
                   )}
                 </button>
               </form>
            </div>

            {/* Footer */}
            <div className="p-6 bg-neutral-slate-50 border-t text-center">
               <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                 {appearance.footerText || "WeVentureHub Secure Event Registration"}
               </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl text-center"
          >
            <div className="bg-white p-12 shadow-2xl mb-8" style={{ borderRadius: `${borderRadius}px` }}>
               <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                 <CheckCircle className="w-10 h-10 text-emerald-500" />
               </div>
               
               <h2 className="text-3xl font-black text-neutral-900 mb-4">You're Registered!</h2>
               <p className="text-neutral-500 mb-10 leading-relaxed">
                 {appearance.successMessage || `Thank you for registering for ${event.title}. We've sent your digital ticket and confirmation details to your email.`}
               </p>

               {/* Digital Ticket Preview */}
               <div id="printable-ticket" className="bg-neutral-900 rounded-3xl p-6 text-white text-left shadow-2xl relative overflow-hidden mb-8">
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Entry Pass</p>
                      <h3 className="text-xl font-black">{event.title}</h3>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                       <Ticket className="w-5 h-5 text-brand-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
                     <div>
                       <p className="text-[9px] font-bold text-neutral-500 uppercase mb-1">Attendee</p>
                       <p className="text-sm font-black">{registration?.attendeeName}</p>
                     </div>
                     <div>
                       <p className="text-[9px] font-bold text-neutral-500 uppercase mb-1">Ticket ID</p>
                       <p className="text-sm font-black font-mono">{registration?.ticketNumber}</p>
                     </div>
                  </div>

                  <div className="flex items-center space-x-6 relative z-10 bg-white rounded-2xl p-4">
                     <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <QrCode className="w-full h-full text-neutral-900" />
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-neutral-900 uppercase">Scan at Entrance</p>
                        <p className="text-[10px] text-neutral-500 mt-1">Please have this QR code ready on your device for check-in.</p>
                     </div>
                  </div>

                  <div className="absolute top-[-40px] right-[-40px] w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl" />
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="primary" 
                    className="w-full h-12 font-black text-xs space-x-2"
                    onClick={() => window.print()}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </Button>
                  <Button variant="secondary" className="w-full h-12 font-black text-xs space-x-2">
                    <Share2 className="w-4 h-4" />
                    <span>Share Event</span>
                  </Button>
               </div>
            </div>

            <Link to="/events" className="text-sm font-bold text-neutral-400 hover:text-brand-primary transition-colors flex items-center justify-center space-x-2">
               <ArrowLeft className="w-4 h-4" />
               <span>Back to Events Marketplace</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
