import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Video, MapPin, User, Clock, ArrowRight } from 'lucide-react';

interface IEvent {
  id: string;
  title: string;
  type: 'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE';
  space: string;
  time: string;
  host: string;
  date: string; // 'YYYY-MM-DD'
}

const initialEvents: IEvent[] = [
  { id: '1', title: 'Tesla Boardroom Alignment', type: 'MEETING_ROOM', space: 'Tesla Boardroom (HQ-302)', time: '14:00 - 15:30', host: 'Alex Chen', date: '2026-06-30' },
  { id: '2', title: 'Acoustic Pod Sprint', type: 'HOT_DESK', space: 'Acoustic Pod 4', time: '09:00 - 11:00', host: 'Sarah Jenkins', date: '2026-06-30' },
  { id: '3', title: 'Global Tech Meetup Host', type: 'EVENT_VENUE', space: 'Silicon Arena Suite (Level 1)', time: '17:30 - 20:30', host: 'WeVenture Hub HQ', date: '2026-07-02' },
  { id: '4', title: 'Product Launch Audits', type: 'MEETING_ROOM', space: 'Tesla Boardroom (HQ-302)', time: '11:00 - 12:30', host: 'David Kim', date: '2026-07-05' },
  { id: '5', title: 'Marketing Design Review', type: 'MEETING_ROOM', space: 'Room 101 Creative', time: '14:00 - 16:00', host: 'Emma Watson', date: '2026-07-05' },
  { id: '6', title: 'DevOps Cohort Standup', type: 'HOT_DESK', space: 'Dev Zone Table 3', time: '09:00 - 10:00', host: 'Sanjay Patel', date: '2026-07-08' },
];

export default function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 30)); // June 2026
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-30');

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
    return initialEvents.filter((ev) => ev.date === dayString);
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
        className={`group relative p-2 md:p-3 text-center border border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-brand-primary flex flex-col justify-between items-center h-12 md:h-14 ${
          isSelected
            ? 'bg-brand-primary text-white font-bold shadow-sm'
            : isToday
            ? 'bg-brand-primary/10 text-brand-primary font-bold border-brand-primary'
            : 'hover:bg-neutral-slate-50 hover:bg-gray-150'
        }`}
      >
        <span className={`text-xs md:text-sm ${isSelected ? 'text-white' : 'text-gray-800'}`}>
          {day}
        </span>
        
        {/* Indicators */}
        {dayEvents.length > 0 && (
          <div className="flex gap-1 justify-center mt-1">
            {dayEvents.slice(0, 3).map((ev) => {
              let dotColor = 'bg-brand-primary';
              if (ev.type === 'EVENT_VENUE') dotColor = 'bg-indigo-500';
              if (ev.type === 'HOT_DESK') dotColor = 'bg-emerald-500';
              return (
                <span
                  key={ev.id}
                  className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isSelected ? 'bg-white' : dotColor}`}
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
        return 'bg-brand-primary/10 text-brand-primary';
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
            <div className="p-2.5 bg-[#2563EB]/8 rounded-[12px] text-blue-600">
              <Calendar className="w-5 h-5 text-[#2563EB]" />
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
                  className="p-3.5 border border-neutral-100 hover:border-blue-600 bg-neutral-50/50 rounded-xl transition"
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
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100">
          <button
            onClick={() => alert('Redirecting to the dynamic space reservation wizard...')}
            className="w-full inline-flex items-center justify-center gap-1.5 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-[14px] transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
          >
            <span>Reserve New Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
