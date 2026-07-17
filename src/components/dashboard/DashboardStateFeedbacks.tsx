import React from 'react';
import { AlertTriangle, RefreshCw, FolderOpen, Plus, Loader2 } from 'lucide-react';
import { Button } from '../Button';

// 1. STATS & OVERVIEW LAYOUT SKELETON
export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-48 bg-neutral-slate-200 dark:bg-neutral-slate-800 rounded-3xl" />

      {/* Stats Cards Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 bg-neutral-slate-200 dark:bg-neutral-slate-800 rounded w-1/3" />
              <div className="w-10 h-10 bg-neutral-slate-200 dark:bg-neutral-slate-800 rounded-xl" />
            </div>
            <div className="h-8 bg-neutral-slate-200 dark:bg-neutral-slate-800 rounded w-1/2" />
            <div className="h-3 bg-neutral-slate-200 dark:bg-neutral-slate-800 rounded w-1/4" />
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white border border-gray-200 shadow-sm p-6 rounded-2xl" />
        <div className="h-72 bg-white border border-gray-200 shadow-sm p-6 rounded-2xl" />
      </div>
    </div>
  );
}

// 2. DATA TABLE SKELETON
export function TableLoadingSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white animate-pulse">
      {/* Header cell bone */}
      <div className="h-14 bg-[#F9FAFB]/40 border-b border-gray-200 flex items-center px-6 space-x-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-neutral-slate-200 dark:bg-neutral-slate-800 rounded flex-grow" />
        ))}
      </div>
      {/* Row cells bones */}
      <div className="divide-y divide-neutral-slate-100 divide-gray-200/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-16 flex items-center px-6 space-x-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-3.5 bg-[#F3F4F6] rounded flex-grow" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. ENTERPRISE ERROR BOUNDARY / CARD STATE
interface ErrorStateProps {
  message?: string;
  code?: string;
  onRetry?: () => void;
  title?: string;
}

export function DashboardErrorState({
  message = 'An unexpected telemetry error occurred while fetching dashboard states.',
  code = 'ERR_METRIC_SYNC_FAILED',
  onRetry,
  title = 'Database Synchronization Offline',
}: ErrorStateProps) {
  return (
    <div className="bg-rose-50/50 bg-rose-50/10 border border-rose-200 dark:border-rose-900/30 p-8 rounded-2xl text-center max-w-lg mx-auto my-12 shadow-sm">
      <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      
      <h3 className="font-display font-bold text-base text-rose-900 dark:text-rose-400">
        {title}
      </h3>
      
      <p className="text-xs text-rose-700/80 dark:text-rose-400/70 mt-2.5 leading-relaxed">
        {message}
      </p>

      <div className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-100/40 dark:bg-rose-950/30 border border-rose-200/40 text-[10px] font-mono text-rose-600 dark:text-rose-400 rounded-md select-all">
        <span>Trace ID Code: {code}</span>
      </div>

      {onRetry && (
        <div className="mt-6">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onRetry}
            className="border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Metric Fetch</span>
          </Button>
        </div>
      )}
    </div>
  );
}

// 4. ELEGANT EMPTY STATE STATE
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionText?: string;
  onAction?: () => void;
}

export function DashboardEmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm p-10 md:p-14 rounded-3xl text-center max-w-xl mx-auto shadow-xs">
      <div className="w-14 h-14 bg-[#F3F4F6]/80 text-neutral-slate-400 dark:text-neutral-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-gray-200">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="font-display font-bold text-lg text-gray-900 leading-tight">
        {title}
      </h3>
      
      <p className="text-sm text-neutral-slate-400 dark:text-neutral-slate-500 mt-2.5 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {onAction && actionText && (
        <div className="mt-8">
          <Button
            onClick={onAction}
            size="sm"
            className="inline-flex items-center space-x-2 font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>{actionText}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
