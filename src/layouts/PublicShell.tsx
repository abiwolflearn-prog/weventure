import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building, Globe, Menu, X, ChevronRight, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FloatingSocialLinks } from '../components/FloatingSocialLinks';
import WeVentureLogo from '../components/WeVentureLogo';
import WeVentureAssistant from '../components/assistant/WeVentureAssistant';
import GetStartedModal from '../components/GetStartedModal';
import { ParticleBackground } from '../components/ParticleBackground';
import { publicApi } from '../lib/publicApi';
import { useTheme } from '../context/ThemeContext';

export default function PublicShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGetStartedModalOpen, setIsGetStartedModalOpen] = useState(false);
  const location = useLocation();
  const isDarkMode = true;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Discover Events', path: '/events' },
    { name: 'Find Workspace', path: '/workspaces' },
    { name: 'Startup', path: '/startup' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${isDarkMode ? 'bg-[#111111] text-white' : 'bg-[#F8FAFC] text-neutral-900'}`}>
      <ParticleBackground />
      {/* Navigation Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${isDarkMode ? 'bg-neutral-slate-900/90 border-neutral-slate-800/80 text-white' : 'bg-white/90 border-neutral-200 text-neutral-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <WeVentureLogo size="32" mode={isDarkMode ? "dark" : "light"} className="drop-shadow-sm" />
            <span className={`font-display font-bold text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
              WeVenture<span className="text-brand-accent">Hub</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center space-x-8 text-sm font-medium ${isDarkMode ? 'text-neutral-slate-300' : 'text-neutral-600'}`}>
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`transition-colors duration-200 ${
                  location.pathname === link.path 
                    ? 'text-brand-accent font-bold' 
                    : isDarkMode ? 'hover:text-brand-accent' : 'hover:text-brand-accent'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-3.5">
            <div className="hidden sm:flex items-center space-x-3">
              <Link 
                to="/login" 
                className={`text-sm font-medium transition-colors py-2 px-3 ${isDarkMode ? 'text-neutral-slate-300 hover:text-brand-accent' : 'text-neutral-700 hover:text-brand-accent'}`}
              >
                Log In
              </Link>
              <button
                type="button"
                onClick={() => setIsGetStartedModalOpen(true)}
                className="px-4.5 py-2 text-sm font-extrabold text-neutral-slate-900 bg-brand-accent hover:bg-brand-accent/90 rounded-lg shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden p-2 -mr-2 rounded-xl transition-colors focus:outline-none ${isDarkMode ? 'text-neutral-slate-300 hover:text-white hover:bg-neutral-slate-800/50' : 'text-neutral-700 hover:text-black hover:bg-neutral-100'}`}
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Drawer with Backdrop Blur */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Side Drawer */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 w-full max-w-sm z-50 md:hidden flex flex-col h-full bg-neutral-slate-900 border-l border-neutral-slate-800 shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-slate-800/60">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2">
                  <WeVentureLogo size="28" mode="dark" />
                  <span className="font-display font-bold text-lg tracking-tight text-white">
                    WeVenture<span className="text-brand-accent">Hub</span>
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 hover:bg-neutral-slate-800 rounded-xl text-neutral-slate-400 hover:text-white transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-grow py-6 px-6 space-y-2 overflow-y-auto">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-neutral-slate-800 text-brand-accent font-bold' 
                          : 'text-neutral-slate-300 hover:bg-neutral-slate-800/40 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{link.name}</span>
                      <ChevronRight className={`w-4 h-4 opacity-50 ${isActive ? 'text-brand-accent' : 'text-neutral-slate-500'}`} />
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Footer Buttons */}
              <div className="p-6 border-t border-neutral-slate-800/60 space-y-3 bg-neutral-slate-950/20">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-3 text-sm font-bold text-neutral-slate-300 hover:text-white hover:bg-neutral-slate-800/60 border border-neutral-slate-800 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsGetStartedModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center py-3 text-sm font-bold text-neutral-slate-900 bg-brand-accent hover:bg-brand-accent/90 rounded-xl transition-colors shadow-lg shadow-brand-accent/10 cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Global Get Started Selection Modal */}
      <GetStartedModal 
        isOpen={isGetStartedModalOpen} 
        onClose={() => setIsGetStartedModalOpen(false)} 
      />

      {/* Main Viewport with Page Transition */}
      <main className="flex-grow relative z-10">
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
      <footer className="relative z-10 bg-neutral-slate-900 text-neutral-slate-400 py-12 border-t border-neutral-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <WeVentureLogo size="24" mode="dark" />
            <span className="font-display font-bold text-lg text-white">WeVentureHub</span>
          </div>
          <p className="text-xs text-neutral-slate-500 text-center md:text-left">
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

      {/* Enterprise AI Virtual Assistant Widget */}
      <WeVentureAssistant />
    </div>
  );
}
