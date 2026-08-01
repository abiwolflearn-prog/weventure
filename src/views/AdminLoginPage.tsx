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
import { UserRole } from '../types';
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
      email: isSuperAdminDefault ? 'superadmin@weventurehub.com' : 'admin@weventurehub.com',
      password: 'SecurePassword123!',
    }
  });

  useEffect(() => {
    if (location.pathname.startsWith('/superadmin')) {
      setPortalMode('superadmin');
      setValue('email', 'superadmin@weventurehub.com');
    } else if (location.pathname.startsWith('/admin')) {
      setPortalMode('admin');
      setValue('email', 'admin@weventurehub.com');
    }
  }, [location.pathname, setValue]);

  const handleTabSwitch = (mode: 'admin' | 'superadmin') => {
    setPortalMode(mode);
    if (mode === 'superadmin') {
      setValue('email', 'superadmin@weventurehub.com');
      navigate('/superadmin', { replace: true });
    } else {
      setValue('email', 'admin@weventurehub.com');
      navigate('/admin', { replace: true });
    }
  };

  const onSubmit = async (data: LoginFields) => {
    dispatch(loginStart());
    try {
      const isSuper = portalMode === 'superadmin';
      const role = isSuper ? UserRole.SUPER_ADMIN : UserRole.TENANT_ADMIN;
      const targetDashboard = isSuper ? '/superadmin/dashboard' : '/admin/dashboard';

      const response = await axiosInstance.post('/auth/login', {
        email: data.email,
        password: data.password,
        tenantId: 'weventurehub',
        role,
      });

      const { user, token } = response.data.data;

      localStorage.setItem('weventure_jwt_token', token);
      localStorage.setItem('weventure_tenant_id', user.tenantId);

      dispatch(loginSuccess(user));
      navigate(targetDashboard);
    } catch (err: any) {
      dispatch(
        loginFailure(
          err.response?.data?.error?.message ||
            err.message ||
            'Authentication failed. Please verify credentials.'
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher for Unified Admin & Super Admin Portal */}
      <div className="bg-neutral-slate-100 p-1.5 rounded-2xl flex items-center space-x-1 border border-neutral-slate-200">
        <button
          type="button"
          onClick={() => handleTabSwitch('admin')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            portalMode === 'admin'
              ? 'bg-neutral-slate-900 text-white shadow-sm'
              : 'text-neutral-slate-600 hover:text-neutral-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />
          <span>Admin Portal</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('superadmin')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            portalMode === 'superadmin'
              ? 'bg-emerald-950 text-emerald-400 shadow-sm border border-emerald-800'
              : 'text-neutral-slate-600 hover:text-neutral-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Super Admin Portal</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          {portalMode === 'admin' ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 text-brand-accent border border-slate-800 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Super Admin Governance</span>
            </span>
          )}
        </div>

        <h1 className="font-display font-bold text-3xl text-neutral-slate-900">
          {portalMode === 'admin' ? 'Admin Portal Log In' : 'Super Admin Log In'}
        </h1>
        <p className="text-sm text-neutral-slate-500">
          {portalMode === 'admin'
            ? 'Operational interface for WeVentureHub Event Managers, Workspace Coordinators, and Administrative Staff.'
            : 'Executive control plane for platform configuration, RBAC governance, and enterprise audit controls.'}
        </p>
      </div>

      {portalMode === 'superadmin' && (
        <div className="p-3 bg-neutral-slate-900 text-neutral-slate-300 rounded-xl text-xs font-mono border border-neutral-slate-800 flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Strict governance zone. Super Admin credentials required.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold flex items-center space-x-2">
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
          <label className="flex items-center space-x-2 text-neutral-slate-600">
            <input type="checkbox" className="rounded text-brand-primary" />
            <span>Remember operational session</span>
          </label>
          <a href="#reset" className="text-brand-primary hover:underline">Forgot password?</a>
        </div>

        <Button
          type="submit"
          isLoading={loading}
          className={`w-full flex items-center justify-center space-x-2 text-white ${
            portalMode === 'superadmin'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
              : 'bg-neutral-slate-900 hover:bg-black'
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

      <div className="border-t border-neutral-slate-200 pt-5 text-center">
        <p className="text-xs text-neutral-slate-500">
          Looking for member workspace access?{' '}
          <Link to="/login" className="text-brand-primary hover:underline font-bold">
            Go to User Portal (/login)
          </Link>
        </p>
      </div>
    </div>
  );
}
