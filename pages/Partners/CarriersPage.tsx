import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Truck, Bus, Plus, Trash2, Pencil, Phone, Route as RouteIcon, MapPin, X } from 'lucide-react';
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

type OfficeForm = { name: string; address: string; landmark: string; phone: string };
type RouteForm = { from: string; to: string; price: string; departTime: string; arriveTime: string; note: string };
type Form = { type: CarrierType; name: string; phone: string; note: string; active: boolean; offices: OfficeForm[]; routes: RouteForm[] };
const emptyForm: Form = { type: 'express', name: '', phone: '', note: '', active: true, offices: [], routes: [] };
const emptyOffice: OfficeForm = { name: '', address: '', landmark: '', phone: '' };
const emptyRoute: RouteForm = { from: '', to: '', price: '', departTime: '', arriveTime: '', note: '' };

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
    setForm({
      type: c.type, name: c.name, phone: c.phone ?? '', note: c.note ?? '', active: c.active,
      offices: (c.offices ?? []).map((o) => ({ name: o.name ?? '', address: o.address ?? '', landmark: o.landmark ?? '', phone: o.phone ?? '' })),
      routes: (c.routes ?? []).map((r) => ({ from: r.from ?? '', to: r.to ?? '', price: r.price != null ? String(r.price) : '', departTime: r.departTime ?? '', arriveTime: r.arriveTime ?? '', note: r.note ?? '' })),
    });
    setOpen(true);
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Văn phòng (coach) — dòng lặp thêm/xoá.
  const addOffice = () => setForm((f) => ({ ...f, offices: [...f.offices, { ...emptyOffice }] }));
  const setOffice = (i: number, k: keyof OfficeForm, v: string) => setForm((f) => ({ ...f, offices: f.offices.map((o, idx) => (idx === i ? { ...o, [k]: v } : o)) }));
  const removeOffice = (i: number) => setForm((f) => ({ ...f, offices: f.offices.filter((_, idx) => idx !== i) }));
  // Tuyến (coach) — dòng lặp thêm/xoá.
  const addRoute = () => setForm((f) => ({ ...f, routes: [...f.routes, { ...emptyRoute }] }));
  const setRoute = (i: number, k: keyof RouteForm, v: string) => setForm((f) => ({ ...f, routes: f.routes.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)) }));
  const removeRoute = (i: number) => setForm((f) => ({ ...f, routes: f.routes.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Nhập tên đơn vị.'); return; }
    const offices = form.type === 'coach'
      ? form.offices
          .map((o) => ({ name: o.name.trim() || undefined, address: o.address.trim(), landmark: o.landmark.trim() || undefined, phone: o.phone.trim() || undefined }))
          .filter((o) => o.address)
      : [];
    const routes = form.type === 'coach'
      ? form.routes
          .map((r) => ({ from: r.from.trim(), to: r.to.trim(), price: r.price.trim() ? Number(r.price) : undefined, departTime: r.departTime.trim() || undefined, arriveTime: r.arriveTime.trim() || undefined, note: r.note.trim() || undefined }))
          .filter((r) => r.from || r.to)
      : [];
    try {
      await save({
        ...(editId ? { id: editId } : {}),
        type: form.type,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        route: null,
        station: null,
        note: form.note.trim() || null,
        offices,
        routes,
        active: form.active,
      });
      toast.success(editId ? 'Đã lưu' : 'Đã thêm đơn vị vận chuyển');
      setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Lưu thất bại'); }
  };

  const toggleActive = async (c: Carrier, active: boolean) => {
    // Không gửi offices/routes → BE giữ nguyên (chỉ đổi active).
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
                {tab !== 'coach' && <TableHeaderCell layoutClassName="px-3 py-3 text-center">Số đơn đã gửi</TableHeaderCell>}
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
                      {isCoach && (c.routes.length > 0 || c.offices.length > 0) ? (
                        <Box layoutClassName="flex flex-col gap-0.5">
                          {c.routes.slice(0, 2).map((r, i) => (
                            <Box key={i} layoutClassName="flex items-center gap-1">
                              <RouteIcon className="h-3 w-3 text-slate-400" />
                              <Typography size="xs" textClassName="text-slate-600 dark:text-slate-300">{r.from} → {r.to}{r.price != null ? ` · ${r.price.toLocaleString('vi-VN')}đ` : ''}</Typography>
                            </Box>
                          ))}
                          {c.routes.length > 2 && <Typography size="xs" variant="muted">+{c.routes.length - 2} tuyến</Typography>}
                          {c.offices.length > 0 && <Box layoutClassName="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" /><Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">{c.offices.length} văn phòng</Typography></Box>}
                        </Box>
                      ) : <Typography size="sm" variant="muted">—</Typography>}
                    </TableCell>
                    )}
                    {tab !== 'coach' && (
                    <TableCell layoutClassName="px-3 py-2.5 text-center">
                      <Box layoutClassName="inline-flex min-w-[2.25rem] items-center justify-center px-2 py-0.5" roundedClassName="rounded-full" backgroundClassName={c.orderCount > 0 ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-slate-100 dark:bg-slate-800'}>
                        <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName={c.orderCount > 0 ? 'text-primary-700 dark:text-primary-300' : 'text-slate-400 dark:text-slate-500'}>{c.orderCount}</Typography>
                      </Box>
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
              {/* Văn phòng gửi/nhận — dòng lặp */}
              <Box layoutClassName="space-y-2">
                <Box layoutClassName="flex items-center justify-between">
                  <Label className="mb-0">Văn phòng gửi / nhận</Label>
                  <Button type="button" onClick={addOffice} variant="ghost" leftIcon={<Plus />} iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5" sizeClassName="px-2 py-1 text-xs" roundedClassName="rounded-md" backgroundClassName="bg-slate-100 dark:bg-slate-800" textClassName="font-medium text-slate-600 dark:text-slate-300" layoutClassName="inline-flex items-center gap-1">Thêm VP</Button>
                </Box>
                {form.offices.length === 0 ? (
                  <Typography size="xs" variant="muted">Chưa có văn phòng nào.</Typography>
                ) : form.offices.map((o, i) => (
                  <Box key={i} layoutClassName="space-y-2 rounded-lg p-3" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-slate-50 dark:bg-slate-800/40">
                    <Box layoutClassName="flex items-center gap-2">
                      <Input value={o.name} onChange={(e) => setOffice(i, 'name', e.target.value)} placeholder="Tên VP (vd VP1)" sizeClassName="w-32 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                      <Input value={o.phone} onChange={(e) => setOffice(i, 'phone', e.target.value)} placeholder="SĐT" sizeClassName="flex-1 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                      <IconButton type="button" label="Xoá VP" onClick={() => removeOffice(i)} variant="ghost" textClassName="text-rose-400" hoverClassName="hover:text-rose-600"><X className="h-4 w-4" /></IconButton>
                    </Box>
                    <Input value={o.address} onChange={(e) => setOffice(i, 'address', e.target.value)} placeholder="Địa chỉ" sizeClassName="w-full px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                    <Input value={o.landmark} onChange={(e) => setOffice(i, 'landmark', e.target.value)} placeholder="Mốc gần (vd gần BX Mỹ Đình)" sizeClassName="w-full px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                  </Box>
                ))}
              </Box>

              {/* Tuyến chạy — dòng lặp */}
              <Box layoutClassName="space-y-2">
                <Box layoutClassName="flex items-center justify-between">
                  <Label className="mb-0">Tuyến chạy</Label>
                  <Button type="button" onClick={addRoute} variant="ghost" leftIcon={<Plus />} iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5" sizeClassName="px-2 py-1 text-xs" roundedClassName="rounded-md" backgroundClassName="bg-slate-100 dark:bg-slate-800" textClassName="font-medium text-slate-600 dark:text-slate-300" layoutClassName="inline-flex items-center gap-1">Thêm tuyến</Button>
                </Box>
                {form.routes.length === 0 ? (
                  <Typography size="xs" variant="muted">Chưa có tuyến nào.</Typography>
                ) : form.routes.map((r, i) => (
                  <Box key={i} layoutClassName="space-y-2 rounded-lg p-3" borderClassName="border border-slate-200 dark:border-slate-700" backgroundClassName="bg-slate-50 dark:bg-slate-800/40">
                    <Box layoutClassName="flex items-center gap-2">
                      <Input value={r.from} onChange={(e) => setRoute(i, 'from', e.target.value)} placeholder="Điểm đi (Huế)" sizeClassName="flex-1 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                      <Typography as="span" size="sm" variant="muted">→</Typography>
                      <Input value={r.to} onChange={(e) => setRoute(i, 'to', e.target.value)} placeholder="Điểm đến (Hải Phòng)" sizeClassName="flex-1 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                      <IconButton type="button" label="Xoá tuyến" onClick={() => removeRoute(i)} variant="ghost" textClassName="text-rose-400" hoverClassName="hover:text-rose-600"><X className="h-4 w-4" /></IconButton>
                    </Box>
                    <Box layoutClassName="grid grid-cols-3 gap-2">
                      <Input value={r.price} onChange={(e) => setRoute(i, 'price', e.target.value)} type="number" placeholder="Giá (VND)" sizeClassName="w-full px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                      <Input value={r.departTime} onChange={(e) => setRoute(i, 'departTime', e.target.value)} placeholder="Giờ chạy (17h)" sizeClassName="w-full px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                      <Input value={r.arriveTime} onChange={(e) => setRoute(i, 'arriveTime', e.target.value)} placeholder="Giờ tới (5h sáng)" sizeClassName="w-full px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                    </Box>
                    <Input value={r.note} onChange={(e) => setRoute(i, 'note', e.target.value)} placeholder="Ghi chú tuyến (điểm nhận, loại hàng…)" sizeClassName="w-full px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-md" />
                  </Box>
                ))}
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
