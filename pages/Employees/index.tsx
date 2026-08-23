import React, { useMemo, useState } from 'react';
import { Pencil, Plus, ScanFace, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmployees, useEmployeeMutations } from '@/hooks/queries/useEmployeesQuery';
import { useUsers } from '@/hooks/queries/useUsersQuery';
import { useAttendanceOverview, useNetworkMutations } from '@/hooks/queries/useAttendanceQuery';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import FaceEnrollModal from '@/pages/Attendance/components/FaceEnrollModal';
import {
  Employee,
  EMPLOYEE_STATUSES,
  EmployeeStatus,
  employeeStatusLabel,
} from '@/types/employee';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import DatePicker from '@/components/ui/DatePicker';
import Field from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import WageSection from './components/WageSection';

interface FormState {
  name: string;
  email: string;
  position: string;
  phone: string;
  startDate: string;
  baseSalary: string;
  status: EmployeeStatus;
  note: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  position: '',
  phone: '',
  startDate: '',
  baseSalary: '',
  status: 'active',
  note: '',
};

type PanelTab = 'info' | 'face';

const EmployeesPage: React.FC = () => {
  const { employees, loading, error } = useEmployees();
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployeeMutations();
  const { users } = useUsers();
  const { userData } = useAuth();
  const isSuperAdmin = userData?.role === UserRole.SUPER_ADMIN;
  // Tổng quan chấm công chỉ để lấy số mẫu khuôn mặt theo NV (gộp phần "Khuôn mặt" vào đây).
  const { rows: faceOverview } = useAttendanceOverview(true);
  const { clearFace } = useNetworkMutations();

  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('info');
  // NV đang mở modal đăng ký khuôn mặt (từ list hoặc tab Khuôn mặt).
  const [enroll, setEnroll] = useState<{ employeeId: string; name: string } | null>(null);

  // Map employeeId -> số mẫu khuôn mặt đã đăng ký.
  const faceCountByEmployee = useMemo(() => {
    const m = new Map<string, number>();
    faceOverview.forEach((r) => m.set(r.employeeId, r.faceCount));
    return m;
  }, [faceOverview]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.position ?? '').toLowerCase().includes(q) ||
        (e.phone ?? '').toLowerCase().includes(q),
    );
  }, [employees, search]);

  const activeCount = useMemo(() => employees.filter((e) => e.status === 'active').length, [employees]);

  // Tài khoản đã đăng nhập (users) — chọn để gắn cho hồ sơ NV thay vì gõ tay email.
  const accountOptions = useMemo(
    () =>
      users
        .filter((u) => u.email)
        .map((u) => ({
          email: u.email as string,
          name: (u.customName || u.displayName || u.email) as string,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [users],
  );
  const accountNameByEmail = useMemo(() => {
    const m = new Map<string, string>();
    accountOptions.forEach((a) => m.set(a.email.toLowerCase(), a.name));
    return m;
  }, [accountOptions]);
  // Email đã gắn cho NV KHÁC (để cảnh báo trùng) — trừ NV đang sửa.
  const linkedEmails = useMemo(() => {
    const s = new Set<string>();
    employees.forEach((e) => {
      if (e.email && e.id !== editingId) s.add(e.email.toLowerCase());
    });
    return s;
  }, [employees, editingId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPanelTab('info');
    setPanelOpen(true);
  };

  const openEdit = (e: Employee, tab: PanelTab = 'info') => {
    setEditingId(e.id);
    setPanelTab(tab);
    setForm({
      name: e.name ?? '',
      email: e.email ?? '',
      position: e.position ?? '',
      phone: e.phone ?? '',
      startDate: e.startDate ?? '',
      baseSalary: e.baseSalary != null ? String(e.baseSalary) : '',
      status: e.status,
      note: e.note ?? '',
    });
    setPanelOpen(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Chọn tài khoản đăng nhập → điền email; nếu chưa có tên thì lấy tên từ tài khoản.
  const pickAccount = (email: string) =>
    setForm((prev) => ({
      ...prev,
      email,
      name: prev.name.trim() ? prev.name : accountNameByEmail.get(email.toLowerCase()) ?? prev.name,
    }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nhập tên nhân viên.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        position: form.position.trim() || null,
        phone: form.phone.trim() || null,
        startDate: form.startDate || null,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : null,
        status: form.status,
        note: form.note.trim() || null,
      };
      if (editingId) {
        await updateEmployee(editingId, payload);
        toast.success('Đã cập nhật nhân viên.');
      } else {
        await createEmployee(payload);
        toast.success('Đã thêm nhân viên.');
      }
      setPanelOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: Employee) => {
    if (!window.confirm(`Xoá nhân viên "${e.name}"?`)) return;
    try {
      await deleteEmployee(e.id);
      toast.success('Đã xoá nhân viên.');
    } catch (err) {
      console.error(err);
      toast.error('Xoá thất bại.');
    }
  };

  const handleClearFace = async (employeeId: string, name: string) => {
    if (!window.confirm(`Xoá dữ liệu khuôn mặt của "${name}"? Nhân viên sẽ phải đăng ký lại.`)) return;
    try {
      const r = await clearFace(employeeId);
      toast.success(`Đã xoá ${r.deleted} mẫu khuôn mặt.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xoá thất bại.');
    }
  };

  // NV đang mở trong panel (để render tab Khuôn mặt).
  const editingEmployee = useMemo(
    () => (editingId ? employees.find((e) => e.id === editingId) ?? null : null),
    [employees, editingId],
  );
  const editingFaceCount = editingId ? faceCountByEmployee.get(editingId) ?? 0 : 0;

  const panelFooter =
    panelTab === 'info' ? (
      <Box layoutClassName="flex justify-end gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => setPanelOpen(false)}>
          Huỷ
        </Button>
        <Button type="button" variant="primary" size="sm" disabled={saving} onClick={handleSave}>
          {saving ? 'Đang lưu…' : editingId ? 'Cập nhật' : 'Thêm nhân viên'}
        </Button>
      </Box>
    ) : (
      <Box layoutClassName="flex justify-end gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => setPanelOpen(false)}>
          Đóng
        </Button>
      </Box>
    );

  return (
    <PageContainer>
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-500" />
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
            Nhân viên
          </Heading>
          <Badge
            size="sm"
            layoutClassName="ml-1 px-2 py-0.5 text-xs font-semibold"
            backgroundClassName="bg-slate-100 dark:bg-slate-700"
            textClassName="text-slate-600 dark:text-slate-300"
          >
            {activeCount} đang làm / {employees.length} tổng
          </Badge>
        </Box>
        <Button type="button" variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Thêm nhân viên
        </Button>
      </Box>

      {/* Toolbar + danh sách trong 1 container (giống Orders) */}
      <Card
        padding="none"
        layoutClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box
          layoutClassName="flex flex-wrap items-center gap-3 px-4 py-3"
          borderClassName="border-b border-slate-100 dark:border-slate-700"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, chức vụ, SĐT…"
            containerClassName="max-w-sm"
          />
        </Box>

        <Box layoutClassName="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <Box layoutClassName="flex items-center justify-center py-16">
              <Spinner size="lg" textClassName="text-primary-500" />
            </Box>
          ) : error ? (
            <Box layoutClassName="p-4">
              <Typography size="sm" variant="danger">Không tải được danh sách nhân viên.</Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title={search ? 'Không tìm thấy nhân viên phù hợp.' : 'Chưa có nhân viên nào. Bấm "Thêm nhân viên".'}
            />
          ) : (
            <Box layoutClassName="overflow-x-auto">
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <TableHeaderCell layoutClassName="px-4 py-3">Tên</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">Chức vụ</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">SĐT</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">Ngày vào</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-right">Lương/giờ</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-right">Lương CB</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Trạng thái</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Khuôn mặt</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-right">Thao tác</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow
                    key={e.id}
                    borderClassName="border-b border-slate-100 dark:border-slate-700/60 last:border-0"
                    hoverClassName="hover:bg-slate-50/60 dark:hover:bg-slate-700/20"
                  >
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">
                        {e.name}
                      </Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{e.position || '—'}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" layoutClassName="font-mono" textClassName="text-slate-600 dark:text-slate-300">{e.phone || '—'}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{e.startDate || '—'}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-right">
                      {e.hourlyRate != null ? (
                        <Typography as="span" size="sm" layoutClassName="font-medium tabular-nums" textClassName="text-primary-600 dark:text-primary-400">
                          {formatVNDOrDash(e.hourlyRate)}
                        </Typography>
                      ) : (
                        <Badge size="sm" layoutClassName="px-2 py-0.5 text-xs" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">chưa đặt</Badge>
                      )}
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-right">
                      <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-700 dark:text-slate-200">
                        {formatVNDOrDash(e.baseSalary)}
                      </Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      <Badge
                        size="sm"
                        layoutClassName="inline-flex px-2 py-0.5 text-xs font-semibold"
                        backgroundClassName={e.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700'}
                        textClassName={e.status === 'active' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}
                      >
                        {employeeStatusLabel(e.status)}
                      </Badge>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      {(() => {
                        const fc = faceCountByEmployee.get(e.id) ?? 0;
                        return (
                          <Badge
                            size="sm"
                            layoutClassName="inline-flex px-2 py-0.5 text-xs font-semibold"
                            backgroundClassName={fc > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700'}
                            textClassName={fc > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}
                          >
                            {fc > 0 ? `${fc} mẫu` : 'chưa có'}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-right">
                      <Box layoutClassName="inline-flex items-center gap-1">
                        {isSuperAdmin && (
                          <IconButton
                            label="Đăng ký khuôn mặt"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEnroll({ employeeId: e.id, name: e.name })}
                          >
                            <ScanFace className="h-4 w-4 text-primary-500" />
                          </IconButton>
                        )}
                        <IconButton label="Sửa" size="sm" variant="ghost" onClick={() => openEdit(e)}>
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Xoá" size="sm" variant="ghost" onClick={() => handleDelete(e)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
          )}
        </Box>
      </Card>

      {/* Form panel */}
      <BaseSlidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editingId ? 'Sửa nhân viên' : 'Thêm nhân viên'}
        maxWidth="md"
        footer={panelFooter}
      >
        {/* Tab bar — chỉ hồ sơ đã lưu mới có tab Khuôn mặt (cần employeeId). */}
        {editingId ? (
          <Box
            layoutClassName="flex items-center gap-1 px-4 sm:px-6"
            borderClassName="border-b border-slate-100 dark:border-slate-700"
            backgroundClassName="bg-white dark:bg-slate-800"
          >
            <Button
              type="button"
              onClick={() => setPanelTab('info')}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              borderClassName={panelTab === 'info' ? 'border-b-2 border-primary-600' : 'border-b-2 border-transparent'}
              textClassName={
                panelTab === 'info'
                  ? 'text-sm font-medium text-primary-600 dark:text-primary-400'
                  : 'text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }
              layoutClassName="shrink-0 whitespace-nowrap rounded-none py-3.5 shadow-none"
              stateClassName="transition-colors"
            >
              Thông tin
            </Button>
            <Button
              type="button"
              onClick={() => setPanelTab('face')}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              borderClassName={panelTab === 'face' ? 'border-b-2 border-primary-600' : 'border-b-2 border-transparent'}
              textClassName={
                panelTab === 'face'
                  ? 'text-sm font-medium text-primary-600 dark:text-primary-400'
                  : 'text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }
              layoutClassName="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-none py-3.5 shadow-none"
              stateClassName="transition-colors"
              leftIcon={<ScanFace className="h-4 w-4" />}
            >
              Khuôn mặt
              {editingFaceCount > 0 ? (
                <Box
                  layoutClassName="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center px-1.5"
                  roundedClassName="rounded-full"
                  backgroundClassName="bg-emerald-100 dark:bg-emerald-900/40"
                  textClassName="text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
                >
                  {editingFaceCount}
                </Box>
              ) : null}
            </Button>
          </Box>
        ) : null}

        <Box layoutClassName={panelTab === 'info' ? 'space-y-4 p-4 sm:p-6' : 'hidden'}>
          <Field label="Họ tên" required htmlFor="emp-name">
            <Input id="emp-name" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Nguyễn Văn A" />
          </Field>
          <Field label="Tài khoản đăng nhập (để chấm công)" htmlFor="emp-account">
            <Select id="emp-account" value={form.email} onChange={(e) => pickAccount(e.target.value)} fullWidth>
              <option value="">— Không gắn tài khoản —</option>
              {form.email &&
                !accountOptions.some((a) => a.email.toLowerCase() === form.email.toLowerCase()) && (
                  <option value={form.email}>{form.email} (không có trong danh sách đăng nhập)</option>
                )}
              {accountOptions.map((a) => (
                <option key={a.email} value={a.email}>
                  {a.name} · {a.email}
                  {linkedEmails.has(a.email.toLowerCase()) ? ' — đã gắn NV khác' : ''}
                </option>
              ))}
            </Select>
          </Field>
          {form.email && linkedEmails.has(form.email.toLowerCase()) ? (
            <Typography size="xs" variant="danger">
              Email này đã gắn cho nhân viên khác — mỗi tài khoản chỉ nên gắn 1 hồ sơ.
            </Typography>
          ) : (
            <Typography size="xs" textClassName="text-slate-400 dark:text-slate-500">
              Chọn từ tài khoản đã đăng nhập hệ thống. Chưa thấy? Nhờ nhân viên đăng nhập Google 1 lần rồi mở lại.
            </Typography>
          )}
          <Box layoutClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Chức vụ" htmlFor="emp-position">
              <Input id="emp-position" value={form.position} onChange={(e) => setField('position', e.target.value)} placeholder="Thợ bánh, bán hàng…" />
            </Field>
            <Field label="Số điện thoại" htmlFor="emp-phone">
              <Input id="emp-phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="09xx xxx xxx" />
            </Field>
          </Box>
          <Box layoutClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ngày vào làm" htmlFor="emp-start">
              <DatePicker id="emp-start" value={form.startDate} onChange={(v) => setField('startDate', v)} fullWidth />
            </Field>
            <Field label="Lương cơ bản (VND)" htmlFor="emp-salary">
              <Input
                id="emp-salary"
                type="number"
                value={form.baseSalary}
                onChange={(e) => setField('baseSalary', e.target.value)}
                placeholder="8000000"
              />
            </Field>
          </Box>
          <Field label="Trạng thái" htmlFor="emp-status">
            <Select id="emp-status" value={form.status} onChange={(e) => setField('status', e.target.value as EmployeeStatus)} fullWidth>
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ghi chú" htmlFor="emp-note">
            <Textarea id="emp-note" value={form.note} onChange={(e) => setField('note', e.target.value)} rows={3} placeholder="Ghi chú thêm…" />
          </Field>

          {/* Mức lương/giờ theo NV (deal riêng) — chỉ khi đã có hồ sơ */}
          <WageSection employeeId={editingId} />
        </Box>

        {/* Tab Khuôn mặt — quản lý mẫu Face ID cho NV đang mở */}
        {editingId && panelTab === 'face' ? (
          <Box layoutClassName="space-y-4 p-4 sm:p-6">
            <Box
              layoutClassName="flex items-center justify-between gap-3 p-4"
              roundedClassName="rounded-xl"
              borderClassName="border border-slate-100 dark:border-slate-700"
              backgroundClassName="bg-white dark:bg-slate-800"
            >
              <Box layoutClassName="flex items-center gap-3">
                <Box
                  layoutClassName="flex h-10 w-10 items-center justify-center"
                  roundedClassName="rounded-full"
                  backgroundClassName={editingFaceCount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700'}
                >
                  <ScanFace className={editingFaceCount > 0 ? 'h-5 w-5 text-emerald-500' : 'h-5 w-5 text-slate-400'} />
                </Box>
                <Box layoutClassName="space-y-0.5">
                  <Typography size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                    {editingFaceCount > 0 ? `Đã đăng ký ${editingFaceCount} mẫu` : 'Chưa đăng ký khuôn mặt'}
                  </Typography>
                  <Typography size="xs" textClassName="text-slate-400 dark:text-slate-500">
                    Face ID dùng để nhân viên tự chấm công.
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
              Đăng ký khuôn mặt để nhân viên chấm công bằng Face ID. Mỗi NV nên chụp vài góc mặt (thẳng, trái, phải).
            </Typography>

            {isSuperAdmin ? (
              <Box layoutClassName="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<ScanFace className="h-4 w-4" />}
                  onClick={() => editingEmployee && setEnroll({ employeeId: editingEmployee.id, name: editingEmployee.name })}
                >
                  {editingFaceCount > 0 ? 'Đăng ký lại' : 'Đăng ký khuôn mặt'}
                </Button>
                {editingFaceCount > 0 && editingEmployee ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4 text-rose-500" />}
                    onClick={() => handleClearFace(editingEmployee.id, editingEmployee.name)}
                  >
                    Xoá dữ liệu khuôn mặt
                  </Button>
                ) : null}
              </Box>
            ) : (
              <Typography size="xs" variant="muted">
                Chỉ super admin mới đăng ký / xoá khuôn mặt.
              </Typography>
            )}
          </Box>
        ) : null}
      </BaseSlidePanel>

      {/* Modal đăng ký khuôn mặt (dùng chung cho nút ở list + tab Khuôn mặt) */}
      <FaceEnrollModal
        isOpen={!!enroll}
        onClose={() => setEnroll(null)}
        employee={enroll}
        onDone={() => setEnroll(null)}
      />
    </PageContainer>
  );
};

export default EmployeesPage;
