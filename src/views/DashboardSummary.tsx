import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Calendar,
  CalendarRange, 
  CalendarPlus,
  Users, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  ShieldCheck, 
  Clock,
  Sparkles,
  DollarSign,
  Activity,
  RotateCcw,
  RefreshCw,
  FolderOpen,
  Search,
  CreditCard,
  Megaphone,
  UserCheck,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { useAppSelector } from '../store';
import { Button } from '../components/Button';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

// Subcomponents imports
import StatisticsCard from '../components/dashboard/StatisticsCard';
import QuickActionCards from '../components/dashboard/QuickActionCards';
import CalendarWidget from '../components/dashboard/CalendarWidget';
import RecentActivityWidget from '../components/dashboard/RecentActivityWidget';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import { 
  DashboardOverviewSkeleton, 
  DashboardErrorState, 
  DashboardEmptyState 
} from '../components/dashboard/DashboardStateFeedbacks';

// API services
import { paymentApi } from '../lib/paymentApi';
import { eventApi } from '../lib/eventApi';
import { crmApi } from '../lib/crmApi';

export default function DashboardSummary() {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.TENANT_ADMIN || user?.role === UserRole.STAFF || (user?.role as string) === 'ADMIN' || (user?.role as string) === 'MANAGER';
  
  const currentPrefix = location.pathname.startsWith('/superadmin/dashboard')
    ? '/superadmin/dashboard'
    : location.pathname.startsWith('/admin/dashboard')
    ? '/admin/dashboard'
    : '/dashboard';
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [payments, setPayments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeTenantName = user?.tenantId 
    ? user.tenantId.charAt(0).toUpperCase() + user.tenantId.slice(1) 
    : 'WeVentureHub';

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      // Fetch real data
      const [paymentsData, regsData, eventsData] = await Promise.all([
        paymentApi.getInvoices().catch(() => []),
        crmApi.getContacts().catch(() => []), // Assuming contacts is where registrations are
        eventApi.getEvents({ limit: 5 }).catch(() => ({ data: [] }))
      ]);
      
      setPayments(paymentsData || []);
      setRegistrations(regsData || []);
      setEvents(eventsData.data || []);
      setAnnouncements([]); // Announcements API service to be implemented if needed
    } catch (err) {
      console.error('Failed to sync dashboard data', err);
    } finally {
      setIsSyncing(false);
      setLoading(false);
    }
  };

  // Auto sync on mount
  useEffect(() => {
    fetchData();
  }, []);

  const triggerSync = () => {
    fetchData();
  };

  // Today's formatted date
  const todayStr = new Date().toLocaleDateString('default', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (loading) {
    return <DashboardOverviewSkeleton />;
  }

  // Filter lists based on simple search query
  const filteredPayments = payments.filter(p => 
    (p.client?.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (p.id?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRegistrations = registrations.filter(r => 
    r.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fade-in pb-16 bg-[#F8FAFC]">
      
      {/* 1. Brand Top Header with Search, Actions, Simulator Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-[#E5E7EB] pb-6">
        <div>
          <span className="text-[14px] font-bold text-[#84CC16] tracking-wide uppercase font-mono">
            {isAdmin ? 'Leader Hub Management Panel' : 'WeVentureHub Community'}
          </span>
          <h1 className="font-display font-bold text-[32px] text-[#111827] tracking-tight mt-1">
            {isAdmin ? (
              'Leader Dashboard'
            ) : (
              <span className="bg-gradient-to-r from-[#65a30d] via-[#84CC16] to-[#a3e635] bg-clip-text text-transparent">
                Welcome {user?.firstName || 'Alex'}, to WeVentureHub
              </span>
            )}
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            {isAdmin ? (
              <>Welcome back, <b className="text-[#111827]">{user?.firstName || 'Operator'}</b>! Here is the chronological operational digest for <b className="text-[#84CC16] font-bold uppercase">{activeTenantName}</b>.</>
            ) : (
              <>Explore your upcoming events, workspace bookings, and community updates.</>
            )}
          </p>
        </div>

        {/* Global Search & Action block */}
        <div className="flex flex-wrap items-center gap-4">
          
          <div className="relative min-w-[280px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="w-4 h-4 text-[#6B7280]" />
            </span>
            <input
              type="text"
              placeholder="Search events, clients, members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] placeholder-[#6B7280] text-[14px] rounded-[12px] pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#A3E635] focus:border-[#A3E635] transition-all"
            />
          </div>

          {/* Today Date Badge */}
          <div className="hidden md:flex items-center space-x-2 px-4 py-2.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] text-[14px] text-[#111827] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <Clock className="w-4 h-4 text-[#84CC16]" />
            <span>{todayStr}</span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={triggerSync}
            disabled={isSyncing}
            className="bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] hover:bg-gray-50 h-[44px] px-4 rounded-[12px] font-semibold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin text-[#84CC16]' : 'text-[#6B7280]'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Premium Enterprise Welcome Banner (Clean White Card Layout) */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-8 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden">
        {/* Subtle decorative absolute gradient bar */}
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#A3E635] to-[#84CC16]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#A3E635]/10 border border-[#A3E635]/20 rounded-full text-[#65A30D] text-[12px] font-bold mb-4 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Standard Active</span>
            </span>
            <h2 className="font-display font-bold text-[28px] text-[#111827] tracking-tight leading-tight mb-2">
              Workspace Operational Health Overview
            </h2>
            <p className="text-[#6B7280] text-[16px] leading-relaxed mb-1">
              Your organization has 3 boardrooms reserved today. Hot desk occupancy density is at an optimal <b>82% Load</b>. 
              Review active registrations, monthly revenues, and incoming client pipelines below.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link to={`${currentPrefix}/events/create`}>
              <button className="h-[44px] px-5 rounded-[12px] text-[14px] font-black bg-[#A3E635] hover:bg-[#84CC16] text-[#111111] shadow-[0_2px_10px_rgba(163,230,53,0.15)] hover:scale-[1.01] transition-all">
                Publish Event
              </button>
            </Link>
            <Link to={`${currentPrefix}/workspaces/create`}>
              <button className="h-[44px] px-5 rounded-[12px] text-[14px] font-semibold bg-[#FFFFFF] border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#111827] transition-all">
                Create Workspace
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Calendar Timeline (Workspace Timeline) */}
      <CalendarWidget />

      {/* Statistics Cards Row */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6`}>
        <StatisticsCard 
          title="Total Events" 
          value="1,248" 
          icon={Calendar} 
          change="+14.2%" 
          changeType="positive"
          sparklineData={[32, 35, 38, 41, 39, 44, 47]}
          isLoading={isSyncing}
        />
        <StatisticsCard 
          title="Upcoming Events" 
          value="42 active" 
          icon={CalendarPlus} 
          change="12 this week" 
          changeType="neutral"
          sparklineData={[25, 28, 30, 27, 29, 31, 34]}
          isLoading={isSyncing}
        />
        <StatisticsCard 
          title="Workspace Bookings" 
          value="82% load" 
          icon={Building} 
          change="Optimal" 
          changeType="positive"
          sparklineData={[78, 80, 84, 82, 85, 81, 82]}
          isLoading={isSyncing}
        />
        {isAdmin && (
          <StatisticsCard 
            title="Revenue" 
            value="$26,800" 
            icon={DollarSign} 
            change="+18.4%" 
            changeType="positive"
            sparklineData={[22400, 23500, 24100, 24800, 25900, 26100, 26800]}
            isLoading={isSyncing}
          />
        )}
        <StatisticsCard 
          title="Community Members" 
          value="1,420" 
          icon={Users} 
          change="+4.2%" 
          changeType="positive"
          sparklineData={[1320, 1340, 1360, 1380, 1390, 1410, 1420]}
          isLoading={isSyncing}
        />
      </div>

      {/* 4. Large Action Tiles for Common Commands */}
      {isAdmin && <QuickActionCards />}

      {/* 5. Performance Charts Visualization Panels (Revenue, Load, Cohort) */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-4 h-4 text-[#84CC16]" />
            <h3 className="font-display font-bold text-[14px] text-[#6B7280] uppercase tracking-wider">
              Workspace Performance Data
            </h3>
          </div>
          <DashboardCharts />
        </div>
      )}

      {/* 6. Audit Logs Timeline */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-8">
          <RecentActivityWidget />
        </div>
      )}

      {/* 7. New Dynamic Operational Modules (Recent Payments, Latest Registrations, Upcoming Events, Announcements) */}
      {isAdmin && (
        <div className="space-y-6">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-[#84CC16]" />
          <h3 className="font-display font-bold text-[14px] text-[#6B7280] uppercase tracking-wider">
            Operational Live Ledger
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Block A: Recent Payments */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#A3E635]/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-[#84CC16]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[18px] text-[#111827]">Recent Payments</h4>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">Verified financial workspace invoices</p>
                </div>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No recent payments.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="py-3 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">ID</th>
                      <th className="py-3 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Client</th>
                      <th className="py-3 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-[#F8FAFC] transition">
                        <td className="py-3.5 text-[14px] font-mono font-semibold text-[#111827]">{p.id}</td>
                        <td className="py-3.5 text-[14px] text-[#6B7280]">
                          <p className="font-semibold text-[#111827]">{p.client || 'N/A'}</p>
                        </td>
                        <td className="py-3.5 text-[14px] font-bold text-[#111827]">{p.amount || p.grandTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Block B: Latest Registrations */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#A3E635]/10 rounded-lg">
                  <UserCheck className="w-5 h-5 text-[#84CC16]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[18px] text-[#111827]">Latest Registrations</h4>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">Attendee signups</p>
                </div>
              </div>
            </div>

            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No registrations.</div>
            ) : (
              <div className="space-y-4">
                {filteredRegistrations.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl">
                    <p className="text-[14px] font-bold text-[#111827]">{r.firstName} {r.lastName}</p>
                    <p className="text-[12px] text-[#6B7280]">{r.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Block C: Upcoming Events */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#A3E635]/10 rounded-lg">
                  <CalendarRange className="w-5 h-5 text-[#84CC16]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[18px] text-[#111827]">Upcoming Events</h4>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">Community events</p>
                </div>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No events scheduled.</div>
            ) : (
              <div className="space-y-4">
                {events.map((ev) => (
                  <div key={ev.id} className="p-4 border border-gray-100 rounded-xl">
                    <h5 className="font-display font-bold text-[16px] text-[#111827]">{ev.title}</h5>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Block D: Announcements */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#A3E635]/10 rounded-lg">
                  <Megaphone className="w-5 h-5 text-[#84CC16]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[18px] text-[#111827]">Announcements</h4>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">Operator broadcasts</p>
                </div>
              </div>
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No announcements.</div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 bg-[#F8FAFC] border border-gray-100 rounded-xl">
                    <h5 className="font-display font-bold text-[14px] text-[#111827]">{ann.title}</h5>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

    </div>
  );
}
