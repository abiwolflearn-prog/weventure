import React, { useState } from 'react';
import { 
  Sparkles, 
  Wifi, 
  Coffee, 
  Zap, 
  Printer, 
  Tv, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Layers,
  Info
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';

interface AmenityItem {
  id: string;
  name: string;
  category: 'Connectivity' | 'Hospitality' | 'Technology' | 'Facilities' | 'Community';
  description: string;
  icon: string;
  isActive: boolean;
  isIncludedInQuotation: boolean;
}

const DEFAULT_AMENITIES: AmenityItem[] = [
  {
    id: '1',
    name: 'Dual-Provider Gigabit Fiber Wi-Fi',
    category: 'Connectivity',
    description: 'High-speed redundant optical fiber with dedicated low-latency bandwidth for video conferencing and development.',
    icon: 'wifi',
    isActive: true,
    isIncludedInQuotation: true,
  },
  {
    id: '2',
    name: 'Automatic Generator Power Backup',
    category: 'Facilities',
    description: 'Zero-interruption industrial backup power generator guaranteeing 100% uptime during city outages.',
    icon: 'zap',
    isActive: true,
    isIncludedInQuotation: true,
  },
  {
    id: '3',
    name: 'Specialty Ethiopian Coffee & Tea Bar',
    category: 'Hospitality',
    description: 'Unlimited barista-grade freshly brewed Ethiopian coffee, organic teas, and chilled filtered water stations.',
    icon: 'coffee',
    isActive: true,
    isIncludedInQuotation: true,
  },
  {
    id: '4',
    name: '4K Ultra-HD Smart Presentation Displays',
    category: 'Technology',
    description: 'Wireless AirPlay/Cast and HDMI ready displays with omni-directional conference microphones.',
    icon: 'tv',
    isActive: true,
    isIncludedInQuotation: true,
  },
  {
    id: '5',
    name: 'High-Capacity Laser Printing & Scanning',
    category: 'Technology',
    description: 'Network-enabled color and black/white laser document reproduction and multi-page scanning.',
    icon: 'printer',
    isActive: true,
    isIncludedInQuotation: true,
  },
  {
    id: '6',
    name: '24/7 Biometric & Keycard Access Control',
    category: 'Facilities',
    description: 'Round-the-clock secure entry for dedicated desk holders and private office teams with CCTV monitoring.',
    icon: 'shield',
    isActive: true,
    isIncludedInQuotation: true,
  },
];

interface AmenitiesTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const AmenitiesTab: React.FC<AmenitiesTabProps> = ({ onSuccessToast }) => {
  const [amenities, setAmenities] = useState<AmenityItem[]>(() => {
    const saved = localStorage.getItem('weventure_amenities_catalog');
    return saved ? JSON.parse(saved) : DEFAULT_AMENITIES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Facilities' as AmenityItem['category'],
    description: '',
    isActive: true,
    isIncludedInQuotation: true,
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const saveToStorage = (items: AmenityItem[]) => {
    setAmenities(items);
    localStorage.setItem('weventure_amenities_catalog', JSON.stringify(items));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: 'Facilities',
      description: '',
      isActive: true,
      isIncludedInQuotation: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: AmenityItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      isActive: item.isActive,
      isIncludedInQuotation: item.isIncludedInQuotation,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
      const updated = amenities.map((item) =>
        item.id === editingId ? { ...item, ...formData } : item
      );
      saveToStorage(updated);
      setSuccessMsg('Amenity updated successfully');
    } else {
      const newItem: AmenityItem = {
        id: Date.now().toString(),
        name: formData.name,
        category: formData.category,
        description: formData.description,
        icon: 'sparkles',
        isActive: formData.isActive,
        isIncludedInQuotation: formData.isIncludedInQuotation,
      };
      saveToStorage([...amenities, newItem]);
      setSuccessMsg('New amenity catalog item added');
    }

    setIsModalOpen(false);
    if (onSuccessToast) onSuccessToast('Amenities list updated');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDelete = (id: string) => {
    const updated = amenities.filter((item) => item.id !== id);
    saveToStorage(updated);
    if (onSuccessToast) onSuccessToast('Amenity removed');
  };

  const handleToggleQuotation = (id: string) => {
    const updated = amenities.map((item) =>
      item.id === id ? { ...item, isIncludedInQuotation: !item.isIncludedInQuotation } : item
    );
    saveToStorage(updated);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">Included Amenities & Facilities</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Manage the high-value amenities and facility perks included in WeVentureHub workspaces and official quotations.
              </p>
            </div>
          </div>
          <Button
            id="add-amenity-btn"
            onClick={openAddModal}
            variant="primary"
            className="flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Amenity</span>
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#84CC16]/15 border border-[#84CC16]/40 rounded-xl text-[#65A30D] text-sm flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {amenities.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#84CC16]/60 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#84CC16]/10 text-[#65A30D] flex items-center justify-center shrink-0 border border-[#84CC16]/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#111111] dark:text-white text-sm">{item.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
                {item.description}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between pl-10">
              <span className="text-xs text-[#6B7280] dark:text-slate-400 font-medium">Include on Official Quotation</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isIncludedInQuotation}
                  onChange={() => handleToggleQuotation(item.id)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#84CC16]"></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-start gap-2.5 text-xs text-[#6B7280] dark:text-slate-400 font-medium">
        <Info className="w-4 h-4 text-[#84CC16] mt-0.5 shrink-0" />
        <p>
          Amenities marked with "Include on Official Quotation" are rendered cleanly in the <strong className="text-[#111111] dark:text-white">INCLUDED AMENITIES & FACILITIES</strong> section of the WeVentureHub PDF Quotation with proper line wrapping and vertical spacing.
        </p>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl max-w-md w-full border border-neutral-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-[#111111] dark:text-white">
                {editingId ? 'Edit Amenity' : 'Add New Amenity'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Amenity Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ergonomic Standing Desks"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
                >
                  <option value="Connectivity">Connectivity & Internet</option>
                  <option value="Facilities">Facilities & Power</option>
                  <option value="Hospitality">Hospitality & Refreshments</option>
                  <option value="Technology">Technology & AV</option>
                  <option value="Community">Community & Perks</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
                  placeholder="Detailed description of the feature or equipment."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isIncludedInQuotation}
                    onChange={(e) => setFormData({ ...formData, isIncludedInQuotation: e.target.checked })}
                    className="rounded text-[#84CC16] focus:ring-[#84CC16]"
                  />
                  <span>Show in Official PDF Quotations</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Amenity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
