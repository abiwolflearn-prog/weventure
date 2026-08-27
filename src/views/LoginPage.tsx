import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, ShieldAlert, ArrowRight } from 'lucide-react';
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

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { loading, error } = useAppSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginFields) => {
    dispatch(loginStart());
    try {
      const response = await axiosInstance.post('/auth/login', {
        email: data.email,
        password: data.password,
        portal: 'user',
      });

      const { user, token } = response.data.data;
      
      localStorage.setItem('weventure_jwt_token', token);
      localStorage.setItem('weventure_tenant_id', user.tenantId || 'weventurehub');

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
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#84CC16]/10 text-[#65A30D] dark:text-[#84CC16] border border-[#84CC16]/20 text-xs font-bold uppercase tracking-wider mb-1">
          <User className="w-3.5 h-3.5 text-[#84CC16]" />
          <span>User & Member Portal</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] animate-pulse" />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white tracking-tight">
          User Log In
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Welcome back! Access your WeVentureHub workspaces, registered events, and member dashboard.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {error.toLowerCase().includes('verify your email') && (
            <div className="pt-1 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Need to confirm your email address?</span>
              <Link to="/verify-email" className="font-bold text-[#65A30D] dark:text-[#84CC16] hover:underline">
                Verify Email Now &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('email')}
          label="Email Address"
          id="email"
          type="email"
          error={errors.email?.message}
          placeholder="your.email@example.com"
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
          <label className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 cursor-pointer">
            <input type="checkbox" className="rounded accent-[#84CC16] text-[#84CC16] focus:ring-[#84CC16]" />
            <span>Remember this device</span>
          </label>
          <a href="#reset" className="text-[#65A30D] dark:text-[#84CC16] hover:underline font-bold">Forgot password?</a>
        </div>

        <Button 
          type="submit" 
          isLoading={loading} 
          className="w-full flex items-center justify-center space-x-2 bg-[#84CC16] hover:bg-[#74b816] text-[#0F172A] font-extrabold shadow-md shadow-[#84CC16]/20 transition-all cursor-pointer h-12 rounded-[14px]"
        >
          <span>Sign In to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Don&apos;t have a member account?{' '}
          <Link to="/register" className="text-[#65A30D] dark:text-[#84CC16] hover:underline font-extrabold">
            Register Member Account
          </Link>
        </p>
      </div>
    </div>
  );
}
