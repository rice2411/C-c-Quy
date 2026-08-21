import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Truck, Wallet, Clock, AlertTriangle, MapPin, CheckCircle2 } from 'lucide-react';
import {
  ShippingAnalytics,
  ShippingRange,
  CarrierStat,
  fetchShippingAnalytics,
} from '@/services/shippingService';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

/** Kỳ thống kê: preset → khoảng from/to (YYYY-MM-DD, giờ máy). 'all' = toàn bộ. */
type RangePreset = 'all' | '30d' | '90d' | '6m' | 'ytd';
const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: 'all', label: 'Toàn bộ' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: '6m', label: '6 tháng' },
  { value: 'ytd', label: 'Từ đầu năm' },
];
const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const computeRange = (preset: RangePreset): ShippingRange => {
  if (preset === 'all') return {};
  const to = new Date();
  const from = new Date();
  if (preset === '30d') from.setDate(from.getDate() - 29);
  else if (preset === '90d') from.setDate(from.getDate() - 89);
  else if (preset === '6m') from.setMonth(from.getMonth() - 6);
  else if (preset === 'ytd') { from.setMonth(0); from.setDate(1); }
  return { from: fmtDate(from), to: fmtDate(to) };
};

const HIST_LABELS: [keyof CarrierStat['histogram'], string][] = [
  ['d1', '≤1 ngày'], ['d2', '2 ngày'], ['d3', '3 ngày'], ['d4', '4 ngày'], ['d5p', '5+ ngày'],
];

/** Chip nhỏ hiển thị 1 chỉ số trạng thái. */
const StatChip: React.FC<{ label: string; value: number; tone: 'ok' | 'warn' | 'muted' }> = ({ label, value, tone }) => {
  const bg =
    tone === 'ok' ? 'bg-emerald-50 dark:bg-emerald-950/40'
    : tone === 'warn' ? 'bg-rose-50 dark:bg-rose-950/40'
    : 'bg-slate-100 dark:bg-slate-700';
  const text =
    tone === 'ok' ? 'text-emerald-700 dark:text-emerald-300'
    : tone === 'warn' ? 'text-rose-700 dark:text-rose-300'
    : 'text-slate-600 dark:text-slate-300';
  return (
    <Typography as="span" size="xs" layoutClassName="rounded-full px-2 py-0.5 font-medium" backgroundClassName={bg} textClassName={text}>
      {label}: {value}
    </Typography>
  );
};

/** Thẻ chỉ số 1 DVVC. */
const CarrierCard: React.FC<{ c: CarrierStat }> = ({ c }) => {
  const maxH = Math.max(1, c.histogram.d1, c.histogram.d2, c.histogram.d3, c.histogram.d4, c.histogram.d5p);
  return (
    <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-slate-900 dark:text-white">
          <Truck className="h-4 w-4 text-cyan-500" /> {c.carrier}
        </Typography>
        <Typography as="span" size="xs" variant="muted">{c.orders} đơn</Typography>
      </Box>

      <Box layoutClassName="grid grid-cols-3 gap-2">
        <Box layoutClassName="space-y-0.5">
          <Typography as="span" size="xs" variant="muted" layoutClassName="inline-flex items-center gap-1"><Wallet className="h-3 w-3" /> Doanh thu</Typography>
          <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{formatVND(c.revenue)}</Typography>
        </Box>
        <Box layoutClassName="space-y-0.5">
          <Typography as="span" size="xs" variant="muted">Giá trị TB/đơn</Typography>
          <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{formatVND(c.aov)}</Typography>
        </Box>
        <Box layoutClassName="space-y-0.5">
          <Typography as="span" size="xs" variant="muted">Phí ship TB</Typography>
          <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{formatVND(c.shipAvg)}</Typography>
        </Box>
      </Box>

      <Box layoutClassName="flex flex-wrap gap-2">
        <StatChip label="Đã giao" value={c.delivered} tone="ok" />
        <StatChip label="Đang giao" value={c.inTransit} tone="muted" />
        <StatChip label="Kẹt ≥4 ngày" value={c.stuck} tone={c.stuck > 0 ? 'warn' : 'muted'} />
      </Box>

      <Box layoutClassName="space-y-1.5">
        <Typography as="span" size="xs" layoutClassName="inline-flex items-center gap-1 font-semibold uppercase tracking-wide" textClassName="text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" /> Thời gian giao (nhận → giao xong)
        </Typography>
        {c.durCount > 0 ? (
          <>
            <Typography as="p" size="xs" variant="muted">
              TB {c.avgDays} ngày · nhanh {c.minDays} · lâu {c.maxDays} · {c.durCount} đơn có mốc
            </Typography>
            <Box layoutClassName="space-y-1">
              {HIST_LABELS.map(([k, lbl]) => {
                const n = c.histogram[k];
                return (
                  <Box key={k} layoutClassName="flex items-center gap-2">
                    <Typography as="span" size="xs" layoutClassName="w-16 shrink-0" textClassName="text-slate-500 dark:text-slate-400">{lbl}</Typography>
                    <Box layoutClassName="relative h-3.5 min-w-0 flex-1 overflow-hidden rounded" backgroundClassName="bg-slate-100 dark:bg-slate-700/50">
                      <Box layoutClassName="h-full rounded bg-cyan-400 dark:bg-cyan-500" style={{ width: `${Math.round((n / maxH) * 100)}%` }} />
                    </Box>
                    <Typography as="span" size="xs" layoutClassName="w-6 shrink-0 text-right tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{n}</Typography>
                  </Box>
                );
              })}
            </Box>
          </>
        ) : (
          <Typography as="p" size="xs" variant="muted">Chưa có đơn nào đủ mốc nhận + giao.</Typography>
        )}
      </Box>
    </Card>
  );
};

