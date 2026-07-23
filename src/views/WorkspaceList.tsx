import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  Edit, 
  DollarSign, 
  Users, 
  Layers, 
  Clock, 
  CalendarCheck,
  Tag,
  Briefcase,
  UploadCloud,
  X,
  Image,
  Copy,
  Star,
  Eye,
  Maximize2,
  MapPin,
  ListOrdered
} from 'lucide-react';
import { useAppSelector } from '../store';
import { workspaceApi, IWorkspacePayload, IWorkspace } from '../lib/workspaceApi';
import { bookingApi } from '../lib/bookingApi';
import { UserRole } from '../types';
import { Table, IColumn } from '../components/Table';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { BookingCalendar } from '../components/workspaces/BookingCalendar';

export default function WorkspaceList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  // Layout screen tabs
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'PLANNER'>('CATALOG');

  // Search and filter states
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal control states
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null);
  const [workspaceFormOpen, setWorkspaceFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any | null>(null);

  // New Booking form states
  const [bookingDate, setBookingDate] = useState('2026-07-01');
  const [bookingStart, setBookingStart] = useState('14:00');
  const [bookingEnd, setBookingEnd] = useState('16:00');
  const [bookingPurpose, setBookingPurpose] = useState('Workspace Utilization');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // States for billing plans of the workspace being created/edited
  const [wsBillingPlans, setWsBillingPlans] = useState<any[]>([]);

  // States for adding a new billing plan
  const [newPlanName, setNewPlanName] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [newPlanPrice, setNewPlanPrice] = useState('5000');
  const [newPlanCurrency, setNewPlanCurrency] = useState('ETB');
  const [newPlanDeposit, setNewPlanDeposit] = useState('');
  const [newPlanDueDay, setNewPlanDueDay] = useState('1');
  const [newPlanAgreement, setNewPlanAgreement] = useState(
    "This Monthly Coworking Space Membership Agreement is entered into by WeVentureHub and the Client. Rent and membership fees are due monthly. A security deposit is required and refundable upon termination."
  );

  // States for selected workspace booking details
  const [selectedBillingPlanId, setSelectedBillingPlanId] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [billingContactName, setBillingContactName] = useState('');
  const [billingContactEmail, setBillingContactEmail] = useState('');
  const [billingCompany, setBillingCompany] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Comprehensive Workspace Form States
  const [wsTitle, setWsTitle] = useState('');
  const [wsShortDescription, setWsShortDescription] = useState('');
  const [wsFullDescription, setWsFullDescription] = useState('');
  const [wsCategory, setWsCategory] = useState('Meeting Room');
  const [wsType, setWsType] = useState<string>('MEETING_ROOM');
  const [wsCapacity, setWsCapacity] = useState('8');
  const [wsFloor, setWsFloor] = useState('Floor 1');
  const [wsSize, setWsSize] = useState('350 sqft');
  const [wsHourlyPrice, setWsHourlyPrice] = useState('35');
  const [wsDailyPrice, setWsDailyPrice] = useState('200');
  const [wsWeeklyPrice, setWsWeeklyPrice] = useState('800');
  const [wsMonthlyPrice, setWsMonthlyPrice] = useState('2800');
  const [wsCurrency, setWsCurrency] = useState('USD');
  const [wsAmenitiesText, setWsAmenitiesText] = useState('Whiteboard, Webcam, High-speed WiFi');
  const [wsFeaturesText, setWsFeaturesText] = useState('Ergonomic Chairs, Natural Light, Quiet Zone');
  const [wsAvailability, setWsAvailability] = useState<'Available' | 'Occupied' | 'Maintenance' | 'Reserved'>('Available');
  const [wsOpeningHours, setWsOpeningHours] = useState('08:00');
  const [wsClosingHours, setWsClosingHours] = useState('20:00');
  const [wsLocation, setWsLocation] = useState('Main Campus, Building A');
  const [wsStatus, setWsStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [wsFeatured, setWsFeatured] = useState(false);
  const [wsDisplayOrder, setWsDisplayOrder] = useState('0');
  const [wsCoverImage, setWsCoverImage] = useState('');
  const [wsGalleryText, setWsGalleryText] = useState('');
  const [wsBufferTime, setWsBufferTime] = useState('15');
  const [formError, setFormError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleImageFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleImageFile(file);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, or WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setWsCoverImage(reader.result as string);
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  // User Roles Check
  const isAdminOrStaff = 
    user?.role === UserRole.SUPER_ADMIN || 
    user?.role === UserRole.TENANT_ADMIN || 
    user?.role === UserRole.STAFF;

  // ----------------------------------------------------
  // 1. Live Data Queries (TanStack Query)
  // ----------------------------------------------------
  const { 
    data: workspacesResponse, 
    isLoading: isWorkspacesLoading,
    refetch: refetchWorkspaces 
  } = useQuery({
    queryKey: ['workspaces', search, filterCategory],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (filterCategory !== 'ALL') params.category = filterCategory;
      return await workspaceApi.getWorkspaces(params);
    }
  });

  const { 
    data: bookingsResponse,
    isLoading: isBookingsLoading 
  } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      return await bookingApi.getBookings();
    }
  });

  const workspaces: any[] = workspacesResponse?.data || [];
  const bookings: any[] = bookingsResponse?.data || [];

  // ----------------------------------------------------
  // 2. Mutations (TanStack Mutation)
  // ----------------------------------------------------
  const createBookingMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await bookingApi.createBooking(payload);
    },
    onSuccess: (data: any) => {
      setBookingSuccess(true);
      setBookingError(null);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      
      const selectedPlanObj = selectedWorkspace?.billingPlans?.find((p: any) => p.id === selectedBillingPlanId || p._id === selectedBillingPlanId);
      const checkoutPrice = selectedPlanObj 
        ? (selectedPlanObj.price + (selectedPlanObj.deposit || 0)) 
        : calculateEstimatedPrice();
      const currency = selectedPlanObj ? (selectedPlanObj.currency || 'USD') : 'USD';
      
      setTimeout(() => {
        setSelectedWorkspace(null);
        setBookingSuccess(false);
        if (checkoutPrice > 0) {
          navigate('/dashboard/checkout', {
            state: {
              targetType: 'BOOKING',
              targetId: data?.id || data?._id || 'BOOKING-123',
              amount: checkoutPrice,
              currency: currency,
              title: selectedWorkspace?.title || selectedWorkspace?.name || 'Workspace Reservation',
              description: selectedPlanObj 
                ? `${selectedPlanObj.name} Coworking Plan for ${selectedWorkspace?.title || selectedWorkspace?.name}` 
                : `Hourly reservation for ${selectedWorkspace?.title || selectedWorkspace?.name}`
            }
          });
        }
      }, 1500);
    },
    onError: (err: any) => {
      setBookingError(err.message || 'An error occurred while establishing your reservation.');
    }
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (payload: IWorkspacePayload) => {
      return await workspaceApi.createWorkspace(payload);
    },
    onSuccess: () => {
      setWorkspaceFormOpen(false);
      resetWorkspaceForm();
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create workspace.');
    }
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<IWorkspacePayload> }) => {
      return await workspaceApi.updateWorkspace(id, payload);
    },
    onSuccess: () => {
      setWorkspaceFormOpen(false);
      resetWorkspaceForm();
      setEditingWorkspace(null);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update workspace.');
    }
  });

  const duplicateWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await workspaceApi.duplicateWorkspace(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to duplicate workspace.');
    }
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      return await workspaceApi.toggleWorkspaceFeatured(id, featured);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'published' | 'draft' | 'archived' }) => {
      return await workspaceApi.updateWorkspaceStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    }
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await workspaceApi.deleteWorkspace(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Workspace deletion failed.');
    }
  });

  // ----------------------------------------------------
  // 3. Form Submission Handlers
  // ----------------------------------------------------
  const handleConfirmBooking = () => {
    if (!selectedWorkspace) return;

    // Build ISO dates for start and end times
    const startIso = new Date(`${bookingDate}T${bookingStart}:00`).toISOString();
    const endIso = new Date(`${bookingDate}T${bookingEnd}:00`).toISOString();

    const selectedPlanObj = selectedWorkspace.billingPlans?.find(
      (p: any) => p.id === selectedBillingPlanId || p._id === selectedBillingPlanId
    );

    if (selectedPlanObj) {
      if (!signatureName.trim()) {
        setBookingError('You must sign the Coworking Agreement by typing your full name.');
        return;
      }
      if (!emergencyName.trim() || !emergencyRelationship.trim() || !emergencyPhone.trim()) {
        setBookingError('Please complete all emergency contact fields.');
        return;
      }
    }

    const payload: any = {
      spaceId: selectedWorkspace._id || selectedWorkspace.id,
      startTime: startIso,
      endTime: endIso,
      purpose: bookingPurpose,
    };

    if (selectedPlanObj) {
      payload.billingPlanId = selectedPlanObj.id || selectedPlanObj._id;
      payload.signedAgreementText = `Signed electronically by ${signatureName.trim()} on ${new Date().toLocaleString()}.\n\nAgreement terms:\n${selectedPlanObj.agreementTemplate || ''}`;
      payload.emergencyContact = {
        name: emergencyName.trim(),
        relationship: emergencyRelationship.trim(),
        phone: emergencyPhone.trim(),
      };
      payload.billingDetails = {
        name: billingContactName.trim() || `${user?.firstName} ${user?.lastName}`,
        email: billingContactEmail.trim() || user?.email || '',
        company: billingCompany.trim() || undefined,
        address: billingAddress.trim() || undefined,
      };
    }

    createBookingMutation.mutate(payload);
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsTitle.trim()) {
      setFormError('Workspace Title is required');
      return;
    }

    const payload: IWorkspacePayload = {
      title: wsTitle.trim(),
      name: wsTitle.trim(),
      shortDescription: wsShortDescription.trim(),
      fullDescription: wsFullDescription.trim(),
      category: wsCategory,
      workspaceType: wsType,
      type: wsType,
      capacity: Number(wsCapacity) || 1,
      floor: wsFloor.trim(),
      size: wsSize.trim(),
      hourlyPrice: Number(wsHourlyPrice) || 0,
      hourlyRate: Number(wsHourlyPrice) || 0,
      dailyPrice: Number(wsDailyPrice) || 0,
      weeklyPrice: Number(wsWeeklyPrice) || 0,
      monthlyPrice: Number(wsMonthlyPrice) || 0,
      currency: wsCurrency || 'USD',
      coverImage: wsCoverImage || undefined,
      imageUrl: wsCoverImage || undefined,
      galleryImages: wsGalleryText.split(',').map(s => s.trim()).filter(Boolean),
      amenities: wsAmenitiesText.split(',').map(s => s.trim()).filter(Boolean),
      features: wsFeaturesText.split(',').map(s => s.trim()).filter(Boolean),
      availability: wsAvailability,
      isAvailable: wsAvailability === 'Available',
      openingHours: wsOpeningHours,
      closingHours: wsClosingHours,
      location: wsLocation.trim(),
      status: wsStatus,
      featured: wsFeatured,
      displayOrder: Number(wsDisplayOrder) || 0,
      billingPlans: wsBillingPlans,
    };

    const targetId = editingWorkspace?._id || editingWorkspace?.id;
    if (editingWorkspace && targetId) {
      updateWorkspaceMutation.mutate({ id: targetId, payload });
    } else {
      createWorkspaceMutation.mutate(payload);
    }
  };

  const handleEditWorkspaceClick = (space: any) => {
    setEditingWorkspace(space);
    setWsTitle(space.title || space.name || '');
    setWsShortDescription(space.shortDescription || '');
    setWsFullDescription(space.fullDescription || '');
    setWsCategory(space.category || 'Meeting Room');
    setWsType(space.workspaceType || space.type || 'MEETING_ROOM');
    setWsCapacity((space.capacity || 8).toString());
    setWsFloor(space.floor || 'Floor 1');
    setWsSize(space.size || '350 sqft');
    setWsHourlyPrice((space.hourlyPrice !== undefined ? space.hourlyPrice : (space.hourlyRate || 35)).toString());
    setWsDailyPrice((space.dailyPrice !== undefined ? space.dailyPrice : (space.dailyRate || 200)).toString());
    setWsWeeklyPrice((space.weeklyPrice || 800).toString());
    setWsMonthlyPrice((space.monthlyPrice || 2800).toString());
    setWsCurrency(space.currency || 'USD');
    setWsAmenitiesText(Array.isArray(space.amenities) ? space.amenities.join(', ') : 'Whiteboard, Webcam, High-speed WiFi');
    setWsFeaturesText(Array.isArray(space.features) ? space.features.join(', ') : 'Ergonomic Chairs, Natural Light');
    setWsAvailability(space.availability || (space.isAvailable !== false ? 'Available' : 'Occupied'));
    setWsOpeningHours(space.openingHours || '08:00');
    setWsClosingHours(space.closingHours || '20:00');
    setWsLocation(space.location || 'Main Campus');
    setWsStatus(space.status || 'published');
    setWsFeatured(!!space.featured);
    setWsDisplayOrder((space.displayOrder || 0).toString());
    setWsCoverImage(space.coverImage || space.imageUrl || '');
    setWsGalleryText(Array.isArray(space.galleryImages) ? space.galleryImages.join(', ') : '');
    setWsBillingPlans(space.billingPlans || []);
    setWorkspaceFormOpen(true);
  };

  const handleDeleteWorkspaceClick = (id: string) => {
    if (confirm('Are you absolutely sure you want to retire this workspace resource? All records will be archived.')) {
      deleteWorkspaceMutation.mutate(id);
    }
  };

  const resetWorkspaceForm = () => {
    setEditingWorkspace(null);
    setWsTitle('');
    setWsShortDescription('');
    setWsFullDescription('');
    setWsCategory('Meeting Room');
    setWsType('MEETING_ROOM');
    setWsCapacity('8');
    setWsFloor('Floor 1');
    setWsSize('350 sqft');
    setWsHourlyPrice('35');
    setWsDailyPrice('200');
    setWsWeeklyPrice('800');
    setWsMonthlyPrice('2800');
    setWsCurrency('USD');
    setWsAmenitiesText('Whiteboard, Webcam, High-speed WiFi');
    setWsFeaturesText('Ergonomic Chairs, Natural Light');
    setWsAvailability('Available');
    setWsOpeningHours('08:00');
    setWsClosingHours('20:00');
    setWsLocation('Main Campus');
    setWsStatus('published');
    setWsFeatured(false);
    setWsDisplayOrder('0');
    setWsCoverImage('');
    setWsGalleryText('');
    setWsBillingPlans([]);
    setFormError(null);
  };

  const handlePlanNameChange = (name: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly') => {
    setNewPlanName(name);
    if (name === 'Daily') {
      setNewPlanAgreement("This Daily Coworking Space Pass is entered into by WeVentureHub and the Client. Access is allowed for the single calendar day of {start_date}. Fees are payable upfront.");
    } else if (name === 'Weekly') {
      setNewPlanAgreement("This Weekly Coworking Space Pass Agreement is entered into by WeVentureHub and the Client. Access is authorized for 7 consecutive days starting from {start_date}. The fee of {price} is due upfront.");
    } else if (name === 'Monthly') {
      setNewPlanAgreement("This Monthly Coworking Space Membership Agreement is entered into by WeVentureHub and the Client. Rent and membership fees are due monthly. A security deposit is required and refundable upon termination.");
    } else if (name === 'Quarterly') {
      setNewPlanAgreement("This Quarterly Coworking Space Membership Agreement is entered into by WeVentureHub and the Client. Fees of {price} are due quarterly. A refundable security deposit is required.");
    } else if (name === 'Yearly') {
      setNewPlanAgreement("This Annual Coworking Space Membership Agreement is entered into by WeVentureHub and the Client. Fees of {price} are payable annually. A security deposit of {price} is due upfront.");
    }
  };

  const handleAddPlan = () => {
    const newPlan = {
      id: 'plan_' + Date.now(),
      name: newPlanName,
      price: Number(newPlanPrice) || 0,
      currency: newPlanCurrency,
      deposit: Number(newPlanDeposit) || undefined,
      paymentDueDay: Number(newPlanDueDay) || 1,
      agreementTemplate: newPlanAgreement,
      isActive: true
    };
    setWsBillingPlans([...wsBillingPlans, newPlan]);
    // Reset price/deposit inputs
    setNewPlanPrice('5000');
    setNewPlanDeposit('');
  };

  const handleRemovePlan = (id: string) => {
    setWsBillingPlans(wsBillingPlans.filter(p => p.id !== id && p._id !== id));
  };

  const handleTogglePlanActive = (id: string) => {
    setWsBillingPlans(wsBillingPlans.map(p => {
      if (p.id === id || p._id === id) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    }));
  };

  const handleSelectCalendarTimeSlot = (date: Date, startHour: number, endHour: number) => {
    const formattedDate = date.toISOString().split('T')[0];
    const formattedStart = `${startHour.toString().padStart(2, '0')}:00`;
    const formattedEnd = `${endHour.toString().padStart(2, '0')}:00`;

    setBookingDate(formattedDate);
    setBookingStart(formattedStart);
    setBookingEnd(formattedEnd);

    if (workspaces.length > 0) {
      handleOpenBookingModal(workspaces[0]);
    }
  };

  const handleOpenBookingModal = (row: any) => {
    setSelectedWorkspace(row);
    setSelectedBillingPlanId('');
    setSignatureName('');
    setEmergencyName('');
    setEmergencyRelationship('');
    setEmergencyPhone('');
    setBillingContactName(user ? `${user.firstName} ${user.lastName}` : '');
    setBillingContactEmail(user ? user.email : '');
    setBillingCompany('');
    setBillingAddress('');
    setBookingError(null);
  };

  // Helper: Estimate booking price
  const calculateEstimatedPrice = () => {
    if (!selectedWorkspace) return 0;
    try {
      const start = new Date(`${bookingDate}T${bookingStart}:00`);
      const end = new Date(`${bookingDate}T${bookingEnd}:00`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const rate = selectedWorkspace.hourlyPrice !== undefined ? selectedWorkspace.hourlyPrice : (selectedWorkspace.hourlyRate || 0);
      return Math.max(0, Math.round(hours * rate * 100) / 100);
    } catch {
      return 0;
    }
  };

  // Columns definition for the table
  const columns: IColumn<any>[] = [
    {
      header: 'Space Title',
      accessor: 'title',
      render: (row) => {
        const titleStr = row.title || row.name;
        const img = row.coverImage || row.imageUrl;
        const targetId = row._id || row.id;

        return (
          <div className="flex items-center space-x-3.5">
            {img ? (
              <div className="w-10 h-10 rounded-[10px] overflow-hidden border border-gray-100 flex-shrink-0">
                <img src={img} alt={titleStr} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="p-2.5 bg-[#A3E635]/15 rounded-[10px] text-[#65A30D] flex-shrink-0">
                <Building className="w-4.5 h-4.5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-[#111827] text-[14px]">{titleStr}</p>
                {row.featured && (
                  <span className="p-0.5 bg-amber-100 text-amber-600 rounded" title="Featured Workspace">
                    <Star className="w-3 h-3 fill-current" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mt-0.5">
                {row.category || row.workspaceType || 'Workspace'} | Order: {row.displayOrder || 0}
              </p>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Category & Type', 
      accessor: 'category',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
          {row.category || row.workspaceType || row.type || 'Workspace'}
        </span>
      )
    },
    { 
      header: 'Capacity & Size', 
      accessor: 'capacity', 
      render: (row) => (
        <div>
          <p className="text-[13px] font-bold text-[#4B5563]">Up to {row.capacity} seats</p>
          <p className="text-[10px] text-[#9CA3AF]">{row.floor || 'Floor 1'} • {row.size || '350 sqft'}</p>
        </div>
      )
    },
    { 
      header: 'Hourly Price', 
      accessor: 'hourlyPrice', 
      render: (row) => {
        const price = row.hourlyPrice !== undefined ? row.hourlyPrice : (row.hourlyRate || 0);
        return (
          <span className="text-[13px] font-bold text-[#111827] font-mono">
            {row.currency || 'USD'} {Number(price).toFixed(2)} / hr
          </span>
        );
      }
    },
    {
      header: 'Visibility Status',
      accessor: 'status',
      render: (row) => {
        const statusVal = row.status || 'published';
        const targetId = row._id || row.id;

        return (
          <div className="flex items-center gap-2">
            <select
              value={statusVal}
              onChange={(e) => updateStatusMutation.mutate({ id: targetId, status: e.target.value as any })}
              className={`px-2 py-1 rounded-md text-[11px] font-bold outline-none border cursor-pointer ${
                statusVal === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : statusVal === 'draft'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        );
      }
    },
    {
      header: 'Operational State',
      accessor: 'availability',
      render: (row) => {
        const state = row.availability || (row.isAvailable !== false ? 'Available' : 'Occupied');
        return (
          <span className={`inline-flex items-center space-x-1 text-[12px] font-bold ${
            state === 'Available' ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {state === 'Available' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-amber-500" />}
            <span>{state}</span>
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: '_id' as any,
      render: (row) => {
        const targetId = row._id || row.id;
        return (
          <div className="flex items-center gap-1.5">
            <Button 
              size="sm" 
              onClick={() => handleOpenBookingModal(row)}
              className="bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold text-[11px] h-[32px] px-2.5 rounded-[6px]"
            >
              Book
            </Button>

            {isAdminOrStaff && (
              <>
                <button
                  onClick={() => toggleFeaturedMutation.mutate({ id: targetId, featured: !row.featured })}
                  className={`p-1.5 border rounded-[6px] transition-colors ${
                    row.featured 
                      ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                      : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-amber-500'
                  }`}
                  title={row.featured ? "Unfeature workspace" : "Feature on Marketplace"}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>

                <button 
                  onClick={() => duplicateWorkspaceMutation.mutate(targetId)}
                  className="p-1.5 border border-gray-200 rounded-[6px] hover:bg-gray-50 hover:text-brand-accent text-gray-600 bg-white transition-colors"
                  title="Duplicate workspace"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={() => handleEditWorkspaceClick(row)}
                  className="p-1.5 border border-gray-200 rounded-[6px] hover:bg-gray-50 hover:text-[#65A30D] text-gray-600 bg-white transition-colors"
                  title="Edit workspace"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={() => handleDeleteWorkspaceClick(targetId)}
                  className="p-1.5 border border-gray-200 rounded-[6px] hover:bg-rose-50 hover:text-rose-600 text-gray-600 bg-white transition-colors"
                  title="Delete workspace"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-[24px] text-[#111827] tracking-tight">Dynamic Workspace Directory</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">Manage WeVentureHub meeting rooms, hot desks, boardrooms, and event venues in real-time.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#F1F5F9] p-1 rounded-[10px] border border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`px-4 py-1.5 rounded-[8px] text-[12px] font-bold transition-all ${
                activeTab === 'CATALOG'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              List Catalog
            </button>
            <button
              onClick={() => setActiveTab('PLANNER')}
              className={`px-4 py-1.5 rounded-[8px] text-[12px] font-bold transition-all ${
                activeTab === 'PLANNER'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Visual Planner
            </button>
          </div>

          {isAdminOrStaff && (
            <Button 
              onClick={() => { resetWorkspaceForm(); setWorkspaceFormOpen(true); }} 
              className="flex items-center gap-1.5 bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold text-[12px] h-[36px] rounded-[8px]"
            >
              <Plus className="w-4 h-4 text-[#111111]" />
              <span>Add Workspace</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'CATALOG' ? (
        <>
          {/* Filters Head */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-[16px] border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
            <div className="relative w-full md:max-w-sm">
              <Input 
                placeholder="Search workspaces by name, category, location..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-[10px] border-[#E5E7EB]"
              />
              <Search className="absolute left-3.5 bottom-3.5 text-[#9CA3AF] w-4.5 h-4.5 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 self-start w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <SlidersHorizontal className="w-4.5 h-4.5 text-[#9CA3AF] shrink-0" />
              {['ALL', 'Meeting Room', 'Hot Desk', 'Dedicated Desk', 'Executive Boardroom', 'Event Venue'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all duration-200 border ${
                    filterCategory === cat 
                      ? 'bg-[#84CC16] text-[#111111] border-[#84CC16] shadow-sm' 
                      : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {cat === 'ALL' ? 'Show All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table list */}
          {isWorkspacesLoading ? (
            <div className="p-16 text-center text-[#6B7280]">
              <div className="animate-spin w-8 h-8 border-4 border-[#84CC16] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-[13px] font-bold text-[#111827]">Retrieving dynamic workspaces...</p>
            </div>
          ) : (
            <Table columns={columns} data={workspaces} emptyMessage="No workspaces match your query criteria." />
          )}
        </>
      ) : (
        /* Visual Scheduler tab with integrated calendar */
        <div className="space-y-6">
          <div className="p-4 bg-[#A3E635]/15 text-[#65A30D] rounded-[12px] text-[12.5px] font-bold flex items-center space-x-2.5 border border-[#84CC16]/20">
            <CalendarCheck className="w-5 h-5 shrink-0 text-[#65A30D]" />
            <span>Interactive Visual Planner: click on any empty cell in Monthly, Weekly, or Gantt Resource timeline to instantly launch booking form.</span>
          </div>

          {isWorkspacesLoading || isBookingsLoading ? (
            <div className="p-16 text-center text-[#6B7280]">
              <div className="animate-spin w-8 h-8 border-4 border-[#84CC16] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-[13px] font-bold text-[#111827]">Generating visual timeline matrix...</p>
            </div>
          ) : (
            <BookingCalendar 
              bookings={bookings} 
              workspaces={workspaces} 
              onSelectTimeSlot={handleSelectCalendarTimeSlot}
            />
          )}
        </div>
      )}

      {/* Booking Form Modal */}
      <Modal 
        isOpen={!!selectedWorkspace} 
        onClose={() => setSelectedWorkspace(null)}
        title={bookingSuccess ? 'Booking Established' : 'Reserve Professional Workspace'}
      >
        {bookingSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-[#10B981] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="font-display font-bold text-[18px] text-[#111827]">Reservation Successful!</h3>
            <p className="text-[13px] text-[#6B7280]">
              Your workspace reservation has been confirmed. Redirecting to payment checkout...
            </p>
          </div>
        ) : selectedWorkspace ? (
          <div className="space-y-5">
            {bookingError && (
              <div className="p-3.5 bg-rose-50 text-[#EF4444] border border-rose-100 rounded-[10px] text-[12px] font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="p-5 bg-[#F8FAFC] rounded-[16px] space-y-3.5 border border-[#E5E7EB]">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display font-bold text-[15px] text-[#111827]">
                    {selectedWorkspace.title || selectedWorkspace.name}
                  </h4>
                  <p className="text-[10px] bg-[#A3E635]/15 text-[#65A30D] px-2 py-0.5 rounded-[4px] inline-block uppercase font-bold mt-1.5">
                    {selectedWorkspace.category || selectedWorkspace.workspaceType || 'Workspace'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Hourly Cost</p>
                  <p className="text-[14px] font-bold text-[#111827] font-mono mt-0.5">
                    {selectedWorkspace.currency || 'USD'} {Number(selectedWorkspace.hourlyPrice !== undefined ? selectedWorkspace.hourlyPrice : (selectedWorkspace.hourlyRate || 0)).toFixed(2)}/hr
                  </p>
                </div>
              </div>

              {Array.isArray(selectedWorkspace.amenities) && selectedWorkspace.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {selectedWorkspace.amenities.map((am: string) => (
                    <span key={am} className="text-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#4B5563] px-2.5 py-0.5 rounded-[6px] font-bold">
                      {am}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Plan selection dropdown */}
            {selectedWorkspace.billingPlans && selectedWorkspace.billingPlans.filter((p: any) => p.isActive).length > 0 && (
              <div className="flex flex-col space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Select Billing Plan / Membership</label>
                <select
                  value={selectedBillingPlanId}
                  onChange={(e) => {
                    setSelectedBillingPlanId(e.target.value);
                    setBookingError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-[10px] border text-[13px] font-bold outline-none bg-white border-[#E5E7EB] text-[#374151]"
                >
                  <option value="">Standard Hourly Rate ({selectedWorkspace.currency || 'USD'} {Number(selectedWorkspace.hourlyPrice || selectedWorkspace.hourlyRate || 0).toFixed(2)}/hr)</option>
                  {selectedWorkspace.billingPlans.filter((p: any) => p.isActive).map((p: any) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name} Membership - {p.currency} {p.price.toFixed(2)} {p.deposit ? `(+ ${p.deposit} Deposit)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <Input 
                label="Reservation Date" 
                type="date" 
                value={bookingDate} 
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full rounded-[10px] border-[#E5E7EB]"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Start Hour" 
                  type="time" 
                  value={bookingStart} 
                  onChange={(e) => setBookingStart(e.target.value)}
                  className="w-full rounded-[10px] border-[#E5E7EB]"
                />
                <Input 
                  label="End Hour" 
                  type="time" 
                  value={bookingEnd} 
                  onChange={(e) => setBookingEnd(e.target.value)}
                  className="w-full rounded-[10px] border-[#E5E7EB]"
                />
              </div>
              <Input 
                label="Utilization Purpose" 
                placeholder="e.g. Executive team sync..." 
                value={bookingPurpose} 
                onChange={(e) => setBookingPurpose(e.target.value)}
                className="w-full rounded-[10px] border-[#E5E7EB]"
              />
            </div>

            {/* Estimated Rates Display */}
            <div className="p-4 bg-[#F8FAFC] rounded-[14px] border border-[#E5E7EB] flex justify-between items-center text-[13px]">
              <span className="font-bold text-[#4B5563]">Estimated Total Rate</span>
              <span className="font-bold text-[#65A30D] font-mono text-[16px]">
                {selectedWorkspace.currency || 'USD'} {calculateEstimatedPrice().toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                variant="secondary" 
                onClick={() => setSelectedWorkspace(null)}
                className="text-[12px] font-bold border-[#E5E7EB] text-[#4B5563] px-4 py-2 rounded-[8px]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmBooking}
                isLoading={createBookingMutation.isPending}
                className="bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold text-[12px] px-5 py-2 rounded-[8px]"
              >
                Confirm Reservation
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Add / Edit Workspace Form Modal */}
      <Modal
        isOpen={workspaceFormOpen}
        onClose={() => setWorkspaceFormOpen(false)}
        title={editingWorkspace ? 'Edit Workspace Parameters' : 'Establish New Dynamic Workspace'}
      >
        <form onSubmit={handleSaveWorkspace} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3.5 bg-rose-50 text-[#EF4444] border border-rose-100 rounded-[10px] text-[12px] font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Workspace Title / Name" 
              placeholder="e.g. Tesla Boardroom" 
              value={wsTitle} 
              onChange={(e) => setWsTitle(e.target.value)}
              required
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />

            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Category</label>
              <select 
                value={wsCategory} 
                onChange={(e) => setWsCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-[13px] font-bold outline-none bg-white border-[#E5E7EB] text-[#374151]"
              >
                <option value="Meeting Room">Meeting Room</option>
                <option value="Hot Desk">Hot Desk</option>
                <option value="Dedicated Desk">Dedicated Desk</option>
                <option value="Executive Boardroom">Executive Boardroom</option>
                <option value="Event Venue">Event Venue</option>
                <option value="Creative Studio">Creative Studio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Workspace Type</label>
              <select 
                value={wsType} 
                onChange={(e) => setWsType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-[13px] font-bold outline-none bg-white border-[#E5E7EB] text-[#374151]"
              >
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="HOT_DESK">Hot Desk</option>
                <option value="EVENT_VENUE">Event Venue</option>
              </select>
            </div>

            <Input 
              label="Max Capacity (Pax)" 
              type="number" 
              value={wsCapacity} 
              onChange={(e) => setWsCapacity(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
          </div>

          <Input 
            label="Short Description" 
            placeholder="Brief summary shown on catalog cards..." 
            value={wsShortDescription} 
            onChange={(e) => setWsShortDescription(e.target.value)}
            className="w-full rounded-[10px] border-[#E5E7EB]"
          />

          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Full Description</label>
            <textarea
              rows={3}
              placeholder="Detailed space specifications, policies, guidelines..."
              value={wsFullDescription}
              onChange={(e) => setWsFullDescription(e.target.value)}
              className="w-full p-3 rounded-[10px] border text-[13px] border-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#84CC16]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input 
              label="Hourly Price" 
              type="number" 
              value={wsHourlyPrice} 
              onChange={(e) => setWsHourlyPrice(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
            <Input 
              label="Daily Price" 
              type="number" 
              value={wsDailyPrice} 
              onChange={(e) => setWsDailyPrice(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
            <Input 
              label="Weekly Price" 
              type="number" 
              value={wsWeeklyPrice} 
              onChange={(e) => setWsWeeklyPrice(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
            <Input 
              label="Monthly Price" 
              type="number" 
              value={wsMonthlyPrice} 
              onChange={(e) => setWsMonthlyPrice(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Floor Level" 
              placeholder="e.g. Floor 2" 
              value={wsFloor} 
              onChange={(e) => setWsFloor(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
            <Input 
              label="Size" 
              placeholder="e.g. 450 sqft" 
              value={wsSize} 
              onChange={(e) => setWsSize(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
            <Input 
              label="Display Order" 
              type="number" 
              value={wsDisplayOrder} 
              onChange={(e) => setWsDisplayOrder(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
          </div>

          <Input 
            label="Amenities (Comma Separated)" 
            placeholder="Whiteboard, High-speed WiFi, Webcam, Coffee"
            value={wsAmenitiesText} 
            onChange={(e) => setWsAmenitiesText(e.target.value)}
            className="w-full rounded-[10px] border-[#E5E7EB]"
          />

          <Input 
            label="Features (Comma Separated)" 
            placeholder="Ergonomic Chairs, Natural Lighting, City View"
            value={wsFeaturesText} 
            onChange={(e) => setWsFeaturesText(e.target.value)}
            className="w-full rounded-[10px] border-[#E5E7EB]"
          />

          {/* Local Image Upload / URL Area */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Cover Image (Photo)</label>
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[14px] p-4 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                dragActive 
                  ? "border-[#84CC16] bg-[#A3E635]/15" 
                  : wsCoverImage 
                    ? "border-emerald-200 bg-emerald-50/20" 
                    : "border-[#E5E7EB] hover:border-[#84CC16] bg-[#F9FAFB]"
              }`}
            >
              {wsCoverImage ? (
                <div className="relative w-full max-h-40 rounded-[10px] overflow-hidden group">
                  <img src={wsCoverImage} alt="Preview" className="w-full h-40 object-cover rounded-[10px]" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[10px]">
                    <button
                      type="button"
                      onClick={() => setWsCoverImage('')}
                      className="p-2 bg-[#EF4444] text-white rounded-full hover:bg-red-600 transition shadow-lg"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-2 bg-[#A3E635]/15 rounded-full text-[#65A30D] mb-2">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-[12px] font-bold text-[#111827]">
                    Click to upload photo <span className="text-[#65A30D] font-medium">or drag & drop</span>
                  </p>
                </label>
              )}
            </div>
            <Input 
              placeholder="Or paste image URL (https://...)" 
              value={wsCoverImage} 
              onChange={(e) => setWsCoverImage(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB] text-xs"
            />
          </div>

          <Input 
            label="Gallery Images (Comma Separated URLs)" 
            placeholder="https://img1.jpg, https://img2.jpg"
            value={wsGalleryText} 
            onChange={(e) => setWsGalleryText(e.target.value)}
            className="w-full rounded-[10px] border-[#E5E7EB]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Publishing Status</label>
              <select 
                value={wsStatus} 
                onChange={(e) => setWsStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-[13px] font-bold outline-none bg-white border-[#E5E7EB] text-[#374151]"
              >
                <option value="published">Published (Visible on Marketplace)</option>
                <option value="draft">Draft (Admin Only)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Operational State</label>
              <select 
                value={wsAvailability} 
                onChange={(e) => setWsAvailability(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-[13px] font-bold outline-none bg-white border-[#E5E7EB] text-[#374151]"
              >
                <option value="Available">Available for Reservation</option>
                <option value="Occupied">Occupied / In Use</option>
                <option value="Maintenance">Under Maintenance</option>
                <option value="Reserved">Reserved</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 pt-2">
            <input 
              type="checkbox" 
              id="wsFeatured"
              checked={wsFeatured} 
              onChange={(e) => setWsFeatured(e.target.checked)}
              className="w-4 h-4 text-[#84CC16] rounded border-[#E5E7EB] focus:ring-[#84CC16] cursor-pointer"
            />
            <label htmlFor="wsFeatured" className="text-[12.5px] font-semibold text-[#4B5563] cursor-pointer">
              Feature on Marketplace top section
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button 
              variant="secondary" 
              type="button" 
              onClick={() => setWorkspaceFormOpen(false)}
              className="text-[12px] font-bold border-[#E5E7EB] text-[#4B5563] px-4 py-2 rounded-[8px]"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              isLoading={createWorkspaceMutation.isPending || updateWorkspaceMutation.isPending}
              className="bg-[#84CC16] hover:bg-[#65A30D] text-[#111111] font-bold text-[12px] px-5 py-2 rounded-[8px]"
            >
              {editingWorkspace ? 'Save Changes' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
