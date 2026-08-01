import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import WeVentureLogo from '../components/WeVentureLogo';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Brand Illustration Sidebar (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0F172A] overflow-hidden items-center justify-center p-12 border-r border-slate-800">
        {/* Ambient backdrop glow using WeVentureHub Primary Blue & Lemon Green */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#84CC16]/20 filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#84CC16]/15 filter blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md text-center space-y-6">
          <Link to="/" className="inline-flex items-center space-x-3 text-white">
            <WeVentureLogo size="42" mode="dark" className="drop-shadow-md" />
            <span className="font-display font-extrabold text-3xl tracking-tight">
              WeVenture<span className="text-[#84CC16]">Hub</span>
            </span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="font-display font-extrabold text-3xl text-white tracking-tight leading-snug">
              Empower Your Workspace, Simplify Your Events.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Reserve premium hot desks, schedule high-tech meeting rooms, and participate in exclusive WeVentureHub community events.
            </p>
          </motion.div>

          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/60 text-[#84CC16] text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4 text-[#84CC16]" />
            <span>WeVentureHub Event & Workspace Platform</span>
          </div>
        </div>
      </div>

      {/* Form Content Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-14">
        <div className="flex justify-between items-center lg:hidden mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <WeVentureLogo size="32" className="drop-shadow-sm" />
            <span className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
              WeVenture<span className="text-[#84CC16]">Hub</span>
            </span>
          </Link>
          <Link to="/" className="text-xs font-bold text-[#65A30D] dark:text-[#84CC16] hover:underline transition">
            Back to Website
          </Link>
        </div>

        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </div>

        <div className="text-center mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <p className="text-xs text-slate-500 font-medium">
            WeVentureHub Platform &bull; Secure User Authorization & Encrypted Sessions
          </p>
        </div>
      </div>
    </div>
  );
}

