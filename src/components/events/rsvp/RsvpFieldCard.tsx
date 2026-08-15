import React, { useState } from 'react';
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  MoveUp, 
  MoveDown, 
  Plus, 
  X, 
  Check, 
  Star, 
  FileUp, 
  ChevronDown, 
  CheckSquare, 
  CircleDot, 
  ToggleLeft, 
  Calendar, 
  Clock, 
  Link as LinkIcon, 
  PenTool, 
  ShieldCheck, 
  FileText, 
  EyeOff, 
  Code,
  Sparkles,
  Sliders
} from 'lucide-react';
import { IRsvpFormField, IRsvpFormAppearance } from '../../../types';
import { FIELD_TYPE_DEFINITIONS } from './rsvpConstants';

interface RsvpFieldCardProps {
  field: IRsvpFormField;
  index: number;
  totalFields: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<IRsvpFormField>) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMove?: (direction: 'up' | 'down') => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  appearance?: IRsvpFormAppearance;
}

export const RsvpFieldCard: React.FC<RsvpFieldCardProps> = ({
  field,
  index,
  totalFields,
  isSelected,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDragEnd,
  appearance
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(field.label);

  const typeDef = FIELD_TYPE_DEFINITIONS.find(t => t.id === field.type) || {
    id: field.type,
    label: field.type,
    icon: Sliders,
    category: 'basic'
  };

  const Icon = typeDef.icon || Sliders;

  const handleAddOption = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentOptions = field.options || ['Option 1', 'Option 2'];
    const newOptions = [...currentOptions, `Option ${currentOptions.length + 1}`];
    onUpdate({ options: newOptions });
  };

  const handleRemoveOption = (e: React.MouseEvent, optIndex: number) => {
    e.stopPropagation();
    const currentOptions = field.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== optIndex);
    onUpdate({ options: newOptions });
  };

  const handleOptionChange = (optIndex: number, newVal: string) => {
    const currentOptions = [...(field.options || [])];
    currentOptions[optIndex] = newVal;
    onUpdate({ options: currentOptions });
  };

  const saveLabel = () => {
    if (tempLabel.trim()) {
      onUpdate({ label: tempLabel.trim() });
    } else {
      setTempLabel(field.label);
    }
    setIsEditingLabel(false);
  };

  const widthClass = 
    field.width === 'half' ? 'col-span-12 md:col-span-6' :
    field.width === 'third' ? 'col-span-12 md:col-span-4' : 'col-span-12';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`relative group rounded-2xl transition-all duration-200 cursor-pointer ${widthClass} ${
        isSelected
          ? 'ring-2 ring-brand-primary bg-white shadow-lg shadow-brand-primary/10 border-transparent'
          : 'bg-white/90 hover:bg-white border border-neutral-200/80 hover:border-neutral-300 hover:shadow-md'
      }`}
      style={{
        borderRadius: `${appearance?.borderRadius || 16}px`
      }}
    >
      {/* Top Card Action Bar (Visible on Hover or when Selected) */}
      <div className={`absolute -top-3.5 right-4 z-20 flex items-center gap-1 bg-white border border-neutral-200/90 shadow-md rounded-xl p-1 transition-all ${
        isSelected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95'
      }`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove?.('up');
          }}
          disabled={index === 0}
          title="Move up"
          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg disabled:opacity-20 transition-all"
        >
          <MoveUp className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove?.('down');
          }}
          disabled={index === totalFields - 1}
          title="Move down"
          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg disabled:opacity-20 transition-all"
        >
          <MoveDown className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-neutral-200 mx-0.5" />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate?.();
          }}
          title="Duplicate field"
          className="p-1.5 text-neutral-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          title="Delete field"
          className="p-1.5 text-neutral-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5 space-y-3">
        {/* Card Header: Type Badge, Label, Required Toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Drag Handle */}
            <div 
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 cursor-grab active:cursor-grabbing shrink-0"
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Type Icon Pill */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-600 text-[10px] font-bold uppercase tracking-wider shrink-0">
              <Icon className="w-3 h-3 text-brand-primary" />
              <span>{typeDef.label}</span>
            </div>

            {/* Editable Label */}
            {isEditingLabel ? (
              <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveLabel();
                    if (e.key === 'Escape') {
                      setTempLabel(field.label);
                      setIsEditingLabel(false);
                    }
                  }}
                  autoFocus
                  className="px-2 py-0.5 border border-brand-primary rounded text-xs font-bold text-neutral-900 focus:outline-none w-full"
                />
                <button
                  type="button"
                  onClick={saveLabel}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <h4 
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setTempLabel(field.label);
                  setIsEditingLabel(true);
                }}
                title="Double click to edit label"
                className="text-xs font-extrabold text-neutral-900 break-words whitespace-normal leading-snug hover:text-brand-primary transition-colors flex-1"
              >
                {field.label || 'Untitled Question'}
              </h4>
            )}
          </div>

          {/* Right badges & toggles */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Width Badge */}
            {field.width && field.width !== 'full' && (
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                {field.width}
              </span>
            )}

            {/* Required Switch */}
            {!['section_title', 'paragraph', 'divider'].includes(field.type) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ required: !field.required });
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  field.required
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-neutral-100 text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <span>{field.required ? 'Required' : 'Optional'}</span>
                {field.required && <span className="text-rose-500 font-bold">*</span>}
              </button>
            )}
          </div>
        </div>

        {/* Description / Helper Subtitle */}
        {field.description && (
          <p className="text-[11px] text-neutral-500 font-medium pl-6 leading-relaxed">
            {field.description}
          </p>
        )}

        {/* Dynamic Field Body Preview */}
        <div className="pl-6 pt-1" onClick={(e) => e.stopPropagation()}>
          {field.type === 'section_title' ? (
            <div className="py-2 border-b-2 border-neutral-200">
              <span className="text-sm font-black text-neutral-900 uppercase tracking-wide">{field.label}</span>
            </div>
          ) : field.type === 'paragraph' ? (
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs text-neutral-600 leading-relaxed italic">
              {field.label || 'Enter formatted description text for participants...'}
            </div>
          ) : field.type === 'divider' ? (
            <hr className="my-2 border-neutral-200 border-dashed" />
          ) : field.type === 'textarea' ? (
            <div className="h-20 w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-400 font-normal">
              {field.placeholder || 'Long response multiline text...'}
            </div>
          ) : ['dropdown', 'multiselect'].includes(field.type) ? (
            <div className="space-y-2">
              <div className="h-11 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 flex items-center justify-between text-xs text-neutral-500">
                <span>{field.placeholder || 'Select an option from list...'}</span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </div>
              {/* Quick Options Preview / Inline Editor */}
              <div className="flex flex-wrap gap-1.5 items-center pt-1">
                {(field.options || ['Option 1', 'Option 2']).map((opt, i) => (
                  <div key={i} className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-lg text-[11px] text-neutral-700">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="bg-transparent border-none text-[11px] text-neutral-900 font-medium focus:outline-none w-20"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleRemoveOption(e, i)}
                      className="text-neutral-400 hover:text-rose-500 text-xs font-bold"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:text-brand-primary/80 px-2 py-0.5 rounded-lg border border-dashed border-brand-primary/40 hover:bg-brand-primary/5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Option</span>
                </button>
              </div>
            </div>
          ) : field.type === 'radio' ? (
            <div className="space-y-2">
              {(field.options || ['Option 1', 'Option 2']).map((opt, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl group/opt">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full border-2 border-neutral-300 flex items-center justify-center">
                      {i === 0 && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="bg-transparent border-none text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-brand-primary rounded px-1"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveOption(e, i)}
                    className="opacity-0 group-hover/opt:opacity-100 text-neutral-400 hover:text-rose-500 text-xs font-bold p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:text-brand-primary/80 px-2 py-1 rounded-lg border border-dashed border-brand-primary/40 hover:bg-brand-primary/5"
              >
                <Plus className="w-3 h-3" />
                <span>Add Choice</span>
              </button>
            </div>
          ) : field.type === 'checkbox' ? (
            <div className="space-y-2">
              {(field.options || ['Option 1', 'Option 2']).map((opt, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl group/opt">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-md border-2 border-neutral-300 flex items-center justify-center">
                      {i === 0 && <Check className="w-3 h-3 text-brand-primary font-bold" />}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="bg-transparent border-none text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-brand-primary rounded px-1"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveOption(e, i)}
                    className="opacity-0 group-hover/opt:opacity-100 text-neutral-400 hover:text-rose-500 text-xs font-bold p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:text-brand-primary/80 px-2 py-1 rounded-lg border border-dashed border-brand-primary/40 hover:bg-brand-primary/5"
              >
                <Plus className="w-3 h-3" />
                <span>Add Choice</span>
              </button>
            </div>
          ) : field.type === 'yes_no' ? (
            <div className="flex gap-3">
              {['Yes', 'No'].map((choice, i) => (
                <button
                  key={choice}
                  type="button"
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    i === 0 ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : ['file', 'image'].includes(field.type) ? (
            <div className="p-4 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 flex flex-col items-center justify-center text-center space-y-1.5">
              <FileUp className="w-5 h-5 text-neutral-400" />
              <p className="text-xs font-bold text-neutral-700">{field.placeholder || 'Upload document or photo'}</p>
              <p className="text-[10px] text-neutral-400">PDF, PNG, JPG, or DOC up to 10MB</p>
            </div>
          ) : field.type === 'rating' ? (
            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200/80 w-fit">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" className="text-amber-400 hover:scale-110 transition-transform">
                  <Star className="w-5 h-5 fill-amber-400" />
                </button>
              ))}
            </div>
          ) : ['consent', 'terms'].includes(field.type) ? (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-start gap-3">
              <div className="w-4 h-4 rounded-md border-2 border-brand-primary bg-brand-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-xs text-neutral-700 font-medium leading-relaxed">
                {field.label}
              </span>
            </div>
          ) : (
            <div className="h-11 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 flex items-center text-xs text-neutral-400 font-normal">
              {field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
