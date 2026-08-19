import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Truck, Bus, Plus, Trash2, Check, Phone, Route as RouteIcon, MapPin } from 'lucide-react';
import { useCarriers, useCarrierMutations } from '@/hooks/queries/useCarriersQuery';
import { CarrierType } from '@/services/carrierService';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import IconButton from '@/components/ui/IconButton';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';

type Draft = { name: string; phone: string; note: string; route: string; station: string };

/** Danh bạ Đơn vị vận chuyển — 2 dạng: Truyền thống (express) & Gửi xe khách (coach). */
const CarriersPage: React.FC = () => {
  const { carriers, loading } = useCarriers();
  const { save, remove, saving } = useCarrierMutations();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  // form thêm mới
  const [nt, setNt] = useState<CarrierType>('express');
  const [nName, setNName] = useState('');
  const [nPhone, setNPhone] = useState('');
  const [nRoute, setNRoute] = useState('');
  const [nStation, setNStation] = useState('');

  useEffect(() => {
    setDrafts(Object.fromEntries(carriers.map((c) => [c.id, {
      name: c.name, phone: c.phone ?? '', note: c.note ?? '', route: c.route ?? '', station: c.station ?? '',
    }])));
  }, [carriers]);

  const setField = (id: string, k: keyof Draft, v: string) =>
    setDrafts((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));

  const changed = (id: string) => {
    const c = carriers.find((x) => x.id === id);
    const d = drafts[id];
    if (!c || !d) return false;
    return d.name !== c.name || d.phone !== (c.phone ?? '') || d.note !== (c.note ?? '')
      || d.route !== (c.route ?? '') || d.station !== (c.station ?? '');
  };

  const saveRow = async (id: string, type: CarrierType) => {
    const d = drafts[id];
    if (!d?.name.trim()) return;
    try {
      await save({ id, type, name: d.name.trim(), phone: d.phone.trim() || null, note: d.note.trim() || null, route: d.route.trim() || null, station: d.station.trim() || null });
      toast.success('Đã lưu');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Lưu thất bại'); }
  };
  const toggleActive = async (id: string, active: boolean) => {
    const c = carriers.find((x) => x.id === id);
    if (!c) return;
    try { await save({ id, type: c.type, name: c.name, phone: c.phone, note: c.note, route: c.route, station: c.station, active }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Lỗi'); }
  };
  const add = async () => {
    if (!nName.trim()) return;
    try {
      await save({ type: nt, name: nName.trim(), phone: nPhone.trim() || null, route: nt === 'coach' ? (nRoute.trim() || null) : null, station: nt === 'coach' ? (nStation.trim() || null) : null });
      setNName(''); setNPhone(''); setNRoute(''); setNStation('');
      toast.success('Đã thêm đơn vị vận chuyển');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Thêm thất bại'); }
  };
  const del = async (id: string) => {
    try { await remove(id); toast.success('Đã xoá'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Xoá thất bại'); }
  };

  const express = carriers.filter((c) => c.type !== 'coach');
  const coach = carriers.filter((c) => c.type === 'coach');

  const typeBtn = (v: CarrierType, label: string, icon: React.ReactNode) => (
    <Button
      type="button"
      onClick={() => setNt(v)}
      variant={nt === v ? 'primary' : 'secondary'}
      leftIcon={icon}
      iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
      sizeClassName="px-3 py-1.5 text-sm"
      roundedClassName="rounded-lg"
      borderClassName={nt === v ? 'border border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
      backgroundClassName={nt === v ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
      textClassName={nt === v ? 'font-medium text-white' : 'text-slate-600 dark:text-slate-300'}
      layoutClassName="inline-flex items-center gap-1.5"
      disableVariantHover
      disableVariantTextColor
    >
      {label}
    </Button>
  );

  const carrierRow = (c: (typeof carriers)[number]) => {
    const d = drafts[c.id] ?? { name: c.name, phone: c.phone ?? '', note: c.note ?? '', route: c.route ?? '', station: c.station ?? '' };
    const isCoach = c.type === 'coach';
    return (
      <Card key={c.id} padding="none" borderClassName="border border-slate-200 dark:border-slate-700" roundedClassName="rounded-xl" layoutClassName="flex flex-wrap items-center gap-x-2 gap-y-1 p-2.5" backgroundClassName={c.active ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/40'}>
        <Box layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" backgroundClassName={isCoach ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary-100 dark:bg-primary-900/30'}>
          {isCoach ? <Bus className="h-4 w-4 text-amber-600 dark:text-amber-400" /> : <Truck className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
        </Box>
        <Input value={d.name} onChange={(e) => setField(c.id, 'name', e.target.value)} placeholder={isCoach ? 'Tên nhà xe' : 'Tên đơn vị'} sizeClassName="w-40 min-w-0 px-2 py-1 text-sm" borderClassName="border border-transparent" backgroundClassName="bg-transparent" textClassName="font-semibold text-slate-800 dark:text-slate-100" />
        <Box layoutClassName="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <Input value={d.phone} onChange={(e) => setField(c.id, 'phone', e.target.value)} placeholder="SĐT" sizeClassName="w-28 px-1.5 py-1 text-sm" borderClassName="border border-transparent" backgroundClassName="bg-transparent" textClassName="text-slate-600 dark:text-slate-300" />
        </Box>
        {isCoach && (
          <>
            <Box layoutClassName="flex items-center gap-1">
              <RouteIcon className="h-3.5 w-3.5 text-slate-400" />
              <Input value={d.route} onChange={(e) => setField(c.id, 'route', e.target.value)} placeholder="Tuyến" sizeClassName="w-40 px-1.5 py-1 text-sm" borderClassName="border border-transparent" backgroundClassName="bg-transparent" textClassName="text-slate-600 dark:text-slate-300" />
            </Box>
            <Box layoutClassName="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <Input value={d.station} onChange={(e) => setField(c.id, 'station', e.target.value)} placeholder="Bến đỗ" sizeClassName="w-40 px-1.5 py-1 text-sm" borderClassName="border border-transparent" backgroundClassName="bg-transparent" textClassName="text-slate-600 dark:text-slate-300" />
            </Box>
          </>
        )}
        <Input value={d.note} onChange={(e) => setField(c.id, 'note', e.target.value)} placeholder="Ghi chú" sizeClassName="min-w-0 flex-1 px-2 py-1 text-sm" borderClassName="border border-transparent" backgroundClassName="bg-transparent" textClassName="text-slate-500 dark:text-slate-400" />
        <Box layoutClassName="ml-auto flex items-center gap-1.5">
          {changed(c.id) && (
            <IconButton type="button" label="Lưu" onClick={() => void saveRow(c.id, c.type)} disabled={saving} variant="ghost" textClassName="text-emerald-600" hoverClassName="hover:text-emerald-700"><Check className="h-4 w-4" /></IconButton>
          )}
          <Switch checked={c.active} onCheckedChange={(v) => void toggleActive(c.id, v)} aria-label={`Bật/tắt ${c.name}`} />
          <IconButton type="button" label="Xoá" onClick={() => void del(c.id)} disabled={saving} variant="ghost" textClassName="text-rose-400" hoverClassName="hover:text-rose-600"><Trash2 className="h-4 w-4" /></IconButton>
        </Box>
      </Card>
    );
  };

  const groupHeader = (label: string, icon: React.ReactNode, count: number) => (
    <Box layoutClassName="flex items-center gap-2 pt-1">
      {icon}
      <Typography size="xs" layoutClassName="font-bold uppercase tracking-wider" textClassName="text-slate-500 dark:text-slate-400">{label}</Typography>
      <Typography size="xs" variant="muted">({count})</Typography>
      <Box layoutClassName="h-px flex-1" backgroundClassName="bg-slate-100 dark:bg-slate-700/60" />
    </Box>
  );

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex items-center gap-2.5">
        <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-xl" backgroundClassName="bg-primary-100 dark:bg-primary-900/30">
          <Truck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </Box>
        <Box>
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">Đơn vị vận chuyển</Heading>
          <Typography as="p" size="xs" variant="muted">Đơn vị truyền thống (SPX, J&T…) và gửi xe khách (nhà xe, bến đỗ).</Typography>
        </Box>
      </Box>

      {/* Thêm mới — chọn dạng */}
      <Card padding="md" borderClassName="border border-slate-200 dark:border-slate-700" roundedClassName="rounded-xl" layoutClassName="space-y-2.5 p-3">
        <Box layoutClassName="flex flex-wrap items-center gap-2">
          {typeBtn('express', 'Truyền thống', <Truck />)}
          {typeBtn('coach', 'Gửi xe khách', <Bus />)}
        </Box>
        <Box layoutClassName="flex flex-wrap items-center gap-2">
          <Input value={nName} onChange={(e) => setNName(e.target.value)} placeholder={nt === 'coach' ? 'Tên nhà xe (vd Phương Trang)' : 'Tên đơn vị (vd SPX, GHTK)'} sizeClassName="w-52 min-w-0 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" onKeyDown={(e) => { if (e.key === 'Enter') void add(); }} />
          <Input value={nPhone} onChange={(e) => setNPhone(e.target.value)} placeholder="Số điện thoại" sizeClassName="w-40 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" onKeyDown={(e) => { if (e.key === 'Enter') void add(); }} />
          {nt === 'coach' && (
            <>
              <Input value={nRoute} onChange={(e) => setNRoute(e.target.value)} placeholder="Tuyến (Sài Gòn – Đà Lạt)" sizeClassName="w-48 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" onKeyDown={(e) => { if (e.key === 'Enter') void add(); }} />
              <Input value={nStation} onChange={(e) => setNStation(e.target.value)} placeholder="Bến đỗ / điểm gửi" sizeClassName="w-48 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" onKeyDown={(e) => { if (e.key === 'Enter') void add(); }} />
            </>
          )}
          <Button type="button" onClick={() => void add()} disabled={saving || !nName.trim()} variant="primary" leftIcon={<Plus />} iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4" sizeClassName="px-3.5 py-1.5 text-sm" roundedClassName="rounded-lg" backgroundClassName="bg-primary-600" hoverClassName="hover:bg-primary-700" textClassName="font-medium text-white" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>
            Thêm
          </Button>
        </Box>
      </Card>

      {loading ? (
        <Box layoutClassName="flex items-center gap-2 py-8"><Spinner /><Typography size="sm" variant="muted">Đang tải…</Typography></Box>
      ) : carriers.length === 0 ? (
        <Box layoutClassName="flex flex-col items-center gap-2 py-10 text-center">
          <Truck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <Typography size="sm" variant="muted">Chưa có đơn vị vận chuyển nào. Thêm ở trên.</Typography>
        </Box>
      ) : (
        <Box layoutClassName="space-y-3">
          {express.length > 0 && (
            <Box layoutClassName="space-y-2">
              {groupHeader('Đơn vị truyền thống', <Truck className="h-4 w-4 text-primary-500" />, express.length)}
              {express.map(carrierRow)}
            </Box>
          )}
          {coach.length > 0 && (
            <Box layoutClassName="space-y-2">
              {groupHeader('Gửi xe khách', <Bus className="h-4 w-4 text-amber-500" />, coach.length)}
              {coach.map(carrierRow)}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CarriersPage;
