import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, TrendingUp, Truck, Package, Wallet, AlertTriangle, Lightbulb, Users, Clock, MapPin, Coins, BarChart3 } from 'lucide-react';
import {
  AnalyticsOverview,
  AnalyticsInsight,
  fetchAnalyticsOverview,
  fetchAnalyticsInsight,
} from '@/services/analyticsService';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import TrendChart from '@/components/ui/stats/TrendChart';
import DonutChart from '@/components/ui/stats/DonutChart';

const PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];
const DELIVERY_LABEL: Record<string, string> = {
  SHIP: 'Ship nội thành',
  SHIP_PROVINCE: 'Ship tỉnh',
  PICKUP: 'Khách tới lấy',
  UNKNOWN: 'Chưa rõ',
};
const DOW_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({
  icon,
  label,
  value,
  sub,
}) => (
  <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="min-w-0 flex-1 space-y-1">
    <Box layoutClassName="flex items-center gap-2">
      <Box textClassName="text-primary-500">{icon}</Box>
      <Typography as="span" size="xs" variant="muted" layoutClassName="font-medium uppercase tracking-wide">{label}</Typography>
    </Box>
    <Typography as="p" size="lg" layoutClassName="font-bold" textClassName="text-slate-900 dark:text-white">{value}</Typography>
    {sub ? <Typography as="span" size="xs" variant="muted">{sub}</Typography> : null}
  </Card>
);

