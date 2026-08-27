import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Lock, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { axiosInstance } from '../lib/axiosInstance';

const loginSchema = z.object({
  email: z.string().email({ message: 'Must be a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  // Determine portal mode from current path (/superadmin vs /admin)
  const isSuperAdminDefault = location.pathname.startsWith('/superadmin');
  const [portalMode, setPortalMode] = useState<'admin' | 'superadmin'>(
    isSuperAdminDefault ? 'superadmin' : 'admin'
  );

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  useEffect(() => {
    if (location.pathname.startsWith('/superadmin')) {
      setPortalMode('superadmin');
    } else if (location.pathname.startsWith('/admin')) {
      setPortalMode('admin');
    }
  }, [location.pathname]);

  const handleTabSwitch = (mode: 'admin' | 'superadmin') => {
    setPortalMode(mode);
    if (mode === 'superadmin') {
      navigate('/superadmin', { replace: true });
    } else {
      navigate('/admin', { replace: true });
    }
  };

  const onSubmit = async (data: LoginFields) => {
    dispatch(loginStart());
    try {
      const isSuper = portalMode === 'superadmin';
      const targetDashboard = isSuper ? '/superadmin/dashboard' : '/admin/dashboard';

      const response = await axiosInstance.post('/auth/login', {
        email: data.email,
        password: data.password,
        portal: portalMode,
      });

      const { user, token } = response.data.data;

      localStorage.setItem('weventure_jwt_token', token);
      localStorage.setItem('weventure_tenant_id', user.tenantId || 'weventurehub');

      dispatch(loginSuccess(user));
      navigate(targetDashboard);
    } catch (err: any) {
      dispatch(
        loginFailure(
          err.response?.data?.error?.message ||
            err.message ||
            'Authentication failed. Please verify your credentials.'
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher for Unified Admin & Super Admin Portal */}
      <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex items-center space-x-1 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleTabSwitch('admin')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
            portalMode === 'admin'
              ? 'bg-[#0F172A] text-white shadow-md border border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#84CC16]" />
          <span>Admin Portal</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('superadmin')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
            portalMode === 'superadmin'
              ? 'bg-slate-950 text-[#84CC16] shadow-md border border-[#84CC16]/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 text-[#84CC16]" />
          <span>Super Admin Portal</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          {portalMode === 'admin' ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0F172A] text-[#84CC16] border border-slate-800 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950 text-[#84CC16] border border-[#84CC16]/40 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Super Admin Governance</span>
            </span>
          )}
        </div>

        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white tracking-tight">
          {portalMode === 'admin' ? 'Admin Portal Log In' : 'Super Admin Log In'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {portalMode === 'admin'
            ? 'Operational interface for WeVentureHub Event Managers, Workspace Coordinators, and Administrative Staff.'
            : 'Executive control plane for platform configuration, RBAC governance, and enterprise audit controls.'}
        </p>
      </div>

      {portalMode === 'superadmin' && (
        <div className="p-3.5 bg-[#0F172A] text-slate-200 rounded-xl text-xs font-mono border border-slate-800 flex items-center space-x-2.5">
          <Cpu className="w-4 h-4 text-[#84CC16] shrink-0" />
          <span>Strict governance zone. Super Admin credentials required.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('email')}
          label={portalMode === 'admin' ? 'Admin Email' : 'Super Admin Email'}
          id="admin-portal-email"
          type="email"
          error={errors.email?.message}
          placeholder={portalMode === 'admin' ? 'admin@weventurehub.com' : 'superadmin@weventurehub.com'}
        />

        <Input
          {...register('password')}
          label="Password"
          id="admin-portal-password"
          type="password"
          error={errors.password?.message}
          placeholder="••••••••"
        />

        <div className="flex items-center justify-between text-xs font-semibold">
          <label className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 cursor-pointer">
            <input type="checkbox" className="rounded accent-[#84CC16] text-[#84CC16] focus:ring-[#84CC16]" />
            <span>Remember operational session</span>
          </label>
          <a href="#reset" className="text-[#65A30D] dark:text-[#84CC16] hover:underline font-bold">Forgot password?</a>
        </div>

        <Button
          type="submit"
          isLoading={loading}
          className={`w-full flex items-center justify-center space-x-2 font-extrabold transition-all shadow-md h-12 rounded-[14px] cursor-pointer ${
            portalMode === 'superadmin'
              ? 'bg-[#84CC16] hover:bg-[#74b816] text-[#0F172A] shadow-[#84CC16]/20'
              : 'bg-[#0F172A] hover:bg-slate-900 text-white border border-slate-800'
          }`}
        >
          <span>
            {portalMode === 'admin'
              ? 'Sign In to Admin Dashboard'
              : 'Authorize Super Admin Dashboard'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-5 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Looking for member workspace access?{' '}
          <Link to="/login" className="text-[#65A30D] dark:text-[#84CC16] hover:underline font-extrabold">
            Go to User Portal (/login)
          </Link>
        </p>
      </div>
    </div>
  );
}
