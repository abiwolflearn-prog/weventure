import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Ticket, X, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GetStartedModal({ isOpen, onClose }: GetStartedModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelectWorkspace = () => {
    onClose();
    navigate('/workspaces');
  };

  const handleSelectEvent = () => {
    onClose();
    navigate('/events');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-white overflow-hidden"
        >
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="space-y-2 mb-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WeVentureHub Unified Platform</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              How can we help you?
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm">
              Select an option below to get started with WeVentureHub:
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1: Reserve Workspace */}
            <motion.button
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSelectWorkspace}
              className="p-6 rounded-2xl bg-neutral-900 border-2 border-neutral-800 hover:border-brand-primary hover:bg-neutral-850 text-left transition-all duration-200 group flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-brand-primary/20 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <Building className="w-7 h-7" />
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-lg text-white group-hover:text-brand-primary transition-colors">
                  Reserve Workspace
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  Book hot desks, boardrooms, private offices, or event halls with instant availability.
                </p>
              </div>

              <div className="pt-2 flex items-center text-xs font-bold text-brand-primary group-hover:translate-x-1 transition-transform">
                <span>Browse Workspaces</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </motion.button>

            {/* Option 2: Register for Event */}
            <motion.button
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSelectEvent}
              className="p-6 rounded-2xl bg-neutral-900 border-2 border-neutral-800 hover:border-brand-accent hover:bg-neutral-850 text-left transition-all duration-200 group flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-brand-accent/20 text-brand-accent group-hover:bg-brand-accent group-hover:text-neutral-950 transition-colors">
                  <Ticket className="w-7 h-7" />
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:bg-brand-accent group-hover:text-neutral-950 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-lg text-white group-hover:text-brand-accent transition-colors">
                  Register for Event
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  Join upcoming summits, tech workshops, pitch competitions, and community hackathons.
                </p>
              </div>

              <div className="pt-2 flex items-center text-xs font-bold text-brand-accent group-hover:translate-x-1 transition-transform">
                <span>Discover Events</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
