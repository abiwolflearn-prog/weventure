import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Megaphone, 
  Plus, 
  Calendar, 
  Users, 
  ShieldAlert, 
  Clock, 
  Loader2, 
  Sparkles, 
  Mail, 
  Check, 
  ChevronRight,
  Inbox
} from 'lucide-react';
import { useAppSelector } from '../store';
import { communicationApi, IAPIAnnouncement } from '../lib/communicationApi';
import { Button } from '../components/Button';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'HUB_MEMBER' | 'STAFF' | 'EXTERNAL_USER'>('ALL');
  const [sendEmail, setSendEmail] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user?.role || UserRole.HUB_MEMBER);

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', user?.tenantId],
    queryFn: () => communicationApi.getAnnouncements(30),
  });

  // Mutate creation
  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      content: string;
      targetAudience: typeof targetAudience;
      sendEmail: boolean;
    }) => communicationApi.createAnnouncement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setSuccessMsg('Announcement successfully published and dispatched!');
      setTitle('');
      setContent('');
      setTargetAudience('ALL');
      setSendEmail(false);
      setTimeout(() => {
        setSuccessMsg('');
        setIsCreating(false);
      }, 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'An error occurred while publishing announcement.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    createMutation.mutate({ title, content, targetAudience, sendEmail });
  };

  const getAudienceBadgeColor = (audience: IAPIAnnouncement['targetAudience']) => {
    switch (audience) {
      case 'STAFF':
        return 'bg-rose-50 text-rose-700 bg-rose-50/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
      case 'HUB_MEMBER':
        return 'bg-blue-50 text-blue-700 bg-blue-50/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      case 'EXTERNAL_USER':
        return 'bg-amber-50 text-amber-700 bg-amber-50/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
      case 'ALL':
      default:
        return 'bg-emerald-50 text-emerald-700 bg-emerald-50/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-gray-900">
            Announcements & Bulletins
          </h1>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Latest alerts, maintenance notices, scheduling schedules, and community highlights.
          </p>
        </div>

        {isAdminOrStaff && (
          <Button 
            onClick={() => setIsCreating(!isCreating)}
            className="font-bold flex items-center space-x-1.5 rounded-xl self-start sm:self-center"
          >
            {isCreating ? <ChevronRight className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isCreating ? 'View Bulletins' : 'Issue Announcement'}</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Main Bulletin Board Grid / Creation Panel */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {isCreating ? (
              <motion.div
                key="creation-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl shadow-sm"
              >
                <div className="flex items-center space-x-2.5 pb-4 border-b border-gray-200 mb-6">
                  <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                    <Megaphone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-gray-900">New Bulletin</h3>
                    <p className="text-[11px] text-neutral-slate-400">Broadcast updates immediately to your WeVentureHub tenant</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {successMsg && (
                    <div className="p-4 bg-emerald-50 bg-emerald-50/25 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center space-x-2.5">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-4 bg-rose-50 bg-rose-50/25 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center space-x-2.5">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-2">Bulletin Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fiber Network Maintenance - Friday Evening"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-sm px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-2">Target Audience</label>
                      <select
                        value={targetAudience}
                        onChange={(e: any) => setTargetAudience(e.target.value)}
                        className="w-full text-sm px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-900"
                      >
                        <option value="ALL">All Hub Users (Everyone)</option>
                        <option value="HUB_MEMBER">Members Cohort</option>
                        <option value="STAFF">Staff & Operators</option>
                        <option value="EXTERNAL_USER">External Visitors & Attendees</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-6 pl-2">
                      <label className="flex items-center space-x-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-slate-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <div>
                          <span className="text-xs font-bold text-gray-800">Dispatch Email Broadcast</span>
                          <p className="text-[10px] text-neutral-slate-400 leading-normal">Send highly-styled HTML mail bulletins directly to targeted inboxes</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-slate-500 uppercase tracking-wider mb-2">Content Body</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Write your announcement content here. Be clear and thorough..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full text-sm px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-900 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-5">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setIsCreating(false)}
                      className="font-bold border-gray-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      className="font-bold"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <span>Publish Bulletin</span>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="bulletins-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {isLoading ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
                    <Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-500">Loading active bulletins...</p>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
                    <Inbox className="w-12 h-12 text-neutral-slate-400 mx-auto opacity-30 mb-3" />
                    <h3 className="font-display font-bold text-base">No Bulletins Issued</h3>
                    <p className="text-xs text-neutral-slate-400 mt-1 max-w-sm mx-auto">
                      All fully catch up with space operations. When notices or community activities are shared, they'll post here.
                    </p>
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div 
                      key={ann.id} 
                      className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl hover:shadow-xs transition duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-sm text-gray-900">
                              {ann.title}
                            </h3>
                            <div className="flex items-center space-x-2 text-[10px] text-neutral-slate-400 mt-0.5 select-none">
                              <span>by <b>{ann.createdBy}</b></span>
                              <span>•</span>
                              <Clock className="w-3 h-3 text-neutral-slate-400" />
                              <span>{new Date(ann.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 text-[9px] font-extrabold tracking-wider border rounded-lg uppercase select-none ${getAudienceBadgeColor(ann.targetAudience)}`}>
                          Audience: {ann.targetAudience.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-slate-600 dark:text-neutral-slate-400 leading-relaxed whitespace-pre-wrap">
                        {ann.content}
                      </p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Right Side: Notification Settings & Quick Stats (Sidebar layout) */}
        <div className="space-y-6">
          {/* Quick Stats Bento */}
          <div className="bg-white border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#84CC16] opacity-5 filter blur-2xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-[#84CC16]/10 border border-[#84CC16]/20 rounded-lg text-[#65A30D] text-[10px] font-extrabold tracking-wider uppercase select-none">
                <Sparkles className="w-3 h-3 text-[#65A30D]" />
                <span>Bulletin Analytics</span>
              </span>

              <h3 className="font-display font-bold text-sm text-[#111111]">Broadcast Reach</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-xl text-center">
                  <span className="block text-xl font-extrabold text-[#65A30D]">
                    {announcements.length}
                  </span>
                  <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider block mt-1">Total Sent</span>
                </div>
                <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-xl text-center">
                  <span className="block text-xl font-extrabold text-[#A3E635]">
                    99.8%
                  </span>
                  <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider block mt-1">Delivery</span>
                </div>
              </div>

              <p className="text-[11px] text-[#6B7280] leading-relaxed pt-2">
                All bulletins are distributed using tenant-isolated queues with full real-time delivery logs.
              </p>
            </div>
          </div>

          {/* Quick Contacts Panel */}
          <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl">
            <h3 className="font-display font-bold text-sm text-gray-900 mb-4">Hub Operators Support</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-[#F9FAFB]/40 rounded-xl">
                <div className="p-2 bg-[#F3F4F6] rounded-lg text-neutral-slate-500 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-800">Community Manager</span>
                  <span className="text-[10px] text-neutral-slate-400">ops@weventurehub.com</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
