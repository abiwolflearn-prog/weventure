import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Ticket, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function GetStartedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#111111] py-16 px-4 sm:px-6 lg:px-8 text-white font-sans flex items-center justify-center">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>WeVentureHub Unified Booking & Registration Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            How can we help you?
          </h1>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto">
            Select an option below to begin your reservation or event pass registration on the WeVentureHub platform.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          
          {/* Card 1: Reserve Workspace */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/workspaces')}
            className="cursor-pointer bg-neutral-900 border-2 border-neutral-800 hover:border-brand-primary rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-6 group transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="p-4 rounded-2xl bg-brand-primary/20 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <Building className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">
                Workspace Booking
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">
                Reserve Workspace
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Book executive boardrooms, dedicated desks, training facilities, or event halls with real-time hourly rates and instant confirmations.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-bold text-brand-primary border-t border-neutral-800">
              <span>View Available Workspaces</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Card 2: Register for Event */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/events')}
            className="cursor-pointer bg-neutral-900 border-2 border-neutral-800 hover:border-brand-accent rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-6 group transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="p-4 rounded-2xl bg-brand-accent/20 text-brand-accent group-hover:bg-brand-accent group-hover:text-neutral-950 transition-colors">
                <Ticket className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">
                Event Pass
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white group-hover:text-brand-accent transition-colors">
                Register for Event
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Reserve official digital passes for upcoming tech workshops, innovation summits, startup demo days, and founder pitch competitions.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-bold text-brand-accent border-t border-neutral-800">
              <span>Explore Upcoming Events</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

        </div>

        {/* Footer info banner */}
        <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-center space-x-3 text-xs text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All reservations and registrations are verified directly by WeVentureHub platform managers.</span>
        </div>

      </div>
    </div>
  );
}