/** Bảng phân tích vận chuyển theo ĐVVC (embed trong tab ĐVVC → Tổng quan). */
const ShippingAnalyticsView: React.FC = () => {
  const [data, setData] = useState<ShippingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<RangePreset>('all');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const d = await fetchShippingAnalytics(computeRange(preset));
        if (alive) setData(d);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không tải được số liệu vận chuyển');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [preset]);

  const provinceRows = useMemo(() => {
    const rows = data?.byProvince ?? [];
    const maxOrders = Math.max(1, ...rows.map((r) => r.orders));
    return { rows, maxOrders };
  }, [data]);

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide" textClassName="text-slate-500 dark:text-slate-400">
          <Truck className="h-4 w-4 text-cyan-500" /> Phân tích theo đơn vị vận chuyển
        </Typography>
        <Select
          size="sm"
          value={preset}
          onChange={(e) => setPreset(e.target.value as RangePreset)}
          disabled={loading}
          layoutClassName="w-auto"
          aria-label="Chọn kỳ thống kê"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </Box>

      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center py-20">
          <Spinner size="md" />
        </Box>
      ) : !data || data.carriers.length === 0 ? (
        <Typography as="p" size="sm" variant="muted">Chưa có dữ liệu vận chuyển trong kỳ.</Typography>
      ) : (
        <>
          <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.carriers.map((c) => <CarrierCard key={c.carrier} c={c} />)}
          </Box>

          {data.stuckOrders.length > 0 ? (
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-2">
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" /> Đơn kẹt (đã gửi ≥4 ngày chưa có mốc giao) · {data.stuckOrders.length}
              </Typography>
              <Box layoutClassName="max-h-64 space-y-1 overflow-y-auto">
                {data.stuckOrders.map((o) => (
                  <Box key={o.orderNumber} layoutClassName="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5" backgroundClassName="bg-slate-50 dark:bg-slate-800/40">
                    <Box layoutClassName="min-w-0 flex-1">
                      <Typography as="p" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">{o.orderNumber} · {o.customerName}</Typography>
                      <Typography as="span" size="xs" variant="muted">{o.carrier} · gửi {o.shippedDate}</Typography>
                    </Box>
                    <Typography as="span" size="sm" layoutClassName="shrink-0 font-semibold" textClassName="text-rose-600 dark:text-rose-400">{o.ageDays} ngày</Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          ) : null}

          {provinceRows.rows.length > 0 ? (
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-slate-900 dark:text-white">
                <MapPin className="h-4 w-4 text-violet-500" /> Phân bố theo tỉnh (đơn ship tỉnh)
              </Typography>
              <Box layoutClassName="max-h-80 space-y-1.5 overflow-y-auto">
                {provinceRows.rows.map((p, i) => (
                  <Box key={`${p.carrier}-${p.province}-${i}`} layoutClassName="flex items-center gap-2">
                    <Typography as="span" size="xs" layoutClassName="w-28 shrink-0 truncate font-medium" textClassName="text-slate-700 dark:text-slate-200">{p.province}</Typography>
                    <Box layoutClassName="relative h-4 min-w-0 flex-1 overflow-hidden rounded" backgroundClassName="bg-slate-100 dark:bg-slate-700/50">
                      <Box layoutClassName="h-full rounded bg-violet-400 dark:bg-violet-500" style={{ width: `${Math.max(4, Math.round((p.orders / provinceRows.maxOrders) * 100))}%` }} />
                    </Box>
                    <Typography as="span" size="xs" layoutClassName="inline-flex w-40 shrink-0 items-center justify-end gap-1 text-right tabular-nums" textClassName="text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />{p.delivered}/{p.orders} · {p.avgDays === null ? '—' : `${p.avgDays}n`}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Typography as="p" size="xs" variant="muted">Số đã giao / tổng đơn · thời gian giao TB (ngày). DVVC chính hiện tại: SPX.</Typography>
            </Card>
          ) : null}

          <Typography as="p" size="xs" variant="muted">
            DVVC nhận diện từ mã vận đơn (SPX = Shopee Express). Đơn chưa có mã gộp nhóm "Chưa có mã / Tự giao".
          </Typography>
        </>
      )}
    </Box>
  );
};

export default ShippingAnalyticsView;
