import React, { useMemo, useState } from 'react';
import { Download, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrders } from '@/hooks/useOrders';
import { useLanguage } from '@/contexts/LanguageContext';
import { OrderStatus } from '@/types/enums';
import { revenueOrdersInPeriod } from '@/services/revenueService';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import FilterToolbar from '@/components/shared/FilterToolbar';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';

const STATUS_LABEL: Record<string, string> = {
  [OrderStatus.PENDING]: 'Chờ xử lý',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.DELIVERED]: 'Đã giao',
  [OrderStatus.CANCELLED]: 'Đã huỷ',
  [OrderStatus.RETURNED]: 'Trả hàng',
};

const fmtDate = (s?: string) => {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

const RevenueTab: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { orders } = useOrders();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const periodOrders = useMemo(
    () => revenueOrdersInPeriod(orders, fromDate, toDate)
      .sort((a, b) => new Date(b.deliveryDate ?? 0).getTime() - new Date(a.deliveryDate ?? 0).getTime()),
    [orders, fromDate, toDate],
  );

  const view = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return periodOrders;
    return periodOrders.filter(o =>
      (o.orderNumber ?? '').toLowerCase().includes(q) ||
      (o.customer?.name ?? '').toLowerCase().includes(q),
    );
  }, [periodOrders, search]);

  const total = useMemo(() => view.reduce((s, o) => s + (o.total ?? 0), 0), [view]);

  const exportExcel = async () => {
    if (view.length === 0) { toast.error('Không có đơn để xuất'); return; }
    // Nạp XLSX (~849KB) theo yêu cầu — chỉ tải khi user bấm xuất.
    const XLSX = await import('xlsx-js-style');
    const rows = view.map(o => ({
      'Mã đơn': o.orderNumber ?? o.id,
      'Ngày giao': fmtDate(o.deliveryDate),
      'Khách hàng': o.customer?.name ?? '',
      'Trạng thái': STATUS_LABEL[o.status] ?? o.status,
      'Tổng tiền': o.total ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DoanhThu');
    XLSX.writeFile(wb, `doanh-thu_${fromDate}_${toDate}.xlsx`);
    toast.success('Đã xuất Excel');
  };

  return (
    <Box layoutClassName="space-y-4">
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('transactions.searchRevenue')}
        actions={
          <Button
            type="button"
            onClick={exportExcel}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            layoutClassName="flex shrink-0 items-center gap-1.5"
            roundedClassName="rounded-xl"
            borderClassName="border border-slate-200 hover:border-emerald-300 dark:border-slate-700"
            backgroundClassName="bg-white hover:bg-emerald-50 dark:bg-slate-800"
            sizeClassName="px-3 py-2.5 text-xs"
            textClassName="font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300"
            stateClassName="transition-colors">
            <Download className="h-4 w-4" /> Xuất Excel
          </Button>
        }
      />

      {view.length === 0 ? (
        <Box layoutClassName="flex flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
          <Box layoutClassName="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Receipt className="h-8 w-8 opacity-30" />
          </Box>
          <Typography size="sm" variant="muted">Không có đơn doanh thu trong kỳ</Typography>
        </Box>
      ) : (
        <Card padding="none" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700" layoutClassName="overflow-x-auto">
          <Table>
            <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-900/40">
              <TableRow>
                <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mã đơn</TableHeaderCell>
                <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ngày giao</TableHeaderCell>
                <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Khách hàng</TableHeaderCell>
                <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Trạng thái</TableHeaderCell>
                <TableHeaderCell layoutClassName="px-4 py-2.5 text-right" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tổng tiền</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {view.map(o => (
                <TableRow key={o.id} borderClassName="border-t border-slate-50 dark:border-slate-700/50">
                  <TableCell layoutClassName="px-4 py-2.5" textClassName="text-sm font-medium text-slate-800 dark:text-slate-200">{o.orderNumber || o.id}</TableCell>
                  <TableCell layoutClassName="px-4 py-2.5" textClassName="text-sm text-slate-500 dark:text-slate-400">{fmtDate(o.deliveryDate)}</TableCell>
                  <TableCell layoutClassName="px-4 py-2.5" textClassName="text-sm text-slate-600 dark:text-slate-300">{o.customer?.name || '—'}</TableCell>
                  <TableCell layoutClassName="px-4 py-2.5">
                    <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                      {STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                  </TableCell>
                  <TableCell layoutClassName="px-4 py-2.5 text-right" textClassName="text-sm font-semibold text-slate-900 dark:text-white">{formatVND(o.total ?? 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box layoutClassName="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/30">
            <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">Tổng doanh thu ({view.length} đơn)</Typography>
            <Typography as="span" layoutClassName="text-base font-bold" textClassName="text-emerald-600 dark:text-emerald-400">{formatVND(total)}</Typography>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default RevenueTab;
