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
  Briefcase
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
  availabilityRules: {
    startHour: number;
    endHour: number;
    allowedDays: number[];
  };
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
    mutationFn: async (payload: { spaceId: string; startTime: string; endTime: string; purpose: string }) => {
      return await bookingApi.createBooking(payload);
    },
    onSuccess: (data) => {
      setBookingSuccess(true);
      setBookingError(null);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      
      const price = selectedWorkspace ? selectedWorkspace.pricePerHour * 4 : 250; // booking estimate
      
      setTimeout(() => {
        setSelectedWorkspace(null);
        setBookingSuccess(false);
        if (price > 0) {
          navigate('/dashboard/checkout', {
            state: {
              targetType: 'BOOKING',
              targetId: data?.id || 'BOOKING-123',
              amount: price,
              currency: 'ETB',
              title: selectedWorkspace?.name || 'Workspace Reservation',
              description: `Workspace hours reservation for ${selectedWorkspace?.name || 'hub room'}`
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

    createBookingMutation.mutate({
      spaceId: selectedWorkspace.id,
      startTime: startIso,
      endTime: endIso,
      purpose: bookingPurpose,
    });
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
      availabilityRules: {
        startHour: Number(wsStartHour),
        endHour: Number(wsEndHour),
        allowedDays: [1, 2, 3, 4, 5], // default Mon-Fri
      }
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
    setFormError(null);
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
        setSelectedWorkspace(spaceObj);
        return;
      }
    }
    // Otherwise open modal with first available
    if (workspaces.length > 0) {
      setSelectedWorkspace(workspaces[0]);
    }
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
          <div className="p-2.5 bg-[#EFF6FF] rounded-[10px] text-[#2563EB]">
            <Building className="w-4.5 h-4.5" />
          </div>
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
            ? 'bg-[#EFF6FF] text-[#2563EB]'
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
              setSelectedWorkspace(row);
              setBookingError(null);
            }}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] text-white font-bold text-[12px] h-[34px] px-3.5 rounded-[6px]"
          >
            Book Space
          </Button>

          {isAdminOrStaff && (
            <>
              <button 
                onClick={() => handleEditWorkspaceClick(row)}
                className="p-2 border border-[#E5E7EB] rounded-[8px] hover:bg-gray-50 hover:text-[#2563EB] text-[#4B5563] bg-white transition-colors"
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
              className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] h-[36px] rounded-[8px]"
            >
              <Plus className="w-4 h-4 text-white" />
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
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm' 
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
              <div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-[13px] font-bold text-[#111827]">Retrieving workspace resources...</p>
            </div>
          ) : (
            <Table columns={columns} data={workspaces} emptyMessage="No workspaces matches your query criteria." />
          )}
        </>
      ) : (
        /* Visual Scheduler tab with integrated calendar */
        <div className="space-y-6">
          <div className="p-4 bg-[#EFF6FF] text-[#1E40AF] rounded-[12px] text-[12.5px] font-bold flex items-center space-x-2.5 border border-[#DBEAFE]">
            <CalendarCheck className="w-5 h-5 shrink-0 text-[#2563EB]" />
            <span>Interactive Visual Planner: click on any empty cell in Monthly, Weekly, or Gantt Resource timeline to instantly launch booking form.</span>
          </div>

          {isWorkspacesLoading || isBookingsLoading ? (
            <div className="p-16 text-center text-[#6B7280]">
              <div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full mx-auto mb-4" />
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
                  <p className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-[4px] inline-block uppercase font-bold mt-1.5">
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
                placeholder="e.g. Stakeholders Q2 reviews sync, deep work..." 
                value={bookingPurpose} 
                onChange={(e) => setBookingPurpose(e.target.value)}
                className="w-full rounded-[10px] border-[#E5E7EB]"
              />
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-[14px] border border-[#E5E7EB] flex justify-between items-center text-[13px]">
              <span className="font-bold text-[#4B5563]">Estimated Total Rate</span>
              <span className="font-bold text-[#2563EB] font-mono text-[16px]">
                USD {calculateEstimatedPrice().toFixed(2)}
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
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-5 py-2 rounded-[8px]"
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

          <div className="flex items-center space-x-2.5 pt-2">
            <input 
              type="checkbox" 
              id="wsIsAvailable"
              checked={wsIsAvailable} 
              onChange={(e) => setWsIsAvailable(e.target.checked)}
              className="w-4.5 h-4.5 text-[#2563EB] rounded-[4px] border-[#E5E7EB] focus:ring-[#2563EB] cursor-pointer"
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
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[12px] px-5 py-2 rounded-[8px]"
            >
              {editingWorkspace ? 'Save Changes' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
