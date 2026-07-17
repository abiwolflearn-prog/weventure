import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '../../store';
import { PieChart as PieIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface PieItem {
  name: string;
  value: number;
  color?: string;
  count?: number;
  revenue?: number;
}

interface DistributionPieChartProps {
  data: PieItem[];
  title: string;
  description?: string;
  centerLabel?: string;
  centerSublabel?: string;
}

export default function DistributionPieChart({
  data,
  title,
  description,
  centerLabel,
  centerSublabel,
}: DistributionPieChartProps) {
  const { theme } = useAppSelector((state) => state.ui);
  const isDark = theme === 'dark';

  // Fallback palette of high quality UI colors
  const defaultColors = [
    '#84CC16', // Success Lemon Green
    '#10B981', // Emerald
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EF4444', // Red
    '#14B8A6', // Teal
  ];

  const chartData = data.map((item, idx) => ({
    ...item,
    color: item.color || defaultColors[idx % defaultColors.length],
  }));

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const tooltipBg = '#FFFFFF';
  const tooltipBorder = '#E5E7EB';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[360px]"
    >
      <div>
        {/* CHART HEADER */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-[#4B5563]">
            <PieIcon className="w-4 h-4" />
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

        {/* CHART GRAPHIC */}
        <div className="h-44 w-full relative">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#6B7280] border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
              No segmentation found
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#111827',
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Summary Counter */}
              {(centerLabel || centerSublabel) && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
                  <p className="font-display font-extrabold text-base text-[#111827] leading-none">
                    {centerLabel || totalValue}
                  </p>
                  {centerSublabel && (
                    <p className="text-[9px] text-[#6B7280] font-bold mt-1 uppercase tracking-wider">
                      {centerSublabel}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* DETAILED LEDGER GRID */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-[#E5E7EB] pt-4 mt-3">
        {chartData.slice(0, 4).map((item) => {
          const percentage = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center space-x-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="leading-none min-w-0 flex-grow">
                <p className="text-[10px] text-[#4B5563] font-medium truncate">
                  {item.name}
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-bold text-[#111827]">
                    {item.value.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-[#6B7280] font-semibold">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
