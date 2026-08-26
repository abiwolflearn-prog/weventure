import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles,
  Layers,
  X,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { axiosInstance } from '../../lib/axiosInstance';

interface WorkspaceService {
  _id?: string;
  id?: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  priceHourly?: number;
  priceDaily?: number;
  priceMonthly?: number;
  currency: string;
  isPublished?: boolean;
  status?: string;
  amenities?: string[];
  instantBooking?: boolean;
}

interface WorkspacesServicesTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const WorkspacesServicesTab: React.FC<WorkspacesServicesTabProps> = ({ onSuccessToast }) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'HOT_DESK',
    description: '',
    capacity: 1,
    priceHourly: 0,
    priceDaily: 0,
    priceMonthly: 0,
    currency: 'ETB',
    instantBooking: true,
    isPublished: true,
    amenities: 'Gigabit Wi-Fi, Specialty Coffee, Power Backup',
  });
  const [savingService, setSavingService] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/workspaces');
      if (res.data?.data) {
        setWorkspaces(res.data.data);
      }
    } catch (err: any) {
      console.warn('Error loading workspaces, showing defaults', err);
      setWorkspaces([
        {
          id: '1',
          name: 'Executive Hot Desk',
          type: 'HOT_DESK',
          description: 'High-speed fiber connectivity, ergonomic seating, and complimentary coffee access in our main hall.',
          capacity: 1,
          priceHourly: 150,
          priceDaily: 800,
          priceMonthly: 12000,
          currency: 'ETB',
          isPublished: true,
          amenities: ['Gigabit Wi-Fi', 'Complimentary Espresso', 'Power Backup'],
          instantBooking: true,
        },
        {
          id: '2',
          name: 'Dedicated Founder Desk',
          type: 'DEDICATED_DESK',
          description: 'Personal locked storage, 24/7 access pass, dual-monitor arm mounts, and mailing address.',
          capacity: 1,
          priceHourly: 0,
          priceDaily: 1200,
          priceMonthly: 18000,
          currency: 'ETB',
          isPublished: true,
          amenities: ['24/7 Access', 'Lockable Storage', 'Ergonomic Chair', 'Free Meeting Credits'],
          instantBooking: true,
        },
        {
          id: '3',
          name: 'Executive Meeting Room (8 Pax)',
          type: 'MEETING_ROOM',
          description: '4K Ultra-HD screen with wireless presentation, omni-directional conference microphone, and glass whiteboard.',
          capacity: 8,
          priceHourly: 1200,
          priceDaily: 7500,
          priceMonthly: 0,
          currency: 'ETB',
          isPublished: true,
          amenities: ['4K Smart TV', 'Video Conference Bar', 'Glass Whiteboard', 'Climate Control'],
          instantBooking: true,
        },
        {
          id: '4',
          name: 'Training & Workshop Room (25 Pax)',
          type: 'CONFERENCE_ROOM',
          description: 'Classroom or boardroom layout with high-lumen projector, motorized screen, and PA sound system.',
          capacity: 25,
          priceHourly: 2500,
          priceDaily: 16000,
          priceMonthly: 0,
          currency: 'ETB',
          isPublished: true,
          amenities: ['High-Lumen Projector', 'Wireless Mics', 'Flipcharts', 'Stage Area'],
          instantBooking: false,
        },
        {
          id: '5',
          name: 'Grand Event Space & Amphitheater',
          type: 'EVENT_SPACE',
          description: 'Full audio visual integration, stage spotlights, live streaming rig, and cocktail networking zone.',
          capacity: 150,
          priceHourly: 5000,
          priceDaily: 35000,
          priceMonthly: 0,
          currency: 'ETB',
          isPublished: true,
          amenities: ['Studio Sound Rig', 'Livestream Rig', 'Catering Kitchenette', 'Stage Lighting'],
          instantBooking: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'HOT_DESK',
      description: '',
      capacity: 1,
      priceHourly: 0,
      priceDaily: 0,
      priceMonthly: 0,
      currency: 'ETB',
      instantBooking: true,
      isPublished: true,
      amenities: 'Gigabit Wi-Fi, Specialty Coffee, Power Backup',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ws: WorkspaceService) => {
    setEditingId(ws._id || ws.id || null);
    setFormData({
      name: ws.name,
      type: ws.type || 'HOT_DESK',
      description: ws.description || '',
      capacity: ws.capacity || 1,
      priceHourly: ws.priceHourly || 0,
      priceDaily: ws.priceDaily || 0,
      priceMonthly: ws.priceMonthly || 0,
      currency: ws.currency || 'ETB',
      instantBooking: ws.instantBooking !== undefined ? ws.instantBooking : true,
      isPublished: ws.isPublished !== undefined ? ws.isPublished : true,
      amenities: Array.isArray(ws.amenities) ? ws.amenities.join(', ') : '',
    });
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingService(true);
      setError(null);

      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        capacity: Number(formData.capacity),
        priceHourly: Number(formData.priceHourly),
        priceDaily: Number(formData.priceDaily),
        priceMonthly: Number(formData.priceMonthly),
        currency: formData.currency,
        instantBooking: formData.instantBooking,
        isPublished: formData.isPublished,
        amenities: formData.amenities.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (editingId) {
        await axiosInstance.put(`/workspaces/${editingId}`, payload);
        setSuccessMsg('Workspace service updated successfully');
      } else {
        await axiosInstance.post('/workspaces', payload);
        setSuccessMsg('New workspace service established');
      }

      setIsModalOpen(false);
      fetchWorkspaces();
      if (onSuccessToast) onSuccessToast('Workspace service saved');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save workspace service.');
    } finally {
      setSavingService(false);
    }
  };

  const handleTogglePublished = async (ws: WorkspaceService) => {
    const wsId = ws._id || ws.id;
    if (!wsId) return;

    try {
      await axiosInstance.patch(`/workspaces/${wsId}/status`, {
        status: ws.isPublished ? 'Draft' : 'Published',
      });
      fetchWorkspaces();
    } catch (err) {
      setWorkspaces((prev) =>
        prev.map((w) => ((w._id || w.id) === wsId ? { ...w, isPublished: !w.isPublished } : w))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">WeVentureHub Workspaces & Services</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Manage all official physical spaces: Hot Desks, Dedicated Desks, Private Offices, Meeting Rooms, and Event Hall.
              </p>
            </div>
          </div>
          <Button
            id="add-workspace-service-btn"
            onClick={openAddModal}
            variant="primary"
            className="flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Workspace</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#84CC16]/15 border border-[#84CC16]/40 rounded-xl text-[#65A30D] text-sm flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Workspaces List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#84CC16] border-t-transparent rounded-full animate-spin mr-3"></div>
            <span>Loading workspaces...</span>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-[20px] border border-neutral-200 dark:border-slate-800">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No workspaces established</p>
          </div>
        ) : (
          workspaces.map((ws) => {
            const wsId = ws._id || ws.id;
            return (
              <div
                key={wsId}
                className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#84CC16]/60 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#65A30D] bg-[#84CC16]/10 px-2.5 py-0.5 rounded-full border border-[#84CC16]/20">
                        {ws.type?.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-[#111111] dark:text-white text-base mt-2">{ws.name}</h4>
                    </div>
                    <button
                      onClick={() => handleTogglePublished(ws)}
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        ws.isPublished !== false
                          ? 'bg-[#84CC16]/20 text-[#65A30D]'
                          : 'bg-neutral-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {ws.isPublished !== false ? 'Published' : 'Draft'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {ws.description || 'Premium WeVentureHub workspace facility.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-neutral-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Capacity: {ws.capacity} {ws.capacity > 1 ? 'People' : 'Person'}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-[#84CC16]" />
                      <span>{ws.instantBooking ? 'Instant Booking' : 'Requires Approval'}</span>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 p-3.5 rounded-[14px] text-xs space-y-1.5">
                    {ws.priceHourly ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Hourly Rate:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                          {ws.priceHourly} {ws.currency}/hr
                        </strong>
                      </div>
                    ) : null}
                    {ws.priceDaily ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Daily Rate:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                          {ws.priceDaily} {ws.currency}/day
                        </strong>
                      </div>
                    ) : null}
                    {ws.priceMonthly ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Monthly Rate:</span>
                        <strong className="font-mono text-[#65A30D] font-bold">
                          {ws.priceMonthly.toLocaleString()} {ws.currency}/mo
                        </strong>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-neutral-100 dark:border-slate-800">
                  <Button
                    onClick={() => openEditModal(ws)}
                    variant="secondary"
                    className="text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Add / Edit Workspace */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl max-w-lg w-full border border-neutral-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-[#111111] dark:text-white">
                {editingId ? 'Edit Workspace Facility' : 'Create Workspace Facility'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Service / Space Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Executive Meeting Room or Dedicated Desk"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                    Space Category *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
                  >
                    <option value="HOT_DESK">Hot Desk</option>
                    <option value="DEDICATED_DESK">Dedicated Desk</option>
                    <option value="PRIVATE_OFFICE">Private Office</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                    <option value="CONFERENCE_ROOM">Conference / Training</option>
                    <option value="EVENT_SPACE">Event Hall / Space</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                    Seating Capacity (Pax) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    required
                  />
                </div>
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
                  placeholder="Details about equipment, sound isolation, and amenities."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Hourly (ETB)</label>
                  <Input
                    type="number"
                    value={formData.priceHourly}
                    onChange={(e) => setFormData({ ...formData, priceHourly: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Daily (ETB)</label>
                  <Input
                    type="number"
                    value={formData.priceDaily}
                    onChange={(e) => setFormData({ ...formData, priceDaily: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Monthly (ETB)</label>
                  <Input
                    type="number"
                    value={formData.priceMonthly}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Included Amenities (Comma-separated)
                </label>
                <Input
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="Gigabit Wi-Fi, 4K Smart TV, Whiteboard"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-slate-800">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.instantBooking}
                    onChange={(e) => setFormData({ ...formData, instantBooking: e.target.checked })}
                    className="rounded text-[#84CC16] focus:ring-[#84CC16]"
                  />
                  <span>Allow Instant Booking</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded text-[#84CC16] focus:ring-[#84CC16]"
                  />
                  <span>Published on Website</span>
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
                <Button type="submit" disabled={savingService} variant="primary">
                  {savingService ? 'Saving...' : 'Save Workspace'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
