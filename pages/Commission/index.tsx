import React, { useMemo, useState } from 'react';
import { TrendingUp, Users, CheckCircle2, Clock, Award, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderStatus } from '@/types/enums';
import { CollaboratorCommissionSummary } from '@/services/commissionService';
import { useCommissionSummaries } from '@/hooks/queries/useCommissionQuery';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/format/currencyUtil';
import Spinner from '@/components/ui/Spinner';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import EmptyState from '@/components/ui/EmptyState';
import FilterToolbar from '@/components/shared/FilterToolbar';
import StatsBanner from '@/pages/StockReceipts/StatsBanner';
import CollabRow from './components/CollabRow';

type SortKey = 'commission' | 'name';

/** Khoá tháng "YYYY-MM" từ ngày giao của đơn (null nếu không có ngày hợp lệ) */
const monthKeyOf = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/* ════════════════════════════════════════ TRANG CHỦ: Thống kê hoa hồng CTV ════ */
const CommissionPage: React.FC = () => {
  const { summaries, loading, error } = useCommissionSummaries();
  const { t } = useLanguage();

  const SORT_OPTIONS = [
    { value: 'commission', label: t('commission.sort.commission') },
    { value: 'name', label: t('commission.sort.name') },
  ];

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('commission');
  const [onlyPending, setOnlyPending] = useState(false);
  // Mặc định lọc theo THÁNG HIỆN TẠI (không phải "tất cả").
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  React.useEffect(() => {
    if (error) toast.error(error.message || 'Không thể tải dữ liệu hoa hồng');
  }, [error]);

  // Danh sách tháng có đơn (mới nhất lên đầu)
  const periodOptions = useMemo(() => {
    const set = new Set<string>();
    summaries.forEach(s => s.orders.forEach(o => {
      const m = monthKeyOf(o.deliveryDate);
      if (m) set.add(m);
    }));
    set.add(period); // luôn có tháng đang chọn (kể cả tháng hiện tại chưa có đơn)
    const months = Array.from(set).sort().reverse().map(m => {
      const [y, mo] = m.split('-');
      return { value: m, label: `Tháng ${Number(mo)}/${y}` };
    });
    return [{ value: 'all', label: 'Tất cả tháng' }, ...months];
  }, [summaries, period]);

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
      {/* Toolbar: tìm kiếm + sắp xếp + lọc + thống kê */}
      <Card padding="none" layoutClassName="p-3" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('commission.searchPlaceholder')}
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
            <Spinner size="lg" textClassName="text-primary-500" />
          </Box>
        ) : !summaries.length ? (
          <EmptyState
            icon={<Award className="h-6 w-6" />}
            title="Chưa có đơn nào có hoa hồng CTV"
            description="Cài đặt nhóm & giá cost cho sản phẩm trước"
            layoutClassName="flex-1"
          />
        ) : !visible.length ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="Không tìm thấy CTV phù hợp"
            layoutClassName="flex-1"
          />
        ) : (
          <Box layoutClassName="space-y-3">
            {visible.map(s => <CollabRow key={s.collaboratorUid} summary={s} />)}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CommissionPage;
