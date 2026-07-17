import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import PricingPage from './views/PricingPage';
import ContactPage from './views/ContactPage';
import LoginPage from './views/LoginPage';
import RegisterPage from './views/RegisterPage';
import AcceptInvitePage from './views/AcceptInvitePage';
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

/**
 * Access Guard to restrict access to authenticated tenant members
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
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
              <Route path="/workspaces" element={<WorkspaceMarketplace />} />
              <Route path="/workspaces/:id" element={<WorkspaceDetailsPage />} />
              <Route path="/organizers/:id" element={<OrganizerProfilePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Authentication Layer */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/accept-invite" element={<AcceptInvitePage />} />
            </Route>

            {/* Restricted Operator Dashboard Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardSummary />} />
              <Route path="crm" element={<CrmDashboard />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="workspaces" element={<WorkspaceList />} />
              <Route path="bookings" element={<BookingList />} />
              <Route path="events" element={<EventsCatalog />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
            </Route>

            {/* Global Fallback Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </HashRouter>
      </QueryClientProvider>
    </Provider>
  );
}
