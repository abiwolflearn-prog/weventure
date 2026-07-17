import React, { useState } from 'react';
import { 
  ChevronRight, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  Calendar as CalendarIcon,
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ==========================================
// TYPOGRAPHY SYSTEM CONSTANTS (Reference)
// Heading 1: 32px (text-[32px] font-bold text-[#111111])
// Heading 2: 24px (text-2xl font-bold text-[#111111])
// Heading 3: 20px (text-xl font-bold text-[#111111])
// Body:      16px (text-base text-[#6B7280])
// Small:     14px (text-sm text-[#6B7280])
// ==========================================

// 1. DashboardCard
interface IDashboardCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({ title, description, action, children, className = '' }: IDashboardCardProps) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}>
      {(title || description || action) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && <h3 className="text-lg font-bold text-[#111111] tracking-tight">{title}</h3>}
            {description && <p className="text-sm text-[#6B7280] mt-1 font-medium">{description}</p>}
          </div>
          {action && <div className="shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// 2. StatCard & MetricCard
interface IStatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, subtext, trend, icon, className = '' }: IStatCardProps) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">{title}</span>
        {icon && <div className="p-2.5 bg-neutral-50 rounded-xl text-[#2563EB]">{icon}</div>}
      </div>
      <div className="mt-4">
        <span className="text-[32px] font-bold text-[#2563EB] tracking-tight leading-none">{value}</span>
        
        {(trend || subtext) && (
          <div className="flex items-center space-x-2 mt-2">
            {trend && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                trend.isPositive ? 'bg-[#A3E635]/15 text-[#659714]' : 'bg-[#EF4444]/15 text-[#EF4444]'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
            {subtext && <span className="text-xs text-[#6B7280] font-medium">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// 3. InfoCard
export function InfoCard({ title, description, children, className = '' }: IDashboardCardProps) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}>
      {title && <h4 className="text-base font-bold text-[#111111] mb-2">{title}</h4>}
      {description && <p className="text-sm text-[#6B7280] mb-4 font-medium">{description}</p>}
      {children}
    </div>
  );
}

// 4. DataTable Wrapper
interface IDataTableProps<T> {
  columns: {
    header: string;
    accessor: keyof T | string;
    render?: (row: T) => React.ReactNode;
  }[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, isLoading, emptyMessage = 'No matching entries found.' }: IDataTableProps<T>) {
  return (
    <div className="w-full overflow-hidden border border-neutral-200 rounded-[20px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/70 border-b border-neutral-200">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#111111]">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-6 py-4">
                      <div className="h-4 bg-neutral-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm font-medium text-[#6B7280]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-neutral-50/50 transition-colors">
                  {columns.map((col, cIdx) => {
                    const value = col.render 
                      ? col.render(row) 
                      : (row[col.accessor as keyof T] as unknown as React.ReactNode);
                    return (
                      <td key={cIdx} className="px-6 py-4 text-sm font-medium text-[#111111]">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 5. Drawer Component
interface IDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: IDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white border-l border-neutral-200 flex flex-col shadow-2xl"
            >
              <div className="h-16 px-6 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#111111]">{title || 'Details'}</h3>
                <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg text-[#6B7280] transition-colors">
                  <X className="w-5 h-5 text-[#111111]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 6. Select Component
interface ISelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  className?: string;
  id?: string;
}

export function Select({ label, error, options, className = '', id, ...props }: ISelectProps) {
  const uniqueId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full flex flex-col space-y-2">
      {label && (
        <label htmlFor={uniqueId} className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={uniqueId}
          className={`w-full h-12 px-4 pr-10 rounded-[14px] border text-sm transition-all duration-200 outline-none bg-white text-[#111111] appearance-none cursor-pointer
            ${
              error 
                ? 'border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10' 
                : 'border-neutral-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10'
            }
            ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#6B7280]">
          <ChevronDown className="w-4 h-4 text-[#111111]" />
        </div>
      </div>
      {error && (
        <span className="text-xs font-bold text-[#EF4444] select-none">
          {error}
        </span>
      )}
    </div>
  );
}

// 7. Badge Component
interface IBadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'light-blue' | 'lemon' | 'gray' | 'red';
  className?: string;
}

export function Badge({ children, variant = 'gray', className = '' }: IBadgeProps) {
  const styles = {
    blue: 'bg-[#2563EB]/10 text-[#2563EB]',
    'light-blue': 'bg-sky-50 text-sky-600 border border-sky-100',
    lemon: 'bg-[#A3E635]/15 text-[#5e8b12]',
    gray: 'bg-neutral-100 text-[#6B7280]',
    red: 'bg-[#EF4444]/10 text-[#EF4444]'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide select-none ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

// 8. Avatar Component
interface IAvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, imageUrl, size = 'md', className = '' }: IAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg'
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-sky-500 text-white font-bold overflow-hidden select-none ${sizes[size]} ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// 9. Timeline Component
interface ITimelineItem {
  id: string | number;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export function Timeline({ items }: { items: ITimelineItem[] }) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {items.map((item, itemIdx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {itemIdx !== items.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm font-bold text-[#111111]">{item.title}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5 font-medium">{item.description}</p>
                  </div>
                  <div className="text-right text-xs font-semibold text-[#6B7280] whitespace-nowrap">
                    {item.timestamp}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 10. Calendar Widget Component (Clean date-display preview)
export function CalendarWidget({ date = new Date() }: { date?: Date }) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dateNum = date.getDate();
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });

  return (
    <div className="w-14 h-15 rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col items-center justify-center shadow-sm shrink-0 select-none">
      <div className="bg-[#2563EB] text-white text-[10px] font-bold w-full text-center py-0.5 tracking-wider">
        {dayName}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center leading-tight">
        <span className="text-base font-bold text-[#111111]">{dateNum}</span>
        <span className="text-[9px] text-[#6B7280] font-bold uppercase">{monthName}</span>
      </div>
    </div>
  );
}

// 11. Chart Wrapper
export function ChartWrapper({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {title && <h3 className="text-base font-bold text-[#111111] mb-6 tracking-tight">{title}</h3>}
      <div className="h-72 w-full">{children}</div>
    </div>
  );
}

// 12. Notification Banner / Alert
interface INotificationProps {
  title: string;
  message?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  onDismiss?: () => void;
}

export function NotificationBanner({ title, message, type = 'info', onDismiss }: INotificationProps) {
  const styles = {
    success: 'bg-[#A3E635]/10 border-[#A3E635] text-[#5e8b12]',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
    error: 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]',
    info: 'bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB]'
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#5e8b12] shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />,
    info: <Bell className="w-5 h-5 text-[#2563EB] shrink-0" />
  };

  return (
    <div className={`p-4 rounded-xl border flex items-start justify-between ${styles[type]} shadow-sm`}>
      <div className="flex space-x-3">
        {icons[type]}
        <div>
          <h5 className="text-sm font-bold">{title}</h5>
          {message && <p className="text-xs mt-1 font-semibold opacity-90">{message}</p>}
        </div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 hover:bg-black/5 rounded-lg text-current transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// 13. SearchBar
interface ISearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (term: string) => void;
  className?: string;
}

export function SearchBar({ onSearch, className = '', ...props }: ISearchBarProps) {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B7280]">
        <Search className="w-4.5 h-4.5 text-[#111111]" />
      </div>
      <input
        type="text"
        className={`w-full h-12 pl-11 pr-4 rounded-[14px] border border-neutral-200 text-sm bg-white text-[#111111] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 outline-none transition-all ${className}`}
        onChange={(e) => onSearch?.(e.target.value)}
        {...props}
      />
    </div>
  );
}

// 14. Toolbar Wrapper (For buttons, filters)
export function Toolbar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border border-neutral-200 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}>
      {children}
    </div>
  );
}

// 15. PageHeader
interface IPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { name: string; path?: string }[];
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }: IPageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 select-none">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-[#6B7280]" />}
              <span className={idx === breadcrumbs.length - 1 ? 'text-[#111111]' : ''}>
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#111111] tracking-tight leading-none">{title}</h1>
          {subtitle && <p className="text-base text-[#6B7280] mt-1.5 font-medium">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center space-x-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

// 16. Breadcrumb
export function Breadcrumb({ items }: { items: { name: string; active?: boolean }[] }) {
  return (
    <nav className="flex items-center space-x-1 text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 select-none">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-3 h-3 text-[#6B7280]" />}
          <span className={item.active ? 'text-[#111111]' : ''}>{item.name}</span>
        </React.Fragment>
      ))}
    </nav>
  );
}

// 17. Tabs component
interface ITab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface ITabsProps {
  tabs: ITab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: ITabsProps) {
  return (
    <div className={`border-b border-neutral-200 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`pb-4 px-1 border-b-2 font-bold text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap
                ${isActive 
                  ? 'border-[#2563EB] text-[#2563EB]' 
                  : 'border-transparent text-[#6B7280] hover:text-[#111111] hover:border-neutral-300'
                }`}
            >
              {tab.icon && tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// 18. Accordion
interface IAccordionItem {
  id: string | number;
  title: string;
  content: React.ReactNode;
}

export function Accordion({ items }: { items: IAccordionItem[] }) {
  const [openId, setOpenId] = useState<string | number | null>(null);

  const toggle = (id: string | number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="border border-neutral-200 rounded-[20px] bg-white divide-y divide-neutral-200 overflow-hidden shadow-sm">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="transition-colors">
            <button
              onClick={() => toggle(item.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-left text-sm font-bold text-[#111111] hover:bg-neutral-50 transition-colors"
            >
              <span>{item.title}</span>
              {isOpen ? <ChevronUp className="w-4 h-4 text-[#111111]" /> : <ChevronDown className="w-4 h-4 text-[#111111]" />}
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-1 text-sm font-medium text-[#6B7280] leading-relaxed border-t border-neutral-100 bg-neutral-50/30">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
