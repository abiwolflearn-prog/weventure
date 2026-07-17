import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod'; // We'll write/mock a simplified form setup or write a neat schema
import { z } from 'zod';
import { Building, Key, Mail, ShieldAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { UserRole } from '../types';
import { axiosInstance } from '../lib/axiosInstance';

const loginSchema = z.object({
  email: z.string().email({ message: 'Must be a valid enterprise email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  tenantId: z.string().min(2, { message: 'Tenant identifier must be supplied' }),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver ? zodResolver(loginSchema) : undefined, // fallback safety if resolver issues
    defaultValues: {
      email: 'alex.chen@work.com',
      password: 'SecurePassword123!',
      tenantId: 'weventurehub',
    }
  });

  const onSubmit = async (data: LoginFields) => {
    dispatch(loginStart());
    try {
      // Perform actual full-stack API login
      const response = await axiosInstance.post('/auth/login', {
        email: data.email,
        password: data.password,
        tenantId: data.tenantId,
      });

      const { user, token } = response.data.data;
      
      // Store token securely on client for interceptor injection
      localStorage.setItem('weventure_jwt_token', token);
      localStorage.setItem('weventure_tenant_id', user.tenantId);

      dispatch(loginSuccess(user));
      navigate('/dashboard');
    } catch (err: any) {
      dispatch(loginFailure(err.message || 'Authentication unsuccessful.'));
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    dispatch(loginStart());
    try {
      const email = role === UserRole.TENANT_ADMIN ? 'admin@weventurehub.com' : 'staff@weventurehub.com';
      
      // Perform actual full-stack API login with requested bypass role
      const response = await axiosInstance.post('/auth/login', {
        email,
        password: 'SecurePassword123!',
        tenantId: 'weventurehub',
        role,
      });

      const { user, token } = response.data.data;

      localStorage.setItem('weventure_jwt_token', token);
      localStorage.setItem('weventure_tenant_id', user.tenantId);

      dispatch(loginSuccess(user));
      navigate('/dashboard');
    } catch (err: any) {
      dispatch(loginFailure(err.message || 'Developer access bypass failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display font-bold text-3xl">Portal Log In</h1>
        <p className="text-sm text-neutral-slate-500">
          Access your workspaces and registered events instantly.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('email')}
          label="Enterprise Email"
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

        <Button type="submit" isLoading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      {/* Developer quick accessibility overrides */}
      <div className="border-t border-neutral-slate-200 pt-6 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-slate-400 block text-center">
          Developer Access Bypasses
        </span>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => handleQuickLogin(UserRole.TENANT_ADMIN)}
            className="text-[11px]"
          >
            Log in as Admin
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => handleQuickLogin(UserRole.STAFF)}
            className="text-[11px]"
          >
            Log in as Staff
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-neutral-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-brand-primary hover:underline font-semibold">
          Register Member Account
        </Link>
      </p>
    </div>
  );
}
