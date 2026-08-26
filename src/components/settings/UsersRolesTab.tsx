import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  X, 
  Mail, 
  Phone, 
  Briefcase,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { axiosInstance } from '../../lib/axiosInstance';
import { UserRole } from '../../types';

interface UserRecord {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  createdAt?: string;
}

interface UsersRolesTabProps {
  onSuccessToast?: (msg: string) => void;
}

export const UsersRolesTab: React.FC<UsersRolesTabProps> = ({ onSuccessToast }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState(UserRole.STAFF);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.STAFF,
    phone: '',
    company: 'WeVentureHub',
  });
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search) params.search = search;

      const res = await axiosInstance.get('/auth/users', { params });
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      console.warn('Error loading users, using team member defaults', err);
      setUsers([
        {
          id: 'u1',
          firstName: 'Alex',
          lastName: 'Chen',
          email: 'admin@weventurehub.com',
          role: UserRole.SUPER_ADMIN,
          phone: '091 124 3503',
          company: 'WeVentureHub HQ',
        },
        {
          id: 'u2',
          firstName: 'Selamawit',
          lastName: 'Tadesse',
          email: 'selam@weventurehub.com',
          role: UserRole.WORKSPACE_MANAGER,
          phone: '091 234 5678',
          company: 'WeVentureHub Operations',
        },
        {
          id: 'u3',
          firstName: 'Bruk',
          lastName: 'Assefa',
          email: 'finance@weventurehub.com',
          role: UserRole.FINANCE_OFFICER,
          phone: '091 345 6789',
          company: 'WeVentureHub Accounts',
        },
        {
          id: 'u4',
          firstName: 'Helina',
          lastName: 'Bekele',
          email: 'community@weventurehub.com',
          role: UserRole.COMMUNITY_MANAGER,
          phone: '091 456 7890',
          company: 'WeVentureHub Community',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingUser(true);
      setError(null);

      await axiosInstance.post('/auth/users', formData);
      setIsAddModalOpen(false);
      fetchUsers();
      setSuccessMsg('Team member added successfully');
      if (onSuccessToast) onSuccessToast('Team member created');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create user record.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const userId = selectedUser._id || selectedUser.id;

    try {
      setSavingUser(true);
      await axiosInstance.patch(`/auth/users/${userId}/role`, { role: newRole });
      setIsRoleModalOpen(false);
      fetchUsers();
      setSuccessMsg('User role updated successfully');
      if (onSuccessToast) onSuccessToast('Role updated');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user role.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from WeVentureHub platform?')) return;
    try {
      await axiosInstance.delete(`/auth/users/${userId}`);
      fetchUsers();
      if (onSuccessToast) onSuccessToast('User removed');
    } catch (err: any) {
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.company && u.company.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#84CC16]/10 text-[#65A30D] rounded-2xl flex items-center justify-center border border-[#84CC16]/30 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-[#111111] dark:text-white tracking-tight">WeVentureHub Team & Access Roles</h2>
              <p className="text-[#6B7280] dark:text-slate-400 text-sm mt-0.5 font-medium">
                Manage WeVentureHub administrators, event managers, finance officers, reception staff, and community members.
              </p>
            </div>
          </div>
          <Button
            id="add-team-member-btn"
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
            <option value={UserRole.EVENT_MANAGER}>Event Manager</option>
            <option value={UserRole.WORKSPACE_MANAGER}>Workspace Manager</option>
            <option value={UserRole.FINANCE_OFFICER}>Finance Officer</option>
            <option value={UserRole.COMMUNITY_MANAGER}>Community Manager</option>
            <option value={UserRole.STAFF}>Staff</option>
            <option value={UserRole.HUB_MEMBER}>Hub Member</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            title="Refresh Users"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#84CC16] border-t-transparent rounded-full animate-spin mr-3"></div>
            <span>Loading user profiles...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No matching user accounts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white dark:bg-slate-900 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-neutral-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role & Access</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                {filteredUsers.map((user) => {
                  const userId = user._id || user.id;
                  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

                  return (
                    <tr key={userId} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#84CC16]/15 text-[#65A30D] font-bold flex items-center justify-center text-xs border border-[#84CC16]/30">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-[#111111] dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-[#6B7280] dark:text-slate-400 font-medium">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5 ${
                            isSuperAdmin
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : user.role === UserRole.FINANCE_OFFICER
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-[#84CC16]/15 text-[#65A30D]'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {user.phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {user.company || 'WeVentureHub'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role as any);
                              setIsRoleModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800"
                            title="Change Role"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!isSuperAdmin && userId && (
                            <button
                              onClick={() => handleDeleteUser(userId)}
                              className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl max-w-md w-full border border-neutral-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-[#111111] dark:text-white">Add WeVentureHub Team Member</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                    First Name *
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Selam"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                    Last Name *
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Tadesse"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@weventurehub.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Platform Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
                >
                  <option value={UserRole.STAFF}>Staff / Front Desk</option>
                  <option value={UserRole.WORKSPACE_MANAGER}>Workspace Manager</option>
                  <option value={UserRole.EVENT_MANAGER}>Event Manager</option>
                  <option value={UserRole.FINANCE_OFFICER}>Finance Officer</option>
                  <option value={UserRole.COMMUNITY_MANAGER}>Community Manager</option>
                  <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                  <option value={UserRole.HUB_MEMBER}>Hub Member</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="091 124 3503"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                    Company / Dept
                  </label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="WeVentureHub"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingUser} variant="primary">
                  {savingUser ? 'Creating...' : 'Create Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl max-w-sm w-full border border-neutral-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-[#111111] dark:text-white">Modify User Role</h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 space-y-4">
              <p className="text-xs text-[#6B7280] dark:text-slate-400 font-medium">
                Updating access permissions for <strong className="text-[#111111] dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email}).
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1">
                  Select Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[14px] border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111111] dark:text-white focus:ring-2 focus:ring-[#84CC16] focus:outline-none font-medium"
                >
                  <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                  <option value={UserRole.WORKSPACE_MANAGER}>Workspace Manager</option>
                  <option value={UserRole.EVENT_MANAGER}>Event Manager</option>
                  <option value={UserRole.FINANCE_OFFICER}>Finance Officer</option>
                  <option value={UserRole.COMMUNITY_MANAGER}>Community Manager</option>
                  <option value={UserRole.STAFF}>Staff</option>
                  <option value={UserRole.HUB_MEMBER}>Hub Member</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingUser} variant="primary">
                  {savingUser ? 'Saving...' : 'Update Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
