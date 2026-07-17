import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAppSelector } from '../../store';
import { BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface BarItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

interface LeaseBarChartProps {
  data: BarItem[];
  title: string;
  description?: string;
  primaryKey: string;
  secondaryKey?: string;
  primaryLabel: string;
  secondaryLabel?: string;
  unit?: string;
}

export default function LeaseBarChart({
  data,
  title,
  description,
  primaryKey,
  secondaryKey,
  primaryLabel,
  secondaryLabel,
  unit = '',
}: LeaseBarChartProps) {
  const { theme } = useAppSelector((state) => state.ui);
  const isDark = theme === 'dark';

  const gridStroke = '#E2E8F0';
  const labelColor = '#4B5563';
  const tooltipBg = '#FFFFFF';
  const tooltipBorder = '#E5E7EB';

  const formatValue = (val: number) => {
    if (unit === '$') return `$${val.toLocaleString()}`;
    return `${val.toLocaleString()}${unit}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] h-[360px] flex flex-col justify-between"
    >
      <div>
        {/* CHART HEADER */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-[#4B5563]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-[#111827]">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] text-[#4B5563] mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* CHART MOUNT */}
        <div className="h-56 w-full">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#6B7280] border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
              No comparative records
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="label" stroke={labelColor} fontSize={10} tickLine={false} />
                <YAxis
                  stroke={labelColor}
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={formatValue}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#111827',
                  }}
                  cursor={{ fill: 'rgba(91, 46, 255, 0.03)' }}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar
                  name={primaryLabel}
                  dataKey={primaryKey}
                  fill="#5B2EFF"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#5B2EFF'} />
                  ))}
                </Bar>
                {secondaryKey && (
                  <Bar
                    name={secondaryLabel || ''}
                    dataKey={secondaryKey}
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
}
