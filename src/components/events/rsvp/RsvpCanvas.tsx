import React, { useState, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Layout, 
  UploadCloud, 
  ShieldCheck, 
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  Eye,
  Settings,
  Trash2,
  Upload,
  RefreshCw,
  X
} from 'lucide-react';
import { IEvent, IRsvpFormField, IRsvpFormAppearance } from '../../../types';
import { RsvpFieldCard } from './RsvpFieldCard';
import { format } from 'date-fns';

interface RsvpCanvasProps {
  event?: IEvent;
  eventTitle?: string;
  eventDescription?: string;
  startDate?: string;
  fields: IRsvpFormField[];
  appearance: IRsvpFormAppearance;
  selectedFieldId: string | null;
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
  onSelectField: (id: string | null) => void;
  onUpdateField: (id: string, updates: Partial<IRsvpFormField>) => void;
  onDuplicateField?: (id: string) => void;
  onDeleteField?: (id: string) => void;
  onMoveField?: (index: number, direction: 'up' | 'down') => void;
  onReorderFields: (newFields: IRsvpFormField[]) => void;
  onAddFieldAt?: (type: string, index?: number) => void;
  onOpenAppearance?: () => void;
  onUpdateAppearance?: (updates: Partial<IRsvpFormAppearance>) => void;
  setPreviewDevice?: (device: 'desktop' | 'tablet' | 'mobile') => void;
  onSave?: () => void;
  onPublish?: () => void;
  saveStatus?: 'saved' | 'saving' | 'error';
  onTogglePreview?: () => void;
  isPreview?: boolean;
}

