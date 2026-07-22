import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Rocket,
  Lightbulb,
  TrendingUp,
  Users,
  DollarSign,
  Code,
  Shield,
  Mic,
  Globe,
  Calendar,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Building2,
  Briefcase,
  Layers,
  Award,
  Send,
  X,
  MessageSquare,
  Laptop,
  Compass,
  FileText,
  PieChart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { startupApi, StartupProgramItem } from '../lib/startupApi';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

// Map icon string names to Lucide icon components
const iconMap: Record<string, React.ReactNode> = {
  Lightbulb: <Lightbulb className="w-6 h-6 text-amber-400" />,
  Rocket: <Rocket className="w-6 h-6 text-brand-accent" />,
  TrendingUp: <TrendingUp className="w-6 h-6 text-emerald-400" />,
  Users: <Users className="w-6 h-6 text-blue-400" />,
  DollarSign: <DollarSign className="w-6 h-6 text-purple-400" />,
  Code: <Code className="w-6 h-6 text-cyan-400" />,
  Shield: <Shield className="w-6 h-6 text-indigo-400" />,
  Mic: <Mic className="w-6 h-6 text-pink-400" />,
  Globe: <Globe className="w-6 h-6 text-teal-400" />,
  Calendar: <Calendar className="w-6 h-6 text-rose-400" />,
};

