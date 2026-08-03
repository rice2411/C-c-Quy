/**
 * Đo "ping" round-trip FE → BE (gọi /health) định kỳ, phân mức ổn định theo ms.
 * Dùng cho chỉ báo trạng thái ở navbar.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchHealth } from '@/services/requestLogService';

export type PingLevel = 'good' | 'ok' | 'bad';

export interface SystemPing {
  ms: number | null;
  reachable: boolean;
  level: PingLevel;
  label: string;
}

/** Ngưỡng (ms): ≤ GOOD → ổn định (xanh); ≤ OK → bình thường (vàng); còn lại → đỏ. */
const GOOD_MS = 300;
const OK_MS = 800;

const classify = (ms: number | null, reachable: boolean): { level: PingLevel; label: string } => {
  if (!reachable || ms === null) return { level: 'bad', label: 'Mất kết nối' };
  if (ms <= GOOD_MS) return { level: 'good', label: 'Ổn định' };
  if (ms <= OK_MS) return { level: 'ok', label: 'Bình thường' };
  return { level: 'bad', label: 'Không ổn định' };
};

// 20s: đủ tươi cho chấm trạng thái navbar, giảm nửa lượng ping nền so với 10s.
// (RQ mặc định KHÔNG poll khi tab ẩn → nền tab khác không tốn request.)
export const useSystemPing = (intervalMs = 20000): SystemPing => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: ['system', 'ping'],
    queryFn: async (): Promise<{ ms: number; reachable: boolean }> => {
      const t0 = performance.now();
      try {
        await fetchHealth();
        return { ms: Math.round(performance.now() - t0), reachable: true };
      } catch {
        return { ms: Math.round(performance.now() - t0), reachable: false };
      }
    },
    enabled: !!currentUser,
    refetchInterval: intervalMs,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const ms = q.data?.ms ?? null;
  const reachable = q.data?.reachable ?? false;
  const { level, label } = classify(ms, reachable);
  return { ms: reachable ? ms : null, reachable, level, label };
};
