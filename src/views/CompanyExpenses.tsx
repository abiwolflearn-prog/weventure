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
  Eye, 
  FileText,
  AlertCircle,
  X,
  UploadCloud
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

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', searchTerm],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/expenses?search=${searchTerm}`);
      return res.data.data || { docs: [] };
    }
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: (data: any) => editingExpense 
      ? axiosInstance.put(`/api/v1/expenses/${editingExpense.id}`, data)
      : axiosInstance.post('/api/v1/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false);
      setEditingExpense(null);
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
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/v1/expenses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] })
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

  const expenses = expensesData?.docs || [];
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Company Expenses</h1>
        <Button onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
        </Card>
        {/* Placeholder for other stats */}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No expenses found.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Name</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created By</th>
                <th className="p-3">Receipt</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense: any) => (
                <tr key={expense.id} className="border-b">
                  <td className="p-3">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="p-3">{expense.category}</td>
                  <td className="p-3">{expense.name}</td>
                  <td className="p-3">{expense.vendor}</td>
                  <td className="p-3">{expense.amount} {expense.currency}</td>
                  <td className="p-3">{expense.status}</td>
                  <td className="p-3">{expense.createdBy}</td>
                  <td className="p-3">
                    {expense.receiptUrl && (
                      <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                    )}
                  </td>
                  <td className="p-3 flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => editExpense(expense)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(expense.id)}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingExpense ? "Edit Expense" : "Create Expense"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Category" required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
          <Input label="Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <Input label="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          <Input label="Vendor" required value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount" type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} />
            <Input label="Currency" required value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} />
          </div>
          <Input label="Date" type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          <Input label="Payment Method" required value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border rounded p-2">
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <Input label="Reference Number" value={formData.referenceNumber} onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})} />
          <Input label="Notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Receipt</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary/90" />
            {formData.receiptUrl && <img src={formData.receiptUrl} alt="Receipt preview" className="mt-2 max-h-40" />}
          </div>

          <Button type="submit" className="w-full">{editingExpense ? "Update" : "Create"}</Button>
        </form>
      </Modal>
    </div>
  );
}
