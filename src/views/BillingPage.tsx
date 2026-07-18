import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, Shield, Zap, CheckCircle2, AlertTriangle, HelpCircle, 
  Settings, Layers, RefreshCw, XCircle, Plus, Calendar, DollarSign,
  Info, Sparkles, Sliders, Users, FileText, Check, Database, Activity, Code, Trash2, Edit2
} from 'lucide-react';
import { billingApi, PlanPayload } from '../lib/billingApi';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { useAppSelector } from '../store';
import { UserRole } from '../types';

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<'dashboard' | 'plans' | 'features' | 'history'>('dashboard');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  
  // Custom Plan Modal States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({
    id: '',
    name: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    maxWorkspaces: 5,
    maxEvents: 10,
    maxUsers: 10,
    maxStorageMB: 1024,
    maxApiRequests: 10000,
    features: {} as Record<string, boolean>,
    isCustom: false,
    tenantId: '',
  });

  // Upgrade Plan Confirmation Modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Queries
  const { data: dashboard, isLoading: isDashboardLoading, isError: isDashboardError } = useQuery({
    queryKey: ['billingDashboard'],
    queryFn: () => billingApi.getBillingDashboard(),
  });

  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['billingPlans'],
    queryFn: () => billingApi.getPlans(),
  });

  const { data: featuresRegistry = [] } = useQuery({
    queryKey: ['featuresRegistry'],
    queryFn: () => billingApi.getFeatures(),
  });

  const { data: billingHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['billingHistory'],
    queryFn: () => billingApi.getBillingHistory(),
  });

  // Mutations
  const subscribeMutation = useMutation({
    mutationFn: (variables: { planId: string; billingInterval: 'monthly' | 'yearly' }) => 
      billingApi.subscribe(variables.planId, variables.billingInterval),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['billingHistory'] });
      setIsUpgradeModalOpen(false);
      setSelectedPlanForUpgrade(null);
      setErrorFeedback(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Upgrade/Downgrade failed';
      setErrorFeedback(msg);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => billingApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['billingHistory'] });
    }
  });

  const renewMutation = useMutation({
    mutationFn: () => billingApi.renewSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['billingHistory'] });
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: PlanPayload) => billingApi.createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingPlans'] });
      setIsPlanModalOpen(false);
      resetPlanForm();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || err?.message || 'Failed to create plan');
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: (variables: { id: string; payload: Partial<PlanPayload> }) => 
      billingApi.updatePlan(variables.id, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingPlans'] });
      setIsPlanModalOpen(false);
      resetPlanForm();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || err?.message || 'Failed to update plan');
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => billingApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingPlans'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || err?.message || 'Failed to delete plan');
    }
  });

  const overrideFeatureMutation = useMutation({
    mutationFn: (variables: { tenantId: string; overrides: Record<string, boolean> }) => 
      billingApi.updateFeatureOverrides(variables.tenantId, variables.overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingDashboard'] });
      alert('Feature flags overrides saved successfully!');
    }
  });

  const resetPlanForm = () => {
    setPlanForm({
      id: '',
      name: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      maxWorkspaces: 5,
      maxEvents: 10,
      maxUsers: 10,
      maxStorageMB: 1024,
      maxApiRequests: 10000,
      features: {},
      isCustom: false,
      tenantId: '',
    });
    setEditingPlan(null);
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      maxWorkspaces: plan.limits.maxWorkspaces,
      maxEvents: plan.limits.maxEvents,
      maxUsers: plan.limits.maxUsers,
      maxStorageMB: plan.limits.maxStorageMB || 1024,
      maxApiRequests: plan.limits.maxApiRequests || 10000,
      features: plan.featureFlags || {},
      isCustom: plan.isCustom || false,
      tenantId: plan.tenantId || '',
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PlanPayload = {
      id: planForm.id,
      name: planForm.name,
      description: planForm.description,
      priceMonthly: planForm.priceMonthly,
      priceYearly: planForm.priceYearly,
      limits: {
        maxWorkspaces: planForm.maxWorkspaces,
        maxEvents: planForm.maxEvents,
        maxUsers: planForm.maxUsers,
        maxStorageMB: planForm.maxStorageMB,
        maxApiRequests: planForm.maxApiRequests,
      },
      featureFlags: planForm.features,
      isCustom: planForm.isCustom,
      tenantId: planForm.tenantId || undefined,
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  };

  const handleFeatureToggle = (key: string) => {
    setPlanForm(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key]
      }
    }));
  };

  const triggerUpgradeConfirmation = (plan: any) => {
    setSelectedPlanForUpgrade(plan);
    setErrorFeedback(null);
    setIsUpgradeModalOpen(true);
  };

  const handleApplySubscription = () => {
    if (!selectedPlanForUpgrade) return;
    subscribeMutation.mutate({
      planId: selectedPlanForUpgrade.id,
      billingInterval
    });
  };

  const toggleFeatureOverride = (key: string, currentVal: boolean) => {
    if (!dashboard) return;
    const currentOverrides = { ...(dashboard.subscription.customFeatureFlags || {}) };
    currentOverrides[key] = !currentVal;
    
    overrideFeatureMutation.mutate({
      tenantId: dashboard.tenant.id,
      overrides: currentOverrides,
    });
  };

  // UI Helpers
  const formatBytes = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  if (isDashboardLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <RefreshCw className="w-10 h-10 text-[#84CC16] animate-spin" />
        <span className="text-xs text-[#4B5563] font-mono">Loading Subscription Panel...</span>
      </div>
    );
  }

  const sub = dashboard?.subscription;
  const usage = dashboard?.usage;

  return (
    <div className="space-y-6">
      {/* Upper Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#84CC16]" />
            <span>Subscription & Billing Control</span>
          </h1>
          <p className="text-xs text-[#4B5563] mt-1">
            Manage multi-tenant plans, active limits, workspace flags, overrides, and billing историю.
          </p>
        </div>

        {isSuperAdmin && (
          <Button 
            onClick={() => { resetPlanForm(); setIsPlanModalOpen(true); }}
            className="flex items-center gap-1 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Plan</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] gap-6 text-xs font-semibold overflow-x-auto select-none">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-[#84CC16] text-[#65A30D] font-bold' : 'border-transparent text-[#4B5563] hover:text-neutral-slate-600'}`}
        >
          Active Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('plans')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'plans' ? 'border-[#84CC16] text-[#65A30D] font-bold' : 'border-transparent text-[#4B5563] hover:text-neutral-slate-600'}`}
        >
          SaaS Plans & Upgrade
        </button>
        <button 
          onClick={() => setActiveTab('features')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'features' ? 'border-[#84CC16] text-[#65A30D] font-bold' : 'border-transparent text-[#4B5563] hover:text-neutral-slate-600'}`}
        >
          Feature Flag Overrides
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'history' ? 'border-[#84CC16] text-[#65A30D] font-bold' : 'border-transparent text-[#4B5563] hover:text-neutral-slate-600'}`}
        >
          Subscription Ledger ({billingHistory.length})
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* Active Plan Card */}
          <div className="bg-gradient-to-br from-brand-primary/10 via-transparent to-transparent border border-[#84CC16]/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Shield className="w-32 h-32 text-[#84CC16]" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#65A30D] bg-[#84CC16]/10 px-2.5 py-1 rounded-full">
                    Active Plan
                  </span>
                  {sub.isTrial && (
                    <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                      Free Trial Period
                    </span>
                  )}
                  {sub.isWithinGracePeriod && (
                    <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full animate-pulse">
                      Grace Period ({sub.gracePeriodDaysLeft} Days Remaining)
                    </span>
                  )}
                </div>
                <h2 className="font-display font-extrabold text-2xl tracking-tight capitalize text-[#111827]">
                  {sub.plan} Plan
                </h2>
                <div className="text-xs text-[#4B5563] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#4B5563]" />
                  <span>
                    Current cycle expires on <strong className="text-[#111827]">{new Date(sub.expiresAt).toLocaleDateString()}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {sub.plan !== 'FREE' ? (
                  <>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel your premium subscription? Your plan limits will be immediately scaled back to Free Starter level.')) {
                          cancelMutation.mutate();
                        }
                      }}
                      className="text-xs font-bold border-red-500/30 text-red-500 hover:bg-red-500/5"
                    >
                      Cancel Subscription
                    </Button>
                    <Button 
                      onClick={() => renewMutation.mutate()}
                      className="text-xs font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Renew Now</span>
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setActiveTab('plans')}
                    className="text-xs font-bold flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    <span>Upgrade Workspace</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Usage Limits Progression Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Workspaces Limit Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-500/10 text-sky-500 rounded-xl">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-[#111827]">Workspaces Limit</h3>
                    <p className="text-[10px] text-[#4B5563]">Total physical & desk spaces</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-extrabold text-[#4B5563]">
                  {usage.workspacesCount} / {sub.limits.maxWorkspaces}
                </span>
              </div>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${usage.workspacesCount >= sub.limits.maxWorkspaces ? 'bg-red-500' : 'bg-sky-500'}`}
                  style={{ width: `${Math.min(100, (usage.workspacesCount / sub.limits.maxWorkspaces) * 100)}%` }}
                />
              </div>
              {usage.workspacesCount >= sub.limits.maxWorkspaces && (
                <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Maximum workspace limit reached! Please upgrade to create more.</span>
                </div>
              )}
            </div>

            {/* Events Capacity Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-violet-500/10 text-violet-500 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-[#111827]">Events Capacity</h3>
                    <p className="text-[10px] text-[#4B5563]">Total active scheduler bookings</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-extrabold text-[#4B5563]">
                  {usage.eventsCount} / {sub.limits.maxEvents}
                </span>
              </div>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${usage.eventsCount >= sub.limits.maxEvents ? 'bg-red-500' : 'bg-violet-500'}`}
                  style={{ width: `${Math.min(100, (usage.eventsCount / sub.limits.maxEvents) * 100)}%` }}
                />
              </div>
              {usage.eventsCount >= sub.limits.maxEvents && (
                <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Event creation limits exhausted.</span>
                </div>
              )}
            </div>

            {/* User Seats Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-[#111827]">Team Seat Limits</h3>
                    <p className="text-[10px] text-[#4B5563]">Administrative workspace staff members</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-extrabold text-[#4B5563]">
                  {usage.usersCount} / {sub.limits.maxUsers}
                </span>
              </div>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${usage.usersCount >= sub.limits.maxUsers ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (usage.usersCount / sub.limits.maxUsers) * 100)}%` }}
                />
              </div>
            </div>

            {/* Storage Metric Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-[#111827]">Storage Allocated</h3>
                    <p className="text-[10px] text-[#4B5563]">Media, invoices, & document storage</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-extrabold text-[#4B5563]">
                  {formatBytes(usage.storageUsageMB)} / {formatBytes(sub.limits.maxStorageMB || 1024)}
                </span>
              </div>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (usage.storageUsageMB / (sub.limits.maxStorageMB || 1024)) * 100)}%` }}
                />
              </div>
            </div>

            {/* API Requests Limit Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-pink-500/10 text-pink-500 rounded-xl">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-[#111827]">API Requests Usage</h3>
                    <p className="text-[10px] text-[#4B5563]">Request counts in current cycle</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-extrabold text-[#4B5563]">
                  {usage.apiUsageCount.toLocaleString()} / {(sub.limits.maxApiRequests || 10000).toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (usage.apiUsageCount / (sub.limits.maxApiRequests || 10000)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SaaS Plans Compare & Select */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Interval Toggle */}
          <div className="flex items-center justify-center">
            <div className="bg-[#F3F4F6] border border-[#E5E7EB] p-1 rounded-2xl flex gap-1 select-none text-[11px] font-bold">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-1.5 rounded-xl transition ${billingInterval === 'monthly' ? 'bg-[#84CC16] text-[#111111] shadow-xs' : 'text-[#4B5563] hover:text-neutral-slate-600'}`}
              >
                Monthly Interval
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-4 py-1.5 rounded-xl transition flex items-center gap-1 ${billingInterval === 'yearly' ? 'bg-[#84CC16] text-[#111111] shadow-xs' : 'text-[#4B5563] hover:text-neutral-slate-600'}`}
              >
                <span>Yearly Interval</span>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-500 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-extrabold">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p: any) => {
              const isCurrent = dashboard?.subscription?.plan.toLowerCase() === p.id.toLowerCase();
              const price = billingInterval === 'yearly' ? p.priceYearly : p.priceMonthly;
              const formattedPrice = price === 0 ? 'Free' : `$${price}`;
              const intervalText = billingInterval === 'yearly' ? '/year' : '/month';

              return (
                <div 
                  key={p.id} 
                  className={`bg-white border border-[#E5E7EB] p-6 flex flex-col justify-between transition relative overflow-hidden ${
                    isCurrent 
                      ? 'ring-2 ring-brand-primary border-transparent' 
                      : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-[#84CC16] text-[#111111] text-[9px] font-extrabold uppercase px-3.5 py-1 rounded-bl-2xl">
                      Current Active Plan
                    </div>
                  )}

                  {p.isCustom && (
                    <div className="absolute top-0 left-0 bg-yellow-500/15 text-yellow-600 dark:text-yellow-300 text-[9px] font-extrabold uppercase px-3.5 py-1 rounded-br-2xl border-b border-r border-yellow-500/25">
                      Custom Corporate Plan
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-[#111827] capitalize">
                        {p.name}
                      </h3>
                      <p className="text-xs text-[#4B5563] mt-1 min-h-[36px]">{p.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-extrabold text-3xl tracking-tight text-[#111827]">
                        {formattedPrice}
                      </span>
                      {price > 0 && <span className="text-xs text-[#4B5563]">{intervalText}</span>}
                    </div>

                    <hr className="border-[#E5E7EB]" />

                    <ul className="space-y-2.5 text-xs">
                      <li className="flex items-center gap-2 text-[#4B5563]">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Up to <strong>{p.limits.maxWorkspaces}</strong> workspaces</span>
                      </li>
                      <li className="flex items-center gap-2 text-[#4B5563]">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Up to <strong>{p.limits.maxEvents}</strong> active scheduler events</span>
                      </li>
                      <li className="flex items-center gap-2 text-[#4B5563]">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Up to <strong>{p.limits.maxUsers}</strong> team user seats</span>
                      </li>
                      <li className="flex items-center gap-2 text-[#4B5563]">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span><strong>{formatBytes(p.limits.maxStorageMB)}</strong> durable media storage</span>
                      </li>
                      <li className="flex items-center gap-2 text-[#4B5563]">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span><strong>{p.limits.maxApiRequests.toLocaleString()}</strong> request allocations / cycle</span>
                      </li>
                    </ul>

                    <hr className="border-[#E5E7EB]" />

                    {/* Features checklist */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider select-none">Included Features:</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {featuresRegistry.map((feat: any) => {
                          const hasFeat = !!p.featureFlags[feat.key];
                          return (
                            <div key={feat.key} className="flex items-center gap-2 text-[11px]">
                              {hasFeat ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-neutral-slate-300 dark:text-neutral-700" />
                              )}
                              <span className={hasFeat ? 'text-[#111827]' : 'text-[#4B5563] line-through decoration-neutral-slate-300'}>
                                {feat.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-2 space-y-2">
                    <Button 
                      className="w-full text-xs font-semibold"
                      variant={isCurrent ? 'secondary' : 'primary'}
                      onClick={() => !isCurrent && triggerUpgradeConfirmation(p)}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Active Plan' : 'Select Plan'}
                    </Button>

                    {isSuperAdmin && (
                      <div className="flex gap-2 justify-end pt-2">
                        <button 
                          onClick={() => handleEditPlan(p)}
                          className="p-1.5 text-[#4B5563] hover:text-[#65A30D] hover:bg-[#84CC16]/5 rounded-lg transition"
                          title="Edit plan configuration"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to permanently delete '${p.name}'?`)) {
                              deletePlanMutation.mutate(p.id);
                            }
                          }}
                          className="p-1.5 text-[#4B5563] hover:text-red-500 hover:bg-red-500/5 rounded-lg transition"
                          title="Delete custom plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature Flags Overrides center */}
      {activeTab === 'features' && dashboard && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-extrabold text-base tracking-tight flex items-center gap-1.5">
                  <Sliders className="w-5 h-5 text-[#84CC16]" />
                  <span>Tenant Feature Gates & Overrides</span>
                </h3>
                <p className="text-xs text-[#4B5563] mt-1">
                  Feature flags dynamically control platform logic. Super-Admins can apply custom overrides.
                </p>
              </div>

              {isSuperAdmin && (
                <span className="text-[10px] bg-[#84CC16]/10 text-[#65A30D] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider select-none flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Super Admin Mode Enabled</span>
                </span>
              )}
            </div>

            <hr className="border-[#E5E7EB]" />

            {/* Features Override Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {featuresRegistry.map((def: any) => {
                const isOverridden = dashboard.subscription.customFeatureFlags && 
                  (dashboard.subscription.customFeatureFlags[def.key] !== undefined || 
                   dashboard.subscription.customFeatureFlags instanceof Map && dashboard.subscription.customFeatureFlags.get(def.key) !== undefined);
                
                // Get override value
                let overrideVal = false;
                if (dashboard.subscription.customFeatureFlags) {
                  if (typeof dashboard.subscription.customFeatureFlags.get === 'function') {
                    overrideVal = !!dashboard.subscription.customFeatureFlags.get(def.key);
                  } else {
                    overrideVal = !!dashboard.subscription.customFeatureFlags[def.key];
                  }
                }

                const resolvedVal = !!sub.resolvedFeatureFlags[def.key];

                return (
                  <div 
                    key={def.key} 
                    className="border border-[#E5E7EB] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:shadow-xs transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#111827]">{def.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${resolvedVal ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {resolvedVal ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed">{def.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[#4B5563]">Key: {def.key}</span>
                      </div>

                      {isSuperAdmin ? (
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[10px] text-[#4B5563] font-bold">Override:</span>
                          <button
                            onClick={() => toggleFeatureOverride(def.key, overrideVal)}
                            className={`w-9 h-5 rounded-full transition-all relative outline-hidden ${overrideVal ? 'bg-[#84CC16]' : 'bg-[#E5E7EB]'}`}
                          >
                            <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${overrideVal ? 'left-4.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[#4B5563]">
                          <Info className="w-3.5 h-3.5" />
                          <span>Determined by standard active plan</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Ledger tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[#E5E7EB]">
              <h3 className="font-display font-extrabold text-sm tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#84CC16]" />
                <span>Historic Billing Ledger & Invoices</span>
              </h3>
            </div>

            {isHistoryLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="w-8 h-8 text-[#84CC16] animate-spin" />
                <span className="text-xs text-[#4B5563] font-mono">Retrieving billing invoices...</span>
              </div>
            ) : billingHistory.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <FileText className="w-10 h-10 text-neutral-slate-300 mx-auto" />
                <h4 className="font-bold text-xs text-gray-800">No ledger invoices discovered</h4>
                <p className="text-[11px] text-[#4B5563] max-w-xs mx-auto">
                  Subscription plan upgrades, renewals, and periodic platform cycles will automatically generate billing details.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] font-extrabold uppercase tracking-wider text-[10px] select-none">
                      <th className="py-4 px-6">Invoice Number</th>
                      <th className="py-4 px-6">Billing Contact</th>
                      <th className="py-4 px-6">Date Generated</th>
                      <th className="py-4 px-6">Plan Description</th>
                      <th className="py-4 px-6">Amount Paid</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((invoice: any) => (
                      <tr 
                        key={invoice.id}
                        className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-all"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-[#111827] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#84CC16]" />
                          <span>{invoice.invoiceNumber}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#111827]">{invoice.billingDetails?.name}</div>
                          <div className="text-[10px] text-[#4B5563] font-mono mt-0.5">{invoice.billingDetails?.email}</div>
                        </td>
                        <td className="py-4 px-6 text-[#4B5563] font-medium">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-[#4B5563] font-medium">
                          {invoice.lineItems?.[0]?.description || 'Corporate Subscription Plan Upgrade'}
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-900">
                          ${invoice.amount.toFixed(2)} {invoice.currency || 'USD'}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full border bg-emerald-500/15 text-emerald-500 border-emerald-500/25">
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Upgrade Plan Confirmation Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Confirm Plan Change"
      >
        {selectedPlanForUpgrade && (
          <div className="space-y-4 pt-1">
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-4.5 rounded-2xl space-y-2">
              <span className="text-[9px] uppercase font-bold text-[#65A30D] bg-[#84CC16]/10 px-2 py-0.5 rounded-md">
                Proposed Workspace Tier
              </span>
              <h4 className="font-display font-extrabold text-sm capitalize text-[#111827]">{selectedPlanForUpgrade.name}</h4>
              <p className="text-xs text-[#4B5563]">{selectedPlanForUpgrade.description}</p>
              
              <div className="pt-2 border-t border-[#E5E7EB] flex items-baseline gap-1">
                <span className="font-display font-extrabold text-2xl text-[#111827]">
                  ${billingInterval === 'yearly' ? selectedPlanForUpgrade.priceYearly : selectedPlanForUpgrade.priceMonthly}
                </span>
                <span className="text-xs text-[#4B5563]">/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
              </div>
            </div>

            {errorFeedback && (
              <div className="bg-red-500/10 border border-red-500/25 p-3.5 rounded-2xl flex gap-2 text-xs text-red-500 font-medium">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{errorFeedback}</span>
              </div>
            )}

            <p className="text-[11px] text-[#4B5563] text-center">
              Your billing ledger will immediately log a paid invoice. Upgrading or switching plans re-calculates quotas instantly.
            </p>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="secondary" 
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-full text-xs"
              >
                Go Back
              </Button>
              <Button 
                onClick={handleApplySubscription}
                className="w-full text-xs font-bold"
                disabled={subscribeMutation.isPending}
              >
                {subscribeMutation.isPending ? 'Processing...' : 'Confirm Subscription'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. Custom Plan CRUD Creation Form Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? 'Edit Pricing Plan' : 'Create Custom Enterprise Plan'}
      >
        <form onSubmit={handleSavePlan} className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unique Plan slug (id)"
              value={planForm.id}
              onChange={(e) => setPlanForm({ ...planForm, id: e.target.value })}
              placeholder="e.g. mega-corp"
              required
              disabled={!!editingPlan}
            />
            <Input
              label="Plan Name"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. Mega Corporation"
              required
            />
          </div>

          <Input
            label="Plan Description"
            value={planForm.description}
            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
            placeholder="Brief explanation of the plan limitations..."
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monthly Price ($)"
              type="number"
              value={planForm.priceMonthly}
              onChange={(e) => setPlanForm({ ...planForm, priceMonthly: Number(e.target.value) })}
              required
              min={0}
            />
            <Input
              label="Yearly Price ($)"
              type="number"
              value={planForm.priceYearly}
              onChange={(e) => setPlanForm({ ...planForm, priceYearly: Number(e.target.value) })}
              required
              min={0}
            />
          </div>

          <div className="border border-[#E5E7EB] rounded-2xl p-4.5 space-y-3.5 bg-[#F9FAFB]">
            <h4 className="font-bold text-[11px] text-[#4B5563] uppercase tracking-wider select-none">Capacity Quotas & Limits</h4>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#4B5563] text-[10px] font-bold mb-1">Max Workspaces</label>
                <input
                  type="number"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#111827]"
                  value={planForm.maxWorkspaces}
                  onChange={(e) => setPlanForm({ ...planForm, maxWorkspaces: Number(e.target.value) })}
                  min={1}
                />
              </div>

              <div>
                <label className="block text-[#4B5563] text-[10px] font-bold mb-1">Max Events</label>
                <input
                  type="number"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#111827]"
                  value={planForm.maxEvents}
                  onChange={(e) => setPlanForm({ ...planForm, maxEvents: Number(e.target.value) })}
                  min={1}
                />
              </div>

              <div>
                <label className="block text-[#4B5563] text-[10px] font-bold mb-1">Max Users</label>
                <input
                  type="number"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#111827]"
                  value={planForm.maxUsers}
                  onChange={(e) => setPlanForm({ ...planForm, maxUsers: Number(e.target.value) })}
                  min={1}
                />
              </div>

              <div>
                <label className="block text-[#4B5563] text-[10px] font-bold mb-1">Max Storage (MB)</label>
                <input
                  type="number"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#111827]"
                  value={planForm.maxStorageMB}
                  onChange={(e) => setPlanForm({ ...planForm, maxStorageMB: Number(e.target.value) })}
                  min={1}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[#4B5563] text-[10px] font-bold mb-1">API Requests per month</label>
                <input
                  type="number"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#111827]"
                  value={planForm.maxApiRequests}
                  onChange={(e) => setPlanForm({ ...planForm, maxApiRequests: Number(e.target.value) })}
                  min={100}
                />
              </div>
            </div>
          </div>

          <div className="border border-[#E5E7EB] rounded-2xl p-4.5 space-y-3.5 bg-[#F9FAFB]">
            <h4 className="font-bold text-[11px] text-[#4B5563] uppercase tracking-wider select-none">Default Feature Flags</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {featuresRegistry.map((feat: any) => {
                const isActive = !!planForm.features[feat.key];
                return (
                  <label key={feat.key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#84CC16] focus:ring-brand-primary border-neutral-slate-300 border-gray-200 rounded-sm"
                      checked={isActive}
                      onChange={() => handleFeatureToggle(feat.key)}
                    />
                    <div>
                      <span className="font-semibold">{feat.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border border-[#E5E7EB] rounded-2xl p-4.5 space-y-3.5 bg-[#F9FAFB]">
            <h4 className="font-bold text-[11px] text-[#4B5563] uppercase tracking-wider select-none font-sans">Tenant Binding (Custom Plans Only)</h4>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 select-none cursor-pointer">
                <input 
                  type="checkbox"
                  checked={planForm.isCustom}
                  onChange={(e) => setPlanForm({ ...planForm, isCustom: e.target.checked })}
                  className="w-4 h-4 rounded-sm"
                />
                <span>Plan is custom/private deal</span>
              </label>

              {planForm.isCustom && (
                <div className="flex-1">
                  <input
                    type="text"
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs"
                    value={planForm.tenantId}
                    onChange={(e) => setPlanForm({ ...planForm, tenantId: e.target.value })}
                    placeholder="Tenant ID/Slug, e.g. weventurehub"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => { setIsPlanModalOpen(false); resetPlanForm(); }}
              className="w-full text-xs"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="w-full text-xs font-bold"
              disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
            >
              {createPlanMutation.isPending || updatePlanMutation.isPending ? 'Saving...' : 'Save Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
