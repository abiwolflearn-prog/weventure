import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Tag, 
  Users, 
  Lock, 
  Globe, 
  EyeOff, 
  Edit, 
  Trash, 
  CheckCircle, 
  XCircle, 
  Layers, 
  Sliders 
} from 'lucide-react';
import { Button } from '../Button';
import { IEvent, EventStatus, EventVisibility, UserRole, Permission } from '../../types';
import { useAppSelector } from '../../store';

interface EventCardProps {
  event: IEvent;
  onViewDetails: (event: IEvent) => void;
  onEdit?: (event: IEvent) => void;
  onDelete?: (event: IEvent) => void;
  onPublish?: (event: IEvent) => void;
  onCancel?: (event: IEvent) => void;
  isMutating?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onViewDetails,
  onEdit,
  onDelete,
  onPublish,
  onCancel,
  isMutating = false
}) => {
  const { user } = useAppSelector((state) => state.auth);

  // Check role-based capabilities
  const isCreator = event.createdBy === user?.id;
  const isAdminOrStaff = 
    user?.role === UserRole.SUPER_ADMIN || 
    user?.role === UserRole.TENANT_ADMIN || 
    user?.role === UserRole.STAFF;

  const canEdit = isCreator || isAdminOrStaff;
  const canDelete = isCreator || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.TENANT_ADMIN;
  const canPublish = canEdit && event.status === EventStatus.DRAFT;
  const canCancel = canEdit && event.status === EventStatus.PUBLISHED;

  // Format Dates
  const startDate = new Date(event.schedule.startDate);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Calculate Capacity
  const activeReg = event.capacity.activeRegistrations || 0;
  const maxCap = event.capacity.maxCapacity;
  const isUnlimited = event.capacity.isUnlimited;
  const capacityPercent = isUnlimited ? 0 : Math.round((activeReg / maxCap) * 100);

  // Fallback Banner Image
  const defaultBanner = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800';
  const bannerUrl = event.media?.bannerUrl || defaultBanner;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      
      {/* Media Banner */}
      <div className="relative h-44 overflow-hidden bg-neutral-slate-100 bg-white">
        <img 
          src={bannerUrl} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Shadow overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 max-w-[calc(100%-2rem)]">
          {/* Category */}
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white/90 backdrop-blur-md text-neutral-slate-900 text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-sm">
            <Tag className="w-2.5 h-2.5 text-blue-600" />
            <span>{event.category}</span>
          </span>

          {/* Visibility status */}
          {event.visibility === EventVisibility.PRIVATE ? (
            <span className="inline-flex items-center px-2 py-1 bg-rose-500/90 text-white text-[10px] font-bold rounded-full shadow-sm" title="Private to Hub Members">
              <Lock className="w-2.5 h-2.5 mr-1" />
              <span>Private</span>
            </span>
          ) : event.visibility === EventVisibility.UNLISTED ? (
            <span className="inline-flex items-center px-2 py-1 bg-amber-500/90 text-white text-[10px] font-bold rounded-full shadow-sm" title="Unlisted / Direct link only">
              <EyeOff className="w-2.5 h-2.5 mr-1" />
              <span>Unlisted</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 bg-lime-500/90 text-white text-[10px] font-bold rounded-full shadow-sm" title="Public Event">
              <Globe className="w-2.5 h-2.5 mr-1" />
              <span>Public</span>
            </span>
          )}
        </div>

        {/* Event State Badge */}
        <div className="absolute top-4 right-4">
          {event.status === EventStatus.DRAFT ? (
            <span className="inline-flex items-center px-2.5 py-1 bg-neutral-slate-700/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-neutral-slate-600 backdrop-blur-sm">
              Draft
            </span>
          ) : event.status === EventStatus.PUBLISHED ? (
            <span className="inline-flex items-center px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm animate-pulse">
              Live
            </span>
          ) : event.status === EventStatus.CANCELLED ? (
            <span className="inline-flex items-center px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
              Cancelled
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 bg-lime-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
              Completed
            </span>
          )}
        </div>

        {/* Date Overlays bottom */}
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white">
          <div className="flex items-center space-x-1.5 font-mono text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate} @ {formattedTime}</span>
          </div>
          
          <span className="text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded-md font-mono">
            {event.schedule.timezone}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
        
        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-lg text-gray-900 line-clamp-1 leading-snug group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Dynamic occupancy slider & metadata info */}
        <div className="space-y-3.5 border-t border-neutral-slate-100 pt-4">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-gray-600" />
              <span className="font-semibold">
                {isUnlimited ? 'Unlimited Seats' : `${activeReg} / ${maxCap} reserved`}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-gray-600" />
              <span className="font-medium font-mono">{event.sessions?.length || 0} Sessions</span>
            </div>
          </div>

          {/* Occupancy Progress Bar */}
          {!isUnlimited && (
            <div className="space-y-1">
              <div className="w-full bg-neutral-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    capacityPercent >= 90 
                      ? 'bg-rose-500' 
                      : capacityPercent >= 70 
                      ? 'bg-amber-500' 
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, capacityPercent)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                <span>Occupancy</span>
                <span className={capacityPercent >= 90 ? 'text-rose-500' : 'text-gray-600'}>
                  {capacityPercent}% full
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive action toolbar */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button 
              variant="primary" 
              className="flex-grow text-xs h-10 font-bold"
              onClick={() => onViewDetails(event)}
            >
              View Details
            </Button>
            
            {canEdit && onEdit && (
              <Button 
                variant="secondary" 
                className="w-10 h-10 p-0 flex items-center justify-center shrink-0"
                onClick={() => onEdit(event)}
                title="Edit Event Specifications"
              >
                <Edit className="w-4 h-4 text-neutral-slate-500" />
              </Button>
            )}
          </div>

          {/* Publisher and operations console */}
          {isAdminOrStaff && (onPublish || onCancel || onDelete) && (
            <div className="flex items-center gap-1.5 border-t border-dashed border-gray-200 pt-2.5 mt-1">
              {canPublish && onPublish && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1 text-[11px] h-8 text-brand-primary hover:bg-brand-primary/5 font-bold border-brand-primary/20 hover:border-brand-primary"
                  onClick={() => onPublish(event)}
                  isLoading={isMutating}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>Publish</span>
                </Button>
              )}

              {canCancel && onCancel && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1 text-[11px] h-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/25 border-amber-200 dark:border-amber-900/30 font-bold"
                  onClick={() => onCancel(event)}
                  isLoading={isMutating}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  <span>Cancel</span>
                </Button>
              )}

              {canDelete && onDelete && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-8 h-8 p-0 flex items-center justify-center border-rose-200 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/25 text-rose-500 shrink-0"
                  onClick={() => onDelete(event)}
                  isLoading={isMutating}
                  title="Purge Event"
                >
                  <Trash className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
