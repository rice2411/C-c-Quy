import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  Users,
  Banknote,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import {
  CollaboratorCommissionSummary,
  buildCommissionSummary,
  fetchCommissionOrders,
  markCommissionPaid,
  markCommissionPending,
} from '@/services/commissionService';
import { OrderStatus } from '@/types/enums';
import Spinner from '@/components/ui/Spinner';

import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
const statusColor = (order: Order) => {
  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED) {
    return 'text-red-400 line-through';
  }
  if (order.commissionStatus === 'paid') return 'text-emerald-600 dark:text-emerald-400';
  return 'text-amber-600 dark:text-amber-400';
};

const CommissionBadge: React.FC<{ status: 'pending' | 'paid' | undefined; cancelled?: boolean }> = ({
  status,
  cancelled,
}) => {
  if (cancelled)
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 dark:bg-red-900/20">
        Đã huỷ
      </span>
    );
  if (status === 'paid')
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Đã trả
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
      <Clock className="h-3 w-3" /> Chưa trả
    </span>
  );
};

/* ── Row theo CTV ── */
interface CollabRowProps {
  summary: CollaboratorCommissionSummary;
  onRefresh: () => void;
}

const CollabRow: React.FC<CollabRowProps> = ({ summary, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const activeOrders = useMemo(
    () =>
      summary.orders.filter(
        o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED,
      ),
    [summary.orders],
  );

  const pendingOrders = useMemo(
    () => activeOrders.filter(o => o.commissionStatus !== 'paid'),
    [activeOrders],
  );

  const allPendingSelected =
    pendingOrders.length > 0 && pendingOrders.every(o => selected.has(o.id));

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingOrders.map(o => o.id)));
    }
  };

  const handleMarkPaid = async () => {
    const ids: string[] = Array.from(selected);
    if (ids.length === 0) return;
    setBusy(true);
    try {
      await markCommissionPaid(ids);
      toast.success(`Đã trả HH cho ${ids.length} đơn`);
      onRefresh();
    } catch {
      toast.error('Không thể cập nhật');
    } finally {
      setBusy(false);
      setSelected(new Set());
    }
  };

  const handleUnmark = async (orderId: string) => {
    setBusy(true);
    try {
      await markCommissionPending([orderId]);
      toast.success('Đã đặt lại thành chưa trả');
      onRefresh();
    } catch {
      toast.error('Không thể cập nhật');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Header row */}
      <Button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
       variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          {summary.collaboratorName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">
              {summary.collaboratorName}
            </span>
            {summary.pendingCommission > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Chưa trả
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{summary.orders.length} đơn</span>
            <span>Doanh số: {formatVND(summary.totalSales)}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {formatVND(summary.totalCommission)}
          </div>
          <div className="text-xs">
            {summary.pendingCommission > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                Chưa trả: {formatVND(summary.pendingCommission)}
              </span>
            )}
            {summary.pendingCommission === 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">Đã trả hết</span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-slate-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </Button>

      {/* Order list */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          {/* Bulk action bar */}
          {pendingOrders.length > 0 && (
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 dark:bg-slate-700/40">
              <Checkbox checked={allPendingSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 accent-orange-500" />
              <span className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                {selected.size > 0 ? `Đã chọn ${selected.size} đơn` : 'Chọn tất cả chưa trả'}
              </span>
              {selected.size > 0 && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={handleMarkPaid}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                 variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                  {busy ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Đánh dấu đã trả
                </Button>
              )}
            </div>
          )}

          {/* Order rows */}
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {summary.orders.map(order => {
              const cancelled =
                order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED;
              const isPaid = order.commissionStatus === 'paid';
              const isPending = !cancelled && !isPaid;

              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                >
                  {isPending && (
                    <Checkbox checked={selected.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="h-4 w-4 rounded border-slate-300 accent-orange-500"
                    />
                  )}
                  {!isPending && <div className="h-4 w-4 shrink-0" />}

                  <div className="min-w-0 flex-1">
                    <span className={`font-medium ${statusColor(order)}`}>
                      {order.orderNumber || order.id}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString('vi-VN')
                        : ''}
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className={`font-semibold ${statusColor(order)}`}>
                      {formatVND(order.commissionAmount ?? 0)}
                    </div>
                    <div className="text-xs text-slate-400">
                      / {formatVND(order.total)}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <CommissionBadge status={order.commissionStatus} cancelled={cancelled} />
                  </div>

                  {isPaid && (
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => handleUnmark(order.id)}
                      title="Đặt lại thành chưa trả"
                      className="ml-1 shrink-0 rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 disabled:opacity-50 dark:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-400"
                     variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main CommissionTab ── */
const CommissionTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<CollaboratorCommissionSummary[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const orders = await fetchCommissionOrders();
      const data = await buildCommissionSummary(orders);
      setSummaries(data);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải dữ liệu hoa hồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalPending = useMemo(
    () => summaries.reduce((s, x) => s + x.pendingCommission, 0),
    [summaries],
  );
  const totalPaid = useMemo(
    () => summaries.reduce((s, x) => s + x.paidCommission, 0),
    [summaries],
  );
  const pendingCtvCount = useMemo(
    () => summaries.filter(x => x.pendingCommission > 0).length,
    [summaries],
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner size="lg" textClassName="text-orange-500" />
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <TrendingUp className="h-8 w-8 opacity-30" />
        </div>
        <p className="text-sm">Chưa có đơn nào có hoa hồng CTV</p>
        <p className="text-xs text-slate-300 dark:text-slate-600">
          Hoa hồng được tính khi CTV tạo đơn chứa sản phẩm có % hoa hồng
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Chưa trả
          </p>
          <p className={`text-lg font-bold ${totalPending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {formatVND(totalPending)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Đã trả
          </p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatVND(totalPaid)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                CTV pending
              </p>
              <p className={`text-lg font-bold ${pendingCtvCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {pendingCtvCount}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Collab rows */}
      <div className="space-y-3">
        {summaries.map(summary => (
          <CollabRow key={summary.collaboratorUid} summary={summary} onRefresh={load} />
        ))}
      </div>
    </div>
  );
};

export default CommissionTab;
