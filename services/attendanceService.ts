import { apiClient } from '@/services/api/client';
import {
  AllowedNetwork,
  AttendanceHistory,
  AttendanceKind,
  AttendanceMe,
  AttendanceOverviewRow,
  AttendanceRecord,
} from '@/types/attendance';

const BASE = '/attendance';

// ---- type-guard (dữ liệu API là untrusted) ----
function num(v: unknown): number | null {
  return typeof v === 'number' ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}
/**
 * Chuẩn hoá field thời gian về ISO string. apiClient revive chuỗi timestamptz Postgres
 * thành object Timestamp-like (có .toDate()) TRƯỚC khi tới đây, nên phải nhận cả 2 dạng.
 */
function toIso(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const anyv = v as { toDate?: () => Date; toMillis?: () => number };
    try {
      if (typeof anyv.toDate === 'function') return anyv.toDate().toISOString();
      if (typeof anyv.toMillis === 'function') return new Date(anyv.toMillis()).toISOString();
    } catch {
      /* ignore */
    }
  }
  return null;
}

function toRecord(r: any): AttendanceRecord {
  return {
    id: str(r?.id) ?? '',
    employeeId: str(r?.employeeId) ?? '',
    employeeName: str(r?.employeeName),
    kind: r?.kind === 'out' ? 'out' : 'in',
    checkedAt: toIso(r?.checkedAt) ?? '',
    ip: str(r?.ip),
    faceDistance: num(r?.faceDistance),
    imageUrl: str(r?.imageUrl),
    note: str(r?.note),
  };
}

function toNetwork(r: any): AllowedNetwork {
  return {
    id: str(r?.id) ?? '',
    label: str(r?.label),
    ipCidr: str(r?.ipCidr) ?? '',
    active: r?.active !== false,
    createdAt: toIso(r?.createdAt) ?? undefined,
  };
}

// ---- Nhân viên (self) ----

/** Trạng thái của NV đang đăng nhập + IP hiện tại. */
export async function fetchMe(): Promise<AttendanceMe> {
  const res = await apiClient.get<AttendanceMe>(`${BASE}/me`);
  const d = res.data as any;
  return {
    employee: d?.employee
      ? {
          id: str(d.employee.id) ?? '',
          name: str(d.employee.name) ?? '',
          email: str(d.employee.email),
          status: str(d.employee.status) ?? 'active',
          faceCount: num(d.employee.faceCount) ?? 0,
        }
      : null,
    status: d?.status
      ? {
          employeeId: str(d.status.employeeId) ?? '',
          faceCount: num(d.status.faceCount) ?? 0,
          lastKind: d.status.lastKind === 'out' ? 'out' : d.status.lastKind === 'in' ? 'in' : null,
          lastAt: toIso(d.status.lastAt),
          todayIn: toIso(d.status.todayIn),
          todayOut: toIso(d.status.todayOut),
          todayCount: num(d.status.todayCount) ?? 0,
        }
      : null,
    ip: {
      configured: Boolean(d?.ip?.configured),
      allowed: Boolean(d?.ip?.allowed),
      ip: str(d?.ip?.ip) ?? '',
    },
  };
}

/** Đăng ký 1 mẫu khuôn mặt. employeeId chỉ dùng khi admin đăng ký hộ. */
export async function registerFace(
  imageBlob: Blob,
  opts?: { employeeId?: string; reset?: boolean },
): Promise<{ employeeId: string; faceCount: number }> {
  const form = new FormData();
  form.append('file', imageBlob, 'face.jpg');
  if (opts?.employeeId) form.append('employeeId', opts.employeeId);
  if (opts?.reset) form.append('reset', 'true');
  const res = await apiClient.post<any>(`${BASE}/register-face`, form);
  return {
    employeeId: str(res.data?.employeeId) ?? '',
    faceCount: num(res.data?.faceCount) ?? 0,
  };
}

/** Chấm công vào/ra (BE kiểm IP + so khớp mặt). */
export async function checkAttendance(
  imageBlob: Blob,
  kind: AttendanceKind,
  note?: string,
): Promise<{ record: AttendanceRecord; distance: number }> {
  const form = new FormData();
  form.append('file', imageBlob, 'check.jpg');
  form.append('kind', kind);
  if (note) form.append('note', note);
  const res = await apiClient.post<any>(`${BASE}/check`, form);
  return {
    record: toRecord(res.data?.record),
    distance: num(res.data?.distance) ?? 0,
  };
}

// ---- Quản lý (admin) ----

/** IP server nhìn thấy (để admin thêm vào whitelist). */
export async function fetchCurrentIp(): Promise<string> {
  const res = await apiClient.get<{ ip: string }>(`${BASE}/current-ip`);
  return str(res.data?.ip) ?? '';
}

export async function fetchOverview(): Promise<AttendanceOverviewRow[]> {
  const res = await apiClient.get<any[]>(`${BASE}/overview`);
  return Array.isArray(res.data)
    ? res.data.map((r) => ({
        employeeId: str(r?.employeeId) ?? '',
        name: str(r?.name) ?? '',
        email: str(r?.email),
        position: str(r?.position),
        status: str(r?.status) ?? 'active',
        faceCount: num(r?.faceCount) ?? 0,
        todayIn: toIso(r?.todayIn),
        todayOut: toIso(r?.todayOut),
      }))
    : [];
}

export async function fetchHistory(params?: {
  employeeId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<AttendanceHistory> {
  const res = await apiClient.get<any>(`${BASE}/history`, { params });
  const d = res.data ?? {};
  return {
    items: Array.isArray(d.items) ? d.items.map(toRecord) : [],
    total: num(d.total) ?? 0,
    limit: num(d.limit) ?? 100,
    offset: num(d.offset) ?? 0,
  };
}

export async function fetchNetworks(): Promise<AllowedNetwork[]> {
  const res = await apiClient.get<any[]>(`${BASE}/networks`);
  return Array.isArray(res.data) ? res.data.map(toNetwork) : [];
}

export async function upsertNetwork(input: {
  id?: string;
  label?: string | null;
  ipCidr: string;
  active?: boolean;
}): Promise<AllowedNetwork> {
  const res = await apiClient.post<any>(`${BASE}/networks`, input);
  return toNetwork(res.data);
}

export async function deleteNetwork(id: string): Promise<{ ok: boolean }> {
  const res = await apiClient.delete<{ ok: boolean }>(`${BASE}/networks/${id}`);
  return res.data;
}

/** Xoá toàn bộ mẫu mặt của 1 NV (admin, để đăng ký lại). */
export async function clearEmployeeFace(
  employeeId: string,
): Promise<{ ok: boolean; deleted: number }> {
  const res = await apiClient.post<{ ok: boolean; deleted: number }>(
    `${BASE}/faces/${employeeId}/clear`,
    {},
  );
  return res.data;
}
