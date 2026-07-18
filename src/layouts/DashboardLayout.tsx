import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import WeVentureLogo from '../components/WeVentureLogo';
import { 
  Building, 
  LayoutDashboard, 
  CalendarRange, 
  Ticket, 
  Settings, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck,
  Sun,
  Moon,
  X,
  HelpCircle,
  TrendingUp,
  Receipt,
  BarChart3,
  FileSpreadsheet,
  Users,
  Cpu
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/authSlice';
import { toggleSidebar, toggleTheme } from '../store/uiSlice';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents imports
import Breadcrumbs from '../components/dashboard/Breadcrumbs';
import OrganizationSwitcher from '../components/dashboard/OrganizationSwitcher';
import NotificationPanel from '../components/dashboard/NotificationPanel';
import ProfileDropdown from '../components/dashboard/ProfileDropdown';
import { Permission, UserRole } from '../types';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: Permission;
}

// Derive permissions based on role if they aren't explicitly assigned
const getPermissionsForRole = (role?: UserRole): Permission[] => {
  if (!role) return [];
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return Object.values(Permission);
    case UserRole.TENANT_ADMIN:
      return [
        Permission.WORKSPACES_CREATE, Permission.WORKSPACES_READ, Permission.WORKSPACES_UPDATE, Permission.WORKSPACES_DELETE,
        Permission.BOOKINGS_CREATE, Permission.BOOKINGS_READ, Permission.BOOKINGS_UPDATE, Permission.BOOKINGS_DELETE,
        Permission.EVENTS_CREATE, Permission.EVENTS_READ, Permission.EVENTS_UPDATE, Permission.EVENTS_DELETE,
        Permission.ANALYTICS_READ, Permission.SETTINGS_UPDATE
      ];
    case UserRole.STAFF:
      return [
        Permission.WORKSPACES_READ, Permission.WORKSPACES_UPDATE,
        Permission.BOOKINGS_READ, Permission.BOOKINGS_UPDATE,
        Permission.EVENTS_READ, Permission.EVENTS_UPDATE,
        Permission.ANALYTICS_READ
      ];
    case UserRole.HUB_MEMBER:
    default:
      return [
        Permission.WORKSPACES_READ,
        Permission.BOOKINGS_CREATE, Permission.BOOKINGS_READ,
        Permission.EVENTS_READ,
        Permission.SETTINGS_UPDATE
      ];
  }
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarExpanded, theme } = useAppSelector((state) => state.ui);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'CRM & Contacts', path: '/dashboard/crm', icon: Users, requiredPermission: Permission.ANALYTICS_READ },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3, requiredPermission: Permission.ANALYTICS_READ },
    { name: 'Reports & Exports', path: '/dashboard/reports', icon: FileSpreadsheet, requiredPermission: Permission.ANALYTICS_READ },
    { name: 'Workspaces', path: '/dashboard/workspaces', icon: Building, requiredPermission: Permission.WORKSPACES_READ },
    { name: 'My Bookings', path: '/dashboard/bookings', icon: CalendarRange, requiredPermission: Permission.BOOKINGS_READ },
    { name: 'Events Catalog', path: '/dashboard/events', icon: Ticket, requiredPermission: Permission.EVENTS_READ },
    { name: 'Invoices', path: '/dashboard/invoices', icon: Receipt },
    { name: 'Ledger Logs', path: '/dashboard/transactions', icon: TrendingUp },
    { name: 'System Settings', path: '/dashboard/settings', icon: Settings, requiredPermission: Permission.SETTINGS_UPDATE },
    { name: 'Integrations & API', path: '/dashboard/integrations', icon: Cpu },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // RBAC Filtering of Sidebar Items
  const userPermissions = user?.permissions && user.permissions.length > 0 
    ? user.permissions 
    : getPermissionsForRole(user?.role);

  const filteredSidebarItems = sidebarItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return userPermissions.includes(item.requiredPermission);
  });

  const activeTenantName = user?.tenantId 
    ? user.tenantId.charAt(0).toUpperCase() + user.tenantId.slice(1) 
    : 'WeVentureHub';

  const sidebarBg = 'bg-[#0F172A] border-[#1E293B] text-slate-100';
  const navItemActive = 'bg-[#84CC16] text-[#111111] shadow-[0_4px_12px_rgba(132,204,22,0.25)] font-bold';
  const navItemHover = 'text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all duration-200';

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${theme === 'dark' ? 'bg-neutral-slate-950 text-white' : 'bg-neutral-slate-50 text-neutral-slate-900'}`}>
      
      {/* 1. Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col border-r shrink-0 transition-all duration-300 z-30 ${
          sidebarExpanded ? 'w-64' : 'w-20'
        } ${sidebarBg}`}
      >
        {/* Header Branding */}
        <div className="h-16 flex items-center justify-between px-4.5 border-b border-slate-800/60">
          <Link to="/dashboard" className="flex items-center space-x-3 overflow-hidden select-none">
            <WeVentureLogo size="24" mode="dark" className="shrink-0" />
            {sidebarExpanded && (
              <span className="font-display font-bold text-lg tracking-tight select-none whitespace-nowrap text-white">
                WeVenture<span className="text-[#84CC16]">Hub</span>
              </span>
            )}
          </Link>
          {sidebarExpanded && (
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-grow py-6 px-3 space-y-1.5 overflow-y-auto">
          {filteredSidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive ? navItemActive : navItemHover
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#111111]' : 'text-slate-400'}`} />
                {sidebarExpanded && <span className="text-sm select-none truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-800/60 space-y-3">
          {!sidebarExpanded && (
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="w-full flex items-center justify-center p-2.5 hover:bg-slate-800 rounded-xl transition"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          )}

          <div className={`flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'}`}>
            {sidebarExpanded && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium select-none">
                <ShieldCheck className="w-4 h-4 text-[#A3E635] animate-pulse" />
                <span>RBAC Secured</span>
              </div>
            )}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-white" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3.5 py-2.5 text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors ${
              sidebarExpanded ? 'space-x-3' : 'justify-center'
            }`}
            title="Sign out session"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarExpanded && <span className="text-sm font-bold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. Responsive Mobile Sidebar/Drawer (using Framer Motion) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />

            {/* Sidebar drawer block */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-72 z-50 md:hidden flex flex-col h-full shadow-2xl bg-[#0F172A] border-r border-[#1E293B]"
            >
              {/* Drawer header */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/60">
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3">
                  <WeVentureLogo size="24" mode="dark" className="shrink-0" />
                  <span className="font-display font-bold text-lg tracking-tight text-white">
                    WeVenture<span className="text-[#84CC16]">Hub</span>
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Drawer body nav links */}
              <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
                {filteredSidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all ${
                        isActive ? navItemActive : navItemHover
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#111111]' : 'text-slate-400'}`} />
                      <span className="text-sm font-bold">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer footer controls */}
              <div className="p-5 border-t border-slate-800/60 space-y-4 bg-slate-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold select-none">
                    <ShieldCheck className="w-4 h-4 text-[#A3E635] animate-pulse" />
                    <span>RBAC Secured Context</span>
                  </div>
                  <button
                    onClick={() => dispatch(toggleTheme())}
                    className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-white" />}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center space-x-3 py-3 text-sm font-bold text-rose-400 hover:bg-rose-950/20 border border-dashed border-rose-900/30 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Panel Frame */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className={`h-16 flex items-center justify-between px-4 md:px-6 border-b shrink-0 z-20 ${
          theme === 'dark' ? 'bg-neutral-slate-900 border-neutral-slate-800' : 'bg-white border-neutral-slate-200'
        }`}>
          {/* Left: Mobile Toggle & Tenant Context */}
          <div className="flex items-center space-x-3.5">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 hover:bg-neutral-slate-100 dark:hover:bg-neutral-slate-800 rounded-xl transition text-neutral-slate-500 hover:text-neutral-slate-900 dark:hover:text-white"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>

            {/* Reusable Organization Switcher */}
            <OrganizationSwitcher />
          </div>

          {/* Right: Notifications & ProfileDropdown */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {/* Live UTC indicator */}
            <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-slate-100 dark:bg-neutral-slate-800 border border-neutral-slate-200/50 dark:border-neutral-slate-700/50 rounded-xl text-[10px] font-mono text-neutral-slate-500 font-semibold select-none">
              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
              <span>UTC: 2026-06-30</span>
            </div>

            {/* Reusable Notification Panel with Alerts state */}
            <NotificationPanel />
            
            {/* Divider */}
            <span className="w-px h-6 bg-neutral-slate-200 dark:bg-neutral-slate-800 hidden sm:block" />

            {/* Reusable Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </header>

        {/* Viewport Content with transitions & Breadcrumbs header */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col space-y-4">
          
          {/* Breadcrumb row & Quick Help bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-slate-200/40 dark:border-neutral-slate-800/40 pb-3">
            <Breadcrumbs />
            <div className="flex items-center space-x-3 text-xs text-neutral-slate-400 select-none">
              <span className="hidden sm:inline">Role Authorization: <b>{user?.role || 'HUB_MEMBER'}</b></span>
              <HelpCircle className="w-3.5 h-3.5 text-neutral-slate-400 hover:text-brand-primary cursor-pointer transition-colors" title="Platform Help center" />
            </div>
          </div>

          {/* Main Outlet Render Frame */}
          <div className="flex-grow">
            <Outlet />
          </div>

          {/* Elegant Layout Footer */}
          <footer className="pt-8 pb-4 border-t border-neutral-slate-200/40 dark:border-neutral-slate-800/40 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-slate-400 gap-4 select-none">
            <p className="font-medium text-center md:text-left">
              &copy; 2026 WeVentureHub Inc. All rights reserved. Startup Ecosystem & Coworking Platform.
            </p>
            <div className="flex space-x-4 font-semibold text-neutral-slate-500 dark:text-neutral-slate-400">
              <a href="#/dashboard/settings" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#/dashboard/settings" className="hover:text-brand-primary transition-colors">Workspace Rules</a>
              <span>•</span>
              <a href="mailto:support@weventurehub.com" className="hover:text-brand-primary transition-colors">Contact Operator</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
