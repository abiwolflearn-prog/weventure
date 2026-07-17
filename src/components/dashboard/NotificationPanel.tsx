import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Calendar, 
  Ticket, 
  CreditCard, 
  Megaphone, 
  AlertTriangle,
  Inbox,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../store';
import { communicationApi, IAPINotification } from '../../lib/communicationApi';
import { getSocket, connectSocket } from '../../lib/socket';

export default function NotificationPanel() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { user } = useAppSelector((state) => state.auth);
  const tenantId = user?.tenantId || 'weventurehub';
  const userId = user?.id;

  // Query notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', userId, tenantId],
    queryFn: () => communicationApi.getNotifications(50),
    enabled: !!userId,
  });

  // Mutate single notification to read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => communicationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId, tenantId] });
    },
  });

  // Mutate all notifications to read
  const markAllReadMutation = useMutation({
    mutationFn: () => communicationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId, tenantId] });
    },
  });

  // Handle socket.io real-time connection and event listening
  useEffect(() => {
    if (!userId) return;

    // Connect socket and join user + tenant rooms
    connectSocket(userId, tenantId);
    const socket = getSocket();

    // Sound effect
    const playSound = () => {
      if (!soundEnabled) return;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      } catch (err) {
        console.warn('Browser sound block or audio context issue:', err);
      }
    };

    const handleNewNotification = (notif: IAPINotification) => {
      console.log('⚡ Real-time alert received via Socket:', notif);
      playSound();
      // Invalidate query to trigger react-query UI refresh
      queryClient.invalidateQueries({ queryKey: ['notifications', userId, tenantId] });
    };

    socket.on('notification:received', handleNewNotification);

    return () => {
      socket.off('notification:received', handleNewNotification);
    };
  }, [userId, tenantId, soundEnabled, queryClient]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications = notifications.filter(
    (n) => activeTab === 'all' || !n.isRead
  );

  const toggleOpen = () => setIsOpen(!isOpen);

  const markAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  const toggleStatus = (notif: IAPINotification) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
  };

  const getIcon = (category: IAPINotification['category']) => {
    switch (category) {
      case 'BOOKING':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'EVENT':
        return <Ticket className="w-4 h-4 text-emerald-500" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-amber-500" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-purple-500" />;
      case 'SYSTEM':
      default:
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    }
  };

  const getBg = (category: IAPINotification['category']) => {
    switch (category) {
      case 'BOOKING':
        return 'bg-blue-50 bg-blue-50/20';
      case 'EVENT':
        return 'bg-emerald-50 bg-emerald-50/20';
      case 'PAYMENT':
        return 'bg-amber-50 bg-amber-50/20';
      case 'ANNOUNCEMENT':
        return 'bg-purple-50 dark:bg-purple-950/20';
      case 'SYSTEM':
      default:
        return 'bg-rose-50 bg-rose-50/20';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        onClick={toggleOpen}
        id="notification-bell-btn"
        className="p-2 text-neutral-slate-500 hover:text-neutral-slate-900  hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-full transition relative focus:outline-none focus:ring-2 focus:ring-brand-primary"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] text-white font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-neutral-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for click-outside */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-xl border border-gray-200 bg-white z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-gray-900">Live Updates</h3>
                  <p className="text-xs text-neutral-slate-400 mt-0.5">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 text-neutral-slate-400 hover:text-neutral-slate-600 dark:hover:text-neutral-200 rounded hover:bg-neutral-slate-50 hover:bg-gray-150 transition-colors"
                    title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 text-neutral-slate-500 hover:text-brand-primary  rounded hover:bg-neutral-slate-50 hover:bg-gray-150 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-neutral-slate-400 hover:text-neutral-slate-600 dark:hover:text-neutral-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              {notifications.length > 0 && (
                <div className="flex border-b border-gray-200 text-xs px-2 py-1 bg-[#F9FAFB]">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      activeTab === 'all'
                        ? 'bg-white shadow-xs text-brand-primary dark:text-white'
                        : 'text-neutral-slate-500 hover:text-neutral-slate-900 '
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center space-x-1 ${
                      activeTab === 'unread'
                        ? 'bg-white shadow-xs text-brand-primary dark:text-white'
                        : 'text-neutral-slate-500 hover:text-neutral-slate-900 '
                    }`}
                  >
                    <span>Unread</span>
                    {unreadCount > 0 && (
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    )}
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="max-h-[320px] overflow-y-auto divide-y divide-neutral-slate-100 divide-gray-200/60">
                {isLoading ? (
                  <div className="p-8 text-center text-neutral-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Loading live alerts...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-slate-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-25" />
                    <p className="text-sm font-medium">Clear inbox!</p>
                    <p className="text-xs mt-1">You are fully caught up with WeVentureHub updates.</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => toggleStatus(notif)}
                      className={`p-4 flex items-start space-x-3.5 hover:bg-neutral-slate-50 hover:bg-gray-150/40 cursor-pointer transition relative ${
                        !notif.isRead ? 'bg-brand-primary/[0.02]' : ''
                      }`}
                    >
                      {!notif.isRead && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                      )}
                      
                      <div className={`p-2 rounded-xl ${getBg(notif.category)} shrink-0`}>
                        {getIcon(notif.category)}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className={`text-xs text-gray-800 truncate ${
                            !notif.isRead ? 'font-semibold' : 'font-medium'
                          }`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-neutral-slate-400 select-none whitespace-nowrap shrink-0">
                            {formatTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Links */}
              <div className="p-3 bg-[#F9FAFB]/40 border-t border-gray-200/60 flex justify-between px-4">
                <a 
                  href="#/dashboard/settings" 
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-neutral-slate-500 hover:text-brand-primary focus:underline"
                >
                  Notification Settings
                </a>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover focus:underline"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