/** Danh sách thanh ngang (nhu cầu theo thứ / top SP) — không cần chart lib. */
const BarList: React.FC<{ items: { label: string; value: number; hint?: string }[]; color: string; fmt?: (v: number) => string }> = ({
  items,
  color,
  fmt,
}) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Box layoutClassName="space-y-2">
      {items.map((it, idx) => (
        <Box key={idx} layoutClassName="space-y-1">
          <Box layoutClassName="flex items-center justify-between gap-2">
            <Typography as="span" size="xs" layoutClassName="min-w-0 truncate" textClassName="text-slate-700 dark:text-slate-200">{it.label}</Typography>
            <Typography as="span" size="xs" layoutClassName="shrink-0 font-semibold" textClassName="text-slate-800 dark:text-slate-100">
              {fmt ? fmt(it.value) : it.value}{it.hint ? ` · ${it.hint}` : ''}
            </Typography>
          </Box>
          <Box layoutClassName="h-2 w-full overflow-hidden rounded-full" backgroundClassName="bg-slate-100 dark:bg-slate-800">
            <Box layoutClassName="h-full rounded-full" style={{ width: `${Math.round((it.value / max) * 100)}%`, backgroundColor: color }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const InsightBlock: React.FC<{ icon: React.ReactNode; title: string; items?: string[]; textClassName?: string }> = ({
  icon,
  title,
  items,
  textClassName,
}) => {
  if (!items || items.length === 0) return null;
  return (
    <Box layoutClassName="space-y-1.5">
      <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName={textClassName ?? 'text-slate-800 dark:text-slate-100'}>
        {icon} {title}
      </Typography>
      <Box layoutClassName="space-y-1 pl-1">
        {items.map((s, i) => (
          <Typography key={i} as="p" size="sm" textClassName="text-slate-600 dark:text-slate-300">• {s}</Typography>
        ))}
      </Box>
    </Box>
  );
};

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<AnalyticsInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await fetchAnalyticsOverview();
        if (alive) setData(d);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không tải được số liệu phân tích');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const peakMonth = useMemo(() => {
    if (!data?.byMonth.length) return null;
    return data.byMonth.reduce((a, b) => (b.revenue > a.revenue ? b : a));
  }, [data]);

  const deliveryDonut = useMemo(
    () =>
      (data?.deliveryType ?? []).map((d, i) => ({
        key: d.type,
        label: DELIVERY_LABEL[d.type] ?? d.type,
        value: d.orders,
        color: PALETTE[i % PALETTE.length],
      })),
    [data],
  );

  const runAi = async () => {
    if (!data) return;
    setAiLoading(true);
    try {
      const res = await fetchAnalyticsInsight(data);
      setInsight(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI phân tích thất bại');
    } finally {
      setAiLoading(false);
    }
  };

  const k = data?.kpi;
  const shipProvincePct = k && k.orders > 0 ? Math.round((k.shipProvinceOrders / k.orders) * 100) : 0;
  const deliveredPct = k && k.orders > 0 ? Math.round((k.deliveredOrders / k.orders) * 100) : 0;

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Heading level={1} layoutClassName="flex items-center gap-2" textClassName="text-xl font-bold">
          <TrendingUp className="h-5 w-5 text-primary-500" /> Phân tích kinh doanh
        </Heading>
        <Button
          type="button"
          onClick={() => void runAi()}
          disabled={aiLoading || !data}
          leftIcon={aiLoading ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Sparkles />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          layoutClassName="inline-flex items-center gap-1.5"
          sizeClassName="px-4 py-2 text-sm"
          roundedClassName="rounded-lg"
          backgroundClassName="bg-primary-600"
          hoverClassName="hover:bg-primary-700"
          textClassName="font-medium text-white"
          disableVariantHover
        >
          {aiLoading ? 'AI đang phân tích…' : 'Phân tích bằng AI'}
        </Button>
      </Box>

      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center py-20">
          <Spinner size="md" />
        </Box>
      ) : !data ? (
        <Typography as="p" size="sm" variant="muted">Chưa có dữ liệu.</Typography>
      ) : (
        <>
          {/* KPI */}
          <Box layoutClassName="flex flex-wrap gap-3">
            <KpiCard icon={<Package className="h-4 w-4" />} label="Đơn (hợp lệ)" value={String(k?.orders ?? 0)} sub={`${deliveredPct}% đã giao`} />
            <KpiCard icon={<Wallet className="h-4 w-4" />} label="Doanh thu" value={formatVND(k?.revenue ?? 0)} sub={`Đã thu ${formatVND(k?.paidRevenue ?? 0)}`} />
            <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Giá trị TB/đơn" value={formatVND(k?.aov ?? 0)} />
            <KpiCard icon={<Truck className="h-4 w-4" />} label="Ship tỉnh" value={`${k?.shipProvinceOrders ?? 0} đơn`} sub={`${shipProvincePct}% tổng đơn`} />
          </Box>

          {/* SƠ ĐỒ: thời gian giao TB theo tỉnh/thành (dựa mã vận đơn SPX) */}
          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
            <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
              <Typography size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold">
                <Truck className="h-4 w-4 text-cyan-500" /> Thời gian giao TB theo tỉnh/thành
              </Typography>
              <Typography as="span" size="xs" variant="muted">nhận → giao xong (SPX), tỉnh giao lâu lên đầu</Typography>
            </Box>
            {(() => {
              const rows = data.shipByProvince;
              if (rows.length === 0) {
                return (
                  <Typography as="p" size="xs" variant="muted">
                    Chưa có đơn ship tỉnh nào. Vào <b>Đơn hàng → Làm mới vận đơn</b> để đồng bộ mốc SPX, rồi mở lại.
                  </Typography>
                );
              }
              // Liệt kê HẾT các tỉnh/thành thành dòng riêng. Tỉnh đã có mốc giao → có bar +
              // số ngày TB; tỉnh chưa có mốc → dòng "— · N đơn" (BE đã xếp xuống cuối).
              const maxAvg = Math.max(1, ...rows.map((r) => r.avgDays ?? 0));
              return (
                <Box layoutClassName="space-y-2">
                  {rows.map((r) => {
                    const has = r.avgDays !== null;
                    const d = r.avgDays ?? 0;
                    const pct = has ? Math.max(6, Math.round((d / maxAvg) * 100)) : 0;
                    const barColor = d >= 4 ? 'bg-rose-400 dark:bg-rose-500' : d >= 2.5 ? 'bg-amber-400 dark:bg-amber-500' : 'bg-emerald-400 dark:bg-emerald-500';
                    return (
                      <Box key={r.province} layoutClassName="flex items-center gap-2">
                        <Typography as="span" size="xs" layoutClassName="w-28 shrink-0 truncate font-medium" textClassName="text-slate-700 dark:text-slate-200">{r.province}</Typography>
                        <Box layoutClassName="relative h-5 min-w-0 flex-1 overflow-hidden rounded" backgroundClassName="bg-slate-100 dark:bg-slate-700/50">
                          {has ? <Box layoutClassName={`h-full rounded ${barColor}`} style={{ width: `${pct}%` }} /> : null}
                        </Box>
                        <Typography as="span" size="xs" layoutClassName="w-28 shrink-0 text-right tabular-nums" textClassName={has ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
                          {has ? `${d} ngày · ${r.delivered}/${r.orders} đơn` : `— · ${r.orders} đơn`}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              );
            })()}
          </Card>

          <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Doanh thu theo tháng */}
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Box layoutClassName="flex items-center justify-between gap-2">
                <Typography size="sm" layoutClassName="font-semibold">Doanh thu theo tháng</Typography>
                {peakMonth ? (
                  <Typography as="span" size="xs" variant="muted">Cao điểm: <b>{peakMonth.month}</b> ({formatVND(peakMonth.revenue)})</Typography>
                ) : null}
              </Box>
              <TrendChart
                data={data.byMonth}
                xKey="month"
                series={[{ key: 'revenue', label: 'Doanh thu', color: '#6366f1' }]}
                type="area"
                isDarkMode={isDark}
                formatValue={(v) => formatVND(v)}
                heightClassName="h-56"
                showDots
              />
            </Card>

            {/* Hình thức giao */}
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Typography size="sm" layoutClassName="font-semibold">Hình thức giao hàng</Typography>
              {deliveryDonut.length > 0 ? (
                <Box layoutClassName="flex flex-col items-center gap-4 sm:flex-row">
                  <Box layoutClassName="h-48 w-48 shrink-0">
                    <DonutChart data={deliveryDonut} isDarkMode={isDark} formatValue={(v) => `${v} đơn`} containerClassName="h-48 w-48" />
                  </Box>
                  <Box layoutClassName="min-w-0 flex-1 space-y-1.5">
                    {deliveryDonut.map((d) => (
                      <Box key={d.key} layoutClassName="flex items-center justify-between gap-2">
                        <Box layoutClassName="flex min-w-0 items-center gap-2">
                          <Box layoutClassName="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                          <Typography as="span" size="sm" layoutClassName="truncate" textClassName="text-slate-700 dark:text-slate-200">{d.label}</Typography>
                        </Box>
                        <Typography as="span" size="sm" layoutClassName="shrink-0 font-semibold">{d.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography as="p" size="xs" variant="muted">Chưa có dữ liệu hình thức giao.</Typography>
              )}
            </Card>

            {/* Nhu cầu theo thứ */}
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Typography size="sm" layoutClassName="font-semibold">Nhu cầu theo thứ trong tuần (số đơn)</Typography>
              <BarList color="#22c55e" items={data.byDow.map((d) => ({ label: DOW_LABEL[d.dow] ?? String(d.dow), value: d.orders }))} />
            </Card>

            {/* Top sản phẩm */}
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Typography size="sm" layoutClassName="font-semibold">Top sản phẩm bán chạy (số lượng)</Typography>
              <BarList
                color="#f59e0b"
                items={data.topProducts.slice(0, 10).map((p) => ({ label: p.name, value: p.qty, hint: formatVND(p.revenue) }))}
              />
            </Card>
          </Box>

          {/* Thời gian giao đơn tỉnh: SPX nhận hàng → giao xong mất bao lâu */}
          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
            <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
              <Typography size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold">
                <Truck className="h-4 w-4 text-cyan-500" /> Thời gian giao đơn tỉnh (SPX nhận → giao xong)
              </Typography>
              {data.shipDuration.count > 0 ? (
                <Typography as="span" size="xs" variant="muted">
                  {data.shipDuration.count} đơn · TB {data.shipDuration.avgDays} ngày · nhanh {data.shipDuration.minDays} · lâu {data.shipDuration.maxDays}
                </Typography>
              ) : null}
            </Box>
            {data.shipDuration.count === 0 ? (
              <Typography as="p" size="xs" variant="muted">
                Chưa có đơn tỉnh nào đủ mốc nhận + giao. Vào <b>Đơn hàng → Làm mới vận đơn</b> để đồng bộ mốc SPX, rồi mở lại trang này.
              </Typography>
            ) : (
              <Box layoutClassName="max-h-64 space-y-1 overflow-y-auto">
                {data.shipDuration.orders.map((o) => (
                  <Box key={o.orderNumber} layoutClassName="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5" backgroundClassName="bg-slate-50 dark:bg-slate-800/40">
                    <Box layoutClassName="min-w-0 flex-1">
                      <Typography as="p" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">{o.orderNumber}</Typography>
                      <Typography as="span" size="xs" variant="muted">Nhận: {o.shippedDate} · Giao: {o.deliveredDate}</Typography>
                    </Box>
                    <Typography as="span" size="sm" layoutClassName="shrink-0 font-semibold" textClassName={o.days >= 5 ? 'text-rose-600 dark:text-rose-400' : o.days >= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{o.days} ngày</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Card>

          {/* P&L theo tháng */}
          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
            <Typography size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold">
              <Coins className="h-4 w-4 text-emerald-500" /> Lãi/lỗ theo tháng (doanh thu − NVL − chi phí − hoàn)
            </Typography>
            <Box layoutClassName="overflow-x-auto">
              <Box layoutClassName="min-w-[560px] space-y-1">
                <Box layoutClassName="grid grid-cols-6 gap-2 border-b border-slate-100 pb-1 dark:border-slate-700">
                  {['Tháng', 'Doanh thu', 'NVL', 'Chi phí', 'Hoàn', 'Lãi'].map((h, i) => (
                    <Typography key={h} as="span" size="xs" layoutClassName={`font-bold uppercase ${i === 0 ? '' : 'text-right'}`} variant="muted">{h}</Typography>
                  ))}
                </Box>
                {data.pnlMonthly.slice().reverse().map((m) => {
                  const profit = m.revenue - m.material - m.opex - m.refund;
                  return (
                    <Box key={m.month} layoutClassName="grid grid-cols-6 gap-2 py-0.5">
                      <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-slate-700 dark:text-slate-200">{m.month}</Typography>
                      <Typography as="span" size="xs" layoutClassName="text-right tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{formatVND(m.revenue)}</Typography>
                      <Typography as="span" size="xs" layoutClassName="text-right tabular-nums" textClassName="text-slate-500 dark:text-slate-400">{formatVND(m.material)}</Typography>
                      <Typography as="span" size="xs" layoutClassName="text-right tabular-nums" textClassName="text-slate-500 dark:text-slate-400">{formatVND(m.opex)}</Typography>
                      <Typography as="span" size="xs" layoutClassName="text-right tabular-nums" textClassName="text-slate-500 dark:text-slate-400">{m.refund ? formatVND(m.refund) : '—'}</Typography>
                      <Typography as="span" size="xs" layoutClassName="text-right font-semibold tabular-nums" textClassName={profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{formatVND(profit)}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
            <Typography as="p" size="xs" variant="muted">NVL đã loại sơn/dụng cụ. Chi phí (OPEX) chỉ có từ khi có dữ liệu SePay — tháng cũ hiển thị thấp là do thiếu dữ liệu, không phải lãi thật.</Typography>
          </Card>

          <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Công nợ */}
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
                <Typography size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Công nợ ({data.receivables.count} đơn)
                </Typography>
                <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-rose-600 dark:text-rose-400">Còn thu {formatVND(data.receivables.remaining)}</Typography>
              </Box>
              <Box layoutClassName="flex flex-wrap gap-2">
                {[['≤7 ngày', data.receivables.aging.d0_7], ['8–14', data.receivables.aging.d8_14], ['15–30', data.receivables.aging.d15_30], ['>30', data.receivables.aging.d30p]].map(([lbl, n]) => (
                  <Typography key={String(lbl)} as="span" size="xs" layoutClassName="rounded-full px-2 py-0.5 font-medium" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">{lbl}: {n as number}</Typography>
                ))}
              </Box>
              <Box layoutClassName="max-h-60 space-y-1 overflow-y-auto">
                {data.receivables.orders.map((o) => (
                  <Box key={o.orderNumber} layoutClassName="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5" backgroundClassName="bg-slate-50 dark:bg-slate-800/40">
                    <Box layoutClassName="min-w-0 flex-1">
                      <Typography as="p" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">{o.orderNumber} · {o.customerName}</Typography>
                      <Typography as="span" size="xs" variant="muted">Đã {formatVND(o.paidAmount)}/{formatVND(o.total)} · {o.ageDays} ngày</Typography>
                    </Box>
                    <Typography as="span" size="sm" layoutClassName="shrink-0 font-semibold" textClassName="text-rose-600 dark:text-rose-400">{formatVND(o.remaining)}</Typography>
                  </Box>
                ))}
              </Box>
            </Card>

            {/* Khách hàng */}
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Typography size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold">
                <Users className="h-4 w-4 text-primary-500" /> Khách hàng
              </Typography>
              <Box layoutClassName="flex flex-wrap gap-2">
                <Typography as="span" size="xs" layoutClassName="rounded-full px-2 py-0.5 font-medium" backgroundClassName="bg-primary-50 dark:bg-primary-900/30" textClassName="text-primary-700 dark:text-primary-300">Tổng {data.customers.total}</Typography>
                <Typography as="span" size="xs" layoutClassName="rounded-full px-2 py-0.5 font-medium" backgroundClassName="bg-emerald-50 dark:bg-emerald-950/40" textClassName="text-emerald-700 dark:text-emerald-300">Quay lại {data.customers.returning}</Typography>
                <Typography as="span" size="xs" layoutClassName="rounded-full px-2 py-0.5 font-medium" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">Mới {data.customers.newCount}</Typography>
              </Box>
              <Box layoutClassName="max-h-60 space-y-1 overflow-y-auto">
                {data.customers.top.map((c, i) => (
                  <Box key={`${c.name}-${i}`} layoutClassName="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5" backgroundClassName="bg-slate-50 dark:bg-slate-800/40">
                    <Typography as="p" size="sm" layoutClassName="min-w-0 flex-1 truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">{c.name} <Typography as="span" size="xs" variant="muted">· {c.orders} đơn</Typography></Typography>
                    <Typography as="span" size="sm" layoutClassName="shrink-0 font-semibold" textClassName="text-emerald-600 dark:text-emerald-400">{formatVND(c.revenue)}</Typography>
                  </Box>
                ))}
              </Box>
            </Card>

            {/* Giao SPX */}
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Typography size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold">
                <Clock className="h-4 w-4 text-cyan-500" /> Vận hành giao SPX
              </Typography>
              <Box layoutClassName="flex flex-wrap gap-1.5">
                {data.shipOps.trackingStatus.map((s) => (
                  <Typography key={s.status} as="span" size="xs" layoutClassName="rounded-full px-2 py-0.5 font-medium" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-slate-600 dark:text-slate-300">{s.status}: {s.n}</Typography>
                ))}
              </Box>
              <Box layoutClassName="space-y-1">
                <Typography as="p" size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">Thời gian giao (đã giao)</Typography>
                {([['≤1 ngày', data.shipOps.histogram.d1], ['2 ngày', data.shipOps.histogram.d2], ['3 ngày', data.shipOps.histogram.d3], ['4 ngày', data.shipOps.histogram.d4], ['5+ ngày', data.shipOps.histogram.d5p]] as [string, number][]).map(([lbl, n]) => {
                  const maxH = Math.max(1, data.shipOps.histogram.d1, data.shipOps.histogram.d2, data.shipOps.histogram.d3, data.shipOps.histogram.d4, data.shipOps.histogram.d5p);
                  return (
                    <Box key={lbl} layoutClassName="flex items-center gap-2">
                      <Typography as="span" size="xs" layoutClassName="w-16 shrink-0" textClassName="text-slate-500 dark:text-slate-400">{lbl}</Typography>
                      <Box layoutClassName="relative h-4 min-w-0 flex-1 overflow-hidden rounded" backgroundClassName="bg-slate-100 dark:bg-slate-700/50">
                        <Box layoutClassName="h-full rounded bg-cyan-400 dark:bg-cyan-500" style={{ width: `${Math.round((n / maxH) * 100)}%` }} />
                      </Box>
                      <Typography as="span" size="xs" layoutClassName="w-6 shrink-0 text-right tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{n}</Typography>
                    </Box>
                  );
                })}
              </Box>
              {data.shipOps.stuck.length > 0 ? (
                <Box layoutClassName="space-y-1">
                  <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-rose-600 dark:text-rose-400">Đơn kẹt (chưa giao ≥4 ngày)</Typography>
                  {data.shipOps.stuck.map((o) => (
                    <Typography key={o.orderNumber} as="p" size="xs" variant="muted">{o.orderNumber} · {o.customerName} — {o.ageDays} ngày</Typography>
                  ))}
                </Box>
              ) : null}
            </Card>

            {/* Doanh thu theo tỉnh */}
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
              <Typography size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold">
                <MapPin className="h-4 w-4 text-violet-500" /> Doanh thu theo tỉnh (ship)
              </Typography>
              <Box layoutClassName="max-h-60 space-y-1.5 overflow-y-auto">
                {(() => {
                  const maxRev = Math.max(1, ...data.provinceSales.map((p) => p.revenue));
                  return data.provinceSales.map((p) => (
                    <Box key={p.province} layoutClassName="flex items-center gap-2">
                      <Typography as="span" size="xs" layoutClassName="w-24 shrink-0 truncate font-medium" textClassName="text-slate-700 dark:text-slate-200">{p.province}</Typography>
                      <Box layoutClassName="relative h-4 min-w-0 flex-1 overflow-hidden rounded" backgroundClassName="bg-slate-100 dark:bg-slate-700/50">
                        <Box layoutClassName="h-full rounded bg-violet-400 dark:bg-violet-500" style={{ width: `${Math.max(4, Math.round((p.revenue / maxRev) * 100))}%` }} />
                      </Box>
                      <Typography as="span" size="xs" layoutClassName="w-28 shrink-0 text-right tabular-nums" textClassName="text-slate-600 dark:text-slate-300">{formatVND(p.revenue)} · {p.orders}đ</Typography>
                    </Box>
                  ));
                })()}
              </Box>
            </Card>

            {/* Cộng tác viên */}
            <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3 lg:col-span-2">
              <Typography size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold">
                <BarChart3 className="h-4 w-4 text-primary-500" /> Cộng tác viên (theo người tạo đơn)
              </Typography>
              <Box layoutClassName="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {data.collaborators.map((c) => (
                  <Box key={c.name} layoutClassName="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5" backgroundClassName="bg-slate-50 dark:bg-slate-800/40">
                    <Typography as="p" size="sm" layoutClassName="min-w-0 flex-1 truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">{c.name} <Typography as="span" size="xs" variant="muted">· {c.orders} đơn</Typography></Typography>
                    <Typography as="span" size="sm" layoutClassName="shrink-0 font-semibold" textClassName="text-emerald-600 dark:text-emerald-400">{formatVND(c.revenue)}</Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Box>

          {/* AI insight */}
          {insight ? (
            <Card padding="md" borderClassName="border-primary-200 dark:border-primary-800" backgroundClassName="bg-primary-50/40 dark:bg-primary-900/10" layoutClassName="space-y-4">
              <Box layoutClassName="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <Typography size="sm" layoutClassName="font-semibold" textClassName="text-primary-700 dark:text-primary-300">Nhận định từ Claude AI</Typography>
              </Box>
              {insight.summary ? (
                <Typography as="p" size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">{insight.summary}</Typography>
              ) : null}
              <Box layoutClassName="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InsightBlock icon={<TrendingUp className="h-4 w-4 text-primary-500" />} title="Điểm nổi bật" items={insight.highlights} />
                <InsightBlock icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} title="Xu hướng / mùa cao điểm" items={insight.trends} />
                <InsightBlock icon={<Truck className="h-4 w-4 text-cyan-500" />} title="Hình thức giao" items={insight.delivery} />
                <InsightBlock icon={<Package className="h-4 w-4 text-amber-500" />} title="Sản phẩm" items={insight.products} />
                <InsightBlock icon={<AlertTriangle className="h-4 w-4 text-rose-500" />} title="Cảnh báo" items={insight.risks} textClassName="text-rose-600 dark:text-rose-400" />
                <InsightBlock icon={<Lightbulb className="h-4 w-4 text-yellow-500" />} title="Đề xuất hành động" items={insight.actions} />
              </Box>
            </Card>
          ) : (
            <Card padding="md" borderClassName="border-dashed border-slate-300 dark:border-slate-700" layoutClassName="text-center">
              <Typography as="p" size="sm" variant="muted">
                Bấm <b>"Phân tích bằng AI"</b> để Claude đọc số liệu trên và đưa nhận định + đề xuất. (Chỉ gọi khi bạn bấm — không tự chạy.)
              </Typography>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default AnalyticsPage;
