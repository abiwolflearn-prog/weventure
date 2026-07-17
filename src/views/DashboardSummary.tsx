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
import { Link } from 'react-router-dom';

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

export default function DashboardSummary() {
  const { user } = useAppSelector((state) => state.auth);
  
  // Interactive simulator states to allow audit of UI states
  const [simulationState, setSimulationState] = useState<'normal' | 'loading' | 'error' | 'empty'>('normal');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats values
  const activeTenantName = user?.tenantId 
    ? user.tenantId.charAt(0).toUpperCase() + user.tenantId.slice(1) 
    : 'WeVentureHub';

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // Auto sync on mount
  useEffect(() => {
    triggerSync();
  }, []);

  // Today's formatted date
  const todayStr = new Date().toLocaleDateString('default', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Mock datasets for requested lists
  const recentPayments = [
    { id: 'inv-101', client: 'Acme Corp SaaS Group', amount: '$1,200.00', date: 'Jul 14, 2026', status: 'Paid', method: 'Stripe Gateway' },
    { id: 'inv-102', client: 'Globex Space Inc', amount: '$850.00', date: 'Jul 13, 2026', status: 'Paid', method: 'Chapa Pay' },
    { id: 'inv-103', client: 'Stark Labs Suite', amount: '$3,400.00', date: 'Jul 11, 2026', status: 'Paid', method: 'Bank Transfer' },
    { id: 'inv-104', client: 'Wayne Enterprise HQ', amount: '$1,950.00', date: 'Jul 10, 2026', status: 'Paid', method: 'Stripe Gateway' },
  ];

  const latestRegistrations = [
    { id: 'reg-1', name: 'Alice Smith', email: 'alice.smith@acme.com', event: 'SaaS Growth Masterclass', date: 'Just now' },
    { id: 'reg-2', name: 'Bob Johnson', email: 'bob.j@globex.org', event: 'Web3 & AI Networking Night', date: '12m ago' },
    { id: 'reg-3', name: 'Carol Danvers', email: 'carol@star.com', event: 'Product Management 101', date: '1h ago' },
    { id: 'reg-4', name: 'David Miller', email: 'david.m@wayne.com', event: 'SaaS Growth Masterclass', date: '3h ago' },
  ];

  const upcomingEvents = [
    { id: 'ev-1', title: 'SaaS Growth Masterclass', date: 'Jul 18, 2026', time: '14:00 - 16:30', registered: 148, capacity: 200, category: 'Business' },
    { id: 'ev-2', title: 'Web3 & AI Networking Night', date: 'Jul 22, 2026', time: '18:00 - 21:00', registered: 92, capacity: 100, category: 'Tech' },
    { id: 'ev-3', title: 'Product Management 101', date: 'Jul 25, 2026', time: '10:00 - 12:30', registered: 64, capacity: 80, category: 'Product' },
  ];

  const announcements = [
    { id: 'ann-1', title: 'Fiber Optic Upgrade Complete', content: 'Super-high speed 10Gbps enterprise connectivity is now active across all hot desks and boardrooms.', date: 'Today' },
    { id: 'ann-2', title: 'New Catering Partner: FreshBites', content: 'Enjoy organic, freshly made healthy snacks and gourmet beverages starting next Monday.', date: '2 days ago' },
  ];

  if (simulationState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h1 className="font-display font-bold text-[32px] text-[#111827]">Simulated Loader State</h1>
            <p className="text-[14px] text-[#6B7280] mt-1">Simulated skeleton loader active</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setSimulationState('normal')}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            <span>Reset UI View</span>
          </Button>
        </div>
        <DashboardOverviewSkeleton />
      </div>
    );
  }

  if (simulationState === 'error') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h1 className="font-display font-bold text-[32px] text-[#111827]">Simulated Telemetry Error</h1>
            <p className="text-[14px] text-[#6B7280] mt-1">Simulated error boundaries dashboard state</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setSimulationState('normal')}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset UI View</span>
          </Button>
        </div>
        <DashboardErrorState 
          title="Tenant API Gateway Offline"
          message="The system failed to establish isolation synchronization tunnels to your server. Please verify your RBAC access tokens and retry."
          code="ERR_ISOLATION_TUNNEL_REFUSED"
          onRetry={() => {
            alert('Initiating workspace separation gateway refresh...');
            setSimulationState('normal');
          }}
        />
      </div>
    );
  }

  if (simulationState === 'empty') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h1 className="font-display font-bold text-[32px] text-[#111827]">Simulated Empty Ledger</h1>
            <p className="text-[14px] text-[#6B7280] mt-1">Simulated clean ledger state without data</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setSimulationState('normal')}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset UI View</span>
          </Button>
        </div>
        <DashboardEmptyState 
          title="No Space Bookings Found"
          description="It looks like you don't have any bookings scheduled for this workspace yet. Reserve a premium hot desk, boardroom, or creative suite to kickstart your journey."
          icon={FolderOpen}
          actionText="Book Premium Space"
          onAction={() => {
            setSimulationState('normal');
          }}
        />
      </div>
    );
  }

  // Filter lists based on simple search query
  const filteredPayments = recentPayments.filter(p => 
    p.client.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRegistrations = latestRegistrations.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.event.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fade-in pb-16 bg-[#F8FAFC]">
      
      {/* 1. Brand Top Header with Search, Actions, Simulator Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-[#E5E7EB] pb-6">
        <div>
          <span className="text-[14px] font-bold text-[#2563EB] tracking-wide uppercase">
            Leader Hub Management Panel
          </span>
          <h1 className="font-display font-bold text-[32px] text-[#111827] tracking-tight mt-1">
            Leader Dashboard
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Welcome back, <b className="text-[#111827]">{user?.firstName || 'Operator'}</b>! Here is the chronological operational digest for <b className="text-[#2563EB] font-bold uppercase">{activeTenantName}</b>.
          </p>
        </div>

        {/* Global Search & Action block */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Gray border, White background, blue focus, rounded search input */}
          <div className="relative min-w-[280px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="w-4 h-4 text-[#6B7280]" />
            </span>
            <input
              type="text"
              placeholder="Search events, clients, members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] placeholder-[#6B7280] text-[14px] rounded-[12px] pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
            />
          </div>

          {/* Today Date Badge */}
          <div className="hidden md:flex items-center space-x-2 px-4 py-2.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] text-[14px] text-[#111827] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>{todayStr}</span>
          </div>

          {/* Audit Simulator Toolbar */}
          <div className="flex bg-[#FFFFFF] p-1.5 rounded-[12px] border border-[#E5E7EB] text-[12px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <button
              onClick={() => setSimulationState('loading')}
              className="px-3 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] rounded-md transition-all"
              title="Audit Loading Skeleton view"
            >
              Skeleton
            </button>
            <button
              onClick={() => setSimulationState('error')}
              className="px-3 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] rounded-md transition-all"
              title="Audit Error card view"
            >
              Error
            </button>
            <button
              onClick={() => setSimulationState('empty')}
              className="px-3 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] rounded-md transition-all"
              title="Audit Empty ledger view"
            >
              Empty
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={triggerSync}
            disabled={isSyncing}
            className="bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] hover:bg-gray-50 h-[44px] px-4 rounded-[12px] font-semibold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin text-[#2563EB]' : 'text-[#6B7280]'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Premium Enterprise Welcome Banner (Clean White Card Layout) */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-8 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden">
        {/* Subtle decorative absolute gradient bar */}
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#2563EB] to-[#60A5FA]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#2563EB]/8 border border-[#2563EB]/20 rounded-full text-[#2563EB] text-[12px] font-semibold mb-4">
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
            <Link to="/dashboard/events">
              <button className="h-[44px] px-5 rounded-[12px] text-[14px] font-bold bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:opacity-90 text-[#FFFFFF] shadow-[0_2px_10px_rgba(37,99,235,0.2)] transition-all">
                Publish Event
              </button>
            </Link>
            <Link to="/dashboard/workspaces">
              <button className="h-[44px] px-5 rounded-[12px] text-[14px] font-semibold bg-[#FFFFFF] border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#111827] transition-all">
                Book Workspace
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Five-Column Statistics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
        <StatisticsCard 
          title="Revenue" 
          value="$26,800" 
          icon={DollarSign} 
          change="+18.4%" 
          changeType="positive"
          sparklineData={[22400, 23500, 24100, 24800, 25900, 26100, 26800]}
          isLoading={isSyncing}
        />
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
      <QuickActionCards />

      {/* 5. Performance Charts Visualization Panels (Revenue, Load, Cohort) */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2.5">
          <Activity className="w-4 h-4 text-[#2563EB]" />
          <h3 className="font-display font-bold text-[14px] text-[#6B7280] uppercase tracking-wider">
            Workspace Performance Data
          </h3>
        </div>
        <DashboardCharts />
      </div>

      {/* 6. Calendar Timeline & Audit Logs Timeline (2-Column Grid) */}
      <div className="grid grid-cols-1 gap-8">
        <CalendarWidget />
        <RecentActivityWidget />
      </div>

      {/* 7. New Dynamic Operational Modules (Recent Payments, Latest Registrations, Upcoming Events, Announcements) */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
          <h3 className="font-display font-bold text-[14px] text-[#6B7280] uppercase tracking-wider">
            Operational Live Ledger
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Block A: Recent Payments (Lemon Green Success Badges, Sticky Headers, Hover Effects) */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#2563EB]/8 rounded-lg">
                  <CreditCard className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[18px] text-[#111827]">Recent Payments</h4>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">Verified financial workspace invoices</p>
                </div>
              </div>
              <span className="text-[12px] bg-[#A3E635]/20 text-[#4D7C0F] font-bold px-2.5 py-1 rounded-md">
                Secured
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="py-3 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Invoice ID</th>
                    <th className="py-3 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Client</th>
                    <th className="py-3 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Amount</th>
                    <th className="py-3 text-[12px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-[#F8FAFC] transition">
                      <td className="py-3.5 text-[14px] font-mono font-semibold text-[#111827]">{p.id}</td>
                      <td className="py-3.5 text-[14px] text-[#6B7280]">
                        <p className="font-semibold text-[#111827]">{p.client}</p>
                        <p className="text-[12px] text-[#6B7280]">{p.method}</p>
                      </td>
                      <td className="py-3.5 text-[14px] font-bold text-[#111827]">{p.amount}</td>
                      <td className="py-3.5 text-[14px] text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#A3E635] text-[#1F2937]">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Block B: Latest Registrations */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#2563EB]/8 rounded-lg">
                  <UserCheck className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[18px] text-[#111827]">Latest Registrations</h4>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">Attendee signups for published events</p>
                </div>
              </div>
              <span className="text-[12px] font-semibold text-[#2563EB]">Real-time</span>
            </div>

            <div className="space-y-4">
              {filteredRegistrations.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:border-[#2563EB]/25 hover:bg-[#F8FAFC] transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#2563EB]/8 flex items-center justify-center text-[#2563EB] font-bold text-[14px]">
                      {r.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#111827]">{r.name}</p>
                      <p className="text-[12px] text-[#6B7280]">{r.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-semibold text-[#2563EB]">{r.event}</p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{r.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block C: Upcoming Events (With Elegant Progress Bar) */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#2563EB]/8 rounded-lg">
                  <CalendarRange className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[18px] text-[#111827]">Upcoming Events</h4>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">Events published to the community feed</p>
                </div>
              </div>
              <Link to="/dashboard/events" className="text-[14px] font-bold text-[#2563EB] hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingEvents.map((ev) => {
                const ratio = Math.round((ev.registered / ev.capacity) * 100);
                return (
                  <div key={ev.id} className="p-4 border border-gray-100 rounded-xl hover:bg-[#F8FAFC] transition">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[#6B7280] text-[10px] font-bold uppercase tracking-wider">{ev.category}</span>
                        <h5 className="font-display font-bold text-[16px] text-[#111827] mt-1.5">{ev.title}</h5>
                      </div>
                      <span className="text-[14px] font-bold text-[#111827]">{ratio}% Booked</span>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] h-full rounded-full" 
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                        <span className="font-semibold">{ev.date} at {ev.time}</span>
                        <span>{ev.registered}/{ev.capacity} spots</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block D: Announcements (Bulletin board) */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#2563EB]/8 rounded-lg">
                  <Megaphone className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[18px] text-[#111827]">Announcements Bulletin</h4>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">Global workspace operator broadcasts</p>
                </div>
              </div>
              <span className="w-2 h-2 bg-[#EF4444] rounded-full animate-ping" />
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl hover:border-[#2563EB]/20 transition relative">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-display font-bold text-[14px] text-[#111827]">{ann.title}</h5>
                    <span className="text-[11px] font-bold text-[#2563EB] uppercase">{ann.date}</span>
                  </div>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
