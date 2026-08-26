import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Clock, 
  Calendar, 
  Sliders, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { Button } from '../Button';
import { useAppDispatch, useAppSelector } from '../../store';
import { setTheme } from '../../store/uiSlice';

interface PlatformPreferencesTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const PlatformPreferencesTab: React.FC<PlatformPreferencesTabProps> = ({ onSuccessToast }) => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);

  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('12');
  const [enableSoundEffects, setEnableSoundEffects] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      if (onSuccessToast) onSuccessToast('Platform preferences saved');
      setTimeout(() => setSavedSuccess(false), 4000);
    }, 500);
  };

  return (
    <form id="platform-preferences-form" onSubmit={handleSave} className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">Platform Localization & System Preferences</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Configure timezone (East Africa Time / UTC+3), calendar date notation, and interface display modes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#84CC16]/15 border border-[#84CC16]/30 px-3 py-1.5 rounded-full text-[#65A30D] text-xs font-bold select-none">
            <ShieldCheck className="w-4 h-4" />
            <span>Addis Ababa Standard Locale</span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-[#84CC16]/15 border border-[#84CC16]/40 rounded-xl text-[#65A30D] text-sm flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Platform preferences updated and applied across all views!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Localization */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Globe className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Regional Locale & Time</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Primary System Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
            >
              <option value="en">English (Official Business)</option>
              <option value="am">Amharic (አማርኛ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Hub Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
            >
              <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (UTC+03:00 East Africa Time)</option>
              <option value="UTC">Coordinated Universal Time (UTC)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Date Notation
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 26/08/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/26/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Clock Display
              </label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
              >
                <option value="12">12-Hour (AM / PM)</option>
                <option value="24">24-Hour (Military)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display Appearance */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Moon className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Display & Theme Mode</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => dispatch(setTheme('light'))}
                className={`p-3.5 rounded-[14px] border flex flex-col items-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'border-[#84CC16] bg-[#84CC16]/10 text-[#65A30D] font-bold'
                    : 'border-neutral-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 font-medium'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-xs">Light Clean</span>
              </button>

              <button
                type="button"
                onClick={() => dispatch(setTheme('dark'))}
                className={`p-3.5 rounded-[14px] border flex flex-col items-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'border-[#84CC16] bg-[#84CC16]/10 text-[#65A30D] font-bold'
                    : 'border-neutral-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 font-medium'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs">Dark Night</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-slate-800">
            <label className="flex items-center justify-between p-3.5 rounded-[14px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-[#111111] dark:text-white">Audio & Haptic Feedback</span>
                <p className="text-[11px] text-[#6B7280] dark:text-slate-400 font-medium">Play subtle notifications for check-in scans and payment receipts.</p>
              </div>
              <input
                type="checkbox"
                checked={enableSoundEffects}
                onChange={(e) => setEnableSoundEffects(e.target.checked)}
                className="rounded text-[#84CC16] focus:ring-[#84CC16] h-4 w-4"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-slate-800">
        <Button
          type="submit"
          disabled={saving}
          variant="primary"
          className="flex items-center gap-2 px-6"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Platform Preferences</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
