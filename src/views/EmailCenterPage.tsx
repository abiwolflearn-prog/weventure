import React from 'react';
import { useAppSelector } from '../store';
import { AdminEmailCenter } from '../components/admin/AdminEmailCenter';
import { EmailHistoryAndPreferences } from '../components/dashboard/EmailHistoryAndPreferences';

export default function EmailCenterPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdminOrStaff = user?.role && ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(user.role);

  return (
    <div className="space-y-6">
      {isAdminOrStaff ? (
        <AdminEmailCenter />
      ) : (
        <EmailHistoryAndPreferences />
      )}
    </div>
  );
}
