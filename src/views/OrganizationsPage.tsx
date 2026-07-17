import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  ShieldAlert, 
  Eye, 
  Edit3, 
  Trash2, 
  Ban, 
  RefreshCw, 
  Settings2, 
  Palette, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  Layers,
  History,
  X,
  FileText
} from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAppSelector } from '../store';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces mapping database/API formats
interface ITenant {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  settings: {
    language: string;
    timezone: string;
    currency: string;
  };
  branding: {
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    themeMode: 'light' | 'dark' | 'custom';
    emailBranding: {
      headerColor: string;
      footerText: string;
      supportEmail: string;
    };
    loginBranding: {
      title: string;
      subtitle: string;
      backgroundImageUrl?: string;
    };
  };
  subscription: {
    plan: 'FREE' | 'GROWTH' | 'ENTERPRISE';
    isTrial: boolean;
    expiresAt: string;
    limits: {
      maxWorkspaces: number;
      maxEvents: number;
      maxUsers: number;
    };
    featureFlags: Record<string, boolean>;
  };
  createdAt: string;
  updatedAt: string;
}

interface IAuditLog {
  id: string;
  action: string;
  userEmail: string;
  timestamp: string;
  details?: Record<string, any>;
}

export default function OrganizationsPage() {
  const { user } = useAppSelector((state) => state.auth);
  
  // State management
  const [organizations, setOrganizations] = useState<ITenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Active workspace / tenant details modal
  const [selectedTenant, setSelectedTenant] = useState<ITenant | null>(null);
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'branding' | 'subscription' | 'audit'>('details');

  // Form management modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states for creation
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPlan, setNewPlan] = useState<'FREE' | 'GROWTH' | 'ENTERPRISE'>('FREE');
  const [newMaxWorkspaces, setNewMaxWorkspaces] = useState(5);
  const [newMaxEvents, setNewMaxEvents] = useState(10);
  const [newMaxUsers, setNewMaxUsers] = useState(10);

  // Form states for editing
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPlan, setEditPlan] = useState<'FREE' | 'GROWTH' | 'ENTERPRISE'>('FREE');
  const [editMaxWorkspaces, setEditMaxWorkspaces] = useState(5);
  const [editMaxEvents, setEditMaxEvents] = useState(10);
  const [editMaxUsers, setEditMaxUsers] = useState(10);
  const [editPrimaryColor, setEditPrimaryColor] = useState('#0284c7');
  const [editSecondaryColor, setEditSecondaryColor] = useState('#0f172a');
  const [editTimezone, setEditTimezone] = useState('UTC');
  const [editCurrency, setEditCurrency] = useState('USD');

  // Load organizations
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(planFilter && { plan: planFilter }),
      });

      const res = await fetch(`/api/v1/organizations?${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load organization directory');
      }

      const body = await res.json();
      if (body.success) {
        setOrganizations(body.data);
        setTotalPages(body.pagination.totalPages);
        setTotalItems(body.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred fetching organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [page, searchTerm, statusFilter, planFilter]);

  // Load audit logs
  const fetchAuditLogs = async (tenantId: string) => {
    try {
      setAuditLoading(true);
      const res = await fetch(`/api/v1/organizations/${tenantId}/audit-logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setAuditLogs(body.data);
        }
      }
    } catch (err) {
      console.error('Audit logs error:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
        body: JSON.stringify({
          id: newId,
          name: newName,
          description: newDesc,
          subscription: {
            plan: newPlan,
            isTrial: newPlan !== 'ENTERPRISE',
            limits: {
              maxWorkspaces: newMaxWorkspaces,
              maxEvents: newMaxEvents,
              maxUsers: newMaxUsers,
            },
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create organization');

      showToast(`Organization "${newName}" registered successfully`);
      setIsCreateOpen(false);
      setNewId('');
      setNewName('');
      setNewDesc('');
      fetchOrganizations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditOpen = (tenant: ITenant) => {
    setSelectedTenant(tenant);
    setEditName(tenant.name);
    setEditDesc(tenant.description || '');
    setEditPlan(tenant.subscription.plan);
    setEditMaxWorkspaces(tenant.subscription.limits.maxWorkspaces);
    setEditMaxEvents(tenant.subscription.limits.maxEvents);
    setEditMaxUsers(tenant.subscription.limits.maxUsers);
    setEditPrimaryColor(tenant.branding.primaryColor);
    setEditSecondaryColor(tenant.branding.secondaryColor);
    setEditTimezone(tenant.settings.timezone);
    setEditCurrency(tenant.settings.currency);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    try {
      // 1. Update basic details
      let res = await fetch(`/api/v1/organizations/${selectedTenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
        }),
      });
      if (!res.ok) throw new Error('Failed to update organization profile');

      // 2. Update settings
      res = await fetch(`/api/v1/organizations/${selectedTenant.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
        body: JSON.stringify({
          timezone: editTimezone,
          currency: editCurrency,
        }),
      });
      if (!res.ok) throw new Error('Failed to update organization settings');

      // 3. Update branding
      res = await fetch(`/api/v1/organizations/${selectedTenant.id}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
        body: JSON.stringify({
          primaryColor: editPrimaryColor,
          secondaryColor: editSecondaryColor,
        }),
      });
      if (!res.ok) throw new Error('Failed to update organization branding');

      // 4. Update subscription
      res = await fetch(`/api/v1/organizations/${selectedTenant.id}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
        body: JSON.stringify({
          plan: editPlan,
          limits: {
            maxWorkspaces: editMaxWorkspaces,
            maxEvents: editMaxEvents,
            maxUsers: editMaxUsers,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to update organization subscription limits');

      showToast(`Organization "${editName}" updated successfully`);
      setIsEditOpen(false);
      setSelectedTenant(null);
      fetchOrganizations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (tenantId: string, action: 'suspend' | 'restore' | 'delete') => {
    let url = `/api/v1/organizations/${tenantId}`;
    let method = 'DELETE';

    if (action === 'suspend') {
      url = `/api/v1/organizations/${tenantId}/suspend`;
      method = 'POST';
    } else if (action === 'restore') {
      url = `/api/v1/organizations/${tenantId}/restore`;
      method = 'POST';
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}`,
        },
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || `Failed to ${action} organization`);
      }

      showToast(`Organization status changed: ${action.toUpperCase()}`);
      fetchOrganizations();
      if (selectedTenant && selectedTenant.id === tenantId) {
        const updated = await fetch(`/api/v1/organizations/${tenantId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('weventure_jwt_token')}` }
        }).then(r => r.json());
        if (updated.success) setSelectedTenant(updated.data);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openDetailsModal = (tenant: ITenant) => {
    setSelectedTenant(tenant);
    setActiveModalTab('details');
    fetchAuditLogs(tenant.id);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 p-4 bg-emerald-50/40 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold shadow-xl flex items-center space-x-2.5"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight flex items-center space-x-3 text-gray-900">
            <Layers className="w-7 h-7 text-brand-primary" />
            <span>Ecosystem Partner Management</span>
          </h1>
          <p className="text-sm text-neutral-slate-400 mt-1">
            Register and manage strategic corporate sponsors, startup incubatees, and regional ecosystem partners.
          </p>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center space-x-1.5 text-xs font-bold py-2.5 self-start sm:self-auto shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Register Partner</span>
        </Button>
      </div>

      {/* Analytics Counter Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 shadow-sm/80 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Total Active Partners</span>
          <span className="text-2xl font-display font-extrabold mt-1.5 block text-gray-900">{totalItems}</span>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm/80 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Corporate Tier Partners</span>
          <span className="text-2xl font-display font-extrabold mt-1.5 block text-brand-primary">
            {organizations.filter(o => o.subscription.plan === 'ENTERPRISE').length}
          </span>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm/80 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Accelerator Startups</span>
          <span className="text-2xl font-display font-extrabold mt-1.5 block text-amber-500">
            {organizations.filter(o => o.subscription.isTrial).length}
          </span>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm/80 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider block">Suspended Directory Lists</span>
          <span className="text-2xl font-display font-extrabold mt-1.5 block text-rose-500">
            {organizations.filter(o => o.status === 'SUSPENDED').length}
          </span>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-gray-200 shadow-sm p-4 rounded-2xl shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-slate-400" />
          <input
            type="text"
            placeholder="Search organizations by name or ID slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F9FAFB] border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-2 text-xs bg-[#F9FAFB] border border-gray-200 rounded-xl focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-2 text-xs bg-[#F9FAFB] border border-gray-200 rounded-xl focus:outline-hidden"
          >
            <option value="">All Plans</option>
            <option value="FREE">Free Plan</option>
            <option value="GROWTH">Growth Plan</option>
            <option value="ENTERPRISE">Enterprise Plan</option>
          </select>
        </div>
      </div>

      {/* Organizations Grid / List */}
      {loading ? (
        <div className="py-20 text-center text-sm text-neutral-slate-400 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-primary" />
          <span>Retrieving multi-tenant directories...</span>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-rose-500 bg-rose-50/50 bg-rose-50/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl flex flex-col items-center justify-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          <span className="font-semibold">{error}</span>
        </div>
      ) : organizations.length === 0 ? (
        <div className="py-20 text-center text-sm text-neutral-slate-400 bg-white border border-gray-200 shadow-sm/80 rounded-2xl">
          <Building2 className="w-12 h-12 text-neutral-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No organizations found</p>
          <p className="text-xs text-neutral-slate-400 mt-1">Try relaxing filters or provision a new SaaS tenant space.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB]/40 text-neutral-slate-500 border-b border-gray-200">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Organization Name / ID Slug</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Plan & Limits</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Localization</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-slate-100 divide-gray-200/80">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-neutral-slate-50/50 dark:hover:bg-neutral-slate-950/20 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">{org.name}</span>
                            <span className="text-[10px] font-mono text-neutral-slate-400 block mt-0.5">{org.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        {org.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 bg-emerald-50/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-md">
                            ACTIVE
                          </span>
                        ) : org.status === 'SUSPENDED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold bg-amber-50 text-amber-700 bg-amber-50/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-md">
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-md">
                            DELETED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5">
                        <div>
                          <span className="font-semibold text-xs text-gray-700 block">
                            {org.subscription.plan} {org.subscription.isTrial && <span className="text-[10px] text-amber-500 font-bold ml-1">(Trial)</span>}
                          </span>
                          <span className="text-[10px] text-neutral-slate-400 block mt-0.5">
                            Max: {org.subscription.limits.maxWorkspaces} Workspaces, {org.subscription.limits.maxUsers} Users
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="text-xs text-neutral-slate-600 dark:text-neutral-slate-400 space-y-0.5">
                          <span className="block font-medium">TZ: {org.settings.timezone}</span>
                          <span className="block text-[10px] font-mono">Currency: {org.settings.currency} ({org.settings.language})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openDetailsModal(org)}
                            className="p-1.5 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg text-neutral-slate-400 hover:text-neutral-slate-700  transition"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEditOpen(org)}
                            className="p-1.5 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg text-neutral-slate-400 hover:text-brand-primary transition"
                            title="Edit Settings"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {org.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleStatusChange(org.id, 'suspend')}
                              className="p-1.5 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg text-neutral-slate-400 hover:text-amber-500 transition"
                              title="Suspend Operations"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(org.id, 'restore')}
                              className="p-1.5 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg text-neutral-slate-400 hover:text-emerald-500 transition"
                              title="Restore Operations"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to soft-delete "${org.name}"?`)) {
                                handleStatusChange(org.id, 'delete');
                              }
                            }}
                            className="p-1.5 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg text-neutral-slate-400 hover:text-rose-500 transition"
                            title="Soft Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-5">
              <span className="text-xs text-neutral-slate-400">
                Showing organizations <b className="text-gray-700">{(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)}</b> of <b className="text-gray-700">{totalItems}</b>
              </span>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </Button>

                <div className="text-xs font-bold px-3">
                  {page} / {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROVISION TENANT MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-gray-200 shadow-sm rounded-2xl max-w-lg w-full p-6 shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-brand-primary" />
                  <span>Provision New Tenant Space</span>
                </h3>
                <button onClick={() => setIsCreateOpen(false)} className="p-1 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg">
                  <X className="w-5 h-5 text-neutral-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Slug ID (Unique String)"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. acme-labs"
                    required
                  />
                  <Input
                    label="Organization Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Acme Laboratories"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-slate-500">Corporate Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief outline of organization scope, facilities, or mission..."
                    className="w-full h-16 p-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-brand-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-slate-500">SaaS Subscription Tier</label>
                  <select
                    value={newPlan}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setNewPlan(val);
                      if (val === 'FREE') {
                        setNewMaxWorkspaces(5);
                        setNewMaxEvents(10);
                        setNewMaxUsers(10);
                      } else if (val === 'GROWTH') {
                        setNewMaxWorkspaces(20);
                        setNewMaxEvents(50);
                        setNewMaxUsers(50);
                      } else {
                        setNewMaxWorkspaces(100);
                        setNewMaxEvents(500);
                        setNewMaxUsers(1000);
                      }
                    }}
                    className="w-full p-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl focus:outline-hidden text-xs font-semibold"
                  >
                    <option value="FREE">Free Tier (Standard limits)</option>
                    <option value="GROWTH">Growth Plan (Expanded limits)</option>
                    <option value="ENTERPRISE">Enterprise Level (Unlimited potentials)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3 border border-gray-200 p-3 rounded-xl bg-[#F9FAFB]">
                  <Input
                    type="number"
                    label="Max Workspaces"
                    value={newMaxWorkspaces}
                    onChange={(e) => setNewMaxWorkspaces(Number(e.target.value))}
                    required
                  />
                  <Input
                    type="number"
                    label="Max Events"
                    value={newMaxEvents}
                    onChange={(e) => setNewMaxEvents(Number(e.target.value))}
                    required
                  />
                  <Input
                    type="number"
                    label="Max Members"
                    value={newMaxUsers}
                    onChange={(e) => setNewMaxUsers(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)} className="text-xs py-2">
                    Cancel
                  </Button>
                  <Button type="submit" className="text-xs py-2 px-5">
                    Create Tenant Space
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditOpen && selectedTenant && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsEditOpen(false); setSelectedTenant(null); }}
              className="fixed inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-gray-200 shadow-sm rounded-2xl max-w-lg w-full p-6 shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="font-display font-bold text-lg text-gray-900 flex items-center space-x-2">
                  <Settings2 className="w-5 h-5 text-brand-primary" />
                  <span>Edit SaaS Organization Settings</span>
                </h3>
                <button onClick={() => { setIsEditOpen(false); setSelectedTenant(null); }} className="p-1 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg">
                  <X className="w-5 h-5 text-neutral-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Organization Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                  <div>
                    <label className="text-xs text-neutral-slate-500 block mb-1">Timezone</label>
                    <select
                      value={editTimezone}
                      onChange={(e) => setEditTimezone(e.target.value)}
                      className="w-full p-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl focus:outline-hidden"
                    >
                      <option value="UTC">UTC (Universal)</option>
                      <option value="America/New_York">EST (New York)</option>
                      <option value="Europe/London">GMT (London)</option>
                      <option value="Europe/Paris">CET (Paris)</option>
                      <option value="Asia/Tokyo">JST (Tokyo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-slate-500 block mb-1">Currency Code</label>
                    <select
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                      className="w-full p-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl focus:outline-hidden"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-slate-500 block mb-1">Branding Primary Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editPrimaryColor}
                        onChange={(e) => setEditPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono">{editPrimaryColor}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-slate-500">Subscription Tier</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl focus:outline-hidden text-xs font-semibold"
                  >
                    <option value="FREE">Free Tier</option>
                    <option value="GROWTH">Growth Plan</option>
                    <option value="ENTERPRISE">Enterprise Level</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3 border border-gray-200 p-3 rounded-xl bg-[#F9FAFB]">
                  <Input
                    type="number"
                    label="Max Workspaces"
                    value={editMaxWorkspaces}
                    onChange={(e) => setEditMaxWorkspaces(Number(e.target.value))}
                    required
                  />
                  <Input
                    type="number"
                    label="Max Events"
                    value={editMaxEvents}
                    onChange={(e) => setEditMaxEvents(Number(e.target.value))}
                    required
                  />
                  <Input
                    type="number"
                    label="Max Users"
                    value={editMaxUsers}
                    onChange={(e) => setEditMaxUsers(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={() => { setIsEditOpen(false); setSelectedTenant(null); }} className="text-xs py-2">
                    Cancel
                  </Button>
                  <Button type="submit" className="text-xs py-2 px-5">
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INSPECT DETAILS MODAL */}
      <AnimatePresence>
        {selectedTenant && !isEditOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTenant(null)}
              className="fixed inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-gray-200 shadow-sm rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-900">
                      {selectedTenant.name}
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-slate-400">ID Slug: {selectedTenant.id}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedTenant(null)} className="p-1 hover:bg-neutral-slate-100 hover:bg-gray-150 rounded-lg">
                  <X className="w-5 h-5 text-neutral-slate-400" />
                </button>
              </div>

              {/* Modal Tabs navigation */}
              <div className="flex items-center space-x-1 border-b border-gray-200 pb-px">
                <button
                  onClick={() => setActiveModalTab('details')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeModalTab === 'details'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-neutral-slate-400 hover:text-neutral-slate-800 '
                  }`}
                >
                  General Profile
                </button>
                <button
                  onClick={() => setActiveModalTab('branding')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeModalTab === 'branding'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-neutral-slate-400 hover:text-neutral-slate-800 '
                  }`}
                >
                  Branding
                </button>
                <button
                  onClick={() => setActiveModalTab('subscription')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeModalTab === 'subscription'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-neutral-slate-400 hover:text-neutral-slate-800 '
                  }`}
                >
                  Subscription & Limits
                </button>
                <button
                  onClick={() => setActiveModalTab('audit')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeModalTab === 'audit'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-neutral-slate-400 hover:text-neutral-slate-800 '
                  }`}
                >
                  Audit Trails
                </button>
              </div>

              {/* Tabs viewports */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto text-xs pr-1 font-semibold">
                
                {activeModalTab === 'details' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-neutral-slate-400 block text-[10px] uppercase">Corporate Mission</span>
                        <p className="text-gray-800 mt-1">{selectedTenant.description || 'No description assigned yet.'}</p>
                      </div>
                      <div>
                        <span className="text-neutral-slate-400 block text-[10px] uppercase">Operational Status</span>
                        <p className="text-gray-800 mt-1 font-bold">{selectedTenant.status}</p>
                      </div>
                    </div>
                    <div className="space-y-3 bg-[#F9FAFB] p-4 rounded-xl border border-gray-200/60">
                      <div className="flex items-center space-x-2 text-neutral-slate-400 mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase">Localization Configurations</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-neutral-slate-400">Timezone:</span>
                          <span>{selectedTenant.settings.timezone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-slate-400">Billing Currency:</span>
                          <span>{selectedTenant.settings.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-slate-400">Interface Language:</span>
                          <span>{selectedTenant.settings.language}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeModalTab === 'branding' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-neutral-slate-400 block text-[10px] uppercase">Primary Color</span>
                        <div className="flex items-center space-x-2.5 mt-1">
                          <div className="w-5 h-5 rounded-md border border-neutral-slate-200" style={{ backgroundColor: selectedTenant.branding.primaryColor }} />
                          <span className="font-mono">{selectedTenant.branding.primaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-slate-400 block text-[10px] uppercase">Secondary Color</span>
                        <div className="flex items-center space-x-2.5 mt-1">
                          <div className="w-5 h-5 rounded-md border border-neutral-slate-200" style={{ backgroundColor: selectedTenant.branding.secondaryColor }} />
                          <span className="font-mono">{selectedTenant.branding.secondaryColor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 bg-[#F9FAFB] p-4 rounded-xl border border-gray-200/60">
                      <div className="flex items-center space-x-2 text-neutral-slate-400 mb-1">
                        <Palette className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase">Portal Customization</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-neutral-slate-400">Logo Url:</span>
                          <span className="truncate max-w-[150px] font-mono">{selectedTenant.branding.logoUrl || 'None'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-slate-400">Email Title:</span>
                          <span>{selectedTenant.branding.loginBranding.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-slate-400">Support Contact:</span>
                          <span>{selectedTenant.branding.emailBranding.supportEmail}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeModalTab === 'subscription' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-brand-primary" />
                        <div>
                          <span className="font-bold text-gray-800 block">SaaS Subscription Package</span>
                          <span className="text-[10px] text-neutral-slate-400 mt-0.5 block">Trial Period Active: {selectedTenant.subscription.isTrial ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                      <span className="px-3.5 py-1 text-xs font-black bg-brand-primary text-white rounded-lg">{selectedTenant.subscription.plan}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="border border-gray-200 p-3.5 rounded-xl bg-neutral-slate-50/50 bg-white/25">
                        <span className="text-[9px] text-neutral-slate-400 uppercase tracking-wider block">Workspace capacity</span>
                        <span className="text-lg font-bold block mt-1">{selectedTenant.subscription.limits.maxWorkspaces}</span>
                      </div>
                      <div className="border border-gray-200 p-3.5 rounded-xl bg-neutral-slate-50/50 bg-white/25">
                        <span className="text-[9px] text-neutral-slate-400 uppercase tracking-wider block">Max Event listings</span>
                        <span className="text-lg font-bold block mt-1">{selectedTenant.subscription.limits.maxEvents}</span>
                      </div>
                      <div className="border border-gray-200 p-3.5 rounded-xl bg-neutral-slate-50/50 bg-white/25">
                        <span className="text-[9px] text-neutral-slate-400 uppercase tracking-wider block">User registrations</span>
                        <span className="text-lg font-bold block mt-1">{selectedTenant.subscription.limits.maxUsers}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeModalTab === 'audit' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-neutral-slate-400 border-b border-gray-200 pb-1">
                      <History className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">Administrative Compliance Actions</span>
                    </div>

                    {auditLoading ? (
                      <div className="py-8 text-center text-neutral-slate-400">Loading audit history...</div>
                    ) : auditLogs.length === 0 ? (
                      <div className="py-8 text-center text-neutral-slate-400">No action logs found for this tenant space.</div>
                    ) : (
                      <div className="space-y-2.5">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="p-3 bg-[#F9FAFB] border border-gray-200 rounded-xl flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <span className="font-extrabold text-[10px] font-mono text-brand-primary block">{log.action}</span>
                              <span className="text-[11px] text-gray-600 block font-semibold">{log.userEmail}</span>
                            </div>
                            <span className="text-[10px] text-neutral-slate-400 shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <Button onClick={() => setSelectedTenant(null)} className="text-xs py-2 px-5 font-bold">
                  Close Inspect
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
