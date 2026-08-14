import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Layers, 
  Plus, 
  Undo2, 
  Redo2, 
  ChevronRight,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  FileText,
  Zap
} from 'lucide-react';
import { FIELD_TYPE_DEFINITIONS, FORM_TEMPLATES, FieldTypeDefinition } from './rsvpConstants';
import { IRsvpFormField } from '../../../types';

interface RsvpPaletteProps {
  onAddField: (type: string) => void;
  onApplyTemplate: (template: typeof FORM_TEMPLATES[0]) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const RsvpPalette: React.FC<RsvpPaletteProps> = ({
  onAddField,
  onApplyTemplate,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'layout' | 'basic' | 'choice' | 'advanced' | 'legal' | 'system'>('all');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'basic', label: 'Basic Info' },
    { id: 'choice', label: 'Choices' },
    { id: 'layout', label: 'Layout' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'legal', label: 'Legal & Consent' },
    { id: 'system', label: 'Professional' }
  ];

  const filteredFields = FIELD_TYPE_DEFINITIONS.filter(field => {
    const matchesSearch = field.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          field.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || field.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-80 border-r border-neutral-200 bg-white flex flex-col h-full shrink-0 select-none">
      {/* Header with Undo / Redo */}
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/70">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-primary" />
            Field Palette
          </h3>
          <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Click or drag to add to form</p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-neutral-200/80 rounded-xl p-1 shadow-xs">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last change"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-neutral-200" />
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo change"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Template Preset Launcher Banner */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={() => setShowTemplatesModal(true)}
          className="w-full p-2.5 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-brand-primary group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-white">Form Templates</p>
              <p className="text-[9px] text-neutral-400 font-medium">Load pre-built RSVP structures</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 py-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search fields & inputs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs placeholder:text-neutral-400 text-neutral-800 focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 hover:text-neutral-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-1.5 shrink-0 overflow-x-auto flex gap-1.5 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-brand-primary text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Field List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredFields.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2 text-neutral-400">
            <Search className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-bold">No fields match "{searchQuery}"</p>
            <p className="text-[10px]">Try searching for text, choice, or layout items</p>
          </div>
        ) : (
          filteredFields.map((field) => {
            const Icon = field.icon;
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => onAddField(field.id)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', field.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="w-full text-left p-3 rounded-2xl border border-neutral-200/80 bg-white hover:border-brand-primary/60 hover:shadow-md hover:shadow-brand-primary/5 group transition-all flex items-start gap-3 relative cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/50 flex items-center justify-center text-neutral-600 group-hover:bg-brand-primary/10 group-hover:border-brand-primary/30 group-hover:text-brand-primary transition-colors shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-800 group-hover:text-neutral-900 truncate">
                      {field.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-tight line-clamp-1 mt-0.5">
                    {field.description}
                  </p>
                </div>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-lg bg-brand-primary text-white flex items-center justify-center shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">Pre-built RSVP Form Templates</h3>
                  <p className="text-xs text-neutral-400">Instantly populate professional questions and structures</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-900 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {FORM_TEMPLATES.map((tmpl) => (
                <div 
                  key={tmpl.id}
                  className="p-5 rounded-2xl border border-neutral-200 hover:border-brand-primary bg-neutral-50/50 hover:bg-white transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-neutral-900">{tmpl.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 uppercase">
                          {tmpl.category}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{tmpl.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Apply "${tmpl.name}" template? This will replace your current form questions.`)) {
                          onApplyTemplate(tmpl);
                          setShowTemplatesModal(false);
                        }
                      }}
                      className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:bg-brand-primary/90 transition-all shrink-0"
                    >
                      Use Template
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-200/60">
                    {tmpl.fields.map((f, i) => (
                      <span 
                        key={i} 
                        className="text-[10px] font-medium bg-white border border-neutral-200 rounded-md px-2 py-0.5 text-neutral-600"
                      >
                        {f.label} {f.required && <span className="text-rose-500 font-bold">*</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
