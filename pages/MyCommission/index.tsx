import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderStatus } from '@/types/enums';
import { CollaboratorCommissionSummary, fetchMyCommission } from '@/services/commissionService';
import { useAuth } from '@/contexts/AuthContext';
import { formatVND } from '@/utils/format/currencyUtil';
import Spinner from '@/components/ui/Spinner';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import FilterPill from '@/components/shared/FilterPill';
import { CommissionBadge } from '../Commission/components/commissionUi';

/* ════════════════════════════════════════ HOA HỒNG CỦA TÔI (cho CTV) ════ */
/** Khoá tháng "YYYY-MM" từ ngày giao của đơn (null nếu không có ngày hợp lệ) */
const monthKeyOf = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const SummaryCard: React.FC<{ label: string; value: string; valueClassName?: string }> = ({
  label, value, valueClassName,
}) => (
  <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
    <Typography size="xs" variant="muted" layoutClassName="mb-1 font-medium uppercase tracking-wide">
      {label}
    </Typography>
    <Typography as="p" layoutClassName="text-lg font-bold" textClassName={valueClassName ?? 'text-slate-900 dark:text-white'}>
      {value}
    </Typography>
  </Card>
);

const MyCommissionPage: React.FC = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CollaboratorCommissionSummary | null>(null);
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!userData?.uid) return;
    setLoading(true);
    fetchMyCommission()
      .then(setSummary)
      .catch((e: any) => toast.error(e?.message || 'Không thể tải hoa hồng của bạn'))
      .finally(() => setLoading(false));
  }, [userData?.uid]);

  // Danh sách tháng (mới nhất lên đầu), luôn có tháng đang chọn + "Tất cả"
  const periodOptions = useMemo(() => {
    const set = new Set<string>();
    (summary?.orders ?? []).forEach(o => {
      const m = monthKeyOf(o.deliveryDate);
      if (m) set.add(m);
    });
    set.add(period);
    const months = Array.from(set).sort().reverse().map(m => {
      const [y, mo] = m.split('-');
      return { value: m, label: `Tháng ${Number(mo)}/${y}` };
    });
    return [{ value: 'all', label: 'Tất cả tháng' }, ...months];
  }, [summary, period]);

  // Lọc theo tháng + tính lại tổng
  const view = useMemo(() => {
    const orders = (summary?.orders ?? []).filter(
      o => period === 'all' || monthKeyOf(o.deliveryDate) === period,
    );
    let totalCommission = 0, pendingCommission = 0, paidCommission = 0;
    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED) continue;
      const c = o.commissionAmount ?? 0;
      totalCommission += c;
      if (o.commissionStatus === 'paid') paidCommission += c;
      else pendingCommission += c;
    }
    return { orders, totalCommission, pendingCommission, paidCommission };
  }, [summary, period]);

  const hasAnyOrder = (summary?.orders.length ?? 0) > 0;

  const statusColor = (status: OrderStatus, paid: boolean) => {
    if (status === OrderStatus.CANCELLED || status === OrderStatus.RETURNED)
      return 'text-red-400 line-through';
    return paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
  };

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      {/* Header */}
      <Box layoutClassName="flex items-center gap-3">
        <Box layoutClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <Wallet className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </Box>
        <Box layoutClassName="min-w-0 flex-1">
          <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
            Hoa hồng của tôi
          </Typography>
          <Typography as="p" size="xs" variant="muted">
            Theo dõi hoa hồng từ các đơn bạn đã bán
          </Typography>
        </Box>
        {hasAnyOrder && (
          <FilterPill label="Tháng" value={period} options={periodOptions} onChange={setPeriod} />
        )}
      </Box>

      {/* Content */}
      <Box layoutClassName="flex-1 overflow-y-auto">
        {loading ? (
          <Box layoutClassName="flex justify-center py-16">
            <Spinner size="lg" textClassName="text-primary-500" />
          </Box>
        ) : !hasAnyOrder ? (
          <Box layoutClassName="flex flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
            <Box layoutClassName="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Receipt className="h-8 w-8 opacity-30" />
            </Box>
            <Typography as="p" size="sm" variant="muted">Bạn chưa có đơn nào được tính hoa hồng</Typography>
          </Box>
        ) : (
          <Box layoutClassName="space-y-4">
            {/* Summary cards */}
            <Box layoutClassName="grid grid-cols-3 gap-3">
              <SummaryCard label="Tổng hoa hồng" value={formatVND(view.totalCommission)} />
              <SummaryCard
                label="Chưa trả"
                value={formatVND(view.pendingCommission)}
                valueClassName={view.pendingCommission > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}
              />
              <SummaryCard label="Đã trả" value={formatVND(view.paidCommission)} valueClassName="text-emerald-600 dark:text-emerald-400" />
            </Box>

            {/* Order list */}
            {view.orders.length === 0 ? (
              <Box layoutClassName="py-12 text-center" textClassName="text-sm text-slate-400 dark:text-slate-500">
                Không có đơn nào trong tháng này
              </Box>
            ) : (
              <Card padding="none" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700" layoutClassName="overflow-hidden">
                <Box layoutClassName="border-b border-slate-100 px-4 py-2.5 dark:border-slate-700/60">
                  <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
                    Chi tiết đơn ({view.orders.length})
                  </Typography>
                </Box>
                <Box layoutClassName="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {view.orders.map(order => {
                    const cancelled =
                      order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED;
                    const isPaid = order.commissionStatus === 'paid';
                    return (
                      <Box key={order.id} layoutClassName="flex items-center gap-3 px-4 py-3 text-sm">
                        <Box layoutClassName="min-w-0 flex-1">
                          <Typography as="span" layoutClassName={`font-medium ${statusColor(order.status, isPaid)}`}>
                            {order.orderNumber || order.id}
                          </Typography>
                          <Typography as="span" size="xs" layoutClassName="ml-2" textClassName="text-slate-400">
                            {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : ''}
                          </Typography>
                        </Box>
                        <Box layoutClassName="shrink-0 text-right">
                          <Typography as="p" layoutClassName={`font-semibold ${statusColor(order.status, isPaid)}`}>
                            {formatVND(order.commissionAmount ?? 0)}
                          </Typography>
                          <Typography as="p" size="xs" textClassName="text-slate-400">/ {formatVND(order.total)}</Typography>
                        </Box>
                        <CommissionBadge status={order.commissionStatus} cancelled={cancelled} />
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MyCommissionPage;
