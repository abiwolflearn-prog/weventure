import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, ShieldAlert, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { axiosInstance } from '../lib/axiosInstance';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryEmail = searchParams.get('email') || '';
  const queryToken = searchParams.get('token') || '';
  const queryCode = searchParams.get('code') || searchParams.get('otp') || '';

  const [email, setEmail] = useState(queryEmail);
  const [code, setCode] = useState(queryCode);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-verify if token or code & email are present in query params
  useEffect(() => {
    if ((queryToken || queryCode) && queryEmail) {
      handleVerify(queryToken, queryCode, queryEmail);
    }
  }, [queryToken, queryCode, queryEmail]);

  const handleVerify = async (tokenVal?: string, codeVal?: string, emailVal?: string) => {
    const targetEmail = emailVal || email;
    const targetCode = codeVal || code;
    const targetToken = tokenVal || queryToken;

    if (!targetCode && !targetToken) {
      setErrorMsg('Please enter your 6-digit verification code or click the verification link in your email.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await axiosInstance.post('/auth/verify-email', {
        email: targetEmail,
        code: targetCode,
        token: targetToken,
      });

      if (response.data?.success) {
        setIsVerified(true);
        setSuccessMsg(response.data?.message || 'Email verified successfully! You may now log in.');
      } else {
        setErrorMsg(response.data?.error?.message || 'Verification failed. Please check your code and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Verification failed. Please check your code or token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address to resend verification.');
      return;
    }

    setIsResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await axiosInstance.post('/auth/resend-verification', { email });
      setSuccessMsg(response.data?.message || 'A new verification email has been sent. Please check your inbox.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#84CC16]/10 text-[#65A30D] dark:text-[#84CC16] border border-[#84CC16]/20 text-xs font-bold uppercase tracking-wider mb-1">
          <Mail className="w-3.5 h-3.5 text-[#84CC16]" />
          <span>Email Verification</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white tracking-tight">
          Verify Your Email
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Complete account activation to log in and access WeVentureHub services.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {isVerified ? (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Email Address Confirmed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your account is fully verified and ready. You can now log in using your credentials.
            </p>
          </div>
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-[#84CC16] hover:bg-[#65A30D] text-slate-900 font-bold py-3 text-sm rounded-xl shadow-md flex items-center justify-center space-x-2"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Email Address"
            id="verify-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@weventurehub.com"
          />

          <Input
            label="6-Digit Verification Code / OTP"
            id="verify-code-input"
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />

          <Button
            onClick={() => handleVerify()}
            disabled={isLoading}
            className="w-full bg-[#84CC16] hover:bg-[#65A30D] text-slate-900 font-bold py-3 text-sm rounded-xl shadow-md flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Account...</span>
              </>
            ) : (
              <>
                <span>Confirm Email Verification</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="pt-2 text-center flex items-center justify-between text-xs text-slate-500">
            <span>Didn't receive a code?</span>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="font-bold text-[#65A30D] dark:text-[#84CC16] hover:underline inline-flex items-center space-x-1"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Resending...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <Link to="/login" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline">
              Already verified? Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
