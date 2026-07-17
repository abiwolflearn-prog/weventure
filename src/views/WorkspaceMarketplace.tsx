import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  Building, 
  Users, 
  DollarSign, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  X,
  MapPin,
  Calendar,
  Layers,
  Clock,
  Briefcase
} from 'lucide-react';
import { axiosInstance } from '../lib/axiosInstance';
import { Button } from '../components/Button';
import { motion, AnimatePresence } from 'motion/react';

const WORKSPACE_IMAGES: Record<string, string> = {
  HOT_DESK: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=600',
  MEETING_ROOM: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
  EVENT_VENUE: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600'
};

export default function WorkspaceMarketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search/Filters states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [minCapacity, setMinCapacity] = useState(searchParams.get('minCapacity') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [tenantId, setTenantId] = useState(searchParams.get('tenantId') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  // UI States
  const [showFilters, setShowFilters] = useState(false);

  // Data States
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [featuredWorkspaces, setFeaturedWorkspaces] = useState<any[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch organizers initially
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const res = await axiosInstance.get('/public/organizers');
        setOrganizers(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch organizers:', err);
      }
    };
    fetchOrganizers();
  }, []);

  // Fetch workspaces on filter/search change
  const fetchWorkspacesData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (type) params.type = type;
      if (minCapacity) params.minCapacity = minCapacity;
      if (maxPrice) params.maxPrice = maxPrice;
      if (tenantId) params.tenantId = tenantId;
      if (sort) params.sort = sort;

      const [wsRes, featRes] = await Promise.all([
        axiosInstance.get('/public/workspaces', { params }),
        axiosInstance.get('/public/workspaces', { params: { featured: 'true' } })
      ]);

      setWorkspaces(wsRes.data.data || []);
      setFeaturedWorkspaces(featRes.data.data || []);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspacesData();
    // Update URL params
    const nextParams: any = {};
    if (search) nextParams.search = search;
    if (type) nextParams.type = type;
    if (minCapacity) nextParams.minCapacity = minCapacity;
    if (maxPrice) nextParams.maxPrice = maxPrice;
    if (tenantId) nextParams.tenantId = tenantId;
    if (sort) nextParams.sort = sort;
    setSearchParams(nextParams);
  }, [search, type, minCapacity, maxPrice, tenantId, sort]);

  const clearFilters = () => {
    setSearch('');
    setType('');
    setMinCapacity('');
    setMaxPrice('');
    setTenantId('');
    setSort('newest');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Search Hero Section */}
      <div className="bg-white border-b border-[#E5E7EB] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[12px] font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span>Workspace & Desk Booking Platform</span>
            </div>
            <h1 className="text-[36px] md:text-[48px] font-display font-bold tracking-tight text-[#111827] leading-tight">
              Discover & Reserve Your <span className="text-[#2563EB]">Ideal Workspace</span>
            </h1>
            <p className="text-[15px] text-[#6B7280] leading-relaxed max-w-2xl mx-auto">
              Find professional hot desks, private boardrooms, and premium corporate venues across multiple top organizers. Instantly bookable, and complete with custom amenities.
            </p>
          </div>

          {/* Search Bar Hub */}
          <div className="mt-10 max-w-4xl mx-auto">
            <div className="bg-[#FFFFFF] p-4 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-[#E5E7EB] flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-[14px] text-[#9CA3AF] w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search workspace names, facilities, or amenities (e.g. projector)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 outline-none text-[14px] font-medium rounded-[14px] bg-[#F8FAFC] border border-transparent focus:border-[#2563EB]/20 focus:bg-white transition text-[#111827] placeholder-[#9CA3AF]"
                />
              </div>

              <div className="flex flex-wrap md:flex-nowrap gap-2.5">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="px-4 py-3 text-[13px] font-bold bg-[#F8FAFC] rounded-[14px] border border-[#E5E7EB] text-[#374151] focus:outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="HOT_DESK">Hot Desk</option>
                  <option value="MEETING_ROOM">Meeting Room</option>
                  <option value="EVENT_VENUE">Event Venue</option>
                </select>

                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="px-4 py-3 text-[13px] font-bold bg-[#F8FAFC] rounded-[14px] border border-[#E5E7EB] text-[#374151] focus:outline-none focus:border-[#2563EB] cursor-pointer max-w-[180px]"
                >
                  <option value="">All Organizers</option>
                  {organizers.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-5 py-3 rounded-[14px] border text-[13px] font-bold flex items-center gap-2 transition-all ${
                    showFilters || minCapacity || maxPrice
                      ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                      : 'border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#374151]'
                  }`}
                >
                  <SlidersHorizontal className="w-4.5 h-4.5" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters Drawer */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] mt-3 p-6 rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Min Capacity (Seats)</label>
                      <input
                        type="number"
                        placeholder="e.g. 4"
                        value={minCapacity}
                        onChange={(e) => setMinCapacity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E7EB] text-[13px] font-medium outline-none bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-[#111827]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Max Price (USD / Hr)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E7EB] text-[13px] font-medium outline-none bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-[#111827]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Sorting Order</label>
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E7EB] text-[13px] font-bold outline-none bg-white focus:border-[#2563EB] text-[#374151] cursor-pointer"
                      >
                        <option value="newest">Recently Added</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="capacity_desc">Capacity: Large first</option>
                        <option value="name_asc">Name: A to Z</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex justify-between items-center border-t border-gray-100 pt-4 mt-2">
                      <button
                        onClick={clearFilters}
                        className="text-[12px] font-bold text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                      >
                        Reset All Filters
                      </button>
                      <Button 
                        size="sm" 
                        onClick={() => setShowFilters(false)}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-4 py-2 rounded-[10px]"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Featured Section */}
        {featuredWorkspaces.length > 0 && !search && !type && !tenantId && (
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-[#2563EB] animate-pulse" />
              <h2 className="text-[20px] font-display font-bold text-[#111827]">Featured Premium Venues</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredWorkspaces.slice(0, 3).map((ws) => (
                <div key={ws.id + '-featured'} className="bg-[#FFFFFF] rounded-[24px] overflow-hidden border border-[#DBEAFE] shadow-[0_10px_30px_rgba(37,99,235,0.04)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] hover:border-[#BFDBFE] transition-all duration-300 flex flex-col group relative">
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-[#2563EB] text-white text-[10px] font-bold uppercase tracking-wider rounded-[8px] flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 text-white fill-current" />
                    <span>FEATURED</span>
                  </div>
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={WORKSPACE_IMAGES[ws.type] || WORKSPACE_IMAGES.MEETING_ROOM}
                      alt={ws.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute bottom-4 right-4 bg-[#111827]/90 backdrop-blur px-3 py-1.5 rounded-[10px] text-[13px] font-bold text-white font-mono shadow-sm">
                      ${ws.hourlyRate.toFixed(2)}/hr
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-[6px]">
                          {ws.type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#6B7280]">
                          <Users className="w-4 h-4 text-[#9CA3AF]" />
                          <span>Seats {ws.capacity}</span>
                        </div>
                      </div>

                      <h3 className="font-display font-bold text-[18px] text-[#111827] group-hover:text-[#2563EB] transition-colors leading-snug">
                        {ws.name}
                      </h3>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ws.amenities.slice(0, 3).map((am: string) => (
                          <span key={am} className="text-[10px] font-bold bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded-[6px]">
                            {am}
                          </span>
                        ))}
                        {ws.amenities.length > 3 && (
                          <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-[6px]">
                            +{ws.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                      {ws.organizer ? (
                        <div className="flex items-center gap-2">
                          {ws.organizer.logoUrl ? (
                            <img src={ws.organizer.logoUrl} alt={ws.organizer.name} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[10px] font-bold text-[#2563EB]">
                              {ws.organizer.name[0]}
                            </div>
                          )}
                          <span className="text-[12px] font-bold text-[#4B5563] max-w-[130px] truncate">{ws.organizer.name}</span>
                        </div>
                      ) : <span />}

                      <Link to={`/workspaces/${ws.id}`}>
                        <Button 
                          size="sm" 
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-4 h-[36px] rounded-[8px]"
                        >
                          Book Space
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Listings */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[20px] font-display font-bold text-[#111827]">
              {search || type || tenantId ? 'Search Results' : 'Explore All Workspaces'}
              <span className="text-sm text-[#6B7280] font-normal ml-2">({workspaces.length} available)</span>
            </h2>

            {loading && (
              <div className="flex items-center gap-2 text-[12px] font-bold text-[#6B7280]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
                <span>Syncing catalog...</span>
              </div>
            )}
          </div>

          {loading && workspaces.length === 0 ? (
            <div className="py-24 text-center text-[#6B7280] space-y-4">
              <RefreshCw className="w-10 h-10 animate-spin text-[#2563EB] mx-auto" />
              <p className="text-[14px] font-bold text-[#111827]">Updating global workspace matrix...</p>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#E5E7EB] rounded-[20px] bg-[#FFFFFF] p-8">
              <Briefcase className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
              <h3 className="text-[16px] font-bold text-[#111827]">No workspaces matching criteria</h3>
              <p className="text-[13px] text-[#6B7280] mt-1 max-w-sm mx-auto">
                Try widening your filters or input string (e.g. "TV Screen", "seats 10", "All Types").
              </p>
              <Button size="sm" className="mt-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[13px]" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {workspaces.map((ws) => (
                <div key={ws.id} className="bg-[#FFFFFF] rounded-[20px] overflow-hidden border border-[#E5E7EB] shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)] hover:border-[#D1D5DB] transition-all duration-300 flex flex-col group justify-between">
                  <div>
                    <div className="h-44 overflow-hidden relative">
                      <img
                        src={WORKSPACE_IMAGES[ws.type] || WORKSPACE_IMAGES.MEETING_ROOM}
                        alt={ws.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-[#111827]/85 backdrop-blur px-2.5 py-1 rounded-[8px] text-[12px] font-bold text-white font-mono shadow-sm">
                        ${ws.hourlyRate.toFixed(2)}/hr
                      </div>
                      
                      {/* Price Capping Labels */}
                      {ws.dailyRate && (
                        <div className="absolute bottom-3 left-3 bg-[#10B981] text-white px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          Daily: ${ws.dailyRate}/day
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                        <span className="bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded-[4px]">{ws.type.replace('_', ' ')}</span>
                        <span className="flex items-center gap-1 font-bold text-[#4B5563]">
                          <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          <span>Max {ws.capacity} pax</span>
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-[15px] text-[#111827] group-hover:text-[#2563EB] transition-colors truncate">
                        {ws.name}
                      </h3>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ws.amenities.slice(0, 2).map((am: string) => (
                          <span key={am} className="text-[10px] font-bold bg-[#F8FAFC] text-[#64748B] px-2 py-0.5 rounded-[4px] border border-[#F1F5F9]">
                            {am}
                          </span>
                        ))}
                        {ws.amenities.length > 2 && (
                          <span className="text-[10px] text-[#94A3B8] font-bold px-1 py-0.5">
                            +{ws.amenities.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-3 mt-auto border-t border-[#F1F5F9] flex justify-between items-center bg-[#F8FAFC]/50">
                    {ws.organizer ? (
                      <div className="flex items-center gap-2">
                        {ws.organizer.logoUrl ? (
                          <img src={ws.organizer.logoUrl} alt={ws.organizer.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[8px] font-bold text-[#2563EB]">
                            {ws.organizer.name[0]}
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-[#6B7280] truncate max-w-[100px]">{ws.organizer.name}</span>
                      </div>
                    ) : <span />}

                    <Link to={`/workspaces/${ws.id}`}>
                      <Button 
                        size="xs" 
                        className="text-[11px] font-bold px-3 py-1.5 flex items-center gap-1 h-[32px] rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8]"
                      >
                        <span>Detail & Book</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
