import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, User } from 'lucide-react';

interface IBookingCalendarProps {
  bookings: any[];
  workspaces: any[];
  selectedWorkspaceId?: string;
  onSelectTimeSlot?: (date: Date, startHour: number, endHour: number) => void;
}

export function BookingCalendar({
  bookings = [],
  workspaces = [],
  selectedWorkspaceId,
  onSelectTimeSlot,
}: IBookingCalendarProps) {
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'TIMELINE'>('MONTH');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Workspace map for easy retrieval
  const workspaceMap = React.useMemo(() => {
    return new Map(workspaces.map((w) => [w.id, w]));
  }, [workspaces]);

  // Handle month increments
  const adjustDate = (amount: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'MONTH') {
      next.setMonth(next.getMonth() + amount);
    } else if (viewMode === 'WEEK') {
      next.setDate(next.getDate() + amount * 7);
    } else {
      next.setDate(next.getDate() + amount);
    }
    setCurrentDate(next);
  };

  // ----------------------------------------------------
  // 1. MONTHLY CALENDAR VIEW
  // ----------------------------------------------------
  const renderMonthlyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const calendarCells: (Date | null)[] = Array(firstDayIndex).fill(null);
    for (let d = 1; d <= totalDays; d++) {
      calendarCells.push(new Date(year, month, d));
    }

    const todayStr = new Date().toDateString();

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-neutral-slate-400 uppercase tracking-wider pb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((date, idx) => {
            if (!date) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="aspect-square bg-neutral-slate-50/25 bg-white/10 rounded-xl border border-dashed border-gray-200"
                />
              );
            }

            const dayBookings = bookings.filter((bkg) => {
              if (bkg.status === 'CANCELLED') return false;
              if (selectedWorkspaceId && bkg.spaceId !== selectedWorkspaceId) return false;
              const bkgDate = new Date(bkg.startTime);
              return bkgDate.toDateString() === date.toDateString();
            });

            const isToday = date.toDateString() === todayStr;

            return (
              <div
                key={date.toISOString()}
                onClick={() => {
                  if (onSelectTimeSlot) {
                    onSelectTimeSlot(date, 9, 10);
                  }
                }}
                className={`min-h-[70px] p-2 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer group ${
                  isToday
                    ? 'bg-brand-primary/5 border-brand-primary'
                    : 'bg-white border-gray-200 hover:border-neutral-slate-350 dark:hover:border-neutral-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? 'text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-md'
                        : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-ping" />
                  )}
                </div>

                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayBookings.slice(0, 2).map((bkg) => {
                    const space = workspaceMap.get(bkg.spaceId);
                    return (
                      <div
                        key={bkg.id}
                        className="text-[9px] font-bold px-1 py-0.5 rounded truncate bg-[#F3F4F6] text-gray-600 border-l-2 border-brand-primary"
                        title={`${space?.name || 'Workspace'}: ${new Date(
                          bkg.startTime
                        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        {space?.name || 'Workspace'}
                      </div>
                    );
                  })}
                  {dayBookings.length > 2 && (
                    <p className="text-[8px] text-neutral-slate-400 font-extrabold">
                      +{dayBookings.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 2. WEEKLY DAY-HOUR PLANNER
  // ----------------------------------------------------
  const renderWeeklyView = () => {
    // Calculate 7 days from start of week
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      weekDays.push(d);
    }

    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[650px] space-y-2">
          {/* Header */}
          <div className="grid grid-cols-8 gap-2 border-b border-gray-200 pb-2">
            <div className="text-xs font-bold text-neutral-slate-400 uppercase py-1">Time</div>
            {weekDays.map((date) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={date.toISOString()} className="text-center py-1">
                  <p className="text-[10px] font-bold text-neutral-slate-400 uppercase">
                    {date.toLocaleDateString([], { weekday: 'short' })}
                  </p>
                  <p
                    className={`text-xs font-extrabold mt-0.5 inline-block px-2 py-0.5 rounded-lg ${
                      isToday ? 'bg-brand-primary text-white' : 'text-gray-900'
                    }`}
                  >
                    {date.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Hourly grid */}
          <div className="space-y-1">
            {hours.map((hour) => {
              const timeString = `${hour.toString().padStart(2, '0')}:00`;
              return (
                <div key={hour} className="grid grid-cols-8 gap-2 items-center">
                  <div className="text-[10px] font-mono font-bold text-neutral-slate-400 py-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-slate-300" />
                    <span>{timeString}</span>
                  </div>

                  {weekDays.map((date) => {
                    // Find active bookings in this exact hour cell
                    const cellStart = new Date(date);
                    cellStart.setHours(hour, 0, 0, 0);
                    const cellEnd = new Date(date);
                    cellEnd.setHours(hour + 1, 0, 0, 0);

                    const activeBkg = bookings.find((bkg) => {
                      if (bkg.status === 'CANCELLED') return false;
                      if (selectedWorkspaceId && bkg.spaceId !== selectedWorkspaceId) return false;
                      const bStart = new Date(bkg.startTime);
                      const bEnd = new Date(bkg.endTime);
                      return bStart < cellEnd && bEnd > cellStart;
                    });

                    const space = activeBkg ? workspaceMap.get(activeBkg.spaceId) : null;

                    return (
                      <div
                        key={date.toISOString() + hour}
                        onClick={() => {
                          if (!activeBkg && onSelectTimeSlot) {
                            onSelectTimeSlot(date, hour, hour + 1);
                          }
                        }}
                        className={`h-11 rounded-lg border text-left p-1.5 flex flex-col justify-between transition cursor-pointer ${
                          activeBkg
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary cursor-not-allowed'
                            : 'bg-neutral-slate-50/50 bg-white/30 border-gray-200 hover:border-brand-primary/40'
                        }`}
                      >
                        {activeBkg ? (
                          <div className="overflow-hidden">
                            <p className="text-[8px] font-extrabold truncate uppercase leading-tight">
                              Busy
                            </p>
                            <p className="text-[7px] text-neutral-slate-400 font-bold truncate">
                              {space?.name || 'Reserved'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[8px] text-neutral-slate-300 opacity-0 group-hover:opacity-100 font-bold uppercase">
                            Book
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 3. RESOURCE-BASED TIMELINE VIEW
  // ----------------------------------------------------
  const renderTimelineView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 to 21:00

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px] space-y-4">
          {/* Hourly Timeline Header */}
          <div className="flex border-b border-gray-200 pb-2">
            <div className="w-48 shrink-0 text-xs font-bold text-neutral-slate-400 uppercase">
              Workspace Resource
            </div>
            <div className="flex-1 flex justify-between">
              {hours.map((hour) => (
                <div key={hour} className="w-12 text-center font-mono text-[10px] font-bold text-neutral-slate-400">
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {workspaces.map((space) => {
              return (
                <div key={space.id} className="flex items-center">
                  {/* Space Profile */}
                  <div className="w-48 shrink-0 pr-4">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {space.name}
                    </p>
                    <p className="text-[9px] text-neutral-slate-400 font-extrabold uppercase mt-0.5">
                      {space.type.replace('_', ' ')} · {space.capacity} pax
                    </p>
                  </div>

                  {/* Hourly Gantt Slots */}
                  <div className="flex-1 flex justify-between relative h-10 bg-[#F9FAFB] rounded-xl border border-gray-200 overflow-hidden">
                    {hours.map((hour, idx) => {
                      const cellStart = new Date(currentDate);
                      cellStart.setHours(hour, 0, 0, 0);
                      const cellEnd = new Date(currentDate);
                      cellEnd.setHours(hour + 1, 0, 0, 0);

                      const activeBkg = bookings.find((bkg) => {
                        if (bkg.status === 'CANCELLED') return false;
                        if (bkg.spaceId !== space.id) return false;
                        const bStart = new Date(bkg.startTime);
                        const bEnd = new Date(bkg.endTime);
                        return bStart < cellEnd && bEnd > cellStart;
                      });

                      return (
                        <div
                          key={hour}
                          onClick={() => {
                            if (!activeBkg && onSelectTimeSlot) {
                              onSelectTimeSlot(currentDate, hour, hour + 1);
                            }
                          }}
                          className={`flex-1 border-r border-gray-200 last:border-r-0 h-full flex items-center justify-center transition cursor-pointer relative group ${
                            activeBkg
                              ? 'bg-brand-primary/20 border-brand-primary/25 cursor-not-allowed'
                              : 'hover:bg-brand-primary/5'
                          }`}
                        >
                          {activeBkg ? (
                            <div className="absolute inset-x-0.5 h-6 bg-brand-primary rounded-md flex items-center justify-center shadow-sm">
                              <span className="text-[8px] font-extrabold text-white uppercase tracking-wider truncate px-1">
                                Reserved
                              </span>
                            </div>
                          ) : (
                            <span className="text-[8px] font-bold text-neutral-slate-300 opacity-0 group-hover:opacity-100">
                              +
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 space-y-6">
      {/* Selector Head */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#F3F4F6] p-1.5 rounded-xl border">
            {(['MONTH', 'WEEK', 'TIMELINE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === mode
                    ? 'bg-white bg-[#F9FAFB] text-neutral-slate-950 dark:text-white shadow-sm'
                    : 'text-neutral-slate-450 hover:text-neutral-slate-600'
                }`}
              >
                {mode === 'MONTH' ? 'Month' : mode === 'WEEK' ? 'Week' : 'Resource Timeline'}
              </button>
            ))}
          </div>
        </div>

        {/* Date switcher controllers */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustDate(-1)}
            className="p-2 border rounded-lg hover:bg-neutral-slate-50 hover:bg-gray-100 text-neutral-slate-600 dark:text-neutral-slate-350 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-slate-400 font-mono">
              {viewMode === 'MONTH'
                ? currentDate.toLocaleDateString([], { year: 'numeric' })
                : viewMode === 'WEEK'
                ? `Week of`
                : `Timeline View`}
            </h3>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {viewMode === 'MONTH'
                ? currentDate.toLocaleDateString([], { month: 'long' })
                : currentDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => adjustDate(1)}
            className="p-2 border rounded-lg hover:bg-neutral-slate-50 hover:bg-gray-100 text-neutral-slate-600 dark:text-neutral-slate-350 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary view switch body */}
      <div className="pt-2">
        {viewMode === 'MONTH' && renderMonthlyView()}
        {viewMode === 'WEEK' && renderWeeklyView()}
        {viewMode === 'TIMELINE' && renderTimelineView()}
      </div>

      {/* Foot notes */}
      <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-neutral-slate-400 pt-2 border-t border-dashed border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-brand-primary/10 border border-brand-primary" />
          <span>Active Bookings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-[#F9FAFB] border" />
          <span>Available Time Slots</span>
        </div>
        <p className="text-[10px] text-neutral-slate-400 italic">
          * Buffer times configured for each workspace are automatically enforced around bookings.
        </p>
      </div>
    </div>
  );
}
