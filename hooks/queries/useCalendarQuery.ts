/**
 * React Query hooks cho màn Lịch. Đọc event gộp theo khoảng ngày; CRUD sự kiện tự thêm.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchCalendar,
  saveCustomEvent,
  deleteCustomEvent,
} from '@/services/calendarService';
import { CalendarEvent, CustomEventInput } from '@/types/calendar';

/** Mọi event trong khoảng ngày [from, to]. */
export const useCalendarEvents = (from: string, to: string) => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: qk.calendar.events(from, to),
    queryFn: () => fetchCalendar(from, to),
    enabled: !!currentUser && !!from && !!to,
  });
  return {
    events: (q.data ?? []) as CalendarEvent[],
    loading: q.isLoading,
    error: q.error,
  };
};

export const useCalendarMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });

  const saveM = useMutation({
    mutationFn: (input: CustomEventInput) => saveCustomEvent(input),
    onSuccess: invalidate,
  });
  const delM = useMutation({
    mutationFn: (id: string) => deleteCustomEvent(id),
    onSuccess: invalidate,
  });

  return {
    saveCustom: (input: CustomEventInput) => saveM.mutateAsync(input),
    deleteCustom: (id: string) => delM.mutateAsync(id),
    saving: saveM.isPending,
  };
};
