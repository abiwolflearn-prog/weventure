import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Building, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Star, 
  Check, 
  Users, 
  Mail, 
  MapPin, 
  Phone,
  Award,
  BookOpen,
  Calendar,
  Layers,
  Heart,
  Bookmark,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/Button';
import { publicApi } from '../lib/publicApi';
// @ts-ignore
import promoAtriumImage from '../assets/images/weventurehub_atrium_1784371642621.jpg';

export default function LandingPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [bookmarkedSpaces, setBookmarkedSpaces] = useState<Record<string, boolean>>({});
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Record<string, boolean>>({});
  const [activeSlide, setActiveSlide] = useState(0);

  const toggleSpaceBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEventBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkedEvents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. Fetch dynamic homepage configuration settings
  const { data: homepage, isLoading: homepageLoading } = useQuery({
    queryKey: ['homepageConfig'],
    queryFn: publicApi.getHomepage,
  });

  // 2. Fetch real workspaces from MongoDB
  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ['publicWorkspaces'],
    queryFn: publicApi.getWorkspaces,
  });

  // 3. Fetch real sponsors from MongoDB
  const { data: sponsors } = useQuery({
    queryKey: ['publicSponsors'],
    queryFn: publicApi.getSponsors,
  });

  // 4. Fetch real partners from MongoDB
  const { data: partners } = useQuery({
    queryKey: ['publicPartners'],
    queryFn: publicApi.getPartners,
  });

  // 5. Fetch real testimonials from MongoDB
  const { data: testimonials } = useQuery({
    queryKey: ['publicTestimonials'],
    queryFn: publicApi.getTestimonials,
  });

  // 6. Fetch featured and upcoming events
  const { data: featuredEvents } = useQuery({
    queryKey: ['featuredEvents'],
    queryFn: publicApi.getFeaturedEvents,
  });

  const features = [
    {
      icon: <Building className="w-6 h-6 text-brand-primary text-blue-600" />,
      title: "Coworking & Meeting Rooms",
      desc: "Instant booking for premium meeting rooms, dedicated desks, and event zones equipped with enterprise-grade tech arrays."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Interactive Events Catalog",
      desc: "Enroll in high-fidelity accelerators, technical hackathons, demo days, pitch competitions, and developer workshops."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      title: "Secure Digital passes",
      desc: "Each member and event attendee receives a secure QR-code pass for convenient check-ins at our physical locations."
    },
    {
      icon: <Users className="w-6 h-6 text-purple-500" />,
      title: "Accelerator Mentorship",
      desc: "Book session intervals directly with WeVentureHub's industry partners, specialized tech mentors, and venture coaches."
    },
    {
      icon: <Award className="w-6 h-6 text-indigo-500" />,
      title: "Smart Certifications",
      desc: "Earn printable certificates of completion signed by program directors upon finishing our specialized training courses."
    },
    {
      icon: <BookOpen className="w-6 h-6 text-pink-500" />,
      title: "Centralized Member Ledger",
      desc: "Manage workspace booking invoices, register event tickets, track credits, and handle transactions securely from your portal."
    }
  ];

  const memberships = [
    {
      name: "Community Member",
      price: "$25",
      period: "/month",
      desc: "Perfect for remote founders, local startup operators, and community attendees.",
      features: [
        "Access to open community spaces (2 days/month)",
        "Free entry to public workshops & meetups",
        "Access to digital community directories & Slack",
        "Member rates for boardrooms ($35/hr Tesla Boardroom)",
        "Complimentary high-speed Wi-Fi & premium coffee"
      ],
      buttonText: "Join Community Network",
      link: "/register?plan=COMMUNITY",
      popular: false
    },
    {
      name: "Dedicated Hot Desk",
      price: "$150",
      period: "/month",
      desc: "Best for individual freelancers, scaling builders, and dedicated startup developers.",
      features: [
        "24/7 dedicated hot-desk workstation access",
        "10 free meeting room booking hours per month",
        "Free admission to all hackathons & trainings",
        "Business mailing address & storage locker",
        "Connection with local mentors & advisors",
        "Secure high-fidelity QR check-in codes"
      ],
      buttonText: "Reserve Dedicated Desk",
      link: "/register?plan=DESK",
      popular: true
    },
    {
      name: "Resident Startup Suite",
      price: "$650",
      period: "/month",
      desc: "Designed for high-growth incubation cohorts, venture-backed startups, and remote teams.",
      features: [
        "Private lockable physical suite for 4-12 team members",
        "Unlimited boardroom reservations (Tesla, Turing, Ada)",
        "Direct application track to startup accelerator cohort",
        "Featured booth representation on Demo Days & Pitch events",
        "Sponsor introduction pipelines & pitch coaching",
        "Printed certificates for program completions",
        "Premium support with direct physical site coordinators"
      ],
      buttonText: "Apply Resident Cohort",
      link: "/register?plan=STARTUP",
      popular: false
    }
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    
    setContactLoading(true);
    try {
      await publicApi.submitInquiry(contactForm);
      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to submit contact inquiry:', err);
    } finally {
      setContactLoading(false);
    }
  };

  // Safe Fallback content for loaders or missing DB configs
  const rawTitle = homepage?.heroTitle?.trim();
  const displayTitle = rawTitle && rawTitle.length > 0 ? rawTitle : 'Empower Your Workspace, Simplify Your Events.';
  const rawSubtitle = homepage?.heroSubtitle?.trim();
  const displaySubtitle = rawSubtitle && rawSubtitle.length > 0 ? rawSubtitle : 'Instant booking for premium meeting rooms, dedicated workspaces, and world-class accelerator programs tailored to high-growth operators.';
  const displayCtaText = homepage?.heroCtaText || 'Explore Available Spaces';
  const displayCtaLink = homepage?.heroCtaLink || '/workspaces';
  const displayHeroImage = homepage?.heroImageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200';

  // Format title words safely
  const titleWords = displayTitle.split(/\s+/);
  const mainTitleWords = titleWords.length > 3 ? titleWords.slice(0, -3).join(' ') : titleWords.slice(0, Math.max(1, titleWords.length - 1)).join(' ');
  const highlightTitleWords = titleWords.length > 3 ? titleWords.slice(-3).join(' ') : titleWords.slice(Math.max(1, titleWords.length - 1)).join(' ');

  const sliderImages = [
    displayHeroImage,
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1200',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliderImages.length]);

  const promoTitle = homepage?.promotionTitle || 'Hot Desk Summer Promo';
  const promoSubtitle = homepage?.promotionSubtitle || 'Access Silicon Core Hub 24/7 with premium coffee, high-speed fiber internet, and free meeting hours.';
  const promoImage = homepage?.promotionImageUrl || promoAtriumImage;
  const promoPrice = homepage?.promotionPrice || '$110/mo';

  const startupPrograms = homepage?.startupPrograms || [
    { title: 'Silicon Addis Incubation', description: 'An intensive 12-week program for pre-product startup teams in Addis Ababa. Includes 100K Birr grant and mentorship.', duration: '12 Weeks', cohortSize: 8, ctaText: 'Apply Cohort' },
    { title: 'AI Engineering Mastery', description: 'Advanced training on deep learning, prompt engineering, and LLM orchestration.', duration: '6 Weeks', cohortSize: 20, ctaText: 'Join Mastery Program' }
  ];

  const WORKSPACE_IMAGES: Record<string, string> = {
    HOT_DESK: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=600',
    MEETING_ROOM: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
    EVENT_VENUE: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600'
  };

  return (
    <div className="bg-[#111111] min-h-screen text-white font-sans overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section id="home" className="relative overflow-hidden pt-12 pb-24 sm:pt-14 sm:pb-32 bg-[#111111]">
        {/* Animated Background Mesh & Floating Blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              x: [0, 30, 0],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-[10%] w-[500px] h-[500px] rounded-full bg-brand-primary/10 filter blur-3xl" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, -40, 0],
              y: [0, 30, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-10 right-[15%] w-[450px] h-[450px] rounded-full bg-brand-accent/5 filter blur-3xl" 
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] rounded-full bg-gradient-to-b from-brand-primary/5 to-transparent filter blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center space-x-2 px-4.5 py-2 rounded-full bg-neutral-850 text-brand-accent text-xs font-semibold mb-8 border border-neutral-800 shadow-sm backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
            <span className="tracking-wide text-neutral-200">Co-working, Accelerator Programs & Dynamic Tech Portal</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans font-bold text-4xl sm:text-6xl tracking-tight leading-[1.1] mb-6 text-white"
          >
            {mainTitleWords}{' '}
            <span className="text-brand-accent bg-gradient-to-r from-brand-accent via-emerald-400 to-teal-400 bg-clip-text [-webkit-background-clip:text] sm:text-transparent font-extrabold inline-block">
              {highlightTitleWords}
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto text-base sm:text-lg text-neutral-slate-300 leading-relaxed mb-10 font-medium"
          >
            {displaySubtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to={displayCtaLink}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="success" size="lg" className="w-full sm:w-auto font-bold px-8 h-12.5 text-base rounded-xl shadow-md shadow-brand-accent/10 transition">
                  <span>{displayCtaText}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto h-12.5 text-base font-bold !bg-neutral-800 !text-white !border-neutral-700 hover:!bg-neutral-700 hover:!text-white rounded-xl transition shadow-sm">
                  <span>Access Member Portal</span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Beautiful Campus Image Container with Image Slider */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 relative rounded-3xl overflow-hidden border border-neutral-850 shadow-2xl max-w-7xl mx-auto group bg-neutral-950 h-[400px] sm:h-[600px] w-full"
          >
            {/* Slide Images */}
            {sliderImages.map((src, index) => (
              <img 
                key={index}
                src={src} 
                alt={`WeVentureHub Dynamic Workspace - Slide ${index + 1}`} 
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out transform ${
                  index === activeSlide 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-105 pointer-events-none'
                }`}
                referrerPolicy="no-referrer"
              />
            ))}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30 pointer-events-none z-10" />

            {/* Manual Controls: Arrows */}
            <button
              onClick={() => setActiveSlide(prev => (prev - 1 + sliderImages.length) % sliderImages.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20 focus:outline-none"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveSlide(prev => (prev + 1) % sliderImages.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20 focus:outline-none"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Slide Indicator Dots */}
            <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex space-x-2 z-20">
              {sliderImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-350 focus:outline-none ${
                    index === activeSlide 
                      ? 'bg-brand-accent w-6' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Slide Text Content overlay */}
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-left text-white z-20 max-w-lg">
              <span className="inline-flex items-center space-x-1.5 bg-brand-accent text-neutral-slate-900 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider mb-3 shadow-md">
                WeVenture Hub HQ
              </span>
              <p className="text-base md:text-lg font-bold text-white leading-snug drop-shadow">
                Experience our state-of-the-art incubation chapters and workspace technology arrays.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. SPONSORS ROW (DYNAMIC) */}
      <section className="py-12 bg-neutral-900/60 border-y border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] font-bold text-neutral-slate-400 tracking-wider uppercase mb-6">Our Dynamic Ecosystem Sponsor</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {(sponsors && sponsors.length > 0
              ? sponsors.filter(s => s.name.toLowerCase().includes('arifpay'))
              : [{ id: 'arifpay', name: 'ArifPay', logoUrl: 'https://arifpay.net/wp-content/uploads/2021/08/arifpay-logo.png', websiteUrl: 'https://arifpay.net' }]
            ).concat(
              (!sponsors || !sponsors.some(s => s.name.toLowerCase().includes('arifpay')))
                ? [{ id: 'arifpay', name: 'ArifPay', logoUrl: 'https://arifpay.net/wp-content/uploads/2021/08/arifpay-logo.png', websiteUrl: 'https://arifpay.net' }]
                : []
            ).slice(0, 1).map((sponsor) => (
              <a 
                key={sponsor.id || sponsor.name} 
                href={sponsor.websiteUrl || 'https://arifpay.net'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 px-6 py-3 bg-neutral-800/80 border border-neutral-700/80 rounded-2xl hover:border-brand-accent/60 transition-all duration-300 group shadow-md"
              >
                <span className="w-3 h-3 rounded-full bg-brand-accent animate-pulse" />
                <span className="font-extrabold text-white text-lg tracking-wide group-hover:text-brand-accent transition-colors">
                  {sponsor.name}
                </span>
                <span className="text-xs text-neutral-400 font-semibold px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700">
                  Official Payment Partner
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED WORKSPACES (DYNAMIC) */}
      <section className="py-24 bg-[#111111] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Live Availability</div>
              <h2 className="font-sans text-3xl font-bold text-white">Featured On-Site Spaces</h2>
              <p className="text-sm text-neutral-slate-400 mt-2 font-medium">Bookable physical rooms and desks featuring fast infrastructure and complete tech arrays.</p>
            </motion.div>
            <Link to="/workspaces" className="mt-4 sm:mt-0 inline-flex items-center text-brand-accent font-bold text-sm hover:underline group">
              <span>View all workrooms</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {workspacesLoading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="bg-neutral-900 border border-neutral-800 rounded-3xl h-96 animate-pulse" />
              ))
            ) : workspaces && workspaces.length > 0 ? (
              workspaces.slice(0, 3).map((space) => {
                const isBookmarked = !!bookmarkedSpaces[space.id];
                return (
                  <motion.div 
                    key={space.id} 
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                    }}
                    whileHover={{ y: -8 }}
                    className="bg-[#181818] rounded-3xl border border-neutral-800 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-52 bg-neutral-900 relative overflow-hidden group">
                        <img 
                          src={space.imageUrl || WORKSPACE_IMAGES[space.type] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600'} 
                          alt={space.name} 
                          className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        
                        {/* Glassmorphism Badge */}
                        <div className="absolute top-4 left-4 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping inline-block" />
                          <span>{space.type.replace('_', ' ')}</span>
                        </div>

                        {/* Interactive Favorite Action */}
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => toggleSpaceBookmark(space.id, e)}
                          className="absolute top-4 right-4 p-2 bg-neutral-900/90 border border-neutral-850 hover:bg-neutral-800 text-neutral-slate-300 rounded-full shadow-md backdrop-blur-sm transition-colors duration-200"
                          title="Bookmark workspace"
                        >
                          <Bookmark className={`w-4 h-4 transition-colors ${isBookmarked ? 'fill-brand-accent text-brand-accent' : 'text-neutral-slate-400'}`} />
                        </motion.button>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-sans font-bold text-base text-white group-hover:text-brand-accent transition-colors">{space.name}</h3>
                          <span className="text-sm font-extrabold text-brand-accent bg-neutral-800 border border-neutral-750 px-2.5 py-0.5 rounded-full">${space.hourlyRate}/hr</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-slate-400 mb-4 font-medium">
                          <Users className="w-3.5 h-3.5 text-neutral-slate-500" />
                          <span>Capacity: Up to {space.capacity} persons</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {space.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                            <span key={idx} className="bg-neutral-900 border border-neutral-800 text-neutral-slate-300 text-[10px] font-bold px-2 py-1 rounded-md">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <Link to={`/workspaces/${space.id}`} className="w-full">
                        <Button variant="secondary" className="w-full text-xs font-bold !bg-neutral-800 !text-white !border-brand-accent hover:!bg-neutral-700 hover:!text-white hover:!border-brand-accent/80 hover:!shadow-[0_0_12px_rgba(101,163,13,0.2)] rounded-xl transition duration-200 h-10">
                          View Availability & Book
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12 text-neutral-slate-500 font-medium">No workspaces configured yet. Check back soon!</div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 4. UPCOMING EVENTS (DYNAMIC) */}
      {featuredEvents && featuredEvents.length > 0 && (
        <section className="py-24 bg-[#141414] border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Accelerator Ecosystem</div>
                <h2 className="font-sans text-3xl font-bold text-white">Dynamic Featured Events</h2>
                <p className="text-sm text-neutral-slate-400 mt-2 font-medium">Enroll in live-synchronized workshops, hackathons, and cohort days hosted at WeVentureHub.</p>
              </motion.div>
              <Link to="/events" className="mt-4 sm:mt-0 inline-flex items-center text-brand-accent font-bold text-sm hover:underline group">
                <span>View all events</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } }
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {featuredEvents.slice(0, 2).map((event) => {
                const isBookmarked = !!bookmarkedEvents[event.id];
                return (
                  <motion.div 
                    key={event.id} 
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                    }}
                    whileHover={{ y: -6 }}
                    className="bg-[#1c1c1c] rounded-3xl border border-neutral-800 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col sm:flex-row"
                  >
                    <div className="sm:w-1/3 h-52 sm:h-auto bg-neutral-900 relative overflow-hidden group shrink-0">
                      <img 
                        src={event.media.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400'} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Reactive bookmark heart */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => toggleEventBookmark(event.id, e)}
                        className="absolute top-3 right-3 p-2 bg-neutral-900/90 text-neutral-slate-300 rounded-full shadow-md backdrop-blur-sm transition-colors duration-200"
                        title="Favorite Event"
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${isBookmarked ? 'fill-brand-accent text-brand-accent' : 'text-neutral-slate-400'}`} />
                      </motion.button>
                    </div>
                    <div className="p-6 sm:w-2/3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="bg-neutral-850 border border-neutral-800 text-brand-accent text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                            {event.category}
                          </span>
                        </div>
                        <h3 className="font-sans font-bold text-lg text-white mt-3 line-clamp-1 group-hover:text-brand-accent transition-colors">{event.title}</h3>
                        <p className="text-xs text-neutral-slate-400 mt-2 line-clamp-2 leading-relaxed font-medium">
                          {event.description}
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-slate-400 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                          <span>{new Date(event.schedule.startDate).toLocaleDateString()}</span>
                        </div>
                        <Link to={`/events/${event.slug}`}>
                          <Button variant="success" className="text-xs font-bold px-4 h-9 rounded-xl shadow-sm transition">
                            View details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* 5. ECOSYSTEM BENTO FEATURES */}
      <section id="features" className="py-24 border-b border-neutral-800 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white"
            >
              Ecosystem Platform Features
            </motion.h2>
            <p className="text-sm sm:text-base text-neutral-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
              Explore how WeVentureHub’s integrated digital experience optimizes your day-to-day work, learnings, and pitch pathways.
            </p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feat, idx) => (
              <motion.div 
                key={idx} 
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                }}
                whileHover={{ y: -5 }}
                className="bg-[#181818] border border-neutral-800 hover:border-brand-accent/50 rounded-2xl p-8 transition-colors duration-200 hover:shadow-lg shadow-sm"
              >
                <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-xl inline-block mb-5 shadow-sm text-brand-accent">
                  {feat.icon}
                </div>
                <h3 className="font-sans font-bold text-lg text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-neutral-slate-400 leading-relaxed font-medium">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6. STARTUP ACCELERATORS (DYNAMIC) */}
      <section className="py-24 bg-[#141414] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Venture Acceleration</div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white"
            >
              Dynamic Startup Programs
            </motion.h2>
            <p className="text-sm sm:text-base text-neutral-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
              Synchronized programs to scale enterprise solutions, obtain pre-seed capital, and receive dedicated technical coaching.
            </p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {startupPrograms.map((prog: any, idx: number) => (
              <motion.div 
                key={idx} 
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90 } }
                }}
                whileHover={{ y: -6 }}
                className="bg-[#1c1c1c] border border-neutral-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:shadow-xl transition-shadow duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="bg-neutral-850 border border-neutral-800 text-brand-accent text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-brand-accent rounded-full inline-block animate-pulse" />
                      <span>Cohort Size: {prog.cohortSize} teams</span>
                    </span>
                    <span className="text-xs font-bold text-neutral-slate-400 uppercase tracking-wider">{prog.duration}</span>
                  </div>
                  <h3 className="font-sans font-bold text-xl text-white mb-3">{prog.title}</h3>
                  <p className="text-sm text-neutral-slate-400 leading-relaxed mb-6 font-medium">
                    {prog.description}
                  </p>
                </div>
                <Link to="/register">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="success" className="w-full font-bold rounded-xl h-11 transition shadow-sm">
                      {prog.ctaText || 'Apply Cohort'}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 7. DYNAMIC TESTIMONIALS */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-24 bg-[#111111] border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Testimonials</div>
              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-sans text-3xl font-bold text-white"
              >
                What Our Builders Say
              </motion.h2>
              <p className="text-sm text-neutral-slate-400 mt-2 font-medium">Real reviews from dynamic startup teams and remote engineers at WeVentureHub.</p>
            </div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } }
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {testimonials.map((test) => (
                <motion.div 
                  key={test.id} 
                  variants={{
                    hidden: { opacity: 0, y: 25 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -5 }}
                  className="bg-[#181818] border border-neutral-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-5">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current text-amber-500" />
                      ))}
                    </div>
                    <p className="text-[14px] text-neutral-slate-300 leading-relaxed mb-6 font-medium italic">
                      "{test.content}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
                    {test.authorAvatarUrl ? (
                      <img 
                        src={test.authorAvatarUrl} 
                        alt={test.authorName} 
                        className="w-10 h-10 rounded-full object-cover border border-neutral-800 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-800 text-brand-accent flex items-center justify-center font-bold text-sm shadow-inner">
                        {test.authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">{test.authorName}</h4>
                      <p className="text-xs text-neutral-slate-400">{test.authorRole}, {test.authorCompany}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}      {/* 8. PROMO ROW */}
      <section className="py-24 bg-[#141414] text-white relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(17,17,17,1),rgba(20,20,20,1))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="bg-brand-accent/20 text-brand-accent text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Limited Time Promotion
              </span>
              <h2 className="font-sans text-4xl font-extrabold tracking-tight leading-tight">
                {promoTitle}
              </h2>
              <p className="text-base text-neutral-slate-300 max-w-lg leading-relaxed font-medium">
                {promoSubtitle}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-brand-accent">{promoPrice}</span>
                <span className="text-sm text-neutral-slate-400">/ exclusive billing rate</span>
              </div>
              <div className="pt-4">
                <Link to="/register">
                  <Button variant="success" className="font-extrabold px-8 h-12 rounded-xl shadow-md">
                    Claim Summer Rate Now
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border-4 border-neutral-800 shadow-xl">
              <img 
                src={promoImage} 
                alt="Silicon Summer Hotdesk Promo" 
                className="w-full h-80 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. PARTNERS BOARD (DYNAMIC) */}
      {partners && partners.length > 0 && (
        <section className="py-16 bg-[#111111] border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-[11px] font-bold text-neutral-slate-400 tracking-wider uppercase mb-6">Incubator & Innovation Partners</p>
            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-20">
              {partners.map((partner) => (
                <a 
                  key={partner.id} 
                  href={partner.websiteUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-opacity duration-300 hover:opacity-100 opacity-60 flex items-center gap-2"
                >
                  <img 
                    src={partner.logoUrl} 
                    alt={partner.name} 
                    className="h-8 object-contain rounded-md border border-neutral-800"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-bold text-neutral-slate-400">{partner.name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. CONTACT FORM */}
      <section id="contact" className="py-24 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Info Side */}
            <div className="space-y-6">
              <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Need Assistance?</div>
              <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Contact Our Site Coordinators
              </h2>
              <p className="text-sm sm:text-base text-neutral-slate-400 leading-relaxed max-w-md font-medium">
                Have questions about accelerators, booking workspaces, mentoring opportunities, or sponsoring events? We’re here to help.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-3 text-neutral-slate-300 font-medium">
                  <Mail className="w-5 h-5 text-brand-accent" />
                  <span className="text-sm">info@weventurehub.com</span>
                </div>
                <div className="flex items-center space-x-3 text-neutral-slate-300 font-medium">
                  <Phone className="w-5 h-5 text-brand-accent" />
                  <span className="text-sm">091 124 3503</span>
                </div>
                <div className="flex items-center space-x-3 text-neutral-slate-300 font-medium">
                  <MapPin className="w-5 h-5 text-brand-accent" />
                  <span className="text-sm">Airport Road, Sur Construction second floor, Addis Ababa</span>
                </div>
              </div>
            </div>

            {/* Form Side */}
            <div className="bg-[#181818] rounded-2xl border border-neutral-800 p-8 shadow-sm">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h3 className="font-sans font-bold text-lg text-white mb-2">Send an Inquiry</h3>
                
                <div>
                  <label htmlFor="contact_name" className="block text-xs font-bold text-neutral-slate-400 mb-1">Your Name</label>
                  <input 
                    id="contact_name"
                    type="text" 
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Alex Chen"
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent font-medium text-white placeholder-neutral-500"
                  />
                </div>

                <div>
                  <label htmlFor="contact_email" className="block text-xs font-bold text-neutral-slate-400 mb-1">Your Email</label>
                  <input 
                    id="contact_email"
                    type="email" 
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="alex@acme.com"
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent font-medium text-white placeholder-neutral-500"
                  />
                </div>

                <div>
                  <label htmlFor="contact_message" className="block text-xs font-bold text-neutral-slate-400 mb-1">Your Message</label>
                  <textarea 
                    id="contact_message"
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us about your startup or workspace needs..."
                    className="w-full px-4 py-2.5 text-sm rounded-lg bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent resize-none font-medium text-white placeholder-neutral-500"
                  />
                </div>

                {contactSuccess && (
                  <div className="p-3.5 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs font-bold">
                    Thank you! Your inquiry has been received. We will respond within 24 hours.
                  </div>
                )}

                <Button 
                  type="submit" 
                  variant="success"
                  className="w-full h-11 text-sm font-bold rounded-xl shadow-sm" 
                  isLoading={contactLoading}
                  disabled={!contactForm.name || !contactForm.email || !contactForm.message}
                >
                  Submit Inquiry Message
                </Button>
              </form>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
