import { apiClient } from '@/services/api/client';
import { CalendarEvent, CalendarEventType, CustomEventInput } from '@/types/calendar';

const BASE = '/calendar';

const TYPES: CalendarEventType[] = ['order', 'shift', 'custom', 'attendance'];

/** Ép event (untrusted) về CalendarEvent với default an toàn. */
function toEvent(r: any): CalendarEvent {
  return {
    id: typeof r?.id === 'string' ? r.id : '',
    type: TYPES.includes(r?.type) ? r.type : 'custom',
    date: typeof r?.date === 'string' ? r.date : '',
    title: typeof r?.title === 'string' ? r.title : '',
    subtitle: typeof r?.subtitle === 'string' ? r.subtitle : null,
    time: typeof r?.time === 'string' ? r.time : null,
    refId: typeof r?.refId === 'string' ? r.refId : null,
    meta: r?.meta && typeof r.meta === 'object' ? r.meta : null,
  };
}

/** Mọi event trong khoảng ngày [from, to] (yyyy-mm-dd). */
export async function fetchCalendar(from: string, to: string): Promise<CalendarEvent[]> {
  const res = await apiClient.get<any[]>(BASE, { params: { from, to } });
  return Array.isArray(res.data) ? res.data.map(toEvent) : [];
}

/** Tạo/sửa sự kiện tự thêm. */
export async function saveCustomEvent(input: CustomEventInput): Promise<void> {
  await apiClient.post(`${BASE}/custom`, input);
}

/** Xoá sự kiện tự thêm. */
export async function deleteCustomEvent(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/custom/${id}`);
}
