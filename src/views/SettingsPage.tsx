import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  CreditCard, 
  Percent, 
  Layers, 
  Calendar, 
  Sparkles, 
  Mail, 
  Users, 
  ShieldCheck, 
  Sliders,
  Search,
  CheckCircle2,
  ChevronRight,
  Settings as SettingsIcon,
  HelpCircle
} from 'lucide-react';
import { CompanyInfoTab } from '../components/settings/CompanyInfoTab';
import { DocumentsTab } from '../components/settings/DocumentsTab';
import { PaymentsBanksTab } from '../components/settings/PaymentsBanksTab';
import { TaxPricingTab } from '../components/settings/TaxPricingTab';
import { WorkspacesServicesTab } from '../components/settings/WorkspacesServicesTab';
import { BookingSettingsTab } from '../components/settings/BookingSettingsTab';
import { AmenitiesTab } from '../components/settings/AmenitiesTab';
import { EmailNotificationsTab } from '../components/settings/EmailNotificationsTab';
import { UsersRolesTab } from '../components/settings/UsersRolesTab';
import { SecurityTab } from '../components/settings/SecurityTab';
import { PlatformPreferencesTab } from '../components/settings/PlatformPreferencesTab';

export type SettingsTabId = 
  | 'company-info'
  | 'documents'
  | 'payments-banks'
  | 'tax-pricing'
  | 'workspaces-services'
  | 'booking'
  | 'amenities'
  | 'email-notifications'
  | 'users-roles'
  | 'security'
  | 'platform-preferences';

interface NavSection {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTINGS_TABS: NavSection[] = [
  {
    id: 'company-info',
    label: 'Company Information',
    description: 'Name, address, logo, TIN, VAT number & trade license',
    icon: Building2,
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Invoice, quotation & receipt serial prefixes & footers',
    icon: FileText,
  },
  {
    id: 'payments-banks',
    label: 'Payments & Banks',
    description: 'Official settlement bank accounts & checkouts',
    icon: CreditCard,
  },
  {
    id: 'tax-pricing',
    label: 'Tax & Pricing',
    description: '15% VAT rules, USD/ETB conversion & VAT statement',
    icon: Percent,
  },
  {
    id: 'workspaces-services',
    label: 'Workspaces & Services',
    description: 'Hot desks, dedicated desks, meeting rooms & event hall',
    icon: Layers,
  },
  {
    id: 'booking',
    label: 'Booking',
    description: 'Min duration, buffers, advance notice & cancellation',
    icon: Calendar,
  },
  {
    id: 'amenities',
    label: 'Amenities & Facilities',
    description: 'Included facilities, fiber internet & generator backup',
    icon: Sparkles,
  },
  {
    id: 'email-notifications',
    label: 'Email & Notifications',
    description: 'Automated receipt, booking & invoice email dispatches',
    icon: Mail,
  },
  {
    id: 'users-roles',
    label: 'Users & Roles',
    description: 'Super Admin, Finance Officer, Managers & Staff access',
    icon: Users,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Two-factor auth (OTP), sessions & password rules',
    icon: ShieldCheck,
  },
  {
    id: 'platform-preferences',
    label: 'Platform Preferences',
    description: 'Addis Ababa timezone, language, themes & date notation',
    icon: Sliders,
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('company-info');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const filteredTabs = SETTINGS_TABS.filter((tab) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tab.label.toLowerCase().includes(q) ||
      tab.description.toLowerCase().includes(q)
    );
  });

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'company-info':
        return <CompanyInfoTab onSuccessToast={showToast} />;
      case 'documents':
        return <DocumentsTab onSuccessToast={showToast} />;
      case 'payments-banks':
        return <PaymentsBanksTab onSuccessToast={showToast} />;
      case 'tax-pricing':
        return <TaxPricingTab onSuccessToast={showToast} />;
      case 'workspaces-services':
        return <WorkspacesServicesTab onSuccessToast={showToast} />;
      case 'booking':
        return <BookingSettingsTab onSuccessToast={showToast} />;
      case 'amenities':
        return <AmenitiesTab onSuccessToast={showToast} />;
      case 'email-notifications':
        return <EmailNotificationsTab onSuccessToast={showToast} />;
      case 'users-roles':
        return <UsersRolesTab onSuccessToast={showToast} />;
      case 'security':
        return <SecurityTab onSuccessToast={showToast} />;
      case 'platform-preferences':
        return <PlatformPreferencesTab onSuccessToast={showToast} />;
      default:
        return <CompanyInfoTab onSuccessToast={showToast} />;
    }
  };

  const currentTabMeta = SETTINGS_TABS.find((t) => t.id === activeTab) || SETTINGS_TABS[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 select-none">
            <span>Administration</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#65A30D]">Settings</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 dark:text-white">{currentTabMeta.label}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-medium">
            Manage your company, workspace, booking, quotation, invoice, payment, and platform preferences.
          </p>
        </div>

        {/* Global Settings Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search configuration..."
            className="w-full h-11 pl-10 pr-4 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16]/20 focus:border-[#84CC16] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Mobile Horizontal Pill Tabs */}
      <div className="lg:hidden flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-[#84CC16] text-[#111111] border-[#84CC16] shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-neutral-200 dark:border-slate-800 hover:bg-neutral-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Layout: Sidebar + Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-[20px] border border-neutral-200 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sticky top-6">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-neutral-100 dark:border-slate-800 mb-1">
            Configuration Categories
          </div>

          <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-[14px] transition-all ${
                    isActive
                      ? 'bg-[#84CC16]/10 text-slate-900 dark:text-white border border-[#84CC16]/40 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive
                        ? 'bg-[#84CC16] text-[#111111]'
                        : 'bg-neutral-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold truncate ${isActive ? 'text-slate-900 dark:text-white' : ''}`}>
                      {tab.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 mt-2 bg-neutral-50 dark:bg-slate-800/60 rounded-xl border border-neutral-200/60 dark:border-slate-800 text-[11px] text-slate-500 font-medium flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#84CC16] shrink-0" />
            <span>Single-tenant WeVentureHub enterprise configuration.</span>
          </div>
        </div>

        {/* Tab Content Display Area */}
        <div className="lg:col-span-8 xl:col-span-9">
          {renderActiveTabContent()}
        </div>
      </div>
    </div>
  );
}
