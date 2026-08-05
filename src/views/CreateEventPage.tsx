import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EventBuilderDashboard } from '../components/events/EventBuilderDashboard';
import { eventApi } from '../lib/eventApi';
import { IEvent } from '../types';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const currentPrefix = location.pathname.startsWith('/superadmin/dashboard')
    ? '/superadmin/dashboard'
    : location.pathname.startsWith('/admin/dashboard')
    ? '/admin/dashboard'
    : '/dashboard';

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: Omit<IEvent, 'id' | 'tenantId' | 'createdBy' | 'createdAt' | 'updatedAt'>) =>
      eventApi.createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      setFeedback({ type: 'success', message: 'Event published successfully!' });
      setTimeout(() => {
        navigate(`${currentPrefix}/events`);
      }, 800);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error?.message || err?.message || 'Failed to publish event. Please check required fields.',
      });
    },
  });

  const handleSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    navigate(`${currentPrefix}/events`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto">
      {feedback && (
        <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-500 hover:text-gray-700 font-bold">
            &times;
          </button>
        </div>
      )}

      <EventBuilderDashboard
        initialValues={null}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        onCancel={handleCancel}
      />
    </div>
  );
}
