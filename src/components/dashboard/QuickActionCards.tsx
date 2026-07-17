import React from 'react';
import { 
  Building, 
  CalendarPlus, 
  Users2, 
  FileDown, 
  Sparkles,
  ArrowRight,
  Tv
} from 'lucide-react';

export interface IQuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  actionText: string;
  onClick: () => void;
}

export default function QuickActionCards() {
  const actions: IQuickAction[] = [
    {
      id: '1',
      title: 'Reserve Hot Desk',
      description: 'Book immediate workspace space in Sectors A-D with high load density.',
      icon: Building,
      color: 'bg-[#A3E635]/15 text-[#84CC16] group-hover:bg-[#A3E635] group-hover:text-[#111111]',
      actionText: 'Book Desk',
      onClick: () => alert('Launching desk reservation matrix flow...'),
    },
    {
      id: '2',
      title: 'Book Boardroom',
      description: 'Reserve state-of-the-art corporate boardrooms with full AV telemetry.',
      icon: CalendarPlus,
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
      actionText: 'Book Room',
      onClick: () => alert('Launching conference room schedule planner...'),
    },
    {
      id: '3',
      title: 'Host Public Event',
      description: 'Publish and promote ticketed conferences, webinars, or social networking.',
      icon: Tv,
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white',
      actionText: 'Publish Event',
      onClick: () => alert('Opening community events builder...'),
    },
    {
      id: '4',
      title: 'Invite Teammate',
      description: 'Grant role-based member credentials to external employees or staff.',
      icon: Users2,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white',
      actionText: 'Invite Cohort',
      onClick: () => alert('Opening guest role invite console...'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2.5">
        <Sparkles className="w-4 h-4 text-[#84CC16]" />
        <h3 className="font-display font-bold text-[14px] text-[#6B7280] uppercase tracking-wider">
          Quick Access Hub
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className="group bg-white border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-left transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 flex flex-col justify-between h-52 focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
            >
              <div>
                <div className={`p-2.5 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${act.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-base text-gray-900 mt-4.5 group-hover:text-[#84CC16] transition-colors">
                  {act.title}
                </h4>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed line-clamp-2 font-medium">
                  {act.description}
                </p>
              </div>

              <div className="flex items-center space-x-1 text-xs font-bold text-[#84CC16] group-hover:text-[#65A30D] mt-3 select-none">
                <span>{act.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
