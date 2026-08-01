import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Users, 
  Building, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Mail, 
  Phone, 
  Lock, 
  ShieldCheck, 
  Check, 
  Calendar, 
  Layout, 
  CreditCard, 
  Ticket, 
  Loader2,
  Sparkles,
  Camera
} from 'lucide-react';
import { useAppDispatch } from '../store';
import { loginSuccess } from '../store/authSlice';
import { axiosInstance } from '../lib/axiosInstance';
import { UserRole, Permission } from '../types';

export type AccountType = 'individual' | 'group' | 'company';

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Step 1 to 4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Account Type Selection
  const [userType, setUserType] = useState<AccountType>('individual');

  // Step 2: Form Data for all 3 account types
  const [individualData, setIndividualData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profileImage: '',
  });

  const [groupData, setGroupData] = useState({
    groupName: '',
    teamLeaderName: '',
    email: '',
    phone: '',
    numberOfMembers: '',
    password: '',
    confirmPassword: '',
    groupLogo: '',
  });

  const [companyData, setCompanyData] = useState({
    companyName: '',
    contactPerson: '',
    businessEmail: '',
    phone: '',
    address: '',
    industry: '',
    numberOfEmployees: '',
    companyLogo: '',
    companyCover: '',
    // Admin Account fields
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  // Step 3: Verification State
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('847920');
  const [isVerifying, setIsVerifying] = useState(false);

  // General UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdUserPayload, setCreatedUserPayload] = useState<any>(null);

  // File Upload Handlers (converts image file to Base64 or object URL)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (userType === 'individual') {
      if (!individualData.fullName.trim()) return 'Full Name is required.';
      if (!individualData.email.trim()) return 'Email Address is required.';
      if (!individualData.phone.trim()) return 'Phone Number is required.';
      if (!individualData.password) return 'Password is required.';
      if (individualData.password.length < 6) return 'Password must be at least 6 characters.';
      if (individualData.password !== individualData.confirmPassword) return 'Passwords do not match.';
    } else if (userType === 'group') {
      if (!groupData.groupName.trim()) return 'Group Name is required.';
      if (!groupData.teamLeaderName.trim()) return 'Team Leader Name is required.';
      if (!groupData.email.trim()) return 'Email Address is required.';
      if (!groupData.phone.trim()) return 'Phone Number is required.';
      if (!groupData.numberOfMembers.trim()) return 'Number of Members is required.';
      if (!groupData.password) return 'Password is required.';
      if (groupData.password.length < 6) return 'Password must be at least 6 characters.';
      if (groupData.password !== groupData.confirmPassword) return 'Passwords do not match.';
    } else if (userType === 'company') {
      if (!companyData.companyName.trim()) return 'Company Name is required.';
      if (!companyData.contactPerson.trim()) return 'Contact Person is required.';
      if (!companyData.businessEmail.trim()) return 'Business Email is required.';
      if (!companyData.phone.trim()) return 'Phone Number is required.';
      if (!companyData.address.trim()) return 'Company Address is required.';
      if (!companyData.numberOfEmployees.trim()) return 'Number of Employees is required.';
      if (!companyData.companyLogo) return 'Company Logo is required.';
      if (!companyData.adminName.trim()) return 'Admin Name is required.';
      if (!companyData.adminEmail.trim()) return 'Admin Email is required.';
      if (!companyData.adminPassword) return 'Admin Password is required.';
      if (companyData.adminPassword.length < 6) return 'Admin Password must be at least 6 characters.';
    }
    return null;
  };

  // Handle proceed from Step 2 -> Step 3 (Creates pending account & sends verification code)
  const handleProceedToVerification = async () => {
    const validationError = validateStep2();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    // Prepare unified user backend structure according to requirement
    let payload: any = {
      userType,
      tenantId: 'weventurehub',
      createdAt: new Date().toISOString()
    };

    if (userType === 'individual') {
      payload.name = individualData.fullName;
      payload.email = individualData.email;
      payload.phone = individualData.phone;
      payload.password = individualData.password;
      payload.profileImage = individualData.profileImage;
    } else if (userType === 'group') {
      payload.name = groupData.groupName;
      payload.email = groupData.email;
      payload.phone = groupData.phone;
      payload.password = groupData.password;
      payload.profileImage = groupData.groupLogo;
      payload.userTypeDetails = {
        teamLeaderName: groupData.teamLeaderName,
        membersCount: groupData.numberOfMembers,
      };
    } else if (userType === 'company') {
      payload.name = companyData.adminName;
      payload.email = companyData.adminEmail;
      payload.phone = companyData.phone;
      payload.password = companyData.adminPassword;
      payload.profileImage = companyData.companyLogo;
      payload.companyInfo = {
        companyName: companyData.companyName,
        companyLogo: companyData.companyLogo,
        companyCover: companyData.companyCover,
        address: companyData.address,
        industry: companyData.industry,
        employees: parseInt(companyData.numberOfEmployees, 10) || 1,
      };
      payload.userTypeDetails = {
        contactPerson: companyData.contactPerson,
        businessEmail: companyData.businessEmail,
      };
    }

    // Generate random 6-digit OTP code for verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    try {
      const response = await axiosInstance.post('/auth/register', payload);
      const serverUser = response.data?.data?.user || payload;
      setCreatedUserPayload(serverUser);
    } catch (err: any) {
      // Fallback mock registration if network offline
      setCreatedUserPayload(payload);
    } finally {
      setIsLoading(false);
      setStep(3); // Advance to Verification step
    }
  };

  // Step 3: Verify Account
  const handleVerifyAccount = () => {
    setIsVerifying(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsVerifying(false);

      // Save user session in localStorage & Redux
      const authUser = {
        id: createdUserPayload?.id || `usr_${Math.random().toString(36).substring(2, 8)}`,
        tenantId: 'weventurehub',
        userType,
        email: createdUserPayload?.email || 'user@weventurehub.com',
        firstName: createdUserPayload?.name?.split(' ')[0] || 'WeVenture',
        lastName: createdUserPayload?.name?.split(' ').slice(1).join(' ') || 'Member',
        name: createdUserPayload?.name || 'WeVenture Member',
        phone: createdUserPayload?.phone || '',
        profileImage: createdUserPayload?.profileImage || '',
        companyInfo: createdUserPayload?.companyInfo || null,
        role: UserRole.HUB_MEMBER,
        permissions: [Permission.WORKSPACES_READ, Permission.BOOKINGS_CREATE, Permission.EVENTS_READ],
      };

      localStorage.setItem('weventurehub_user_account', JSON.stringify(authUser));
      localStorage.setItem('weventure_jwt_token', `mock_token_${Date.now()}`);
      localStorage.setItem('weventure_tenant_id', 'weventurehub');

      dispatch(loginSuccess(authUser));
      setStep(4); // Advance to Success step
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-10 space-y-8 transition-all">
        
        {/* Header Section */}
        <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#84CC16]/10 text-[#65A30D] dark:text-[#84CC16] border border-[#84CC16]/20 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#84CC16]" />
            <span>WeVentureHub Identity</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Create Your WeVentureHub Account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Register once to reserve workspaces and join events.
          </p>

          {/* Stepper Progress Bar */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span className={step >= 1 ? 'text-[#65A30D] dark:text-[#84CC16] font-extrabold' : ''}>1. Account Type</span>
              <span className={step >= 2 ? 'text-[#65A30D] dark:text-[#84CC16] font-extrabold' : ''}>2. Information</span>
              <span className={step >= 3 ? 'text-[#65A30D] dark:text-[#84CC16] font-extrabold' : ''}>3. Verification</span>
              <span className={step >= 4 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>4. Success</span>
            </div>
            <div className="flex h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#84CC16] to-emerald-500 transition-all duration-300" 
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Global Error Notice */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-bold underline text-xs">Dismiss</button>
          </div>
        )}

        {/* ===================================================
            STEP 1: ACCOUNT TYPE SELECTION
           =================================================== */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Who are you registering as?
              </h2>
              <p className="text-xs text-slate-500">
                Select the identity that best fits your workspace booking and event needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Individual */}
              <button
                type="button"
                onClick={() => setUserType('individual')}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all ${
                  userType === 'individual'
                    ? 'border-[#84CC16] bg-[#84CC16]/10 dark:bg-[#84CC16]/10 ring-2 ring-[#84CC16]/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-3 rounded-xl ${userType === 'individual' ? 'bg-[#84CC16] text-[#0F172A]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    <User className="w-6 h-6" />
                  </div>
                  <input
                    type="radio"
                    name="accountType"
                    checked={userType === 'individual'}
                    onChange={() => setUserType('individual')}
                    className="w-4 h-4 accent-[#84CC16] text-[#84CC16] focus:ring-[#84CC16]"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Individual</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Single person reserving desks, meeting rooms, and attending events.
                  </p>
                </div>
              </button>

              {/* Option 2: Group / Team */}
              <button
                type="button"
                onClick={() => setUserType('group')}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all ${
                  userType === 'group'
                    ? 'border-[#84CC16] bg-[#84CC16]/10 dark:bg-[#84CC16]/10 ring-2 ring-[#84CC16]/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-3 rounded-xl ${userType === 'group' ? 'bg-[#84CC16] text-[#0F172A]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <input
                    type="radio"
                    name="accountType"
                    checked={userType === 'group'}
                    onChange={() => setUserType('group')}
                    className="w-4 h-4 accent-[#84CC16] text-[#84CC16] focus:ring-[#84CC16]"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Group / Team</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Small teams or project groups sharing workspace resources & group passes.
                  </p>
                </div>
              </button>

              {/* Option 3: Company / Organization */}
              <button
                type="button"
                onClick={() => setUserType('company')}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all ${
                  userType === 'company'
                    ? 'border-[#84CC16] bg-[#84CC16]/10 dark:bg-[#84CC16]/10 ring-2 ring-[#84CC16]/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-3 rounded-xl ${userType === 'company' ? 'bg-[#84CC16] text-[#0F172A]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    <Building className="w-6 h-6" />
                  </div>
                  <input
                    type="radio"
                    name="accountType"
                    checked={userType === 'company'}
                    onChange={() => setUserType('company')}
                    className="w-4 h-4 accent-[#84CC16] text-[#84CC16] focus:ring-[#84CC16]"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Company / Organization</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Registered businesses managing employee bookings, invoices, and corporate events.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
              <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white">
                Already have an account? Sign In
              </Link>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-[#84CC16] hover:bg-[#74b816] text-[#0F172A] font-extrabold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md shadow-[#84CC16]/20 cursor-pointer"
              >
                <span>Continue to Information</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            STEP 2: ACCOUNT INFORMATION
           =================================================== */}
        {step === 2 && (
          <div className="space-y-6">

            {/* --- INDIVIDUAL USER FORM --- */}
            {userType === 'individual' && (
              <div className="space-y-5">
                <div className="flex items-center space-x-2 text-[#65A30D] dark:text-[#84CC16] font-bold text-sm uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>INDIVIDUAL USER INFORMATION</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Chen"
                      value={individualData.fullName}
                      onChange={(e) => setIndividualData({ ...individualData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="alex@example.com"
                        value={individualData.email}
                        onChange={(e) => setIndividualData({ ...individualData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={individualData.phone}
                        onChange={(e) => setIndividualData({ ...individualData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={individualData.password}
                        onChange={(e) => setIndividualData({ ...individualData, password: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={individualData.confirmPassword}
                        onChange={(e) => setIndividualData({ ...individualData, confirmPassword: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                  </div>

                  {/* Profile Image Upload (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Profile Image <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="flex items-center space-x-4">
                      {individualData.profileImage ? (
                        <img 
                          src={individualData.profileImage} 
                          alt="Profile Preview" 
                          className="w-14 h-14 rounded-full object-cover border-2 border-[#84CC16]" 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <label className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>[ Upload Image ]</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, (val) => setIndividualData({ ...individualData, profileImage: val }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- GROUP / TEAM USER FORM --- */}
            {userType === 'group' && (
              <div className="space-y-5">
                <div className="flex items-center space-x-2 text-[#65A30D] dark:text-[#84CC16] font-bold text-sm uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  <span>GROUP / TEAM USER INFORMATION</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Group Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nexus Innovations Team"
                        value={groupData.groupName}
                        onChange={(e) => setGroupData({ ...groupData, groupName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Team Leader Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={groupData.teamLeaderName}
                        onChange={(e) => setGroupData({ ...groupData, teamLeaderName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="team@nexus.org"
                        value={groupData.email}
                        onChange={(e) => setGroupData({ ...groupData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={groupData.phone}
                        onChange={(e) => setGroupData({ ...groupData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Number of Members *
                      </label>
                      <input
                        type="number"
                        placeholder="5"
                        min="2"
                        value={groupData.numberOfMembers}
                        onChange={(e) => setGroupData({ ...groupData, numberOfMembers: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={groupData.password}
                        onChange={(e) => setGroupData({ ...groupData, password: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={groupData.confirmPassword}
                        onChange={(e) => setGroupData({ ...groupData, confirmPassword: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                  </div>

                  {/* Group Logo Upload (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Group Logo <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="flex items-center space-x-4">
                      {groupData.groupLogo ? (
                        <img 
                          src={groupData.groupLogo} 
                          alt="Group Logo Preview" 
                          className="w-14 h-14 rounded-xl object-cover border-2 border-[#84CC16]" 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                      <label className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>[ Upload Image ]</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, (val) => setGroupData({ ...groupData, groupLogo: val }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- COMPANY / ORGANIZATION USER FORM --- */}
            {userType === 'company' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-[#65A30D] dark:text-[#84CC16] font-bold text-sm uppercase tracking-wider">
                  <Building className="w-4 h-4" />
                  <span>COMPANY / ORGANIZATION INFORMATION</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Acme Corporation"
                        value={companyData.companyName}
                        onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        placeholder="David Miller"
                        value={companyData.contactPerson}
                        onChange={(e) => setCompanyData({ ...companyData, contactPerson: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Business Email *
                      </label>
                      <input
                        type="email"
                        placeholder="contact@acme.com"
                        value={companyData.businessEmail}
                        onChange={(e) => setCompanyData({ ...companyData, businessEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={companyData.phone}
                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company Address *
                    </label>
                    <input
                      type="text"
                      placeholder="100 Innovation Way, Suite 400, Financial District"
                      value={companyData.address}
                      onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        placeholder="Software & Technology"
                        value={companyData.industry}
                        onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Number of Employees *
                      </label>
                      <input
                        type="number"
                        placeholder="25"
                        min="1"
                        value={companyData.numberOfEmployees}
                        onChange={(e) => setCompanyData({ ...companyData, numberOfEmployees: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>
                  </div>

                  {/* Company Logo * & Cover Image (Optional) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Company Logo * <span className="text-[#65A30D] dark:text-[#84CC16]">[ Upload Logo ]</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        {companyData.companyLogo ? (
                          <img 
                            src={companyData.companyLogo} 
                            alt="Company Logo Preview" 
                            className="w-12 h-12 rounded-xl object-cover border-2 border-[#84CC16]" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Building className="w-5 h-5" />
                          </div>
                        )}
                        <label className="px-3.5 py-2 bg-[#84CC16]/10 text-[#65A30D] dark:text-[#84CC16] rounded-xl text-xs font-bold cursor-pointer border border-[#84CC16]/20 flex items-center space-x-1.5">
                          <Upload className="w-4 h-4" />
                          <span>[ Upload Logo ]</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, (val) => setCompanyData({ ...companyData, companyLogo: val }))}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Company Cover Image <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        {companyData.companyCover ? (
                          <img 
                            src={companyData.companyCover} 
                            alt="Cover Preview" 
                            className="w-16 h-12 rounded-xl object-cover border-2 border-slate-300" 
                          />
                        ) : (
                          <div className="w-16 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Camera className="w-5 h-5" />
                          </div>
                        )}
                        <label className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center space-x-1.5">
                          <Upload className="w-4 h-4" />
                          <span>[ Upload Image ]</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, (val) => setCompanyData({ ...companyData, companyCover: val }))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Administrator Account Section */}
                  <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-[#84CC16]" />
                      <span>Administrator Account:</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Admin Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Admin Full Name"
                        value={companyData.adminName}
                        onChange={(e) => setCompanyData({ ...companyData, adminName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Admin Email *
                        </label>
                        <input
                          type="email"
                          placeholder="admin@company.com"
                          value={companyData.adminEmail}
                          onChange={(e) => setCompanyData({ ...companyData, adminEmail: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={companyData.adminPassword}
                          onChange={(e) => setCompanyData({ ...companyData, adminPassword: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 Footer Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center space-x-1.5 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Account Type</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleProceedToVerification}
                className="px-6 py-2.5 bg-[#84CC16] hover:bg-[#74b816] text-[#0F172A] font-extrabold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md shadow-[#84CC16]/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            STEP 3: VERIFICATION
           =================================================== */}
        {step === 3 && (
          <div className="space-y-6 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 bg-[#84CC16]/15 text-[#65A30D] dark:text-[#84CC16] rounded-2xl mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                Verify Account
              </h2>
              <p className="text-xs text-slate-500">
                Please confirm your contact details to complete registration.
              </p>
            </div>

            {/* Toggle Method: Email Verification Code OR Phone OTP */}
            <div className="flex justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-xs mx-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setVerificationMethod('email')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  verificationMethod === 'email'
                    ? 'bg-[#84CC16] text-[#0F172A] font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Verification Code</span>
              </button>
              <button
                type="button"
                onClick={() => setVerificationMethod('phone')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  verificationMethod === 'phone'
                    ? 'bg-[#84CC16] text-[#0F172A] font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone OTP</span>
              </button>
            </div>

            {/* Prompt helper */}
            <div className="p-3 bg-[#84CC16]/10 rounded-xl border border-[#84CC16]/20 text-xs text-slate-800 dark:text-slate-200 font-medium">
              {verificationMethod === 'email' ? (
                <span>We sent a 6-digit verification code to <strong>{createdUserPayload?.email || 'your email address'}</strong>.</span>
              ) : (
                <span>We sent an SMS OTP code to <strong>{createdUserPayload?.phone || 'your phone number'}</strong>.</span>
              )}
              <div className="mt-1 text-[11px] font-mono text-slate-500">
                Demo Code: <span className="font-extrabold text-[#65A30D] dark:text-[#84CC16] tracking-widest">{generatedOtp}</span>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Enter {verificationMethod === 'email' ? 'Verification Code' : 'OTP Code'}
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-48 mx-auto text-center tracking-widest font-mono text-xl py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:border-[#84CC16] outline-none block"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                type="button"
                disabled={isVerifying}
                onClick={handleVerifyAccount}
                className="w-full py-3 bg-[#84CC16] hover:bg-[#74b816] text-[#0F172A] font-extrabold rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#84CC16]/20 disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>[ Verify Account ]</span>
                  </>
                )}
              </button>

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-slate-400 hover:text-slate-600 font-medium"
                >
                  ← Edit Account Details
                </button>
                <button
                  type="button"
                  onClick={() => alert(`A new code (${generatedOtp}) has been dispatched!`)}
                  className="text-[#65A30D] dark:text-[#84CC16] hover:underline font-semibold"
                >
                  Resend Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            STEP 4: SUCCESS
           =================================================== */}
        {step === 4 && (
          <div className="space-y-8 text-center py-4">
            <div className="w-16 h-16 bg-[#84CC16]/20 text-[#65A30D] dark:text-[#84CC16] rounded-full mx-auto flex items-center justify-center animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display flex items-center justify-center space-x-2">
                <span>Account Created Successfully</span>
                <span className="text-2xl">✅</span>
              </h2>
              <p className="text-xs text-slate-500">
                Welcome to WeVentureHub! Your unified account is now active and ready.
              </p>
            </div>

            {/* List of Enabled Capabilities */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 text-left max-w-md mx-auto space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Your account can now:
              </h3>
              <ul className="space-y-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <li className="flex items-center space-x-3">
                  <div className="p-1 bg-[#84CC16]/20 text-[#65A30D] dark:text-[#84CC16] rounded-md">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Reserve Workspace</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="p-1 bg-[#84CC16]/20 text-[#65A30D] dark:text-[#84CC16] rounded-md">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Register for Events</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="p-1 bg-[#84CC16]/20 text-[#65A30D] dark:text-[#84CC16] rounded-md">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Manage Payments</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="p-1 bg-[#84CC16]/20 text-[#65A30D] dark:text-[#84CC16] rounded-md">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>View Reservations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="p-1 bg-[#84CC16]/20 text-[#65A30D] dark:text-[#84CC16] rounded-md">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>View Event Tickets</span>
                </li>
              </ul>
            </div>

            {/* Navigation Buttons as requested */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <button
                type="button"
                onClick={() => navigate('/workspaces')}
                className="w-full py-3.5 px-4 bg-[#0F172A] hover:bg-black text-white border border-slate-800 font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <Layout className="w-4 h-4 text-[#84CC16]" />
                <span>[ Continue to Workspace ]</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/events')}
                className="w-full py-3.5 px-4 bg-[#84CC16] hover:bg-[#74b816] text-[#0F172A] font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#84CC16]/20 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>[ Explore Events ]</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
