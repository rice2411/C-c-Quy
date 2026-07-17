import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Boxes, Pencil, Trash2 } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import DatePicker from '@/components/ui/DatePicker';
import { ASSET_CATEGORIES, type Asset } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { fetchAssets, upsertAsset, deleteAsset } from '@/services/assetService';

type AssetForm = { id?: string; name: string; cost: string; usefulMonths: string; startDate: string; category: string };
const EMPTY_ASSET: AssetForm = { name: '', cost: '', usefulMonths: '12', startDate: '', category: 'equipment' };

/** Tài sản (CSVC/thiết bị) + khấu hao — nhập tay HOẶC từ phiếu nhập (source=receipt). */
const AssetsTab: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetForm, setAssetForm] = useState<AssetForm>(EMPTY_ASSET);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const editAsset = (a: Asset) => setAssetForm({
    id: a.id, name: a.name, cost: String(a.cost), usefulMonths: String(a.usefulMonths),
    startDate: a.startDate, category: String(a.category ?? 'equipment'),
  });

  if (loading) {
    return (
      <Box layoutClassName="flex min-h-[30vh] items-center justify-center">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
    );
  }

  return (
    <Box layoutClassName="max-w-4xl space-y-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Typography size="sm" layoutClassName="font-semibold">
          {assetForm.id ? 'Sửa tài sản' : 'Thêm tài sản (CSVC/thiết bị)'}
        </Typography>
        <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input value={assetForm.name} placeholder="Tên (vd Tủ lạnh)" onChange={(e) => setAssetForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
          <Select value={assetForm.category} onChange={(e) => setAssetForm((f) => ({ ...f, category: e.target.value }))}>
            {ASSET_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
          </Select>
          <Input type="number" min={0} value={assetForm.cost} placeholder="Nguyên giá (VND)" onChange={(e) => setAssetForm((f) => ({ ...f, cost: e.target.value }))} fullWidth />
          <Input type="number" min={1} value={assetForm.usefulMonths} placeholder="Số tháng khấu hao" onChange={(e) => setAssetForm((f) => ({ ...f, usefulMonths: e.target.value }))} fullWidth />
          <DatePicker value={assetForm.startDate} onChange={(v) => setAssetForm((f) => ({ ...f, startDate: v }))} fullWidth placeholder="Ngày bắt đầu khấu hao" />
        </Box>
        <Box layoutClassName="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void saveAsset()} variant="primary" sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>
            {assetForm.id ? 'Cập nhật' : 'Thêm'}
          </Button>
          {assetForm.id ? (
            <Button type="button" onClick={() => setAssetForm(EMPTY_ASSET)} variant="secondary" sizeClassName="px-3 py-1.5 text-xs" roundedClassName="rounded-lg" disableVariantHover>Huỷ</Button>
          ) : null}
        </Box>
      </Card>

      {assets.length === 0 ? (
        <EmptyState icon={<Boxes className="h-6 w-6" />} title="Chưa có tài sản" />
      ) : (
        <Box layoutClassName="space-y-2">
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
      )}
    </Box>
  );
};

export default AssetsTab;
