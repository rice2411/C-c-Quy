import React, { useEffect, useMemo, useState } from 'react';
import { Coins, TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderStatus } from '@/types/enums';
import { CollaboratorCommissionSummary } from '@/services/commissionService';
import { fetchCommissionSummariesApi } from '@/services/api/commissionApi';
import { formatVND } from '@/utils/format/currencyUtil';
import Spinner from '@/components/ui/Spinner';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import FilterToolbar from '@/components/shared/FilterToolbar';
import StatsBanner from '@/pages/BillImport/StatsBanner';
import CollabRow from './components/CollabRow';

type SortKey = 'commission' | 'name';

const SORT_OPTIONS = [
  { value: 'commission', label: 'Tổng HH cao nhất' },
  { value: 'name', label: 'Tên A-Z' },
];

/** Khoá tháng "YYYY-MM" từ ngày giao của đơn (null nếu không có ngày hợp lệ) */
const monthKeyOf = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/* ════════════════════════════════════════ TRANG CHỦ: Thống kê hoa hồng CTV ════ */
const CommissionPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<CollaboratorCommissionSummary[]>([]);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('commission');
  const [onlyPending, setOnlyPending] = useState(false);
  const [period, setPeriod] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      setSummaries(await fetchCommissionSummariesApi());
    } catch (e: any) {
      toast.error(e?.message || 'Không thể tải dữ liệu hoa hồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Danh sách tháng có đơn (mới nhất lên đầu)
  const periodOptions = useMemo(() => {
    const set = new Set<string>();
    summaries.forEach(s => s.orders.forEach(o => {
      const m = monthKeyOf(o.deliveryDate);
      if (m) set.add(m);
    }));
    const months = Array.from(set).sort().reverse().map(m => {
      const [y, mo] = m.split('-');
      return { value: m, label: `Tháng ${Number(mo)}/${y}` };
    });
    return [{ value: 'all', label: 'Tất cả tháng' }, ...months];
  }, [summaries]);

  // Lọc theo tháng & tính lại tổng cho từng CTV (giữ logic bỏ qua đơn huỷ/hoàn)
  const monthFiltered = useMemo(() => {
    if (period === 'all') return summaries;
    const result: CollaboratorCommissionSummary[] = [];
    for (const s of summaries) {
      const orders = s.orders.filter(o => monthKeyOf(o.deliveryDate) === period);
      if (orders.length === 0) continue;
      let totalSales = 0, totalCommission = 0, pendingCommission = 0, paidCommission = 0;
      for (const o of orders) {
        if (o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED) continue;
        const c = o.commissionAmount ?? 0;
        const sales = (o.total ?? 0) - (o.shippingCost ?? 0);
        totalSales += sales > 0 ? sales : 0;
        totalCommission += c;
        if (o.commissionStatus === 'paid') paidCommission += c;
        else pendingCommission += c;
      }
      result.push({ ...s, orders, totalSales, totalCommission, pendingCommission, paidCommission });
    }
    return result;
  }, [summaries, period]);

  const totalPending = useMemo(() => monthFiltered.reduce((s, x) => s + x.pendingCommission, 0), [monthFiltered]);
  const totalPaid = useMemo(() => monthFiltered.reduce((s, x) => s + x.paidCommission, 0), [monthFiltered]);
  const pendingCtvCount = useMemo(() => monthFiltered.filter(x => x.pendingCommission > 0).length, [monthFiltered]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = monthFiltered;
    if (q) list = list.filter(s => s.collaboratorName.toLowerCase().includes(q));
    if (onlyPending) list = list.filter(s => s.pendingCommission > 0);
    const sorted = [...list];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.collaboratorName.localeCompare(b.collaboratorName, 'vi'));
    } else {
      sorted.sort((a, b) => b.totalCommission - a.totalCommission);
    }
    return sorted;
  }, [monthFiltered, search, sortBy, onlyPending]);

  const hasFilter = Boolean(search) || onlyPending || period !== 'all';

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      {/* Header */}
      <Box layoutClassName="flex items-center gap-3">
        <Box layoutClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
          <Coins className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </Box>
        <Box>
          <Typography as="h1" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
            Hoa hồng CTV
          </Typography>
          <Typography as="p" size="xs" variant="muted">
            Thống kê &amp; thanh toán hoa hồng cộng tác viên
          </Typography>
        </Box>
      </Box>

      {/* Toolbar: tìm kiếm + sắp xếp + lọc + thống kê */}
      <Card padding="none" layoutClassName="p-3" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm CTV theo tên..."
          period={period}
          periodOptions={periodOptions}
          onPeriodChange={setPeriod}
          sortBy={sortBy}
          sortOptions={SORT_OPTIONS}
          onSortChange={v => setSortBy(v as SortKey)}
          pills={[
            {
              id: 'pending',
              label: 'Chỉ CTV chưa trả',
              active: onlyPending,
              icon: Clock,
              onClick: () => setOnlyPending(v => !v),
            },
          ]}
          onClearAll={() => { setSearch(''); setOnlyPending(false); setPeriod('all'); }}
          showClearAll={hasFilter}
          stats={
            <StatsBanner
              items={[
                { icon: Clock, label: 'Chưa trả', value: formatVND(totalPending), accent: totalPending > 0 ? '#d97706' : '#64748b' },
                { icon: CheckCircle2, label: 'Đã trả', value: formatVND(totalPaid), accent: '#16a34a' },
                { icon: Users, label: 'Số CTV', value: String(monthFiltered.length), accent: '#0ea5e9' },
                { icon: TrendingUp, label: 'CTV chưa trả', value: String(pendingCtvCount), accent: pendingCtvCount > 0 ? '#d97706' : '#64748b' },
              ]}
            />
          }
        />
      </Card>

      {/* Content */}
      <Box layoutClassName="flex-1 overflow-y-auto">
        {loading ? (
          <Box layoutClassName="flex justify-center py-16">
            <Spinner size="lg" textClassName="text-orange-500" />
          </Box>
        ) : !summaries.length ? (
          <Box layoutClassName="flex flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
            <Box layoutClassName="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <TrendingUp className="h-8 w-8 opacity-30" />
            </Box>
            <Typography as="p" size="sm" variant="muted">Chưa có đơn nào có hoa hồng CTV</Typography>
            <Typography as="p" size="xs" textClassName="text-slate-300 dark:text-slate-600">Cài đặt nhóm &amp; giá cost cho sản phẩm trước</Typography>
          </Box>
        ) : !visible.length ? (
          <Box layoutClassName="py-16 text-center" textClassName="text-sm text-slate-400 dark:text-slate-500">
            Không tìm thấy CTV phù hợp
          </Box>
        ) : (
          <Box layoutClassName="space-y-3">
            {visible.map(s => <CollabRow key={s.collaboratorUid} summary={s} onRefresh={() => load()} />)}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CommissionPage;
