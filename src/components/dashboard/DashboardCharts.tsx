import React from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useAppSelector } from '../../store';
import { TrendingUp, BarChart3, PieChartIcon, ArrowRight } from 'lucide-react';

// Sample analytic dataset 1: Weekly Occupancy Index
const occupancyData = [
  { day: 'Mon', hotDesks: 64, meetingRooms: 50, venues: 40 },
  { day: 'Tue', hotDesks: 78, meetingRooms: 72, venues: 55 },
  { day: 'Wed', hotDesks: 92, meetingRooms: 85, venues: 70 },
  { day: 'Thu', hotDesks: 88, meetingRooms: 78, venues: 65 },
  { day: 'Fri', hotDesks: 75, meetingRooms: 60, venues: 80 },
  { day: 'Sat', hotDesks: 42, meetingRooms: 30, venues: 90 },
  { day: 'Sun', hotDesks: 30, meetingRooms: 20, venues: 85 },
];

// Sample analytic dataset 2: Monthly Workspace revenue distribution
const revenueData = [
  { month: 'Jan', revenue: 12500, target: 15000 },
  { month: 'Feb', revenue: 14800, target: 16000 },
  { month: 'Mar', revenue: 19200, target: 18000 },
  { month: 'Apr', revenue: 17500, target: 18500 },
  { month: 'May', revenue: 22400, target: 20000 },
  { month: 'Jun', revenue: 26800, target: 22000 },
];

// Sample analytic dataset 3: Membership demographic sectors
const memberData = [
  { name: 'Enterprise Staff', value: 640, color: '#2563EB' },
  { name: 'Growth Members', value: 420, color: '#A3E635' },
  { name: 'Media Creators', value: 260, color: '#60A5FA' },
  { name: 'External Guests', value: 100, color: '#94A3B8' },
];

export default function DashboardCharts() {
  const { theme } = useAppSelector((state) => state.ui);
  const isDark = theme === 'dark';

  // Theme-aware variables for typography and grids
  const gridStroke = '#E5E7EB'; /* Standard premium border */
  const labelColor = '#4B5563'; /* High contrast secondary text */
  const tooltipBg = '#FFFFFF';
  const tooltipBorder = '#E5E7EB';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Area Chart: Weekly Load Index */}
      <div className="lg:col-span-2 bg-white border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#2563EB]/8 rounded-[12px] text-blue-600">
              <TrendingUp className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[18px] text-[#111827]">Workspace Load Density</h3>
              <p className="text-[14px] text-[#6B7280] mt-0.5">Real-time occupancy percentage indexed daily</p>
            </div>
          </div>
          <span className="text-[12px] bg-[#A3E635]/20 text-[#4D7C0F] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
            +18.4% Efficiency
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHotdesks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorRooms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A3E635" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#A3E635" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="day" stroke={labelColor} fontSize={11} tickLine={false} />
              <YAxis stroke={labelColor} fontSize={11} tickLine={false} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', fontSize: '11px', color: '#111111' }}
                labelClassName="font-bold mb-1"
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" name="Hot desks" dataKey="hotDesks" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHotdesks)" />
              <Area type="monotone" name="Meeting Rooms" dataKey="meetingRooms" stroke="#A3E635" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRooms)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Doughnut Chart: Membership Division */}
      <div className="bg-white border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2.5 bg-[#2563EB]/8 rounded-[12px] text-blue-600">
              <PieChartIcon className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[18px] text-[#111827]">Tenant Cohort Structure</h3>
              <p className="text-[14px] text-[#6B7280] mt-0.5">Demographic division of active users</p>
            </div>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', fontSize: '11px' }}
                />
                <Pie
                  data={memberData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memberData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Summary Label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
              <p className="font-display font-bold text-[22px] text-[#2563EB] leading-none">
                1,420
              </p>
              <p className="text-[10px] text-[#6B7280] font-bold mt-1.5 uppercase tracking-wider">Members</p>
            </div>
          </div>
        </div>

        {/* Customized legend items for clean typography */}
        <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3.5 mt-3">
          {memberData.map((item) => (
            <div key={item.name} className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="leading-none min-w-0">
                <p className="text-[11px] text-[#6B7280] truncate">{item.name}</p>
                <p className="text-[14px] font-bold text-[#111827] mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bar Chart: Workspace Revenue Stream */}
      <div className="lg:col-span-3 bg-white border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#2563EB]/8 rounded-[12px] text-blue-600">
              <BarChart3 className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[18px] text-[#111827]">Workspace Profit Performance</h3>
              <p className="text-[14px] text-[#6B7280] mt-0.5">Aggregated monthly revenues plotted against targets</p>
            </div>
          </div>

          <button 
            onClick={() => alert('Opening full analytics & metrics ledger...')}
            className="text-[14px] font-bold text-[#2563EB] hover:text-blue-700 inline-flex items-center select-none hover:underline"
          >
            <span>Full analytics ledger</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="h-60 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" stroke={labelColor} fontSize={11} tickLine={false} />
              <YAxis stroke={labelColor} fontSize={11} tickLine={false} unit="$" />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', fontSize: '11px' }}
                cursor={{ fill: 'rgba(37, 99, 235, 0.04)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar name="Actual Revenue ($)" dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar name="Target Goal ($)" dataKey="target" fill="#A3E635" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
