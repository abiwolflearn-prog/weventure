import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';

import { store, useAppSelector } from './store';
import { queryClient } from './lib/queryClient';

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

/**
 * Access Guard to restrict access to authenticated members/admins
 */
function ProtectedRoute({ children, fallbackPath }: { children: React.ReactNode; fallbackPath?: string }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();
  
  if (!isAuthenticated) {
    if (fallbackPath) return <Navigate to={fallbackPath} replace />;
    if (location.pathname.startsWith('/superadmin')) return <Navigate to="/superadmin" replace />;
    if (location.pathname.startsWith('/admin')) return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
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
          <HashRouter>
            <Routes>
              {/* Public Marketing Layer */}
              <Route element={<PublicShell />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/events" element={<EventMarketplace />} />
                <Route path="/events/:slug" element={<EventDetailsPage />} />
                <Route path="/events/:slug/rsvp" element={<PublicRsvpPage />} />
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
          </HashRouter>
      </QueryClientProvider>
    </Provider>
  );
}

