import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  type NotificationSchedule,
  type ScheduleInput,
} from '@/services/notificationScheduleService';

const KEY = ['notification-schedules'] as const;

export const useNotificationSchedules = () => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: KEY,
    queryFn: fetchSchedules,
    enabled: !!currentUser,
  });
  return {
    schedules: (q.data ?? []) as NotificationSchedule[],
    loading: q.isLoading,
    error: q.error,
  };
};

export const useScheduleMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });
  const create = useMutation({ mutationFn: (d: ScheduleInput) => createSchedule(d), onSuccess: invalidate });
  const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: ScheduleInput }) => updateSchedule(id, data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => deleteSchedule(id), onSuccess: invalidate });
  return {
    createSchedule: (d: ScheduleInput) => create.mutateAsync(d),
    updateSchedule: (id: string, data: ScheduleInput) => update.mutateAsync({ id, data }),
    deleteSchedule: (id: string) => remove.mutateAsync(id),
    saving: create.isPending || update.isPending,
  };
};
