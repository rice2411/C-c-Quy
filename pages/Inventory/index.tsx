import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Boxes, Search, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchInventory, InventoryOverview } from '@/services/inventoryService';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import IconButton from '@/components/ui/IconButton';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';

/** Trang Kho: số lượng NVL theo đơn nhập từ 1 mốc (mặc định 13/7); trước đó = 0. */
const InventoryPage: React.FC = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<InventoryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('2026-07-13');
  const [q, setQ] = useState('');

  const load = async (fromDate: string) => {
    setLoading(true);
    try {
      setData(await fetchInventory(fromDate));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được tồn kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(() => {
    const list = data?.items ?? [];
    if (!q.trim()) return list;
    const kw = q.trim().toLowerCase();
    return list.filter((it) => it.name.toLowerCase().includes(kw));
  }, [data, q]);

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Heading level={1} layoutClassName="flex items-center gap-2" textClassName="text-xl font-bold">
          <Boxes className="h-5 w-5 text-primary-500" /> {t('nav.materialStock') || 'Kho vật liệu'}
        </Heading>
        <Box layoutClassName="flex items-center gap-2">
          <Typography as="span" size="xs" variant="muted">Từ mốc</Typography>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            sizeClassName="px-2.5 py-1.5 text-sm"
          />
          <IconButton
            type="button"
            label="Tải lại"
            onClick={() => void load(from)}
            disabled={loading}
            variant="secondary"
            layoutClassName="rounded-xl p-2.5"
            backgroundClassName="bg-white dark:bg-slate-800"
            borderClassName="border border-slate-200 dark:border-slate-700"
            textClassName="text-slate-600 dark:text-slate-400"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
            stateClassName="transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </IconButton>
        </Box>
      </Box>

      <Typography as="p" size="xs" variant="muted">
        Số lượng = tổng đã <b>nhập</b> theo phiếu từ mốc {data?.from?.slice(0, 10) || from} (trước đó coi = 0).
        Phần trừ tiêu thụ theo đơn (công thức) sẽ bổ sung sau.
      </Typography>

      {/* KPI */}
      <Box layoutClassName="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 uppercase tracking-wide font-medium">Số loại NVL</Typography>
          <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">{data?.materialCount ?? 0}</Typography>
        </Card>
        <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 uppercase tracking-wide font-medium">Số lần nhập</Typography>
          <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">{data?.totalQtyLines ?? 0}</Typography>
        </Card>
        <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 uppercase tracking-wide font-medium">Tổng tiền nhập</Typography>
          <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-emerald-600 dark:text-emerald-400">{formatVND(data?.totalAmount ?? 0)}</Typography>
        </Card>
      </Box>

      {/* Search */}
      <Input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm tên vật liệu..."
        leftIcon={<Search className="h-4 w-4" />}
        sizeClassName="px-3 py-2.5 text-sm"
      />

      {/* Table */}
      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center py-16"><Spinner size="lg" textClassName="text-primary-500" /></Box>
      ) : items.length === 0 ? (
        <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
          <Boxes className="h-10 w-10 opacity-30" />
          <Typography size="sm" variant="muted">Không có vật liệu nào trong kỳ</Typography>
        </Box>
      ) : (
        <Card padding="none" layoutClassName="overflow-x-auto" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Vật liệu</TableHeaderCell>
                <TableHeaderCell layoutClassName="text-right">SL nhập</TableHeaderCell>
                <TableHeaderCell>ĐVT</TableHeaderCell>
                <TableHeaderCell layoutClassName="text-right">Số lần</TableHeaderCell>
                <TableHeaderCell layoutClassName="text-right">Tiền nhập</TableHeaderCell>
                <TableHeaderCell layoutClassName="text-right">Nhập cuối</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.key}>
                  <TableCell textClassName="font-medium text-slate-800 dark:text-slate-100">{it.name}</TableCell>
                  <TableCell layoutClassName="text-right" textClassName="font-semibold tabular-nums">{it.qtyIn}</TableCell>
                  <TableCell textClassName="text-slate-500 dark:text-slate-400">{it.unit || '—'}</TableCell>
                  <TableCell layoutClassName="text-right" textClassName="tabular-nums text-slate-500 dark:text-slate-400">{it.receiptCount}</TableCell>
                  <TableCell layoutClassName="text-right" textClassName="tabular-nums text-slate-700 dark:text-slate-200">{formatVND(it.amountIn)}</TableCell>
                  <TableCell layoutClassName="text-right" textClassName="text-slate-500 dark:text-slate-400">{it.lastDate?.slice(0, 10) || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
};

export default InventoryPage;
