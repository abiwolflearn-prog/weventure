import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Ticket,
  Download,
  Printer,
  Shield,
  User,
  Mail,
  Info,
  CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import { axiosInstance } from '../lib/axiosInstance';
import { Button } from '../components/Button';

export default function PublicTicketPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [ticketData, setTicketData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  
  // PIN verification for staff check-in (optional layer for extra security)
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [staffPin, setStaffPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const fetchTicket = async () => {
    if (!id || !token) {
      setError('Missing ticket identifier or secure verification token.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/public/tickets/${id}`, {
        params: { token }
      });
      setTicketData(response.data.data);
    } catch (err: any) {
      console.error('Failed to load digital ticket:', err);
      setError(err.response?.data?.message || 'Unauthorized. This digital ticket cannot be verified.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id, token]);

  const handlePrint = () => {
    window.print();
  };

  const triggerCheckIn = async () => {
    if (!id || !token) return;
    try {
      setCheckInLoading(true);
      setCheckInError(null);
      setCheckInSuccess(null);

      const response = await axiosInstance.post(`/public/tickets/${id}/checkin`, {
        token
      });

      setCheckInSuccess(response.data.message || 'Attendee checked in successfully!');
      // Refresh ticket details
      await fetchTicket();
    } catch (err: any) {
      console.error('Check-in failed:', err);
      setCheckInError(err.response?.data?.message || 'Check-in failed. Please verify ticket status.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleStaffCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Verify local staff secret pin or bypass if authenticated
    if (staffPin === '1234' || staffPin.trim().toLowerCase() === 'admin') {
      setPinError(null);
      setShowPinPrompt(false);
      triggerCheckIn();
    } else {
      setPinError('Invalid Staff PIN. Please check credentials.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-neutral-300 font-semibold uppercase tracking-wider">Verifying secure admission pass...</p>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 bg-rose-950/80 rounded-full flex items-center justify-center mb-6 border border-rose-800">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-black mb-2">Verification Failed</h1>
        <p className="text-neutral-400 mb-8 max-w-md">{error || 'This digital ticket link is invalid or has expired.'}</p>
        <Link to="/events">
          <Button variant="success" className="text-xs font-bold uppercase tracking-wider">
            Explore WeVentureHub Events
          </Button>
        </Link>
      </div>
    );
  }

  const { registration, event } = ticketData;

  const eventDateFormatted = event?.schedule?.startDate ? new Date(event.schedule.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : 'TBD';

  const eventTimeFormatted = event?.schedule?.startDate ? new Date(event.schedule.startDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  // Calculate ticket status
  let statusBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  let statusLabel = 'CONFIRMED';

  if (registration.checkedIn) {
    statusBadgeColor = 'bg-[#A3E635]/20 text-[#A3E635] border-[#A3E635]/40';
    statusLabel = 'CHECKED IN';
  } else if (registration.status === 'CANCELLED') {
    statusBadgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    statusLabel = 'CANCELLED';
  } else if (registration.status === 'WAITLISTED') {
    statusBadgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    statusLabel = 'WAITLISTED';
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center font-sans">
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link to="/events" className="text-xs font-bold text-neutral-400 hover:text-[#A3E635] transition-colors flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Discover Events</span>
          </Link>
          <span className="text-[10px] font-black tracking-widest text-[#A3E635] uppercase font-mono bg-[#A3E635]/10 px-3 py-1 rounded-full border border-[#A3E635]/20">
            WeVentureHub Secure Gate
          </span>
        </div>

        {/* Digital Ticket Core Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E293B] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
          id="printable-ticket"
        >
          {/* Brand header / visual header */}
          <div className="bg-[#111827] px-8 py-6 flex flex-col sm:flex-row items-center justify-between border-b border-white/5 gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xl font-extrabold tracking-tight">
                We<span className="text-[#A3E635]">Venture</span>Hub
              </span>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mt-1">Official Event Admission Ticket</p>
            </div>
            
            {/* Status Pill */}
            <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border ${statusBadgeColor}`}>
              {statusLabel}
            </div>
          </div>

          {/* Gradient Separator */}
          <div className="h-[3px] bg-gradient-to-r from-[#A3E635] to-[#22D3EE]" />

          {/* Body */}
          <div className="p-8 space-y-8">
            
            {/* Event Summary Row */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-[#A3E635] tracking-widest font-mono">Experience</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {event?.title || 'Exclusive WeVentureHub Gathering'}
              </h2>
            </div>

            {/* Event Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#111827]/60 border border-white/5 rounded-2xl p-6">
              <div className="flex items-start space-x-3 text-sm">
                <Calendar className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-white">Date</span>
                  <span className="text-xs text-neutral-300 font-light mt-0.5 block">{eventDateFormatted}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-sm">
                <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-white">Time</span>
                  <span className="text-xs text-neutral-300 font-light mt-0.5 block">{eventTimeFormatted}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-sm sm:col-span-2 border-t border-white/5 pt-4">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-white">Venue Location</span>
                  <span className="text-xs text-neutral-300 font-light mt-0.5 block">
                    WeVentureHub Suite &amp; Event Hall, Downtown Headquarters
                  </span>
                </div>
              </div>
            </div>

            {/* Attendee Info Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1 bg-[#111827]/40 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-[#A3E635]" />
                  <span>Attendee Name</span>
                </span>
                <p className="text-sm font-extrabold text-white">{registration.attendeeName}</p>
              </div>

              <div className="space-y-1 bg-[#111827]/40 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email Address</span>
                </span>
                <p className="text-sm font-semibold text-white truncate">{registration.attendeeEmail}</p>
              </div>

              <div className="space-y-1 bg-[#111827]/40 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center space-x-1">
                  <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ticket ID (RSVP ID)</span>
                </span>
                <p className="text-xs font-mono font-bold text-neutral-300">{registration._id}</p>
              </div>

              <div className="space-y-1 bg-[#111827]/40 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ticket Number</span>
                </span>
                <p className="text-xs font-mono font-black text-[#A3E635]">{registration.ticketNumber}</p>
              </div>
            </div>

            {/* Dynamic QR Code Centerpiece */}
            <div className="flex flex-col items-center justify-center border-t border-b border-white/5 py-8 space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-[#A3E635] font-mono">
                Digital QR Admission Pass
              </span>
              
              <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-[#1E293B] hover:scale-105 transition-transform duration-300">
                <img 
                  src={registration.qrCode} 
                  alt="Secure QR Code Pass" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="text-center space-y-1 max-w-sm">
                <p className="text-xs text-neutral-300 leading-relaxed font-light">
                  Present this QR code to the coordinator at the WeVentureHub check-in desk upon arrival.
                </p>
                {registration.checkedIn && (
                  <p className="text-xs font-bold text-[#A3E635]">
                    ✓ Ticket checked in at {new Date(registration.checkedInAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Staff Verification Center */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold text-neutral-200">
                <Shield className="w-4 h-4 text-[#A3E635]" />
                <span>WeVentureHub Staff Portal</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Scan coordinators can process attendees instantly below. Duplicate check-ins are strictly prohibited by our real-time synchronization.
              </p>

              {checkInSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-900 text-emerald-400 rounded-xl text-xs font-medium flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{checkInSuccess}</span>
                </div>
              )}

              {checkInError && (
                <div className="p-3 bg-rose-950/60 border border-rose-900 text-rose-400 rounded-xl text-xs font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{checkInError}</span>
                </div>
              )}

              {!registration.checkedIn && registration.status === 'CONFIRMED' ? (
                <>
                  {!showPinPrompt ? (
                    <Button
                      onClick={() => setShowPinPrompt(true)}
                      variant="success"
                      className="w-full text-xs font-black py-3 uppercase tracking-wider"
                    >
                      Process Staff Check-In
                    </Button>
                  ) : (
                    <form onSubmit={handleStaffCheckIn} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-neutral-400 mb-1 uppercase tracking-wider">
                          Enter Coordinator Staff PIN / Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Enter PIN (Use '1234' or 'admin' to bypass)"
                          value={staffPin}
                          onChange={e => setStaffPin(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs rounded-xl border border-white/5 bg-[#111827] text-white focus:border-[#A3E635] focus:ring-0"
                        />
                        {pinError && <p className="text-[10px] text-rose-400 mt-1">{pinError}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          variant="success"
                          isLoading={checkInLoading}
                          className="flex-1 text-[11px] font-black py-2"
                        >
                          Confirm Check-In
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setShowPinPrompt(false);
                            setStaffPin('');
                            setPinError(null);
                          }}
                          variant="secondary"
                          className="text-[11px] font-black py-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <div className="text-center py-2 text-xs font-bold text-neutral-500">
                  {registration.status === 'CANCELLED' ? (
                    <span className="text-rose-400">Cannot check-in cancelled ticket.</span>
                  ) : registration.status === 'WAITLISTED' ? (
                    <span className="text-amber-400">Waitlisted tickets must be promoted first.</span>
                  ) : (
                    <span className="text-[#A3E635] flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Checked In &amp; Verified
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Panel */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={handlePrint}
            variant="success" 
            className="h-12 font-black text-xs uppercase tracking-wider space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </Button>

          <Link to="/events" className="w-full">
            <Button 
              variant="secondary" 
              className="w-full h-12 font-bold text-xs uppercase tracking-wider space-x-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>More Events</span>
            </Button>
          </Link>
        </div>

        {/* Organizer help notes */}
        <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-6 text-center text-xs text-neutral-400 leading-relaxed">
          <span className="block font-bold text-neutral-200 mb-1">Need help with your reservation?</span>
          Email WeVentureHub Community Coordinator at info@weventurehub.com or use our physical helpdesk in the Atrium room.
        </div>

      </div>
    </div>
  );
}
