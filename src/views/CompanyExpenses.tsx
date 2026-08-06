import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axiosInstance';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit2, 
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';

export default function CompanyExpenses() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    vendor: '',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: '',
    status: 'Pending',
    referenceNumber: '',
    notes: '',
    receiptUrl: ''
  });

  // Fetch all expenses to handle client-side filtering, searching, and perfect stats
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await axiosInstance.get('/expenses', { params: { limit: 2000 } });
      return res.data.data || { docs: [] };
    }
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: (data: any) => {
      const id = editingExpense?.id || editingExpense?._id;
      return editingExpense 
        ? axiosInstance.put(`/expenses/${id}`, data)
        : axiosInstance.post('/expenses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false);
      setEditingExpense(null);
      setFeedback({ 
        type: 'success', 
        message: editingExpense ? 'Expense updated successfully!' : 'Expense created successfully!' 
      });
      setFormData({
        category: '',
        name: '',
        description: '',
        vendor: '',
        amount: 0,
        currency: 'USD',
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: '',
        status: 'Pending',
        referenceNumber: '',
        notes: '',
        receiptUrl: ''
      });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ 
        type: 'error', 
        message: err?.message || 'An error occurred while saving the expense.' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setFeedback({ type: 'success', message: 'Expense deleted successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ 
        type: 'error', 
        message: err?.message || 'An error occurred while deleting the expense.' 
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, receiptUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrUpdateMutation.mutate(formData);
  };

  const editExpense = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      name: expense.name,
      description: expense.description || '',
      vendor: expense.vendor,
      amount: expense.amount,
      currency: expense.currency,
      date: new Date(expense.date).toISOString().slice(0, 10),
      paymentMethod: expense.paymentMethod,
      status: expense.status,
      referenceNumber: expense.referenceNumber || '',
      notes: expense.notes || '',
      receiptUrl: expense.receiptUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Date', 'Category', 'Name', 'Vendor', 'Amount', 'Currency', 'Status', 'Created By', 'Reference Number', 'Notes'];
    const rows = expenses.map((e: any) => [
      new Date(e.date).toLocaleDateString(),
      e.category,
      e.name,
      e.vendor,
      e.amount,
      e.currency,
      e.status,
      e.createdByDetails?.name || e.createdBy,
      e.referenceNumber || '',
      e.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weventurehub_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rawExpenses = expensesData?.docs || [];

  // Compute live real-time metrics
  const totalExpenses = rawExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
  const pendingExpenses = rawExpenses.filter((e: any) => e.status === 'Pending').reduce((sum: number, e: any) => sum + e.amount, 0);
  const approvedExpenses = rawExpenses.filter((e: any) => e.status === 'Approved').reduce((sum: number, e: any) => sum + e.amount, 0);
  const paidExpenses = rawExpenses.filter((e: any) => e.status === 'Paid').reduce((sum: number, e: any) => sum + e.amount, 0);

  // Dynamic filter list based on actual categories present in data
  const uniqueCategories = Array.from(new Set(rawExpenses.map((e: any) => e.category).filter(Boolean))) as string[];

  // Apply instant client-side filtering and search
  const expenses = rawExpenses.filter((expense: any) => {
    const matchesSearch = !searchTerm || 
      expense.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !filterCategory || expense.category === filterCategory;
    const matchesStatus = !filterStatus || expense.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Company Expenses</h1>
        <Button onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Expense
        </Button>
      </div>

      {/* Live Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.type === 'success' ? (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Expenses</p>
          <p className="text-2xl font-bold mt-1 text-blue-950">${totalExpenses.toFixed(2)}</p>
        </Card>
        <Card className="p-4 bg-yellow-50/70 border border-yellow-100">
          <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">Pending Approval</p>
          <p className="text-2xl font-bold mt-1 text-yellow-950">${pendingExpenses.toFixed(2)}</p>
        </Card>
        <Card className="p-4 bg-indigo-50/70 border border-indigo-100">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Approved Expenses</p>
          <p className="text-2xl font-bold mt-1 text-indigo-955">${approvedExpenses.toFixed(2)}</p>
        </Card>
        <Card className="p-4 bg-emerald-50 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Paid Expenses</p>
          <p className="text-2xl font-bold mt-1 text-emerald-950">${paidExpenses.toFixed(2)}</p>
        </Card>
      </div>

      {/* Main Expense Table and Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Dynamic Category Filter */}
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-xs bg-white h-10 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-xs bg-white h-10 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
            </select>

            {/* Clear Filters Button */}
            {(searchTerm || filterCategory || filterStatus) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSearchTerm(''); setFilterCategory(''); setFilterStatus(''); }}
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Export Button */}
          <Button variant="secondary" onClick={handleExportCSV} disabled={expenses.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Loading / Empty States */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm">Fetching corporate expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600">No expenses match your filters.</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the filters or register a new corporate expense transaction.</p>
          </div>
        ) : (
          /* Expense Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created By</th>
                  <th className="p-4">Receipt</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {expenses.map((expense: any) => (
                  <tr key={expense.id || expense._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-gray-900">{expense.name}</p>
                        {expense.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{expense.description}</p>}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">{expense.vendor}</td>
                    <td className="p-4 font-bold text-gray-900">
                      {expense.amount.toFixed(2)} {expense.currency}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                        expense.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        expense.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{expense.createdByDetails?.name || 'Staff'}</p>
                        {expense.createdByDetails?.email && <p className="text-xs text-gray-400 mt-0.5">{expense.createdByDetails.email}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      {expense.receiptUrl ? (
                        <a 
                          href={expense.receiptUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs font-bold text-brand-primary hover:underline hover:text-brand-primary/80"
                        >
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => editExpense(expense)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this corporate expense?')) {
                              deleteMutation.mutate(expense.id || expense._id);
                            }
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Expense Modal Dialog */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingExpense ? "Edit Corporate Expense" : "Register Corporate Expense"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Category" 
            placeholder="e.g. Travel, Office, Marketing" 
            required 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})} 
          />
          <Input 
            label="Expense Name" 
            placeholder="e.g. AWS Cloud Invoicing, Team Luncheon" 
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />
          <Input 
            label="Description" 
            placeholder="Additional notes about the expenditure" 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
          />
          <Input 
            label="Vendor / Recipient" 
            placeholder="e.g. Amazon Web Services Inc." 
            required 
            value={formData.vendor} 
            onChange={(e) => setFormData({...formData, vendor: e.target.value})} 
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Amount" 
              type="number" 
              step="0.01" 
              min="0.01"
              required 
              value={formData.amount || ''} 
              onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} 
            />
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Currency</label>
              <select 
                value={formData.currency} 
                onChange={(e) => setFormData({...formData, currency: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ETB">ETB</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Date of Transaction" 
              type="date" 
              required 
              value={formData.date} 
              onChange={(e) => setFormData({...formData, date: e.target.value})} 
            />
            <Input 
              label="Payment Method" 
              placeholder="e.g. Corporate Credit Card, Bank Transfer" 
              required 
              value={formData.paymentMethod} 
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Approval Status</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({...formData, status: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <Input 
              label="Reference Number" 
              placeholder="e.g. TXN-98471-29" 
              value={formData.referenceNumber} 
              onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})} 
            />
          </div>

          <Input 
            label="Internal Notes" 
            placeholder="Confidential ledger notes..." 
            value={formData.notes} 
            onChange={(e) => setFormData({...formData, notes: e.target.value})} 
          />
          
          {/* File Attachment Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Receipt Attachment</label>
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              onChange={handleFileChange} 
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/25 cursor-pointer" 
            />
            {formData.receiptUrl && (
              <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 truncate">Receipt Attached successfully</span>
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, receiptUrl: '' }))} 
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createOrUpdateMutation.isPending}
              className="flex-1"
            >
              {createOrUpdateMutation.isPending 
                ? 'Saving Expenditure...' 
                : (editingExpense ? "Save Changes" : "Register Expense")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
