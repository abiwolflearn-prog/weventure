import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Receipt, 
  FileCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Hash, 
  PenTool, 
  Stamp, 
  ShieldCheck, 
  Info
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { axiosInstance } from '../../lib/axiosInstance';

interface DocumentsTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ onSuccessToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Document Numbering State
  const [invoicePrefix, setInvoicePrefix] = useState('INV-WV-');
  const [invoiceNextNumber, setInvoiceNextNumber] = useState(1001);
  const [quotationPrefix, setQuotationPrefix] = useState('QUO-WV-');
  const [quotationNextNumber, setQuotationNextNumber] = useState(1001);
  const [receiptPrefix, setReceiptPrefix] = useState('REC-WV-');
  const [receiptNextNumber, setReceiptNextNumber] = useState(1001);

  // Signatory & Stamp State
  const [signatoryName, setSignatoryName] = useState('Authorized Managing Director');
  const [signatoryTitle, setSignatoryTitle] = useState('General Operations & Finance Lead');
  const [signatureImageUrl, setSignatureImageUrl] = useState('');
  const [stampImageUrl, setStampImageUrl] = useState('');

  // Default Footers & Legal Notes
  const [defaultFooter, setDefaultFooter] = useState(
    'WeVentureHub • Empowering Innovation & African Startups • Bole Road, Addis Ababa, Ethiopia'
  );
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(
    '100% advance payment required upon invoice receipt. Bank transfer references must quote Invoice Number.'
  );

  useEffect(() => {
    fetchDocumentSettings();
  }, []);

  const fetchDocumentSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/cms/company-info');
      const data = res.data?.data;
      if (data) {
        if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
        if (data.invoiceNextNumber) setInvoiceNextNumber(data.invoiceNextNumber);
        if (data.quotationPrefix) setQuotationPrefix(data.quotationPrefix);
        if (data.quotationNextNumber) setQuotationNextNumber(data.quotationNextNumber);
        if (data.receiptPrefix) setReceiptPrefix(data.receiptPrefix);
        if (data.receiptNextNumber) setReceiptNextNumber(data.receiptNextNumber);
        if (data.signatoryName) setSignatoryName(data.signatoryName);
        if (data.signatoryTitle) setSignatoryTitle(data.signatoryTitle);
        if (data.signatureImageUrl) setSignatureImageUrl(data.signatureImageUrl);
        if (data.stampImageUrl) setStampImageUrl(data.stampImageUrl);
        if (data.defaultDocumentFooter) setDefaultFooter(data.defaultDocumentFooter);
      }
    } catch (err: any) {
      console.warn('Could not fetch document settings, using defaults', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload = {
        invoicePrefix,
        invoiceNextNumber: Number(invoiceNextNumber),
        quotationPrefix,
        quotationNextNumber: Number(quotationNextNumber),
        receiptPrefix,
        receiptNextNumber: Number(receiptNextNumber),
        signatoryName,
        signatoryTitle,
        signatureImageUrl,
        stampImageUrl,
        defaultDocumentFooter: defaultFooter,
      };

      await axiosInstance.put('/cms/company-info', payload);
      setSavedSuccess(true);
      if (onSuccessToast) onSuccessToast('Document configuration saved successfully');
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save document configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <span>Loading document preferences...</span>
      </div>
    );
  }

  return (
    <form id="documents-settings-form" onSubmit={handleSave} className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">WeVentureHub Documents & Numbering</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Configure prefixes, sequential numbering, authorized signatories, and default footers for official PDFs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#84CC16]/15 border border-[#84CC16]/30 px-3 py-1.5 rounded-full text-[#65A30D] text-xs font-bold select-none">
            <ShieldCheck className="w-4 h-4" />
            <span>Standardized WeVentureHub Format</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 bg-[#84CC16]/15 border border-[#84CC16]/40 rounded-xl text-[#65A30D] text-sm flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Document numbering and format preferences saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Numbering Sequences */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Hash className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Document Serial Sequences</h3>
          </div>

          {/* Quotations */}
          <div className="p-4 rounded-[16px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#65A30D]" />
                <span className="font-bold text-sm text-[#111111] dark:text-white">Quotation Numbering</span>
              </div>
              <span className="text-xs font-mono font-bold bg-[#84CC16]/20 text-[#65A30D] px-2.5 py-1 rounded-full">
                Sample: {quotationPrefix}{quotationNextNumber}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] dark:text-slate-400 mb-1">Prefix</label>
                <Input
                  id="quotation-prefix-input"
                  value={quotationPrefix}
                  onChange={(e) => setQuotationPrefix(e.target.value)}
                  placeholder="QUO-WV-"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] dark:text-slate-400 mb-1">Next Sequence</label>
                <Input
                  id="quotation-seq-input"
                  type="number"
                  value={quotationNextNumber}
                  onChange={(e) => setQuotationNextNumber(Number(e.target.value))}
                  placeholder="1001"
                />
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="p-4 rounded-[16px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#84CC16]" />
                <span className="font-bold text-sm text-[#111111] dark:text-white">Invoice Numbering</span>
              </div>
              <span className="text-xs font-mono font-bold bg-[#84CC16]/20 text-[#65A30D] px-2.5 py-1 rounded-full">
                Sample: {invoicePrefix}{invoiceNextNumber}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] dark:text-slate-400 mb-1">Prefix</label>
                <Input
                  id="invoice-prefix-input"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV-WV-"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] dark:text-slate-400 mb-1">Next Sequence</label>
                <Input
                  id="invoice-seq-input"
                  type="number"
                  value={invoiceNextNumber}
                  onChange={(e) => setInvoiceNextNumber(Number(e.target.value))}
                  placeholder="1001"
                />
              </div>
            </div>
          </div>

          {/* Receipts */}
          <div className="p-4 rounded-[16px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#65A30D]" />
                <span className="font-bold text-sm text-[#111111] dark:text-white">Receipt Numbering</span>
              </div>
              <span className="text-xs font-mono font-bold bg-[#84CC16]/20 text-[#65A30D] px-2.5 py-1 rounded-full">
                Sample: {receiptPrefix}{receiptNextNumber}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] dark:text-slate-400 mb-1">Prefix</label>
                <Input
                  id="receipt-prefix-input"
                  value={receiptPrefix}
                  onChange={(e) => setReceiptPrefix(e.target.value)}
                  placeholder="REC-WV-"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] dark:text-slate-400 mb-1">Next Sequence</label>
                <Input
                  id="receipt-seq-input"
                  type="number"
                  value={receiptNextNumber}
                  onChange={(e) => setReceiptNextNumber(Number(e.target.value))}
                  placeholder="1001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Signatures, Stamps & Footer */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <PenTool className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Authorized Signature & Seal</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Signatory Full Name
              </label>
              <Input
                id="signatory-name-input"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                placeholder="Authorized Managing Director"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Signatory Job Title
              </label>
              <Input
                id="signatory-title-input"
                value={signatoryTitle}
                onChange={(e) => setSignatoryTitle(e.target.value)}
                placeholder="General Operations & Finance Lead"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Digital Signature Image URL
              </label>
              <Input
                id="signature-url-input"
                value={signatureImageUrl}
                onChange={(e) => setSignatureImageUrl(e.target.value)}
                placeholder="https://.../signature.png"
              />
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 font-medium">Rendered above the signatory line in PDFs.</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Official Company Stamp URL
              </label>
              <Input
                id="stamp-url-input"
                value={stampImageUrl}
                onChange={(e) => setStampImageUrl(e.target.value)}
                placeholder="https://.../stamp.png"
              />
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 font-medium">Official circular seal watermark for documents.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Default Document Footer Text
              </label>
              <textarea
                id="default-footer-textarea"
                rows={2}
                value={defaultFooter}
                onChange={(e) => setDefaultFooter(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16]/20 focus:border-[#84CC16] focus:outline-none transition-all"
              />
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 font-medium">Appears at the very bottom of every page in Quotations and Invoices.</p>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/80 dark:border-slate-700 rounded-[14px] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#84CC16] mt-0.5 shrink-0" />
              <p className="text-xs text-[#111111] dark:text-slate-300 leading-relaxed font-medium">
                The existing Quotation and Invoice PDF design includes the statutory <strong>"All amounts are inclusive of VAT"</strong> notice and included amenities layout. These document settings apply cleanly to all generated files.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-slate-800">
        <Button
          id="save-documents-btn"
          type="submit"
          disabled={saving}
          variant="primary"
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Document Settings</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
