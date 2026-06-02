import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from '@/types';
import { OrderStatus } from '@/types/enums';
import {
  CollaboratorCommissionSummary,
  markCommissionPaid,
  markCommissionPending,
} from '@/services/commissionService';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Badge from '@/components/ui/Badge';
import Typography from '@/components/ui/Typography';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import { CommissionBadge, ButtonSpinner } from './commissionUi';

interface CollabRowProps {
  summary: CollaboratorCommissionSummary;
  onRefresh: () => void;
}

const CollabRow: React.FC<CollabRowProps> = ({ summary, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const activeOrders = summary.orders.filter(
    o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED,
  );
  const pendingOrders = activeOrders.filter(o => o.commissionStatus !== 'paid');
  const allPendingSelected =
    pendingOrders.length > 0 && pendingOrders.every(o => selected.has(o.id));

  const toggleSelect = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleMarkPaid = async () => {
    const ids: string[] = Array.from(selected);
    if (!ids.length) return;
    setBusy(true);
    try {
      await markCommissionPaid(ids);
      toast.success(`Đã trả HH cho ${ids.length} đơn`);
      onRefresh();
    } catch { toast.error('Không thể cập nhật'); }
    finally { setBusy(false); setSelected(new Set()); }
  };

  const handleUnmark = async (orderId: string) => {
    setBusy(true);
    try {
      await markCommissionPending([orderId]);
      toast.success('Đã đặt lại thành chưa trả');
      onRefresh();
    } catch { toast.error('Không thể cập nhật'); }
    finally { setBusy(false); }
  };

  const statusColor = (order: Order) => {
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED)
      return 'text-red-400 line-through';
    if (order.commissionStatus === 'paid') return 'text-emerald-600 dark:text-emerald-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <Box layoutClassName="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800">
      <Button
        type="button"
        onClick={() => setExpanded(v => !v)}
        variant="ghost"
        disableVariantHover
        disableVariantTextColor
        borderClassName="border-transparent"
        layoutClassName="flex w-full items-center gap-3 text-left"
        sizeClassName="p-4"
        backgroundClassName="hover:bg-slate-50 dark:hover:bg-slate-700/50"
        stateClassName="transition-colors">
        <Box layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          {summary.collaboratorName.charAt(0).toUpperCase()}
        </Box>
        <Box layoutClassName="min-w-0 flex-1">
          <Box layoutClassName="flex items-center gap-2">
            <Typography as="span" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{summary.collaboratorName}</Typography>
            {summary.pendingCommission > 0 && (
              <Badge
                size="sm"
                borderClassName="border-transparent"
                backgroundClassName="bg-amber-100 dark:bg-amber-900/30"
                textClassName="text-[10px] font-bold text-amber-700 dark:text-amber-300"
              >
                Chưa trả
              </Badge>
            )}
          </Box>
          <Box layoutClassName="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs" textClassName="text-slate-500 dark:text-slate-400">
            <Typography as="span" size="xs" variant="muted">{summary.orders.length} đơn</Typography>
            <Typography as="span" size="xs" variant="muted">Doanh số: {formatVND(summary.totalSales)}</Typography>
          </Box>
        </Box>
        <Box layoutClassName="shrink-0 text-right">
          <Typography as="p" size="sm" layoutClassName="font-bold" textClassName="text-slate-900 dark:text-white">{formatVND(summary.totalCommission)}</Typography>
          <Box layoutClassName="text-xs">
            {summary.pendingCommission > 0
              ? <Typography as="span" size="xs" variant="muted" textClassName="text-amber-600 dark:text-amber-400">Chưa trả: {formatVND(summary.pendingCommission)}</Typography>
              : <Typography as="span" size="xs" variant="success">Đã trả hết</Typography>}
          </Box>
        </Box>
        <Box layoutClassName="shrink-0" textClassName="text-slate-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Box>
      </Button>

      {expanded && (
        <Box layoutClassName="border-t border-slate-100 dark:border-slate-700">
          {pendingOrders.length > 0 && (
            <Box layoutClassName="flex items-center gap-3 bg-slate-50 px-4 py-2.5 dark:bg-slate-700/40">
              <Checkbox checked={allPendingSelected}
                onChange={() =>
                  setSelected(
                    allPendingSelected ? new Set() : new Set(pendingOrders.map(o => o.id)),
                  )
                }
                borderClassName="accent-orange-500"
              />
              <Typography as="span" size="xs" variant="muted" layoutClassName="flex-1">
                {selected.size > 0 ? `Đã chọn ${selected.size} đơn` : 'Chọn tất cả chưa trả'}
              </Typography>
              {selected.size > 0 && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={handleMarkPaid}
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  borderClassName="border-transparent"
                  layoutClassName="flex items-center gap-1.5"
                  roundedClassName="rounded-lg"
                  backgroundClassName="bg-emerald-600 hover:bg-emerald-700"
                  sizeClassName="px-3 py-1.5 text-xs"
                  textClassName="font-semibold text-white"
                  stateClassName="disabled:opacity-60">
                  {busy ? <ButtonSpinner /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Đánh dấu đã trả
                </Button>
              )}
            </Box>
          )}
          <Box layoutClassName="divide-y divide-slate-50 dark:divide-slate-700/50">
            {summary.orders.map(order => {
              const cancelled =
                order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED;
              const isPaid = order.commissionStatus === 'paid';
              const isPending = !cancelled && !isPaid;
              return (
                <Box key={order.id} layoutClassName="flex items-center gap-3 px-4 py-3 text-sm">
                  {isPending
                    ? <Checkbox checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} borderClassName="accent-orange-500" />
                    : <Box layoutClassName="h-4 w-4 shrink-0" />}
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="span" layoutClassName={`font-medium ${statusColor(order)}`}>{order.orderNumber || order.id}</Typography>
                    <Typography as="span" size="xs" layoutClassName="ml-2" textClassName="text-slate-400">
                      {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : ''}
                    </Typography>
                  </Box>
                  <Box layoutClassName="shrink-0 text-right">
                    <Typography as="p" layoutClassName={`font-semibold ${statusColor(order)}`}>{formatVND(order.commissionAmount ?? 0)}</Typography>
                    <Typography as="p" size="xs" textClassName="text-slate-400">/ {formatVND(order.total)}</Typography>
                  </Box>
                  <CommissionBadge status={order.commissionStatus} cancelled={cancelled} />
                  {isPaid && (
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => handleUnmark(order.id)}
                      title="Đặt lại thành chưa trả"
                      variant="ghost"
                      disableVariantHover
                      disableVariantTextColor
                      borderClassName="border-transparent"
                      layoutClassName="ml-1 shrink-0"
                      roundedClassName="rounded"
                      sizeClassName="p-1"
                      backgroundClassName="hover:bg-slate-100 dark:hover:bg-slate-700"
                      textClassName="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                      stateClassName="transition-colors disabled:opacity-50">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CollabRow;
