import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Truck, Bus, Plus, Trash2, Pencil, Phone, Route as RouteIcon, MapPin } from 'lucide-react';
import { useCarriers, useCarrierMutations } from '@/hooks/queries/useCarriersQuery';
import { Carrier, CarrierType } from '@/services/carrierService';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import IconButton from '@/components/ui/IconButton';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import BaseSlidePanel from '@/components/BaseSlidePanel';

type Form = { type: CarrierType; name: string; phone: string; route: string; station: string; note: string; active: boolean };
const emptyForm: Form = { type: 'express', name: '', phone: '', route: '', station: '', note: '', active: true };

/** Danh bạ Đơn vị vận chuyển — bảng + panel trượt để thêm/sửa. 2 dạng: Truyền thống & Gửi xe khách. */
const CarriersPage: React.FC = () => {
  const { carriers, loading } = useCarriers();
  const { save, remove, saving } = useCarrierMutations();
  const [tab, setTab] = useState<CarrierType>('express');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const coachList = carriers.filter((c) => c.type === 'coach');
  const expressList = carriers.filter((c) => c.type !== 'coach');
  const list = tab === 'coach' ? coachList : expressList;

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm, type: tab }); setOpen(true); };
  const openEdit = (c: Carrier) => {
    setEditId(c.id);
    setForm({ type: c.type, name: c.name, phone: c.phone ?? '', route: c.route ?? '', station: c.station ?? '', note: c.note ?? '', active: c.active });
    setOpen(true);
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Nhập tên đơn vị.'); return; }
    try {
      await save({
        ...(editId ? { id: editId } : {}),
        type: form.type,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        route: form.type === 'coach' ? (form.route.trim() || null) : null,
        station: form.type === 'coach' ? (form.station.trim() || null) : null,
        note: form.note.trim() || null,
        active: form.active,
      });
      toast.success(editId ? 'Đã lưu' : 'Đã thêm đơn vị vận chuyển');
      setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Lưu thất bại'); }
  };

  const toggleActive = async (c: Carrier, active: boolean) => {
    try { await save({ id: c.id, type: c.type, name: c.name, phone: c.phone, route: c.route, station: c.station, note: c.note, active }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Lỗi'); }
  };
  const del = async (id: string) => {
    try { await remove(id); toast.success('Đã xoá'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Xoá thất bại'); }
  };

  const typeBtn = (v: CarrierType, label: string, icon: React.ReactNode) => (
    <Button
      type="button" onClick={() => set('type', v)}
      variant={form.type === v ? 'primary' : 'secondary'}
      leftIcon={icon} iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
      sizeClassName="flex-1 px-3 py-2 text-sm" roundedClassName="rounded-lg"
      borderClassName={form.type === v ? 'border border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
      backgroundClassName={form.type === v ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
      textClassName={form.type === v ? 'font-medium text-white' : 'text-slate-600 dark:text-slate-300'}
      layoutClassName="inline-flex items-center justify-center gap-1.5"
      disableVariantHover disableVariantTextColor
    >
      {label}
    </Button>
  );

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2.5">
          <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-xl" backgroundClassName="bg-primary-100 dark:bg-primary-900/30">
            <Truck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </Box>
          <Box>
            <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">Đơn vị vận chuyển</Heading>
            <Typography as="p" size="xs" variant="muted">Đơn vị truyền thống (SPX, J&T…) và gửi xe khách (nhà xe, bến đỗ).</Typography>
          </Box>
        </Box>
        <Button type="button" onClick={openCreate} variant="primary" leftIcon={<Plus />} iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4" sizeClassName="px-3.5 py-2 text-sm" roundedClassName="rounded-lg" backgroundClassName="bg-primary-600" hoverClassName="hover:bg-primary-700" textClassName="font-medium text-white" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>
          Thêm đơn vị
        </Button>
      </Box>

      {/* Tab: Chuyển phát (truyền thống) / Nhà xe (xe khách) */}
      <Box layoutClassName="flex items-center gap-1 rounded-xl p-1" backgroundClassName="bg-slate-100 dark:bg-slate-800/60">
        {([
          { key: 'express' as CarrierType, label: 'Chuyển phát', icon: <Truck className="h-4 w-4" />, count: expressList.length },
          { key: 'coach' as CarrierType, label: 'Nhà xe', icon: <Bus className="h-4 w-4" />, count: coachList.length },
        ]).map((tb) => {
          const on = tab === tb.key;
          return (
            <Button
              key={tb.key}
              type="button"
              onClick={() => setTab(tb.key)}
              variant={on ? 'primary' : 'ghost'}
              leftIcon={tb.icon}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              layoutClassName="inline-flex flex-1 items-center justify-center gap-1.5"
              sizeClassName="px-3 py-2 text-sm"
              roundedClassName="rounded-lg"
              backgroundClassName={on ? 'bg-white dark:bg-slate-700' : 'bg-transparent'}
              shadowClassName={on ? 'shadow-sm' : ''}
              textClassName={on ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}
              disableVariantHover
            >
              {tb.label} ({tb.count})
            </Button>
          );
        })}
      </Box>

      {loading ? (
        <Box layoutClassName="flex items-center gap-2 py-8"><Spinner /><Typography size="sm" variant="muted">Đang tải…</Typography></Box>
      ) : list.length === 0 ? (
        <Box layoutClassName="flex flex-col items-center gap-2 py-12 text-center">
          {tab === 'coach' ? <Bus className="h-10 w-10 text-slate-300 dark:text-slate-600" /> : <Truck className="h-10 w-10 text-slate-300 dark:text-slate-600" />}
          <Typography size="sm" variant="muted">{tab === 'coach' ? 'Chưa có nhà xe nào.' : 'Chưa có đơn vị chuyển phát nào.'}</Typography>
        </Box>
      ) : (
        <Box layoutClassName="overflow-x-auto rounded-xl" borderClassName="border border-slate-200 dark:border-slate-700">
          <Box layoutClassName="min-w-[560px]">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell layoutClassName="px-4 py-3 text-left">Đơn vị</TableHeaderCell>
                <TableHeaderCell layoutClassName="px-3 py-3 text-left">Liên hệ</TableHeaderCell>
                {tab === 'coach' && <TableHeaderCell layoutClassName="px-3 py-3 text-left">Tuyến / Bến đỗ</TableHeaderCell>}
                <TableHeaderCell layoutClassName="px-3 py-3 text-center">Bật</TableHeaderCell>
                <TableHeaderCell layoutClassName="px-3 py-3 text-right">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((c) => {
                const isCoach = c.type === 'coach';
                return (
                  <TableRow key={c.id}>
                    <TableCell layoutClassName="px-4 py-2.5">
                      <Box layoutClassName="flex items-center gap-2.5">
                        <Box layoutClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" backgroundClassName={isCoach ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary-100 dark:bg-primary-900/30'}>
                          {isCoach ? <Bus className="h-4 w-4 text-amber-600 dark:text-amber-400" /> : <Truck className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                        </Box>
                        <Typography size="sm" layoutClassName="font-semibold" textClassName={c.active ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>{c.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell layoutClassName="px-3 py-2.5">
                      {c.phone ? (
                        <Box layoutClassName="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <Typography size="sm" textClassName="text-slate-600 dark:text-slate-300">{c.phone}</Typography>
                        </Box>
                      ) : <Typography size="sm" variant="muted">—</Typography>}
                    </TableCell>
                    {tab === 'coach' && (
                    <TableCell layoutClassName="px-3 py-2.5">
                      {isCoach && (c.route || c.station) ? (
                        <Box layoutClassName="flex flex-col gap-0.5">
                          {c.route && <Box layoutClassName="flex items-center gap-1"><RouteIcon className="h-3 w-3 text-slate-400" /><Typography size="xs" textClassName="text-slate-600 dark:text-slate-300">{c.route}</Typography></Box>}
                          {c.station && <Box layoutClassName="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" /><Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">{c.station}</Typography></Box>}
                        </Box>
                      ) : <Typography size="sm" variant="muted">—</Typography>}
                    </TableCell>
                    )}
                    <TableCell layoutClassName="px-3 py-2.5 text-center">
                      <Switch checked={c.active} onCheckedChange={(v) => void toggleActive(c, v)} aria-label={`Bật/tắt ${c.name}`} />
                    </TableCell>
                    <TableCell layoutClassName="px-3 py-2.5">
                      <Box layoutClassName="flex items-center justify-end gap-1">
                        <IconButton type="button" label="Sửa" onClick={() => openEdit(c)} variant="ghost" textClassName="text-slate-400" hoverClassName="hover:text-primary-600"><Pencil className="h-4 w-4" /></IconButton>
                        <IconButton type="button" label="Xoá" onClick={() => void del(c.id)} disabled={saving} variant="ghost" textClassName="text-rose-400" hoverClassName="hover:text-rose-600"><Trash2 className="h-4 w-4" /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </Box>
        </Box>
      )}

      {/* Panel trượt thêm/sửa */}
      <BaseSlidePanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Sửa đơn vị vận chuyển' : 'Thêm đơn vị vận chuyển'}
        maxWidth="md"
        footer={
          <Box layoutClassName="flex justify-end gap-2">
            <Button type="button" onClick={() => setOpen(false)} variant="secondary" sizeClassName="px-4 py-2 text-sm" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" backgroundClassName="bg-white dark:bg-slate-800" textClassName="text-slate-700 dark:text-slate-200">Huỷ</Button>
            <Button type="button" onClick={() => void submit()} disabled={saving || !form.name.trim()} variant="primary" sizeClassName="px-4 py-2 text-sm" roundedClassName="rounded-lg" backgroundClassName="bg-primary-600" hoverClassName="hover:bg-primary-700" textClassName="font-medium text-white" disableVariantHover>
              {editId ? 'Lưu' : 'Thêm'}
            </Button>
          </Box>
        }
      >
        <Box layoutClassName="space-y-4 p-6">
          <Box layoutClassName="space-y-1.5">
            <Label className="mb-0">Dạng đơn vị</Label>
            <Box layoutClassName="flex gap-2">
              {typeBtn('express', 'Truyền thống', <Truck />)}
              {typeBtn('coach', 'Gửi xe khách', <Bus />)}
            </Box>
          </Box>
          <Box layoutClassName="space-y-1.5">
            <Label className="mb-0">{form.type === 'coach' ? 'Tên nhà xe' : 'Tên đơn vị'}</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={form.type === 'coach' ? 'vd Phương Trang' : 'vd SPX, J&T, GHTK'} sizeClassName="w-full px-3 py-2 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" />
          </Box>
          <Box layoutClassName="space-y-1.5">
            <Label className="mb-0">Số điện thoại</Label>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Số điện thoại liên hệ" sizeClassName="w-full px-3 py-2 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" />
          </Box>
          {form.type === 'coach' && (
            <>
              <Box layoutClassName="space-y-1.5">
                <Label className="mb-0">Tuyến chạy</Label>
                <Input value={form.route} onChange={(e) => set('route', e.target.value)} placeholder="vd Sài Gòn – Đà Lạt" sizeClassName="w-full px-3 py-2 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" />
              </Box>
              <Box layoutClassName="space-y-1.5">
                <Label className="mb-0">Bến đỗ / điểm gửi</Label>
                <Input value={form.station} onChange={(e) => set('station', e.target.value)} placeholder="vd Bến xe Miền Đông" sizeClassName="w-full px-3 py-2 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" />
              </Box>
            </>
          )}
          <Box layoutClassName="space-y-1.5">
            <Label className="mb-0">Ghi chú</Label>
            <Input value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Ghi chú (tuỳ chọn)" sizeClassName="w-full px-3 py-2 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" />
          </Box>
          <Box layoutClassName="flex items-center justify-between rounded-lg px-3 py-2" borderClassName="border border-slate-200 dark:border-slate-700">
            <Typography size="sm" textClassName="text-slate-700 dark:text-slate-200">Đang hoạt động</Typography>
            <Switch checked={form.active} onCheckedChange={(v) => set('active', v)} aria-label="Bật/tắt hoạt động" />
          </Box>
        </Box>
      </BaseSlidePanel>
    </Box>
  );
};

export default CarriersPage;
