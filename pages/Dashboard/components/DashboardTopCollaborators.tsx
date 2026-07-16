import React, { useMemo } from 'react';
import { Award } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { RankedList } from '@/components/ui/stats';
import { useCommissionSummaries } from '@/hooks/queries/useCommissionQuery';
import { formatVND } from '@/utils/format/currencyUtil';
import { parseDateValue } from '@/utils/format/dateUtil';

interface Props {
  startDate: Date;
  endDate: Date;
  limit?: number;
}

const RANK = ['bg-primary-400', 'bg-slate-300', 'bg-primary-300', 'bg-slate-200', 'bg-slate-200'];

/** Top CTV theo hoa hồng trong kỳ (lọc đơn theo deliveryDate). */
const DashboardTopCollaborators: React.FC<Props> = ({ startDate, endDate, limit = 5 }) => {
  // queryKey qk.commission.summaries; lỗi → summaries=[] (degrade êm như trước)
  const { summaries, loading } = useCommissionSummaries();

  const top = useMemo(() => {
    return summaries
      .map((s) => {
        let commission = 0;
        let sales = 0;
        let orderCount = 0;
        for (const o of s.orders || []) {
          if (!o.deliveryDate) continue;
          const d = parseDateValue(o.deliveryDate);
          if (!d || d < startDate || d > endDate) continue;
          commission += o.commissionAmount ?? 0;
          sales += o.total ?? 0;
          orderCount += 1;
        }
        return { name: s.collaboratorName, commission, sales, orderCount };
      })
      .filter((c) => c.orderCount > 0)
      .sort((a, b) => b.commission - a.commission || b.sales - a.sales)
      .slice(0, limit);
  }, [summaries, startDate, endDate, limit]);

  return (
    <Card padding="none" layoutClassName="flex flex-col overflow-hidden">
      <Box layoutClassName="flex items-center gap-2 border-b px-5 py-4" borderClassName="border-slate-100 dark:border-slate-700">
        <Award className="h-5 w-5 text-amber-500" />
        <Heading level={3} textClassName="text-lg font-semibold text-slate-800 dark:text-white">Top cộng tác viên</Heading>
      </Box>
      {loading ? (
        <Box layoutClassName="flex items-center justify-center py-12"><Spinner size="lg" textClassName="text-primary-500" /></Box>
      ) : top.length === 0 ? (
        <EmptyState icon={<Award className="h-6 w-6" />} title="Chưa có CTV bán trong kỳ." layoutClassName="flex-1" />
      ) : (
        <RankedList
          variant="divided"
          items={top.map((c, i) => ({
            key: c.name + i,
            rankClassName: `${RANK[i] ?? 'bg-slate-200'} text-slate-800`,
            primary: <Typography as="p" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-800 dark:text-slate-100">{c.name}</Typography>,
            secondary: <Typography as="p" size="xs" variant="muted">{c.orderCount} đơn · doanh số {formatVND(c.sales)}</Typography>,
            trailing: <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-emerald-600 dark:text-emerald-400">{formatVND(c.commission)}</Typography>,
          }))}
        />
      )}
    </Card>
  );
};

export default DashboardTopCollaborators;
