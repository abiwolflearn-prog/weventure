import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Sparkles, Zap, Building, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { publicApi } from '../lib/publicApi';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const { data: dbPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['membershipPlansPublic'],
    queryFn: publicApi.getPlans,
  });

  const { data: faqs, isLoading: faqsLoading } = useQuery({
    queryKey: ['publicFaqs'],
    queryFn: publicApi.getFaqs,
  });

  // Map database plans or fallback to standardized structure
  const plans = (dbPlans && dbPlans.length > 0) ? dbPlans.map((p: any) => {
    const monthlyPrice = p.price?.monthly || p.monthlyPrice || 25;
    const yearlyPrice = p.price?.annually || Math.round(monthlyPrice * 0.8);
    const finalPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;
    return {
      id: p.id || p._id,
      name: p.name || p.title,
      price: finalPrice,
      period: billingCycle === 'monthly' ? "/mo" : "/mo, billed annually",
      desc: p.description || p.tagline || 'Access to WeVentureHub network and facilities.',
      features: p.features || p.benefits || [],
      popular: p.isPopular || p.isFeatured || false,
      code: p.code || 'COMMUNITY',
    };
  }) : [
    {
      id: 'comm',
      name: "Community Member",
      price: billingCycle === 'monthly' ? 25 : 20,
      period: billingCycle === 'monthly' ? "/mo" : "/mo, billed annually",
      desc: "Perfect for remote founders, local startup operators, and community attendees.",
      features: [
        "Access to open community spaces (2 days/month)",
        "Free entry to public workshops & meetups",
        "Access to digital community directories & messaging",
        "Member rates for boardrooms",
        "Complimentary high-speed fiber Wi-Fi & premium coffee"
      ],
      popular: false,
      code: 'COMMUNITY',
    },
    {
      id: 'desk',
      name: "Dedicated Hot Desk",
      price: billingCycle === 'monthly' ? 150 : 120,
      period: billingCycle === 'monthly' ? "/mo" : "/mo, billed annually",
      desc: "Best for individual freelancers, scaling builders, and dedicated startup developers.",
      features: [
        "24/7 dedicated hot-desk workstation access",
        "10 free meeting room booking hours per month",
        "Free admission to all hackathons & trainings",
        "Business mailing address & storage locker",
        "Connection with local mentors & advisors",
        "Secure high-fidelity QR check-in codes"
      ],
      popular: true,
      code: 'DESK',
    },
    {
      id: 'startup',
      name: "Resident Startup Suite",
      price: billingCycle === 'monthly' ? 650 : 520,
      period: billingCycle === 'monthly' ? "/mo" : "/mo, billed annually",
      desc: "Designed for high-growth incubation cohorts, venture-backed startups, and remote teams.",
      features: [
        "Private lockable physical suite for 4-12 team members",
        "Unlimited boardroom reservations",
        "Direct application track to startup accelerator cohort",
        "Featured booth representation on Demo Days & Pitch events",
        "Sponsor introduction pipelines & pitch coaching",
        "Printed certificates for program completions",
        "Premium support with direct physical site coordinators"
      ],
      popular: false,
      code: 'STARTUP',
    }
  ];

  return (
    <div className="bg-neutral-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-bold text-brand-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empower Your Innovation Journey</span>
          </span>
          <h1 className="font-display font-black text-3.5xl md:text-5xl text-neutral-slate-900 tracking-tight leading-none">
            WeVentureHub Memberships
          </h1>
          <p className="text-sm md:text-base text-neutral-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
            Choose a tier tailored to your startup's development stage. Gain premium access to coworking workspaces, advanced boardrooms, mentor rosters, and high-fidelity tech panels.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="bg-white border border-neutral-slate-200 p-1 rounded-xl flex items-center space-x-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-slate-600 hover:text-neutral-slate-800'
                }`}
              >
                Monthly Rates
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-slate-600 hover:text-neutral-slate-800'
                }`}
              >
                <span>Annual Rates</span>
                <span className="px-1.5 py-0.5 bg-brand-primary/20 border border-brand-primary/30 rounded text-[9px] font-black text-brand-primary uppercase">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        {plansLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {plans.map((plan: any) => (
              <div
                key={plan.id || plan.name}
                className={`bg-white border rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-8 relative ${
                  plan.popular 
                    ? 'border-brand-primary shadow-lg ring-1 ring-brand-primary/10' 
                    : 'border-neutral-slate-200 shadow-xs'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-primary border border-brand-primary text-white rounded-full text-[9px] font-black tracking-widest uppercase">
                    Best Value Choice
                  </span>
                )}

                {/* Top half */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-neutral-slate-50 border border-neutral-slate-200/50 rounded-xl text-brand-primary">
                      {plan.popular ? <Zap className="w-5 h-5 text-amber-500" /> : <Building className="w-5 h-5" />}
                    </div>
                    {plan.popular && (
                      <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-md uppercase">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display font-extrabold text-lg text-neutral-slate-900">{plan.name}</h3>
                    <p className="text-[11px] text-neutral-slate-400 font-light leading-relaxed">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline text-neutral-slate-900">
                    <span className="font-display font-black text-4xl">${plan.price}</span>
                    <span className="text-[11px] font-mono text-neutral-slate-400 ml-1.5">{plan.period}</span>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 pt-4 border-t border-neutral-slate-100">
                    <span className="block text-[9px] font-black text-neutral-slate-400 uppercase tracking-widest">Membership Privileges</span>
                    <ul className="space-y-2.5 text-xs text-neutral-slate-600">
                      {plan.features.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-2.5">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="font-light">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom half CTA */}
                <Link to={`/register?plan=${plan.code}`}>
                  <Button
                    className={`w-full py-2.5 text-xs font-bold rounded-xl ${
                      plan.popular
                        ? 'bg-brand-primary hover:bg-brand-primary-hover text-white'
                        : 'bg-neutral-950 hover:bg-neutral-900 text-white'
                    }`}
                  >
                    Select Plan
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* FAQ Area */}
        <div className="max-w-3xl mx-auto space-y-6 pt-10">
          <h3 className="font-display font-extrabold text-xl text-neutral-slate-900 text-center">Frequently Asked Questions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {faqs && faqs.length > 0 ? (
              faqs.map((faq: any) => (
                <div key={faq.id || faq._id} className="bg-white border border-neutral-slate-200 p-5 rounded-2xl space-y-2">
                  <span className="font-bold text-neutral-slate-800 block">{faq.question}</span>
                  <p className="text-neutral-slate-500 font-light leading-relaxed">{faq.answer}</p>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white border border-neutral-slate-200 p-5 rounded-2xl space-y-2">
                  <span className="font-bold text-neutral-slate-800 block">Can I reserve meeting rooms on-demand?</span>
                  <p className="text-neutral-slate-500 font-light leading-relaxed">
                    Yes! Our physical meeting rooms and private offices are integrated directly into our platform. Select an available hour and reserve directly.
                  </p>
                </div>
                <div className="bg-white border border-neutral-slate-200 p-5 rounded-2xl space-y-2">
                  <span className="font-bold text-neutral-slate-800 block">What is the Startup Accelerator Application process?</span>
                  <p className="text-neutral-slate-500 font-light leading-relaxed">
                    Our resident startups receive priority coaching and access to our cohort application platform with weekly mentoring tracks.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
