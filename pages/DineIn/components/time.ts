import { useEffect, useState } from 'react';

/**
 * apiClient.reviveTimestamps hồi sinh MỌI chuỗi ISO timestamp thành object
 * Timestamp-like { seconds, _seconds, toDate(), toMillis() } → KHÔNG còn là string.
 * Các helper dưới nhận `any` và chuẩn hoá về ms qua msOf để hoạt động với cả
 * string ISO, Timestamp-like, Date hoặc number.
 */
export const msOf = (v: any): number | null => {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const ms = Date.parse(v);
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.toDate === 'function') {
    const d = v.toDate();
    return d instanceof Date ? d.getTime() : null;
  }
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  if (typeof v?._seconds === 'number') return v._seconds * 1000;
  if (v instanceof Date) return v.getTime();
  return null;
};

/** HH:mm. */
export const fmtTime = (v?: any): string => {
  const ms = msOf(v);
  return ms == null ? '—' : new Date(ms).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

/** HH:mm dd/MM. */
export const fmtDateTime = (v?: any): string => {
  const ms = msOf(v);
  return ms == null
    ? '—'
    : new Date(ms).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};

/** Khoảng thời gian "Xg Yp" giữa from→to (mặc định to = bây giờ). */
export const fmtDuration = (from?: any, toMs?: number): string => {
  const fromMs = msOf(from);
  if (fromMs == null) return '';
  const to = toMs ?? Date.now();
  let mins = Math.max(0, Math.floor((to - fromMs) / 60000));
  const h = Math.floor(mins / 60);
  mins %= 60;
  return h > 0 ? `${h}g${mins.toString().padStart(2, '0')}p` : `${mins}p`;
};

/** Đồng hồ đếm giờ live "HH:MM:SS" giữa from→to (mặc định to = bây giờ). */
export const fmtDurationClock = (from?: any, toMs?: number): string => {
  const fromMs = msOf(from);
  if (fromMs == null) return '00:00:00';
  const to = toMs ?? Date.now();
  let s = Math.max(0, Math.floor((to - fromMs) / 1000));
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
