import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { 
  Building, 
  Ticket, 
  User, 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft, 
  Download, 
  Printer, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Mail, 
  FileText, 
  DollarSign, 
  CreditCard,
  Upload,
  Image as ImageIcon,
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import { useAppSelector } from '../store';
import { axiosInstance } from '../lib/axiosInstance';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

// Interfaces for form data
export type RegistrationType = 'workspace' | 'event';
export type UserType = 'individual' | 'group' | 'company';

export default function BookingRegistrationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Authentication Guard: Redirect to Login with return path if not authenticated
  if (!isAuthenticated) {
    const currentUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentUrl)}`} replace />;
  }

  // 1. REGISTRATION TYPE (Workspace vs Event)
  const initialType = (searchParams.get('type') === 'event' ? 'event' : 'workspace') as RegistrationType;
  const targetId = searchParams.get('id') || searchParams.get('slug') || '';

  const [regType, setRegType] = useState<RegistrationType>(initialType);

  // 2. USER TYPE (Individual, Group, Company)
  const [userType, setUserType] = useState<UserType>('individual');

  // Load target item data (Workspace or Event)
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [loadingItem, setLoadingItem] = useState(false);

  // Helper to extract user full name safely
  const getUserFullName = () => {
    if (!user) return '';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email || '';
  };

  // Form Fields - Individual
  const [fullName, setFullName] = useState(getUserFullName());
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+251 91 123 4567');
  const [jobTitle, setJobTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Form Fields - Group
  const [groupName, setGroupName] = useState('');
  const [teamLeaderName, setTeamLeaderName] = useState(getUserFullName());
  const [groupEmail, setGroupEmail] = useState(user?.email || '');
  const [groupPhone, setGroupPhone] = useState('+251 91 123 4567');
  const [participantCount, setParticipantCount] = useState<number>(3);
  const [participantFile, setParticipantFile] = useState<string | null>(null);
  const [groupLogo, setGroupLogo] = useState<string | null>(null);

  // Form Fields - Company
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState(getUserFullName());
  const [businessEmail, setBusinessEmail] = useState(user?.email || '');
  const [companyPhone, setCompanyPhone] = useState('+251 91 123 4567');
  const [companyAddress, setCompanyAddress] = useState('Bole Road, Addis Ababa');
  const [industry, setIndustry] = useState('Technology & Software');
  const [employeeCount, setEmployeeCount] = useState<number>(10);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyCover, setCompanyCover] = useState<string | null>(null);

  // Workspace Booking Details
  const [bookingDate, setBookingDate] = useState('2026-08-10');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [desksRequested, setDesksRequested] = useState<number>(1);
  const [purposeOfBooking, setPurposeOfBooking] = useState('Team Sprint & Client Presentation');
  const [additionalServices, setAdditionalServices] = useState<string[]>(['Projector & AV Setup', 'Catering & Coffee Service']);
  const [specialRequests, setSpecialRequests] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);

  // Synchronize URL parameters if changed
  useEffect(() => {
    if (searchParams.get('type') === 'event') {
      setRegType('event');
    } else if (searchParams.get('type') === 'workspace') {
      setRegType('workspace');
    }
  }, [searchParams]);

  // Fetch workspaces & events listing or specific target
  useEffect(() => {
    const fetchTargetData = async () => {
      setLoadingItem(true);
      try {
        if (regType === 'workspace') {
          const res = await axiosInstance.get('/public/workspaces');
          const list = res.data.data || [];
          setAvailableWorkspaces(list);

          if (targetId) {
            const found = list.find((w: any) => w.id === targetId || w.slug === targetId);
            if (found) {
              setSelectedWorkspace(found);
            } else {
              try {
                const singleRes = await axiosInstance.get(`/public/workspaces/${targetId}`);
                setSelectedWorkspace(singleRes.data.data);
              } catch {
                setSelectedWorkspace(list[0] || null);
              }
            }
          } else if (list.length > 0) {
            setSelectedWorkspace(list[0]);
          }
        } else {
          const res = await axiosInstance.get('/public/events');
          const list = res.data.data || [];
          setAvailableEvents(list);

          if (targetId) {
            const found = list.find((e: any) => e.id === targetId || e.slug === targetId);
            if (found) {
              setSelectedEvent(found);
            } else {
              try {
                const singleRes = await axiosInstance.get(`/public/events/slug/${targetId}`);
                setSelectedEvent(singleRes.data.data);
              } catch {
                setSelectedEvent(list[0] || null);
              }
            }
          } else if (list.length > 0) {
            setSelectedEvent(list[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load item for booking:', err);
      } finally {
        setLoadingItem(false);
      }
    };

    fetchTargetData();
  }, [regType, targetId]);

  // Handle Image Upload simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setter(fakeUrl);
    }
  };

  // Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Build Payload & Result
    setTimeout(() => {
      const isWorkspace = regType === 'workspace';
      const referenceId = isWorkspace 
        ? `WVH-RES-2026-${Math.floor(10000 + Math.random() * 90000)}`
        : `WVH-EVT-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      const primaryEmail = userType === 'individual' ? email : (userType === 'group' ? groupEmail : businessEmail);
      const primaryName = userType === 'individual' ? fullName : (userType === 'group' ? teamLeaderName : contactPerson);

      const result = {
        id: referenceId,
        regType,
        userType,
        dateSubmitted: new Date().toISOString(),
        primaryName,
        primaryEmail,
        phone: userType === 'individual' ? phone : (userType === 'group' ? groupPhone : companyPhone),
        userTypeDetails: {
          individual: { fullName, email, phone, jobTitle, organization },
          group: { groupName, teamLeaderName, groupEmail, groupPhone, participantCount },
          company: { companyName, contactPerson, businessEmail, companyPhone, companyAddress, industry, employeeCount }
        }[userType],
        workspace: isWorkspace ? (selectedWorkspace || {
          name: 'Executive Coworking Suite',
          type: 'Hot Desk',
          hourlyRate: 15,
          location: 'Building B, Floor 3'
        }) : null,
        event: !isWorkspace ? (selectedEvent || {
          title: 'WeVentureHub AI & Innovation Summit',
          date: '2026-08-20',
          time: '09:00 AM - 04:00 PM',
          location: 'Main Event Hall',
          organizer: 'WeVentureHub Team',
          ticketPrice: 0
        }) : null,
        workspaceBookingInfo: isWorkspace ? {
          bookingDate,
          startTime,
          endTime,
          desksRequested,
          specialRequests
        } : null,
        totalAmount: isWorkspace 
          ? ((selectedWorkspace?.hourlyRate || 15) * 8 * desksRequested * 1.15).toFixed(2)
          : ((selectedEvent?.ticketPrice || 0) * (userType === 'group' ? participantCount : (userType === 'company' ? employeeCount : 1))).toFixed(2)
      };

      // Persist locally for dashboard integration
      if (isWorkspace) {
        const existingBookings = JSON.parse(localStorage.getItem('weventurehub_user_bookings') || '[]');
        localStorage.setItem('weventurehub_user_bookings', JSON.stringify([result, ...existingBookings]));
      } else {
        const existingRegistrations = JSON.parse(localStorage.getItem('weventurehub_user_registrations') || '[]');
        localStorage.setItem('weventurehub_user_registrations', JSON.stringify([result, ...existingRegistrations]));
      }

      setSubmittedResult(result);
      setSubmitting(false);
    }, 800);
  };

  // Render Confirmation Screen upon success
  if (submittedResult) {
    const isWorkspace = submittedResult.regType === 'workspace';

    return (
      <div className="min-h-screen bg-[#111111] py-12 px-4 sm:px-6 lg:px-8 text-white font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Top Banner Header */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full filter blur-3xl pointer-events-none" />
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isWorkspace ? 'Workspace Reservation Confirmed' : 'Event Registration Confirmed'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Thank You, {submittedResult.primaryName}!
            </h1>
            <p className="text-neutral-400 text-sm max-w-xl mx-auto">
              Your {isWorkspace ? 'workspace reservation' : 'event registration'} has been recorded. A official confirmation email was dispatched to <span className="text-white font-semibold">{submittedResult.primaryEmail}</span>.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link to="/dashboard">
                <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                  View in My Dashboard
                </Button>
              </Link>
              <button 
                onClick={() => {
                  setSubmittedResult(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm transition-all shadow-lg"
              >
                {isWorkspace ? 'Book Another Workspace' : 'Register for Another Event'}
              </button>
            </div>
          </div>

          {/* CONFIRMATION TYPE SPECIFIC CONTENT */}
          {isWorkspace ? (
            /* WORKSPACE CONFIRMATION - INVOICE & RESERVATION DETAILS */
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-neutral-950 p-6 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-brand-primary/20 rounded-2xl text-brand-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Official Invoice & Booking Voucher</span>
                    <h3 className="text-lg font-bold text-white">Reservation ID: {submittedResult.id}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Billing Header Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Billed To</p>
                    <p className="font-bold text-white text-base">{submittedResult.primaryName}</p>
                    <p className="text-neutral-400">{submittedResult.primaryEmail}</p>
                    <p className="text-neutral-400">{submittedResult.phone}</p>
                    {submittedResult.userType === 'company' && (
                      <p className="text-brand-accent font-semibold mt-1">{submittedResult.userTypeDetails.companyName} ({submittedResult.userTypeDetails.industry})</p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Reservation Details</p>
                    <p className="text-neutral-300"><span className="text-neutral-500">Date:</span> {submittedResult.workspaceBookingInfo.bookingDate}</p>
                    <p className="text-neutral-300"><span className="text-neutral-500">Hours:</span> {submittedResult.workspaceBookingInfo.startTime} - {submittedResult.workspaceBookingInfo.endTime}</p>
                    <p className="text-neutral-300"><span className="text-neutral-500">Desks/Seats:</span> {submittedResult.workspaceBookingInfo.desksRequested}</p>
                    <p className="text-emerald-400 font-bold mt-1">Status: Confirmed & Paid</p>
                  </div>
                </div>

                {/* Workspace Item Card */}
                <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 flex items-center space-x-4">
                  <img 
                    src={submittedResult.workspace?.imageUrl || submittedResult.workspace?.coverImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=300'} 
                    alt={submittedResult.workspace?.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-2.5 py-0.5 rounded-md">
                      {submittedResult.workspace?.type || 'Coworking'}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{submittedResult.workspace?.name || 'Executive Coworking Suite'}</h4>
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      {submittedResult.workspace?.location || 'WeVentureHub Main Campus, Addis Ababa'}
                    </p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-neutral-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-950 text-neutral-400 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="p-4">Description</th>
                        <th className="p-4 text-center">Rate / Hour</th>
                        <th className="p-4 text-center">Duration / Desks</th>
                        <th className="p-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-300">
                      <tr>
                        <td className="p-4 font-semibold text-white">
                          {submittedResult.workspace?.name || 'Workspace Reservation'}
                          <p className="text-[11px] text-neutral-500 font-normal">{submittedResult.workspaceBookingInfo.bookingDate} ({submittedResult.workspaceBookingInfo.startTime} - {submittedResult.workspaceBookingInfo.endTime})</p>
                        </td>
                        <td className="p-4 text-center">${submittedResult.workspace?.hourlyRate || 15}.00</td>
                        <td className="p-4 text-center">8 Hours × {submittedResult.workspaceBookingInfo.desksRequested} Desk(s)</td>
                        <td className="p-4 text-right font-bold text-white">${((submittedResult.workspace?.hourlyRate || 15) * 8 * submittedResult.workspaceBookingInfo.desksRequested).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-neutral-400">VAT / Service Tax (15%)</td>
                        <td className="p-4 text-center">-</td>
                        <td className="p-4 text-center">-</td>
                        <td className="p-4 text-right font-semibold text-neutral-400">${(((submittedResult.workspace?.hourlyRate || 15) * 8 * submittedResult.workspaceBookingInfo.desksRequested) * 0.15).toFixed(2)}</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-neutral-950 font-bold text-white border-t border-neutral-800">
                      <tr>
                        <td colSpan={3} className="p-4 text-right uppercase text-xs tracking-wider text-neutral-400">Total Billed</td>
                        <td className="p-4 text-right text-base text-brand-accent">${submittedResult.totalAmount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>
            </div>
          ) : (
            /* EVENT CONFIRMATION - QR CODE TICKET & EVENT INFO */
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-neutral-950 p-6 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-brand-accent/20 rounded-2xl text-brand-accent">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Official Digital Event Pass</span>
                    <h3 className="text-lg font-bold text-white">Ticket Ref: {submittedResult.id}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => alert('Downloading Digital QR Code Ticket Pass...')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Ticket Pass</span>
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Event Banner & Details */}
                <div className="flex flex-col md:flex-row gap-6 bg-neutral-950 rounded-2xl p-6 border border-neutral-800 items-start">
                  <img 
                    src={submittedResult.event?.bannerUrl || submittedResult.event?.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600'} 
                    alt={submittedResult.event?.title} 
                    className="w-full md:w-48 h-36 object-cover rounded-xl shrink-0"
                  />
                  <div className="space-y-3 flex-1">
                    <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-md bg-brand-accent/10 text-brand-accent text-[11px] font-extrabold uppercase tracking-wider">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{submittedResult.event?.category || 'Community Workshop'}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white">{submittedResult.event?.title || 'WeVentureHub Summit'}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-primary shrink-0" /> {submittedResult.event?.date || 'August 20, 2026'}</p>
                      <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-brand-primary shrink-0" /> {submittedResult.event?.time || '09:00 AM - 04:00 PM'}</p>
                      <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-primary shrink-0" /> {submittedResult.event?.location || 'Main Event Hall'}</p>
                      <p className="flex items-center gap-2"><User className="w-4 h-4 text-brand-primary shrink-0" /> Host: {submittedResult.event?.organizer || 'WeVentureHub'}</p>
                    </div>
                  </div>
                </div>

                {/* Digital Ticket Pass Card (QR Ticket) */}
                <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 p-6 rounded-3xl border-2 border-dashed border-neutral-700 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative">
                  
                  {/* Left Ticket Info */}
                  <div className="space-y-4 text-left w-full md:w-2/3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                      <Sparkles className="w-4 h-4 text-brand-accent" />
                      <span>WeVentureHub Official Gate Pass</span>
                    </div>

                    <div>
                      <p className="text-2xl font-black text-white">{submittedResult.primaryName}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{submittedResult.primaryEmail}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-2 border-t border-neutral-800">
                      <div>
                        <span className="text-neutral-500 uppercase text-[10px] block">Pass Type</span>
                        <span className="text-brand-accent font-bold uppercase">{submittedResult.userType} Registration</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 uppercase text-[10px] block">Attendee Count</span>
                        <span className="text-white font-bold">
                          {submittedResult.userType === 'group' ? `${submittedResult.userTypeDetails.participantCount} Guests` : (submittedResult.userType === 'company' ? `${submittedResult.userTypeDetails.employeeCount} Employees` : '1 Person')}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 uppercase text-[10px] block">Ticket Status</span>
                        <span className="text-emerald-400 font-bold">Valid & Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Right QR Code Graphic */}
                  <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-neutral-200 shadow-lg text-center">
                    {/* Render visual QR Code SVG */}
                    <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100" height="100" fill="white"/>
                      <path d="M10 10H40V40H10V10ZM16 16V34H34V16H16ZM22 22H28V28H22V22Z" fill="#111111"/>
                      <path d="M60 10H90V40H60V10ZM66 16V34H84V16H66ZM72 22H78V28H72V22Z" fill="#111111"/>
                      <path d="M10 60H40V90H10V60ZM16 66V84H34V66H16ZM22 72H28V78H22V72Z" fill="#111111"/>
                      <path d="M50 50H60V60H50V50ZM60 60H70V70H60V60ZM70 50H80V60H70V50ZM80 60H90V70H80V60ZM50 70H60V80H50V70ZM60 80H70V90H60V80ZM70 70H80V80H70V70ZM80 80H90V90H80V80Z" fill="#111111"/>
                      <path d="M45 10H55V40H45V10ZM10 45H40V55H10V45ZM60 45H90V55H60V45Z" fill="#0284c7"/>
                    </svg>
                    <span className="text-[10px] font-mono font-bold text-neutral-800 mt-2 tracking-tighter">{submittedResult.id}</span>
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] py-12 px-4 sm:px-6 lg:px-8 text-white font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Link & Header */}
        <div className="space-y-3">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center space-x-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to WeVentureHub</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>WeVentureHub Unified Booking Engine</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {regType === 'workspace' ? 'Workspace Reservation' : 'Event Registration'}
              </h1>
              <p className="text-neutral-400 text-xs sm:text-sm mt-1">
                Complete your details below to reserve workspace facilities or register for events.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl text-xs font-bold shrink-0">
              <span className="text-neutral-400 px-3">Logged in as:</span>
              <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-xl border border-brand-primary/30">{getUserFullName()}</span>
            </div>
          </div>
        </div>

        {/* MAIN FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ========================================
              SECTION 1 - REGISTRATION TYPE
             ======================================== */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Registration For</h2>
                <p className="text-xs text-neutral-400">Select whether you are booking workspace desks/rooms or registering for an event.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => setRegType('workspace')}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-start space-x-4 ${
                  regType === 'workspace'
                    ? 'border-brand-primary bg-brand-primary/10 text-white shadow-lg shadow-brand-primary/5'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                }`}
              >
                <div className={`p-3 rounded-xl ${regType === 'workspace' ? 'bg-brand-primary text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-white">Workspace Reservation</span>
                    {regType === 'workspace' && <CheckCircle2 className="w-4 h-4 text-brand-primary" />}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Book hot desks, dedicated desks, meeting rooms, or event halls.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRegType('event')}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-start space-x-4 ${
                  regType === 'event'
                    ? 'border-brand-accent bg-brand-accent/10 text-white shadow-lg shadow-brand-accent/5'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                }`}
              >
                <div className={`p-3 rounded-xl ${regType === 'event' ? 'bg-brand-accent text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'}`}>
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-white">Event Registration</span>
                    {regType === 'event' && <CheckCircle2 className="w-4 h-4 text-brand-accent" />}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Reserve tickets & QR access passes for workshops and summits.</p>
                </div>
              </button>
            </div>
          </div>

          {/* ========================================
              SECTION 2 - USER TYPE
             ======================================== */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Who is registering?</h2>
                <p className="text-xs text-neutral-400">Choose your registration category to customize required form details.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Individual */}
              <button
                type="button"
                onClick={() => setUserType('individual')}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  userType === 'individual'
                    ? 'border-brand-primary bg-brand-primary/10 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <User className={`w-5 h-5 ${userType === 'individual' ? 'text-brand-primary' : 'text-neutral-500'}`} />
                  {userType === 'individual' && <Check className="w-4 h-4 text-brand-primary" />}
                </div>
                <div className="font-bold text-sm text-white">Individual</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Single person registration</div>
              </button>

              {/* Group / Team */}
              <button
                type="button"
                onClick={() => setUserType('group')}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  userType === 'group'
                    ? 'border-brand-primary bg-brand-primary/10 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className={`w-5 h-5 ${userType === 'group' ? 'text-brand-primary' : 'text-neutral-500'}`} />
                  {userType === 'group' && <Check className="w-4 h-4 text-brand-primary" />}
                </div>
                <div className="font-bold text-sm text-white">Group / Team</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">For team pass or group desk booking</div>
              </button>

              {/* Company / Organization */}
              <button
                type="button"
                onClick={() => setUserType('company')}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  userType === 'company'
                    ? 'border-brand-primary bg-brand-primary/10 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Briefcase className={`w-5 h-5 ${userType === 'company' ? 'text-brand-primary' : 'text-neutral-500'}`} />
                  {userType === 'company' && <Check className="w-4 h-4 text-brand-primary" />}
                </div>
                <div className="font-bold text-sm text-white">Company / Organization</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Corporate entity or registered enterprise</div>
              </button>
            </div>
          </div>

          {/* ========================================
              SECTION 3 - PERSONAL / ORGANIZATION INFORMATION
             ======================================== */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {userType === 'individual' && 'Personal Information'}
                  {userType === 'group' && 'Group / Team Details'}
                  {userType === 'company' && 'Company / Organization Details'}
                </h2>
                <p className="text-xs text-neutral-400">Please fill out the contact fields for this reservation.</p>
              </div>
            </div>

            {/* DYNAMIC FORM FIELDS BASED ON USER TYPE */}
            {userType === 'individual' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="e.g. Alex Chen"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="alex@weventurehub.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="+251 91 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Job Title (Optional)</label>
                  <input 
                    type="text" 
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="e.g. Senior Software Architect"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Organization (Optional)</label>
                  <input 
                    type="text" 
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="e.g. WeVenture Member"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Profile Image (Optional)</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setProfileImage)}
                      className="block w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700" 
                    />
                    {profileImage && <img src={profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-700" />}
                  </div>
                </div>
              </div>
            )}

            {userType === 'group' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Group Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="e.g. AI Product Innovators"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Team Leader Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={teamLeaderName}
                    onChange={(e) => setTeamLeaderName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    value={groupEmail}
                    onChange={(e) => setGroupEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="lead@team.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    value={groupPhone}
                    onChange={(e) => setGroupPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="+251 91 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Number of Participants *</label>
                  <input 
                    type="number" 
                    min={2}
                    max={100}
                    required 
                    value={participantCount}
                    onChange={(e) => setParticipantCount(parseInt(e.target.value) || 2)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Upload Participant List (Optional)</label>
                  <input 
                    type="file" 
                    accept=".csv,.pdf,.xlsx"
                    onChange={(e) => handleFileUpload(e, setParticipantFile)}
                    className="block w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700" 
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Group Logo (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setGroupLogo)}
                    className="block w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700" 
                  />
                </div>
              </div>
            )}

            {userType === 'company' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Company Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="e.g. NextGen Digital Labs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Contact Person *</label>
                  <input 
                    type="text" 
                    required 
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="e.g. Michael Vance"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Business Email *</label>
                  <input 
                    type="email" 
                    required 
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="+251 91 123 4567"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Company Address *</label>
                  <input 
                    type="text" 
                    required 
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                    placeholder="e.g. Bole Subcity, Woreda 03, House 412"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Industry (Optional)</label>
                  <select 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="Technology & Software">Technology & Software</option>
                    <option value="Finance & Fintech">Finance & Fintech</option>
                    <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                    <option value="Education & EdTech">Education & EdTech</option>
                    <option value="Creative Agency & Media">Creative Agency & Media</option>
                    <option value="Other">Other Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Number of Employees *</label>
                  <input 
                    type="number" 
                    min={1}
                    required 
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Company Logo Upload *</label>
                  <input 
                    type="file" 
                    required
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setCompanyLogo)}
                    className="block w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Company Cover Image (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setCompanyCover)}
                    className="block w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================
              SECTION 4 - WORKSPACE OR EVENT SPECIFIC INFORMATION
             ======================================== */}
          {regType === 'workspace' ? (
            /* WORKSPACE RESERVATION FORM SPECIFICS */
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Workspace Information & Booking Details</h2>
                  <p className="text-xs text-neutral-400">Review selected workspace details and choose your reservation schedule.</p>
                </div>
              </div>

              {/* Workspace Selection Card */}
              {selectedWorkspace ? (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4">
                  <img 
                    src={selectedWorkspace.imageUrl || selectedWorkspace.coverImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400'} 
                    alt={selectedWorkspace.name}
                    className="w-full sm:w-40 h-28 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-2.5 py-0.5 rounded-md">
                        {selectedWorkspace.type || 'Coworking'}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Available Space
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{selectedWorkspace.name}</h3>
                    <p className="text-xs text-neutral-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      {selectedWorkspace.location || 'WeVentureHub Main Campus, Addis Ababa'}
                    </p>
                    <div className="text-xs text-neutral-300 font-semibold pt-1">
                      Hourly Rate: <span className="text-brand-accent font-bold">${selectedWorkspace.hourlyRate || 15}/hr</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-neutral-300">Select Workspace *</label>
                  <select
                    onChange={(e) => {
                      const found = availableWorkspaces.find(w => w.id === e.target.value);
                      if (found) setSelectedWorkspace(found);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
                  >
                    {availableWorkspaces.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.type}) - ${w.hourlyRate}/hr</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reservation Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-neutral-800 pt-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Reservation Date *</label>
                  <input 
                    type="date" 
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Start Time *</label>
                  <input 
                    type="time" 
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">End Time *</label>
                  <input 
                    type="time" 
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Number of Desks / Seats Requested *</label>
                  <input 
                    type="number" 
                    min={1}
                    max={selectedWorkspace?.capacity || 20}
                    required
                    value={desksRequested}
                    onChange={(e) => setDesksRequested(parseInt(e.target.value) || 1)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary" 
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Purpose of Booking *</label>
                  <input
                    type="text"
                    required
                    value={purposeOfBooking}
                    onChange={(e) => setPurposeOfBooking(e.target.value)}
                    placeholder="e.g. Client presentation, product design sprint, executive board meeting..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="sm:col-span-3 space-y-2">
                  <label className="block text-xs font-bold text-neutral-300">Additional Services (Optional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                    {[
                      'Projector & AV Setup',
                      'Catering & Coffee Service',
                      'Whiteboard & Stationery Pack',
                      'High-Speed Dedicated Fiber WiFi',
                      'Live Podcasting & AV Hardware Kit'
                    ].map((service) => {
                      const isChecked = additionalServices.includes(service);
                      return (
                        <label
                          key={service}
                          className={`flex items-center space-x-3 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-brand-primary/10 border-brand-primary text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdditionalServices(prev => [...prev, service]);
                              } else {
                                setAdditionalServices(prev => prev.filter(s => s !== service));
                              }
                            }}
                            className="rounded border-neutral-700 text-brand-primary focus:ring-brand-primary"
                          />
                          <span>{service}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Special Requests (Optional)</label>
                  <textarea 
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Provide any specific seating preferences, temperature settings, or accessibility requirements..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-primary" 
                  />
                </div>
              </div>
            </div>
          ) : (
            /* EVENT REGISTRATION FORM SPECIFICS */
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Event Information & Ticket Selection</h2>
                  <p className="text-xs text-neutral-400">Review selected event details and confirm your ticket allocation.</p>
                </div>
              </div>

              {/* Event Information Card */}
              {selectedEvent ? (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row items-start gap-5">
                  <img 
                    src={selectedEvent.bannerUrl || selectedEvent.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600'} 
                    alt={selectedEvent.title}
                    className="w-full md:w-48 h-32 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-md">
                        {selectedEvent.category || 'Summit'}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {selectedEvent.availableSeats ? `${selectedEvent.availableSeats} Seats Available` : 'Open Registration'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-400 pt-1">
                      <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-neutral-500" /> {selectedEvent.date || 'August 20, 2026'}</p>
                      <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-neutral-500" /> {selectedEvent.time || '09:00 AM - 04:00 PM'}</p>
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-neutral-500" /> {selectedEvent.location || 'WeVenture Main Hall'}</p>
                      <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-neutral-500" /> Organizer: {selectedEvent.organizer || 'WeVentureHub'}</p>
                    </div>

                    <div className="text-xs font-semibold pt-2 text-white">
                      Ticket Price: <span className="text-brand-accent font-bold">{selectedEvent.ticketPrice ? `$${selectedEvent.ticketPrice}` : 'FREE Pass'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-neutral-300">Select Event *</label>
                  <select
                    onChange={(e) => {
                      const found = availableEvents.find(evt => evt.id === e.target.value);
                      if (found) setSelectedEvent(found);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
                  >
                    {availableEvents.map(evt => (
                      <option key={evt.id} value={evt.id}>{evt.title} ({evt.category}) - {evt.ticketPrice ? `$${evt.ticketPrice}` : 'Free'}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-4 flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-bold text-sm transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-extrabold text-sm transition-all shadow-xl shadow-brand-primary/20 flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Submission...</span>
                </>
              ) : (
                <>
                  <span>Confirm {regType === 'workspace' ? 'Workspace Reservation' : 'Event Registration'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
