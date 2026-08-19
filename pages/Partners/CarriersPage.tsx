import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Truck, Plus, Trash2, Check, Phone } from 'lucide-react';
import { useCarriers, useCarrierMutations } from '@/hooks/queries/useCarriersQuery';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import IconButton from '@/components/ui/IconButton';
import Switch from '@/components/ui/Switch';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';

type Draft = { name: string; phone: string; note: string };

/** Danh bạ Đơn vị vận chuyển — thêm/sửa/xoá + bật/tắt. Nằm trong hub Đối tác. */
const CarriersPage: React.FC = () => {
  const { carriers, loading } = useCarriers();
  const { save, remove, saving } = useCarrierMutations();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [nn, setNn] = useState('');
  const [np, setNp] = useState('');

  useEffect(() => {
    setDrafts(Object.fromEntries(carriers.map((c) => [c.id, { name: c.name, phone: c.phone ?? '', note: c.note ?? '' }])));
  }, [carriers]);

  const setField = (id: string, k: keyof Draft, v: string) =>
    setDrafts((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));

  const changed = (id: string) => {
    const c = carriers.find((x) => x.id === id);
    const d = drafts[id];
    if (!c || !d) return false;
    return d.name !== c.name || d.phone !== (c.phone ?? '') || d.note !== (c.note ?? '');
  };

  const saveRow = async (id: string) => {
    const d = drafts[id];
    if (!d?.name.trim()) return;
    try { await save({ id, name: d.name.trim(), phone: d.phone.trim() || null, note: d.note.trim() || null }); toast.success('Đã lưu'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Lưu thất bại'); }
  };
  const toggleActive = async (id: string, active: boolean) => {
    const c = carriers.find((x) => x.id === id);
    if (!c) return;
    try { await save({ id, name: c.name, phone: c.phone, note: c.note, active }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Lỗi'); }
  };
  const add = async () => {
    if (!nn.trim()) return;
    try { await save({ name: nn.trim(), phone: np.trim() || null }); setNn(''); setNp(''); toast.success('Đã thêm đơn vị vận chuyển'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Thêm thất bại'); }
  };
  const del = async (id: string) => {
    try { await remove(id); toast.success('Đã xoá'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Xoá thất bại'); }
  };

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex items-center gap-2.5">
        <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-xl" backgroundClassName="bg-primary-100 dark:bg-primary-900/30">
          <Truck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </Box>
        <Box>
          <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">Đơn vị vận chuyển</Heading>
          <Typography as="p" size="xs" variant="muted">Danh bạ đối tác giao hàng (SPX, GHTK, Ahamove…).</Typography>
        </Box>
      </Box>

      {/* Thêm mới */}
      <Card padding="md" borderClassName="border border-slate-200 dark:border-slate-700" roundedClassName="rounded-xl" layoutClassName="flex flex-wrap items-center gap-2 p-3">
        <Truck className="h-5 w-5 text-primary-500" />
        <Input value={nn} onChange={(e) => setNn(e.target.value)} placeholder="Tên đơn vị (vd SPX, GHTK…)" sizeClassName="min-w-0 flex-1 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" onKeyDown={(e) => { if (e.key === 'Enter') void add(); }} />
        <Input value={np} onChange={(e) => setNp(e.target.value)} placeholder="Số điện thoại" sizeClassName="w-40 px-2.5 py-1.5 text-sm" borderClassName="border border-slate-200 dark:border-slate-600" roundedClassName="rounded-lg" onKeyDown={(e) => { if (e.key === 'Enter') void add(); }} />
        <Button type="button" onClick={() => void add()} disabled={saving || !nn.trim()} variant="primary" leftIcon={<Plus />} iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4" sizeClassName="px-3.5 py-1.5 text-sm" roundedClassName="rounded-lg" backgroundClassName="bg-primary-600" hoverClassName="hover:bg-primary-700" textClassName="font-medium text-white" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>
          Thêm
        </Button>
      </Card>

      {loading ? (
        <Box layoutClassName="flex items-center gap-2 py-8"><Spinner /><Typography size="sm" variant="muted">Đang tải…</Typography></Box>
      ) : carriers.length === 0 ? (
        <Box layoutClassName="flex flex-col items-center gap-2 py-10 text-center">
          <Truck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <Typography size="sm" variant="muted">Chưa có đơn vị vận chuyển nào. Thêm ở trên.</Typography>
        </Box>
      ) : (
        <Box layoutClassName="space-y-2">
          {carriers.map((c) => {
            const d = drafts[c.id] ?? { name: c.name, phone: c.phone ?? '', note: c.note ?? '' };
            return (
              <Card key={c.id} padding="none" borderClassName="border border-slate-200 dark:border-slate-700" roundedClassName="rounded-xl" layoutClassName="flex flex-wrap items-center gap-2 p-2.5" backgroundClassName={c.active ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/40'}>
                <Box layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" backgroundClassName="bg-primary-100 dark:bg-primary-900/30">
                  <Truck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </Box>
                <Input value={d.name} onChange={(e) => setField(c.id, 'name', e.target.value)} placeholder="Tên" sizeClassName="w-40 min-w-0 px-2 py-1 text-sm" borderClassName="border border-transparent" backgroundClassName="bg-transparent" textClassName="font-semibold text-slate-800 dark:text-slate-100" />
                <Box layoutClassName="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <Input value={d.phone} onChange={(e) => setField(c.id, 'phone', e.target.value)} placeholder="SĐT" sizeClassName="w-32 px-1.5 py-1 text-sm" borderClassName="border border-transparent" backgroundClassName="bg-transparent" textClassName="text-slate-600 dark:text-slate-300" />
                </Box>
                <Input value={d.note} onChange={(e) => setField(c.id, 'note', e.target.value)} placeholder="Ghi chú" sizeClassName="min-w-0 flex-1 px-2 py-1 text-sm" borderClassName="border border-transparent" backgroundClassName="bg-transparent" textClassName="text-slate-500 dark:text-slate-400" />
                <Box layoutClassName="ml-auto flex items-center gap-1.5">
                  {changed(c.id) && (
                    <IconButton type="button" label="Lưu" onClick={() => void saveRow(c.id)} disabled={saving} variant="ghost" textClassName="text-emerald-600" hoverClassName="hover:text-emerald-700"><Check className="h-4 w-4" /></IconButton>
                  )}
                  <Switch checked={c.active} onCheckedChange={(v) => void toggleActive(c.id, v)} aria-label={`Bật/tắt ${c.name}`} />
                  <IconButton type="button" label="Xoá" onClick={() => void del(c.id)} disabled={saving} variant="ghost" textClassName="text-rose-400" hoverClassName="hover:text-rose-600"><Trash2 className="h-4 w-4" /></IconButton>
                </Box>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default CarriersPage;
