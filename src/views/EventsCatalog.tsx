import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Tag, 
  Search, 
  Plus, 
  ArrowLeft, 
  Layers, 
  Users, 
  Clock, 
  Eye, 
  Sliders, 
  XCircle, 
  ShieldAlert, 
  RefreshCw,
  FolderOpen,
  CalendarCheck,
  TrendingUp,
  Award,
  Link as LinkIcon,
  CheckCircle,
  Clock3,
  SlidersHorizontal,
  Fingerprint
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  setSearch, 
  setCategoryFilter, 
  setStatusFilter, 
  setVisibilityFilter, 
  toggleTagFilter, 
  resetFilters, 
  setPage, 
  setPaginationData,
  setActiveEvent 
} from '../store/eventSlice';
import { eventApi } from '../lib/eventApi';
import { IEvent, EventStatus, EventVisibility, UserRole, IEventSession } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { EventCard } from '../components/events/EventCard';
import { EventForm } from '../components/events/EventForm';
import { EventBuilderDashboard } from '../components/events/EventBuilderDashboard';
import { TicketSelection } from '../components/events/TicketSelection';
import { SuccessPage } from '../components/events/SuccessPage';
import { MyRegistrations } from '../components/events/MyRegistrations';
import { AdminTicketingDashboard } from '../components/events/AdminTicketingDashboard';
import { motion, AnimatePresence } from 'motion/react';

