import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  Building, 
  User, 
  Palette, 
  Layers, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Sparkles, 
  Globe, 
  Mail, 
  Lock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAppDispatch } from '../store';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { axiosInstance } from '../lib/axiosInstance';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { SubscriptionPlan, UserRole } from '../types';

interface TeamInviteInput {
  email: string;
  role: UserRole;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  // Wizard Navigation Step
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form states and defaults
  const [adminDetails, setAdminDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [orgDetails, setOrgDetails] = useState({
    name: '',
    slug: '',
    description: '',
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
  });

  const [brandingDetails, setBrandingDetails] = useState({
    primaryColor: '#0284c7',
    secondaryColor: '#0f172a',
    themeMode: 'light' as 'light' | 'dark' | 'auto',
    logoUrl: '',
  });

  // Read initial plan from search parameter
  const initialPlan = (searchParams.get('plan') as SubscriptionPlan) || SubscriptionPlan.FREE;
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(initialPlan);

  const [teamInvites, setTeamInvites] = useState<TeamInviteInput[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.HUB_MEMBER);

  // Completion payload cached after successful API request
  const [provisionResult, setProvisionResult] = useState<any | null>(null);

  // Sync subdomain slug automatically when organization name is typed
  useEffect(() => {
    if (orgDetails.name && !orgDetails.slug) {
      const generatedSlug = orgDetails.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 15);
      setOrgDetails(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [orgDetails.name]);

  // Handle local dynamic additions to Team Invitations
  const handleAddInvite = () => {
    if (!inviteEmail) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      alert('Please supply a valid email address');
      return;
    }
    setTeamInvites(prev => [...prev, { email: inviteEmail, role: inviteRole }]);
    setInviteEmail('');
    setInviteRole(UserRole.HUB_MEMBER);
  };

  const handleRemoveInvite = (index: number) => {
    setTeamInvites(prev => prev.filter((_, idx) => idx !== index));
  };

  // Run the multi-step automatic organization creation, role seeding, trial setup, and team dispatches on backend
  const handleProvisionSubmit = async () => {
    setIsLoading(true);
    setApiError(null);

    const onboardingPayload = {
      organizationId: orgDetails.slug,
      organizationName: orgDetails.name,
      description: orgDetails.description,
      adminFirstName: adminDetails.firstName,
      adminLastName: adminDetails.lastName,
      adminEmail: adminDetails.email,
      selectedPlan,
      settings: {
        language: orgDetails.language,
        timezone: orgDetails.timezone,
        currency: orgDetails.currency,
      },
      branding: brandingDetails,
      teamInvitations: teamInvites,
    };

    try {
      const response = await axiosInstance.post('/onboarding/provision', onboardingPayload);
      const resultData = response.data.data;
      setProvisionResult(resultData);
      setStep(6); // Forward to completion success screen
    } catch (err: any) {
      setApiError(err.message || 'An unexpected error occurred during automatic provisioning.');
    } finally {
      setIsLoading(false);
    }
  };

  // Standard login using credentials created during onboarding to transition seamlessly to dashboard
  const handleEnterDashboard = async () => {
    if (!provisionResult) return;
    dispatch(loginStart());
    try {
      const response = await axiosInstance.post('/auth/login', {
        email: adminDetails.email,
        password: adminDetails.password,
        tenantId: provisionResult.tenantId,
      });

      const { user, token } = response.data.data;

      localStorage.setItem('weventure_jwt_token', token);
      localStorage.setItem('weventure_tenant_id', user.tenantId);

      dispatch(loginSuccess(user));
      navigate('/dashboard');
    } catch (err: any) {
      dispatch(loginFailure(err.message || 'Automatic login failed. Please sign in manually.'));
      navigate('/login');
    }
  };

  // Helper validation for steps
  const validateStep1 = () => {
    return adminDetails.firstName && adminDetails.lastName && adminDetails.email && adminDetails.password.length >= 8;
  };

  const validateStep2 = () => {
    return orgDetails.name && orgDetails.slug && /^[a-z0-9-]+$/.test(orgDetails.slug);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-2 space-y-6">
      {/* Step Indicators (Only displayed prior to completion screen) */}
      {step < 6 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Step {step} of 5: {
                step === 1 ? 'Admin Account' :
                step === 2 ? 'Organization Profile' :
                step === 3 ? 'Portal Branding' :
                step === 4 ? 'Plan Selection' :
                'Team Invitations'
              }
            </span>
            <span className="text-xs text-neutral-slate-400 font-mono">
              {Math.round((step / 5) * 100)}% Complete
            </span>
          </div>
          
          <div className="flex space-x-1 h-1.5 w-full bg-neutral-slate-200 rounded-full overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={`h-full flex-grow transition-all duration-300 ${
                  i <= step ? 'bg-brand-primary' : 'bg-neutral-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* API Failure Guard */}
      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium space-y-1">
          <span className="font-bold">Provisioning Failure:</span>
          <p>{apiError}</p>
        </div>
      )}

      {/* STEP 1: ADMIN ACCOUNT CREATION */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl text-neutral-slate-900">Create Operator Identity</h1>
            <p className="text-xs text-neutral-slate-500">
              You will be configured as the master Owner / Tenant Admin with full global privileges.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">First Name</label>
              <input 
                type="text"
                placeholder="Alex"
                value={adminDetails.firstName}
                onChange={e => setAdminDetails(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Last Name</label>
              <input 
                type="text"
                placeholder="Chen"
                value={adminDetails.lastName}
                onChange={e => setAdminDetails(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Corporate Email Address</label>
            <input 
              type="email"
              placeholder="alex.chen@work.com"
              value={adminDetails.email}
              onChange={e => setAdminDetails(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Secure Password</label>
            <input 
              type="password"
              placeholder="At least 8 characters"
              value={adminDetails.password}
              onChange={e => setAdminDetails(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
            {adminDetails.password && adminDetails.password.length < 8 && (
              <span className="text-[10px] text-rose-500 mt-1 block">Password must be at least 8 characters</span>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-neutral-slate-100">
            <Link to="/login" className="text-xs font-semibold text-neutral-slate-500 hover:underline">
              Back to Sign In
            </Link>
            <Button 
              disabled={!validateStep1()} 
              onClick={() => setStep(2)}
              className="px-6 text-xs"
            >
              <span>Next: Chapter Workspace Details</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: ORGANIZATION DETAILS */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl text-neutral-slate-900">Configure Chapter Workspace</h1>
            <p className="text-xs text-neutral-slate-500">
              Each WeVentureHub chapter or division runs on a dedicated, secure workspace node.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Chapter Division Name</label>
            <input 
              type="text"
              placeholder="e.g. WeVentureHub East Chapter"
              value={orgDetails.name}
              onChange={e => setOrgDetails(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Workspace ID Slug</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="east-chapter"
                value={orgDetails.slug}
                onChange={e => setOrgDetails(prev => ({ ...prev, slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, '') }))}
                className="w-full px-3 py-2 pr-32 text-sm rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <span className="absolute right-3.5 bottom-2.5 text-xs font-bold text-neutral-slate-400">
                .weventurehub.com
              </span>
            </div>
            <p className="text-[10px] text-neutral-slate-400 mt-1">Lowercased alphanumeric or hyphens only. Used as your dedicated chapter identifier.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Description (Optional)</label>
            <textarea 
              rows={3}
              placeholder="Brief summary of your coworking spaces or event networks..."
              value={orgDetails.description}
              onChange={e => setOrgDetails(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Language</label>
              <select 
                value={orgDetails.language}
                onChange={e => setOrgDetails(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 bg-white"
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Timezone</label>
              <select 
                value={orgDetails.timezone}
                onChange={e => setOrgDetails(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 bg-white"
              >
                <option value="UTC">UTC (Universal)</option>
                <option value="America/New_York">EST (New York)</option>
                <option value="Europe/London">GMT (London)</option>
                <option value="Asia/Tokyo">JST (Tokyo)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Currency</label>
              <select 
                value={orgDetails.currency}
                onChange={e => setOrgDetails(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-neutral-slate-100">
            <Button variant="secondary" onClick={() => setStep(1)} className="px-4 text-xs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Back</span>
            </Button>
            <Button 
              disabled={!validateStep2()} 
              onClick={() => setStep(3)}
              className="px-6 text-xs"
            >
              <span>Next: Custom Branding</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: PORTAL BRANDING ACCENTS */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl text-neutral-slate-900">Visual Brand Design</h1>
            <p className="text-xs text-neutral-slate-500">
              Personalize colors and styles. These settings can be updated anytime inside the Operator settings panel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-slate-500 mb-1.5">Primary Accent Color</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="color"
                    value={brandingDetails.primaryColor}
                    onChange={e => setBrandingDetails(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-10 border border-neutral-slate-200 rounded-lg cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={brandingDetails.primaryColor}
                    onChange={e => setBrandingDetails(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-grow px-3 py-2 text-sm rounded-lg border border-neutral-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-slate-500 mb-1.5">Secondary Accent Color</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="color"
                    value={brandingDetails.secondaryColor}
                    onChange={e => setBrandingDetails(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-10 h-10 border border-neutral-slate-200 rounded-lg cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={brandingDetails.secondaryColor}
                    onChange={e => setBrandingDetails(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="flex-grow px-3 py-2 text-sm rounded-lg border border-neutral-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Theme Preferences</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'auto'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setBrandingDetails(prev => ({ ...prev, themeMode: mode }))}
                      className={`py-1.5 rounded-lg text-xs font-bold border capitalize ${
                        brandingDetails.themeMode === mode 
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' 
                          : 'border-neutral-slate-200 bg-white text-neutral-slate-600'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Interactive Mock Preview card */}
            <div className="border border-neutral-slate-200 rounded-2xl bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-slate-400">Live Portal Preview</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                
                <div className="space-y-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="p-1.5 rounded-md text-white"
                      style={{ backgroundColor: brandingDetails.primaryColor }}
                    >
                      <Building className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs" style={{ color: brandingDetails.secondaryColor }}>
                      {orgDetails.name || 'Acme Space'}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-slate-50 border border-neutral-slate-200 rounded-xl space-y-2">
                    <div className="h-2 w-16 rounded bg-neutral-slate-300" />
                    <div className="h-1.5 w-full rounded bg-neutral-slate-200" />
                    <div className="h-1.5 w-1/2 rounded bg-neutral-slate-200" />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div 
                  className="w-full text-[10px] py-1.5 rounded-md text-white font-bold text-center"
                  style={{ backgroundColor: brandingDetails.primaryColor }}
                >
                  Action Button
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-neutral-slate-100">
            <Button variant="secondary" onClick={() => setStep(2)} className="px-4 text-xs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Back</span>
            </Button>
            <Button 
              onClick={() => setStep(4)}
              className="px-6 text-xs"
            >
              <span>Next: Plan Selection</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: SUBSCRIPTION PLAN */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl text-neutral-slate-900">Select Subscription Plan</h1>
            <p className="text-xs text-neutral-slate-500">
              All plans include an initial 14-day evaluation trial of standard and enterprise parameters.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              {
                id: SubscriptionPlan.FREE,
                name: 'Free Trial',
                price: '$0',
                limits: '5 Workspaces • 10 Live Events • 10 Users',
                features: ['Standard dashboard', 'Community help'],
              },
              {
                id: SubscriptionPlan.GROWTH,
                name: 'Growth Plan',
                price: '$49/mo',
                limits: '15 Workspaces • 30 Live Events • 25 Users',
                features: ['Email Branding', 'Advanced Analytics'],
              },
              {
                id: SubscriptionPlan.ENTERPRISE,
                name: 'Pro Enterprise',
                price: '$149/mo',
                limits: '100 Workspaces • 500 Events • 1000 Users',
                features: ['Full customized portal', 'Priority API SLA'],
              },
            ].map((planOption) => (
              <div 
                key={planOption.id}
                onClick={() => setSelectedPlan(planOption.id)}
                className={`border rounded-2xl p-5 cursor-pointer flex flex-col justify-between transition-all ${
                  selectedPlan === planOption.id 
                    ? 'border-brand-primary ring-2 ring-brand-primary/10 bg-brand-primary/5 shadow-md' 
                    : 'border-neutral-slate-200 bg-white hover:border-neutral-slate-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-neutral-slate-900">{planOption.name}</span>
                    {selectedPlan === planOption.id && (
                      <CheckCircle className="w-4.5 h-4.5 text-brand-primary shrink-0" />
                    )}
                  </div>
                  <span className="text-xl font-extrabold text-neutral-slate-900">{planOption.price}</span>
                  <p className="text-[10px] text-brand-primary font-semibold mt-2">{planOption.limits}</p>
                </div>

                <div className="pt-4 border-t border-neutral-slate-100 mt-4">
                  <ul className="space-y-1">
                    {planOption.features.map((f, fIdx) => (
                      <li key={fIdx} className="text-[10px] text-neutral-slate-500 flex items-center space-x-1.5">
                        <span className="w-1 h-1 rounded-full bg-brand-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-neutral-slate-100">
            <Button variant="secondary" onClick={() => setStep(3)} className="px-4 text-xs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Back</span>
            </Button>
            <Button 
              onClick={() => setStep(5)}
              className="px-6 text-xs"
            >
              <span>Next: Team Invitations</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: TEAM INVITATIONS */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl text-neutral-slate-900">Invite Your Core Team</h1>
            <p className="text-xs text-neutral-slate-500">
              Prepare invitations for your staff operators or corporate administrators to join your workspace boundary.
            </p>
          </div>

          <div className="p-4 bg-white border border-neutral-slate-200 rounded-2xl flex items-end space-x-4">
            <div className="flex-grow">
              <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Invite Member Email</label>
              <input 
                type="email"
                placeholder="colleague@work.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-slate-500 mb-1">Assigned Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as UserRole)}
                className="px-3 py-2 text-sm rounded-lg border border-neutral-slate-200 bg-white"
              >
                <option value={UserRole.STAFF}>Staff Manager</option>
                <option value={UserRole.HUB_MEMBER}>Hub Member</option>
                <option value={UserRole.TENANT_ADMIN}>Co-Administrator</option>
              </select>
            </div>

            <Button type="button" onClick={handleAddInvite} className="px-4 text-xs h-[38px]">
              <Plus className="w-4 h-4 mr-1" />
              <span>Add</span>
            </Button>
          </div>

          {/* Invitation Stack list */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-slate-500">Invitation Pipeline ({teamInvites.length})</span>
            {teamInvites.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-neutral-slate-200 rounded-2xl text-xs text-neutral-slate-400">
                No outbound invitations queued yet. You can invite team members directly inside the portal later.
              </div>
            ) : (
              <div className="border border-neutral-slate-200 rounded-xl divide-y divide-neutral-slate-200 bg-white overflow-hidden">
                {teamInvites.map((invite, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4.5 h-4.5 text-neutral-slate-400" />
                      <span className="font-semibold text-neutral-slate-800">{invite.email}</span>
                      <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-bold tracking-wider uppercase">
                        {invite.role}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveInvite(idx)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-neutral-slate-100">
            <Button variant="secondary" onClick={() => setStep(4)} className="px-4 text-xs" disabled={isLoading}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Back</span>
            </Button>
            <Button 
              onClick={handleProvisionSubmit}
              className="px-8 text-xs font-bold"
              isLoading={isLoading}
            >
              <span>Finish & Provision Organization</span>
              <CheckCircle className="w-4.5 h-4.5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: COMPLETION SCREEN & IMMEDIATE PROVISIONING SUCCESS */}
      {step === 6 && provisionResult && (
        <div className="bg-white border border-neutral-slate-200 rounded-3xl p-10 text-center space-y-8 shadow-sm">
          <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-500">
            <CheckCircle className="w-14 h-14" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-bold text-3xl text-neutral-slate-900">Provisioning Successful!</h1>
            <p className="text-sm text-neutral-slate-500 max-w-md mx-auto">
              Your self-service workspace hub is now ready. We have configured logical isolation blocks, seeded initial workspaces, and dispatched team invites.
            </p>
          </div>

          {/* Details Recap Grid */}
          <div className="max-w-md mx-auto bg-neutral-slate-50 border border-neutral-slate-200 rounded-2xl p-6 text-left divide-y divide-neutral-slate-200 space-y-3">
            <div className="flex justify-between items-center pb-3 text-xs">
              <span className="font-semibold text-neutral-slate-500">Organization Name</span>
              <span className="font-bold text-neutral-slate-900">{orgDetails.name}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 text-xs">
              <span className="font-semibold text-neutral-slate-500">Dedicated Space Slug</span>
              <span className="font-mono font-bold text-brand-primary">{provisionResult.tenantId}</span>
            </div>

            <div className="flex justify-between items-center py-3 text-xs">
              <span className="font-semibold text-neutral-slate-500">Active Subscription</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                {selectedPlan} Trial Active
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 text-xs">
              <span className="font-semibold text-neutral-slate-500">Core Seeding</span>
              <span className="font-bold text-emerald-600">2 Conference & Hot Desks Created</span>
            </div>

            {provisionResult.sentInvitations && provisionResult.sentInvitations.length > 0 && (
              <div className="pt-3 text-xs space-y-1.5">
                <span className="font-semibold text-neutral-slate-500 block">Sent Invitations ({provisionResult.sentInvitations.length})</span>
                <div className="flex flex-wrap gap-1">
                  {provisionResult.sentInvitations.map((inv: any, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-neutral-slate-200 text-neutral-slate-700 text-[10px] font-mono">
                      {inv.email}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 max-w-md mx-auto pt-4">
            <Button onClick={handleEnterDashboard} className="w-full py-3 text-sm font-bold shadow-md">
              <span>Enter Workspace Portal</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-[11px] text-neutral-slate-400">
              Clicking above will dynamically sign you in as <span className="font-bold">{adminDetails.email}</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
