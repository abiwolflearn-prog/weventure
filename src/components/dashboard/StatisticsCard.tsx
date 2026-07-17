import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface IStatisticsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string | number;
  changeType?: 'positive' | 'negative' | 'neutral';
  colorClass?: string;
  sparklineData?: number[];
  isLoading?: boolean;
}

export default function StatisticsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  colorClass = 'bg-brand-primary/10 text-brand-primary',
  sparklineData,
  isLoading = false,
}: IStatisticsCardProps) {
  
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-neutral-200 rounded w-1/3" />
          <div className="w-10 h-10 bg-neutral-200 rounded-xl" />
        </div>
        <div className="h-8 bg-neutral-200 rounded w-1/2" />
        <div className="flex items-center justify-between">
          <div className="h-3 bg-neutral-200 rounded w-1/4" />
          {sparklineData && <div className="h-6 bg-neutral-200 rounded w-20" />}
        </div>
      </div>
    );
  }

  // Calculate SVG polyline path for sparkline if data is provided
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    
    const width = 80;
    const height = 24;
    const maxVal = Math.max(...sparklineData);
    const minVal = Math.min(...sparklineData);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        const y = height - ((val - minVal) / range) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = 
      changeType === 'positive' 
        ? '#A3E635' /* Lemon Green success */
        : changeType === 'negative' 
        ? '#EF4444' 
        : '#2563EB';

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="bg-white border border-[#E5E7EB] p-6 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[14px] font-semibold tracking-tight text-[#6B7280]">
          {title}
        </span>
        <div className="p-2.5 rounded-[12px] bg-[#2563EB]/8 text-[#2563EB] transition-transform duration-300 group-hover:scale-110">
          <Icon className="w-5 h-5 text-[#2563EB]" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="font-display font-bold text-[28px] text-[#111827] tracking-tight leading-none">
            {value}
          </p>
          
          {change !== undefined && (
            <div className="flex items-center space-x-2 mt-3">
              {changeType === 'positive' && (
                <span className="inline-flex items-center text-[12px] font-bold px-2 py-0.5 rounded-md bg-[#A3E635]/15 text-[#65A30D]">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  {change}
                </span>
              )}
              {changeType === 'negative' && (
                <span className="inline-flex items-center text-[12px] font-bold px-2 py-0.5 rounded-md bg-[#EF4444]/10 text-[#EF4444]">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  {change}
                </span>
              )}
              {changeType === 'neutral' && (
                <span className="inline-flex items-center text-[12px] font-bold px-2 py-0.5 rounded-md bg-[#E5E7EB]/50 text-[#6B7280]">
                  <Minus className="w-3.5 h-3.5 mr-1" />
                  {change}
                </span>
              )}
              <span className="text-[12px] text-[#6B7280] font-normal select-none">vs prev month</span>
            </div>
          )}
        </div>

        {sparklineData && (
          <div className="self-end pb-1" title="Monthly performance trend">
            {renderSparkline()}
          </div>
        )}
      </div>
    </div>
  );
}
