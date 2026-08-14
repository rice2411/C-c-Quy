import { apiClient } from '@/services/api/client';
import { WageRate, WageRateInput } from '@/types/wage';

const BASE = '/wages';

/** Ép mức lương (untrusted) về WageRate với default an toàn. */
function toWage(r: any): WageRate {
  return {
    id: typeof r?.id === 'string' ? r.id : '',
    position: typeof r?.position === 'string' ? r.position : '',
    hourlyRate: typeof r?.hourlyRate === 'number' ? r.hourlyRate : 0,
    weekdays: Array.isArray(r?.weekdays)
      ? r.weekdays.filter((n: unknown): n is number => typeof n === 'number')
      : [],
    effectiveDate: typeof r?.effectiveDate === 'string' ? r.effectiveDate : '',
    note: typeof r?.note === 'string' ? r.note : null,
    createdAt: typeof r?.createdAt === 'string' ? r.createdAt : undefined,
  };
}

export async function fetchWages(): Promise<WageRate[]> {
  const res = await apiClient.get<any[]>(BASE);
  return Array.isArray(res.data) ? res.data.map(toWage) : [];
}

export async function addWage(input: WageRateInput): Promise<WageRate> {
  const res = await apiClient.post<any>(BASE, input);
  return toWage(res.data);
}

export async function deleteWage(id: string): Promise<{ ok: boolean; reason?: string }> {
  const res = await apiClient.delete<{ ok: boolean; reason?: string }>(`${BASE}/${id}`);
  return res.data;
}
