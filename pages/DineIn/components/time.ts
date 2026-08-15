import { useEffect, useState } from 'react';

/** HH:mm từ ISO (giờ VN theo locale máy). */
export const fmtTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

/** HH:mm dd/MM từ ISO. */
export const fmtDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      });
};

/** Khoảng thời gian "Xg Yp" giữa from→to (mặc định to = bây giờ). */
export const fmtDuration = (fromISO?: string | null, toMs?: number): string => {
  if (!fromISO) return '';
  const from = new Date(fromISO).getTime();
  if (isNaN(from)) return '';
  const to = toMs ?? Date.now();
  let mins = Math.max(0, Math.floor((to - from) / 60000));
  const h = Math.floor(mins / 60);
  mins %= 60;
  return h > 0 ? `${h}g${mins.toString().padStart(2, '0')}p` : `${mins}p`;
};

/** Đồng hồ đếm giờ live "HH:MM:SS" giữa from→to (mặc định to = bây giờ). */
export const fmtDurationClock = (fromISO?: string | null, toMs?: number): string => {
  if (!fromISO) return '00:00:00';
  const from = new Date(fromISO).getTime();
  if (isNaN(from)) return '00:00:00';
  const to = toMs ?? Date.now();
  let s = Math.max(0, Math.floor((to - from) / 1000));
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** Now.getTime() tự cập nhật mỗi `intervalMs` (cho đồng hồ đếm giờ live). */
export const useNowTick = (intervalMs = 30000): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};
