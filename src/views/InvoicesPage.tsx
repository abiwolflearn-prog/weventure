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
        <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin" />
        <span className="text-xs text-[#4B5563] font-mono">Synchronizing billing records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl tracking-tight text-[#111827]">Billing & Invoices</h1>
        <p className="text-xs text-[#4B5563] mt-1">Access historic invoices, tax descriptors, and transactional logs</p>
      </div>

      {isError || invoices.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E7EB] rounded-3xl space-y-4">
          <Receipt className="w-12 h-12 text-[#9CA3AF] mx-auto" />
          <h3 className="font-display font-bold text-base text-[#111827]">No invoices discovered</h3>
          <p className="text-xs text-[#4B5563] max-w-sm mx-auto">
            Your billing drawer is empty. Purchase ticket admissions or reserve executive workspaces to see invoice entries here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] font-extrabold uppercase tracking-wider text-[10px] select-none">
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
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : invoice.status === 'REFUNDED'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200';

                  return (
                    <tr 
                      key={invoice.id}
                      className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-all"
                    >
                      <td className="py-4 px-6 font-mono font-bold text-[#111827] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2563EB]" />
                        <span>{invoice.invoiceNumber}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#111827]">{invoice.billingDetails?.name}</div>
                        <div className="text-[10px] text-[#4B5563] font-mono mt-0.5">{invoice.billingDetails?.email}</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-[#4B5563] text-[11px] uppercase">
                        {invoice.paymentId ? 'Verified Checkout' : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-[#4B5563] font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#4B5563]" />
                          <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-sm text-[#111827]">
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
      )}
    </div>
  );
}