export const RsvpCanvas: React.FC<RsvpCanvasProps> = ({
  event,
  eventTitle,
  eventDescription,
  startDate,
  fields,
  appearance,
  selectedFieldId,
  previewDevice,
  onSelectField,
  onUpdateField,
  onDuplicateField,
  onDeleteField,
  onMoveField,
  onReorderFields,
  onAddFieldAt,
  onOpenAppearance,
  onUpdateAppearance
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [bannerDragOver, setBannerDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', `field-reorder-${index}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const reordered = [...fields];
      const [moved] = reordered.splice(draggedIndex, 1);
      reordered.splice(dragOverIndex, 0, moved);
      const reindexed = reordered.map((f, i) => ({ ...f, order: i }));
      onReorderFields(reindexed);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Process selected banner image file from local device
  const processImageFile = (file: File) => {
    setUploadError(null);

    // Validate image format
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const hasValidExtension = /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!validFormats.includes(file.type.toLowerCase()) && !hasValidExtension) {
      setUploadError('Please select a valid image format (JPG, PNG, or WEBP).');
      return;
    }

    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        onUpdateAppearance?.({
          bannerUrl: reader.result,
          headerImage: reader.result
        });
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading image file from device. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
    // Reset file input value to allow re-uploading the same file if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleBannerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerDragOver(true);
  };

  const handleBannerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerDragOver(false);
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateAppearance?.({
      bannerUrl: '',
      headerImage: ''
    });
  };

  const handleTriggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  // Device width constraints
  const deviceWidthClass = 
    previewDevice === 'mobile' ? 'max-w-[420px]' :
    previewDevice === 'tablet' ? 'max-w-[720px]' : 'max-w-3xl';

  const cardStyleClass = 
    appearance.cardStyle === 'bordered' ? 'border-2 border-neutral-200 shadow-none' :
    appearance.cardStyle === 'glass' ? 'bg-white/80 backdrop-blur-md border border-white/60 shadow-xl' :
    appearance.cardStyle === 'flat' ? 'border border-neutral-100 shadow-none' : 'shadow-2xl border border-neutral-100';

  const currentBanner = appearance.bannerUrl || appearance.headerImage || event?.media?.bannerUrl;
  const dateValue = startDate || event?.schedule?.startDate;
  const titleValue = eventTitle || event?.title || 'Untitled Event Registration';
  const descValue = eventDescription || event?.description || 'Welcome! Complete the form below to confirm your attendance.';

  const formattedDate = dateValue ? (() => {
    try {
      return format(new Date(dateValue), 'EEE, MMM dd, yyyy');
    } catch {
      return 'Date TBA';
    }
  })() : 'Date TBA';

  const formattedTime = dateValue ? (() => {
    try {
      return format(new Date(dateValue), 'HH:mm');
    } catch {
      return '';
    }
  })() : '';

  return (
    <div 
      onClick={() => onSelectField(null)}
      className="flex-1 bg-neutral-100/60 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-10 flex flex-col items-center select-none"
    >
      {/* Hidden file input for local computer file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className={`w-full ${deviceWidthClass} transition-all duration-300 space-y-6 pb-28`}>
        
        {/* Canvas Form Container */}
        <div 
          className={`bg-white rounded-3xl overflow-hidden transition-all h-auto ${cardStyleClass}`}
          style={{
            borderRadius: `${appearance.borderRadius || 16}px`,
            backgroundColor: appearance.cardBackground || '#FFFFFF',
            fontFamily: appearance.fontFamily || 'inherit',
          }}
        >
          {/* 1. EVENT BANNER / HEADER IMAGE SECTION (At Top of RSVP Form) */}
          <div 
            onDragOver={handleBannerDragOver}
            onDragLeave={handleBannerDragLeave}
            onDrop={handleBannerDrop}
            className="relative overflow-hidden group border-b border-neutral-100"
          >
            {currentBanner ? (
              /* Banner Uploaded State: Displays immediately with Replace and Remove actions */
              <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden bg-neutral-950">
                <img 
                  src={currentBanner} 
                  alt="Event Banner" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" 
                />
                
                {/* Banner Action Bar Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-black/30 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex flex-col justify-between p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-black/75 backdrop-blur-md text-white rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md border border-white/15">
                      <ImageIcon className="w-3.5 h-3.5 text-brand-primary" />
                      Event Banner / Header
                    </span>
                    
                    <button
                      type="button"
                      onClick={handleRemoveBanner}
                      title="Remove banner image"
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Image</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleTriggerUpload}
                      className="px-5 py-2.5 bg-white text-neutral-900 hover:bg-neutral-100 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-all active:scale-95 hover:shadow-brand-primary/20"
                    >
                      <Upload className="w-4 h-4 text-brand-primary" />
                      <span>Upload from Computer</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Banner Empty / Upload State: Prominent Upload Area at Top of RSVP Form */
              <div 
                className={`w-full min-h-[170px] md:min-h-[200px] p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all ${
                  bannerDragOver 
                    ? 'bg-brand-primary/10 border-2 border-dashed border-brand-primary' 
                    : 'bg-neutral-900 hover:bg-neutral-850 text-white'
                }`}
              >
                <div className="space-y-3.5 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-brand-primary ring-1 ring-white/10">
                    <ImageIcon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                      Event Banner / Header
                    </h4>
                    <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                      Select an image from your local computer (JPG, JPEG, PNG, or WEBP)
                    </p>
                  </div>

                  <div className="pt-1.5 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleTriggerUpload}
                      className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload from Computer</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {uploadError && (
              <div className="bg-rose-50 border-t border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-700 font-medium">
                <span>{uploadError}</span>
                <button 
                  type="button" 
                  onClick={() => setUploadError(null)}
                  className="text-rose-500 hover:text-rose-800 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Form Header Info & Branding */}
          <div className="p-6 md:p-10 space-y-6">
            <div className="space-y-4 text-center">
              {appearance.eventLogo && (
                <img 
                  src={appearance.eventLogo} 
                  alt="Event Logo" 
                  className="h-12 max-w-[180px] mx-auto object-contain mb-2" 
                />
              )}

              <div className="space-y-2">
                <h1 
                  className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight break-words whitespace-normal"
                  style={{ color: appearance.textColor || '#0F172A' }}
                >
                  {titleValue}
                </h1>
                <p className="text-xs md:text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed font-medium break-words whitespace-normal">
                  {descValue}
                </p>
              </div>

              {/* Event Badge Pills */}
              <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{formattedDate}</span>
                </div>
                {formattedTime && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{formattedTime}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                  <span>WeVentureHub Innovation Hub</span>
                </div>
              </div>
            </div>

            <hr className="border-neutral-100 my-6" />

            {/* Questions Grid Canvas */}
            <div className="space-y-4">
              {fields.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-neutral-200 rounded-3xl text-center space-y-4 bg-neutral-50/50">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-800">Your RSVP Form is Empty</h4>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                      Click any component on the left palette or choose a template to begin building your registration form.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddFieldAt ? onAddFieldAt('text') : undefined}
                    className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all"
                  >
                    Add Name & Email Fields
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {fields.map((field, idx) => (
                    <React.Fragment key={field.id}>
                      {/* Drop insertion indicator */}
                      {dragOverIndex === idx && (
                        <div className="col-span-1 md:col-span-12 h-1.5 bg-brand-primary rounded-full animate-pulse my-1" />
                      )}

                      <RsvpFieldCard
                        field={field}
                        index={idx}
                        totalFields={fields.length}
                        isSelected={selectedFieldId === field.id}
                        onSelect={() => onSelectField(field.id)}
                        onUpdate={(updates) => onUpdateField(field.id, updates)}
                        onDuplicate={() => onDuplicateField?.(field.id)}
                        onDelete={() => onDeleteField?.(field.id)}
                        onMove={(direction) => onMoveField?.(idx, direction)}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        appearance={appearance}
                      />
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button Section */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onOpenAppearance?.();
              }}
              className="pt-8 space-y-3 cursor-pointer group"
            >
              <button
                type="button"
                className="w-full py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all group-hover:scale-[1.01] flex items-center justify-center gap-2"
                style={{
                  backgroundColor: appearance.buttonColor || '#84CC16',
                  color: appearance.buttonTextColor || '#FFFFFF',
                  borderRadius: `${appearance.buttonRadius ?? appearance.borderRadius ?? 12}px`
                }}
              >
                <span>{appearance.buttonText || 'Complete Registration'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{appearance.footerText || 'SECURE EVENT REGISTRATION POWERED BY WEVENTUREHUB'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
