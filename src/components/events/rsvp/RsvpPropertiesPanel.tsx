import React, { useState, useRef } from 'react';
import { 
  X, 
  Trash2, 
  Copy, 
  Plus, 
  Palette, 
  Type, 
  Sliders, 
  Shield, 
  Sparkles, 
  Image as ImageIcon, 
  UploadCloud, 
  Upload,
  Check, 
  ChevronRight,
  Split,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { IRsvpFormField, IRsvpFormAppearance } from '../../../types';
import { FIELD_TYPE_DEFINITIONS, PRESET_THEMES } from './rsvpConstants';
import { Input } from '../../Input';
import { Button } from '../../Button';

interface RsvpPropertiesPanelProps {
  selectedField: IRsvpFormField | null;
  allFields?: IRsvpFormField[];
  availableFields?: IRsvpFormField[];
  appearance: IRsvpFormAppearance;
  onUpdateField?: ((id: string, updates: Partial<IRsvpFormField>) => void) | ((updates: Partial<IRsvpFormField>) => void);
  onDuplicateField?: (id: string) => void;
  onDeleteField?: (id: string) => void;
  onUpdateAppearance?: (updates: Partial<IRsvpFormAppearance>) => void;
  onClose?: () => void;
}

export const RsvpPropertiesPanel: React.FC<RsvpPropertiesPanelProps> = ({
  selectedField,
  allFields,
  availableFields,
  appearance,
  onUpdateField,
  onDuplicateField,
  onDeleteField,
  onUpdateAppearance,
  onClose
}) => {
  const [fieldTab, setFieldTab] = useState<'general' | 'options' | 'validation' | 'logic'>('general');
  const [formTab, setFormTab] = useState<'theme' | 'layout' | 'branding'>('theme');
  const [bulkOptionsText, setBulkOptionsText] = useState('');
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const hasValidExtension = /\.(jpe?g|png|webp)$/i.test(file.name);

      if (!validFormats.includes(file.type.toLowerCase()) && !hasValidExtension) {
        alert('Please select a valid image format (JPG, PNG, or WEBP).');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Image size exceeds 10MB limit. Please choose a smaller image.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          handleAppearanceUpdate({
            bannerUrl: reader.result,
            headerImage: reader.result
          });
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const fieldsList = allFields || availableFields || [];

  const handleFieldUpdate = (updates: Partial<IRsvpFormField>) => {
    if (!selectedField || !onUpdateField) return;
    try {
      (onUpdateField as any)(selectedField.id, updates);
    } catch {
      (onUpdateField as any)(updates);
    }
  };

  const handleAppearanceUpdate = (updates: Partial<IRsvpFormAppearance>) => {
    onUpdateAppearance?.(updates);
  };

  const typeDef = selectedField ? (FIELD_TYPE_DEFINITIONS.find(t => t.id === selectedField.type) || {
    id: selectedField.type,
    label: selectedField.type,
    supportsOptions: false,
    supportsPlaceholder: true,
    supportsValidation: true
  }) : null;

  const handleAddCondition = () => {
    if (!selectedField) return;
    const otherFields = fieldsList.filter(f => f.id !== selectedField.id);
    if (otherFields.length === 0) {
      alert('Add at least one other field to create conditional logic rules.');
      return;
    }
    const currentLogic = selectedField.conditionalLogic || [];
    const newRule = {
      fieldId: otherFields[0].id,
      operator: 'equals' as const,
      value: '',
      action: 'show' as const
    };
    handleFieldUpdate({ conditionalLogic: [...currentLogic, newRule] });
  };

  const handleRemoveCondition = (index: number) => {
    if (!selectedField) return;
    const currentLogic = selectedField.conditionalLogic || [];
    handleFieldUpdate({
      conditionalLogic: currentLogic.filter((_, i) => i !== index)
    });
  };

  const handleUpdateCondition = (index: number, updates: any) => {
    if (!selectedField) return;
    const currentLogic = [...(selectedField.conditionalLogic || [])];
    currentLogic[index] = { ...currentLogic[index], ...updates };
    handleFieldUpdate({ conditionalLogic: currentLogic });
  };

  return (
    <div className="w-80 lg:w-96 border-l border-neutral-200 bg-white flex flex-col h-full shrink-0 select-none overflow-hidden">
      
      {/* 1. FIELD PROPERTIES (When a field is selected) */}
      {selectedField ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/70">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary uppercase">
                  {typeDef?.label || selectedField.type}
                </span>
                <span className="text-xs font-black text-neutral-900 truncate">
                  Properties
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
                {selectedField.label || 'Question settings'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close properties (show form settings)"
              className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Field Sub-Tabs */}
          <div className="px-4 py-2 border-b border-neutral-100 flex gap-1 shrink-0 bg-white overflow-x-auto no-scrollbar">
            {[
              { id: 'general', label: 'General' },
              ...(typeDef?.supportsOptions || ['dropdown', 'radio', 'checkbox', 'multiselect', 'yes_no'].includes(selectedField.type) ? [{ id: 'options', label: 'Choices' }] : []),
              { id: 'validation', label: 'Validation' },
              { id: 'logic', label: 'Logic' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFieldTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  fieldTab === tab.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Properties Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* GENERAL TAB */}
            {fieldTab === 'general' && (
              <div className="space-y-5">
                {/* Field Label */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Question / Field Label <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedField.label || ''}
                    onChange={(e) => handleFieldUpdate({ label: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-brand-primary focus:outline-none"
                  />
                </div>

                {/* Subtitle / Helper Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Helper Text / Description
                  </label>
                  <textarea
                    rows={2}
                    value={selectedField.description || ''}
                    onChange={(e) => handleFieldUpdate({ description: e.target.value })}
                    placeholder="Provide additional instructions for attendees..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:bg-white focus:border-brand-primary focus:outline-none"
                  />
                </div>

                {/* Placeholder Text */}
                {!['section_title', 'paragraph', 'divider', 'radio', 'checkbox', 'rating', 'signature', 'consent', 'terms'].includes(selectedField.type) && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Placeholder Text
                    </label>
                    <input
                      type="text"
                      value={selectedField.placeholder || ''}
                      onChange={(e) => handleFieldUpdate({ placeholder: e.target.value })}
                      placeholder="e.g. Enter value..."
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:bg-white focus:border-brand-primary focus:outline-none"
                    />
                  </div>
                )}

                {/* Field Width Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Field Width on Canvas
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'full', label: 'Full (100%)' },
                      { id: 'half', label: 'Half (50%)' },
                      { id: 'third', label: 'Third (33%)' }
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleFieldUpdate({ width: w.id as any })}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                          (selectedField.width || 'full') === w.id
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-black shadow-xs'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles: Required, Hidden, Read-Only */}
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Input Behavior
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 cursor-pointer hover:bg-neutral-50">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">Strictly Required</span>
                        <span className="text-[10px] text-neutral-400">Attendee cannot submit without answering</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedField.required || false}
                        onChange={(e) => handleFieldUpdate({ required: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 cursor-pointer hover:bg-neutral-50">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">Hidden Field</span>
                        <span className="text-[10px] text-neutral-400">Hidden from attendee view (system tracking)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedField.hidden || false}
                        onChange={(e) => handleFieldUpdate({ hidden: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-primary"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* OPTIONS TAB */}
            {fieldTab === 'options' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Choice Options ({(selectedField.options || []).length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkOptionsText((selectedField.options || []).join('\n'));
                      setShowBulkEdit(!showBulkEdit);
                    }}
                    className="text-[10px] font-bold text-brand-primary hover:underline"
                  >
                    {showBulkEdit ? 'Individual Mode' : 'Bulk Edit'}
                  </button>
                </div>

                {showBulkEdit ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-400">Enter each option on a new line:</p>
                    <textarea
                      rows={6}
                      value={bulkOptionsText}
                      onChange={(e) => setBulkOptionsText(e.target.value)}
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = bulkOptionsText.split('\n').map(s => s.trim()).filter(Boolean);
                        handleFieldUpdate({ options: parsed });
                        setShowBulkEdit(false);
                      }}
                      className="w-full py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold"
                    >
                      Save Bulk Options
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedField.options || ['Option 1', 'Option 2']).map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(selectedField.options || [])];
                            newOpts[idx] = e.target.value;
                            handleFieldUpdate({ options: newOpts });
                          }}
                          className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-800 focus:bg-white focus:border-brand-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = (selectedField.options || []).filter((_, i) => i !== idx);
                            handleFieldUpdate({ options: newOpts });
                          }}
                          className="p-2 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const current = selectedField.options || [];
                        handleFieldUpdate({
                          options: [...current, `Option ${current.length + 1}`]
                        });
                      }}
                      className="w-full py-2.5 rounded-xl border border-dashed border-neutral-300 text-neutral-600 hover:border-brand-primary hover:text-brand-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Option</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VALIDATION TAB */}
            {fieldTab === 'validation' && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Input Constraints & Rules
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Min Length</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={selectedField.validationRules?.minLength || ''}
                      onChange={(e) => handleFieldUpdate({
                        validationRules: {
                          ...selectedField.validationRules,
                          minLength: parseInt(e.target.value) || undefined
                        }
                      })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Max Length</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={selectedField.validationRules?.maxLength || ''}
                      onChange={(e) => handleFieldUpdate({
                        validationRules: {
                          ...selectedField.validationRules,
                          maxLength: parseInt(e.target.value) || undefined
                        }
                      })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">
                    Custom Regex Pattern
                  </label>
                  <input
                    type="text"
                    placeholder="^[0-9]{5}$"
                    value={selectedField.validationRules?.pattern || ''}
                    onChange={(e) => handleFieldUpdate({
                      validationRules: {
                        ...selectedField.validationRules,
                        pattern: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">
                    Custom Error Message
                  </label>
                  <input
                    type="text"
                    placeholder="Please provide a valid entry"
                    value={selectedField.validationRules?.errorMessage || ''}
                    onChange={(e) => handleFieldUpdate({
                      validationRules: {
                        ...selectedField.validationRules,
                        errorMessage: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* LOGIC TAB */}
            {fieldTab === 'logic' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Conditional Display Rules
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Rule</span>
                  </button>
                </div>

                {(selectedField.conditionalLogic || []).length === 0 ? (
                  <div className="p-6 border border-dashed border-neutral-200 rounded-2xl text-center space-y-2 bg-neutral-50/50">
                    <Split className="w-6 h-6 text-neutral-300 mx-auto" />
                    <p className="text-xs font-bold text-neutral-600">No conditional rules defined</p>
                    <p className="text-[10px] text-neutral-400 max-w-xs mx-auto">
                      Show or hide this question depending on how attendees respond to previous questions.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddCondition}
                      className="px-3 py-1.5 bg-brand-primary text-white rounded-xl text-xs font-bold"
                    >
                      Create First Rule
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(selectedField.conditionalLogic || []).map((rule, idx) => (
                      <div key={idx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-[10px] uppercase text-neutral-500">Rule #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCondition(idx)}
                            className="text-neutral-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase text-neutral-400">Action</span>
                            <select
                              value={rule.action}
                              onChange={(e) => handleUpdateCondition(idx, { action: e.target.value })}
                              className="w-full p-2 bg-white border border-neutral-200 rounded-xl text-xs"
                            >
                              <option value="show">Show this question if</option>
                              <option value="hide">Hide this question if</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase text-neutral-400">Trigger Question</span>
                            <select
                              value={rule.fieldId}
                              onChange={(e) => handleUpdateCondition(idx, { fieldId: e.target.value })}
                              className="w-full p-2 bg-white border border-neutral-200 rounded-xl text-xs"
                            >
                              {fieldsList.filter(f => f.id !== selectedField.id).map(f => (
                                <option key={f.id} value={f.id}>{f.label || f.id}</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold uppercase text-neutral-400">Condition</span>
                              <select
                                value={rule.operator}
                                onChange={(e) => handleUpdateCondition(idx, { operator: e.target.value })}
                                className="w-full p-2 bg-white border border-neutral-200 rounded-xl text-xs"
                              >
                                <option value="equals">Equals</option>
                                <option value="not_equals">Does not equal</option>
                                <option value="contains">Contains</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-bold uppercase text-neutral-400">Value</span>
                              <input
                                type="text"
                                placeholder="e.g. Yes"
                                value={rule.value || ''}
                                onChange={(e) => handleUpdateCondition(idx, { value: e.target.value })}
                                className="w-full p-2 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Field Action Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onDuplicateField?.(selectedField.id)}
              className="flex-1 py-2.5 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-100 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              onClick={() => onDeleteField?.(selectedField.id)}
              className="py-2.5 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. FORM-LEVEL APPEARANCE & THEME (When NO field is selected) */
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/70">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-brand-primary" />
                Form Design & Theme
              </h3>
              <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Global appearance, colors & branding</p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Form Tabs */}
          <div className="px-4 py-2 border-b border-neutral-100 flex gap-1 shrink-0 bg-white">
            {[
              { id: 'theme', label: 'Colors & Presets' },
              { id: 'layout', label: 'Typography & Layout' },
              { id: 'branding', label: 'Branding & Button' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFormTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                  formTab === tab.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Properties Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* THEME TAB */}
            {formTab === 'theme' && (
              <div className="space-y-6">
                {/* Presets */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Curated Color Presets
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {PRESET_THEMES.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleAppearanceUpdate({
                          backgroundColor: preset.backgroundColor,
                          primaryColor: preset.primaryColor,
                          textColor: preset.textColor,
                          buttonColor: preset.buttonColor,
                          cardBackground: preset.cardBackground,
                          cardStyle: preset.cardStyle,
                          borderRadius: preset.borderRadius
                        })}
                        className="p-3 rounded-xl border border-neutral-200 hover:border-brand-primary bg-white hover:bg-neutral-50 flex items-center justify-between text-left transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex -space-x-1">
                            <div className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: preset.backgroundColor }} />
                            <div className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: preset.primaryColor }} />
                            <div className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: preset.buttonColor }} />
                          </div>
                          <span className="text-xs font-bold text-neutral-800">{preset.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Individual Colors
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-neutral-400">Page Background</label>
                      <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <input
                          type="color"
                          value={appearance.backgroundColor || '#F8FAFC'}
                          onChange={(e) => handleAppearanceUpdate({ backgroundColor: e.target.value })}
                          className="w-6 h-6 rounded border-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-neutral-700 uppercase">
                          {appearance.backgroundColor || '#F8FAFC'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-neutral-400">Card Background</label>
                      <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <input
                          type="color"
                          value={appearance.cardBackground || '#FFFFFF'}
                          onChange={(e) => handleAppearanceUpdate({ cardBackground: e.target.value })}
                          className="w-6 h-6 rounded border-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-neutral-700 uppercase">
                          {appearance.cardBackground || '#FFFFFF'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-neutral-400">Primary Accent</label>
                      <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <input
                          type="color"
                          value={appearance.primaryColor || '#0F172A'}
                          onChange={(e) => handleAppearanceUpdate({ primaryColor: e.target.value })}
                          className="w-6 h-6 rounded border-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-neutral-700 uppercase">
                          {appearance.primaryColor || '#0F172A'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-neutral-400">Text Heading</label>
                      <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <input
                          type="color"
                          value={appearance.textColor || '#1E293B'}
                          onChange={(e) => handleAppearanceUpdate({ textColor: e.target.value })}
                          className="w-6 h-6 rounded border-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-neutral-700 uppercase">
                          {appearance.textColor || '#1E293B'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT & TYPOGRAPHY TAB */}
            {formTab === 'layout' && (
              <div className="space-y-5">
                {/* Font Family */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Typography Font Family
                  </label>
                  <select
                    value={appearance.fontFamily || 'inherit'}
                    onChange={(e) => handleAppearanceUpdate({ fontFamily: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800"
                  >
                    <option value="inherit">Default System Sans</option>
                    <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Modern)</option>
                    <option value="'Inter', sans-serif">Inter (Clean UI)</option>
                    <option value="'Playfair Display', serif">Playfair Display (Editorial)</option>
                    <option value="'Space Grotesk', sans-serif">Space Grotesk (Tech)</option>
                  </select>
                </div>

                {/* Card Container Style */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Card Container Elevation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'elevated', label: 'Elevated Shadow' },
                      { id: 'bordered', label: 'Clean Border' },
                      { id: 'glass', label: 'Glassmorphism' },
                      { id: 'flat', label: 'Minimal Flat' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleAppearanceUpdate({ cardStyle: style.id as any })}
                        className={`p-2.5 rounded-xl text-[10px] font-bold uppercase border text-center transition-all ${
                          (appearance.cardStyle || 'elevated') === style.id
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-black shadow-xs'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Corner Radius
                    </label>
                    <span className="text-xs font-mono font-bold text-neutral-700">
                      {appearance.borderRadius || 16}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={appearance.borderRadius || 16}
                    onChange={(e) => handleAppearanceUpdate({ borderRadius: parseInt(e.target.value) })}
                    className="w-full accent-brand-primary"
                  />
                </div>
              </div>
            )}

            {/* BRANDING & BUTTON TAB */}
            {formTab === 'branding' && (
              <div className="space-y-5">
                {/* Event Banner Local Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-brand-primary" />
                      Event Banner / Header
                    </label>
                    {appearance.bannerUrl && (
                      <button
                        type="button"
                        onClick={() => handleAppearanceUpdate({ bannerUrl: '', headerImage: '' })}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleBannerFileSelect}
                    className="hidden"
                  />

                  {appearance.bannerUrl ? (
                    <div className="space-y-2">
                      <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-inner group">
                        <img
                          src={appearance.bannerUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => bannerFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white text-neutral-900 rounded-xl text-[11px] font-black uppercase tracking-wider shadow flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5 text-brand-primary" />
                            Upload from Computer
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Upload from Computer</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-neutral-200 hover:border-brand-primary/50 rounded-2xl text-center space-y-2 bg-neutral-50/50 transition-all">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-700">Select Banner from Computer</p>
                        <p className="text-[10px] text-neutral-400">JPG, JPEG, PNG, or WEBP (Max 10MB)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="w-full py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Computer</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Event Logo URL */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Event Logo URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://.../logo.png"
                    value={appearance.eventLogo || ''}
                    onChange={(e) => handleAppearanceUpdate({ eventLogo: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>

                {/* Submit Button Customization */}
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Submit Button Styling
                  </span>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase text-neutral-400">Button Text</label>
                    <input
                      type="text"
                      value={appearance.buttonText || 'Complete Registration'}
                      onChange={(e) => handleAppearanceUpdate({ buttonText: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-neutral-400">Button Color</label>
                      <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <input
                          type="color"
                          value={appearance.buttonColor || '#84CC16'}
                          onChange={(e) => handleAppearanceUpdate({ buttonColor: e.target.value })}
                          className="w-6 h-6 rounded border-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold uppercase text-neutral-700">
                          {appearance.buttonColor || '#84CC16'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-neutral-400">Button Text Color</label>
                      <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <input
                          type="color"
                          value={appearance.buttonTextColor || '#FFFFFF'}
                          onChange={(e) => handleAppearanceUpdate({ buttonTextColor: e.target.value })}
                          className="w-6 h-6 rounded border-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold uppercase text-neutral-700">
                          {appearance.buttonTextColor || '#FFFFFF'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Security Text */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Footer Security / Badge Text
                  </label>
                  <input
                    type="text"
                    value={appearance.footerText || 'SECURE EVENT REGISTRATION POWERED BY WEVENTUREHUB'}
                    onChange={(e) => handleAppearanceUpdate({ footerText: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
