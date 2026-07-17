import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppSelector } from '../../store';
import { TrendingUp, Users, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface TimelineData {
  date: string;
  [key: string]: any;
}

interface RevenueLineChartProps {
  data: TimelineData[];
  mode: 'revenue' | 'registrations' | 'occupancy';
  title: string;
  description?: string;
  accentLabel?: string;
}

export default function RevenueLineChart({
  data,
  mode,
  title,
  description,
  accentLabel,
}: RevenueLineChartProps) {
  const { theme } = useAppSelector((state) => state.ui);
  const isDark = theme === 'dark';

  // Consistently light/high-contrast design variables
  const gridStroke = '#E2E8F0';
  const labelColor = '#4B5563';
  const tooltipBg = '#FFFFFF';
  const tooltipBorder = '#E5E7EB';

  const formatYAxis = (value: number) => {
    if (mode === 'revenue') {
      return `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`;
    }
    if (mode === 'occupancy') {
      return `${value}%`;
    }
    return value.toString();
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'revenue':
        return <TrendingUp className="w-5 h-5 text-brand-primary" />;
      case 'registrations':
        return <Users className="w-5 h-5 text-emerald-500" />;
      case 'occupancy':
      default:
        return <Calendar className="w-5 h-5 text-violet-500" />;
    }
  };

  // Helper to format date label
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* CHART HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
            {getModeIcon()}
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#111827]">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#4B5563] mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {accentLabel && (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[10px] bg-brand-primary/10 text-brand-primary font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3 h-3 animate-pulse" />
            {accentLabel}
          </span>
        )}
      </div>

      {/* CHART MOUNT */}
      <div className="h-64 sm:h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-4 border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
            <p className="text-xs text-[#6B7280] font-semibold">No timeline data matches this date query</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B2EFF" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#5B2EFF" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="colorSub1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="colorSub2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="date"
                stroke={labelColor}
                fontSize={10}
                tickLine={false}
                tickFormatter={formatDate}
                dy={6}
              />
              <YAxis
                stroke={labelColor}
                fontSize={10}
                tickLine={false}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#111827',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
                labelClassName="font-bold mb-1"
                labelFormatter={(label) => `Interval: ${formatDate(label)}`}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px' }}
              />

              {mode === 'revenue' && (
                <>
                  <Area
                    type="monotone"
                    name="Combined Revenue ($)"
                    dataKey="totalRevenue"
                    stroke="#5B2EFF"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    name="Lease Revenue ($)"
                    dataKey="bookingRevenue"
                    stroke="#6366F1"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorSub2)"
                  />
                  <Area
                    type="monotone"
                    name="Ticket Sales ($)"
                    dataKey="ticketRevenue"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorSub1)"
                  />
                </>
              )}

              {mode === 'registrations' && (
                <Area
                  type="monotone"
                  name="Event signups"
                  dataKey="count"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSub1)"
                />
              )}

              {mode === 'occupancy' && (
                <Area
                  type="monotone"
                  name="Occupancy Index (%)"
                  dataKey="rate"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
