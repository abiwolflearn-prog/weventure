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
  Image
} from 'lucide-react';
import { useAppSelector } from '../store';
import { workspaceApi, IWorkspacePayload } from '../lib/workspaceApi';
import { bookingApi } from '../lib/bookingApi';
import { UserRole } from '../types';
import { Table, IColumn } from '../components/Table';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { BookingCalendar } from '../components/workspaces/BookingCalendar';

interface WorkspaceItem {
  id: string;
  name: string;
  type: 'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE';
  capacity: number;
  hourlyRate: number;
  currency: string;
  amenities: string[];
  isAvailable: boolean;
  bufferTime: number;
  imageUrl?: string;
  availabilityRules: {
    startHour: number;
    endHour: number;
    allowedDays: number[];
  };
  billingPlans?: any[];
}

export default function WorkspaceList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  // Layout screen tabs
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'PLANNER'>('CATALOG');

  // Search and filter states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal control states
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceItem | null>(null);
  const [workspaceFormOpen, setWorkspaceFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceItem | null>(null);

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

  // New / Edit Workspace form states
  const [wsName, setWsName] = useState('');
  const [wsType, setWsType] = useState<'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE'>('MEETING_ROOM');
  const [wsCapacity, setWsCapacity] = useState('8');
  const [wsHourlyRate, setWsHourlyRate] = useState('35');
  const [wsBufferTime, setWsBufferTime] = useState('15');
  const [wsAmenitiesText, setWsAmenitiesText] = useState('Whiteboard, Webcam, High-speed WiFi');
  const [wsStartHour, setWsStartHour] = useState('8');
  const [wsEndHour, setWsEndHour] = useState('20');
  const [wsIsAvailable, setWsIsAvailable] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [wsImageUrl, setWsImageUrl] = useState('');
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
      setWsImageUrl(reader.result as string);
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
    queryKey: ['workspaces', search, filterType],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (filterType !== 'ALL') params.type = filterType;
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

  const workspaces: WorkspaceItem[] = workspacesResponse?.data || [];
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
      const currency = selectedPlanObj ? (selectedPlanObj.currency || 'ETB') : 'ETB';
      
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
              title: selectedWorkspace?.name || 'Workspace Reservation',
              description: selectedPlanObj 
                ? `${selectedPlanObj.name} Coworking Plan for ${selectedWorkspace?.name}` 
                : `Hourly reservation for ${selectedWorkspace?.name}`
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
      spaceId: selectedWorkspace.id,
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
    if (!wsName.trim()) {
      setFormError('Workspace Name is required');
      return;
    }

    const payload: IWorkspacePayload = {
      name: wsName.trim(),
      type: wsType,
      capacity: Number(wsCapacity),
      hourlyRate: Number(wsHourlyRate),
      currency: 'USD',
      amenities: wsAmenitiesText.split(',').map(s => s.trim()).filter(Boolean),
      isAvailable: wsIsAvailable,
      bufferTime: Number(wsBufferTime),
      imageUrl: wsImageUrl || undefined,
      availabilityRules: {
        startHour: Number(wsStartHour),
        endHour: Number(wsEndHour),
        allowedDays: [1, 2, 3, 4, 5], // default Mon-Fri
      },
      billingPlans: wsBillingPlans,
    };

    if (editingWorkspace) {
      updateWorkspaceMutation.mutate({ id: editingWorkspace.id, payload });
    } else {
      createWorkspaceMutation.mutate(payload);
    }
  };

  const handleEditWorkspaceClick = (space: WorkspaceItem) => {
    setEditingWorkspace(space);
    setWsName(space.name);
    setWsType(space.type);
    setWsCapacity(space.capacity.toString());
    setWsHourlyRate(space.hourlyRate.toString());
    setWsBufferTime(space.bufferTime.toString());
    setWsAmenitiesText(space.amenities.join(', '));
    setWsStartHour(space.availabilityRules?.startHour?.toString() || '8');
    setWsEndHour(space.availabilityRules?.endHour?.toString() || '20');
    setWsIsAvailable(space.isAvailable);
    setWsImageUrl(space.imageUrl || '');
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
    setWsName('');
    setWsType('MEETING_ROOM');
    setWsCapacity('8');
    setWsHourlyRate('35');
    setWsBufferTime('15');
    setWsAmenitiesText('Whiteboard, Webcam, High-speed WiFi');
    setWsStartHour('8');
    setWsEndHour('20');
    setWsIsAvailable(true);
    setWsImageUrl('');
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

    // If a specific workspace was filtered in visual, pre-select it!
    if (filterType !== 'ALL') {
      const spaceObj = workspaces.find(w => w.type === filterType);
      if (spaceObj) {
        handleOpenBookingModal(spaceObj);
        return;
      }
    }
    // Otherwise open modal with first available
    if (workspaces.length > 0) {
      handleOpenBookingModal(workspaces[0]);
    }
  };

  const handleOpenBookingModal = (row: WorkspaceItem) => {
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
      return Math.max(0, Math.round(hours * selectedWorkspace.hourlyRate * 100) / 100);
    } catch {
      return 0;
    }
  };

  // Columns definition for the table
  const columns: IColumn<WorkspaceItem>[] = [
    {
      header: 'Space Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3.5">
          {row.imageUrl ? (
            <div className="w-10 h-10 rounded-[10px] overflow-hidden border border-gray-100 flex-shrink-0">
              <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="p-2.5 bg-[#A3E635]/15 rounded-[10px] text-[#65A30D] flex-shrink-0">
              <Building className="w-4.5 h-4.5" />
            </div>
          )}
          <div>
            <p className="font-bold text-[#111827] text-[14px]">{row.name}</p>
            <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mt-0.5">ID: {row.id.substring(0, 8)}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Space Type', 
      accessor: 'type',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${
          row.type === 'MEETING_ROOM'
            ? 'bg-[#A3E635]/15 text-[#65A30D]'
            : row.type === 'EVENT_VENUE'
            ? 'bg-[#F5F3FF] text-[#7C3AED]'
            : 'bg-[#FFF7ED] text-[#EA580C]'
        }`}>
          {row.type.replace('_', ' ')}
        </span>
      )
    },
    { 
      header: 'Capacity', 
      accessor: 'capacity', 
      render: (row) => (
        <span className="text-[13px] font-bold text-[#4B5563]">
          Up to {row.capacity} pax
        </span>
      )
    },
    { 
      header: 'Hourly Rate', 
      accessor: 'hourlyRate', 
      render: (row) => (
        <span className="text-[13px] font-bold text-[#111827] font-mono">
          {row.currency} {row.hourlyRate.toFixed(2)} / hr
        </span>
      )
    },
    {
      header: 'Membership Plans',
      accessor: 'billingPlans' as any,
      render: (row) => {
        const activePlans = row.billingPlans?.filter((p: any) => p.isActive) || [];
        if (activePlans.length === 0) {
          return <span className="text-[11px] text-[#9CA3AF] italic">Hourly Only</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[180px]">
            {activePlans.map((p: any) => (
              <span key={p.id || p._id} className="text-[9px] bg-[#EEF2F6] text-[#4B5563] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                {p.name}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Operational Status',
      accessor: 'isAvailable',
      render: (row) => (
        <span className={`inline-flex items-center space-x-1.5 text-[12px] font-bold ${row.isAvailable ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {row.isAvailable ? <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> : <XCircle className="w-4 h-4 text-[#EF4444]" />}
          <span>{row.isAvailable ? 'Available' : 'Occupied'}</span>
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            disabled={!row.isAvailable}
            onClick={() => {
              handleOpenBookingModal(row);
            }}
            className="bg-[#84CC16] hover:bg-[#65A30D] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] text-[#111111] font-bold text-[12px] h-[34px] px-3.5 rounded-[6px]"
          >
            Book Space
          </Button>

          {isAdminOrStaff && (
            <>
              <button 
                onClick={() => handleEditWorkspaceClick(row)}
                className="p-2 border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 hover:text-[#65A30D] text-[#4B5563] bg-white transition-colors"
                title="Edit space properties"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteWorkspaceClick(row.id)}
                className="p-2 border border-[#E5E7EB] rounded-[8px] hover:bg-rose-50 hover:text-[#EF4444] text-[#4B5563] bg-white transition-colors"
                title="Decommission workspace"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-[24px] text-[#111827] tracking-tight">Workspace Resource Directory</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">Reserve private boardrooms, hot desks, or lecture spaces instantly with real-time billing.</p>
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
                placeholder="Search workspaces..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-[10px] border-[#E5E7EB]"
              />
              <Search className="absolute left-3.5 bottom-3.5 text-[#9CA3AF] w-4.5 h-4.5 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 self-start w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <SlidersHorizontal className="w-4.5 h-4.5 text-[#9CA3AF] shrink-0" />
              {['ALL', 'MEETING_ROOM', 'HOT_DESK', 'EVENT_VENUE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all duration-200 border ${
                    filterType === type 
                      ? 'bg-[#84CC16] text-[#111111] border-[#84CC16] shadow-sm' 
                      : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {type === 'ALL' ? 'Show All' : type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table list */}
          {isWorkspacesLoading ? (
            <div className="p-16 text-center text-[#6B7280]">
              <div className="animate-spin w-8 h-8 border-4 border-[#84CC16] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-[13px] font-bold text-[#111827]">Retrieving workspace resources...</p>
            </div>
          ) : (
            <Table columns={columns} data={workspaces} emptyMessage="No workspaces matches your query criteria." />
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
              {selectedWorkspace?.type === 'HOT_DESK'
                ? 'Your hot desk booking has been automatically confirmed!'
                : 'Your booking has been received and is pending operator review.'}
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
                    {selectedWorkspace.name}
                  </h4>
                  <p className="text-[10px] bg-[#A3E635]/15 text-[#65A30D] px-2 py-0.5 rounded-[4px] inline-block uppercase font-bold mt-1.5">
                    {selectedWorkspace.type.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Hourly Cost</p>
                  <p className="text-[14px] font-bold text-[#111827] font-mono mt-0.5">
                    {selectedWorkspace.currency} {selectedWorkspace.hourlyRate.toFixed(2)}/hr
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {selectedWorkspace.amenities.map((am) => (
                  <span key={am} className="text-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#4B5563] px-2.5 py-0.5 rounded-[6px] font-bold">
                    {am}
                  </span>
                ))}
              </div>

              <div className="border-t border-dashed border-[#E2E8F0] pt-3 mt-1.5 flex justify-between text-[11px] font-bold text-[#6B7280]">
                <span>Buffer Period: {selectedWorkspace.bufferTime} mins</span>
                <span>Hours Allowed: {selectedWorkspace.availabilityRules?.startHour}:00 - {selectedWorkspace.availabilityRules?.endHour}:00</span>
              </div>
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
                  <option value="">Standard Hourly Rate (USD {selectedWorkspace.hourlyRate.toFixed(2)}/hr)</option>
                  {selectedWorkspace.billingPlans.filter((p: any) => p.isActive).map((p: any) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name} Membership - {p.currency} {p.price.toFixed(2)} {p.deposit ? `(+ ${p.deposit} Deposit)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form Fields: Conditional based on plan selection */}
            {selectedBillingPlanId === '' ? (
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
                  placeholder="e.g. Stakeholders sync, deep work..." 
                  value={bookingPurpose} 
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  className="w-full rounded-[10px] border-[#E5E7EB]"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Input 
                  label="Membership Start Date" 
                  type="date" 
                  value={bookingDate} 
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-[10px] border-[#E5E7EB]"
                />
                <Input 
                  label="Workspace Utilization Notes" 
                  placeholder="e.g. Specialized team access, corporate membership..." 
                  value={bookingPurpose} 
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  className="w-full rounded-[10px] border-[#E5E7EB]"
                />

                {/* Emergency Contact details form */}
                <div className="border border-gray-200 rounded-xl p-4.5 space-y-3 bg-[#FAFAFA]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">Emergency Contact (Required)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Contact Name" 
                      placeholder="e.g. Martha Kebede" 
                      value={emergencyName} 
                      onChange={e => setEmergencyName(e.target.value)} 
                      className="rounded-[8px] border-[#E5E7EB] bg-white text-xs"
                    />
                    <Input 
                      label="Relationship" 
                      placeholder="e.g. Spouse" 
                      value={emergencyRelationship} 
                      onChange={e => setEmergencyRelationship(e.target.value)} 
                      className="rounded-[8px] border-[#E5E7EB] bg-white text-xs"
                    />
                  </div>
                  <Input 
                    label="Emergency Phone" 
                    placeholder="e.g. +251-911-000000" 
                    value={emergencyPhone} 
                    onChange={e => setEmergencyPhone(e.target.value)} 
                    className="rounded-[8px] border-[#E5E7EB] bg-white text-xs"
                  />
                </div>

                {/* Billing compliance form */}
                <div className="border border-gray-200 rounded-xl p-4.5 space-y-3 bg-[#FAFAFA]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">Billing Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Billing Contact Name" 
                      value={billingContactName} 
                      onChange={e => setBillingContactName(e.target.value)} 
                      className="rounded-[8px] border-[#E5E7EB] bg-white text-xs"
                    />
                    <Input 
                      label="Billing Email" 
                      value={billingContactEmail} 
                      onChange={e => setBillingContactEmail(e.target.value)} 
                      className="rounded-[8px] border-[#E5E7EB] bg-white text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Company Name" 
                      placeholder="Optional" 
                      value={billingCompany} 
                      onChange={e => setBillingCompany(e.target.value)} 
                      className="rounded-[8px] border-[#E5E7EB] bg-white text-xs"
                    />
                    <Input 
                      label="Billing Address" 
                      placeholder="Optional" 
                      value={billingAddress} 
                      onChange={e => setBillingAddress(e.target.value)} 
                      className="rounded-[8px] border-[#E5E7EB] bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Agreement builder visual and electronic signature input */}
                <div className="border border-gray-200 rounded-xl p-4.5 space-y-3.5 bg-white shadow-xs">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#111827]">WeVentureHub Coworking Agreement</h4>
                  <div className="border border-[#E2E8F0] rounded-[10px] p-3 bg-slate-50 max-h-36 overflow-y-auto text-[11px] text-[#4B5563] font-sans leading-relaxed whitespace-pre-wrap select-none">
                    {(() => {
                      const plan = selectedWorkspace.billingPlans?.find((p: any) => p.id === selectedBillingPlanId || p._id === selectedBillingPlanId);
                      if (!plan) return '';
                      let template = plan.agreementTemplate || '';
                      template = template.replace(/{member_name}/g, user ? `${user.firstName} ${user.lastName}` : 'The Member');
                      template = template.replace(/{workspace_name}/g, selectedWorkspace.name);
                      template = template.replace(/{price}/g, `${plan.price} ${plan.currency}`);
                      template = template.replace(/{start_date}/g, bookingDate);
                      return template;
                    })()}
                  </div>

                  <Input
                    label="Electronic Signature (Type Full Name to Sign)"
                    placeholder="Abel Bimrew"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="rounded-[8px] border-[#E5E7EB]"
                  />
                </div>
              </div>
            )}

            {/* Estimated Rates Display */}
            {selectedBillingPlanId === '' ? (
              <div className="p-4 bg-[#F8FAFC] rounded-[14px] border border-[#E5E7EB] flex justify-between items-center text-[13px]">
                <span className="font-bold text-[#4B5563]">Estimated Total Rate</span>
                <span className="font-bold text-[#65A30D] font-mono text-[16px]">
                  USD {calculateEstimatedPrice().toFixed(2)}
                </span>
              </div>
            ) : (
              (() => {
                const plan = selectedWorkspace.billingPlans?.find((p: any) => p.id === selectedBillingPlanId || p._id === selectedBillingPlanId);
                if (!plan) return null;
                const grand = plan.price + (plan.deposit || 0);
                return (
                  <div className="p-4 bg-[#F8FAFC] rounded-[14px] border border-[#E5E7EB] space-y-2 text-[12px]">
                    <div className="flex justify-between text-[#4B5563]">
                      <span>Subscription Charge:</span>
                      <span className="font-bold text-gray-900 font-mono">{plan.price.toFixed(2)} {plan.currency}</span>
                    </div>
                    {plan.deposit && (
                      <div className="flex justify-between text-[#4B5563]">
                        <span>Refundable Security Deposit:</span>
                        <span className="font-bold text-gray-900 font-mono">{plan.deposit.toFixed(2)} {plan.currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[13px] border-t border-dashed border-[#E5E7EB] pt-2 font-bold mt-1">
                      <span className="text-gray-900">Total Upfront Amount</span>
                      <span className="font-bold text-[#65A30D] font-mono text-[16px]">{grand.toFixed(2)} {plan.currency}</span>
                    </div>
                  </div>
                );
              })()
            )}

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
        title={editingWorkspace ? 'Update Workspace Parameters' : 'Establish New Workspace Resource'}
      >
        <form onSubmit={handleSaveWorkspace} className="space-y-5">
          {formError && (
            <div className="p-3.5 bg-rose-50 text-[#EF4444] border border-rose-100 rounded-[10px] text-[12px] font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Workspace Name" 
              placeholder="e.g. Tesla Boardroom" 
              value={wsName} 
              onChange={(e) => setWsName(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Space Type</label>
              <select 
                value={wsType} 
                onChange={(e) => setWsType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-[13px] font-bold outline-none bg-white border-[#E5E7EB] text-[#374151]"
              >
                <option value="HOT_DESK">Hot Desk</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EVENT_VENUE">Event Venue</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Max Capacity (Pax)" 
              type="number" 
              value={wsCapacity} 
              onChange={(e) => setWsCapacity(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
            <Input 
              label="Hourly Rate (USD)" 
              type="number" 
              value={wsHourlyRate} 
              onChange={(e) => setWsHourlyRate(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
            <Input 
              label="Buffer Time (Minutes)" 
              type="number" 
              value={wsBufferTime} 
              onChange={(e) => setWsBufferTime(e.target.value)}
              helperText="Gap between successive bookings"
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
          </div>

          <Input 
            label="Amenities (Comma Separated)" 
            value={wsAmenitiesText} 
            onChange={(e) => setWsAmenitiesText(e.target.value)}
            className="w-full rounded-[10px] border-[#E5E7EB]"
          />

          {/* Local Image Upload Area */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Local Workspace Photo</label>
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[14px] p-5 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                dragActive 
                  ? "border-[#84CC16] bg-[#A3E635]/15" 
                  : wsImageUrl 
                    ? "border-emerald-200 bg-emerald-50/20" 
                    : "border-[#E5E7EB] hover:border-[#84CC16] bg-[#F9FAFB]"
              }`}
            >
              {wsImageUrl ? (
                <div className="relative w-full max-h-48 rounded-[10px] overflow-hidden group">
                  <img src={wsImageUrl} alt="Preview" className="w-full h-48 object-cover rounded-[10px]" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[10px]">
                    <button
                      type="button"
                      onClick={() => setWsImageUrl('')}
                      className="p-2 bg-[#EF4444] text-white rounded-full hover:bg-red-600 transition shadow-lg animate-fade-in"
                      title="Remove Image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-3 bg-[#A3E635]/15 rounded-full text-[#65A30D] mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-[13px] font-bold text-[#111827]">
                    Click to upload a local photo <span className="text-[#65A30D] font-medium">or drag & drop here</span>
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Accepts PNG, JPG, JPEG, WEBP. Max file size: 5MB
                  </p>
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Availability Start Hour" 
              type="number" 
              min="0" 
              max="23"
              value={wsStartHour} 
              onChange={(e) => setWsStartHour(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
            <Input 
              label="Availability End Hour" 
              type="number" 
              min="1" 
              max="24"
              value={wsEndHour} 
              onChange={(e) => setWsEndHour(e.target.value)}
              className="w-full rounded-[10px] border-[#E5E7EB]"
            />
          </div>

          {/* Custom Billing / Membership Plans Editor */}
          <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Membership / Coworking Billing Plans</h3>
              <p className="text-[11.5px] text-[#6B7280]">Admins can enable multiple custom recurring plans for this workspace resource.</p>
            </div>

            {/* List of current plans */}
            {wsBillingPlans.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {wsBillingPlans.map((plan: any) => (
                  <div key={plan.id || plan._id} className="p-3 bg-white border border-[#E5E7EB] rounded-lg flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#111827] uppercase tracking-wider">{plan.name}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${plan.isActive ? 'bg-[#A3E635]/15 text-[#65A30D]' : 'bg-red-50 text-red-500'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-500 font-mono">
                        {plan.currency} {plan.price.toFixed(2)} {plan.deposit ? `(+ ${plan.deposit} Deposit)` : ''} | Due Day: {plan.paymentDueDay}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePlanActive(plan.id || plan._id)}
                        className="px-2 py-1 text-[10px] font-bold border border-[#E2E8F0] hover:bg-gray-50 rounded-md transition-colors"
                      >
                        Toggle Status
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePlan(plan.id || plan._id)}
                        className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11.5px] text-[#9CA3AF] italic text-center py-2">No custom membership plans configured. Defaults to Hourly Booking only.</p>
            )}

            {/* Form to add a plan */}
            <div className="border-t border-dashed border-[#E2E8F0] pt-4 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">Configure New Plan Option</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Plan Frequency</label>
                  <select
                    value={newPlanName}
                    onChange={(e) => handlePlanNameChange(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-[8px] border text-xs font-semibold outline-none bg-white border-[#E5E7EB] text-[#374151]"
                  >
                    <option value="Daily">Daily Pass</option>
                    <option value="Weekly">Weekly Pass</option>
                    <option value="Monthly">Monthly Membership</option>
                    <option value="Quarterly">Quarterly Membership</option>
                    <option value="Yearly">Yearly Membership</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Price"
                    type="number"
                    value={newPlanPrice}
                    onChange={e => setNewPlanPrice(e.target.value)}
                    className="rounded-[8px] text-xs bg-white border-[#E5E7EB]"
                  />
                  <Input
                    label="Currency"
                    value={newPlanCurrency}
                    onChange={e => setNewPlanCurrency(e.target.value)}
                    className="rounded-[8px] text-xs bg-white border-[#E5E7EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Refundable Deposit"
                  placeholder="Optional"
                  type="number"
                  value={newPlanDeposit}
                  onChange={e => setNewPlanDeposit(e.target.value)}
                  className="rounded-[8px] text-xs bg-white border-[#E5E7EB]"
                />
                <Input
                  label="Recurring Due Day"
                  type="number"
                  min="1"
                  max="31"
                  value={newPlanDueDay}
                  onChange={e => setNewPlanDueDay(e.target.value)}
                  className="rounded-[8px] text-xs bg-white border-[#E5E7EB]"
                  helperText="Day of month when invoice triggers"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Custom Coworking Agreement Template</label>
                <textarea
                  value={newPlanAgreement}
                  onChange={e => setNewPlanAgreement(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-[8px] border text-xs font-sans border-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#84CC16]"
                  placeholder="Insert agreement terms. Dynamic tokens: {member_name}, {workspace_name}, {price}, {start_date}"
                />
              </div>

              <Button
                type="button"
                onClick={handleAddPlan}
                className="w-full bg-[#FAFAFA] border border-[#E2E8F0] hover:bg-gray-100 text-[#4B5563] font-bold text-[11px] h-[34px] rounded-[8px]"
              >
                + Append Membership Plan
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 pt-2">
            <input 
              type="checkbox" 
              id="wsIsAvailable"
              checked={wsIsAvailable} 
              onChange={(e) => setWsIsAvailable(e.target.checked)}
              className="w-4.5 h-4.5 text-[#84CC16] rounded-[4px] border-[#E5E7EB] focus:ring-[#84CC16] cursor-pointer"
            />
            <label htmlFor="wsIsAvailable" className="text-[12.5px] font-semibold text-[#4B5563] cursor-pointer">
              Mark space as active and reservable immediately
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
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
