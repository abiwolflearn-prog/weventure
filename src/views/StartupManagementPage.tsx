import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Rocket,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit3,
  Eye,
  FileText,
  Building2,
  Calendar,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { startupApi, StartupApplicationItem, StartupProgramItem } from '../lib/startupApi';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export default function StartupManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'applications' | 'programs'>('applications');

  // Filter and search states for applications
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Application for Details Modal
  const [selectedApp, setSelectedApp] = useState<StartupApplicationItem | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState<string>('pending');

  // Program Modal state (Create/Edit)
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<StartupProgramItem | null>(null);
  const [programForm, setProgramForm] = useState<Partial<StartupProgramItem>>({
    title: '',
    category: 'Incubation',
    shortDescription: '',
    fullDescription: '',
    duration: '12 Weeks',
    cohortSize: 15,
    icon: 'Rocket',
    benefits: ['Workspace Access', 'Mentor Hours', 'Demo Day Entry'],
    eligibility: 'Open for tech founders',
    status: 'active',
  });

  // Queries
  const { data: applications, isLoading: isAppsLoading } = useQuery({
    queryKey: ['startupApplications', statusFilter, searchQuery],
    queryFn: () => startupApi.getAllApplications({ status: statusFilter, search: searchQuery }),
  });

  const { data: programs, isLoading: isProgramsLoading } = useQuery({
    queryKey: ['adminStartupPrograms'],
    queryFn: startupApi.getPrograms,
  });

  // Application Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; reviewNotes?: string } }) =>
      startupApi.updateApplicationStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startupApplications'] });
      if (selectedApp) {
        setSelectedApp(null);
      }
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: startupApi.deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startupApplications'] });
    },
  });

  // Program Mutations
  const saveProgramMutation = useMutation({
    mutationFn: (data: Partial<StartupProgramItem>) => {
      if (editingProgram?.id) {
        return startupApi.updateProgram(editingProgram.id, data);
      }
      return startupApi.createProgram(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStartupPrograms'] });
      queryClient.invalidateQueries({ queryKey: ['startupPrograms'] });
      setIsProgramModalOpen(false);
      setEditingProgram(null);
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: startupApi.deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStartupPrograms'] });
      queryClient.invalidateQueries({ queryKey: ['startupPrograms'] });
    },
  });

  const handleOpenProgramModal = (prog?: StartupProgramItem) => {
    if (prog) {
      setEditingProgram(prog);
      setProgramForm(prog);
    } else {
      setEditingProgram(null);
      setProgramForm({
        title: '',
        category: 'Incubation',
        shortDescription: '',
        fullDescription: '',
        duration: '12 Weeks',
        cohortSize: 15,
        icon: 'Rocket',
        benefits: ['Workspace Access', 'Mentor Hours', 'Demo Day Entry'],
        eligibility: 'Open for tech founders',
        status: 'active',
      });
    }
    setIsProgramModalOpen(true);
  };

  const handleOpenAppDetails = (app: StartupApplicationItem) => {
    setSelectedApp(app);
    setStatusInput(app.status);
    setReviewNotesInput(app.reviewNotes || '');
  };

  const handleSaveAppReview = () => {
    if (!selectedApp) return;
    updateStatusMutation.mutate({
      id: selectedApp.id,
      payload: { status: statusInput, reviewNotes: reviewNotesInput },
    });
  };

  const handleExportCsv = () => {
    if (!applications || applications.length === 0) return;
    const headers = ['Startup Name', 'Founder', 'Email', 'Phone', 'Industry', 'Stage', 'Team Size', 'Status', 'Date'];
    const rows = applications.map((a) => [
      `"${a.startupName.replace(/"/g, '""')}"`,
      `"${a.founderName.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${a.industry}"`,
      `"${a.startupStage}"`,
      `"${a.teamSize}"`,
      `"${a.status}"`,
      `"${new Date(a.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `startup_applications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPIs
  const totalApps = applications?.length || 0;
  const pendingApps = applications?.filter((a) => a.status === 'pending').length || 0;
  const approvedApps = applications?.filter((a) => a.status === 'approved').length || 0;
  const totalPrograms = programs?.length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Approved</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      case 'interview_scheduled':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-purple-100 text-purple-800 border border-purple-300">Interview</span>;
      case 'under_review':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-blue-100 text-blue-800 border border-blue-300">Reviewing</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-300">Pending</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-sm min-h-screen text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Rocket className="w-6 h-6 text-brand-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Startup Program & Applications Management</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Review founder applications, manage startup cohorts, and update innovation program tracks for WeVentureHub.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'applications' && (
            <Button variant="secondary" onClick={handleExportCsv} className="text-xs font-bold py-2 px-3.5 border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
            </Button>
          )}
          {activeTab === 'programs' && (
            <Button variant="success" onClick={() => handleOpenProgramModal()} className="text-xs font-extrabold py-2 px-4 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" /> Create Program
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Applications</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalApps}</div>
          </div>
          <div className="p-3 bg-blue-100 border border-blue-200 rounded-xl text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Pending Intake</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingApps}</div>
          </div>
          <div className="p-3 bg-amber-100 border border-amber-200 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Approved Startups</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{approvedApps}</div>
          </div>
          <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Programs</div>
            <div className="text-2xl font-extrabold text-purple-600 mt-1">{totalPrograms}</div>
          </div>
          <div className="p-3 bg-purple-100 border border-purple-200 rounded-xl text-purple-600">
            <Rocket className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'applications'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Startup Applications ({totalApps})
        </button>
        <button
          onClick={() => setActiveTab('programs')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'programs'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Program Tracks ({totalPrograms})
        </button>
      </div>

      {/* TAB 1: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search startup or founder name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl text-xs pl-10 pr-4 py-2.5 focus:border-brand-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <span className="text-xs text-slate-600 font-medium whitespace-nowrap">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-xs font-medium rounded-xl px-3 py-2 focus:border-brand-primary focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {isAppsLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading applications...</div>
            ) : !applications || applications.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-medium">No startup applications found matching your filter criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold bg-slate-50">
                      <th className="p-4">Startup & Founder</th>
                      <th className="p-4">Track / Program</th>
                      <th className="p-4">Industry & Stage</th>
                      <th className="p-4">Team</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Applied Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-sm">{app.startupName}</div>
                          <div className="text-[11px] text-slate-500">{app.founderName} ({app.email})</div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-brand-primary">
                          {app.programTitle || 'General Incubation'}
                        </td>
                        <td className="p-4">
                          <div className="text-slate-900 font-medium">{app.industry}</div>
                          <div className="text-[10px] text-slate-500">{app.startupStage}</div>
                        </td>
                        <td className="p-4 text-slate-700">{app.teamSize}</td>
                        <td className="p-4">{getStatusBadge(app.status)}</td>
                        <td className="p-4 text-slate-500 text-[11px]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenAppDetails(app)}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                            title="View Application Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete application for ${app.startupName}?`)) {
                                deleteAppMutation.mutate(app.id);
                              }
                            }}
                            className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors"
                            title="Delete Application"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAM TRACKS */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isProgramsLoading ? (
            <div className="col-span-3 text-center py-12 text-xs text-slate-500">Loading programs...</div>
          ) : (
            programs?.map((prog) => (
              <div
                key={prog.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      {prog.category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${prog.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {prog.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{prog.title}</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4 line-clamp-3">
                    {prog.shortDescription}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-700 mb-6">
                    <div><strong>Duration:</strong> {prog.duration}</div>
                    <div><strong>Cohort Size:</strong> {prog.cohortSize} teams</div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleOpenProgramModal(prog)}
                    className="text-xs font-bold py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete program track "${prog.title}"?`)) {
                        deleteProgramMutation.mutate(prog.id);
                      }
                    }}
                    className="text-xs font-bold py-1.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* APPLICATION DETAILS MODAL */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-7 relative shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900"
            >
              <button
                onClick={() => setSelectedApp(null)}
                className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-brand-primary">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedApp.startupName}</h3>
                  <p className="text-xs text-slate-500">Founded by {selectedApp.founderName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Email</span>
                  <span className="text-slate-900 font-semibold">{selectedApp.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Phone</span>
                  <span className="text-slate-900 font-semibold">{selectedApp.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Industry</span>
                  <span className="text-slate-900 font-semibold">{selectedApp.industry}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Stage</span>
                  <span className="text-slate-900 font-semibold">{selectedApp.startupStage}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Team Size</span>
                  <span className="text-slate-900 font-semibold">{selectedApp.teamSize}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Funding Status</span>
                  <span className="text-slate-900 font-semibold">{selectedApp.fundingStatus}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Brief Description</h4>
                  <p className="text-xs text-slate-800 bg-slate-50 p-3.5 border border-slate-200 rounded-xl font-medium leading-relaxed">
                    {selectedApp.briefDescription}
                  </p>
                </div>

                {selectedApp.currentChallenges && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Current Challenges</h4>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3.5 border border-slate-200 rounded-xl font-medium leading-relaxed">
                      {selectedApp.currentChallenges}
                    </p>
                  </div>
                )}
              </div>

              {/* Review & Status Section */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Change Application Status</label>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl text-xs font-medium px-3.5 py-2.5 focus:border-brand-primary focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Internal Review Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter review notes, mentor assignments, or interview schedules..."
                    value={reviewNotesInput}
                    onChange={(e) => setReviewNotesInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl text-xs font-medium p-3 focus:border-brand-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <Button variant="secondary" onClick={() => setSelectedApp(null)} className="text-xs font-bold">
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    disabled={updateStatusMutation.isPending}
                    onClick={handleSaveAppReview}
                    className="text-xs font-bold px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Save Status & Notes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT PROGRAM MODAL */}
      <AnimatePresence>
        {isProgramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-7 relative shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900"
            >
              <button
                onClick={() => setIsProgramModalOpen(false)}
                className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {editingProgram ? 'Edit Startup Program' : 'Create Startup Program Track'}
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Configure cohort duration, eligibility criteria, and benefits.</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveProgramMutation.mutate(programForm);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program Title</label>
                  <Input
                    required
                    placeholder="e.g. Incubation Cohort 2026"
                    value={programForm.title || ''}
                    onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <Input
                      required
                      placeholder="e.g. Incubation, Validation, Acceleration"
                      value={programForm.category || ''}
                      onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })}
                      className="!bg-white !border-slate-300 !text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                    <Input
                      required
                      placeholder="e.g. 12 Weeks"
                      value={programForm.duration || ''}
                      onChange={(e) => setProgramForm({ ...programForm, duration: e.target.value })}
                      className="!bg-white !border-slate-300 !text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Brief overview displayed on program cards..."
                    value={programForm.shortDescription || ''}
                    onChange={(e) => setProgramForm({ ...programForm, shortDescription: e.target.value })}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl text-xs font-medium p-3 focus:border-brand-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Eligibility Target</label>
                  <Input
                    placeholder="e.g. Open to tech founders with MVP"
                    value={programForm.eligibility || ''}
                    onChange={(e) => setProgramForm({ ...programForm, eligibility: e.target.value })}
                    className="!bg-white !border-slate-300 !text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                  <Button variant="secondary" onClick={() => setIsProgramModalOpen(false)} className="text-xs font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" variant="success" disabled={saveProgramMutation.isPending} className="text-xs font-bold px-5 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Save Program Track
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
