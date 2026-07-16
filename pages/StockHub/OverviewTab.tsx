import React, { useMemo, useState } from 'react';
import { Wallet, FileText, Truck, Package } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import StatsBanner from '@/components/ui/StatsBanner';
import { RankedBarList, TrendChart } from '@/components/ui/stats';
import DateRangePicker, { DatePreset, computePresetRange } from '@/components/ui/DateRangePicker';
import {
  useStockReceiptSummaries,
  useImportedSuppliers,
  useImportedMaterials,
} from '@/hooks/queries/useStockReceiptQuery';
import { formatVND } from '@/utils/format/currencyUtil';

/**
 * apiClient revive chuỗi ISO thành object Timestamp-like ({ toMillis, toDate })
 * để tương thích code cũ → createdAt KHÔNG còn là string. Đọc mốc ms an toàn cho
 * cả 3 dạng: Timestamp-like, Date, chuỗi (date-only receiptDate vẫn là string).
 */
const toMs = (val: unknown): number => {
  if (!val) return NaN;
  if (typeof val === 'object') {
    const o = val as { toMillis?: () => number; toDate?: () => Date };
    if (typeof o.toMillis === 'function') return o.toMillis();
    if (typeof o.toDate === 'function') return o.toDate().getTime();
  }
  return new Date(val as string).getTime();
};

/**
 * Tổng quan Nhập hàng — tính client-side từ dữ liệu sẵn có (không cần BE mới):
 * tổng tiền nhập + số phiếu (theo kỳ), số NCC/NVL (tổng danh mục), top NCC theo chi tiêu.
 */
const OverviewTab: React.FC = () => {
  const initial = computePresetRange('month');
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [preset, setPreset] = useState<DatePreset>('month');

  const receiptsQuery = useStockReceiptSummaries();
  const suppliersQuery = useImportedSuppliers();
  const materialsQuery = useImportedMaterials();

  const loading = receiptsQuery.loading || suppliersQuery.loading || materialsQuery.loading;

  const applyPreset = (p: DatePreset) => {
    if (p !== 'custom') {
      const r = computePresetRange(p);
      setFromDate(r.from);
      setToDate(r.to);
    }
    setPreset(p);
  };

  const receiptsInPeriod = useMemo(() => {
    const fromTs = new Date(`${fromDate.slice(0, 10)}T00:00:00`).getTime();
    const toTs = new Date(`${toDate.slice(0, 10)}T23:59:59.999`).getTime();
    return receiptsQuery.receipts.filter((r) => {
      const ts = toMs(r.createdAt ?? r.receiptDate);
      return !Number.isNaN(ts) && ts >= fromTs && ts <= toTs;
    });
  }, [receiptsQuery.receipts, fromDate, toDate]);

  const totalSpend = useMemo(
    () => receiptsInPeriod.reduce((s, r) => s + (typeof r.totalAmount === 'number' ? r.totalAmount : 0), 0),
    [receiptsInPeriod],
  );

  const unreconciled = useMemo(
    () => receiptsInPeriod.filter((r) => !r.reconciled).length,
    [receiptsInPeriod],
  );

  const topSuppliers = useMemo(() => {
    const map = new Map<string, number>();
    receiptsInPeriod.forEach((r) => {
      const name = (r.supplierNameRaw ?? '').trim() || 'Không rõ NCC';
      const amt = typeof r.totalAmount === 'number' ? r.totalAmount : 0;
      map.set(name, (map.get(name) || 0) + amt);
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .filter((x) => x.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [receiptsInPeriod]);

  // Xu hướng: tiền nhập gộp theo ngày (trong kỳ).
  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    receiptsInPeriod.forEach((r) => {
      const ms = toMs(r.createdAt ?? r.receiptDate);
      if (Number.isNaN(ms)) return;
      const d = new Date(ms);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + (typeof r.totalAmount === 'number' ? r.totalAmount : 0));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => ({ label: k.slice(5).split('-').reverse().join('/'), amount: v }));
  }, [receiptsInPeriod]);

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex flex-wrap items-center gap-2">
        <Box layoutClassName="ml-auto">
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            preset={preset}
            onApplyPreset={applyPreset}
            onFromChange={(v) => { setFromDate(v); setPreset('custom'); }}
            onToChange={(v) => { setToDate(v); setPreset('custom'); }}
          />
        </Box>
      </Box>

      {loading ? (
        <Box layoutClassName="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" textClassName="text-primary-500" />
        </Box>
      ) : (
        <Box layoutClassName="space-y-4">
          <StatsBanner
            items={[
              { icon: Wallet, label: 'Tổng tiền nhập (kỳ)', value: formatVND(totalSpend), accent: '#8b5cf6' },
              { icon: FileText, label: 'Số phiếu (kỳ)', value: String(receiptsInPeriod.length), accent: '#0ea5e9' },
              { icon: Truck, label: 'Nhà cung cấp', value: String(suppliersQuery.suppliers.length), accent: '#16a34a' },
              { icon: Package, label: 'Nguyên vật liệu', value: String(materialsQuery.materials.length), accent: '#d97706' },
            ]}
          />

          {unreconciled > 0 ? (
            <Card padding="sm" borderClassName="border-amber-200 dark:border-amber-800" backgroundClassName="bg-amber-50 dark:bg-amber-900/10">
              <Typography size="sm" textClassName="text-amber-700 dark:text-amber-300">
                ⚠️ {unreconciled} phiếu trong kỳ chưa đối soát
              </Typography>
            </Card>
          ) : null}

          {trendData.length > 1 ? (
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Typography size="sm" layoutClassName="font-semibold">Tiền nhập theo ngày (trong kỳ)</Typography>
              <TrendChart
                data={trendData}
                xKey="label"
                series={[{ key: 'amount', label: 'Tiền nhập', color: '#0ea5e9' }]}
                type="area"
                formatValue={formatVND}
                heightClassName="h-48"
              />
            </Card>
          ) : null}

          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
            <Typography size="sm" layoutClassName="font-semibold">Top nhà cung cấp theo chi tiêu (trong kỳ)</Typography>
            {topSuppliers.length === 0 ? (
              <EmptyState icon={<Truck className="h-6 w-6" />} title="Chưa có phiếu nhập trong kỳ" />
            ) : (
              <RankedBarList
                items={topSuppliers.map((s) => ({ label: s.name, value: formatVND(s.amount), amount: s.amount }))}
              />
            )}
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default OverviewTab;
