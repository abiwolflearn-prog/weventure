import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  DollarSign, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  HelpCircle, 
  FileText, 
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { axiosInstance } from '../../lib/axiosInstance';

interface TaxPricingTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const TaxPricingTab: React.FC<TaxPricingTabProps> = ({ onSuccessToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tax & Currency States
  const [defaultVatRate, setDefaultVatRate] = useState<number>(15);
  const [vatInclusiveQuotations, setVatInclusiveQuotations] = useState<boolean>(true);
  const [exchangeRate, setExchangeRate] = useState<number>(153.09);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('USD');
  const [showVatStatementInQuotes, setShowVatStatementInQuotes] = useState<boolean>(true);
  const [vatStatementText, setVatStatementText] = useState<string>('All amounts are inclusive of VAT.');
  const [currencyPrecision, setCurrencyPrecision] = useState<number>(2);

  useEffect(() => {
    fetchTaxSettings();
  }, []);

  const fetchTaxSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/cms/company-info');
      const data = res.data?.data;
      if (data) {
        if (data.defaultVatRate !== undefined) setDefaultVatRate(data.defaultVatRate);
        if (data.vatInclusiveQuotations !== undefined) setVatInclusiveQuotations(data.vatInclusiveQuotations);
        if (data.exchangeRate !== undefined) setExchangeRate(data.exchangeRate);
        if (data.defaultCurrency) setDefaultCurrency(data.defaultCurrency);
      }
    } catch (err: any) {
      console.warn('Using default tax values', err);
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
        defaultVatRate: Number(defaultVatRate),
        vatInclusiveQuotations: Boolean(vatInclusiveQuotations),
        exchangeRate: Number(exchangeRate),
        defaultCurrency,
      };

      await axiosInstance.put('/cms/company-info', payload);
      setSavedSuccess(true);
      if (onSuccessToast) onSuccessToast('Tax & Pricing settings updated');
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save tax & pricing settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <span>Loading tax and pricing rules...</span>
      </div>
    );
  }

  return (
    <form id="tax-pricing-form" onSubmit={handleSave} className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">Tax & Pricing Configuration</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Configure Ethiopia Value Added Tax (15% VAT), USD/ETB conversion exchange rates, and quotation tax statements.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#84CC16]/10 border border-[#84CC16]/30 px-3.5 py-1.5 rounded-full text-[#65A30D] text-xs font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>Ethiopian Revenue Authority (ERA) Compliant</span>
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
          <span>Tax, exchange rate, and pricing settings updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value Added Tax (VAT) Settings */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Percent className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Value Added Tax (VAT) Rules</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Standard VAT Percentage Rate (%) *
            </label>
            <div className="flex items-center gap-3">
              <Input
                id="vat-rate-input"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={defaultVatRate}
                onChange={(e) => setDefaultVatRate(Number(e.target.value))}
                placeholder="15"
                required
              />
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Standard statutory rate for workspace rentals and event halls in Ethiopia is 15%.</p>
          </div>

          {/* Quotation VAT Statement Display */}
          <div className="p-4 rounded-[16px] bg-[#84CC16]/5 border border-[#84CC16]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#111111] dark:text-white">
                Quotation VAT Statement
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVatStatementInQuotes}
                  onChange={(e) => setShowVatStatementInQuotes(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#84CC16]"></div>
              </label>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Display statement directly below Grand Total or Amount in Words on the quotation:
            </p>

            <div className="bg-white dark:bg-slate-900 border border-[#84CC16]/40 rounded-[12px] p-3 text-sm font-bold text-[#111111] dark:text-white">
              “{vatStatementText}”
            </div>
          </div>
        </div>

        {/* Currency & Conversion */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <ArrowRightLeft className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Currency & Exchange Rates</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Default Quotation Base Currency
            </label>
            <select
              id="default-currency-select"
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
            >
              <option value="USD">USD ($) - United States Dollar (Standard for Quotations)</option>
              <option value="ETB">ETB (Br) - Ethiopian Birr</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              USD to ETB Official Conversion Rate (1 USD = X ETB) *
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-500 shrink-0">1 USD =</span>
              <Input
                id="exchange-rate-input"
                type="number"
                step="0.01"
                min="1"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                placeholder="153.09"
                required
              />
              <span className="text-sm font-bold text-slate-500">ETB</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Automatically used when computing Ethiopian Birr grand total equivalence on quotation PDFs.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-slate-800">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-[14px] border border-neutral-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Conversion Example Preview
              </div>
              <div className="text-sm text-slate-800 dark:text-slate-200 font-mono font-medium">
                $500.00 USD × {exchangeRate} = <strong className="text-[#65A30D] font-bold">{(500 * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-slate-800">
        <Button
          id="save-tax-pricing-btn"
          type="submit"
          disabled={saving}
          variant="primary"
          className="flex items-center gap-2 px-6"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Tax & Pricing Settings</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
