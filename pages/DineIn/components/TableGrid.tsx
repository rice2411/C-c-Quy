import React from 'react';
import { Clock, Users, Utensils } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import { DiningTable, tableStatus, tableStatusLabel } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';

const fmtTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

/** Lưới thẻ bàn kiểu POS — gọn, dễ bấm trên tablet. Bấm thẻ → mở panel order. */
const TableGrid: React.FC<{
  tables: DiningTable[];
  onTableClick: (t: DiningTable) => void;
}> = ({ tables, onTableClick }) => (
  <Box layoutClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {tables.map((t) => {
      const occupied = tableStatus(t) === 'occupied';
      const co = t.currentOrder;
      return (
        <Box
          key={t.id}
          layoutClassName="flex flex-col gap-2 p-3.5 min-h-[128px]"
          backgroundClassName={occupied ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-slate-800'}
          borderClassName={
            occupied
              ? 'border-2 border-amber-300 dark:border-amber-700'
              : 'border-2 border-emerald-200 dark:border-emerald-800'
          }
          roundedClassName="rounded-xl"
          shadowClassName="shadow-sm"
          hoverClassName="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => onTableClick(t)}
        >
          <Box layoutClassName="flex items-center justify-between">
            <Typography textClassName="text-base font-bold text-slate-900 dark:text-white">
              {t.name}
            </Typography>
            <Badge
              size="sm"
              backgroundClassName={occupied ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'}
              textClassName={occupied ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}
              borderClassName={occupied ? 'border-amber-200 dark:border-amber-800' : 'border-emerald-200 dark:border-emerald-800'}
            >
              {tableStatusLabel(tableStatus(t))}
            </Badge>
          </Box>

          {occupied ? (
            <Box layoutClassName="flex flex-col gap-1.5 mt-0.5">
              <Box layoutClassName="flex items-center gap-3 text-xs">
                <Typography textClassName="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> {fmtTime(co?.seatedAt)}
                </Typography>
                <Typography textClassName="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Users className="w-3.5 h-3.5" /> {co?.guestCount ?? '—'}
                </Typography>
                <Typography textClassName="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Utensils className="w-3.5 h-3.5" /> {co?.itemCount ?? 0}
                </Typography>
              </Box>
              <Typography textClassName="text-lg font-bold text-amber-700 dark:text-amber-300">
                {formatVND(co?.total ?? 0)}
              </Typography>
            </Box>
          ) : (
            <Box layoutClassName="flex flex-1 flex-col justify-center gap-0.5">
              <Typography textClassName="text-sm text-slate-500 dark:text-slate-400">
                {t.seats} ghế
              </Typography>
              <Typography textClassName="text-xs text-emerald-600 dark:text-emerald-400">
                Bấm để mở bàn
              </Typography>
            </Box>
          )}
        </Box>
      );
    })}
  </Box>
);

export default TableGrid;
