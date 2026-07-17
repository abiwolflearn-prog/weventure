import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  DollarSign, 
  Building, 
  Ticket, 
  Users, 
  CalendarRange, 
  Clock,
  LucideIcon
} from 'lucide-react';

export interface IKpiItem {
  key: string;
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  description?: string;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky';
  unit?: string;
}

interface KpiCardsGridProps {
  items: IKpiItem[];
}

export default function KpiCardsGrid({ items }: KpiCardsGridProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          iconBg: 'bg-emerald-50 border border-emerald-100 text-emerald-700'
        };
      case 'amber':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          iconBg: 'bg-amber-50 border border-amber-100 text-amber-700'
        };
      case 'rose':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          iconBg: 'bg-rose-50 border border-rose-100 text-rose-700'
        };
      case 'violet':
        return {
          bg: 'bg-violet-50',
          text: 'text-violet-700',
          border: 'border-violet-200',
          iconBg: 'bg-violet-50 border border-violet-100 text-violet-700'
        };
      case 'sky':
        return {
          bg: 'bg-sky-50',
          text: 'text-sky-700',
          border: 'border-sky-200',
          iconBg: 'bg-sky-50 border border-sky-100 text-sky-700'
        };
      case 'indigo':
      default:
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          iconBg: 'bg-blue-50 border border-blue-100 text-blue-700'
        };
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardAnim = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5"
    >
      {items.map((item) => {
        const classes = getColorClasses(item.color);
        const Icon = item.icon;
        const isPositive = item.change > 0;
        const isNegative = item.change < 0;

        return (
          <motion.div
            key={item.key}
            variants={cardAnim}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
            id={`kpi-card-${item.key}`}
          >
            {/* Ambient Background Accent Spot */}
            <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-10 bg-blue-600/10`} />

            <div className="flex items-start justify-between">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-900 select-none">
                {item.title}
              </span>
              <div className={`p-2.5 rounded-xl ${classes.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-display font-extrabold text-2xl text-blue-600 tracking-tight">
                {item.value}
              </h3>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span
                className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md ${
                  isPositive
                    ? 'bg-lime-500/10 text-lime-500'
                    : isNegative
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-neutral-100 text-gray-600'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : isNegative ? (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <Minus className="w-3 h-3 mr-0.5" />
                )}
                {Math.abs(item.change)}%
              </span>
              <span className="text-gray-600 font-medium truncate max-w-[120px]">
                {item.description || 'v.s. past month'}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
