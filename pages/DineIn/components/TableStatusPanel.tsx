import React, { useState } from 'react';
import { Clock, DoorClosed, Pencil, Plus, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { DiningTable, PaymentStatus, tableOpenOrders, tableTotal, tableSeatedAt } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { fmtTime, fmtDurationClock, useNowTick } from './time';

interface TableStatusPanelProps {
  isOpen: boolean;
  table: DiningTable | null;
  onClose: () => void;
  /** Tạo thêm 1 đơn cho bàn (mở OrderForm). */
  onAddOrder: () => void;
  /** Sửa 1 đơn (mở OrderForm với đơn đó). */
  onEditOrder: (orderId: string) => void;
  /** Đóng (kết thúc) 1 đơn của bàn — set giờ ra. */
  onCloseOrder: (orderId: string) => Promise<void>;
}

const TableStatusPanel: React.FC<TableStatusPanelProps> = ({
  isOpen, table, onClose, onAddOrder, onEditOrder, onCloseOrder,
}) => {
  const now = useNowTick(1000);
  const [busy, setBusy] = useState(false);

  if (!table) return null;
  const orders = tableOpenOrders(table);

  const closeOne = async (orderId: string, allPaid: boolean) => {
    if (!allPaid && !window.confirm('Đơn này chưa thanh toán. Vẫn đóng?')) return;
    setBusy(true);
    try {
      await onCloseOrder(orderId);
      toast.success('Đã đóng đơn');
    } catch {
      toast.error('Đóng đơn thất bại');
    } finally {
      setBusy(false);
    }
  };

  const closeAll = async () => {
    if (!window.confirm(`Đóng toàn bộ ${orders.length} đơn của ${table.name}?`)) return;
    setBusy(true);
    try {
      for (const o of orders) await onCloseOrder(o.id);
      toast.success(`Đã đóng ${table.name}`);
      onClose();
    } catch {
      toast.error('Đóng bàn thất bại');
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <Box layoutClassName="flex flex-col gap-2">
      <Box layoutClassName="flex items-center justify-between">
        <Typography textClassName="text-sm text-slate-500 dark:text-slate-400">
          Tổng cả bàn ({orders.length} đơn)
        </Typography>
        <Typography textClassName="text-lg font-bold text-slate-900 dark:text-white">
          {formatVND(tableTotal(table))}
        </Typography>
      </Box>
      <Button variant="secondary" onClick={onAddOrder} disabled={busy} leftIcon={<Plus className="w-4 h-4" />}>
        Thêm đơn vào bàn
      </Button>
      {orders.length > 0 && (
        <Button variant="primary" onClick={closeAll} disabled={busy} leftIcon={<DoorClosed className="w-4 h-4" />}>
          Đóng bàn (tất cả {orders.length} đơn)
        </Button>
      )}
    </Box>
  );

  return (
    <BaseSlidePanel isOpen={isOpen} onClose={onClose} maxWidth="md"
      title={`${table.name} · Đang ngồi`} footer={footer}>
      <Box layoutClassName="flex flex-col gap-4 p-6">
        {/* Đồng hồ từ đơn vào sớm nhất */}
        <Box layoutClassName="flex items-center justify-between p-3"
          backgroundClassName="bg-amber-50 dark:bg-amber-900/20" roundedClassName="rounded-xl">
          <Box layoutClassName="flex flex-col gap-0.5">
            <Typography textClassName="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Đã ngồi
            </Typography>
            <Typography textClassName="text-xs text-amber-600 dark:text-amber-400">
              Vào lúc {fmtTime(tableSeatedAt(table))}
            </Typography>
          </Box>
          <Typography textClassName="font-mono text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-200">
            {fmtDurationClock(tableSeatedAt(table), now)}
          </Typography>
        </Box>

        {/* Danh sách đơn của bàn */}
        {orders.length === 0 ? (
          <EmptyState icon={<Utensils className="w-6 h-6" />} title="Bàn chưa có đơn"
            description="Bấm “Thêm đơn vào bàn” để tạo đơn." />
        ) : (
          <Box layoutClassName="flex flex-col gap-2">
            <Typography textClassName="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Các đơn ({orders.length})
            </Typography>
            {orders.map((o) => {
              const paid = o.paymentStatus === PaymentStatus.PAID;
              return (
                <Box key={o.id} layoutClassName="flex flex-col gap-2 p-3"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  borderClassName="border border-slate-200 dark:border-slate-700" roundedClassName="rounded-xl">
                  <Box layoutClassName="flex items-center justify-between">
                    <Typography textClassName="text-sm font-bold text-slate-900 dark:text-white">
                      {o.orderNumber ?? '—'}
                    </Typography>
                    <Badge size="sm"
                      backgroundClassName={paid ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700'}
                      textClassName={paid ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}
                      borderClassName={paid ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-600'}>
                      {paid ? 'Đã TT' : 'Chưa TT'}
                    </Badge>
                  </Box>
                  <Box layoutClassName="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <Typography textClassName="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {fmtTime(o.seatedAt)} · ⏱ {fmtDurationClock(o.seatedAt, now)}
                    </Typography>
                    <Typography textClassName="flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5" /> {o.itemCount} món
                    </Typography>
                  </Box>
                  <Box layoutClassName="flex items-center justify-between gap-2">
                    <Typography textClassName="text-base font-bold text-slate-900 dark:text-white">
                      {formatVND(o.total)}
                    </Typography>
                    <Box layoutClassName="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => onEditOrder(o.id)} disabled={busy} leftIcon={<Pencil className="w-4 h-4" />}>
                        Sửa
                      </Button>
                      <Button variant="ghost" onClick={() => closeOne(o.id, paid)} disabled={busy} leftIcon={<DoorClosed className="w-4 h-4" />}>
                        Đóng
                      </Button>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </BaseSlidePanel>
  );
};

export default TableStatusPanel;
