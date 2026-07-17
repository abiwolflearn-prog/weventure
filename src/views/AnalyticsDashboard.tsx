import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../store';
import {
  DollarSign,
  CalendarRange,
  Users,
  Ticket,
  Building,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
  Calendar,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  SlidersHorizontal,
  Building2,
  Lock,
  Compass,
  FileCheck2,
  Layers,
  Percent,
  CheckCircle2,
  TrendingDown,
  Activity,
  UserCheck,
  CreditCard,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// API & Helpers
import { analyticsApi, IAnalyticsQueryParams } from '../lib/analyticsApi';
import { Permission, UserRole } from '../types';

// Custom Modular Widgets
import KpiCardsGrid, { IKpiItem } from '../components/analytics/KpiCardsGrid';
import RevenueLineChart from '../components/analytics/RevenueLineChart';
import DistributionPieChart from '../components/analytics/DistributionPieChart';
import LeaseBarChart from '../components/analytics/LeaseBarChart';
import PerformanceTable, { ITableColumn } from '../components/analytics/PerformanceTable';
import FilterBar from '../components/analytics/FilterBar';

type PerspectiveType = 'super_admin' | 'company_admin' | 'event_manager' | 'finance' | 'workspace';

export default function AnalyticsDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  // Default perspective derived from user role
  const getInitialPerspective = (): PerspectiveType => {
    if (!user) return 'company_admin';
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return 'super_admin';
      case UserRole.TENANT_ADMIN:
        return 'company_admin';
      case UserRole.STAFF:
        return 'event_manager';
      case UserRole.HUB_MEMBER:
      default:
        return 'workspace';
    }
  };

  const [activePerspective, setActivePerspective] = useState<PerspectiveType>(getInitialPerspective());
  const [range, setRange] = useState<string>('30d');
  const [customDates, setCustomDates] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Handle Query Parameters
  const queryParams: IAnalyticsQueryParams = {
    range,
    ...(range === 'custom' && customDates.start && customDates.end
      ? {
          startDate: new Date(customDates.start).toISOString(),
          endDate: new Date(customDates.end).toISOString(),
        }
      : {}),
  };

  // Queries (TanStack Query v5 with cached responses)
  const {
    data: summary,
    isLoading: summaryLoading,
    isRefetching: summaryRefetching,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['analyticsSummary', queryParams],
    queryFn: () => analyticsApi.getSummary(queryParams),
  });

  const {
    data: revenueData,
    isLoading: revenueLoading,
    isRefetching: revenueRefetching,
    error: revenueError,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ['analyticsRevenue', queryParams],
    queryFn: () => analyticsApi.getRevenue(queryParams),
  });

  const {
    data: workspaceData,
    isLoading: workspacesLoading,
    isRefetching: workspacesRefetching,
    error: workspacesError,
    refetch: refetchWorkspaces,
  } = useQuery({
    queryKey: ['analyticsWorkspaces', queryParams],
    queryFn: () => analyticsApi.getWorkspaces(queryParams),
  });

  const {
    data: bookingData,
    isLoading: bookingsLoading,
    isRefetching: bookingsRefetching,
    error: bookingsError,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['analyticsBookings', queryParams],
    queryFn: () => analyticsApi.getBookings(queryParams),
  });

  const {
    data: eventData,
    isLoading: eventsLoading,
    isRefetching: eventsRefetching,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['analyticsEvents', queryParams],
    queryFn: () => analyticsApi.getEvents(queryParams),
  });

  const {
    data: userData,
    isLoading: usersLoading,
    isRefetching: usersRefetching,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['analyticsUsers', queryParams],
    queryFn: () => analyticsApi.getUsers(queryParams),
  });

  // Core loading state
  const isGlobalLoading =
    summaryLoading ||
    revenueLoading ||
    workspacesLoading ||
    bookingsLoading ||
    eventsLoading ||
    usersLoading;

  const isGlobalRefetching =
    summaryRefetching ||
    revenueRefetching ||
    workspacesRefetching ||
    bookingsRefetching ||
    eventsRefetching ||
    usersRefetching;

  // Error boundary handler
  const globalError =
    summaryError ||
    revenueError ||
    workspacesError ||
    bookingsError ||
    eventsError ||
    usersError;

  const handleGlobalRefresh = () => {
    refetchSummary();
    refetchRevenue();
    refetchWorkspaces();
    refetchBookings();
    refetchEvents();
    refetchUsers();
  };

  // CSV and JSON client-side export pipelines
  const handleExport = (format: 'csv' | 'json') => {
    let payload: any[] = [];
    let filename = `WeVentureHub-${activePerspective}-analytics-${range}`;

    if (activePerspective === 'company_admin') {
      payload = workspaceData?.topWorkspaces || [];
    } else if (activePerspective === 'super_admin') {
      payload = [
        { Metric: 'Platform Revenue', Value: summary?.revenue?.value, Growth: summary?.revenue?.change },
        { Metric: 'System Leases', Value: summary?.bookings?.value, Growth: summary?.bookings?.change },
        { Metric: 'Total Registrations', Value: summary?.registrations?.value, Growth: summary?.registrations?.change },
      ];
    } else if (activePerspective === 'event_manager') {
      payload = eventData?.topEvents || [];
    } else if (activePerspective === 'finance') {
      payload = userData?.topUsers || [];
    } else {
      payload = bookingData?.bookingsBySpaceType || [];
    }

    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${filename}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } else {
      // CSV parser
      if (payload.length === 0) {
        alert('No data is currently loaded to export.');
        return;
      }
      const headers = Object.keys(payload[0]).join(',');
      const rows = payload.map((item) =>
        Object.values(item)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csvStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvStr);
      downloadAnchor.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    }
  };

  // --- PERSPECTIVE BUILDERS ---

  // 1. Super Admin Perspective
  const getSuperAdminKpis = (): IKpiItem[] => {
    return [
      {
        key: 'platform-revenue',
        title: 'Platform-wide Revenue',
        value: `$${(revenueData?.totalRevenue || 0).toLocaleString()}`,
        change: summary?.revenue?.change || 0,
        trend: summary?.revenue?.change >= 0 ? 'up' : 'down',
        description: 'Multi-tenant consolidated yield',
        icon: DollarSign,
        color: 'violet',
      },
      {
        key: 'global-leases',
        title: 'Total Room Bookings',
        value: (bookingData?.totalBookings || 0).toLocaleString(),
        change: summary?.bookings?.change || 0,
        trend: summary?.bookings?.change >= 0 ? 'up' : 'down',
        description: 'Cross-tenant usage frequency',
        icon: Building,
        color: 'indigo',
      },
      {
        key: 'total-events',
        title: 'Total Active Events',
        value: (eventData?.totalEvents || 0).toLocaleString(),
        change: summary?.events?.change || 0,
        trend: summary?.events?.change >= 0 ? 'up' : 'down',
        description: 'Scheduled multi-session meetups',
        icon: CalendarRange,
        color: 'sky',
      },
      {
        key: 'active-users',
        title: 'Global Active Users',
        value: (userData?.totalActiveUsers || 0).toLocaleString(),
        change: summary?.activeUsers?.change || 0,
        trend: summary?.activeUsers?.change >= 0 ? 'up' : 'down',
        description: 'Platform engagement baseline',
        icon: Users,
        color: 'emerald',
      },
      {
        key: 'system-tenants',
        title: 'Active Core Tenants',
        value: '1 Tenant Pool',
        change: 0,
        trend: 'neutral',
        description: 'Secure sandbox isolation',
        icon: Layers,
        color: 'amber',
      },
    ];
  };

  const simulatedTenants = [
    { id: 't1', name: 'WeVentureHub Addis Ababa HQ', status: 'ACTIVE', users: 340, usageRate: 94, database: 'weventure_hq' },
    { id: 't2', name: 'WeVentureHub Bole Chapter', status: 'ACTIVE', users: 210, usageRate: 88, database: 'weventure_bole' },
    { id: 't3', name: 'WeVentureHub Kazanchis Incubator', status: 'ACTIVE', users: 185, usageRate: 72, database: 'weventure_kazanchis' },
    { id: 't4', name: 'WeVentureHub Hawassa Outpost', status: 'PROVISIONING', users: 0, usageRate: 0, database: 'weventure_hawassa' },
  ];

  const superAdminTableColumns: ITableColumn<(typeof simulatedTenants)[0]>[] = [
    {
      key: 'name',
      header: 'Hub Chapter / Branch',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#84CC16]" />
          <span className="font-bold text-gray-900">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Deployment Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-50 bg-emerald-50/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-50 bg-amber-50/20 text-amber-600 dark:text-amber-400 animate-pulse'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'users',
      header: 'Members Pool',
      sortable: true,
      render: (row) => <span className="font-semibold">{row.users} users</span>,
    },
    {
      key: 'usageRate',
      header: 'Resource Utilization',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 max-w-[120px]">
          <div className="w-full bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#84CC16] h-full" style={{ width: `${row.usageRate}%` }} />
          </div>
          <span className="font-bold text-[10px]">{row.usageRate}%</span>
        </div>
      ),
    },
    {
      key: 'database',
      header: 'Cloud Datastore',
      render: (row) => <span className="font-mono text-[10px] text-neutral-slate-400">{row.database}</span>,
    },
  ];

  // 2. Company Admin Perspective (Tenant Admin)
  const getCompanyAdminKpis = (): IKpiItem[] => {
    return [
      {
        key: 'tenant-revenue',
        title: 'Tenant Gross Revenue',
        value: `$${(revenueData?.totalRevenue || 0).toLocaleString()}`,
        change: summary?.revenue?.change || 0,
        trend: summary?.revenue?.change >= 0 ? 'up' : 'down',
        description: 'Sum of all rental and event sales',
        icon: DollarSign,
        color: 'emerald',
      },
      {
        key: 'workspace-leases',
        title: 'Total Leases Volume',
        value: (bookingData?.totalBookings || 0).toLocaleString(),
        change: summary?.bookings?.change || 0,
        trend: summary?.bookings?.change >= 0 ? 'up' : 'down',
        description: 'Completed workspace rentals',
        icon: Building,
        color: 'indigo',
      },
      {
        key: 'ticket-claims',
        title: 'Total Registrations',
        value: (eventData?.topEvents?.reduce((acc, curr) => acc + curr.ticketsSold, 0) || 0).toLocaleString(),
        change: summary?.registrations?.change || 0,
        trend: summary?.registrations?.change >= 0 ? 'up' : 'down',
        description: 'Total active ticket entries sold',
        icon: Ticket,
        color: 'violet',
      },
      {
        key: 'tenant-members',
        title: 'Unique Active Members',
        value: (userData?.totalActiveUsers || 0).toLocaleString(),
        change: summary?.activeUsers?.change || 0,
        trend: summary?.activeUsers?.change >= 0 ? 'up' : 'down',
        description: 'Unique member engagement pool',
        icon: Users,
        color: 'sky',
      },
      {
        key: 'utilization',
        title: 'Workspace Occupancy Rate',
        value: `${summary?.workspaceUtilization?.value || 0}%`,
        change: summary?.workspaceUtilization?.change || 0,
        trend: summary?.workspaceUtilization?.change >= 0 ? 'up' : 'down',
        description: 'Hours booked out of total capacity',
        icon: Clock,
        color: 'rose',
      },
    ];
  };

  const companyAdminTableColumns: ITableColumn<any>[] = [
    {
      key: 'name',
      header: 'Workspace Resource',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-gray-900 hover:underline transition">
          🏢 {row.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Space Category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-[#F3F4F6] font-bold text-[10px] text-neutral-slate-600 dark:text-neutral-slate-400">
          {row.type}
        </span>
      ),
    },
    {
      key: 'bookingCount',
      header: 'Bookings Volume',
      sortable: true,
      render: (row) => <span className="font-semibold">{row.bookingCount} leases</span>,
    },
    {
      key: 'totalRevenue',
      header: 'Cashflow Yield',
      sortable: true,
      render: (row) => <span className="font-extrabold text-[#65A30D]">${row.totalRevenue?.toLocaleString()}</span>,
    },
  ];

  // 3. Event Manager Perspective
  const getEventManagerKpis = (): IKpiItem[] => {
    return [
      {
        key: 'events-scheduled',
        title: 'Total Programmed Events',
        value: (eventData?.totalEvents || 0).toLocaleString(),
        change: summary?.events?.change || 0,
        trend: summary?.events?.change >= 0 ? 'up' : 'down',
        description: 'Events published or draft in catalog',
        icon: CalendarRange,
        color: 'indigo',
      },
      {
        key: 'total-ticket-sales',
        title: 'Ticket Sales Volume',
        value: `$${(revenueData?.ticketRevenue || 0).toLocaleString()}`,
        change: summary?.registrations?.change || 0,
        trend: summary?.registrations?.change >= 0 ? 'up' : 'down',
        description: 'Aggregate revenue from ticket orders',
        icon: DollarSign,
        color: 'emerald',
      },
      {
        key: 'ticket-registrations',
        title: 'Total Active Signups',
        value: (eventData?.topEvents?.reduce((acc, curr) => acc + curr.ticketsSold, 0) || 0).toLocaleString(),
        change: summary?.registrations?.change || 0,
        trend: summary?.registrations?.change >= 0 ? 'up' : 'down',
        description: 'Complete verified ticket signups',
        icon: Ticket,
        color: 'violet',
      },
      {
        key: 'event-check-in',
        title: 'Average Attendance Conversion',
        value: `${userData?.checkInRate || 0}%`,
        change: 0,
        trend: 'neutral',
        description: 'Checked-in attendees against claims',
        icon: UserCheck,
        color: 'sky',
      },
      {
        key: 'event-diversity',
        title: 'Category Variety',
        value: `${eventData?.eventsByCategory?.length || 0} Sectors`,
        change: 0,
        trend: 'neutral',
        description: 'Diverse educational disciplines',
        icon: Compass,
        color: 'amber',
      },
    ];
  };

  const eventManagerTableColumns: ITableColumn<any>[] = [
    {
      key: 'title',
      header: 'Orchestrated Event',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-gray-900 hover:underline transition">
          🎟️ {row.title}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Discipline Category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[10px] font-semibold text-neutral-slate-600 dark:text-neutral-slate-400">
          {row.category}
        </span>
      ),
    },
    {
      key: 'ticketsSold',
      header: 'Tickets Redeemed',
      sortable: true,
      render: (row) => <span className="font-semibold">{row.ticketsSold} orders</span>,
    },
    {
      key: 'totalRevenue',
      header: 'Event Gross Profit',
      sortable: true,
      render: (row) => <span className="font-extrabold text-emerald-500">${row.totalRevenue?.toLocaleString()}</span>,
    },
  ];

  // 4. Finance Perspective
  const getFinanceKpis = (): IKpiItem[] => {
    return [
      {
        key: 'finance-gross',
        title: 'Consolidated Gross Cashflow',
        value: `$${(revenueData?.totalRevenue || 0).toLocaleString()}`,
        change: summary?.revenue?.change || 0,
        trend: summary?.revenue?.change >= 0 ? 'up' : 'down',
        description: 'Real-time corporate treasury balance',
        icon: DollarSign,
        color: 'violet',
      },
      {
        key: 'rent-share',
        title: 'Workspace Rent Yield',
        value: `$${(revenueData?.bookingRevenue || 0).toLocaleString()}`,
        change: summary?.bookings?.change || 0,
        trend: summary?.bookings?.change >= 0 ? 'up' : 'down',
        description: 'Hourly space leasing revenues',
        icon: Building,
        color: 'indigo',
      },
      {
        key: 'event-share',
        title: 'Event Ticket Gross',
        value: `$${(revenueData?.ticketRevenue || 0).toLocaleString()}`,
        change: summary?.registrations?.change || 0,
        trend: summary?.registrations?.change >= 0 ? 'up' : 'down',
        description: 'Direct sales from events',
        icon: Ticket,
        color: 'emerald',
      },
      {
        key: 'avg-invoice',
        title: 'Average Order Basket',
        value: `$${Math.round(
          (revenueData?.totalRevenue || 0) /
            ((bookingData?.totalBookings || 1) +
              (eventData?.topEvents?.reduce((acc, curr) => acc + curr.ticketsSold, 0) || 1))
        ).toLocaleString()}`,
        change: 0,
        trend: 'neutral',
        description: 'Average spent per workspace / ticket action',
        icon: CreditCard,
        color: 'sky',
      },
      {
        key: 'checkin-yield',
        title: 'Revenue Sinks Check',
        value: '0 Outstanding',
        change: 0,
        trend: 'neutral',
        description: 'Corporate ledger reconciled clean',
        icon: FileCheck2,
        color: 'amber',
      },
    ];
  };

  const financeTableColumns: ITableColumn<any>[] = [
    {
      key: 'email',
      header: 'Controlling Member Account',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-gray-800">
          👤 {row.email}
        </span>
      ),
    },
    {
      key: 'bookingCount',
      header: 'Completed Orders',
      sortable: true,
      render: (row) => <span className="font-semibold">{row.bookingCount} items</span>,
    },
    {
      key: 'totalSpent',
      header: 'Total Contributed Capital',
      sortable: true,
      render: (row) => <span className="font-extrabold text-[#65A30D]">${row.totalSpent?.toLocaleString()}</span>,
    },
  ];

  // 5. Workspace Perspective
  const getWorkspaceKpis = (): IKpiItem[] => {
    return [
      {
        key: 'total-workspaces-count',
        title: 'Deployable Spaces',
        value: (workspaceData?.totalWorkspaces || 0).toLocaleString(),
        change: 0,
        trend: 'neutral',
        description: 'Fully configured spaces',
        icon: Building,
        color: 'violet',
      },
      {
        key: 'spatial-leases',
        title: 'Total Hours Reserved',
        value: `${(bookingData?.totalHoursBooked || 0).toLocaleString()} hrs`,
        change: summary?.bookings?.change || 0,
        trend: summary?.bookings?.change >= 0 ? 'up' : 'down',
        description: 'Cumulative lease duration registered',
        icon: Clock,
        color: 'sky',
      },
      {
        key: 'average-duration',
        title: 'Average Rent Duration',
        value: `${bookingData?.averageDurationHours || 0} hrs`,
        change: 0,
        trend: 'neutral',
        description: 'Average lease session duration',
        icon: Calendar,
        color: 'indigo',
      },
      {
        key: 'utilization-rate',
        title: 'Resource Allocation Index',
        value: `${summary?.workspaceUtilization?.value || 0}%`,
        change: summary?.workspaceUtilization?.change || 0,
        trend: summary?.workspaceUtilization?.change >= 0 ? 'up' : 'down',
        description: 'Occupancy density coefficient',
        icon: Percent,
        color: 'rose',
      },
      {
        key: 'workspace-categories',
        title: 'Workspace Formats',
        value: `${workspaceData?.workspacesByType?.length || 0} Classes`,
        change: 0,
        trend: 'neutral',
        description: 'Hot desks, rooms, event venues',
        icon: Layers,
        color: 'amber',
      },
    ];
  };

  const workspaceTableColumns: ITableColumn<any>[] = [
    {
      key: 'name',
      header: 'Workspace Descriptor',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-gray-900">
          ⚡ {row.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Operational Category',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded bg-[#F3F4F6] text-[10px] font-bold uppercase tracking-wider">
          {row.type}
        </span>
      ),
    },
    {
      key: 'bookingCount',
      header: 'Reservation Frequency',
      sortable: true,
      render: (row) => <span className="font-semibold">{row.bookingCount} leases</span>,
    },
    {
      key: 'totalRevenue',
      header: 'Spatial Yield',
      sortable: true,
      render: (row) => <span className="font-extrabold text-[#65A30D]">${row.totalRevenue?.toLocaleString()}</span>,
    },
  ];

  // Map charts data correctly based on live results
  const getLiveRevenueTimeline = () => {
    return revenueData?.revenueTimeline || [];
  };

  const getLiveUserRegistrationTimeline = () => {
    return userData?.registrationTrend || [];
  };

  const getLiveBookingsBySpaceType = () => {
    return (
      bookingData?.bookingsBySpaceType?.map((item) => ({
        name: item.spaceType === 'HOT_DESK' ? 'Hot Desk' : item.spaceType === 'MEETING_ROOM' ? 'Meeting Room' : 'Event Venue',
        value: item.count,
        count: item.count,
        revenue: item.revenue,
      })) || []
    );
  };

  const getLiveEventsByCategory = () => {
    return (
      eventData?.eventsByCategory?.map((item) => ({
        name: item.category,
        value: item.count,
      })) || []
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. EXECUTIVE TITLE HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl tracking-tight text-[#111827]">
              WeVentureHub BI Executive Portal
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#A3E635]/15 text-[#65A30D] text-[10px] font-bold">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Corporate Intelligence
            </span>
          </div>
          <p className="text-xs text-[#4B5563] mt-1">
            Reconciled enterprise analytics, real-time spatial utilization trackers, and financial cashflow distribution leagues.
          </p>
        </div>

        {/* PERSPECTIVE SELECTOR BAR */}
        <div className="flex items-center gap-2 bg-[#F3F4F6] p-1.5 rounded-2xl border border-[#E5E7EB] text-xs overflow-x-auto max-w-full">
          {(
            [
              { id: 'super_admin', label: 'Super Admin', icon: ShieldAlert, permission: Permission.ANALYTICS_READ },
              { id: 'company_admin', label: 'Company Admin', icon: Building2, permission: Permission.ANALYTICS_READ },
              { id: 'event_manager', label: 'Event Manager', icon: Ticket, permission: Permission.EVENTS_READ },
              { id: 'finance', label: 'Finance Hub', icon: CreditCard, permission: Permission.ANALYTICS_READ },
              { id: 'workspace', label: 'Workspace Ops', icon: Activity, permission: Permission.WORKSPACES_READ },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = activePerspective === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePerspective(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-[#84CC16] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[#E5E7EB]'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DATE FILTERS, RELOADERS & EXPORT CONTROLS */}
      <FilterBar
        range={range}
        onRangeChange={setRange}
        customDates={customDates}
        onCustomDatesChange={setCustomDates}
        onRefresh={handleGlobalRefresh}
        isLoading={isGlobalLoading}
        isRefetching={isGlobalRefetching}
        onExport={handleExport}
      />

      {/* 3. CORE ANALYTICAL LAYOUT GRID */}
      {isGlobalLoading ? (
        <div className="space-y-8 animate-pulse">
          {/* KPI Grid Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 shadow-sm/80 rounded-2xl p-5 h-28"
              />
            ))}
          </div>
          {/* Charts Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl h-80 lg:col-span-2" />
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl h-80" />
          </div>
        </div>
      ) : globalError ? (
        <div className="bg-rose-50 bg-rose-50/10 border border-rose-100 dark:border-rose-900/30 p-8 rounded-3xl text-center flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
          <h3 className="font-display font-bold text-lg text-rose-950 dark:text-rose-200">
            Analytics Query Pipeline Failed
          </h3>
          <p className="text-xs text-rose-500/80 max-w-md leading-relaxed">
            There was a problem executing the multi-tenant aggregation pipeline. This can happen if database sharding boundaries are synchronizing.
          </p>
          <button
            onClick={handleGlobalRefresh}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
          >
            Retry Query Pipeline
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* A. SUPER ADMIN PERSPECTIVE VIEW */}
          {activePerspective === 'super_admin' && (
            <>
              <KpiCardsGrid items={getSuperAdminKpis()} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RevenueLineChart
                    data={getLiveRevenueTimeline()}
                    mode="revenue"
                    title="Platform-wide Consolidated Yield"
                    description="Gross cashflows tracked daily across active spatial leases and ticket checkouts."
                    accentLabel="Cross-Tenant Feed"
                  />
                </div>
                <div>
                  <DistributionPieChart
                    data={[
                      { name: 'WeVenture London', value: 34 },
                      { name: 'WeVenture SF', value: 48 },
                      { name: 'WeVenture Berlin', value: 18 },
                    ]}
                    title="Tenant Spatial Distribution"
                    description="Platform load allocated per regional node database sharding."
                    centerLabel="3 Node Pools"
                    centerSublabel="Regional Shards"
                  />
                </div>
              </div>

              <PerformanceTable
                data={simulatedTenants}
                columns={superAdminTableColumns}
                title="Regional Hub Chapters & Datastores"
                subtitle="High-availability local branch databases running on WeVentureHub enterprise clusters."
                searchPlaceholder="Search active tenants..."
                itemsPerPage={4}
                drillDownTitle={(row) => `${row.name} Infrastructure Allocation`}
                drillDownContent={(row) => (
                  <div className="space-y-4">
                    <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[10px] uppercase font-bold text-[#4B5563]">Database Engine</p>
                      <p className="text-sm font-bold text-[#65A30D] mt-1">{row.database}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">Total Leased Shards</p>
                        <p className="text-base font-extrabold mt-1 text-[#111827]">{row.users} accounts</p>
                      </div>
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">System Activity Rate</p>
                        <p className="text-base font-extrabold mt-1 text-emerald-600">{row.usageRate}%</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#4B5563] leading-relaxed">
                      This cluster is provisioned on secure multi-tenant network containers. Data isolation protocols enforce cryptographic separations on all active database transactions.
                    </p>
                  </div>
                )}
              />
            </>
          )}

          {/* B. COMPANY ADMIN PERSPECTIVE VIEW */}
          {activePerspective === 'company_admin' && (
            <>
              <KpiCardsGrid items={getCompanyAdminKpis()} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RevenueLineChart
                    data={getLiveRevenueTimeline()}
                    mode="revenue"
                    title="Tenant Revenue Stream Performance"
                    description="Gross cashflows segmented daily into space renting and ticketing actions."
                    accentLabel="Reconciled Clean"
                  />
                </div>
                <div>
                  <DistributionPieChart
                    data={getLiveBookingsBySpaceType()}
                    title="Gross Bookings distribution"
                    description="Spatial bookings partitioned into specific desk and suite templates."
                    centerLabel={`${bookingData?.totalBookings || 0}`}
                    centerSublabel="Leases"
                  />
                </div>
              </div>

              <PerformanceTable
                data={workspaceData?.topWorkspaces || []}
                columns={companyAdminTableColumns}
                title="Top Yield Workspace Resources"
                subtitle="Financial yield ranking of specific spaces inside your active tenant boundaries."
                searchPlaceholder="Search workspaces..."
                itemsPerPage={5}
                drillDownTitle={(row) => `${row.name} Yield Portfolio`}
                drillDownContent={(row) => (
                  <div className="space-y-4">
                    <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[10px] uppercase font-bold text-[#4B5563]">Gross Contribution Yield</p>
                      <p className="text-xl font-extrabold text-[#65A30D] mt-1">${row.totalRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">Total Bookings Count</p>
                        <p className="text-base font-extrabold mt-1 text-[#111827]">{row.bookingCount} leases</p>
                      </div>
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">Rate Class</p>
                        <p className="text-sm font-bold mt-1 text-[#4B5563]">{row.type}</p>
                      </div>
                    </div>
                  </div>
                )}
              />
            </>
          )}

          {/* C. EVENT MANAGER PERSPECTIVE VIEW */}
          {activePerspective === 'event_manager' && (
            <>
              <KpiCardsGrid items={getEventManagerKpis()} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RevenueLineChart
                    data={getLiveUserRegistrationTimeline()}
                    mode="registrations"
                    title="Event Attendee Signups Trajectory"
                    description="Daily enrollment counts mapped for scheduled events inside the workspace catalog."
                    accentLabel="Signups Trend"
                  />
                </div>
                <div>
                  <DistributionPieChart
                    data={getLiveEventsByCategory()}
                    title="Events by Program Category"
                    description="Division of catalog into diverse educational and professional disciplines."
                    centerLabel={`${eventData?.totalEvents || 0}`}
                    centerSublabel="Events"
                  />
                </div>
              </div>

              <PerformanceTable
                data={eventData?.topEvents || []}
                columns={eventManagerTableColumns}
                title="Top Performing Events Leaderboard"
                subtitle="Performance league table sorted by verified ticket orders and revenue generated."
                searchPlaceholder="Search active events..."
                itemsPerPage={5}
                drillDownTitle={(row) => `${row.title} Registration Insights`}
                drillDownContent={(row) => (
                  <div className="space-y-4">
                    <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[10px] uppercase font-bold text-[#4B5563]">Verified Ticket Earnings</p>
                      <p className="text-xl font-extrabold text-emerald-600 mt-1">${row.totalRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">Total Seats Sold</p>
                        <p className="text-base font-extrabold mt-1 text-[#111827]">{row.ticketsSold} claims</p>
                      </div>
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">Educational Class</p>
                        <p className="text-xs font-bold mt-1 truncate text-[#111827]">{row.category}</p>
                      </div>
                    </div>
                  </div>
                )}
              />
            </>
          )}

          {/* D. FINANCE PERSPECTIVE VIEW */}
          {activePerspective === 'finance' && (
            <>
              <KpiCardsGrid items={getFinanceKpis()} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RevenueLineChart
                    data={getLiveRevenueTimeline()}
                    mode="revenue"
                    title="Consolidated Treasury Ledger"
                    description="Historical cashflows segmented into lease rental assets and ticket assets."
                    accentLabel="Reconciled"
                  />
                </div>
                <div>
                  <LeaseBarChart
                    data={[
                      { label: 'Workspace rent', value: revenueData?.bookingRevenue || 0, color: '#5B2EFF' },
                      { label: 'Ticket sales', value: revenueData?.ticketRevenue || 0, color: '#10B981' },
                    ]}
                    title="Revenue Asset Classes Comparison"
                    description="Direct comparison between workspace lease assets and event checkout assets."
                    primaryKey="value"
                    primaryLabel="Asset gross value"
                    unit="$"
                  />
                </div>
              </div>

              <PerformanceTable
                data={userData?.topUsers || []}
                columns={financeTableColumns}
                title="Top Contributing Corporate Members"
                subtitle="Ranking of users based on total booking invoices and contributed spend balance."
                searchPlaceholder="Search member accounts..."
                itemsPerPage={5}
                drillDownTitle={(row) => `${row.email} Member Ledger`}
                drillDownContent={(row) => (
                  <div className="space-y-4">
                    <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[10px] uppercase font-bold text-[#4B5563]">Total Contribution Value</p>
                      <p className="text-xl font-extrabold text-[#65A30D] mt-1">${row.totalSpent?.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">Total Leases Signed</p>
                        <p className="text-base font-extrabold mt-1 text-[#111827]">{row.bookingCount} leases</p>
                      </div>
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">Ledger Compliance</p>
                        <p className="text-xs font-bold mt-1 text-emerald-600">CLEAN RECONCILED</p>
                      </div>
                    </div>
                  </div>
                )}
              />
            </>
          )}

          {/* E. WORKSPACE PERSPECTIVE VIEW */}
          {activePerspective === 'workspace' && (
            <>
              <KpiCardsGrid items={getWorkspaceKpis()} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <LeaseBarChart
                    data={
                      bookingData?.bookingsBySpaceType?.map((item) => ({
                        label: item.spaceType === 'HOT_DESK' ? '💻 Hot Desk' : item.spaceType === 'MEETING_ROOM' ? '🤝 Meeting Room' : '🏢 Venue',
                        value: item.revenue,
                        color: item.spaceType === 'HOT_DESK' ? '#5B2EFF' : item.spaceType === 'MEETING_ROOM' ? '#10B981' : '#EC4899',
                      })) || []
                    }
                    title="Revenue Yield by Spatial Category"
                    description="Gross cashflow yields plotted per space classification."
                    primaryKey="value"
                    primaryLabel="Gross Yield ($)"
                    unit="$"
                  />
                </div>
                <div>
                  <DistributionPieChart
                    data={getLiveBookingsBySpaceType()}
                    title="Spatial Bookings Count Share"
                    description="Ratio of bookings completed by type."
                    centerLabel={`${bookingData?.totalBookings || 0}`}
                    centerSublabel="Leases"
                  />
                </div>
              </div>

              <PerformanceTable
                data={workspaceData?.topWorkspaces || []}
                columns={workspaceTableColumns}
                title="Spatial Operational Yield Index"
                subtitle="Occupancy density rankings based on hourly lease contracts."
                searchPlaceholder="Search spaces..."
                itemsPerPage={5}
                drillDownTitle={(row) => `${row.name} Operational Details`}
                drillDownContent={(row) => (
                  <div className="space-y-4">
                    <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[10px] uppercase font-bold text-[#4B5563]">Total Gross Spatial Yield</p>
                      <p className="text-xl font-extrabold text-[#65A30D] mt-1">${row.totalRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">Lease Contracts Completed</p>
                        <p className="text-base font-extrabold mt-1 text-[#111827]">{row.bookingCount} items</p>
                      </div>
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                        <p className="text-[9px] uppercase font-bold text-[#4B5563]">Design Class</p>
                        <p className="text-xs font-bold mt-1 truncate text-[#111827]">{row.type}</p>
                      </div>
                    </div>
                  </div>
                )}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
