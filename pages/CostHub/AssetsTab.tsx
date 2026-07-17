import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import DatePicker from '@/components/ui/DatePicker';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { ASSET_CATEGORIES, type Asset } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { fetchAssets, upsertAsset, deleteAsset } from '@/services/assetService';

type AssetForm = { id?: string; name: string; cost: string; usefulMonths: string; startDate: string; category: string };
const EMPTY_ASSET: AssetForm = { name: '', cost: '', usefulMonths: '12', startDate: '', category: 'equipment' };

/** Tài sản (CSVC/thiết bị) + khấu hao — nhập tay HOẶC từ phiếu nhập (source=receipt). */
const AssetsTab: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetForm, setAssetForm] = useState<AssetForm>(EMPTY_ASSET);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const openAdd = () => { setAssetForm(EMPTY_ASSET); setFormOpen(true); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAssets(await fetchAssets());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Tải tài sản thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const saveAsset = async () => {
    const cost = Number(assetForm.cost);
    const usefulMonths = Math.max(1, Math.floor(Number(assetForm.usefulMonths) || 1));
    if (!assetForm.name.trim() || !cost || !assetForm.startDate) {
      toast.error('Nhập tên, nguyên giá và ngày bắt đầu');
      return;
    }
    setBusy(true);
    try {
      await upsertAsset({
        id: assetForm.id,
        name: assetForm.name.trim(),
        cost,
        usefulMonths,
        startDate: assetForm.startDate,
        category: assetForm.category || null,
      });
      toast.success(assetForm.id ? 'Đã cập nhật tài sản' : 'Đã thêm tài sản');
      setAssetForm(EMPTY_ASSET);
      setFormOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu tài sản thất bại');
    } finally {
      setBusy(false);
    }
  };

  const removeAsset = async (id: string) => {
    setBusy(true);
    try {
      await deleteAsset(id);
      toast.success('Đã xoá tài sản');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại');
    } finally {
      setBusy(false);
    }
  };

  const editAsset = (a: Asset) => {
    setAssetForm({
      id: a.id, name: a.name, cost: String(a.cost), usefulMonths: String(a.usefulMonths),
      startDate: a.startDate, category: String(a.category ?? 'equipment'),
    });
    setFormOpen(true);
  };

  if (loading) {
    return (
      <Box layoutClassName="flex min-h-[30vh] items-center justify-center">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Typography size="sm" variant="muted">{assets.length} tài sản</Typography>
        <Button type="button" onClick={openAdd} variant="primary" leftIcon={<Plus />} iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5" sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>Thêm tài sản</Button>
      </Box>

      {assets.length === 0 ? (
        <EmptyState icon={<Boxes className="h-6 w-6" />} title="Chưa có tài sản" />
      ) : (
        <>
          {/* Mobile: card */}
          <Box layoutClassName="space-y-2 sm:hidden">
            {assets.map((a) => (
              <Card key={a.id} padding="sm" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="flex flex-wrap items-center gap-3">
                <Box layoutClassName="min-w-0 flex-1">
                  <Box layoutClassName="flex items-center gap-2">
                    <Typography size="sm" layoutClassName="truncate font-semibold">{a.name}</Typography>
                    {a.source === 'receipt' ? (
                      <Box layoutClassName="shrink-0 px-1.5 py-0.5" roundedClassName="rounded-full" backgroundClassName="bg-sky-100 dark:bg-sky-900/40">
                        <Typography as="span" size="xs" textClassName="font-medium text-sky-700 dark:text-sky-300">Từ phiếu</Typography>
                      </Box>
                    ) : null}
                  </Box>
                  <Typography size="xs" variant="muted" layoutClassName="truncate">
                    {formatVND(a.cost)} / {a.usefulMonths} tháng · {formatVND(Math.round(a.cost / Math.max(1, a.usefulMonths)))}/tháng · từ {a.startDate.split('-').reverse().join('/')}
                  </Typography>
                </Box>
                <Button type="button" onClick={() => editAsset(a)} aria-label="Sửa" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" disabled={busy} onClick={() => void removeAsset(a.id)} aria-label="Xoá" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-transparent" textClassName="text-red-500" hoverClassName="hover:bg-red-50 dark:hover:bg-red-900/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </Box>
          {/* Desktop: table */}
          <Box layoutClassName="hidden sm:block overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell layoutClassName="p-2 text-left">Tên tài sản</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-right">Nguyên giá</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-right">Số tháng KH</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-right">KH/tháng</TableHeaderCell>
                  <TableHeaderCell layoutClassName="p-2 text-left">Bắt đầu</TableHeaderCell>
                  <TableHeaderCell layoutClassName="w-20 p-2"> </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id} borderClassName="border-b border-slate-100 dark:border-slate-700/60">
                    <TableCell layoutClassName="p-2">
                      <Box layoutClassName="flex items-center gap-2">
                        <Typography as="span" size="sm" layoutClassName="font-medium text-slate-800 dark:text-slate-100">{a.name}</Typography>
                        {a.source === 'receipt' ? (
                          <Box layoutClassName="shrink-0 px-1.5 py-0.5" roundedClassName="rounded-full" backgroundClassName="bg-sky-100 dark:bg-sky-900/40">
                            <Typography as="span" size="xs" textClassName="font-medium text-sky-700 dark:text-sky-300">Từ phiếu</Typography>
                          </Box>
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell layoutClassName="p-2 text-right" textClassName="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatVND(a.cost)}</TableCell>
                    <TableCell layoutClassName="p-2 text-right" textClassName="text-sm tabular-nums text-slate-600 dark:text-slate-300">{a.usefulMonths}</TableCell>
                    <TableCell layoutClassName="p-2 text-right" textClassName="text-sm tabular-nums text-slate-600 dark:text-slate-300">{formatVND(Math.round(a.cost / Math.max(1, a.usefulMonths)))}</TableCell>
                    <TableCell layoutClassName="p-2" textClassName="text-sm text-slate-500 dark:text-slate-400">{a.startDate.split('-').reverse().join('/')}</TableCell>
                    <TableCell layoutClassName="p-2">
                      <Box layoutClassName="flex items-center gap-1">
                        <Button type="button" onClick={() => editAsset(a)} aria-label="Sửa" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" textClassName="text-slate-500">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" disabled={busy} onClick={() => void removeAsset(a.id)} aria-label="Xoá" variant="ghost" disableVariantHover disableVariantTextColor sizeClassName="p-1.5" roundedClassName="rounded-lg" borderClassName="border border-transparent" textClassName="text-red-500" hoverClassName="hover:bg-red-50 dark:hover:bg-red-900/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}

      <BaseSlidePanel
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={assetForm.id ? 'Sửa tài sản' : 'Thêm tài sản (CSVC/thiết bị)'}
        maxWidth="md"
        footer={
          <Box layoutClassName="flex gap-2 p-4">
            <Button type="button" disabled={busy} onClick={() => void saveAsset()} variant="primary" sizeClassName="px-4 py-2 text-sm" roundedClassName="rounded-lg" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>
              {assetForm.id ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button type="button" onClick={() => setFormOpen(false)} variant="secondary" sizeClassName="px-4 py-2 text-sm" roundedClassName="rounded-lg" disableVariantHover>Huỷ</Button>
          </Box>
        }
      >
        <Box layoutClassName="grid grid-cols-1 gap-3 p-4">
          <Input value={assetForm.name} placeholder="Tên (vd Tủ lạnh)" onChange={(e) => setAssetForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
          <Select value={assetForm.category} onChange={(e) => setAssetForm((f) => ({ ...f, category: e.target.value }))}>
            {ASSET_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
          </Select>
          <Input type="number" min={0} value={assetForm.cost} placeholder="Nguyên giá (VND)" onChange={(e) => setAssetForm((f) => ({ ...f, cost: e.target.value }))} fullWidth />
          <Input type="number" min={1} value={assetForm.usefulMonths} placeholder="Số tháng khấu hao" onChange={(e) => setAssetForm((f) => ({ ...f, usefulMonths: e.target.value }))} fullWidth />
          <DatePicker value={assetForm.startDate} onChange={(v) => setAssetForm((f) => ({ ...f, startDate: v }))} fullWidth placeholder="Ngày bắt đầu khấu hao" />
        </Box>
      </BaseSlidePanel>
    </Box>
  );
};

export default AssetsTab;
