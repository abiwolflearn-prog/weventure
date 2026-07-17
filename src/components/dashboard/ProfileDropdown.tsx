import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  UserCog, 
  ChevronDown, 
  Activity, 
  Heart 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/authSlice';

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const nameInitial = user?.firstName ? user.firstName[0].toUpperCase() : 'G';
  const fullName = user?.firstName ? `${user.firstName} ${user.lastName}` : 'Guest Member';
  const roleName = user?.role ? user.role.replace('_', ' ') : 'EXTERNAL USER';

  return (
    <div className="relative">
      {/* Profile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-brand-primary"
        aria-label="User menu"
      >
        <div className="w-9 h-9 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center shadow-xs text-sm select-none border border-brand-primary/10">
          {nameInitial}
        </div>
        <div className="hidden lg:block text-left pr-1">
          <p className="text-xs font-bold leading-none text-gray-900">
            {fullName}
          </p>
          <p className="text-[9px] text-neutral-slate-400 mt-1 uppercase tracking-wider font-bold">
            {roleName}
          </p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-slate-400 hidden lg:block transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-outside backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden"
            >
              {/* Profile Card Header */}
              <div className="p-4 bg-[#F9FAFB]/40 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center text-lg select-none">
                    {nameInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{fullName}</p>
                    <p className="text-xs text-neutral-slate-400 truncate">{user?.email || 'user@weventurehub.com'}</p>
                  </div>
                </div>
                
                {/* Role Badge */}
                <div className="mt-3 inline-flex items-center space-x-1 px-2.5 py-0.5 bg-brand-primary/10 border border-brand-primary/20 text-[10px] font-bold uppercase tracking-wider text-brand-primary rounded-full">
                  <span>{roleName}</span>
                </div>
              </div>

              {/* List items */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/dashboard/settings');
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-700 hover:bg-neutral-slate-100 hover:bg-gray-150 transition-colors"
                >
                  <UserCog className="w-4 h-4 text-neutral-slate-500" />
                  <span>My Profile Config</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/dashboard/settings');
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-700 hover:bg-neutral-slate-100 hover:bg-gray-150 transition-colors"
                >
                  <Settings className="w-4 h-4 text-neutral-slate-500" />
                  <span>Platform Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    alert('Simulated audit logs exported to your email address.');
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-700 hover:bg-neutral-slate-100 hover:bg-gray-150 transition-colors"
                >
                  <Activity className="w-4 h-4 text-neutral-slate-500" />
                  <span>Access History Logs</span>
                </button>

                <div className="border-t border-gray-200/80 my-1.5" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out Session</span>
                </button>
              </div>

              {/* Version Credit */}
              <div className="p-2 border-t border-gray-200/80 bg-[#F9FAFB] text-center text-[9px] text-neutral-slate-400 font-mono select-none">
                Platform Release: v1.4.2-enterprise
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
