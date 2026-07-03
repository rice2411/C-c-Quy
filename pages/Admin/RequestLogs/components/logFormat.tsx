import React from 'react';
import Badge from '@/components/ui/Badge';
import type { RequestLog } from '@/services/requestLogService';

/** Màu badge theo nhóm status code. */
export const statusBadgeClass = (status: number): { bg: string; text: string } => {
  if (status >= 500) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' };
  if (status >= 400) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' };
  if (status >= 300) return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' };
  return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' };
};

/** Màu badge theo HTTP method. */
export const methodBadgeClass = (method: string): { bg: string; text: string } => {
  switch ((method || '').toUpperCase()) {
    case 'GET':
      return { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300' };
    case 'POST':
      return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' };
    case 'PATCH':
    case 'PUT':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' };
    case 'DELETE':
      return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' };
    default:
      return { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-300' };
  }
};

export const formatTime = (log: RequestLog): string => {
  try {
    return log.timestamp.toDate().toLocaleString('vi-VN');
  } catch {
    return '—';
  }
};

export const formatGeo = (log: RequestLog): string => {
  if (!log.geo) return '—';
  const parts = [log.geo.city, log.geo.region, log.geo.country].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
};

/** Phân loại IP để đánh dấu localhost / mạng nội bộ (geoip không tra được). */
export const classifyIp = (ip: string): 'localhost' | 'private' | 'public' => {
  if (!ip || ip === '::1' || ip === 'localhost' || /^127\./.test(ip)) return 'localhost';
  if (
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^(fc|fd|fe80)/i.test(ip)
  ) {
    return 'private';
  }
  return 'public';
};

/** Nhãn vị trí dạng chuỗi (mobile + chi tiết). */
export const formatLocation = (log: RequestLog): string => {
  const kind = classifyIp(log.ip);
  if (kind === 'localhost') return 'Localhost';
  if (kind === 'private') return 'Mạng nội bộ';
  return formatGeo(log);
};

/** Ô vị trí desktop: badge cho localhost/nội bộ, text cho IP công khai. */
export const LocationCell: React.FC<{ log: RequestLog }> = ({ log }) => {
  const kind = classifyIp(log.ip);
  if (kind === 'localhost') {
    return (
      <Badge size="sm" backgroundClassName="bg-slate-100 dark:bg-slate-700/50" textClassName="text-slate-500 dark:text-slate-400" borderClassName="border-transparent">
        Localhost
      </Badge>
    );
  }
  if (kind === 'private') {
    return (
      <Badge size="sm" backgroundClassName="bg-violet-100 dark:bg-violet-900/30" textClassName="text-violet-700 dark:text-violet-300" borderClassName="border-transparent">
        Mạng nội bộ
      </Badge>
    );
  }
  return <>{formatGeo(log)}</>;
};
