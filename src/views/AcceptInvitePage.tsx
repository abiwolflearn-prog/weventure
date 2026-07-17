import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, ShieldCheck, ArrowRight, Loader2, User, Lock } from 'lucide-react';
import { axiosInstance } from '../lib/axiosInstance';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User input states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Invitation validation token is missing from the URL.');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/onboarding/invitations/token/${token}`);
        setInvitation(response.data.data);
      } catch (err: any) {
        setError(err.message || 'Invitation is invalid, has expired, or was revoked.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !password) return;
    if (password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/onboarding/invitations/accept', {
        token,
        firstName,
        lastName,
        password
      });
      setAcceptedSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process invitation acceptance.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
        <p className="text-sm text-neutral-slate-500 font-medium">Validating workspace invite token...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white border border-neutral-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-bold text-xl text-neutral-slate-900">Invite Unresolved</h1>
          <p className="text-xs text-neutral-slate-500 leading-relaxed">{error}</p>
        </div>
        <Link to="/login">
          <Button variant="secondary" className="w-full text-xs">
            Return to Login Panel
          </Button>
        </Link>
      </div>
    );
  }

  if (acceptedSuccess) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white border border-neutral-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-bold text-xl text-neutral-slate-900">Welcome to the Team!</h1>
          <p className="text-xs text-neutral-slate-500 leading-relaxed">
            Your membership account was successfully provisioned under the organization space. You can now access your operator workspaces.
          </p>
        </div>
        <Link to={`/login?email=${encodeURIComponent(invitation.email)}&tenantId=${invitation.tenantId}`}>
          <Button className="w-full text-xs">
            <span>Log In to Workspace Portal</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-neutral-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-brand-primary/10 rounded-full text-brand-primary">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="font-display font-bold text-2xl text-neutral-slate-900">Join Workspace Team</h1>
        <p className="text-xs text-neutral-slate-500">
          You have been invited to join the <span className="font-bold text-neutral-slate-800">{invitation.tenantId}</span> organization as a <span className="font-bold text-brand-primary tracking-wide uppercase text-[10px] bg-brand-primary/10 px-2 py-0.5 rounded">{invitation.role}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-neutral-slate-50 border border-neutral-slate-200 rounded-xl flex items-center space-x-3 text-xs">
          <Mail className="w-4.5 h-4.5 text-neutral-slate-400 shrink-0" />
          <div>
            <span className="text-neutral-slate-400 block font-semibold">Your Invited Email</span>
            <span className="font-bold text-neutral-slate-800">{invitation.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">First Name</label>
            <input 
              type="text"
              required
              placeholder="e.g. Jean"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Last Name</label>
            <input 
              type="text"
              required
              placeholder="e.g. Dupont"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Set Password</label>
          <input 
            type="password"
            required
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
          />
          {password && password.length < 8 && (
            <span className="text-[10px] text-rose-500 mt-1 block">Password must be at least 8 characters</span>
          )}
        </div>

        <Button type="submit" isLoading={submitting} disabled={!firstName || !lastName || !password || password.length < 8} className="w-full text-xs font-bold py-2.5">
          Accept & Deploy Access Profile
        </Button>
      </form>
    </div>
  );
}
