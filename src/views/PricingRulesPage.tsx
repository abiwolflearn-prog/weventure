import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  XCircle, 
  SlidersHorizontal,
  Layers,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { pricingApi, IPricingRule } from '../lib/pricingApi';
import { Table, IColumn } from '../components/Table';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export default function PricingRulesPage() {
  const queryClient = useQueryClient();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<IPricingRule | null>(null);
  
  // Tab states: ALL, WORKSPACE, EVENT_SPACE, TRAINING_ROOM, MEETING_ROOM
  const [activeTab, setActiveTab] = useState<'ALL' | 'Workspace Membership' | 'Event Space' | 'Training Room' | 'Meeting Room'>('ALL');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [resourceType, setResourceType] = useState('Workspace Membership');
  const [resourceName, setResourceName] = useState('');
  const [billingCycle, setBillingCycle] = useState('Hourly');
  const [minimumDuration, setMinimumDuration] = useState('0');
  const [maximumDuration, setMaximumDuration] = useState('999999');
  const [basePrice, setBasePrice] = useState('0');
  const [vatPercentage, setVatPercentage] = useState('15');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: rulesResponse, isLoading, refetch } = useQuery({
    queryKey: ['pricingRules'],
    queryFn: async () => {
      return await pricingApi.getRules();
    }
  });

  const rules: IPricingRule[] = rulesResponse?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: IPricingRule) => {
      return await pricingApi.createRule(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
      setIsFormModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || err.message || 'Failed to create pricing rule');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<IPricingRule> }) => {
      return await pricingApi.updateRule(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
      setIsFormModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || err.message || 'Failed to update pricing rule');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await pricingApi.deleteRule(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to delete pricing rule');
    }
  });

  // Toggle dynamic active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, currentActive }: { id: string; currentActive: boolean }) => {
      return await pricingApi.updateRule(id, { isActive: !currentActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
    }
  });

  // Actions
  const resetForm = () => {
    setEditingRule(null);
    setResourceType('Workspace Membership');
    setResourceName('');
    setBillingCycle('Hourly');
    setMinimumDuration('0');
    setMaximumDuration('999999');
    setBasePrice('0');
    setVatPercentage('15');
    setEffectiveFrom('');
    setEffectiveTo('');
    setIsActive(true);
    setFormError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (rule: IPricingRule) => {
    setEditingRule(rule);
    setResourceType(rule.resourceType);
    setResourceName(rule.resourceName);
    setBillingCycle(rule.billingCycle);
    setMinimumDuration(rule.minimumDuration.toString());
    setMaximumDuration(rule.maximumDuration.toString());
    setBasePrice(rule.basePrice.toString());
    setVatPercentage(rule.vatPercentage.toString());
    setEffectiveFrom(rule.effectiveFrom ? new Date(rule.effectiveFrom).toISOString().split('T')[0] : '');
    setEffectiveTo(rule.effectiveTo ? new Date(rule.effectiveTo).toISOString().split('T')[0] : '');
    setIsActive(rule.isActive);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm('Are you absolutely sure you want to delete this pricing rule?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (rule: IPricingRule) => {
    if (rule.id) {
      toggleActiveMutation.mutate({ id: rule.id, currentActive: rule.isActive });
    } else if (rule._id) {
      toggleActiveMutation.mutate({ id: rule._id, currentActive: rule.isActive });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const bp = parseFloat(basePrice);
    const vat = parseFloat(vatPercentage);
    if (isNaN(bp) || bp < 0) {
      setFormError('Base price must be a positive number');
      return;
    }
    if (isNaN(vat) || vat < 0 || vat > 100) {
      setFormError('VAT percentage must be between 0 and 100');
      return;
    }

    const calculatedTotal = bp + (bp * vat) / 100;

    const payload: IPricingRule = {
      resourceType,
      resourceName: resourceName.trim(),
      billingCycle,
      minimumDuration: parseInt(minimumDuration) || 0,
      maximumDuration: parseInt(maximumDuration) || 999999,
      basePrice: bp,
      vatPercentage: vat,
      totalPrice: Math.round(calculatedTotal * 100) / 100,
      currency: 'USD',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : undefined,
      isActive,
    };

    if (editingRule) {
      const id = editingRule.id || editingRule._id;
      if (id) {
        updateMutation.mutate({ id, payload });
      }
    } else {
      createMutation.mutate(payload);
    }
  };

  // Helper live total price calculation inside modal
  const liveBase = parseFloat(basePrice) || 0;
  const liveVat = parseFloat(vatPercentage) || 0;
  const liveTotal = liveBase + (liveBase * liveVat) / 100;

  // Filters
  const filteredRules = rules.filter(r => {
    const matchesTab = activeTab === 'ALL' || r.resourceType === activeTab;
    const matchesSearch = 
      r.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.resourceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.billingCycle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Table Columns
  const columns: IColumn<IPricingRule>[] = [
    {
      header: 'Resource Category',
      accessor: 'resourceType',
      render: (row) => (
        <span className="text-[12px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-[6px] font-bold uppercase tracking-wider">
          {row.resourceType}
        </span>
      ),
    },
    {
      header: 'Specific Resource / Service',
      accessor: 'resourceName',
      render: (row) => (
        <span className="font-bold text-[#111827] text-[13px]">{row.resourceName}</span>
      ),
    },
    {
      header: 'Billing Cycle',
      accessor: 'billingCycle',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-[13px]">{row.billingCycle}</span>
        </div>
      ),
    },
    {
      header: 'Validity Threshold',
      accessor: 'minimumDuration',
      render: (row) => (
        <span className="text-[12px] text-slate-500 font-medium">
          {row.minimumDuration} - {row.maximumDuration === 999999 ? '∞' : row.maximumDuration} Hours
        </span>
      ),
    },
    {
      header: 'Base Price',
      accessor: 'basePrice',
      render: (row) => (
        <span className="font-mono text-[#111827] font-bold text-[13px]">
          {row.currency} {row.basePrice.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'VAT Rate',
      accessor: 'vatPercentage',
      render: (row) => (
        <span className="text-slate-500 font-bold text-[12px]">
          {row.vatPercentage}%
        </span>
      ),
    },
    {
      header: 'Grand Total',
      accessor: 'totalPrice',
      render: (row) => (
        <span className="font-mono text-[#65A30D] font-bold text-[14px]">
          {row.currency} {row.totalPrice.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'State',
      accessor: 'isActive',
      render: (row) => (
        <button
          onClick={() => handleToggleActive(row)}
          className="transition-opacity hover:opacity-85"
          title={row.isActive ? 'Disable Rule' : 'Enable Rule'}
        >
          {row.isActive ? (
            <div className="flex items-center text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </div>
          ) : (
            <div className="flex items-center text-slate-400 font-bold text-xs bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <XCircle className="w-3 h-3 mr-1" /> Disabled
            </div>
          )}
        </button>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => {
        const id = row.id || row._id;
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 bg-[#FFFFFF] border border-gray-200 text-slate-600 hover:text-[#84CC16] rounded-md transition-colors"
              title="Edit pricing plan parameters"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => id && handleDeleteRule(id)}
              className="p-1.5 bg-[#FFFFFF] border border-gray-200 text-slate-600 hover:text-rose-600 rounded-md transition-colors"
              title="Permanently remove pricing rule"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#111827] flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#84CC16]" />
            Dynamic Pricing & VAT Configuration Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define, schedule, and maintain automatic pricing tiers, tax metrics, and dynamic workspace duration rates for WeVentureHub.
          </p>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold text-[13px] px-4.5 py-2.5 rounded-[8px] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Pricing Rule
        </Button>
      </div>

      {/* Overview Statistics Widget */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-[16px] border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-[#84CC16]/10 text-[#65A30D] rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Rules Configured</p>
            <h3 className="text-xl font-bold font-mono text-[#111827] mt-0.5">{rules.length}</h3>
          </div>
        </div>
        <div className="p-4 bg-white rounded-[16px] border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Policy Rules</p>
            <h3 className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
              {rules.filter(r => r.isActive).length}
            </h3>
          </div>
        </div>
        <div className="p-4 bg-white rounded-[16px] border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">WeVentureHub General VAT</p>
            <h3 className="text-xl font-bold font-mono text-indigo-600 mt-0.5">15.00 %</h3>
          </div>
        </div>
        <div className="p-4 bg-white rounded-[16px] border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">System Rate Integrity</p>
            <h3 className="text-xs font-bold text-[#65A30D] mt-1 bg-[#84CC16]/15 px-2 py-0.5 rounded-[4px] inline-block">SECURE ENG</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[16px] border border-gray-100">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {(['ALL', 'Workspace Membership', 'Event Space', 'Training Room', 'Meeting Room'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[12px] font-bold rounded-[8px] transition-all ${
                activeTab === tab
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'ALL' ? 'All Rules' : tab}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-[10px] text-xs font-bold outline-none focus:border-[#84CC16]"
          />
        </div>
      </div>

      {/* Rules list Table */}
      <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-bold text-sm">
            Accessing database schemas and rules...
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-sm">
            No pricing rules matched your active filter or search query.
          </div>
        ) : (
          <Table data={filteredRules} columns={columns} />
        )}
      </div>

      {/* Create / Edit Rule Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingRule ? 'Edit Dynamic Pricing Rule' : 'Create New Pricing Rule'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-[10px] text-[12px] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Resource Category</label>
              <select
                value={resourceType}
                onChange={(e) => {
                  setResourceType(e.target.value);
                  if (e.target.value === 'Workspace Membership') {
                    setBillingCycle('Monthly');
                  } else {
                    setBillingCycle('Hourly');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-[13px] font-bold outline-none bg-white border-[#E5E7EB] text-[#374151]"
              >
                <option value="Workspace Membership">Workspace Membership</option>
                <option value="Event Space">Event Space</option>
                <option value="Training Room">Training Room</option>
                <option value="Meeting Room">Meeting Room</option>
              </select>
            </div>

            <Input
              label="Resource Name / Specific Space"
              placeholder="e.g. Dedicated Desk, Large Private Office, Event Hall"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              required
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Billing Cycle / Tier</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-[13px] font-bold outline-none bg-white border-[#E5E7EB] text-[#374151]"
              >
                {resourceType === 'Workspace Membership' ? (
                  <>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </>
                ) : (
                  <>
                    <option value="Hourly">Hourly</option>
                    <option value="Up to 2 Hours">Up to 2 Hours</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Full Day">Full Day</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Min Duration (Hrs)"
                type="number"
                min="0"
                value={minimumDuration}
                onChange={(e) => setMinimumDuration(e.target.value)}
                required
                className="w-full rounded-[10px] border-[#E5E7EB]"
              />
              <Input
                label="Max Duration (Hrs)"
                type="number"
                min="0"
                value={maximumDuration}
                onChange={(e) => setMaximumDuration(e.target.value)}
                required
                className="w-full rounded-[10px] border-[#E5E7EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Price (USD)"
              type="number"
              step="0.01"
              min="0"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />

            <Input
              label="VAT Percentage (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={vatPercentage}
              onChange={(e) => setVatPercentage(e.target.value)}
              required
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Effective From Date"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />

            <Input
              label="Effective To Date"
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-[10px] flex justify-between items-center text-sm font-bold">
            <span className="text-slate-500">Auto Calculated Total Price (incl. VAT):</span>
            <span className="font-mono text-emerald-600 text-base">USD {liveTotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#84CC16] focus:ring-[#84CC16]"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
              Enable Pricing Rule Policy immediately
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
              className="text-[12px] font-bold border-[#E5E7EB] text-[#4B5563] px-4 py-2 rounded-[8px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
              className="bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold text-[12px] px-5 py-2 rounded-[8px]"
            >
              {editingRule ? 'Save Rule Parameters' : 'Establish Pricing Policy'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
