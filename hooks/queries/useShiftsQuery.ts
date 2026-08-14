/**
 * React Query hooks cho domain Ca làm (shifts). queryFn gọi thẳng shiftService.
 * enabled theo currentUser (tránh 401). Mutation setDay invalidate range hiện tại.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchShifts,
  fetchShiftAssignments,
  setDayAssignments,
  saveShifts,
} from '@/services/shiftService';
import {
  ShiftAssignment,
  SetDayInput,
  WorkShift,
  WorkShiftSaveItem,
} from '@/types/shift';

/** 3 ca định nghĩa (ít đổi → cache lâu). */
export const useWorkShifts = () => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: qk.shifts.defs,
    queryFn: fetchShifts,
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });
  return {
    shifts: (q.data ?? []) as WorkShift[],
    loading: q.isLoading,
    error: q.error,
  };
};

/** Lưu cài đặt ca (giờ + thứ trong tuần). */
export const useSaveShifts = () => {
  const queryClient = useQueryClient();
  const m = useMutation({
    mutationFn: (items: WorkShiftSaveItem[]) => saveShifts(items),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.shifts.defs, data);
    },
  });
  return { saveShifts: (items: WorkShiftSaveItem[]) => m.mutateAsync(items), saving: m.isPending };
};

/** Phân ca trong khoảng ngày [from, to] (yyyy-mm-dd). */
export const useShiftAssignments = (from: string, to: string) => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: qk.shifts.assignments(from, to),
    queryFn: () => fetchShiftAssignments(from, to),
    enabled: !!currentUser && !!from && !!to,
  });
  return {
    assignments: (q.data ?? []) as ShiftAssignment[],
    loading: q.isLoading,
    error: q.error,
  };
};

export const useShiftMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['shifts', 'assignments'] });

  const setDayM = useMutation({
    mutationFn: (input: SetDayInput) => setDayAssignments(input),
    onSuccess: invalidate,
  });

  return {
    setDay: (input: SetDayInput) => setDayM.mutateAsync(input),
    setDayPending: setDayM.isPending,
  };
};
