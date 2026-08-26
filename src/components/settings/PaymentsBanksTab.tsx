import React, { useState, useEffect } from 'react';
import { 
  Building, 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Star,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { axiosInstance } from '../../lib/axiosInstance';

interface BankRecord {
  _id?: string;
  id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode?: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface PaymentsBanksTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const PaymentsBanksTab: React.FC<PaymentsBanksTabProps> = ({ onSuccessToast }) => {
  const [banks, setBanks] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountName: 'WE VENTURE HOLDINGS PLC',
    accountNumber: '',
    branch: '',
    swiftCode: '',
    isActive: true,
    isDefault: false,
  });
  const [savingBank, setSavingBank] = useState(false);

  // Delete confirmation
  const [deletingBankId, setDeletingBankId] = useState<string | null>(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/payments/banks');
      if (res.data?.data) {
        setBanks(res.data.data);
      }
    } catch (err: any) {
      console.warn('Error fetching banks, using fallback default list', err);
      // Fallback to default WeVentureHub banks if offline
      setBanks([
        {
          id: '1',
          bankName: 'Dashen Bank',
          accountName: 'WE VENTURE HOLDINGS PLC',
          accountNumber: '001210684011',
          branch: 'Bole Branch',
          swiftCode: 'DASHETAA',
          isActive: true,
          isDefault: true,
        },
        {
          id: '2',
          bankName: 'Zemen Bank S.C',
          accountName: 'WE VENTURE HOLDINGS PLC',
          accountNumber: '126110926406013',
          branch: 'Bole Rwanda Branch',
          swiftCode: 'ZEMNETAA',
          isActive: true,
          isDefault: false,
        },
        {
          id: '3',
          bankName: 'Awash Bank',
          accountName: 'WE VENTURE HOLDINGS PLC',
          accountNumber: '013251088122000',
          branch: 'Africa Avenue Branch',
          swiftCode: 'AWINETAA',
          isActive: true,
          isDefault: false,
        },
        {
          id: '4',
          bankName: 'Bank of Abyssinia',
          accountName: 'WE VENTURE HOLDINGS PLC',
          accountNumber: '131263899',
          branch: 'Bole Branch',
          swiftCode: 'ABYSETAA',
          isActive: true,
          isDefault: false,
        },
        {
          id: '5',
          bankName: 'Commercial Bank of Ethiopia (CBE)',
          accountName: 'WE VENTURE HOLDINGS PLC',
          accountNumber: '1000571098842',
          branch: 'Peacock Menafesha Branch',
          swiftCode: 'CBETETAA',
          isActive: true,
          isDefault: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBankId(null);
    setFormData({
      bankName: '',
      accountName: 'WE VENTURE HOLDINGS PLC',
      accountNumber: '',
      branch: '',
      swiftCode: '',
      isActive: true,
      isDefault: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (bank: BankRecord) => {
    setEditingBankId(bank._id || bank.id || null);
    setFormData({
      bankName: bank.bankName,
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      branch: bank.branch,
      swiftCode: bank.swiftCode || '',
      isActive: bank.isActive,
      isDefault: Boolean(bank.isDefault),
    });
    setIsModalOpen(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBank(true);
      setError(null);

      if (!formData.bankName || !formData.accountNumber || !formData.branch) {
        setError('Please provide bank name, account number, and branch');
        return;
      }

      if (editingBankId) {
        await axiosInstance.put(`/payments/banks/${editingBankId}`, formData);
        setSuccessMsg('Bank account updated successfully');
      } else {
        await axiosInstance.post('/payments/banks', formData);
        setSuccessMsg('New settlement bank added successfully');
      }

      setIsModalOpen(false);
      fetchBanks();
      if (onSuccessToast) onSuccessToast('Settlement bank saved');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save settlement bank.');
    } finally {
      setSavingBank(false);
    }
  };

  const handleToggleActive = async (bank: BankRecord) => {
    const bankId = bank._id || bank.id;
    if (!bankId) return;

    try {
      await axiosInstance.patch(`/payments/banks/${bankId}/toggle`, {
        isActive: !bank.isActive,
      });
      fetchBanks();
      if (onSuccessToast) onSuccessToast(`Bank status updated`);
    } catch (err: any) {
      // Optimistic local toggle
      setBanks((prev) =>
        prev.map((b) => ((b._id || b.id) === bankId ? { ...b, isActive: !b.isActive } : b))
      );
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    try {
      await axiosInstance.delete(`/payments/banks/${bankId}`);
      setDeletingBankId(null);
      fetchBanks();
      if (onSuccessToast) onSuccessToast('Bank removed successfully');
    } catch (err: any) {
      // Optimistic local remove
      setBanks((prev) => prev.filter((b) => (b._id || b.id) !== bankId));
      setDeletingBankId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">Payment Settlement Banks</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Manage the official Ethiopian commercial bank accounts displayed on WeVentureHub Quotations, Invoices, and Payment checkouts.
              </p>
            </div>
          </div>
          <Button
            id="add-bank-btn"
            onClick={openAddModal}
            variant="primary"
            className="flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank Account</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#84CC16]/15 border border-[#84CC16]/40 rounded-xl text-[#65A30D] text-sm flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settlement Banks Table / Cards */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#84CC16]" />
            <h3 className="font-bold text-[#111111] dark:text-white">Active Settlement Accounts</h3>
          </div>
          <button
            onClick={fetchBanks}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#84CC16] border-t-transparent rounded-full animate-spin mr-3"></div>
            <span>Loading settlement banks...</span>
          </div>
        ) : banks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No bank accounts configured</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Bank Account" to establish your first settlement bank.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-slate-800">
            {banks.map((bank, index) => {
              const bankId = bank._id || bank.id || String(index);
              return (
                <div
                  key={bankId}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-[12px] bg-[#84CC16]/10 text-[#65A30D] flex items-center justify-center font-bold text-sm shrink-0 border border-[#84CC16]/30">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-[#111111] dark:text-white text-base">
                          {bank.bankName}
                        </h4>
                        {bank.isDefault && (
                          <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Default
                          </span>
                        )}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            bank.isActive
                              ? 'bg-[#84CC16]/20 text-[#65A30D]'
                              : 'bg-neutral-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {bank.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 mt-2 text-xs text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="text-slate-400">Account Name:</span>{' '}
                          <strong className="text-[#111111] dark:text-slate-200 font-bold">{bank.accountName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Account Number:</span>{' '}
                          <strong className="font-mono text-[#65A30D] font-bold">{bank.accountNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Branch:</span>{' '}
                          <strong className="text-slate-700 dark:text-slate-300 font-medium">{bank.branch}</strong>
                        </div>
                        {bank.swiftCode && (
                          <div>
                            <span className="text-slate-400">SWIFT:</span>{' '}
                            <strong className="font-mono text-slate-700 dark:text-slate-300 font-medium">{bank.swiftCode}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      id={`toggle-bank-${bankId}`}
                      onClick={() => handleToggleActive(bank)}
                      className={`text-xs px-3.5 py-2 rounded-[12px] font-bold border transition-colors ${
                        bank.isActive
                          ? 'border-neutral-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                          : 'border-[#84CC16]/50 text-[#65A30D] bg-[#84CC16]/10 hover:bg-[#84CC16]/20'
                      }`}
                    >
                      {bank.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      id={`edit-bank-${bankId}`}
                      onClick={() => openEditModal(bank)}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-[12px] hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Bank"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {deletingBankId === bankId ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteBank(bankId)}
                          className="px-2.5 py-1.5 text-xs bg-red-600 text-white rounded-[10px] font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingBankId(null)}
                          className="px-2.5 py-1.5 text-xs bg-neutral-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[10px] font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`delete-bank-${bankId}`}
                        onClick={() => setDeletingBankId(bankId)}
                        className="p-2 text-red-500 hover:text-red-700 rounded-[12px] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete Bank"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 bg-neutral-50 dark:bg-slate-800/60 border-t border-neutral-100 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-500 font-medium">
          <Info className="w-4 h-4 text-[#84CC16] mt-0.5 shrink-0" />
          <p>
            These settlement banks appear on the official WeVentureHub Quotations and Invoices with matching top-to-bottom layout, large legible typography, and direct account information.
          </p>
        </div>
      </div>

      {/* Add / Edit Bank Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl max-w-md w-full border border-neutral-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-[#111111] dark:text-white">
                {editingBankId ? 'Edit Settlement Bank' : 'Add Settlement Bank'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Bank Name *
                </label>
                <Input
                  id="modal-bank-name"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. Dashen Bank or Awash Bank"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Account Name *
                </label>
                <Input
                  id="modal-account-name"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="WE VENTURE HOLDINGS PLC"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                    Account Number *
                  </label>
                  <Input
                    id="modal-account-number"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="001210684011"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                    Branch Name *
                  </label>
                  <Input
                    id="modal-branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="Bole Branch"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  SWIFT / BIC Code (Optional)
                </label>
                <Input
                  id="modal-swift"
                  value={formData.swiftCode}
                  onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                  placeholder="DASHETAA"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#84CC16] focus:ring-[#84CC16]"
                  />
                  <span>Active in Document Checkouts</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded text-[#84CC16] focus:ring-[#84CC16]"
                  />
                  <span>Default Settlement Bank</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingBank}
                  variant="primary"
                >
                  {savingBank ? 'Saving...' : 'Save Bank Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
