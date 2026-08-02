import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Layers, Users, Zap, Award, Sparkles, Building, Briefcase, UserCheck, Calendar } from 'lucide-react';
import { publicApi } from '../lib/publicApi';
import { motion } from 'motion/react';

export default function AboutPage() {
  const { data: about, isLoading } = useQuery({
    queryKey: ['aboutCms'],
    queryFn: publicApi.getAbout,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111111] min-h-screen py-16 text-neutral-900 dark:text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-[#111111] min-h-screen py-16 text-neutral-900 dark:text-white transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-neutral-100 dark:bg-brand-accent/10 border border-neutral-200 dark:border-brand-accent/20 rounded-full text-[10px] font-bold text-neutral-600 dark:text-brand-accent uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Silicon Coworking & Incubation Platform</span>
          </span>
          <h1 className="font-display font-black text-3.5xl md:text-5xl tracking-tight leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-400 to-teal-300 drop-shadow-sm">About</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-lime-400 to-emerald-400 drop-shadow-md">WeVentureHub</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            {about?.companyDescription || 'The premier event management and physical co-working coordination platform built exclusively for WeVentureHub’s global entrepreneurial ecosystem.'}
          </p>
        </div>

        {/* Vision details */}
        <div className="bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="font-display font-extrabold text-xl text-neutral-900 dark:text-white leading-tight">
              Our Mission & Vision
            </h2>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-brand-accent uppercase tracking-wider">Mission</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-slate-300 leading-relaxed font-light">
                {about?.mission || 'To foster high-impact entrepreneurship across East Africa by uniting founders, workspace resources, and capital.'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Vision</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-slate-300 leading-relaxed font-light">
                {about?.vision || 'To build Africa\'s premier interconnected ecosystem for technological innovation and collaborative workspaces.'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-[#111111] rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-1">
              <span className="font-display font-black text-2xl text-brand-accent block font-mono">15+</span>
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-slate-400 uppercase tracking-wider font-mono">Active Cohorts</span>
            </div>
            <div className="p-4 bg-white dark:bg-[#111111] rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-1">
              <span className="font-display font-black text-2xl text-emerald-600 dark:text-emerald-400 block font-mono">100%</span>
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-slate-400 uppercase tracking-wider font-mono">Startup Focused</span>
            </div>
            <div className="p-4 bg-white dark:bg-[#111111] rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-1">
              <span className="font-display font-black text-2xl text-amber-600 dark:text-amber-400 block font-mono">QR</span>
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-slate-400 uppercase tracking-wider font-mono">Digital Passes</span>
            </div>
            <div className="p-4 bg-white dark:bg-[#111111] rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-1">
              <span className="font-display font-black text-2xl text-purple-600 dark:text-purple-400 block font-mono">500+</span>
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-slate-400 uppercase tracking-wider font-mono">Founding Members</span>
            </div>
          </div>
        </div>

        {/* History */}
        {about?.history && (
          <div className="bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-2 shadow-sm">
            <h3 className="font-display font-extrabold text-sm text-brand-accent uppercase tracking-wider">Our History</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-slate-300 leading-relaxed">{about.history}</p>
          </div>
        )}

        {/* Core Values */}
        {about?.coreValues && about.coreValues.length > 0 && (
          <div className="space-y-6">
            <h3 className="font-display font-extrabold text-xl text-neutral-900 dark:text-white text-center">Our Core Community Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {about.coreValues.map((val: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-3 hover:border-brand-accent/40 transition duration-300 shadow-sm">
                  <div className="p-2.5 bg-brand-accent/10 text-brand-accent rounded-xl w-fit border border-brand-accent/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-display font-bold text-sm text-neutral-900 dark:text-white">{val.title}</h4>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-slate-300 leading-relaxed font-light">
                    {val.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leadership & Team */}
        {about?.teamMembers && about.teamMembers.length > 0 && (
          <div className="space-y-6">
            <h3 className="font-display font-extrabold text-xl text-neutral-900 dark:text-white text-center">Our Leadership & Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {about.teamMembers.map((member: any, idx: number) => (
                <div key={idx} className="bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-center space-y-3 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/30 mx-auto flex items-center justify-center text-brand-accent font-bold text-xl">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{member.name}</h4>
                    <span className="text-[10px] font-semibold text-brand-accent block uppercase tracking-wider">{member.role}</span>
                  </div>
                  {member.bio && <p className="text-[11px] text-neutral-500 dark:text-neutral-slate-400 line-clamp-3 font-light">{member.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {about?.timeline && about.timeline.length > 0 && (
          <div className="space-y-6">
            <h3 className="font-display font-extrabold text-xl text-neutral-900 dark:text-white text-center">Company Milestones</h3>
            <div className="space-y-4">
              {about.timeline.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4 bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm">
                  <div className="px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-lg text-brand-accent font-mono font-bold text-xs">
                    {item.year}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-slate-300 font-light mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}

