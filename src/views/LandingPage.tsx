import React, { useState } from 'react';
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
  Heart
} from 'lucide-react';
import { Button } from '../components/Button';
import { publicApi } from '../lib/publicApi';

export default function LandingPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    }, 1000);
  };

  // Safe Fallback content for loaders or missing DB configs
  const displayTitle = homepage?.heroTitle || 'Where Modern Ethiopian Startups Scale and Innovate';
  const displaySubtitle = homepage?.heroSubtitle || 'Instant booking for premium meeting rooms, dedicated workspaces, and world-class accelerator programs tailored to high-growth operators.';
  const displayCtaText = homepage?.heroCtaText || 'Explore Available Spaces';
  const displayCtaLink = homepage?.heroCtaLink || '/workspaces';
  const displayHeroImage = homepage?.heroImageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200';

  const promoTitle = homepage?.promotionTitle || 'Hot Desk Summer Promo';
  const promoSubtitle = homepage?.promotionSubtitle || 'Access Silicon Core Hub 24/7 with premium coffee, high-speed fiber internet, and free meeting hours.';
  const promoImage = homepage?.promotionImageUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600';
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
    <div className="bg-white min-h-screen text-neutral-slate-900 font-sans">
      
      {/* 1. HERO SECTION */}
      <section id="home" className="relative overflow-hidden pt-24 pb-28 sm:pt-28 sm:pb-36 bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] rounded-full bg-[#2563EB]/5 filter blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-6 border border-blue-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Co-working, Accelerator Programs & Dynamic Tech Portal</span>
          </div>

          <h1 className="font-sans font-bold text-4xl sm:text-6xl tracking-tight leading-none mb-6 text-gray-950">
            {displayTitle.split(' ').slice(0, -3).join(' ')} <br />
            <span className="text-blue-600 font-extrabold">{displayTitle.split(' ').slice(-3).join(' ')}</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed mb-10 font-medium">
            {displaySubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={displayCtaLink}>
              <Button size="lg" className="w-full sm:w-auto font-bold px-8 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
                <span>{displayCtaText}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto h-12 text-base font-bold bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-xl">
                <span>Access Member Portal</span>
              </Button>
            </Link>
          </div>

          {/* Beautiful Campus Image Container */}
          <div className="mt-12 relative rounded-3xl overflow-hidden border border-gray-200/80 shadow-lg max-w-5xl mx-auto group">
            <img 
              src={displayHeroImage} 
              alt="WeVentureHub Dynamic Workspace" 
              className="w-full h-[400px] sm:h-[550px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 text-left text-white z-10">
              <span className="inline-flex items-center space-x-1 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2">
                WeVenture Hub HQ
              </span>
              <p className="text-sm md:text-base font-semibold text-white/90 drop-shadow-sm">
                Experience our state-of-the-art incubation chapters and workspace technology arrays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SPONSORS ROW (DYNAMIC) */}
      {sponsors && sponsors.length > 0 && (
        <section className="py-12 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-6">Our Dynamic Ecosystem Sponsors</p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {sponsors.map((sponsor) => (
                <a 
                  key={sponsor.id} 
                  href={sponsor.websiteUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-opacity duration-300 hover:opacity-100 opacity-60"
                >
                  <img 
                    src={sponsor.logoUrl} 
                    alt={sponsor.name} 
                    className="h-10 object-contain rounded-lg border border-gray-200/50"
                    referrerPolicy="no-referrer"
                  />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. FEATURED WORKSPACES (DYNAMIC) */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <div className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">Live Availability</div>
              <h2 className="font-sans text-3xl font-bold text-gray-950">Featured On-Site Spaces</h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">Bookable physical rooms and desks featuring fast infrastructure and complete tech arrays.</p>
            </div>
            <Link to="/workspaces" className="mt-4 sm:mt-0 inline-flex items-center text-blue-600 font-bold text-sm hover:underline">
              <span>View all workrooms</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workspacesLoading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="bg-gray-50 border border-gray-100 rounded-2xl h-80 animate-pulse" />
              ))
            ) : workspaces && workspaces.length > 0 ? (
              workspaces.slice(0, 3).map((space) => (
                <div key={space.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="h-48 bg-gray-50 relative border-b border-gray-100">
                    <img 
                      src={WORKSPACE_IMAGES[space.type] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600'} 
                      alt={space.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                      {space.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-sans font-bold text-base text-gray-950">{space.name}</h3>
                      <span className="text-sm font-extrabold text-blue-600">${space.hourlyRate}/hr</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                      <Users className="w-3.5 h-3.5" />
                      <span>Capacity: Up to {space.capacity} persons</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-6">
                      {space.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                    <Link to={`/workspaces/${space.id}`} className="w-full">
                      <Button variant="secondary" className="w-full text-xs font-bold bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-xl">
                        View Availability & Book
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-500 font-medium">No workspaces configured yet. Check back soon!</div>
            )}
          </div>
        </div>
      </section>

      {/* 4. UPCOMING EVENTS (DYNAMIC) */}
      {featuredEvents && featuredEvents.length > 0 && (
        <section className="py-24 bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
              <div>
                <div className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">Accelerator Ecosystem</div>
                <h2 className="font-sans text-3xl font-bold text-gray-950">Dynamic Featured Events</h2>
                <p className="text-sm text-gray-500 mt-2 font-medium">Enroll in live-synchronized workshops, hackathons, and cohort days hosted at WeVentureHub.</p>
              </div>
              <Link to="/events" className="mt-4 sm:mt-0 inline-flex items-center text-blue-600 font-bold text-sm hover:underline">
                <span>View all events</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredEvents.slice(0, 2).map((event) => (
                <div key={event.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row">
                  <div className="sm:w-1/3 h-48 sm:h-auto bg-gray-100 relative">
                    <img 
                      src={event.media.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400'} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6 sm:w-2/3 flex flex-col justify-between">
                    <div>
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {event.category}
                      </span>
                      <h3 className="font-sans font-bold text-lg text-gray-950 mt-2 line-clamp-1">{event.title}</h3>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                        {event.description}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{new Date(event.schedule.startDate).toLocaleDateString()}</span>
                      </div>
                      <Link to={`/events/${event.slug}`}>
                        <Button className="text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 px-4 rounded-lg shadow-sm">
                          View details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. ECOSYSTEM BENTO FEATURES */}
      <section id="features" className="py-24 border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-gray-950">
              Ecosystem Platform Features
            </h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed font-medium">
              Explore how WeVentureHub’s integrated digital experience optimizes your day-to-day work, learnings, and pitch pathways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-8 transition-all duration-300 hover:shadow-sm">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl inline-block mb-4 shadow-sm">
                  {feat.icon}
                </div>
                <h3 className="font-sans font-bold text-lg text-gray-950 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. STARTUP ACCELERATORS (DYNAMIC) */}
      <section className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">Venture Acceleration</div>
            <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-gray-950">
              Dynamic Startup Programs
            </h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed font-medium">
              Synchronized programs to scale enterprise solutions, obtain pre-seed capital, and receive dedicated technical coaching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {startupPrograms.map((prog: any, idx: number) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">
                      Cohort Size: {prog.cohortSize} teams
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase">{prog.duration}</span>
                  </div>
                  <h3 className="font-sans font-bold text-xl text-gray-950 mb-3">{prog.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6 font-medium">
                    {prog.description}
                  </p>
                </div>
                <Link to="/register">
                  <Button className="w-full font-bold bg-gray-950 hover:bg-gray-900 text-white rounded-xl">
                    {prog.ctaText || 'Apply Cohort'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DYNAMIC TESTIMONIALS */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-24 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">Testimonials</div>
              <h2 className="font-sans text-3xl font-bold text-gray-950">What Our Builders Say</h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">Real reviews from dynamic startup teams and remote engineers at WeVentureHub.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((test) => (
                <div key={test.id} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
                    "{test.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    {test.authorAvatarUrl ? (
                      <img 
                        src={test.authorAvatarUrl} 
                        alt={test.authorName} 
                        className="w-10 h-10 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {test.authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-gray-950">{test.authorName}</h4>
                      <p className="text-xs text-gray-400">{test.authorRole}, {test.authorCompany}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. PROMO ROW */}
      <section className="py-24 bg-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(37,99,235,1),rgba(30,58,138,1))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Limited Time Promotion
              </span>
              <h2 className="font-sans text-4xl font-extrabold tracking-tight leading-tight">
                {promoTitle}
              </h2>
              <p className="text-base text-blue-100 max-w-lg leading-relaxed font-medium">
                {promoSubtitle}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">{promoPrice}</span>
                <span className="text-sm text-blue-200">/ exclusive billing rate</span>
              </div>
              <div className="pt-4">
                <Link to="/register">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 font-extrabold px-8 h-12 rounded-xl shadow-md">
                    Claim Summer Rate Now
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border-4 border-white/10 shadow-xl">
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
        <section className="py-16 bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-6">Incubator & Innovation Partners</p>
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
                    className="h-8 object-contain rounded-md border border-gray-200/50"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-bold text-gray-500">{partner.name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. CONTACT FORM */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Info Side */}
            <div className="space-y-6">
              <div className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">Need Assistance?</div>
              <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-gray-950">
                Contact Our Site Coordinators
              </h2>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-md font-medium">
                Have questions about accelerators, booking workspaces, mentoring opportunities, or sponsoring events? We’re here to help.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-3 text-gray-600 font-medium">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">connect@weventurehub.com</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 font-medium">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">+1 (800) WE-VENTURE</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 font-medium">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">WeVentureHub Silicon Valley, California</span>
                </div>
              </div>
            </div>

            {/* Form Side */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h3 className="font-sans font-bold text-lg text-gray-950 mb-2">Send an Inquiry</h3>
                
                <div>
                  <label htmlFor="contact_name" className="block text-xs font-bold text-gray-500 mb-1">Your Name</label>
                  <input 
                    id="contact_name"
                    type="text" 
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Alex Chen"
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="contact_email" className="block text-xs font-bold text-gray-500 mb-1">Your Email</label>
                  <input 
                    id="contact_email"
                    type="email" 
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="alex@acme.com"
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="contact_message" className="block text-xs font-bold text-gray-500 mb-1">Your Message</label>
                  <textarea 
                    id="contact_message"
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us about your startup or workspace needs..."
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium text-gray-900"
                  />
                </div>

                {contactSuccess && (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    Thank you! Your inquiry has been received. We will respond within 24 hours.
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm" 
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
