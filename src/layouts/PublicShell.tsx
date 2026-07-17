import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { FloatingSocialLinks } from '../components/FloatingSocialLinks';

export default function PublicShell() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-slate-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glassmorphism border-b border-neutral-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-brand-primary text-white rounded-lg">
              <Building className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-neutral-slate-900">
              WeVenture<span className="text-brand-primary">Hub</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-slate-600">
            <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <Link to="/events" className="hover:text-brand-primary transition-colors">Discover Events</Link>
            <Link to="/workspaces" className="hover:text-brand-primary transition-colors font-semibold text-brand-primary">Find Workspace</Link>
            <Link to="/about" className="hover:text-brand-primary transition-colors">About</Link>
            <Link to="/contact" className="hover:text-brand-primary transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link 
              to="/login" 
              className="text-sm font-medium text-neutral-slate-700 hover:text-brand-primary transition"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover rounded-lg shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Viewport with Page Transition */}
      <main className="flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-slate-900 text-neutral-slate-400 py-12 border-t border-neutral-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-brand-primary" />
            <span className="font-display font-bold text-lg text-white">WeVentureHub</span>
          </div>
          <p className="text-xs text-neutral-slate-500">
            &copy; 2026 WeVentureHub Inc. All rights reserved. Built for modern workspace collaborations.
          </p>
          <div className="flex items-center space-x-4 text-xs text-neutral-slate-500">
            <span className="flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Ecosystem Platform</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Premium Floating Social Media Links Action Bar */}
      <FloatingSocialLinks />
    </div>
  );
}
