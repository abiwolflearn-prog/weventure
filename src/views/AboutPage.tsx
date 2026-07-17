import React from 'react';
import { ShieldCheck, Layers, Users, Zap, Award, Sparkles, Building, Briefcase } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-neutral-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-bold text-brand-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Silicon Coworking & Incubation Platform</span>
          </span>
          <h1 className="font-display font-black text-3.5xl md:text-5xl text-neutral-slate-900 tracking-tight leading-none">
            About WeVentureHub
          </h1>
          <p className="text-sm md:text-base text-neutral-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
            The premium event management and physical co-working coordination platform built exclusively for WeVentureHub’s global entrepreneurial ecosystem.
          </p>
        </div>

        {/* Vision details */}
        <div className="bg-white border border-neutral-slate-200 rounded-3xl p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="font-display font-extrabold text-xl text-neutral-slate-800 leading-tight">
              A Unified Physical & Digital Ecosystem
            </h2>
            <p className="text-xs text-neutral-slate-600 leading-relaxed font-light">
              WeVentureHub operates premium physical startup offices, high-tech boardrooms, and open hot desks where creators gather to build future-shaping applications.
            </p>
            <p className="text-xs text-neutral-slate-600 leading-relaxed font-light">
              Through this portal, our organization schedules specialized program tracks, provides premium badge entries, issues smart certifications, and coordinates boardrooms seamlessly.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-slate-50 rounded-2xl border border-neutral-slate-200/50 space-y-1">
              <span className="font-display font-black text-2xl text-brand-primary block">15+</span>
              <span className="text-[10px] font-bold text-neutral-slate-500 uppercase tracking-wider">Active Cohorts</span>
            </div>
            <div className="p-4 bg-neutral-slate-50 rounded-2xl border border-neutral-slate-200/50 space-y-1">
              <span className="font-display font-black text-2xl text-emerald-600 block">100%</span>
              <span className="text-[10px] font-bold text-neutral-slate-500 uppercase tracking-wider">Startup Focused</span>
            </div>
            <div className="p-4 bg-neutral-slate-50 rounded-2xl border border-neutral-slate-200/50 space-y-1">
              <span className="font-display font-black text-2xl text-amber-500 block">QR</span>
              <span className="text-[10px] font-bold text-neutral-slate-500 uppercase tracking-wider">Digital Passes</span>
            </div>
            <div className="p-4 bg-neutral-slate-50 rounded-2xl border border-neutral-slate-200/50 space-y-1">
              <span className="font-display font-black text-2xl text-purple-600 block">500+</span>
              <span className="text-[10px] font-bold text-neutral-slate-500 uppercase tracking-wider">Founding Members</span>
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="space-y-6">
          <h3 className="font-display font-extrabold text-xl text-neutral-slate-900 text-center">Our Core Community Pillars</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-neutral-slate-200 rounded-2xl p-6 space-y-3">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl w-fit">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-sm text-neutral-slate-800">Founder Fellowship</h4>
              <p className="text-[11px] text-neutral-slate-500 leading-relaxed font-light">
                Direct access to seasoned tech mentors, sponsors, and investors to build dynamic corporate strategies.
              </p>
            </div>

            <div className="bg-white border border-neutral-slate-200 rounded-2xl p-6 space-y-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                <Building className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-sm text-neutral-slate-800">Advanced Workspaces</h4>
              <p className="text-[11px] text-neutral-slate-500 leading-relaxed font-light">
                Book premium meeting rooms like the Turing Suite or the Ada Lovelace Boardroom, with real-time occupancy.
              </p>
            </div>

            <div className="bg-white border border-neutral-slate-200 rounded-2xl p-6 space-y-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl w-fit">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-sm text-neutral-slate-800">Ecosystem Rhythms</h4>
              <p className="text-[11px] text-neutral-slate-500 leading-relaxed font-light">
                Attend monthly pitch comps, hackathons, and certification workshops to continuously scale your execution capabilities.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
