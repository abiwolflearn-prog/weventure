import React, { useState } from 'react';
import { 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  History,
  Clock,
  Filter,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { communicationApi } from '../../lib/communicationApi';

interface IActivityLog {
  id: string;
  userName: string;
  action: string;
  details: string;
  category: 'BOOKING' | 'EVENT' | 'PAYMENT' | 'ANNOUNCEMENT' | 'SYSTEM';
  level: 'INFO' | 'WARNING' | 'SUCCESS' | 'CRITICAL';
  timestamp: string;
}

const fallbackLogs: IActivityLog[] = [
  {
    id: 'f1',
    userName: 'Alex Chen',
    action: 'Booking Created',
    details: 'Reserved Tesla Boardroom (HQ-302) for Today 14:00.',
    category: 'BOOKING',
    level: 'SUCCESS',
    timestamp: '5m ago',
  },
  {
    id: 'f2',
    userName: 'Sarah Jenkins',
    action: 'Workspace Check-In',
    details: 'Checked into Acoustic Pod 4 via QR separation trigger.',
    category: 'BOOKING',
    level: 'INFO',
    timestamp: '18m ago',
  },
  {
    id: 'f3',
    userName: 'Platform Daemon',
    action: 'Tenant Separation Active',
    details: 'Verified database isolation container partitions.',
    category: 'SYSTEM',
    level: 'INFO',
    timestamp: '25m ago',
  }
];

export default function RecentActivityWidget() {
  const [filter, setFilter] = useState<'ALL' | 'BOOKING' | 'EVENT' | 'PAYMENT' | 'ANNOUNCEMENT' | 'SYSTEM'>('ALL');

  // Query actual activities from backend
  const { data: apiActivities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => communicationApi.getActivities(20),
    refetchInterval: 10000, // Auto-refresh every 10 seconds for real-time vibe
  });

  // Map API activities to widget format
  const mappedApiActivities: IActivityLog[] = apiActivities.map((act) => {
    // Determine level based on action types
    let level: IActivityLog['level'] = 'INFO';
    if (act.action.includes('CONFIRMED') || act.action.includes('SUCCESS') || act.action.includes('REGISTER')) {
      level = 'SUCCESS';
    } else if (act.action.includes('CANCEL') || act.action.includes('REJECT')) {
      level = 'CRITICAL';
    }

    // Determine category
    let category: IActivityLog['category'] = 'SYSTEM';
    if (act.resourceType === 'BOOKING') category = 'BOOKING';
    if (act.resourceType === 'EVENT') category = 'EVENT';
    if (act.resourceType === 'PAYMENT') category = 'PAYMENT';
    if (act.resourceType === 'ANNOUNCEMENT') category = 'ANNOUNCEMENT';

    // Format descriptive details
    let details = `Executed action: ${act.action} on ${act.resourceType}`;
    if (act.details && act.details.ticketNumber) {
      details = `Ticket: ${act.details.ticketNumber} | Registrant: ${act.userName}`;
    } else if (act.details && act.details.roomName) {
      details = `Reserved: ${act.details.roomName} | Period: ${act.details.timeSlot || 'Scheduled time'}`;
    } else if (act.details && act.details.amount) {
      details = `Processed payment of ${act.details.amount} ETB via secure gateway.`;
    }

    // Friendly time
    const date = new Date(act.createdAt);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let timestamp = 'Recent';
    if (seconds < 60) timestamp = 'Just now';
    else if (seconds < 3600) timestamp = `${Math.floor(seconds / 60)}m ago`;
    else if (seconds < 86400) timestamp = `${Math.floor(seconds / 3600)}h ago`;
    else timestamp = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return {
      id: act.id,
      userName: act.userName,
      action: act.action.replace(/_/g, ' '),
      details,
      category,
      level,
      timestamp
    };
  });

  // Use API activities if available, otherwise display elegant sandbox fallbacks
  const displayedLogs = mappedApiActivities.length > 0 ? mappedApiActivities : fallbackLogs;
  const filteredLogs = displayedLogs.filter((log) => filter === 'ALL' || log.category === filter);

  const getLogIcon = (level: IActivityLog['level']) => {
    switch (level) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-lime-500" />;
      case 'WARNING':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'INFO':
      default:
        return <PlusCircle className="w-4 h-4 text-[#84CC16]" />;
    }
  };

  const getLogCategoryColor = (category: IActivityLog['category']) => {
    switch (category) {
      case 'BOOKING':
        return 'bg-[#A3E635]/15 text-[#65A30D] font-bold';
      case 'EVENT':
        return 'bg-emerald-100 text-emerald-700 bg-emerald-50/30 dark:text-emerald-400';
      case 'PAYMENT':
        return 'bg-amber-100 text-amber-700 bg-amber-50/30 dark:text-amber-400';
      case 'ANNOUNCEMENT':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      case 'SYSTEM':
      default:
        return 'bg-neutral-slate-100 text-neutral-slate-700 dark:bg-neutral-slate-800/50 dark:text-neutral-slate-400';
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#A3E635]/10 rounded-[12px] text-[#84CC16] shrink-0">
            <History className="w-5 h-5 animate-pulse text-[#84CC16]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-[18px] text-gray-900 flex items-center gap-2">
              <span>Timeline Feed</span>
              {isLoading && <Loader2 className="w-4 h-4 text-[#84CC16] animate-spin" />}
            </h3>
            <p className="text-[14px] text-[#6B7280] mt-0.5">Chronological audit stream of platform events</p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-600 shrink-0 hidden sm:block" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-xs font-semibold px-2.5 py-1.5 border border-gray-200 bg-white text-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#A3E635]"
          >
            <option value="ALL">All Event Channels</option>
            <option value="BOOKING">Workspace Bookings</option>
            <option value="EVENT">Event & Ticketing</option>
            <option value="PAYMENT">Invoices & Payments</option>
            <option value="ANNOUNCEMENT">Announcements</option>
            <option value="SYSTEM">Platform Integrity</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative border-l-2 border-neutral-100 ml-4.5 pl-6 space-y-6">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-600">
            <History className="w-8 h-8 mx-auto opacity-20 mb-2" />
            <p className="text-xs font-semibold">No Activity Logged</p>
            <p className="text-[10px] mt-1">There are no events matching the selected filter.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="relative group">
              {/* Timeline Indicator Dot */}
              <div className="absolute -left-[31px] top-1.5 bg-white p-0.5 rounded-full ring-4 ring-neutral-50">
                {getLogIcon(log.level)}
              </div>

              {/* Log Entry Layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="font-display font-bold text-xs text-gray-900 capitalize">
                      {log.action}
                    </span>
                    <span className={`px-2 py-0.5 text-[8px] font-bold tracking-widest rounded-md uppercase select-none ${getLogCategoryColor(log.category)}`}>
                      {log.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-xl">
                    {log.details}
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-right self-start sm:self-center">
                  <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">
                    by {log.userName}
                  </span>
                  <span className="text-[10px] text-neutral-200 hidden sm:block">•</span>
                  <span className="text-[10px] text-gray-600 font-semibold inline-flex items-center select-none shrink-0 whitespace-nowrap">
                    <Clock className="w-3 h-3 mr-1 text-[#84CC16]" />
                    {log.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
