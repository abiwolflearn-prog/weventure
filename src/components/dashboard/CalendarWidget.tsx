import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Video, MapPin, User, Clock, ArrowRight, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../lib/bookingApi';
import { workspaceApi } from '../../lib/workspaceApi';
import { useAppSelector } from '../../store';
import { Modal } from '../Modal';

interface IEvent {
  id: string;
  title: string;
  type: 'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE';
  space: string;
  time: string;
  host: string;
  date: string; // 'YYYY-MM-DD'
  isDb?: boolean;
}

const getRelativeDateString = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialEvents: IEvent[] = [
  { id: '1', title: 'Tesla Boardroom Alignment', type: 'MEETING_ROOM', space: 'Tesla Boardroom (HQ-302)', time: '14:00 - 15:30', host: 'Alex Chen', date: getRelativeDateString(0) },
  { id: '2', title: 'Acoustic Pod Sprint', type: 'HOT_DESK', space: 'Acoustic Pod 4', time: '09:00 - 11:00', host: 'Sarah Jenkins', date: getRelativeDateString(0) },
  { id: '3', title: 'Global Tech Meetup Host', type: 'EVENT_VENUE', space: 'Silicon Arena Suite (Level 1)', time: '17:30 - 20:30', host: 'WeVenture Hub HQ', date: getRelativeDateString(2) },
  { id: '4', title: 'Product Launch Audits', type: 'MEETING_ROOM', space: 'Tesla Boardroom (HQ-302)', time: '11:00 - 12:30', host: 'David Kim', date: getRelativeDateString(5) },
  { id: '5', title: 'Marketing Design Review', type: 'MEETING_ROOM', space: 'Room 101 Creative', time: '14:00 - 16:00', host: 'Emma Watson', date: getRelativeDateString(5) },
  { id: '6', title: 'DevOps Cohort Standup', type: 'HOT_DESK', space: 'Dev Zone Table 3', time: '09:00 - 10:00', host: 'Sanjay Patel', date: getRelativeDateString(8) },
];

const formatTimeSlot = (startIso: string, endIso: string) => {
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const sh = String(start.getUTCHours() || start.getHours()).padStart(2, '0');
    const sm = String(start.getUTCMinutes() || start.getMinutes()).padStart(2, '0');
    const eh = String(end.getUTCHours() || end.getHours()).padStart(2, '0');
    const em = String(end.getUTCMinutes() || end.getMinutes()).padStart(2, '0');
    return `${sh}:${sm} - ${eh}:${em}`;
  } catch (e) {
    return '09:00 - 17:00';
  }
};

