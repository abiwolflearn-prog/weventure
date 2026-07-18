import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../lib/paymentApi';
import { FileText, Download, Loader2, Calendar, Receipt } from 'lucide-react';
import { Button } from '../components/Button';

export default function InvoicesPage() {
  const { data: invoices = [], isLoading, isError } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => paymentApi.getInvoices(),
  });

  const handleDownload = (id: string, invoiceNumber: string) => {
    window.open(`/api/v1/payments/invoices/${id}/download`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-10 h-10 text-[#84CC16] animate-spin" />
        <span className="text-xs text-[#4B5563] font-mono">Synchronizing billing records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl tracking-tight text-[#111827] dark:text-white">Billing & Invoices</h1>
        <p className="text-xs text-[#4B5563] dark:text-neutral-slate-400 mt-1">Access historic invoices, tax descriptors, and transactional logs</p>
      </div>

      {isError || invoices.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-slate-900 border border-[#E5E7EB] dark:border-neutral-slate-800 rounded-3xl space-y-4">
          <Receipt className="w-12 h-12 text-[#9CA3AF] mx-auto" />
          <h3 className="font-display font-bold text-base text-[#111827] dark:text-white">No invoices discovered</h3>
          <p className="text-xs text-[#4B5563] dark:text-neutral-slate-400 max-w-sm mx-auto">
            Your billing drawer is empty. Purchase ticket admissions or reserve executive workspaces to see invoice entries here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile View: Cards (block md:hidden) */}
          <div className="block md:hidden space-y-4">
            {invoices.map((invoice: any) => {
              const statusColors = 
                invoice.status === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                  : invoice.status === 'REFUNDED'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
                  : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';

              return (
                <div 
                  key={invoice.id} 
                  className="bg-white dark:bg-neutral-slate-900 border border-[#E5E7EB] dark:border-neutral-slate-800 rounded-2xl p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 font-mono font-bold text-sm text-[#111827] dark:text-white">
                      <FileText className="w-4.5 h-4.5 text-[#65A30D]" />
                      <span>{invoice.invoiceNumber}</span>
                    </div>
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${statusColors}`}>
                      {invoice.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-slate-400">Billing Contact:</span>
                      <span className="font-semibold text-neutral-slate-800 dark:text-neutral-slate-200">{invoice.billingDetails?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-slate-400">Email:</span>
                      <span className="font-mono text-[10px] text-neutral-slate-600 dark:text-neutral-slate-300">{invoice.billingDetails?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-slate-400">Date:</span>
                      <span className="font-medium text-neutral-slate-700 dark:text-neutral-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-slate-400">Reference:</span>
                      <span className="font-mono text-[10px] text-neutral-slate-600 dark:text-neutral-slate-300 uppercase">
                        {invoice.paymentId ? 'Verified Checkout' : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-slate-100 dark:border-neutral-slate-850 pt-4 flex items-center justify-between">
                    <div className="text-base font-black text-[#111827] dark:text-white">
                      {invoice.amount.toFixed(2)} <span className="text-xs font-normal text-neutral-slate-400">{invoice.currency || 'ETB'}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                      className="rounded-xl flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Traditional Table (hidden md:block) */}
          <div className="hidden md:block bg-white dark:bg-neutral-slate-900 border border-[#E5E7EB] dark:border-neutral-slate-800 rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] dark:bg-neutral-slate-850 border-b border-[#E5E7EB] dark:border-neutral-slate-800 text-[#4B5563] dark:text-neutral-slate-300 font-extrabold uppercase tracking-wider text-[10px] select-none">
                    <th className="py-4.5 px-6">Invoice Number</th>
                    <th className="py-4.5 px-6">Billing Contact</th>
                    <th className="py-4.5 px-6">Payment Reference</th>
                    <th className="py-4.5 px-6">Date Generated</th>
                    <th className="py-4.5 px-6">Amount</th>
                    <th className="py-4.5 px-6">Status</th>
                    <th className="py-4.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: any) => {
                    const statusColors = 
                      invoice.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                        : invoice.status === 'REFUNDED'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
                        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';

                    return (
                      <tr 
                        key={invoice.id}
                        className="border-b border-[#E5E7EB] dark:border-neutral-slate-800 hover:bg-[#F9FAFB] dark:hover:bg-neutral-slate-850 transition-all animate-fade-in"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-[#111827] dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#65A30D]" />
                          <span>{invoice.invoiceNumber}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#111827] dark:text-white">{invoice.billingDetails?.name}</div>
                          <div className="text-[10px] text-[#4B5563] dark:text-neutral-slate-400 font-mono mt-0.5">{invoice.billingDetails?.email}</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-[#4B5563] dark:text-neutral-slate-400 text-[11px] uppercase">
                          {invoice.paymentId ? 'Verified Checkout' : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-[#4B5563] dark:text-neutral-slate-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-sm text-[#111827] dark:text-white">
                          {invoice.amount.toFixed(2)} {invoice.currency || 'ETB'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full border ${statusColors}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                            className="rounded-xl flex items-center gap-1.5 ml-auto text-[11px] font-bold"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download TXT</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
