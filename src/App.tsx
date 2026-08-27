import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';

import { store, useAppSelector } from './store';
import { queryClient } from './lib/queryClient';

// Hash to clean path redirector helper
function HashRedirector() {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const targetPath = window.location.hash.substring(1);
      navigate(targetPath, { replace: true });
    }
  }, [navigate]);
  return null;
}

// Layout Shells
import PublicShell from './layouts/PublicShell';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// View Pages
import LandingPage from './views/LandingPage';
import EventMarketplace from './views/EventMarketplace';
import EventDetailsPage from './views/EventDetailsPage';
import WorkspaceMarketplace from './views/WorkspaceMarketplace';
import WorkspaceDetailsPage from './views/WorkspaceDetailsPage';
import OrganizerProfilePage from './views/OrganizerProfilePage';
import AboutPage from './views/AboutPage';
import StartupPage from './views/StartupPage';
import ContactPage from './views/ContactPage';
import GetStartedPage from './views/GetStartedPage';
import LoginPage from './views/LoginPage';
import AdminLoginPage from './views/AdminLoginPage';
import RegisterPage from './views/RegisterPage';
import AcceptInvitePage from './views/AcceptInvitePage';
import VerifyEmailPage from './views/VerifyEmailPage';
import DashboardSummary from './views/DashboardSummary';
import CrmDashboard from './views/CrmDashboard';
import WorkspaceList from './views/WorkspaceList';
import BookingList from './views/BookingList';
import EventsCatalog from './views/EventsCatalog';
import SettingsPage from './views/SettingsPage';
import OrganizationsPage from './views/OrganizationsPage';
import NotFoundPage from './views/NotFoundPage';
import CheckoutPage from './views/CheckoutPage';
import InvoicesPage from './views/InvoicesPage';
import QuotationsPage from './views/QuotationsPage';
import TransactionsPage from './views/TransactionsPage';
import AnnouncementsPage from './views/AnnouncementsPage';
import AnalyticsDashboard from './views/AnalyticsDashboard';
import ReportsPage from './views/ReportsPage';
import BillingPage from './views/BillingPage';
import IntegrationsPage from './views/IntegrationsPage';
import EmailCenterPage from './views/EmailCenterPage';
import StartupManagementPage from './views/StartupManagementPage';
import CompanyExpenses from './views/CompanyExpenses';
import AssistantAdminDashboard from './components/assistant/AssistantAdminDashboard';

import BookingRegistrationPage from './views/BookingRegistrationPage';
import CreateWorkspacePage from './views/CreateWorkspacePage';
import CreateEventPage from './views/CreateEventPage';
import PricingRulesPage from './views/PricingRulesPage';
import PublicRsvpPage from './views/PublicRsvpPage';
import PublicTicketPage from './views/PublicTicketPage';

import { UserRole } from './types';

/**
 * Access Guard to restrict access to authenticated members/admins
 */
function ProtectedRoute({ children, fallbackPath, requiredRole }: { children: React.ReactNode; fallbackPath?: string; requiredRole?: 'admin' | 'superadmin' }) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  
  if (!isAuthenticated || !user) {
    if (fallbackPath) return <Navigate to={fallbackPath} replace />;
    if (location.pathname.startsWith('/superadmin')) return <Navigate to="/superadmin" replace />;
    if (location.pathname.startsWith('/admin')) return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  const role = user.role;
  const isSuper = role === UserRole.SUPER_ADMIN;
  const isAdmin = isSuper || [
    UserRole.TENANT_ADMIN,
    UserRole.STAFF,
    UserRole.EVENT_MANAGER,
    UserRole.WORKSPACE_MANAGER,
    UserRole.FINANCE_OFFICER,
    UserRole.COMMUNITY_MANAGER,
    UserRole.MARKETING_OFFICER,
    UserRole.RECEPTION,
    UserRole.VOLUNTEER_COORDINATOR,
  ].includes(role);

  if (requiredRole === 'superadmin' || location.pathname.startsWith('/superadmin')) {
    if (!isSuper) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requiredRole === 'admin' || location.pathname.startsWith('/admin')) {
    if (!isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  const userDashboardRoutes = (
    <>
      <Route index element={<DashboardSummary />} />
      <Route path="crm" element={<CrmDashboard />} />
      <Route path="analytics" element={<AnalyticsDashboard />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="workspaces" element={<WorkspaceList />} />
      <Route path="workspaces/create" element={<CreateWorkspacePage />} />
      <Route path="workspaces/new" element={<CreateWorkspacePage />} />
      <Route path="bookings" element={<BookingList />} />
      <Route path="events" element={<EventsCatalog />} />
      <Route path="events/create" element={<CreateEventPage />} />
      <Route path="events/new" element={<CreateEventPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="pricing-rules" element={<PricingRulesPage />} />
      <Route path="organizations" element={<OrganizationsPage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="invoices" element={<InvoicesPage />} />
      <Route path="quotations" element={<QuotationsPage />} />
      <Route path="transactions" element={<TransactionsPage />} />
      <Route path="announcements" element={<AnnouncementsPage />} />
      <Route path="emails" element={<EmailCenterPage />} />
      <Route path="startups" element={<StartupManagementPage />} />
      <Route path="expenses" element={<CompanyExpenses />} />
    </>
  );

  const adminDashboardRoutes = (
    <>
      {userDashboardRoutes}
    </>
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <HashRedirector />
            <Routes>
              {/* Public Marketing Layer */}
              <Route element={<PublicShell />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/events" element={<EventMarketplace />} />
                <Route path="/events/:slug" element={<EventDetailsPage />} />
                <Route path="/events/:slug/rsvp" element={<PublicRsvpPage />} />
                <Route path="/event/:slug" element={<EventDetailsPage />} />
                <Route path="/event/:slug/rsvp" element={<PublicRsvpPage />} />
                <Route path="/workspaces" element={<WorkspaceMarketplace />} />
                <Route path="/workspaces/:id" element={<WorkspaceDetailsPage />} />
                <Route path="/organizers/:id" element={<OrganizerProfilePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/startup" element={<StartupPage />} />
                <Route path="/pricing" element={<StartupPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/get-started" element={<GetStartedPage />} />
                <Route path="/booking" element={<BookingRegistrationPage />} />
              </Route>

              {/* Standalone Secure Ticket View */}
              <Route path="/tickets/:id" element={<PublicTicketPage />} />

              {/* Authentication Layer - Separate Portals */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route path="/superadmin" element={<AdminLoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/accept-invite" element={<AcceptInvitePage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
              </Route>

              {/* User Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute fallbackPath="/login">
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {userDashboardRoutes}
              </Route>

              {/* Admin Portal Dashboard */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute fallbackPath="/admin">
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {adminDashboardRoutes}
              </Route>

              {/* Super Admin Portal Dashboard */}
              <Route
                path="/superadmin/dashboard"
                element={
                  <ProtectedRoute fallbackPath="/superadmin">
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {adminDashboardRoutes}
              </Route>

              {/* Global Fallback Route */}
              <Route path="/checkout" element={<Navigate to="/dashboard/checkout" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

