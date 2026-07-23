import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  ArrowLeft,
  Calendar,
  Briefcase,
  AlertCircle,
  Tag,
  MapPin,
  Flame,
  Tv,
  Wifi,
  Coffee,
  Volume2,
  Maximize2,
  Layers,
  Star
} from 'lucide-react';
import { axiosInstance } from '../lib/axiosInstance';
import { bookingApi } from '../lib/bookingApi';
import { useAppSelector } from '../store';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { motion } from 'motion/react';

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi,
  wifi_high_speed: Wifi,
  projector: Tv,
  tv: Tv,
  screen: Tv,
  monitor: Tv,
  coffee: Coffee,
  tea: Coffee,
  refreshments: Coffee,
  whiteboard: Briefcase,
  webcam: Tv,
  boardroom: Building
};

const getWorkspaceCover = (ws: any) => {
  if (ws.coverImage) return ws.coverImage;
  if (ws.imageUrl) return ws.imageUrl;
  if (ws.galleryImages && ws.galleryImages.length > 0) return ws.galleryImages[0];
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';
};

export default function WorkspaceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Data States
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form States
  const [bookingDate, setBookingDate] = useState('2026-07-01');
  const [bookingStart, setBookingStart] = useState('09:00');
  const [bookingEnd, setBookingEnd] = useState('11:00');
  const [bookingPurpose, setBookingPurpose] = useState('Workspace Booking');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch workspace details
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get(`/public/workspaces/${id}`);
        setWorkspace(res.data.data);
      } catch (err: any) {
        console.error('Failed to load workspace detail:', err);
        setError(err.response?.data?.message || 'Workspace detail not found.');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center py-24 text-white">
        <div className="animate-spin w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full mb-4" />
        <p className="text-sm font-semibold text-neutral-slate-400">Syncing workspace coordinates...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-[#111111] py-16 text-white">
        <div className="max-w-md mx-auto text-center bg-[#181818] p-8 rounded-2xl border border-neutral-800 space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Workspace Not Found</h2>
          <p className="text-xs text-neutral-slate-400">{error || 'This space has been retired or doesn\'t exist.'}</p>
          <Link to="/workspaces">
            <Button size="sm" variant="success" className="mt-2">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate booking estimate
  const getBookingEstimate = () => {
    try {
      const startDt = new Date(`${bookingDate}T${bookingStart}:00`);
      const endDt = new Date(`${bookingDate}T${bookingEnd}:00`);
      const durationHours = Math.max(0.5, (endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60));

      let baseAmount = 0;
      let appliedRuleDetails: string[] = [];

      // 1. Package check
      const packagePricing = workspace.packagePricing || [];
      const dailyRate = workspace.dailyRate;
      let appliedPkg = null;

      if (packagePricing.length > 0) {
        const sortedPackages = [...packagePricing].sort((a, b) => b.hours - a.hours);
        for (const pkg of sortedPackages) {
          if (durationHours >= pkg.hours) {
            appliedPkg = pkg;
            break;
          }
        }
      }

      if (appliedPkg) {
        const multiplier = Math.floor(durationHours / appliedPkg.hours);
        const remainder = durationHours % appliedPkg.hours;
        baseAmount = (multiplier * appliedPkg.price) + (remainder * workspace.hourlyRate);
        appliedRuleDetails.push(`Package: ${appliedPkg.name}`);
      } else if (dailyRate && durationHours >= 8) {
        const days = Math.ceil(durationHours / 24);
        baseAmount = days * dailyRate;
        appliedRuleDetails.push(`Daily Flat Price`);
      } else {
        baseAmount = durationHours * workspace.hourlyRate;
      }

      let totalAmount = baseAmount;

      // 2. Dynamic Rules check
      const dynamicRules = workspace.dynamicPricingRules || [];
      for (const rule of dynamicRules) {
        let active = false;
        if (rule.type === 'weekend') {
          const startDay = startDt.getDay();
          const endDay = endDt.getDay();
          if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
            active = true;
          }
        } else if (rule.type === 'peak_hour') {
          const ruleStart = rule.startHour || 9;
          const ruleEnd = rule.endHour || 17;
          if (startDt.getHours() < ruleEnd && endDt.getHours() > ruleStart) {
            active = true;
          }
        } else if (rule.type === 'seasonal') {
          const ruleStartMonth = rule.startMonth || 1;
          const ruleEndMonth = rule.endMonth || 12;
          const currentMonth = startDt.getMonth() + 1;
          if (currentMonth >= ruleStartMonth && currentMonth <= ruleEndMonth) {
            active = true;
          }
        }

        if (active) {
          const adj = rule.modifierType === 'percentage' 
            ? (baseAmount * (rule.modifierValue / 100)) 
            : rule.modifierValue;
          totalAmount += adj;
          appliedRuleDetails.push(`${rule.ruleName} (${adj >= 0 ? '+' : ''}$${adj.toFixed(2)})`);
        }
      }

      return {
        hours: durationHours,
        baseAmount: Math.round(baseAmount * 100) / 100,
        totalAmount: Math.max(0, Math.round(totalAmount * 100) / 100),
        appliedRules: appliedRuleDetails
      };
    } catch {
      return { hours: 0, baseAmount: 0, totalAmount: 0, appliedRules: [] };
    }
  };

  const estimate = getBookingEstimate();

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/workspaces/${id}` } });
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const startIso = new Date(`${bookingDate}T${bookingStart}:00`).toISOString();
    const endIso = new Date(`${bookingDate}T${bookingEnd}:00`).toISOString();

    try {
      const response = await bookingApi.createBooking({
        spaceId: workspace.id,
        startTime: startIso,
        endTime: endIso,
        purpose: bookingPurpose
      });

      setBookingSuccess(true);
      
      // Auto redirect to payment checkout after brief display
      setTimeout(() => {
        navigate('/dashboard/checkout', {
          state: {
            targetType: 'BOOKING',
            targetId: response.id || response._id || 'BOOKING-MOCK',
            amount: estimate.totalAmount,
            currency: workspace.currency || 'USD',
            title: workspace.name,
            description: `Workspace Reservation booking on ${bookingDate} (${estimate.hours.toFixed(1)} hrs)`
          }
        });
      }, 2000);

    } catch (err: any) {
      console.error('Failed to submit booking:', err);
      setFormError(err.response?.data?.message || err.message || 'Conflict detected or booking unavailable.');
    } finally {
      setSubmitting(false);
    }
  };

  const startHour = workspace.availabilityRules?.startHour || 8;
  const endHour = workspace.availabilityRules?.endHour || 20;

  return (
    <div className="min-h-screen bg-[#111111] pb-16 text-white">
      {/* Detail Header / Hero Banner */}
      <div className="bg-[#141414] border-b border-neutral-800 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/workspaces" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-neutral-slate-400 hover:text-brand-accent transition-colors">
            <ArrowLeft className="w-4 h-4 text-neutral-slate-400" />
            <span>Back to Workspace Marketplace</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns - Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Visual Header Banner */}
            <div className="rounded-[24px] overflow-hidden shadow-2xl border border-neutral-800 space-y-4">
              <div className="h-80 w-full relative">
                <img
                  src={getWorkspaceCover(workspace)}
                  alt={workspace.title || workspace.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/90 via-transparent to-transparent flex flex-col justify-end p-8">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-900 bg-brand-accent px-3 py-1 rounded-[6px] shadow-sm border border-brand-accent/20">
                      {workspace.category || workspace.workspaceType || (workspace.type && workspace.type.replace('_', ' '))}
                    </span>
                    {workspace.floor && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-neutral-900/80 backdrop-blur px-3 py-1 rounded-[6px] border border-neutral-700">
                        {workspace.floor}
                      </span>
                    )}
                  </div>
                  <h1 className="text-[28px] md:text-[36px] font-display font-bold text-white tracking-tight leading-tight">
                    {workspace.title || workspace.name}
                  </h1>
                </div>
              </div>

              {/* Gallery Images Strip */}
              {Array.isArray(workspace.galleryImages) && workspace.galleryImages.length > 0 && (
                <div className="p-4 bg-[#181818] flex items-center gap-3 overflow-x-auto border-t border-neutral-800">
                  {workspace.galleryImages.map((imgUrl: string, idx: number) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Gallery ${idx + 1}`}
                      className="w-24 h-16 rounded-[12px] object-cover border border-neutral-800 hover:border-brand-accent transition cursor-pointer shrink-0"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Space Properties Cards (Bento style) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#181818] p-4 rounded-[20px] border border-neutral-800 shadow-md flex items-center gap-3">
                <div className="p-2.5 bg-brand-accent/10 text-brand-accent rounded-[12px] border border-brand-accent/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-slate-400">Total Capacity</p>
                  <p className="text-[13px] font-bold text-white">{workspace.capacity} Seats</p>
                </div>
              </div>

              <div className="bg-[#181818] p-4 rounded-[20px] border border-neutral-800 shadow-md flex items-center gap-3">
                <div className="p-2.5 bg-brand-accent/10 text-brand-accent rounded-[12px] border border-brand-accent/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-slate-400">Hourly Rate</p>
                  <p className="text-[13px] font-bold text-white font-mono">
                    {workspace.currency || 'USD'} {Number(workspace.hourlyPrice !== undefined ? workspace.hourlyPrice : (workspace.hourlyRate || 0)).toFixed(2)}/hr
                  </p>
                </div>
              </div>

              <div className="bg-[#181818] p-4 rounded-[20px] border border-neutral-800 shadow-md flex items-center gap-3">
                <div className="p-2.5 bg-brand-accent/10 text-brand-accent rounded-[12px] border border-brand-accent/20">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-slate-400">Space Size</p>
                  <p className="text-[13px] font-bold text-white">{workspace.size || '350 sqft'}</p>
                </div>
              </div>

              <div className="bg-[#181818] p-4 rounded-[20px] border border-neutral-800 shadow-md flex items-center gap-3">
                <div className="p-2.5 bg-brand-accent/10 text-brand-accent rounded-[12px] border border-brand-accent/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-slate-400">Status</p>
                  <p className="text-[13px] font-bold text-brand-accent">{workspace.availability || 'Available'}</p>
                </div>
              </div>
            </div>

            {/* Detailed Description / About */}
            <div className="bg-[#181818] p-7 rounded-[24px] border border-neutral-800 shadow-sm space-y-6">
              <h2 className="text-[18px] font-display font-bold text-white tracking-tight">About this Workspace</h2>
              <p className="text-[14px] text-neutral-slate-300 leading-relaxed whitespace-pre-line">
                {workspace.fullDescription || workspace.shortDescription || 'This fully serviced, professionally curated workspace resource provides the ideal setup for productive workflows.'}
              </p>

              {/* Amenities */}
              {Array.isArray(workspace.amenities) && workspace.amenities.length > 0 && (
                <div className="border-t border-neutral-800 pt-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-slate-400 mb-4">Included Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {workspace.amenities.map((am: string) => {
                      const matchedIcon = AMENITY_ICONS[am.toLowerCase().replace(/[^a-z_]/g, '')] || Building;
                      const Icon = matchedIcon;
                      return (
                        <div key={am} className="flex items-center gap-2 text-[12.5px] font-semibold text-neutral-slate-300">
                          <Icon className="w-4 h-4 text-brand-accent" />
                          <span>{am}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Features */}
              {Array.isArray(workspace.features) && workspace.features.length > 0 && (
                <div className="border-t border-neutral-800 pt-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-slate-400 mb-4">Key Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {workspace.features.map((feat: string) => (
                      <span key={feat} className="text-[12px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-slate-300 px-3 py-1 rounded-full">
                        ✨ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Host Details */}
            {workspace.organizer && (
              <div className="bg-[#181818] p-7 rounded-[24px] border border-neutral-800 shadow-sm space-y-5">
                <h2 className="text-[16px] font-display font-bold text-white tracking-tight">Verified Host & Venue Operator</h2>
                <div className="flex items-center gap-4">
                  {workspace.organizer.branding?.logoUrl ? (
                    <img src={workspace.organizer.branding.logoUrl} alt={workspace.organizer.name} className="w-14 h-14 rounded-2xl object-cover border border-neutral-800" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-brand-accent flex items-center justify-center font-bold text-xl border border-neutral-800">
                      {workspace.organizer.name[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-white text-[15px]">{workspace.organizer.name}</h3>
                    <p className="text-[11px] font-bold text-neutral-slate-400 uppercase tracking-wider mt-0.5">Verified Platform Tenant Operator</p>
                  </div>
                </div>
                <p className="text-[13px] text-neutral-slate-300 leading-relaxed">{workspace.organizer.description || 'Dedicated to establishing professional venues and high-productivity corporate operations.'}</p>
                <Link to={`/organizers/${workspace.organizer.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-accent hover:underline pt-1">
                  <span>Explore all rooms by {workspace.organizer.name}</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            )}

            {/* Dynamic Pricing Engine explanation panel */}
            <div className="bg-[#1c1c1c] border border-neutral-800 p-7 rounded-[24px] space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5 text-brand-accent">
                <Flame className="w-5.5 h-5.5 text-brand-accent" />
                <h2 className="text-[15px] font-display font-bold text-white">Pricing Model & Dynamic Adjustments</h2>
              </div>
              <p className="text-[13px] text-neutral-slate-300 leading-relaxed">
                We implement a smart, multi-tiered pricing engine. This space supports hourly booking capping, daily flat discounts, and dynamic weekend modifiers. Review the exact pricing controls in action below:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[12px] font-semibold">
                <div className="p-4 bg-neutral-900 rounded-[16px] space-y-2 border border-neutral-800 shadow-sm">
                  <p className="text-[10px] text-neutral-slate-400 font-bold uppercase tracking-wider">Capped Pricing Structures</p>
                  <p className="text-neutral-slate-200">
                    Daily flat-rate: {workspace.dailyRate ? `$${workspace.dailyRate.toFixed(2)}/day` : 'None configured'}
                  </p>
                  {workspace.packagePricing && workspace.packagePricing.length > 0 ? (
                    workspace.packagePricing.map((pkg: any) => (
                      <p key={pkg.name} className="text-brand-accent">
                        Package: {pkg.name} (Min {pkg.hours} hrs) for ${pkg.price}
                      </p>
                    ))
                  ) : (
                    <p className="text-neutral-slate-500 font-normal">No custom package schedules loaded</p>
                  )}
                </div>

                <div className="p-4 bg-neutral-900 rounded-[16px] space-y-2 border border-neutral-800 shadow-sm">
                  <p className="text-[10px] text-neutral-slate-400 font-bold uppercase tracking-wider">Active Dynamic Modifiers</p>
                  {workspace.dynamicPricingRules && workspace.dynamicPricingRules.length > 0 ? (
                    workspace.dynamicPricingRules.map((rule: any) => (
                      <p key={rule.ruleName} className="text-neutral-slate-200">
                        ⚡ {rule.ruleName}: {rule.modifierValue}% {rule.modifierType === 'percentage' ? 'surcharge' : 'flat fee'} ({rule.type})
                      </p>
                    ))
                  ) : (
                    <p className="text-neutral-slate-500 font-normal">Standard rates apply; no active peak rules.</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Booking Form Panel */}
          <div className="space-y-6">
            <div className="bg-[#181818] p-6 rounded-[24px] border border-neutral-800 shadow-2xl sticky top-6 text-white">
              <h2 className="text-[16px] font-display font-bold text-white mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-accent" />
                <span>Reserve this Space</span>
              </h2>

              {bookingSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 bg-emerald-950/80 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-bounce" />
                  </div>
                  <h3 className="font-display font-bold text-[18px] text-white">Booking Established!</h3>
                  <p className="text-[13px] text-neutral-slate-300">
                    {workspace.type === 'HOT_DESK'
                      ? 'Desk reservation confirmed! Redirecting to instant payment gateway...'
                      : 'Request submitted! Redirecting to payment checkout...'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3.5 bg-rose-950/80 text-rose-400 rounded-[10px] text-[12px] font-bold flex items-center gap-2 border border-rose-900">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {!isAuthenticated && (
                    <div className="p-3.5 bg-amber-950/80 text-amber-400 rounded-[10px] text-[12.5px] font-semibold border border-amber-900">
                      You must be signed in to submit this booking. Proceeding will prompt login.
                    </div>
                  )}

                  <Input
                    label="Booking Date"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    labelClassName="!text-neutral-slate-300 font-bold"
                    className="w-full rounded-[10px] !border-neutral-800 !bg-neutral-900 !text-white focus:ring-brand-accent/20 focus:border-brand-accent"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Start Time"
                      type="time"
                      value={bookingStart}
                      min={`${startHour.toString().padStart(2, '0')}:00`}
                      max={`${endHour.toString().padStart(2, '0')}:00`}
                      onChange={(e) => setBookingStart(e.target.value)}
                      required
                      labelClassName="!text-neutral-slate-300 font-bold"
                      className="w-full rounded-[10px] !border-neutral-800 !bg-neutral-900 !text-white focus:ring-brand-accent/20 focus:border-brand-accent"
                    />
                    <Input
                      label="End Time"
                      type="time"
                      value={bookingEnd}
                      min={`${(startHour + 1).toString().padStart(2, '0')}:00`}
                      max={`${endHour.toString().padStart(2, '0')}:00`}
                      onChange={(e) => setBookingEnd(e.target.value)}
                      required
                      labelClassName="!text-neutral-slate-300 font-bold"
                      className="w-full rounded-[10px] !border-neutral-800 !bg-neutral-900 !text-white focus:ring-brand-accent/20 focus:border-brand-accent"
                    />
                  </div>

                  <div className="text-[10px] text-neutral-slate-400 font-bold bg-neutral-900 px-3 py-1.5 rounded-[6px] border border-neutral-800 inline-block">
                    Allowed Operational Hours: {startHour}:00 - {endHour}:00 (Mon-Fri)
                  </div>

                  <Input
                    label="Utilization Purpose"
                    placeholder="e.g. Q3 Sales Sync or Deep work..."
                    value={bookingPurpose}
                    onChange={(e) => setBookingPurpose(e.target.value)}
                    labelClassName="!text-neutral-slate-300 font-bold"
                    className="w-full rounded-[10px] !border-neutral-800 !bg-neutral-900 !text-white focus:ring-brand-accent/20 focus:border-brand-accent"
                  />

                  {/* Pricing breakdown summary */}
                  <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-[16px] space-y-3 text-[13px]">
                    <div className="flex justify-between font-bold text-neutral-slate-300">
                      <span>Total Hours:</span>
                      <span className="font-mono text-white">{estimate.hours.toFixed(1)} hrs</span>
                    </div>

                    {estimate.appliedRules.length > 0 && (
                      <div className="border-t border-dashed border-neutral-800 pt-3 space-y-1.5">
                        <p className="text-[10px] text-neutral-slate-400 font-bold uppercase tracking-wider">Applied Pricing Tiers</p>
                        {estimate.appliedRules.map((rule) => (
                          <div key={rule} className="flex justify-between text-brand-accent text-[11px] font-bold">
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-dashed border-neutral-800 pt-3 flex justify-between items-center">
                      <span className="font-bold text-neutral-slate-300">Estimated Price:</span>
                      <span className="font-bold text-[20px] text-brand-accent font-mono">${estimate.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="success"
                    className="w-full flex items-center justify-center gap-2 font-bold text-[13px] py-3 rounded-[10px] shadow-sm transition-colors"
                    isLoading={submitting}
                  >
                    <span>{isAuthenticated ? 'Book & Pay Now' : 'Sign In to Reserve'}</span>
                  </Button>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* Recommendations Section */}
        {workspace.recommendations && workspace.recommendations.length > 0 && (
          <div className="mt-16 border-t border-neutral-800 pt-12">
            <h2 className="text-[20px] font-display font-bold text-white mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {workspace.recommendations.map((rec: any) => (
                <div key={rec.id} className="bg-[#181818] rounded-[20px] overflow-hidden border border-neutral-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-lg hover:border-brand-accent/40 hover:scale-[1.01] transition-all duration-300 group">
                  <div>
                    <div className="h-36 overflow-hidden relative">
                      <img src={getWorkspaceCover(rec)} alt={rec.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute top-3 right-3 bg-[#111827]/85 backdrop-blur px-2.5 py-1 rounded-[6px] text-[11px] font-bold text-brand-accent font-mono shadow-sm">${rec.hourlyRate.toFixed(2)}/hr</div>
                    </div>
                    <div className="p-5 space-y-2">
                      <span className="text-[9px] font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-[4px] uppercase tracking-wider">{rec.type.replace('_', ' ')}</span>
                      <h4 className="font-bold text-[14px] text-white truncate group-hover:text-brand-accent transition-colors">{rec.name}</h4>
                      <p className="text-[12px] text-neutral-slate-400 font-medium font-mono">Up to {rec.capacity} Seats</p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 border-t border-neutral-850 text-right bg-neutral-900/40">
                    <Link to={`/workspaces/${rec.id}`} className="text-[12px] font-bold text-brand-accent hover:underline inline-flex items-center gap-1.5">
                      <span>View Space</span>
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
