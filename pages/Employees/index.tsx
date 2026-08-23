import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmployees, useEmployeeMutations } from '@/hooks/queries/useEmployeesQuery';
import { useUsers } from '@/hooks/queries/useUsersQuery';
import {
  Employee,
  EMPLOYEE_STATUSES,
  EmployeeStatus,
  employeeStatusLabel,
} from '@/types/employee';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
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

const EmployeesPage: React.FC = () => {
  const { employees, loading, error } = useEmployees();
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployeeMutations();
  const { users } = useUsers();

  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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
    setPanelOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditingId(e.id);
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

  const panelFooter = (
    <Box layoutClassName="flex justify-end gap-3">
      <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => setPanelOpen(false)}>
        Huỷ
      </Button>
      <Button type="button" variant="primary" size="sm" disabled={saving} onClick={handleSave}>
        {saving ? 'Đang lưu…' : editingId ? 'Cập nhật' : 'Thêm nhân viên'}
      </Button>
    </Box>
  );

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
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

      {/* Search */}
      <Card
        padding="md"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, chức vụ, SĐT…"
          containerClassName="max-w-sm"
        />
      </Card>

      {/* List */}
      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center py-16">
          <Spinner size="lg" textClassName="text-primary-500" />
        </Box>
      ) : error ? (
        <Typography size="sm" variant="danger">Không tải được danh sách nhân viên.</Typography>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={search ? 'Không tìm thấy nhân viên phù hợp.' : 'Chưa có nhân viên nào. Bấm "Thêm nhân viên".'}
        />
      ) : (
        <Card
          padding="none"
          layoutClassName="flex-1 overflow-hidden"
          borderClassName="border border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
        >
          <Box layoutClassName="overflow-x-auto">
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <TableHeaderCell layoutClassName="px-4 py-3">Tên</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">Chức vụ</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">SĐT</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">Ngày vào</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-right">Lương CB</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Trạng thái</TableHeaderCell>
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
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-right">
                      <Box layoutClassName="inline-flex items-center gap-1">
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
        </Card>
      )}

      {/* Form panel */}
      <BaseSlidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editingId ? 'Sửa nhân viên' : 'Thêm nhân viên'}
        maxWidth="md"
        footer={panelFooter}
      >
        <Box layoutClassName="space-y-4 p-4 sm:p-6">
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
        </Box>
      </BaseSlidePanel>
    </Box>
  );
};

export default EmployeesPage;
