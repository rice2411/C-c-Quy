import React, { useEffect, useMemo, useState } from 'react';
import { Target, Pencil, Check, X, TrendingUp, CalendarCheck, Gauge } from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { useOrders } from '@/hooks/useOrders';
import { getOrderRevenueDate, getOrderTotal } from '@/utils/order/orderUtils';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Typography from '@/components/ui/Typography';
import { MetricCard, TrendChart } from '@/components/ui/stats';

const LS_MIN = 'goals.dailyMin';
const LS_EXP = 'goals.dailyExpected';

/** Doanh thu ghi nhận theo NGÀY trong tháng hiện tại (đơn DELIVERED + PAID). */
const dailyRevenueThisMonth = (orders: Order[]): Map<number, number> => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const map = new Map<number, number>();
  for (const o of orders) {
    if (o.paymentStatus !== PaymentStatus.PAID || o.status !== OrderStatus.DELIVERED) continue;
    const d = getOrderRevenueDate(o);
    if (!d || d.getFullYear() !== y || d.getMonth() !== m) continue;
    const day = d.getDate();
    map.set(day, (map.get(day) ?? 0) + getOrderTotal(o));
  }
  return map;
};

const GoalsPage: React.FC = () => {
  const { orders } = useOrders();
  const [minDaily, setMinDaily] = useState(0);
  const [expectedDaily, setExpectedDaily] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draftMin, setDraftMin] = useState('');
  const [draftExp, setDraftExp] = useState('');

  useEffect(() => {
    try {
      setMinDaily(Number(localStorage.getItem(LS_MIN)) || 0);
      setExpectedDaily(Number(localStorage.getItem(LS_EXP)) || 0);
    } catch { /* ignore */ }
  }, []);

  const startEdit = () => {
    setDraftMin(minDaily ? String(minDaily) : '');
    setDraftExp(expectedDaily ? String(expectedDaily) : '');
    setEditing(true);
  };
  const save = () => {
    const mn = Number(draftMin.replace(/[^\d]/g, '')) || 0;
    const ex = Number(draftExp.replace(/[^\d]/g, '')) || 0;
    setMinDaily(mn); setExpectedDaily(ex);
    try { localStorage.setItem(LS_MIN, String(mn)); localStorage.setItem(LS_EXP, String(ex)); } catch { /* ignore */ }
    setEditing(false);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const todayDay = now.getDate();
    const map = dailyRevenueThisMonth(orders);
    // Chuỗi tới hôm nay (bỏ ngày tương lai để không kéo đường về 0).
    const chart = Array.from({ length: todayDay }, (_, i) => {
      const day = i + 1;
      return {
        day: `${day}/${now.getMonth() + 1}`,
        revenue: map.get(day) ?? 0,
        min: minDaily,
        expected: expectedDaily,
      };
    });
    const todayRevenue = map.get(todayDay) ?? 0;
    const total = chart.reduce((s, c) => s + c.revenue, 0);
    const hitExpected = expectedDaily > 0 ? chart.filter((c) => c.revenue >= expectedDaily).length : 0;
    const hitMin = minDaily > 0 ? chart.filter((c) => c.revenue >= minDaily).length : 0;
    const belowMin = minDaily > 0 ? chart.filter((c) => c.revenue < minDaily).length : 0;
    const avg = todayDay > 0 ? total / todayDay : 0;
    return { chart, todayRevenue, total, hitExpected, hitMin, belowMin, avg, todayDay };
  }, [orders, minDaily, expectedDaily]);

  const configured = minDaily > 0 || expectedDaily > 0;
  const todayVsMin = stats.todayRevenue - minDaily;
  const todayVsExp = stats.todayRevenue - expectedDaily;

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4">
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-2.5">
          <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-xl" backgroundClassName="bg-primary-100 dark:bg-primary-900/30">
            <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </Box>
          <Box>
            <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">Mục tiêu doanh thu</Heading>
            <Typography as="p" size="xs" variant="muted">Đặt mức tối thiểu &amp; kỳ vọng mỗi ngày, theo dõi thực tế trong tháng.</Typography>
          </Box>
        </Box>
      </Box>

      {/* Cài đặt mục tiêu ngày */}
      <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
        <Box layoutClassName="mb-3 flex items-center justify-between">
          <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">Mục tiêu mỗi ngày</Typography>
          {!editing ? (
            <Button type="button" onClick={startEdit} variant="ghost" leftIcon={<Pencil />} iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5" sizeClassName="px-2.5 py-1 text-xs" roundedClassName="rounded-md" backgroundClassName="bg-slate-100 dark:bg-slate-700/50" textClassName="font-medium text-slate-600 dark:text-slate-300" layoutClassName="inline-flex items-center gap-1">Sửa</Button>
          ) : null}
        </Box>
        {editing ? (
          <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Box layoutClassName="space-y-1.5">
              <Label className="mb-0">Tối thiểu / ngày (VND)</Label>
              <Input type="number" value={draftMin} onChange={(e) => setDraftMin(e.target.value)} placeholder="vd 1.000.000" fullWidth />
            </Box>
            <Box layoutClassName="space-y-1.5">
              <Label className="mb-0">Kỳ vọng / ngày (VND)</Label>
              <Input type="number" value={draftExp} onChange={(e) => setDraftExp(e.target.value)} placeholder="vd 2.500.000" fullWidth />
            </Box>
            <Box layoutClassName="flex gap-2 sm:col-span-2">
              <Button type="button" onClick={save} variant="primary" leftIcon={<Check />} iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4" sizeClassName="px-3.5 py-2 text-sm" roundedClassName="rounded-lg" backgroundClassName="bg-primary-600" hoverClassName="hover:bg-primary-700" textClassName="font-medium text-white" layoutClassName="inline-flex items-center gap-1.5" disableVariantHover>Lưu</Button>
              <Button type="button" onClick={() => setEditing(false)} variant="secondary" leftIcon={<X />} iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4" sizeClassName="px-3.5 py-2 text-sm" roundedClassName="rounded-lg" borderClassName="border border-slate-200 dark:border-slate-600" backgroundClassName="bg-white dark:bg-slate-800" textClassName="text-slate-600 dark:text-slate-300" layoutClassName="inline-flex items-center gap-1.5">Huỷ</Button>
            </Box>
          </Box>
        ) : (
          <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Box layoutClassName="flex items-center justify-between rounded-lg px-3 py-2.5" backgroundClassName="bg-rose-50 dark:bg-rose-900/15">
              <Typography size="sm" textClassName="text-rose-700 dark:text-rose-300">Tối thiểu / ngày</Typography>
              <Typography size="sm" layoutClassName="font-bold" textClassName="text-rose-700 dark:text-rose-300">{minDaily > 0 ? formatVND(minDaily) : '—'}</Typography>
            </Box>
            <Box layoutClassName="flex items-center justify-between rounded-lg px-3 py-2.5" backgroundClassName="bg-emerald-50 dark:bg-emerald-900/15">
              <Typography size="sm" textClassName="text-emerald-700 dark:text-emerald-300">Kỳ vọng / ngày</Typography>
              <Typography size="sm" layoutClassName="font-bold" textClassName="text-emerald-700 dark:text-emerald-300">{expectedDaily > 0 ? formatVND(expectedDaily) : '—'}</Typography>
            </Box>
          </Box>
        )}
      </Card>

      {!configured ? (
        <Card padding="md" backgroundClassName="bg-amber-50 dark:bg-amber-900/15" borderClassName="border-amber-200 dark:border-amber-800">
          <Typography size="sm" textClassName="text-amber-700 dark:text-amber-300">Chưa đặt mục tiêu — bấm "Sửa" để nhập mức tối thiểu &amp; kỳ vọng mỗi ngày.</Typography>
        </Card>
      ) : null}

      {/* KPI hôm nay */}
      <Box layoutClassName="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Doanh thu hôm nay"
          value={formatVND(stats.todayRevenue)}
          valueSize="xl"
          icon={TrendingUp}
          iconWrapClassName="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
        />
        <MetricCard
          label="So với tối thiểu"
          value={`${todayVsMin >= 0 ? '+' : '−'}${formatVND(Math.abs(todayVsMin))}`}
          valueClassName={todayVsMin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
          valueSize="xl"
          icon={Gauge}
          iconWrapClassName="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
        />
        <MetricCard
          label="So với kỳ vọng"
          value={`${todayVsExp >= 0 ? '+' : '−'}${formatVND(Math.abs(todayVsExp))}`}
          valueClassName={todayVsExp >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
          valueSize="xl"
          icon={Target}
          iconWrapClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
        <MetricCard
          label="TB / ngày (tháng này)"
          value={formatVND(stats.avg)}
          valueSize="xl"
          icon={CalendarCheck}
          iconWrapClassName="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
      </Box>

      {/* Biểu đồ doanh thu theo ngày + 2 đường min/kỳ vọng */}
      <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
        <Box layoutClassName="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary-500" />
          <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">Doanh thu theo ngày (tháng này)</Typography>
        </Box>
        {stats.chart.length === 0 ? (
          <Box layoutClassName="flex h-64 items-center justify-center">
            <Typography size="xs" variant="muted">Chưa có dữ liệu</Typography>
          </Box>
        ) : (
          <TrendChart
            data={stats.chart}
            xKey="day"
            series={[
              { key: 'revenue', label: 'Doanh thu', color: '#3b82f6' },
              { key: 'min', label: 'Tối thiểu', color: '#ef4444' },
              { key: 'expected', label: 'Kỳ vọng', color: '#16a34a' },
            ]}
            type="line"
            formatValue={formatVND}
            heightClassName="h-64 sm:h-72"
          />
        )}
      </Card>

      {/* Thống kê kỳ */}
      <Box layoutClassName="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Ngày đạt kỳ vọng" value={`${stats.hitExpected}/${stats.todayDay}`} valueSize="xl" icon={Target} iconWrapClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" />
        <MetricCard label="Ngày đạt tối thiểu" value={`${stats.hitMin}/${stats.todayDay}`} valueSize="xl" icon={Gauge} iconWrapClassName="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" />
        <MetricCard label="Ngày dưới tối thiểu" value={`${stats.belowMin}/${stats.todayDay}`} valueClassName={stats.belowMin > 0 ? 'text-rose-600 dark:text-rose-400' : undefined} valueSize="xl" icon={X} iconWrapClassName="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" />
        <MetricCard label="Tổng tháng này" value={formatVND(stats.total)} valueSize="xl" icon={TrendingUp} iconWrapClassName="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" />
      </Box>
    </Box>
  );
};

export default GoalsPage;
