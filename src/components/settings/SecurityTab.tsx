import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Clock, 
  Smartphone, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff,
  History,
  Info
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { useAppSelector } from '../../store';

interface SecurityTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ onSuccessToast }) => {
  const { user } = useAppSelector((state) => state.auth);

  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('8');
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [requireSymbols, setRequireSymbols] = useState(true);
  const [failedAttemptsLockout, setFailedAttemptsLockout] = useState('5');

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }

    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccessToast) onSuccessToast('Security policies updated');
      setTimeout(() => setSavedSuccess(false), 4000);
    }, 600);
  };

  return (
    <form id="security-form" onSubmit={handleSaveSecurity} className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">Security, Access & Authentication</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Manage JWT token security, Email OTP two-factor authentication, session expiration, and credential policies.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#84CC16]/15 border border-[#84CC16]/30 px-3 py-1.5 rounded-full text-[#65A30D] text-xs font-bold select-none">
            <Lock className="w-4 h-4" />
            <span>Encrypted Session Tokens</span>
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
          <span>Security policies and credentials updated!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Controls */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Lock className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Authentication & Session Rules</h3>
          </div>

          <div className="p-4 rounded-[14px] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#111111] dark:text-white">Two-Factor Authentication (2FA)</span>
                <p className="text-xs text-[#6B7280] dark:text-slate-400 font-medium">Require an Email OTP code upon administrator login from new devices.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#84CC16]"></div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Session Expiration (Hours)
              </label>
              <select
                value={sessionTimeoutHours}
                onChange={(e) => setSessionTimeoutHours(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
              >
                <option value="1">1 Hour</option>
                <option value="4">4 Hours</option>
                <option value="8">8 Hours (Standard)</option>
                <option value="24">24 Hours</option>
                <option value="72">3 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Lockout after Failed Logins
              </label>
              <select
                value={failedAttemptsLockout}
                onChange={(e) => setFailedAttemptsLockout(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
              >
                <option value="3">3 Attempts</option>
                <option value="5">5 Attempts (Recommended)</option>
                <option value="10">10 Attempts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
            <Key className="w-5 h-5 text-[#84CC16]" />
            <h3 className="text-base font-bold text-[#111111] dark:text-white">Admin Credential Management</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
              Current Password
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                New Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5">
                Confirm New Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 font-medium"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>
            <span className="text-xs text-slate-400 font-medium">Min. 8 characters</span>
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
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Security Configuration</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