export default function CalendarWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  const currentPrefix = location.pathname.startsWith('/superadmin/dashboard')
    ? '/superadmin/dashboard'
    : location.pathname.startsWith('/admin/dashboard')
    ? '/admin/dashboard'
    : '/dashboard';

  const isAdminOrStaff = useMemo(() => {
    if (!user) return false;
    const role = user.role || '';
    return ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF', 'MANAGER', 'WORKSPACE_MANAGER', 'ADMIN'].includes(role);
  }, [user]);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => getRelativeDateString(0));

  // Manual admin booking modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [bookingPurpose, setBookingPurpose] = useState('Workspace Utilization');
  const [reservationTitle, setReservationTitle] = useState('');
  const [reservationType, setReservationType] = useState<'Workspace' | 'Meeting' | 'Event' | 'Internal Work Schedule' | 'Resource'>('Workspace');
  const [startTimeStr, setStartTimeStr] = useState('14:00');
  const [endTimeStr, setEndTimeStr] = useState('16:00');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Queries for real backend data
  const { data: bookingsResponse } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      return await bookingApi.getBookings();
    },
  });

  const { data: workspacesResponse } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      return await workspaceApi.getWorkspaces();
    },
  });

  const dbBookings = useMemo(() => bookingsResponse?.data || [], [bookingsResponse]);
  const dbWorkspaces = useMemo(() => workspacesResponse?.data || [], [workspacesResponse]);

  // Set default space when workspaces load
  useEffect(() => {
    if (dbWorkspaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(dbWorkspaces[0].id || dbWorkspaces[0]._id);
    }
  }, [dbWorkspaces, selectedSpaceId]);

  const createBookingMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await bookingApi.createBooking(payload);
    },
    onSuccess: () => {
      setSubmitSuccess(true);
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setReservationTitle('');
        setBookingPurpose('Workspace Utilization');
      }, 1500);
    },
    onError: (err: any) => {
      setSubmitError(err?.response?.data?.message || err?.message || 'Failed to schedule reservation.');
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await bookingApi.cancelBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setCancelError(null);
    },
    onError: (err: any) => {
      setCancelError(err?.response?.data?.message || err?.message || 'Failed to cancel reservation.');
    }
  });

  const handleSaveReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpaceId) {
      setSubmitError('Please select a workspace resource.');
      return;
    }

    const startIso = `${selectedDate}T${startTimeStr}:00.000Z`;
    const endIso = `${selectedDate}T${endTimeStr}:00.000Z`;

    const payload: any = {
      spaceId: selectedSpaceId,
      startTime: startIso,
      endTime: endIso,
      purpose: bookingPurpose,
      reservationTitle: reservationTitle || bookingPurpose || 'Workspace Utilization',
      reservationType: reservationType,
    };

    if (organizerEmail) {
      payload.userEmail = organizerEmail;
    } else if (user?.email) {
      payload.userEmail = user.email;
    }

    createBookingMutation.mutate(payload);
  };

  // Map real database bookings to IEvent interface
  const mappedDbEvents = useMemo(() => {
    return dbBookings
      .filter((b: any) => b.status !== 'CANCELLED')
      .map((b: any) => {
        const spaceId = b.spaceId || '';
        const spaceObj = dbWorkspaces.find((w: any) => w.id === spaceId || w._id === spaceId);
        const spaceName = spaceObj ? spaceObj.name : 'Workspace Utilization';

        let evType: 'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE' = 'HOT_DESK';
        const category = (spaceObj?.category || '').toUpperCase();
        if (category.includes('MEETING') || b.reservationType === 'Meeting') {
          evType = 'MEETING_ROOM';
        } else if (category.includes('EVENT') || category.includes('VENUE') || b.reservationType === 'Event') {
          evType = 'EVENT_VENUE';
        }

        let timeSlot = '09:00 - 10:00';
        if (b.startTime && b.endTime) {
          timeSlot = formatTimeSlot(b.startTime, b.endTime);
        }

        let dateStr = getRelativeDateString(0);
        if (b.startTime) {
          dateStr = b.startTime.split('T')[0];
        }

        return {
          id: b.id || b._id,
          title: b.reservationTitle || b.purpose || 'Workspace Utilization',
          type: evType,
          space: spaceName,
          time: timeSlot,
          host: b.userEmail || b.contactEmail || 'WeVentureHub Member',
          date: dateStr,
          isDb: true,
        };
      });
  }, [dbBookings, dbWorkspaces]);

  // Merge static and backend events
  const allEvents = useMemo(() => {
    return [...initialEvents, ...mappedDbEvents];
  }, [mappedDbEvents]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Format single digit date / month
  const formatDateString = (dYear: number, dMonth: number, dDay: number) => {
    const mm = String(dMonth + 1).padStart(2, '0');
    const dd = String(dDay).padStart(2, '0');
    return `${dYear}-${mm}-${dd}`;
  };

  // Check events for a specific day
  const getEventsForDay = (dayString: string) => {
    return allEvents.filter((ev) => ev.date === dayString);
  };

  const selectedDayEvents = getEventsForDay(selectedDate);


  // Generate blank grids before the first day
  const gridCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push(<div key={`blank-${i}`} className="p-2 border border-transparent" />);
  }

  // Generate actual calendar days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayString = formatDateString(year, month, day);
    const dayEvents = getEventsForDay(dayString);
    const isSelected = selectedDate === dayString;
    const isToday = day === 30 && month === 5 && year === 2026; // Simulating today is June 30, 2026

    gridCells.push(
      <button
        key={`day-${day}`}
        onClick={() => setSelectedDate(dayString)}
        className={`group relative p-2 md:p-3 text-center border border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#A3E635] flex flex-col justify-between items-center h-12 md:h-14 ${
          isSelected
            ? 'bg-[#A3E635] text-[#111111] font-black shadow-sm'
            : isToday
            ? 'bg-[#A3E635]/15 text-[#65A30D] font-bold border-[#A3E635]'
            : 'hover:bg-neutral-slate-50 hover:bg-gray-150'
        }`}
      >
        <span className={`text-xs md:text-sm ${isSelected ? 'text-[#111111] font-bold' : 'text-gray-800'}`}>
          {day}
        </span>
        
        {/* Indicators */}
        {dayEvents.length > 0 && (
          <div className="flex gap-1 justify-center mt-1">
            {dayEvents.slice(0, 3).map((ev) => {
              let dotColor = 'bg-[#84CC16]';
              if (ev.type === 'EVENT_VENUE') dotColor = 'bg-indigo-500';
              if (ev.type === 'HOT_DESK') dotColor = 'bg-emerald-500';
              return (
                <span
                  key={ev.id}
                  className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isSelected ? 'bg-[#111111]' : dotColor}`}
                />
              );
            })}
          </div>
        )}
      </button>
    );
  }

  const getTypeBadgeStyle = (type: IEvent['type']) => {
    switch (type) {
      case 'MEETING_ROOM':
        return 'bg-[#A3E635]/15 text-[#65A30D] font-bold';
      case 'HOT_DESK':
        return 'bg-emerald-100 text-emerald-700 bg-emerald-50/30 dark:text-emerald-400';
      case 'EVENT_VENUE':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid Container */}
      <div className="lg:col-span-2 bg-white border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
        {/* Header Nav */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#A3E635]/10 rounded-[12px] text-[#84CC16]">
              <Calendar className="w-5 h-5 text-[#84CC16]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[18px] text-gray-900">Workspace Timeline</h3>
              <p className="text-[14px] text-[#6B7280] mt-0.5">Scheduling and timeline reservations manager</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[14px] font-bold text-gray-905 pr-1 select-none">
              {monthName} {year}
            </span>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-neutral-100 border border-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-neutral-100 border border-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-neutral-slate-400 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {gridCells}
        </div>
      </div>

      {/* Inspector Details Sidebar */}
      <div className="bg-white border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
            <h4 className="font-display font-bold text-sm text-gray-900">
              Reservations for {new Date(selectedDate).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h4>
            <span className="px-2 py-0.5 bg-neutral-100 text-[10px] font-bold uppercase tracking-wider text-gray-600 rounded-md">
              {selectedDayEvents.length} items
            </span>
          </div>

          {cancelError && (
            <div className="mb-4 p-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
              {cancelError}
            </div>
          )}

          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {selectedDayEvents.length === 0 ? (
              <div className="py-10 text-center text-gray-600">
                <Calendar className="w-10 h-10 mx-auto opacity-20 mb-3" />
                <p className="text-xs font-semibold">No Bookings Scheduled</p>
                <p className="text-[10px] text-gray-600 mt-1">This day is completely available.</p>
              </div>
            ) : (
              selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 border border-neutral-100 hover:border-[#A3E635] bg-neutral-50/50 rounded-xl transition"
                >
                  <div className="flex items-start justify-between gap-1.5 mb-2.5">
                    <h5 className="font-display font-bold text-xs text-gray-900">
                      {ev.title}
                    </h5>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md shrink-0 ${getTypeBadgeStyle(ev.type)}`}>
                      {ev.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-2 shrink-0 text-gray-600" />
                      <span>{ev.time}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-2 shrink-0 text-gray-600" />
                      <span className="truncate">{ev.space}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-2 shrink-0 text-gray-600" />
                      <span>Host: {ev.host}</span>
                    </div>
                  </div>

                  {isAdminOrStaff && ev.isDb && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to cancel this reservation?')) {
                            cancelBookingMutation.mutate(ev.id);
                          }
                        }}
                        disabled={cancelBookingMutation.isPending}
                        className="text-[10px] text-red-600 font-bold hover:text-red-700 disabled:opacity-50 transition border border-red-200 hover:border-red-300 px-2.5 py-1 rounded-lg bg-red-50/50 hover:bg-red-50"
                      >
                        {cancelBookingMutation.isPending ? 'Canceling...' : 'Cancel Reservation'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 space-y-2.5">
          {isAdminOrStaff && (
            <button
              onClick={() => {
                setSubmitError(null);
                setSubmitSuccess(false);
                setIsModalOpen(true);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 h-11 bg-white hover:bg-neutral-50 text-[#111111] text-xs font-black border border-gray-200 rounded-[14px] transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Admin: Add Manual Booking</span>
            </button>
          )}
          <button
            onClick={() => navigate(`${currentPrefix}/workspaces`)}
            className="w-full inline-flex items-center justify-center gap-1.5 h-12 bg-[#A3E635] hover:bg-[#84CC16] text-[#111111] text-xs font-black rounded-[14px] transition shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
          >
            <span>Reserve New Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Admin: Schedule Manual Timeline Reservation"
      >
        <form onSubmit={handleSaveReservation} className="space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100 text-center">
              Timeline Scheduled Successfully!
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none">
              Workspace Resource
            </label>
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              className="w-full h-11 px-3 rounded-[12px] border border-neutral-200 text-sm focus:border-[#84CC16] focus:ring-2 focus:ring-[#84CC16]/10 outline-none bg-white text-[#111111] font-medium"
              required
            >
              <option value="">-- Select a Resource --</option>
              {dbWorkspaces.map((space: any) => (
                <option key={space.id || space._id} value={space.id || space._id}>
                  {space.name} ({space.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-11 px-3 rounded-[12px] border border-neutral-200 text-sm focus:border-[#84CC16] focus:ring-2 focus:ring-[#84CC16]/10 outline-none bg-white text-[#111111] font-medium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none">
                Reservation Type
              </label>
              <select
                value={reservationType}
                onChange={(e) => setReservationType(e.target.value as any)}
                className="w-full h-11 px-3 rounded-[12px] border border-neutral-200 text-sm focus:border-[#84CC16] focus:ring-2 focus:ring-[#84CC16]/10 outline-none bg-white text-[#111111] font-medium"
                required
              >
                <option value="Workspace">Workspace</option>
                <option value="Meeting">Meeting (Team meeting)</option>
                <option value="Event">Event (Company event)</option>
                <option value="Internal Work Schedule">Internal Work Schedule</option>
                <option value="Resource">Resource Reservation</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none">
              Timeline Title
            </label>
            <input
              type="text"
              placeholder="e.g. Q3 Alignments, Team Sprint, etc."
              value={reservationTitle}
              onChange={(e) => setReservationTitle(e.target.value)}
              className="w-full h-11 px-4 rounded-[12px] border border-neutral-200 text-sm focus:border-[#84CC16] focus:ring-2 focus:ring-[#84CC16]/10 outline-none bg-white text-[#111111] font-medium"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none">
              Purpose / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Workspace Utilization, Sprint Planning"
              value={bookingPurpose}
              onChange={(e) => setBookingPurpose(e.target.value)}
              className="w-full h-11 px-4 rounded-[12px] border border-neutral-200 text-sm focus:border-[#84CC16] focus:ring-2 focus:ring-[#84CC16]/10 outline-none bg-white text-[#111111] font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none">
                Start Time
              </label>
              <input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full h-11 px-3 rounded-[12px] border border-neutral-200 text-sm focus:border-[#84CC16] focus:ring-2 focus:ring-[#84CC16]/10 outline-none bg-white text-[#111111] font-medium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none">
                End Time
              </label>
              <input
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                className="w-full h-11 px-3 rounded-[12px] border border-neutral-200 text-sm focus:border-[#84CC16] focus:ring-2 focus:ring-[#84CC16]/10 outline-none bg-white text-[#111111] font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none">
              Organizer / Host Email
            </label>
            <input
              type="email"
              placeholder="e.g. host@weventurehub.com"
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-[12px] border border-neutral-200 text-sm focus:border-[#84CC16] focus:ring-2 focus:ring-[#84CC16]/10 outline-none bg-white text-[#111111] font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBookingMutation.isPending}
              className="px-6 py-2 bg-[#A3E635] hover:bg-[#84CC16] text-[#111111] text-xs font-black rounded-xl transition"
            >
              {createBookingMutation.isPending ? 'Scheduling...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