export default function EventsCatalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { filters, pagination } = useAppSelector((state) => state.event);

  // Layout screen modes
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'EDIT' | 'DETAILS' | 'AUDIT_LOGS' | 'TICKET_SELECT' | 'SUCCESS_PAGE' | 'MY_REGISTRATIONS' | 'ADMIN_DASHBOARD'>('LIST');
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // User RBAC Checks
  const isAdminOrStaff = 
    user?.role === UserRole.SUPER_ADMIN || 
    user?.role === UserRole.TENANT_ADMIN || 
    user?.role === UserRole.STAFF;

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // 1. TanStack Queries for live server data
  const { 
    data: eventsResponse, 
    isLoading: isEventsLoading,
    isError: isEventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['events', filters, pagination.page, pagination.limit],
    queryFn: async () => {
      const response = await eventApi.getEvents({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        category: filters.category,
        status: filters.status,
        visibility: filters.visibility,
        tags: filters.tags,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      
      // Update pagination info in Redux store
      if (response.pagination) {
        dispatch(setPaginationData({
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        }));
      }
      return response;
    },
    placeholderData: (previousData) => previousData,
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['event-categories'],
    queryFn: () => eventApi.getCategories(),
  });

  const { data: tagsResponse } = useQuery({
    queryKey: ['event-tags'],
    queryFn: () => eventApi.getTags(),
  });

  const { data: logsResponse, refetch: refetchLogs } = useQuery({
    queryKey: ['event-audit-logs'],
    queryFn: () => eventApi.getAuditLogs(),
    enabled: viewMode === 'AUDIT_LOGS' && isAdminOrStaff,
  });

  // Extract distinct items for filter pills
  const categories = categoriesResponse?.data || [];
  const tags = tagsResponse?.data || [];
  const eventsList = eventsResponse?.data || [];
  const auditLogs = logsResponse?.data || [];

  // 2. Core Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => eventApi.createEvent(payload),
    onSuccess: (res) => {
      triggerToast(`Event "${res.data.title}" successfully drafted!`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-categories'] });
      queryClient.invalidateQueries({ queryKey: ['event-tags'] });
      setViewMode('LIST');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => eventApi.updateEvent(id, payload),
    onSuccess: (res) => {
      triggerToast(`Event "${res.data.title}" successfully updated!`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-categories'] });
      queryClient.invalidateQueries({ queryKey: ['event-tags'] });
      setViewMode('LIST');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventApi.deleteEvent(id),
    onSuccess: () => {
      triggerToast('Event purged from platform database.');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setViewMode('LIST');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => eventApi.publishEvent(id),
    onSuccess: (res) => {
      triggerToast(`Event "${res.data.title}" is now LIVE!`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => eventApi.cancelEvent(id),
    onSuccess: (res) => {
      triggerToast(`Event "${res.data.title}" has been cancelled.`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  // 3. Command Handlers
  const handleCreateSubmit = (formData: any) => {
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (formData: any) => {
    if (selectedEvent) {
      updateMutation.mutate({ id: selectedEvent.id, payload: formData });
    }
  };

  const handleCopyLink = (event: IEvent) => {
    const shareUrl = `${window.location.origin}/#/events/slug/${event.slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedSlug(event.slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Box */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-emerald-500"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform Events Segmented Tab Switcher */}
      {['LIST', 'MY_REGISTRATIONS', 'ADMIN_DASHBOARD'].includes(viewMode) && (
        <div className="flex border-b border-gray-200 gap-6 select-none pb-0.5">
          <button
            onClick={() => setViewMode('LIST')}
            className={`pb-3 text-xs font-extrabold uppercase tracking-wider relative transition-colors ${
              viewMode === 'LIST' ? 'text-brand-primary font-bold' : 'text-neutral-slate-400 hover:text-neutral-slate-600'
            }`}
          >
            <span>Discover Events</span>
            {viewMode === 'LIST' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>

          <button
            onClick={() => setViewMode('MY_REGISTRATIONS')}
            className={`pb-3 text-xs font-extrabold uppercase tracking-wider relative transition-colors ${
              viewMode === 'MY_REGISTRATIONS' ? 'text-brand-primary font-bold' : 'text-neutral-slate-400 hover:text-neutral-slate-600'
            }`}
          >
            <span>My Registered Tickets</span>
            {viewMode === 'MY_REGISTRATIONS' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>

          {isAdminOrStaff && (
            <button
              onClick={() => setViewMode('ADMIN_DASHBOARD')}
              className={`pb-3 text-xs font-extrabold uppercase tracking-wider relative transition-colors ${
                viewMode === 'ADMIN_DASHBOARD' ? 'text-brand-primary font-bold' : 'text-neutral-slate-400 hover:text-neutral-slate-600'
              }`}
            >
              <span>Ticketing Workspace (Admin)</span>
              {viewMode === 'ADMIN_DASHBOARD' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
              )}
            </button>
          )}
        </div>
      )}

      {/* VIEW 1: DISCOVER EVENTS DIRECTORY */}
      {viewMode === 'LIST' && (
        <div className="space-y-6">
          
          {/* Top Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-gray-900">
                Events Catalog
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Discover panels, pitching events, masterclasses, and networking opportunities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdminOrStaff && (
                <>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setViewMode('AUDIT_LOGS')}
                    className="text-xs h-10 font-bold"
                  >
                    <Sliders className="w-3.5 h-3.5 mr-1.5" />
                    <span>Security Audit Logs</span>
                  </Button>
                  
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => {
                      setSelectedEvent(null);
                      setViewMode('CREATE');
                    }}
                    className="text-xs h-10 font-bold bg-brand-primary"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span>Establish Event</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Core Analytics Dashboard (Analytics Placeholder) */}
          {isAdminOrStaff && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-[#F8FAFC] p-4 border border-[#E5E7EB] rounded-3xl">
              <div className="p-4 space-y-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest">Total Events</span>
                <p className="font-display font-extrabold text-lg text-[#111827]">{pagination.total || 0}</p>
              </div>
              <div className="p-4 space-y-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest">Live Pages</span>
                <p className="font-display font-extrabold text-lg text-[#2563EB]">
                  {eventsList.filter(e => e.status === EventStatus.PUBLISHED).length}
                </p>
              </div>
              <div className="p-4 space-y-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-widest">Draft Sandboxes</span>
                <p className="font-display font-extrabold text-lg text-[#D97706]">
                  {eventsList.filter(e => e.status === EventStatus.DRAFT).length}
                </p>
              </div>
              <div className="p-4 space-y-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-widest">Cancelled Leads</span>
                <p className="font-display font-extrabold text-lg text-[#DC2626]">
                  {eventsList.filter(e => e.status === EventStatus.CANCELLED).length}
                </p>
              </div>
            </div>
          )}

          {/* Search, Filter Toolbar Controls */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <Input
                  placeholder="Search events by title, tag, or details..."
                  value={filters.search}
                  onChange={(e) => dispatch(setSearch(e.target.value))}
                  className="pl-11"
                />
                <Search className="absolute left-4 top-3.5 text-neutral-slate-400 w-4.5 h-4.5 pointer-events-none" />
              </div>

              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="font-bold flex items-center justify-center shrink-0 space-x-2 h-11"
              >
                <SlidersHorizontal className="w-4 h-4 text-neutral-slate-500" />
                <span>Filters {filters.category || filters.status || filters.visibility ? '(Active)' : ''}</span>
              </Button>

              {(filters.search || filters.category || filters.status || filters.visibility || filters.tags.length > 0) && (
                <Button
                  variant="ghost"
                  onClick={() => dispatch(resetFilters())}
                  className="text-rose-500 hover:text-rose-600 font-bold h-11"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Extended advanced filter selectors */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#F9FAFB] p-5 rounded-2xl border border-gray-200 space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Category Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-slate-400">Category Filter</label>
                      <select
                        className="w-full px-3 py-2 text-xs border rounded-lg bg-white text-gray-900 border-gray-200 outline-none"
                        value={filters.category}
                        onChange={(e) => dispatch(setCategoryFilter(e.target.value))}
                      >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Selector (Staff/Admin only) */}
                    {isAdminOrStaff && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-slate-400">Status Pipeline</label>
                        <select
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white text-gray-900 border-gray-200 outline-none"
                          value={filters.status}
                          onChange={(e) => dispatch(setStatusFilter(e.target.value as any))}
                        >
                          <option value="">All Statuses</option>
                          <option value={EventStatus.DRAFT}>Draft Sandbox</option>
                          <option value={EventStatus.PUBLISHED}>Published / Live</option>
                          <option value={EventStatus.CANCELLED}>Cancelled</option>
                          <option value={EventStatus.COMPLETED}>Completed</option>
                        </select>
                      </div>
                    )}

                    {/* Visibility Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-slate-400">Visibility Tier</label>
                      <select
                        className="w-full px-3 py-2 text-xs border rounded-lg bg-white text-gray-900 border-gray-200 outline-none"
                        value={filters.visibility}
                        onChange={(e) => dispatch(setVisibilityFilter(e.target.value as any))}
                      >
                        <option value="">All Visibility</option>
                        <option value={EventVisibility.PUBLIC}>Public Catalog</option>
                        <option value={EventVisibility.PRIVATE}>Private (Members-only)</option>
                        <option value={EventVisibility.UNLISTED}>Unlisted (Direct Link)</option>
                      </select>
                    </div>

                  </div>

                  {/* Active tags selector list */}
                  {tags.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-neutral-slate-200/55 border-gray-200/60">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-slate-400 block">Filter Tag pills</label>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t) => {
                          const isSelected = filters.tags.includes(t);
                          return (
                            <button
                              key={t}
                              onClick={() => dispatch(toggleTagFilter(t))}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all duration-150 ${
                                isSelected 
                                  ? 'bg-brand-primary text-white shadow-sm' 
                                  : 'bg-white text-gray-600 hover:bg-neutral-slate-100 hover:bg-gray-150 border border-gray-200'
                              }`}
                            >
                              #{t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Events Grid list */}
          {isEventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-sm animate-pulse">
                  <div className="bg-[#F3F4F6] h-40 w-full rounded-2xl" />
                  <div className="space-y-2">
                    <div className="bg-[#F3F4F6] h-5 w-2/3 rounded-md" />
                    <div className="bg-[#F3F4F6] h-4 w-5/6 rounded-md" />
                  </div>
                  <div className="bg-[#F3F4F6] h-8 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : isEventsError ? (
            <div className="text-center py-12 border border-rose-100 dark:border-rose-950/20 bg-rose-50/20 bg-rose-50/5 rounded-3xl space-y-4">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base">Error establishing tunnel sync</h3>
                <p className="text-xs text-neutral-slate-400">We failed to establish connections to retrieve WeVentureHub's live database ledgers.</p>
              </div>
              <Button size="sm" onClick={() => refetchEvents()}>
                <RefreshCw className="w-3 h-3 mr-1.5" />
                <span>Retry Connection</span>
              </Button>
            </div>
          ) : eventsList.length === 0 ? (
            <div className="text-center py-20 bg-[#F9FAFB]/50 border border-gray-200 rounded-3xl">
              <FolderOpen className="w-12 h-12 text-neutral-slate-300 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg">No matching events listed</h3>
              <p className="text-xs text-neutral-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                We couldn't locate any active, draft, or matching events in WeVentureHub's ledger context. Reconfigure your filter settings.
              </p>
              {(filters.search || filters.category || filters.status || filters.visibility) && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => dispatch(resetFilters())}
                  className="mt-4 text-xs font-bold"
                >
                  Clear search filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsList.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={(evt) => {
                    setSelectedEvent(evt);
                    setViewMode('DETAILS');
                  }}
                  onEdit={(evt) => {
                    setSelectedEvent(evt);
                    setViewMode('EDIT');
                  }}
                  onDelete={(evt) => {
                    if (window.confirm('Are you absolutely certain you want to purge this core event? This is irreversible.')) {
                      deleteMutation.mutate(evt.id);
                    }
                  }}
                  onPublish={(evt) => {
                    publishMutation.mutate(evt.id);
                  }}
                  onCancel={(evt) => {
                    if (window.confirm('Are you sure you want to cancel this event?')) {
                      cancelMutation.mutate(evt.id);
                    }
                  }}
                  isMutating={publishMutation.isPending || cancelMutation.isPending || deleteMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls Footer */}
          {eventsResponse && eventsResponse.pagination && eventsResponse.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-200/85">
              <span className="text-xs text-neutral-slate-400 font-semibold select-none">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => dispatch(setPage(pagination.page - 1))}
                  className="text-xs font-bold"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => dispatch(setPage(pagination.page + 1))}
                  className="text-xs font-bold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: CREATE NEW EVENT */}
      {viewMode === 'CREATE' && (
        <EventBuilderDashboard
          onSubmit={handleCreateSubmit}
          onCancel={() => setViewMode('LIST')}
          isLoading={createMutation.isPending}
        />
      )}

      {/* VIEW 3: EDIT EXISTING EVENT */}
      {viewMode === 'EDIT' && selectedEvent && (
        <EventBuilderDashboard
          initialValues={selectedEvent}
          onSubmit={handleEditSubmit}
          onCancel={() => setViewMode('LIST')}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* VIEW 4: IMMERSIVE EVENT DETAILS PAGE */}
      {viewMode === 'DETAILS' && selectedEvent && (
        <div className="space-y-8 max-w-4xl mx-auto">
          
          {/* Back row action buttons */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setViewMode('LIST')}
              className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-neutral-slate-400 hover:text-neutral-slate-850  transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopyLink(selectedEvent)}
                className="text-xs h-9 font-bold"
              >
                <LinkIcon className="w-3.5 h-3.5 mr-1.5 text-neutral-slate-400" />
                <span>{copiedSlug === selectedEvent.slug ? 'Copied!' : 'Share Link'}</span>
              </Button>

              {isAdminOrStaff && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewMode('EDIT')}
                  className="text-xs h-9 font-bold"
                >
                  <Sliders className="w-3.5 h-3.5 mr-1.5" />
                  <span>Configure</span>
                </Button>
              )}
            </div>
          </div>

          {/* Beautiful Header Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Banner block */}
            <div className="relative h-64 md:h-80 bg-neutral-slate-950">
              <img 
                src={selectedEvent.media?.bannerUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1200'}
                alt={selectedEvent.title}
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              
              {/* Category tag */}
              <div className="absolute top-6 left-6">
                <span className="inline-flex items-center space-x-1 px-3.5 py-1 bg-white/90 bg-white/95 backdrop-blur-md text-gray-900 text-xs font-extrabold uppercase tracking-wider rounded-full shadow-md">
                  <Tag className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{selectedEvent.category}</span>
                </span>
              </div>

              {/* Title inside hero banner */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold">
                  <Calendar className="w-4 h-4 text-brand-primary" />
                  <span>
                    {new Date(selectedEvent.schedule.startDate).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(selectedEvent.schedule.startDate).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <h1 className="font-display font-extrabold text-2xl md:text-4xl tracking-tight leading-tight">
                  {selectedEvent.title}
                </h1>
              </div>
            </div>

            {/* Event Description and RSVP box */}
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left description details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg">About WeVentureHub Event</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Tags display list */}
                {selectedEvent.tags?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-slate-500">Key Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEvent.tags.map(tag => (
                        <span key={tag} className="bg-[#F3F4F6] text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar metadata / registration settings */}
              <div className="space-y-6 lg:border-l lg:border-neutral-slate-100 lg:border-gray-200 lg:pl-8">
                
                {/* RSVP ticket block */}
                <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-neutral-slate-200/50 border-gray-200 space-y-4">
                  <h4 className="font-display font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
                    <CalendarCheck className="w-4 h-4 text-brand-primary" />
                    <span>Seat RSVP Reservation</span>
                  </h4>

                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between text-xs text-neutral-slate-500">
                      <span>Admission Limit</span>
                      <span className="font-bold text-gray-900">
                        {selectedEvent.capacity.isUnlimited ? 'Unlimited' : `${selectedEvent.capacity.maxCapacity} seats`}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-neutral-slate-500">
                      <span>Registrations</span>
                      <span className="font-bold text-brand-primary">
                        {selectedEvent.capacity.activeRegistrations} active
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-neutral-slate-500">
                      <span>Approval Setting</span>
                      <span className="font-bold text-gray-900">
                        {selectedEvent.registrationSettings.requiresApproval ? 'Required' : 'Instant Confirm'}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full text-xs font-bold py-2.5 bg-brand-primary shadow-sm" onClick={() => setViewMode('TICKET_SELECT')}>
                    Reserve seat ticket
                  </Button>
                </div>

                {/* Additional Timing context */}
                <div className="space-y-3.5 text-xs text-gray-500">
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                    <span>Timezone: <b>{selectedEvent.schedule.timezone}</b></span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <Layers className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                    <span>Status: <b>{selectedEvent.status}</b></span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <Eye className="w-4 h-4 text-neutral-slate-400 shrink-0" />
                    <span>Visibility: <b>{selectedEvent.visibility}</b></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Sessions Agenda list */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-6">
            <div className="border-b pb-3 border-gray-200">
              <h3 className="font-display font-extrabold text-lg flex items-center gap-1.5">
                <Clock3 className="w-5 h-5 text-brand-primary" />
                <span>Event Sessions Agenda</span>
              </h3>
              <p className="text-xs text-neutral-slate-400 mt-1">Chronological tracks planned inside WeVentureHub's workspace.</p>
            </div>

            {selectedEvent.sessions?.length === 0 ? (
              <div className="text-center py-10">
                <Clock className="w-8 h-8 text-neutral-slate-300 mx-auto mb-2" />
                <span className="text-xs font-bold text-neutral-slate-400 uppercase tracking-wider block">Single-session meetup</span>
                <p className="text-[11px] text-neutral-slate-400 mt-1 max-w-xs mx-auto">This event is mapped as a unified single track. No multi-session schedule builder was established.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-brand-primary/20 pl-6 ml-3 space-y-8 pt-2">
                {selectedEvent.sessions.map((session, index) => {
                  const sStart = new Date(session.startTime);
                  const sEnd = new Date(session.endTime);
                  return (
                    <div key={index} className="relative space-y-2">
                      
                      {/* Interactive bullet */}
                      <span className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 bg-white border-2 border-brand-primary rounded-full flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                      </span>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                        <h4 className="font-display font-bold text-sm text-gray-900">
                          {session.title}
                        </h4>
                        
                        <div className="flex items-center space-x-2 text-[10px] font-bold font-mono text-neutral-slate-400 uppercase tracking-widest bg-[#F3F4F6] px-2 py-0.5 rounded-md">
                          <span>{sStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>-</span>
                          <span>{sEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {session.location && (
                        <div className="flex items-center space-x-1.5 text-xs text-neutral-slate-500 font-semibold select-none">
                          <MapPin className="w-3.5 h-3.5 text-neutral-slate-400 shrink-0" />
                          <span>{session.location}</span>
                        </div>
                      )}

                      {session.description && (
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                          {session.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEO and Metadata Settings inspect */}
          {selectedEvent.seo && (selectedEvent.seo.metaTitle || selectedEvent.seo.metaDescription) && (
            <div className="bg-[#F9FAFB]/20 border border-neutral-slate-200/50 border-gray-200 p-6 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-slate-400">SEO Preview Metadata</h4>
              <div className="space-y-2 text-xs">
                {selectedEvent.seo.metaTitle && (
                  <p className="text-neutral-slate-600 dark:text-neutral-slate-400">
                    Meta Title: <b className="text-gray-900">{selectedEvent.seo.metaTitle}</b>
                  </p>
                )}
                {selectedEvent.seo.metaDescription && (
                  <p className="text-neutral-slate-500 leading-relaxed dark:text-neutral-slate-400">
                    Meta Description: <i>"{selectedEvent.seo.metaDescription}"</i>
                  </p>
                )}
                {selectedEvent.seo.metaKeywords?.length > 0 && (
                  <p className="text-neutral-slate-400">
                    Keywords: {selectedEvent.seo.metaKeywords.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW 5: SECURITY AUDIT LOGS VIEW */}
      {viewMode === 'AUDIT_LOGS' && isAdminOrStaff && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setViewMode('LIST')}
                className="p-2 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-xl transition text-neutral-slate-400 hover:text-neutral-slate-950 "
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-display font-extrabold text-2xl tracking-tight">Security Audit Logs</h1>
                <p className="text-xs text-neutral-slate-400 mt-1">Tenant-level actions isolating workspace modifications and creations.</p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchLogs()}
              className="text-xs h-9.5 px-3 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              <span>Refresh logs</span>
            </Button>
          </div>

          {/* Audit Logs Table List */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB]/50 border-b border-gray-200 text-neutral-slate-400 font-extrabold uppercase tracking-wider text-[10px] select-none">
                    <th className="p-4 pl-6">Operator</th>
                    <th className="p-4">Action Type</th>
                    <th className="p-4">Resource Details</th>
                    <th className="p-4">Parameters Trace</th>
                    <th className="p-4 pr-6">Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-slate-100 divide-gray-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-neutral-slate-400 font-semibold uppercase tracking-wider">
                        No audit logs captured inside this tenant space yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 pl-6 font-semibold text-gray-700">
                          <div className="flex items-center space-x-1.5">
                            <Fingerprint className="w-4 h-4 text-brand-primary" />
                            <span>{log.userEmail}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] uppercase font-mono tracking-wider ${
                            log.action === 'CREATE_EVENT' 
                              ? 'bg-emerald-50 bg-emerald-50/20 text-emerald-600' 
                              : log.action === 'DELETE_EVENT'
                              ? 'bg-rose-50 bg-rose-50/20 text-rose-600'
                              : log.action === 'PUBLISH_EVENT'
                              ? 'bg-brand-primary/10 text-brand-primary'
                              : 'bg-indigo-50 bg-indigo-50/20 text-indigo-600'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-neutral-slate-500 font-bold">
                          {log.resourceType}:{log.resourceId.slice(-6)}
                        </td>
                        <td className="p-4 max-w-[200px] truncate font-medium text-gray-500" title={JSON.stringify(log.details)}>
                          {log.details ? JSON.stringify(log.details) : 'N/A'}
                        </td>
                        <td className="p-4 pr-6 font-mono text-neutral-slate-400">
                          {new Date(log.timestamp).toISOString().slice(0, 19).replace('T', ' ')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: TICKET SELECTION & CHECKOUT FLOW */}
      {viewMode === 'TICKET_SELECT' && selectedEvent && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 border-b pb-4 border-gray-200">
            <button 
              onClick={() => setViewMode('DETAILS')}
              className="p-2 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-xl transition text-neutral-slate-400 hover:text-neutral-slate-950 "
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display font-extrabold text-2xl tracking-tight">Event Admission Pass Booking</h1>
              <p className="text-xs text-neutral-slate-400 mt-1">Reserve seats for "{selectedEvent.title}"</p>
            </div>
          </div>
          <TicketSelection
            event={selectedEvent}
            onCancel={() => setViewMode('DETAILS')}
            onSuccess={(orderData) => {
              if (orderData.status === 'PENDING') {
                navigate('/dashboard/checkout', {
                  state: {
                    targetType: 'ORDER',
                    targetId: orderData.id,
                    amount: orderData.totalAmount,
                    currency: 'ETB',
                    title: selectedEvent.title,
                    description: `Admission passes for ${selectedEvent.title}`
                  }
                });
              } else {
                setActiveOrder(orderData);
                setViewMode('SUCCESS_PAGE');
              }
            }}
          />
        </div>
      )}

      {/* VIEW 7: SUCCESS PAGE PASS CODES DISPLAY */}
      {viewMode === 'SUCCESS_PAGE' && activeOrder && (
        <SuccessPage
          order={activeOrder}
          onDone={() => {
            setActiveOrder(null);
            setViewMode('LIST');
          }}
          onGoToTickets={() => {
            setActiveOrder(null);
            setViewMode('MY_REGISTRATIONS');
          }}
        />
      )}

      {/* VIEW 8: MEMBER PASS POCKET */}
      {viewMode === 'MY_REGISTRATIONS' && (
        <MyRegistrations />
      )}

      {/* VIEW 9: TICKETING ADMINISTRATIVE WORKSPACE */}
      {viewMode === 'ADMIN_DASHBOARD' && isAdminOrStaff && (
        <AdminTicketingDashboard />
      )}

    </div>
  );
}
