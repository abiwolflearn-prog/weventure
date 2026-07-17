import React from 'react';
import { Building } from 'lucide-react';

export default function OrganizationSwitcher() {
  return (
    <div className="flex items-center space-x-2.5 px-3 py-1.5 border border-neutral-slate-200/60 bg-white rounded-xl text-neutral-slate-700 select-none">
      <div className="w-6.5 h-6.5 rounded-lg bg-brand-primary bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
        WV
      </div>
      <div className="text-left leading-tight hidden sm:block">
        <p className="text-xs font-bold text-gray-900 truncate">
          WeVentureHub HQ
        </p>
        <p className="text-[10px] text-neutral-slate-400 font-medium">
          Enterprise HQ • 1,420 members
        </p>
      </div>
    </div>
  );
}

