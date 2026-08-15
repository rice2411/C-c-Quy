import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
} from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentStatus } from '@/types';
import { fetchDineInHistory } from '@/services/tableService';
import { formatVND } from '@/utils/format/currencyUtil';
import { fmtDateTime, fmtTime, fmtDuration, useNowTick } from './time';

/** Tab "Lịch sử bàn" — mọi phiên vào/ra của tất cả bàn, mới nhất trước. */
const DineInHistory: React.FC<{ active: boolean }> = ({ active }) => {
  const { currentUser } = useAuth();
  const now = useNowTick(30000);
  const query = useQuery({
    queryKey: ['dine-in', 'history'],
    queryFn: fetchDineInHistory,
    enabled: !!currentUser && active,
    refetchOnWindowFocus: true,
  });
  const sessions = query.data ?? [];

  if (query.isLoading) {
    return <Box layoutClassName="flex flex-1 items-center justify-center py-16"><Spinner size="lg" /></Box>;
  }
  if (sessions.length === 0) {
    return <EmptyState icon={<History className="w-6 h-6" />} title="Chưa có phiên nào"
      description="Lịch sử vào/ra của các bàn sẽ hiện ở đây." />;
  }

  return (
    <Box
      layoutClassName="flex-1 overflow-hidden"
      backgroundClassName="bg-white dark:bg-slate-800"
      borderClassName="border border-slate-200 dark:border-slate-700"
      roundedClassName="rounded-xl"
    >
      <Box layoutClassName="overflow-x-auto">
        <Table>
          <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
            <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <TableHeaderCell layoutClassName="px-3 py-2.5">Bàn</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-3 py-2.5">Vào</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-3 py-2.5">Ra</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-3 py-2.5">Thời lượng</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-3 py-2.5">Khách</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-3 py-2.5 text-right">Tổng</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-3 py-2.5">TT</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => {
              const open = !s.leftAt;
              const paid = s.paymentStatus === PaymentStatus.PAID;
              return (
                <TableRow key={s.id}>
                  <TableCell layoutClassName="px-3 py-2.5">
                    <Typography textClassName="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {s.tableName ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell layoutClassName="px-3 py-2.5">
                    <Typography textClassName="text-sm text-slate-600 dark:text-slate-300">{fmtDateTime(s.seatedAt)}</Typography>
                  </TableCell>
                  <TableCell layoutClassName="px-3 py-2.5">
                    <Typography textClassName="text-sm text-slate-600 dark:text-slate-300">
                      {open ? 'đang ngồi' : fmtTime(s.leftAt)}
                    </Typography>
                  </TableCell>
                  <TableCell layoutClassName="px-3 py-2.5">
                    <Typography textClassName="text-sm text-slate-600 dark:text-slate-300">
                      {fmtDuration(s.seatedAt, open ? now : (s.leftAt ? new Date(s.leftAt).getTime() : undefined))}
                    </Typography>
                  </TableCell>
                  <TableCell layoutClassName="px-3 py-2.5">
                    <Typography textClassName="text-sm text-slate-600 dark:text-slate-300">{s.guestCount ?? '—'}</Typography>
                  </TableCell>
                  <TableCell layoutClassName="px-3 py-2.5 text-right">
                    <Typography textClassName="text-sm font-semibold text-slate-900 dark:text-white">{formatVND(s.total)}</Typography>
                  </TableCell>
                  <TableCell layoutClassName="px-3 py-2.5">
                    <Badge size="sm"
                      backgroundClassName={paid ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700'}
                      textClassName={paid ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}
                      borderClassName={paid ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-600'}>
                      {paid ? 'Đã TT' : 'Chưa'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default DineInHistory;
