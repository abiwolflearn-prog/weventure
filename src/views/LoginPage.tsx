import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Key, Mail, ShieldAlert, ArrowRight } from 'lucide-react';
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

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { loading, error } = useAppSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'alex.chen@work.com',
      password: 'SecurePassword123!',
    }
  });

  const onSubmit = async (data: LoginFields) => {
    dispatch(loginStart());
    try {
      // Authenticate via User Portal endpoint
      const response = await axiosInstance.post('/auth/login', {
        email: data.email,
        password: data.password,
        tenantId: 'weventurehub',
        role: UserRole.HUB_MEMBER,
      });

      const { user, token } = response.data.data;
      
      localStorage.setItem('weventure_jwt_token', token);
      localStorage.setItem('weventure_tenant_id', user.tenantId);

      dispatch(loginSuccess(user));
      
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      dispatch(loginFailure(err.response?.data?.error?.message || err.message || 'User authentication failed. Check credentials.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-2">
          <User className="w-3.5 h-3.5" />
          <span>User & Member Portal</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-neutral-slate-900">User Login</h1>
        <p className="text-sm text-neutral-slate-500">
          Welcome back! Access your WeVentureHub workspaces, registered events, and member dashboard.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('email')}
          label="Email Address"
          id="email"
          type="email"
          error={errors.email?.message}
          placeholder="user@weventurehub.com"
        />

        <Input
          {...register('password')}
          label="Password"
          id="password"
          type="password"
          error={errors.password?.message}
          placeholder="••••••••"
        />

        <div className="flex items-center justify-between text-xs font-semibold">
          <label className="flex items-center space-x-2 text-neutral-slate-600">
            <input type="checkbox" className="rounded text-brand-primary" />
            <span>Remember this device</span>
          </label>
          <a href="#reset" className="text-brand-primary hover:underline">Forgot password?</a>
        </div>

        <Button type="submit" isLoading={loading} className="w-full flex items-center justify-center space-x-2">
          <span>Sign In to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="border-t border-neutral-slate-200 pt-5 space-y-3">
        <p className="text-center text-xs text-neutral-slate-500">
          Don&apos;t have a member account?{' '}
          <Link to="/register" className="text-brand-primary hover:underline font-bold">
            Register Member Account
          </Link>
        </p>

        <div className="flex justify-center space-x-4 text-xs font-medium text-neutral-slate-400">
          <Link to="/admin" className="hover:text-neutral-slate-700 transition">
            Admin Portal (/admin)
          </Link>
          <span>•</span>
          <Link to="/superadmin" className="hover:text-neutral-slate-700 transition">
            Super Admin Portal (/superadmin)
          </Link>
        </div>
      </div>
    </div>
  );
}