export default function StartupPage() {
  const queryClient = useQueryClient();

  // State for modals & interactive sections
  const [selectedProgram, setSelectedProgram] = useState<StartupProgramItem | null>(null);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(0);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Application form fields
  const [appForm, setAppForm] = useState({
    programId: '',
    programTitle: 'General Incubator Application',
    startupName: '',
    founderName: '',
    email: '',
    phone: '',
    industry: 'Fintech',
    startupStage: 'MVP Built',
    teamSize: '1-3 members',
    website: '',
    linkedIn: '',
    briefDescription: '',
    currentChallenges: '',
    fundingStatus: 'Bootstrapped',
  });

  // Consultation form fields
  const [consultForm, setConsultForm] = useState({
    founderName: '',
    email: '',
    phone: '',
    preferredTopic: 'Incubation & Accelerator Entry',
    notes: '',
  });
  const [consultSuccess, setConsultSuccess] = useState(false);

  // Fetch Startup Programs from Backend
  const { data: programs, isLoading: isProgramsLoading } = useQuery({
    queryKey: ['startupPrograms'],
    queryFn: startupApi.getPrograms,
  });

  // Submit Application Mutation
  const submitAppMutation = useMutation({
    mutationFn: startupApi.submitApplication,
    onSuccess: (data) => {
      setFormSuccessMessage(
        data.message || 'Application submitted successfully! Our team will contact you within 48 hours.'
      );
      setAppForm({
        programId: '',
        programTitle: 'General Incubator Application',
        startupName: '',
        founderName: '',
        email: '',
        phone: '',
        industry: 'Fintech',
        startupStage: 'MVP Built',
        teamSize: '1-3 members',
        website: '',
        linkedIn: '',
        briefDescription: '',
        currentChallenges: '',
        fundingStatus: 'Bootstrapped',
      });
      queryClient.invalidateQueries({ queryKey: ['startupApplications'] });
    },
  });

  const handleOpenApplyModal = (program?: StartupProgramItem) => {
    if (program) {
      setAppForm((prev) => ({
        ...prev,
        programId: program.id,
        programTitle: program.title,
      }));
    } else {
      setAppForm((prev) => ({
        ...prev,
        programId: '',
        programTitle: 'General Incubator Application',
      }));
    }
    setFormSuccessMessage(null);
    setIsAppModalOpen(true);
  };

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAppMutation.mutate(appForm);
  };

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConsultSuccess(true);
    setTimeout(() => {
      setConsultSuccess(false);
      setIsConsultModalOpen(false);
      setConsultForm({
        founderName: '',
        email: '',
        phone: '',
        preferredTopic: 'Incubation & Accelerator Entry',
        notes: '',
      });
    }, 2500);
  };

  const scrollToApply = () => {
    const el = document.getElementById('application-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleOpenApplyModal();
    }
  };

  // Static content data
  const servicesList = [
    { title: 'Business Mentoring', desc: 'Strategic guidance from seasoned executives and serial entrepreneurs.', icon: <Users className="w-5 h-5 text-brand-accent" /> },
    { title: 'Legal Support', desc: 'IP registration, entity formation, equity structures, and contract reviews.', icon: <Shield className="w-5 h-5 text-indigo-400" /> },
    { title: 'Branding & Marketing', desc: 'Brand identity design, GTM campaigns, and customer acquisition strategies.', icon: <Sparkles className="w-5 h-5 text-pink-400" /> },
    { title: 'Technology Support', desc: 'Code audits, cloud infrastructure credits, DevOps, and AI integration.', icon: <Code className="w-5 h-5 text-cyan-400" /> },
    { title: 'Product Strategy', desc: 'User experience reviews, MVP scope reduction, and roadmap prioritization.', icon: <Compass className="w-5 h-5 text-amber-400" /> },
    { title: 'Financial Planning', desc: 'Cap table modeling, cash runway forecasting, and valuation metrics.', icon: <PieChart className="w-5 h-5 text-emerald-400" /> },
    { title: 'Investor Connections', desc: 'Warm introductions to regional angels, VC funds, and corporate ventures.', icon: <DollarSign className="w-5 h-5 text-purple-400" /> },
    { title: 'Co-working Space', desc: 'High-speed fiber internet, dedicated hot desks, and private startup suites.', icon: <Laptop className="w-5 h-5 text-blue-400" /> },
    { title: 'Meeting Rooms', desc: 'Equipped boardrooms with video conferencing for client pitches.', icon: <Building2 className="w-5 h-5 text-teal-400" /> },
    { title: 'Event Spaces', desc: 'Access to WeVentureHub Event Hall for launch parties and demo days.', icon: <Calendar className="w-5 h-5 text-rose-400" /> },
  ];

  const benefitsList = [
    { title: 'Expert Mentors', desc: 'Access 50+ resident mentors in technology, fintech, law, and growth.', icon: <Users className="w-6 h-6 text-brand-accent" /> },
    { title: 'Funding Opportunities', desc: 'Direct access to pre-seed micro-grants, angel syndicates, and seed funds.', icon: <DollarSign className="w-6 h-6 text-emerald-400" /> },
    { title: 'High-Impact Networking', desc: 'Connect with fellow founders, corporate innovation managers, and alumni.', icon: <Globe className="w-6 h-6 text-cyan-400" /> },
    { title: 'Modern Workspace', desc: 'State-of-the-art coworking facilities, coffee bars, and 24/7 access.', icon: <Building2 className="w-6 h-6 text-purple-400" /> },
    { title: 'Vibrant Community', desc: 'Join an active Slack network of 500+ builders and collaborative operators.', icon: <MessageSquare className="w-6 h-6 text-pink-400" /> },
    { title: 'Specialized Workshops', desc: 'Weekly deep-dives into growth hacking, fundraising, and technical scale.', icon: <Briefcase className="w-6 h-6 text-amber-400" /> },
    { title: 'Demo Days & Media', desc: 'Showcase your product to 200+ investors and press outlets during Demo Day.', icon: <Mic className="w-6 h-6 text-rose-400" /> },
    { title: 'Business Growth', desc: 'Structured acceleration designed to scale your monthly recurring revenue.', icon: <TrendingUp className="w-6 h-6 text-blue-400" /> },
  ];

  const timelineSteps = [
    { step: '01', title: 'Submit Application', desc: 'Complete our online application describing your startup idea, team, and stage.' },
    { step: '02', title: 'Review', desc: 'Our investment committee evaluates your pitch, market size, and technical thesis.' },
    { step: '03', title: 'Interview', desc: 'Qualified founders participate in a 20-minute interview with incubator directors.' },
    { step: '04', title: 'Acceptance', desc: 'Selected teams receive program offer letters, workspace credits, and mentor matches.' },
    { step: '05', title: 'Onboarding', desc: 'Gain immediate access to workspace facilities, legal toolkits, and mentor networks.' },
    { step: '06', title: 'Build & Scale', desc: 'Participate in weekly sprints, build product, meet investors, and launch at Demo Day.' },
  ];

  const testimonials = [
    {
      name: 'Yonas Tadesse',
      role: 'Co-founder & CEO',
      startup: 'PayFlow Africa (Fintech)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      quote: 'WeVentureHub’s incubation program transformed our MVP into a enterprise-grade payment engine. The legal guidance and investor introductions helped us secure $300k in seed funding.',
      metric: '$300k Seed Raised',
    },
    {
      name: 'Bethlehem Alemu',
      role: 'Founder',
      startup: 'AgriSense IoT',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      quote: 'The technical mentorship and resident CTO sessions at WeVentureHub were invaluable. We deployed our IoT smart farming sensors across 50 commercial farms within 4 months.',
      metric: '50+ Commercial Farms',
    },
    {
      name: 'Kaleb Bekele',
      role: 'Chief Technology Officer',
      startup: 'MedConnect Health',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      quote: 'Being surrounded by ambitious founders and having 24/7 workspace access allowed our engineering team to ship 3x faster. The Demo Day pitch opened doors to top healthtech investors.',
      metric: '40,000 Active Patients',
    },
  ];

  const faqs = [
    {
      q: 'Who can apply?',
      a: 'We welcome early-stage founders, tech entrepreneurs, university innovators, and scaling startups across all technology sectors. Whether you have just an idea or a working product, we have dedicated pathways for your stage.',
    },
    {
      q: 'Is the program free?',
      a: 'Our core incubation workshops and community pitch events are free for accepted founders. Workspace facilities and specialized acceleration tracks are offered at subsidized rates or grant-backed stipends.',
    },
    {
      q: 'How long is the incubation?',
      a: 'Program durations vary depending on the track: the Idea Validation Sprint lasts 4 weeks, the flagship Incubation Cohort runs for 12 weeks, and the Growth Acceleration track spans 6 months.',
    },
    {
      q: 'Can existing startups join?',
      a: 'Yes! Startups with existing market traction, registered entities, or early revenue can apply directly to our Acceleration, Investor Readiness, or Market Access programs.',
    },
    {
      q: 'Do you help with funding?',
      a: 'Yes. We prepare startups for investor readiness, connect teams with regional angel syndicates and VC funds, provide cloud credits, and host high-visibility Demo Days.',
    },
    {
      q: 'What industries are accepted?',
      a: 'We are sector-agnostic with strong focus areas in Fintech, Healthtech, Edtech, Agritech, AI & Machine Learning, CleanTech, E-commerce, and SaaS solutions.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-28 border-b border-neutral-800 overflow-hidden bg-gradient-to-b from-[#161616] via-[#111111] to-[#111111]">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-brand-accent/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-neutral-900/80 border border-neutral-800 text-brand-accent text-xs font-bold px-4 py-1.5 rounded-full mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>WeVentureHub Startup Innovation Ecosystem</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight font-sans max-w-4xl mx-auto leading-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-400 to-teal-300 drop-shadow-sm">
              Launch and Grow Your Startup at
            </span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-lime-400 to-emerald-400 drop-shadow-md">
              WeVentureHub
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-neutral-slate-300 max-w-2xl mx-auto mt-6 font-medium leading-relaxed"
          >
            Join a vibrant innovation ecosystem where founders, mentors, investors, and industry experts help turn ideas into successful, venture-backed businesses.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              variant="success"
              onClick={scrollToApply}
              className="w-full sm:w-auto font-extrabold px-8 py-3.5 text-sm rounded-xl shadow-lg shadow-brand-accent/20 hover:scale-[1.02] transition-transform"
            >
              Apply Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsConsultModalOpen(true)}
              className="w-full sm:w-auto font-bold px-8 py-3.5 text-sm rounded-xl border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
            >
              Book a Consultation
            </Button>
          </motion.div>

          {/* Quick Metrics Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 border-t border-neutral-800/80">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">120+</div>
              <div className="text-xs text-neutral-slate-400 font-medium mt-1">Startups Accelerated</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-accent">$4.2M+</div>
              <div className="text-xs text-neutral-slate-400 font-medium mt-1">Capital Raised</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">50+</div>
              <div className="text-xs text-neutral-slate-400 font-medium mt-1">Resident Mentors</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">92%</div>
              <div className="text-xs text-neutral-slate-400 font-medium mt-1">Survival Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STARTUP PROGRAMS SECTION */}
      <section className="py-24 bg-[#141414] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Tailored Pathways</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Startup Programs</h2>
            <p className="text-sm sm:text-base text-neutral-slate-400 max-w-2xl mx-auto mt-3 font-medium">
              Explore our structured acceleration and incubation tracks tailored for founders at every stage of their startup journey.
            </p>
          </div>

          {isProgramsLoading ? (
            <div className="py-12 text-center text-neutral-slate-400 font-medium">Loading startup programs...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {programs?.map((prog) => {
                const IconComponent = iconMap[prog.icon] || <Rocket className="w-6 h-6 text-brand-accent" />;
                return (
                  <motion.div
                    key={prog.id}
                    whileHover={{ y: -5 }}
                    className="bg-[#1c1c1c] border border-neutral-800 rounded-2xl p-7 flex flex-col justify-between hover:border-brand-accent/50 transition-all shadow-sm hover:shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                          {IconComponent}
                        </div>
                        <span className="text-[11px] font-bold text-brand-accent bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                          {prog.duration}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                        {prog.category}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-2">{prog.title}</h3>
                      <p className="text-xs text-neutral-slate-400 leading-relaxed font-medium mb-6 line-clamp-3">
                        {prog.shortDescription}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400 font-medium">
                        Cohort Size: <strong className="text-white">{prog.cohortSize} teams</strong>
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedProgram(prog)}
                        className="text-xs font-bold !py-2 !px-3.5 !bg-neutral-800 border-neutral-700 hover:!bg-neutral-700 text-white rounded-lg"
                      >
                        Learn More
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. SERVICES SECTION */}
      <section className="py-24 bg-[#111111] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Comprehensive Infrastructure</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Startup Support Services</h2>
            <p className="text-sm sm:text-base text-neutral-slate-400 max-w-2xl mx-auto mt-3 font-medium">
              We offer end-to-end operational, technical, legal, and capital services so founders can focus strictly on product execution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {servicesList.map((serv, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-[#181818] border border-neutral-800 rounded-2xl p-6 transition-colors hover:border-neutral-700"
              >
                <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl inline-block mb-4">
                  {serv.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{serv.title}</h3>
                <p className="text-xs text-neutral-slate-400 font-medium leading-relaxed">{serv.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. STARTUP BENEFITS */}
      <section className="py-24 bg-[#141414] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Why Founders Choose Us</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Key Startup Benefits</h2>
            <p className="text-sm sm:text-base text-neutral-slate-400 max-w-2xl mx-auto mt-3 font-medium">
              Gain an unfair advantage in the market through our global ecosystem partnerships and dedicated support infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefitsList.map((ben, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-[#1c1c1c] border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group"
              >
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl inline-block mb-4">
                  {ben.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{ben.title}</h3>
                <p className="text-xs text-neutral-slate-400 font-medium leading-relaxed">{ben.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. APPLICATION PROCESS TIMELINE */}
      <section className="py-24 bg-[#111111] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Simple 6-Step Admission</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Application Process Timeline</h2>
            <p className="text-sm sm:text-base text-neutral-slate-400 max-w-2xl mx-auto mt-3 font-medium">
              Our transparent review timeline ensures fast feedback so founders can move from application to onboarding seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative">
            {timelineSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-[#181818] border border-neutral-800 rounded-2xl p-6 relative flex flex-col justify-between"
              >
                <div>
                  <div className="text-2xl font-black text-brand-accent mb-3 font-mono">{step.step}</div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-neutral-slate-400 font-medium leading-relaxed">{step.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center text-[10px] text-neutral-500 font-bold uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-brand-accent" />
                  <span>Phase {idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SUCCESS STORIES / TESTIMONIALS */}
      <section className="py-24 bg-[#141414] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Founder Success Stories</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Built at WeVentureHub</h2>
            <p className="text-sm sm:text-base text-neutral-slate-400 max-w-2xl mx-auto mt-3 font-medium">
              Hear directly from visionary founders who scaled their companies through our incubation and acceleration programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-[#1c1c1c] border border-neutral-800 rounded-2xl p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="inline-block bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs font-bold px-3 py-1 rounded-full mb-5">
                    {item.metric}
                  </div>
                  <p className="text-xs text-neutral-slate-300 font-medium leading-relaxed italic mb-6">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center space-x-3.5 pt-4 border-t border-neutral-800">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-11 h-11 rounded-full object-cover border border-neutral-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <p className="text-[11px] text-neutral-slate-400 font-medium">{item.role}, <span className="text-brand-accent">{item.startup}</span></p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-24 bg-[#111111] border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-brand-accent tracking-wider uppercase mb-2">Clear Answers</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-neutral-slate-400 mt-2 font-medium">Have questions regarding application eligibility, program fees, or investment terms?</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#181818] border border-neutral-800 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaqIdx(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-white hover:text-brand-accent transition-colors"
                  >
                    <span className="flex items-center space-x-3">
                      <HelpCircle className="w-4 h-4 text-brand-accent shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-5 pt-1 text-xs text-neutral-slate-400 leading-relaxed font-medium border-t border-neutral-800/60"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. DIRECT APPLICATION FORM SECTION */}
      <section id="application-form-section" className="py-24 bg-[#141414]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1c1c1c] border border-neutral-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-10">
              <div className="inline-flex items-center space-x-2 bg-neutral-900 border border-neutral-800 text-brand-accent text-xs font-bold px-3.5 py-1.5 rounded-full mb-3">
                <Rocket className="w-3.5 h-3.5" />
                <span>Admission Intake Open</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">Apply for Startup Admission</h2>
              <p className="text-sm text-neutral-slate-400 mt-2 font-medium">
                Complete the application form below to pitch your startup for incubation and mentor matching.
              </p>
            </div>

            {formSuccessMessage ? (
              <div className="p-8 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl text-center">
                <CheckCircle2 className="w-12 h-12 text-brand-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Application Received!</h3>
                <p className="text-xs text-neutral-slate-300 max-w-md mx-auto leading-relaxed">{formSuccessMessage}</p>
                <Button
                  variant="success"
                  onClick={() => setFormSuccessMessage(null)}
                  className="mt-6 text-xs font-bold px-6 py-2.5 rounded-xl"
                >
                  Submit Another Application
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAppSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">
                      Startup Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. PayFlow Tech"
                      value={appForm.startupName}
                      onChange={(e) => setAppForm({ ...appForm, startupName: e.target.value })}
                      className="!bg-neutral-900 !border-neutral-800 !text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">
                      Founder Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Yonas Tadesse"
                      value={appForm.founderName}
                      onChange={(e) => setAppForm({ ...appForm, founderName: e.target.value })}
                      className="!bg-neutral-900 !border-neutral-800 !text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="email"
                      placeholder="founder@startup.com"
                      value={appForm.email}
                      onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                      className="!bg-neutral-900 !border-neutral-800 !text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="+251 91 234 5678"
                      value={appForm.phone}
                      onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                      className="!bg-neutral-900 !border-neutral-800 !text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">Industry</label>
                    <select
                      value={appForm.industry}
                      onChange={(e) => setAppForm({ ...appForm, industry: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs font-medium px-3.5 py-3 focus:border-brand-accent focus:outline-none"
                    >
                      <option value="Fintech">Fintech & Payments</option>
                      <option value="Healthtech">Healthtech & Bio</option>
                      <option value="Edtech">Edtech & E-Learning</option>
                      <option value="SaaS">SaaS & Enterprise</option>
                      <option value="Agritech">Agritech & Food</option>
                      <option value="AI/ML">AI & Machine Learning</option>
                      <option value="CleanTech">CleanTech & Energy</option>
                      <option value="E-commerce">E-commerce & Logistics</option>
                      <option value="Other">Other Category</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">Startup Stage</label>
                    <select
                      value={appForm.startupStage}
                      onChange={(e) => setAppForm({ ...appForm, startupStage: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs font-medium px-3.5 py-3 focus:border-brand-accent focus:outline-none"
                    >
                      <option value="Idea Stage">Idea Stage (Concept)</option>
                      <option value="MVP Built">MVP Built (Testing)</option>
                      <option value="Early Traction">Early Traction (Paying Users)</option>
                      <option value="Growth Stage">Growth Stage (Scaling)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">Team Size</label>
                    <select
                      value={appForm.teamSize}
                      onChange={(e) => setAppForm({ ...appForm, teamSize: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs font-medium px-3.5 py-3 focus:border-brand-accent focus:outline-none"
                    >
                      <option value="1 founder">Solo Founder</option>
                      <option value="1-3 members">1 - 3 members</option>
                      <option value="4-6 members">4 - 6 members</option>
                      <option value="7-10 members">7 - 10 members</option>
                      <option value="10+ members">10+ members</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">Website URL (Optional)</label>
                    <Input
                      placeholder="https://my-startup.com"
                      value={appForm.website}
                      onChange={(e) => setAppForm({ ...appForm, website: e.target.value })}
                      className="!bg-neutral-900 !border-neutral-800 !text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">LinkedIn Profile (Optional)</label>
                    <Input
                      placeholder="https://linkedin.com/in/founder"
                      value={appForm.linkedIn}
                      onChange={(e) => setAppForm({ ...appForm, linkedIn: e.target.value })}
                      className="!bg-neutral-900 !border-neutral-800 !text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-2">
                    Brief Startup Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your value proposition, target customers, and core product technology..."
                    value={appForm.briefDescription}
                    onChange={(e) => setAppForm({ ...appForm, briefDescription: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs font-medium p-3.5 focus:border-brand-accent focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">Current Key Challenges</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Need technical architecture review, investor introductions, legal registration..."
                      value={appForm.currentChallenges}
                      onChange={(e) => setAppForm({ ...appForm, currentChallenges: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs font-medium p-3.5 focus:border-brand-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">Funding Status</label>
                    <select
                      value={appForm.fundingStatus}
                      onChange={(e) => setAppForm({ ...appForm, fundingStatus: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs font-medium px-3.5 py-3 focus:border-brand-accent focus:outline-none"
                    >
                      <option value="Bootstrapped">Bootstrapped (Self-funded)</option>
                      <option value="Friends & Family">Friends & Family Round</option>
                      <option value="Pre-Seed">Pre-Seed Raised</option>
                      <option value="Seed Stage">Seed Stage Raised</option>
                      <option value="Series A+">Series A or Beyond</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="success"
                  disabled={submitAppMutation.isPending}
                  className="w-full font-extrabold py-4 text-sm rounded-xl shadow-lg shadow-brand-accent/20"
                >
                  {submitAppMutation.isPending ? 'Submitting Application...' : 'Submit Application'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* PROGRAM DETAILS MODAL */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1c1c1c] border border-neutral-800 rounded-3xl max-w-xl w-full p-7 relative shadow-2xl"
            >
              <button
                onClick={() => setSelectedProgram(null)}
                className="absolute top-5 right-5 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                  {iconMap[selectedProgram.icon] || <Rocket className="w-6 h-6 text-brand-accent" />}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent">
                    {selectedProgram.category} Track
                  </span>
                  <h3 className="text-xl font-bold text-white">{selectedProgram.title}</h3>
                </div>
              </div>

              <p className="text-xs text-neutral-slate-300 font-medium leading-relaxed mb-6">
                {selectedProgram.fullDescription || selectedProgram.shortDescription}
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
                  <span className="text-neutral-400 font-medium">Cohort Duration:</span>
                  <span className="font-bold text-white">{selectedProgram.duration}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
                  <span className="text-neutral-400 font-medium">Eligibility Target:</span>
                  <span className="font-bold text-white">{selectedProgram.eligibility}</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Key Program Benefits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedProgram.benefits.map((b, i) => (
                    <div key={i} className="flex items-center text-xs text-neutral-slate-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent mr-2 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-800">
                <Button variant="secondary" onClick={() => setSelectedProgram(null)} className="text-xs font-bold">
                  Close
                </Button>
                <Button
                  variant="success"
                  onClick={() => {
                    handleOpenApplyModal(selectedProgram);
                    setSelectedProgram(null);
                  }}
                  className="text-xs font-bold px-5"
                >
                  Apply to this Track
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOOK CONSULTATION MODAL */}
      <AnimatePresence>
        {isConsultModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1c1c1c] border border-neutral-800 rounded-3xl max-w-lg w-full p-7 relative shadow-2xl"
            >
              <button
                onClick={() => setIsConsultModalOpen(false)}
                className="absolute top-5 right-5 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xl font-bold text-white mb-2">Book a Startup Consultation</h3>
              <p className="text-xs text-neutral-slate-400 font-medium mb-6">
                Schedule a 1-on-1 discovery call with our program director to discuss program fit, workspace amenities, and incubation terms.
              </p>

              {consultSuccess ? (
                <div className="p-6 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl text-center">
                  <CheckCircle2 className="w-10 h-10 text-brand-accent mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-white mb-1">Consultation Scheduled!</h4>
                  <p className="text-xs text-neutral-300">We have received your request and will send a calendar invite to your email shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleConsultSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Full Name</label>
                    <Input
                      required
                      placeholder="Founder Name"
                      value={consultForm.founderName}
                      onChange={(e) => setConsultForm({ ...consultForm, founderName: e.target.value })}
                      className="!bg-neutral-900 !border-neutral-800 !text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Email Address</label>
                    <Input
                      required
                      type="email"
                      placeholder="founder@startup.com"
                      value={consultForm.email}
                      onChange={(e) => setConsultForm({ ...consultForm, email: e.target.value })}
                      className="!bg-neutral-900 !border-neutral-800 !text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Preferred Topic</label>
                    <select
                      value={consultForm.preferredTopic}
                      onChange={(e) => setConsultForm({ ...consultForm, preferredTopic: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs font-medium px-3.5 py-2.5 focus:border-brand-accent focus:outline-none"
                    >
                      <option value="Incubation & Accelerator Entry">Incubation & Accelerator Entry</option>
                      <option value="Coworking Suite & Hot Desk Rental">Coworking Suite & Hot Desk Rental</option>
                      <option value="Investor Pitch & Demo Day Entry">Investor Pitch & Demo Day Entry</option>
                      <option value="Technical Mentorship & Advisory">Technical Mentorship & Advisory</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Brief Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Share a short overview of your startup vision or questions..."
                      value={consultForm.notes}
                      onChange={(e) => setConsultForm({ ...consultForm, notes: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs font-medium p-3 focus:border-brand-accent focus:outline-none"
                    />
                  </div>

                  <Button type="submit" variant="success" className="w-full font-bold py-3 text-xs rounded-xl mt-2">
                    Confirm Consultation Request
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
