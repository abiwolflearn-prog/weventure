import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import WeVentureLogo from '../components/WeVentureLogo';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-neutral-slate-50">
      {/* Brand Illustration Sidebar (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-neutral-slate-900 overflow-hidden items-center justify-center p-12">
        {/* Ambient backdrop glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-primary opacity-20 filter blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500 opacity-10 filter blur-3xl" />

        <div className="relative z-10 max-w-md text-center">
          <Link to="/" className="inline-flex items-center space-x-2 text-white mb-8">
            <WeVentureLogo size="40" mode="dark" className="drop-shadow-sm" />
            <span className="font-display font-bold text-2xl tracking-tight">WeVentureHub</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="font-display font-bold text-3xl text-white tracking-tight leading-tight mb-4">
              Empower Your Workspace, Simplify Your Events.
            </h2>
            <p className="text-neutral-slate-400 text-sm leading-relaxed mb-6">
              Access premium desks, schedule high-tech boardrooms, and orchestrate enterprise events through a single unified SaaS control plane.
            </p>
          </motion.div>

          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-neutral-slate-800 text-brand-accent text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Workspace Platform</span>
          </div>
        </div>
      </div>

      {/* Form Content Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 md:p-16">
        <div className="flex justify-between items-center lg:hidden mb-12">
          <Link to="/" className="flex items-center space-x-2">
            <WeVentureLogo size="32" className="drop-shadow-sm" />
            <span className="font-display font-bold text-lg">WeVentureHub</span>
          </Link>
          <Link to="/" className="text-xs text-neutral-slate-500 hover:text-brand-primary transition">
            Back to site
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

        <div className="text-center mt-12">
          <p className="text-xs text-neutral-slate-500">
            Secure, multi-tenant workspace transactions. Secured via standard JWT encryption.
          </p>
        </div>
      </div>
    </div>
  );
}
