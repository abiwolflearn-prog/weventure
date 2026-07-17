import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building, 
  MapPin, 
  Globe, 
  Mail, 
  Calendar, 
  ArrowLeft, 
  Users, 
  CheckCircle,
  ExternalLink,
  Star,
  Phone,
  Clock,
  Send,
  MessageSquare,
  Award,
  Camera,
  Layers,
  Sparkles,
  Heart,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { axiosInstance } from '../lib/axiosInstance';
import { Button } from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrganizerProfilePage() {
  const { id } = useParams();

  const [organizer, setOrganizer] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingCount, setFollowingCount] = useState(148);

  // Contact form submission states
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Workspace booking modal lead capture states
  const [bookingWorkspace, setBookingWorkspace] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchWebsiteData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch organizer website & white-label branding data
        const webRes = await axiosInstance.get(`/public/organizers/${id}/website`);
        const orgData = webRes.data.data;
        setOrganizer(orgData);

        // Sync local following state
        const followingList = JSON.parse(localStorage.getItem('weventurehub_following') || '[]');
        const following = followingList.includes(id);
        setIsFollowing(following);
        setFollowingCount(following ? 149 : 148);

        // 2. Fetch events matching this organizer's tenantId
        const eventsRes = await axiosInstance.get('/public/events', {
          params: { tenantId: id, limit: 50 }
        });
        setEvents(eventsRes.data.data || []);

        // 3. Fetch workspaces matching this organizer's tenantId
        const workspacesRes = await axiosInstance.get('/public/workspaces', {
          params: { tenantId: id }
        });
        setWorkspaces(workspacesRes.data.data || []);

        // 4. Update Document Header SEO Titles & OpenGraph tags dynamically
        const seo = orgData?.website?.seo || {};
        document.title = seo.metaTitle || `${orgData.name} | Premium Workspace Hub`;
        
        // Dynamically append / update SEO meta tags
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', seo.metaDescription || orgData.description || '');

        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', seo.metaKeywords?.join(', ') || 'workspace, events, corporate');

        // Fetch Structured Schema JSON-LD and inject to body
        const structuredRes = await axiosInstance.get(`/public/seo/${id}/structured-data`);
        const existingScript = document.getElementById('seo-structured-data-script');
        if (existingScript) {
          existingScript.remove();
        }
        const script = document.createElement('script');
        script.id = 'seo-structured-data-script';
        script.type = 'application/ld+json';
        script.text = JSON.stringify(structuredRes.data);
        document.body.appendChild(script);

      } catch (err: any) {
        console.error('Failed to load organizer website variables:', err);
        setError('Public organization details could not be verified on this cluster.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWebsiteData();
    }
  }, [id]);

  // Dynamically load Google Fonts custom white-labeled typography
  useEffect(() => {
    const fontFamily = organizer?.branding?.typography?.fontFamily;
    if (fontFamily) {
      const link = document.createElement('link');
      link.id = 'dynamic-white-label-font';
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      return () => {
        const addedLink = document.getElementById('dynamic-white-label-font');
        if (addedLink) addedLink.remove();
      };
    }
  }, [organizer]);

  const handleFollowToggle = () => {
    if (!id) return;
    const followingList = JSON.parse(localStorage.getItem('weventurehub_following') || '[]');
    let newList;
    if (isFollowing) {
      newList = followingList.filter((fId: string) => fId !== id);
      setIsFollowing(false);
      setFollowingCount(prev => prev - 1);
    } else {
      newList = [...followingList, id];
      setIsFollowing(true);
      setFollowingCount(prev => prev + 1);
    }
    localStorage.setItem('weventurehub_following', JSON.stringify(newList));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    try {
      setContactSubmitting(true);
      // Simulate real lead submission and log to tenant CRM index
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setContactSubmitted(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleBookWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail || !bookingDate || !bookingTime) return;

    try {
      // Simulate reserving hours
      await new Promise((resolve) => setTimeout(resolve, 800));
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setBookingWorkspace(null);
        setBookingName('');
        setBookingEmail('');
        setBookingDate('');
        setBookingTime('');
      }, 3500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-40 space-y-4 max-w-xl mx-auto">
        <Building className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm font-semibold text-neutral-slate-500 animate-pulse">Querying white-labeled tenant environment & layout configs...</p>
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-bold text-xl text-neutral-slate-900">Tenant Website Offline</h1>
          <p className="text-xs text-neutral-slate-400 leading-relaxed">{error || 'This tenant organizer does not have an active subscription or configuration.'}</p>
        </div>
        <Link to="/events">
          <Button variant="secondary" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            <span>Discover Other Public Events</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Parse custom white-label branding configurations
  const branding = organizer.branding || {};
  const website = organizer.website || {};
  const primaryColor = branding.primaryColor || '#4f46e5';
  const secondaryColor = branding.secondaryColor || '#0ea5e9';
  const accentColor = branding.accentColor || '#f59e0b';
  const logoUrl = branding.logoUrl;
  const fontFamily = branding.typography?.fontFamily || 'Inter';
  const borderRadius = branding.typography?.borderRadius || 'md';

  // Map borderRadius settings to Tailwind class strings
  const getRadiusClass = (type: string) => {
    if (type === 'none') return 'rounded-none';
    if (type === 'sm') return 'rounded-sm';
    if (type === 'md') return 'rounded-lg';
    if (type === 'lg') return 'rounded-2xl';
    if (type === 'full') return 'rounded-3xl';
    return 'rounded-xl';
  };

  const roundedClass = getRadiusClass(borderRadius);

  // If public website is disabled, show a minimalist notice or fall back gracefully
  if (website.enabled === false) {
    return (
      <div className="max-w-lg mx-auto py-28 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100">
          <Globe className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-bold text-xl text-neutral-slate-900">Website Not Configured</h1>
          <p className="text-xs text-neutral-slate-400 leading-relaxed">
            The organizer has not yet enabled the "Public Website Module" under their SaaS control settings.
          </p>
        </div>
        <Link to="/events">
          <Button variant="secondary" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            <span>Discover Events Instead</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Set up default config values if missing in website JSON
  const hero = website.hero || {
    title: `${organizer.name} Workspace & Events`,
    subtitle: 'Establish, coordinate, and host premium workspace boards and interactive user experiences.',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
    ctaText: 'Explore Experiences',
    ctaLink: '#events'
  };

  const about = website.about || {
    title: 'Our Narrative',
    description: organizer.description || 'We are committed to delivering outstanding workspace bookings and event management solutions tailored to ambitious operations.',
    foundingYear: 2024,
    highlights: ['Tailored boardrooms', 'High-speed fiber web', 'Active workshops', 'Professional hospitality']
  };

  const team = website.team || [];
  const gallery = website.gallery || [];
  const testimonials = website.testimonials || [];

  return (
    <div 
      className="bg-neutral-50 text-neutral-slate-900 min-h-screen relative selection:bg-brand-primary/10 transition-colors duration-300"
      style={{ fontFamily: `"${fontFamily}", "Inter", sans-serif` }}
    >
      {/* 1. Global Custom Theme CSS Variables Injected in Page */}
      <style>{`
        :root {
          --brand-primary: ${primaryColor};
          --brand-primary-hover: ${primaryColor}dd;
          --brand-secondary: ${secondaryColor};
          --brand-accent: ${accentColor};
        }
        .text-brand-primary { color: var(--brand-primary); }
        .bg-brand-primary { background-color: var(--brand-primary); }
        .border-brand-primary { border-color: var(--brand-primary); }
        .hover\\:bg-brand-primary-hover:hover { background-color: var(--brand-primary-hover); }
        .scroll-smooth { scroll-behavior: smooth; }
      `}</style>

      {/* 2. White-Labeled Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 flex items-center justify-center font-display font-black text-white shrink-0 shadow-sm`} style={{ backgroundColor: primaryColor, borderRadius: borderRadius === 'full' ? '9999px' : '8px' }}>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={organizer.name} 
                  className="w-full h-full object-cover" 
                  style={{ borderRadius: borderRadius === 'full' ? '9999px' : '8px' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                organizer.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-tight text-neutral-900 flex items-center gap-1.5">
                {organizer.name}
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
              </span>
              <span className="text-[9px] text-neutral-slate-400 font-mono block">Organized on Platform</span>
            </div>
          </Link>

          {/* Dynamic Navigation Sections */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-neutral-slate-600">
            <a href="#about" className="hover:text-neutral-900 transition-colors">About</a>
            {events.length > 0 && <a href="#events" className="hover:text-neutral-900 transition-colors">Events</a>}
            {workspaces.length > 0 && <a href="#workspaces" className="hover:text-neutral-900 transition-colors">Workspaces</a>}
            {team.length > 0 && <a href="#team" className="hover:text-neutral-900 transition-colors">Team</a>}
            {gallery.length > 0 && <a href="#gallery" className="hover:text-neutral-900 transition-colors">Gallery</a>}
            {testimonials.length > 0 && <a href="#testimonials" className="hover:text-neutral-900 transition-colors">Testimonials</a>}
            <a href="#contact" className="hover:text-neutral-900 transition-colors">Contact</a>
          </nav>

          {/* Action CTA & Follow Indicator */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleFollowToggle}
              className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                isFollowing
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-slate-700'
                  : 'text-white border-transparent bg-brand-primary hover:bg-brand-primary-hover shadow-xs'
              }`}
              style={{ borderRadius: borderRadius === 'full' ? '9999px' : '8px' }}
            >
              {isFollowing ? 'Following' : 'Follow Org'}
            </button>
            <span className="text-[10px] text-neutral-slate-400 font-mono hidden sm:inline">{followingCount} followers</span>
          </div>
        </div>
      </header>

      {/* 3. Immersive HERO Banner Section */}
      <section id="hero" className="relative overflow-hidden min-h-[500px] flex items-center justify-center py-20 px-4">
        {/* Banner Image with Sleek Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={hero.backgroundImageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"} 
            alt={hero.title}
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-[1px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="px-3.5 py-1 text-[10px] uppercase font-black tracking-widest text-white border border-white/20 rounded-full inline-flex items-center space-x-1 bg-white/10">
              <Sparkles className="w-3 h-3 text-brand-primary" style={{ color: secondaryColor }} />
              <span>OFFICIAL ORGANIZATION WEBSITE</span>
            </span>
            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none">
              {hero.title}
            </h1>
            <p className="text-sm sm:text-base text-neutral-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
              {hero.subtitle}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.15, duration: 0.5 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a 
              href={hero.ctaLink || '#events'} 
              className={`px-8 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-md transition-all uppercase tracking-wider`}
              style={{ borderRadius: borderRadius === 'full' ? '9999px' : '8px' }}
            >
              {hero.ctaText || 'Explore Experiences'}
            </a>
            <a 
              href="#contact" 
              className={`px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold backdrop-blur-xs transition-all uppercase tracking-wider`}
              style={{ borderRadius: borderRadius === 'full' ? '9999px' : '8px' }}
            >
              Get In Touch
            </a>
          </motion.div>
        </div>
      </section>

      {/* 4. White-Labeled ABOUT NARRATIVE Section */}
      <section id="about" className="py-20 bg-white border-b border-neutral-200/60 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual Left Badge Column */}
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 text-xs font-black uppercase tracking-wider" style={{ color: primaryColor }}>
                <Award className="w-4 h-4" />
                <span>About Our Workspace Platform</span>
              </div>
              <h2 className="font-display font-black text-3xl text-neutral-slate-900 tracking-tight leading-none">
                {about.title}
              </h2>
              <div className="w-16 h-1" style={{ backgroundColor: primaryColor }} />
              
              <p className="text-xs sm:text-sm text-neutral-slate-600 leading-relaxed font-light">
                {about.description}
              </p>

              <div className="pt-4">
                <span className="text-[11px] text-neutral-slate-400 block font-mono">ESTABLISHED PARTITION</span>
                <span className="text-3xl font-display font-black text-neutral-900 block mt-0.5">Founding Year: {about.foundingYear}</span>
              </div>
            </div>

            {/* highlights checkmarks */}
            <div className="bg-neutral-slate-50 border border-neutral-slate-200 p-6 sm:p-8 space-y-6" style={{ borderRadius: borderRadius === 'full' ? '24px' : '16px' }}>
              <h3 className="font-display font-bold text-sm uppercase text-neutral-slate-500 tracking-wider">Premium Member Amenities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {about.highlights?.map((hl: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-slate-700">{hl}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 border border-dashed border-neutral-slate-200 bg-white rounded-xl flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-brand-primary flex items-center justify-center shrink-0" style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}>
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-neutral-slate-800 block">Enterprise White-Label Protection</span>
                  <span className="text-[10px] text-neutral-slate-400 block mt-0.5">Transactions fully encrypted via TLS endpoints.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Active EVENTS Section */}
      {events.length > 0 && (
        <section id="events" className="py-20 bg-neutral-50 border-b border-neutral-200/60 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-200/60 pb-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>EXPERIENCES DIRECTORY</span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-slate-900 tracking-tight">
                  Upcoming Events & Workshops
                </h2>
              </div>
              <span className="px-3.5 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-neutral-slate-500 font-mono">
                {events.length} listed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const formattedDate = new Date(event.schedule?.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <Link
                    to={`/events/${event.slug}`}
                    key={event.id}
                    className="group bg-white border border-neutral-slate-200 hover:border-neutral-slate-300 transition-all duration-300 flex flex-col h-full shadow-xs hover:shadow-md"
                    style={{ borderRadius: borderRadius === 'full' ? '24px' : '16px' }}
                  >
                    <div className="aspect-video bg-neutral-slate-100 overflow-hidden relative" style={{ borderTopLeftRadius: borderRadius === 'full' ? '24px' : '16px', borderTopRightRadius: borderRadius === 'full' ? '24px' : '16px' }}>
                      {event.media?.bannerUrl ? (
                        <img
                          src={event.media.bannerUrl}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-slate-400">
                          <Calendar className="w-8 h-8" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-neutral-900/80 backdrop-blur-md text-white text-[9px] font-black rounded-md uppercase tracking-wider">
                        {event.category}
                      </span>
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-neutral-slate-400 block">{formattedDate}</span>
                        <h4 className="font-display font-bold text-base text-neutral-slate-900 group-hover:text-brand-primary transition truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-neutral-slate-500 leading-relaxed line-clamp-2">
                          {event.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-neutral-slate-100 pt-3 text-xs font-bold">
                        <div>
                          <span className="text-neutral-slate-400 block text-[9px] font-semibold uppercase tracking-wider">Admission Rates</span>
                          <span className="text-neutral-slate-900 font-mono text-sm font-black">
                            {event.ticketsInfo?.isFree ? (
                              <span className="text-emerald-600 uppercase tracking-wide">Free entry</span>
                            ) : (
                              `$${event.ticketsInfo?.minPrice || 0}`
                            )}
                          </span>
                        </div>

                        <span className="text-xs font-extrabold flex items-center space-x-1 group-hover:translate-x-1 transition duration-200" style={{ color: primaryColor }}>
                          <span>Get Tickets</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* 6. Active WORKSPACES Section */}
      {workspaces.length > 0 && (
        <section id="workspaces" className="py-20 bg-white border-b border-neutral-200/60 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-200/60 pb-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>WORKSPACES DIVISION</span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-slate-900 tracking-tight">
                  Collaborative Boardrooms & Desks
                </h2>
              </div>
              <span className="px-3.5 py-1 bg-neutral-slate-50 border border-neutral-slate-200 rounded-lg text-xs font-bold text-neutral-slate-500 font-mono">
                {workspaces.length} active spaces
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {workspaces.map((ws) => (
                <div 
                  key={ws._id || ws.id} 
                  className="bg-neutral-slate-50 border border-neutral-slate-200/80 rounded-2xl overflow-hidden flex flex-col sm:flex-row h-full transition duration-300 hover:border-neutral-slate-300 shadow-xs"
                >
                  <div className="w-full sm:w-2/5 aspect-video sm:aspect-auto bg-neutral-slate-200 relative shrink-0">
                    {ws.images?.[0] ? (
                      <img 
                        src={ws.images[0]} 
                        alt={ws.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-slate-400">
                        <Building className="w-8 h-8" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-neutral-900/80 backdrop-blur-md text-white text-[9px] font-black rounded-md uppercase tracking-wider">
                      {ws.type || 'Desk Space'}
                    </span>
                  </div>

                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-black text-base text-neutral-slate-900">{ws.name}</h4>
                        <span className="text-[10px] font-mono text-neutral-slate-400 font-bold uppercase">Max {ws.capacity || 4} Guests</span>
                      </div>
                      <p className="text-xs text-neutral-slate-500 leading-relaxed font-light">{ws.description}</p>
                      
                      {/* Amenities lists */}
                      {ws.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {ws.amenities.map((am: string, index: number) => (
                            <span key={index} className="px-2 py-0.5 bg-white border text-neutral-slate-500 text-[9px] font-semibold rounded-md">
                              {am}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-neutral-slate-200/60 pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-neutral-slate-400 block font-bold uppercase">Hourly Pricing</span>
                        <span className="text-sm font-mono font-black text-neutral-900">${ws.pricing?.hourlyRate || 25}/hr</span>
                      </div>

                      <button
                        onClick={() => setBookingWorkspace(ws)}
                        className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs"
                        style={{ backgroundColor: primaryColor, borderRadius: borderRadius === 'full' ? '9999px' : '8px' }}
                      >
                        Book Workspace
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 7. WHITE-LABELED TEAM LIST Section */}
      {team.length > 0 && (
        <section id="team" className="py-20 bg-neutral-50 border-b border-neutral-200/60 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>PEOPLE & LEADERS</span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-slate-900 tracking-tight leading-none">
                Meet Our Professional Curators
              </h2>
              <p className="text-xs text-neutral-slate-400">Our dedicated operations curators manage our premium space schedules and experience boards.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((member: any, index: number) => (
                <div 
                  key={index}
                  className="bg-white border border-neutral-slate-200 p-6 flex flex-col items-center text-center space-y-4 shadow-xs"
                  style={{ borderRadius: borderRadius === 'full' ? '24px' : '16px' }}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-neutral-slate-200">
                    <img 
                      src={member.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-neutral-900">{member.name}</h4>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold" style={{ color: secondaryColor }}>{member.role}</span>
                  </div>
                  <p className="text-[11px] text-neutral-slate-400 leading-relaxed font-light">{member.bio}</p>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 8. WHITE-LABELED GALLERY MOSAIC Section */}
      {gallery.length > 0 && (
        <section id="gallery" className="py-20 bg-white border-b border-neutral-200/60 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-200/60 pb-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>PHOTO DIARY</span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-slate-900 tracking-tight">
                  Explore Our Creative Spaces
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-slate-400">Capturing local environments</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((item: any, index: number) => (
                <div 
                  key={index}
                  className="group relative aspect-video bg-neutral-100 overflow-hidden shadow-xs cursor-pointer border border-neutral-slate-200"
                  style={{ borderRadius: borderRadius === 'full' ? '24px' : '16px' }}
                >
                  <img 
                    src={item.url} 
                    alt={item.caption} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-xs font-bold text-white tracking-wide">{item.caption}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 9. TESTIMONIALS Carousel Section */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="py-20 bg-neutral-50 border-b border-neutral-200/60 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>CLIENT INSIGHTS</span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-slate-900 tracking-tight leading-none">
                Endorsed by Fast-Growing Teams
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((test: any, index: number) => (
                <div 
                  key={index}
                  className="bg-white border border-neutral-slate-200 p-6 sm:p-8 flex flex-col justify-between space-y-6"
                  style={{ borderRadius: borderRadius === 'full' ? '24px' : '16px' }}
                >
                  <p className="text-xs sm:text-sm text-neutral-slate-600 leading-relaxed font-light italic">
                    "{test.text}"
                  </p>

                  <div className="flex items-center justify-between border-t border-neutral-slate-100 pt-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border">
                        <img 
                          src={test.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"} 
                          alt={test.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-xs text-neutral-slate-900">{test.name}</h4>
                        <span className="text-[10px] text-neutral-slate-400 block font-bold">{test.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-0.5">
                      {Array.from({ length: test.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 10. LEAD CAPTURE CONTACT FORM Section */}
      <section id="contact" className="py-20 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* Contact details left */}
            <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
              <div className="space-y-6">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>PARTITION ADRESSES</span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-slate-900 tracking-tight leading-none">
                  Reach Out to Our Operations
                </h2>
                <p className="text-xs text-neutral-slate-500 leading-relaxed font-light">
                  Have inquiries regarding long-term lease discounts, dynamic corporate memberships, or event check-ins? Complete the form.
                </p>

                <div className="space-y-4 pt-4 text-xs">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-neutral-slate-100 border text-neutral-slate-500 flex items-center justify-center shrink-0">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-slate-400 block font-bold uppercase">Workspace Hub Station</span>
                      <span className="text-neutral-slate-700 font-semibold block">742 Corporate Way, Silicon Suite 41</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-neutral-slate-100 border text-neutral-slate-500 flex items-center justify-center shrink-0">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-slate-400 block font-bold uppercase">SaaS Communication Link</span>
                      <span className="text-neutral-slate-700 font-semibold block">{organizer.settings?.supportEmail || 'operations@weventurehub.com'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-neutral-slate-100 border text-neutral-slate-500 flex items-center justify-center shrink-0">
                      <Phone className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-slate-400 block font-bold uppercase">Direct Support Desk</span>
                      <span className="text-neutral-slate-700 font-semibold block">+1 (800) 555-0149</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-neutral-slate-50 border border-neutral-slate-200 rounded-xl text-[10px] text-neutral-slate-400 font-mono">
                System Timezone matching: {organizer.settings?.timezone || 'UTC'} • Node cluster status: ONLINE
              </div>
            </div>

            {/* lead capture form right */}
            <div className="lg:col-span-7 bg-neutral-slate-50 border border-neutral-slate-200 p-6 sm:p-8" style={{ borderRadius: borderRadius === 'full' ? '24px' : '16px' }}>
              <AnimatePresence mode="wait">
                {contactSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-base text-neutral-900">Lead Despatched Successfully</h3>
                      <p className="text-xs text-neutral-slate-500 max-w-sm">
                        Thank you for your transmission. An operations manager from {organizer.name} will reach out to you within 24 business hours.
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setContactSubmitted(false)}
                      className="text-xs"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <h3 className="font-display font-bold text-sm uppercase text-neutral-slate-500 tracking-wider">Send Local Message</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-slate-500 uppercase tracking-wider block font-bold">Your Name</label>
                        <input 
                          type="text" 
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Jane Doe"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-slate-200 bg-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-slate-500 uppercase tracking-wider block font-bold">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="jane@company.com"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-slate-200 bg-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-slate-500 uppercase tracking-wider block font-bold">Message Details</label>
                      <textarea 
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Inquire about boardrooms, event check-ins or pricing models..."
                        className="w-full p-2.5 text-xs rounded-xl border border-neutral-slate-200 bg-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={contactSubmitting}
                      className="w-full h-11 flex items-center justify-center space-x-2 text-white text-xs font-bold transition-all hover:bg-brand-primary-hover shadow-xs"
                      style={{ backgroundColor: primaryColor, borderRadius: borderRadius === 'full' ? '9999px' : '8px' }}
                    >
                      {contactSubmitting ? (
                        <span>Simulating transmission...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Dispatch Message Lead</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* 11. White-labeled Footer */}
      <footer className="bg-neutral-900 text-white py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-slate-400">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-display font-black text-xs text-white">
              {organizer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-white block">{organizer.name}</span>
              <span className="text-[10px] block text-neutral-slate-500">Fully white-labeled tenant partition website.</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a href="#about" className="hover:text-white transition">About</a>
            <a href="#events" className="hover:text-white transition">Events</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </div>

          <p className="text-[10px] text-neutral-slate-500 font-mono">
            &copy; {new Date().getFullYear()} {organizer.name}. Handled securely on SaaS workspace framework.
          </p>
        </div>
      </footer>

      {/* 12. Interactive Workspace Booking Lead Modal */}
      <AnimatePresence>
        {bookingWorkspace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setBookingWorkspace(null)}
              className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs" 
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-slate-200 rounded-3xl max-w-md w-full overflow-hidden p-6 relative z-10 space-y-6 shadow-2xl"
            >
              <div className="space-y-1">
                <h3 className="font-display font-black text-lg text-neutral-slate-900">Reserve hours: {bookingWorkspace.name}</h3>
                <p className="text-xs text-neutral-slate-400 font-light">Secure hours inside this creative boardroom instantly.</p>
              </div>

              {bookingSuccess ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-neutral-slate-800 block">Workspace Reservation Dispatched</span>
                    <span className="text-[10px] text-neutral-slate-400 block mt-1">Our system generated a temporary ledger invoice code. A manager will email booking guidelines shortly!</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookWorkspace} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-slate-400 block uppercase">Target Date</label>
                      <input 
                        type="date" 
                        required 
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-primary" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-slate-400 block uppercase">Start Time</label>
                      <input 
                        type="time" 
                        required 
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-primary" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-slate-400 block uppercase">Your Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Alex Chen"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-primary" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-slate-400 block uppercase">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="alex@company.com"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-brand-primary" 
                    />
                  </div>

                  <div className="pt-2 flex justify-between gap-3">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setBookingWorkspace(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 text-white text-xs font-bold transition-all hover:bg-brand-primary-hover shadow-xs"
                      style={{ backgroundColor: primaryColor, borderRadius: borderRadius === 'full' ? '9999px' : '8px' }}
                    >
                      Confirm Booking Request
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

