import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building, 
  ArrowLeft, 
  Plus, 
  UploadCloud, 
  X, 
  CheckCircle, 
  DollarSign, 
  Users, 
  MapPin, 
  Sparkles,
  Layers,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { workspaceApi, IWorkspacePayload } from '../lib/workspaceApi';

const DEFAULT_AMENITIES = [
  'High-Speed Fiber Wi-Fi',
  'Unlimited Coffee & Tea',
  'Whiteboard & Markers',
  '4K Smart TV / Display',
  'Video Conferencing Unit',
  'Ergonomic Desk Chairs',
  'Receptionist Greetings',
  'Air Conditioning',
  'Soundproof Pods',
  'Printing & Scanning'
];

export default function CreateWorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const currentPrefix = location.pathname.startsWith('/superadmin/dashboard')
    ? '/superadmin/dashboard'
    : location.pathname.startsWith('/admin/dashboard')
    ? '/admin/dashboard'
    : '/dashboard';

  const [formData, setFormData] = useState<IWorkspacePayload>({
    title: '',
    category: 'Meeting Room',
    workspaceType: 'MEETING_ROOM',
    capacity: 10,
    floor: 'Floor 2',
    size: '350 sq ft',
    hourlyPrice: 45,
    dailyPrice: 280,
    monthlyPrice: 3500,
    currency: 'USD',
    shortDescription: '',
    fullDescription: '',
    location: 'WeVentureHub HQ, Block B',
    openingHours: '08:00',
    closingHours: '20:00',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    amenities: ['High-Speed Fiber Wi-Fi', 'Unlimited Coffee & Tea', 'Whiteboard & Markers'],
    status: 'published',
    featured: false,
    displayOrder: 1,
  });

  const [amenityInput, setAmenityInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: IWorkspacePayload) => workspaceApi.createWorkspace(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setFeedback({ type: 'success', message: 'Workspace created successfully!' });
      setTimeout(() => {
        navigate(`${currentPrefix}/workspaces`);
      }, 800);
    },
    onError: (err: any) => {
      setFeedback({ 
        type: 'error', 
        message: err?.response?.data?.error?.message || err?.message || 'Failed to create workspace. Please try again.' 
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleAmenity = (item: string) => {
    setFormData(prev => {
      const current = prev.amenities || [];
      if (current.includes(item)) {
        return { ...prev, amenities: current.filter(a => a !== item) };
      } else {
        return { ...prev, amenities: [...current, item] };
      }
    });
  };

  const handleAddCustomAmenity = () => {
    const clean = amenityInput.trim();
    if (clean && !formData.amenities?.includes(clean)) {
      setFormData(prev => ({ ...prev, amenities: [...(prev.amenities || []), clean] }));
      setAmenityInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a workspace title.' });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate(`${currentPrefix}/workspaces`)}
            className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[12px] font-bold text-[#84CC16] tracking-wide uppercase font-mono">
              WeVentureHub Asset Portal
            </span>
            <h1 className="font-display font-bold text-[28px] text-[#111827] tracking-tight">
              Create New Workspace
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`${currentPrefix}/workspaces`)}
            className="h-[44px] px-5 rounded-[12px] font-semibold border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="h-[44px] px-6 rounded-[12px] font-bold bg-[#A3E635] hover:bg-[#84CC16] text-[#111111]"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Publishing Workspace...' : 'Publish Workspace'}
          </Button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-8">
        
        {/* Section 1: Basic Information */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-[#E5E7EB] pb-3">
            <Building className="w-5 h-5 text-[#84CC16]" />
            <h2 className="font-display font-bold text-[18px] text-[#111827]">General Specifications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Workspace Name / Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Innovation Executive Suite A"
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Category Type *</label>
              <select
                name="workspaceType"
                value={formData.workspaceType}
                onChange={(e) => {
                  handleChange(e);
                  setFormData(prev => ({ ...prev, category: e.target.value }));
                }}
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              >
                <option value="MEETING_ROOM">Meeting Room / Boardroom</option>
                <option value="HOT_DESK">Hot Desk Coworking</option>
                <option value="DEDICATED_DESK">Dedicated Team Desk</option>
                <option value="EVENT_VENUE">Event Venue / Auditorium</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Max Capacity (Guests)</label>
              <input
                type="number"
                name="capacity"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Floor / Level</label>
              <input
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                placeholder="e.g. Floor 3, Wing B"
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Floor Area / Size</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="e.g. 450 sq ft"
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#374151]">Short Overview</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="A high-tech executive space designed for high-impact board meetings..."
              className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#374151]">Detailed Description</label>
            <textarea
              name="fullDescription"
              rows={4}
              value={formData.fullDescription}
              onChange={handleChange}
              placeholder="Provide comprehensive details regarding technical AV setups, seating arrangements, catering options..."
              className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
            />
          </div>
        </div>

        {/* Section 2: Pricing Matrix */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-[#E5E7EB] pb-3">
            <DollarSign className="w-5 h-5 text-[#84CC16]" />
            <h2 className="font-display font-bold text-[18px] text-[#111827]">Rates & Billing Structure</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="KES">KES (KSh)</option>
                <option value="NGN">NGN (₦)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Hourly Rate</label>
              <input
                type="number"
                name="hourlyPrice"
                value={formData.hourlyPrice}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Daily Rate</label>
              <input
                type="number"
                name="dailyPrice"
                value={formData.dailyPrice}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Monthly Price</label>
              <input
                type="number"
                name="monthlyPrice"
                value={formData.monthlyPrice}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Media & Location */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-[#E5E7EB] pb-3">
            <MapPin className="w-5 h-5 text-[#84CC16]" />
            <h2 className="font-display font-bold text-[18px] text-[#111827]">Location & Media Assets</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Physical Location / Address</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#374151]">Cover Image URL</label>
              <input
                type="text"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
              />
            </div>
          </div>

          {formData.coverImage && (
            <div className="relative h-48 w-full rounded-[14px] overflow-hidden border border-[#E5E7EB]">
              <img src={formData.coverImage} alt="Workspace Cover Preview" className="w-full h-full object-cover" />
              <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                Cover Preview
              </span>
            </div>
          )}
        </div>

        {/* Section 4: Amenities Checklist */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-[#E5E7EB] pb-3">
            <Sparkles className="w-5 h-5 text-[#84CC16]" />
            <h2 className="font-display font-bold text-[18px] text-[#111827]">Included Amenities & Services</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEFAULT_AMENITIES.map((item) => {
              const isSelected = formData.amenities?.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => handleToggleAmenity(item)}
                  className={`p-3.5 rounded-[12px] border text-left flex items-center justify-between text-[13px] font-semibold transition ${
                    isSelected
                      ? 'bg-[#A3E635]/15 border-[#84CC16] text-[#111827]'
                      : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'
                  }`}
                >
                  <span>{item}</span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-[#84CC16] shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input
              type="text"
              placeholder="Add custom amenity..."
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomAmenity();
                }
              }}
              className="flex-grow bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A3E635] outline-none"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddCustomAmenity}
              className="px-4 h-[42px] rounded-[12px] text-[13px] font-bold"
            >
              Add Amenity
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 border-t border-[#E5E7EB] pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`${currentPrefix}/workspaces`)}
            className="h-[44px] px-6 rounded-[12px] font-semibold border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="h-[44px] px-8 rounded-[12px] font-bold bg-[#A3E635] hover:bg-[#84CC16] text-[#111111]"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Publishing Workspace...' : 'Publish Workspace'}
          </Button>
        </div>

      </form>

    </div>
  );
}
