import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, RotateCcw, ListOrdered, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderStatus } from '@/types/enums';
import { CollaboratorCommissionSummary } from '@/services/commissionService';
import { useCommissionMutations } from '@/hooks/queries/useCommissionQuery';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Badge from '@/components/ui/Badge';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { CommissionBadge, ButtonSpinner } from './commissionUi';

interface CollabRowProps {
  summary: CollaboratorCommissionSummary;
}

/** Một dòng sản phẩm đã gộp của CTV */
interface ProductAgg {
  key: string;
  name: string;
  image: string;
  qty: number;
  commission: number;
  groupName: string;
  rates: Set<number>;
  groupQtys: Set<number>;
}

const pctLabel = (rates: Set<number>): string => {
  const vals = Array.from(rates).filter(r => r > 0).map(r => +(r * 100).toFixed(1)).sort((a, b) => a - b);
  if (vals.length === 0) return '';
  if (vals.length === 1) return `${vals[0]}%`;
  return `${vals[0]}–${vals[vals.length - 1]}%`;
};

const CollabRow: React.FC<CollabRowProps> = ({ summary }) => {
  const { markPaid, markPending } = useCommissionMutations();
  const [expanded, setExpanded] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeOrders = summary.orders.filter(
    o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED,
  );
  const pendingOrders = activeOrders.filter(o => o.commissionStatus !== 'paid');
  const paidOrders = activeOrders.filter(o => o.commissionStatus === 'paid');

  // Gộp theo sản phẩm: tổng SL + tổng HH + nhóm + các rate/SL-nhóm đã áp
  const products = useMemo<ProductAgg[]>(() => {
    const map = new Map<string, ProductAgg>();
    for (const o of activeOrders) {
      for (const it of o.items ?? []) {
        const key = it.id || it.name;
        const cur = map.get(key) ?? {
          key, name: it.name, image: it.image, qty: 0, commission: 0,
          groupName: '', rates: new Set<number>(), groupQtys: new Set<number>(),
        };
        cur.qty += it.quantity ?? 0;
        cur.commission += it.commissionAmount ?? 0;
        if (it.commissionGroupName) cur.groupName = it.commissionGroupName;
        if (it.commissionRate) cur.rates.add(it.commissionRate);
        if (it.commissionGroupQty) cur.groupQtys.add(it.commissionGroupQty);
        map.set(key, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.commission - a.commission);
  }, [activeOrders]);

  const totalQty = useMemo(() => products.reduce((s, p) => s + p.qty, 0), [products]);

  const handleMarkAllPaid = async () => {
    const ids = pendingOrders.map(o => o.id);
    if (!ids.length) return;
    setBusy(true);
    try {
      await markPaid(ids);
      toast.success(`Đã trả HH cho ${summary.collaboratorName} (${ids.length} đơn)`);
    } catch { toast.error('Không thể cập nhật'); }
    finally { setBusy(false); }
  };

  const handleUnmarkAll = async () => {
    const ids = paidOrders.map(o => o.id);
    if (!ids.length) return;
    setBusy(true);
    try {
      await markPending(ids);
      toast.success('Đã đặt lại thành chưa trả');
    } catch { toast.error('Không thể cập nhật'); }
    finally { setBusy(false); }
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
        <Box layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
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
            <Typography as="span" size="xs" variant="muted">{totalQty} sản phẩm</Typography>
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
          {/* Thanh thanh toán gộp cả CTV */}
          <Box layoutClassName="flex items-center gap-3 bg-slate-50 px-4 py-2.5 dark:bg-slate-700/40">
            {pendingOrders.length > 0 ? (
              <>
                <Typography as="span" size="xs" variant="muted" layoutClassName="flex-1">
                  Chưa trả {formatVND(summary.pendingCommission)} · {pendingOrders.length} đơn
                </Typography>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={handleMarkAllPaid}
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
                  Đánh dấu tất cả đã trả
                </Button>
              </>
            ) : (
              <>
                <Typography as="span" size="xs" layoutClassName="flex-1 font-medium" textClassName="text-emerald-600 dark:text-emerald-400">
                  Đã trả hết hoa hồng
                </Typography>
                {paidOrders.length > 0 && (
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={handleUnmarkAll}
                    title="Đặt lại tất cả thành chưa trả"
                    variant="ghost"
                    disableVariantHover
                    disableVariantTextColor
                    borderClassName="border-transparent"
                    layoutClassName="flex items-center gap-1.5"
                    roundedClassName="rounded-lg"
                    backgroundClassName="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                    sizeClassName="px-3 py-1.5 text-xs"
                    textClassName="font-semibold text-slate-500 dark:text-slate-400"
                    stateClassName="disabled:opacity-60">
                    {busy ? <ButtonSpinner className="border-slate-400" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    Đặt lại tất cả
                  </Button>
                )}
              </>
            )}
          </Box>

          {/* Gộp theo sản phẩm */}
          {products.length === 0 ? (
            <EmptyState icon={<Package className="h-6 w-6" />} title="Không có sản phẩm tính hoa hồng" />
          ) : (
            <Box layoutClassName="divide-y divide-slate-50 dark:divide-slate-700/50">
              {products.map(p => {
                const rate = pctLabel(p.rates);
                const tierQty = p.groupQtys.size === 1 ? Array.from(p.groupQtys)[0] : null;
                return (
                  <Box key={p.key} layoutClassName="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <Box layoutClassName="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} layoutClassName="h-full w-full object-cover" />
                      ) : (
                        <Box layoutClassName="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400 dark:bg-slate-700">?</Box>
                      )}
                    </Box>
                    <Box layoutClassName="min-w-0 flex-1">
                      <Box layoutClassName="flex items-center gap-1.5">
                        <Typography as="span" layoutClassName="min-w-0 truncate font-medium" textClassName="text-slate-800 dark:text-slate-200">{p.name}</Typography>
                        {p.groupName && (
                          <Badge
                            size="sm"
                            borderClassName="border-transparent"
                            backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
                            textClassName="text-[10px] font-semibold text-primary-700 dark:text-primary-300"
                          >
                            {p.groupName}
                          </Badge>
                        )}
                      </Box>
                      <Typography as="span" size="xs" textClassName="text-slate-400 dark:text-slate-500">
                        SL {p.qty}
                        {tierQty !== null ? ` · nhóm đạt ${tierQty} sp/tháng` : ''}
                        {rate ? ` → ${rate} LN` : ''}
                      </Typography>
                    </Box>
                    <Typography as="span" layoutClassName="shrink-0 font-semibold" textClassName="text-slate-900 dark:text-white">{formatVND(p.commission)}</Typography>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Nút xem chi tiết theo đơn */}
          <Box layoutClassName="border-t border-slate-100 px-4 py-2.5 dark:border-slate-700">
            <Button
              type="button"
              onClick={() => setShowOrders(v => !v)}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              borderClassName="border-transparent"
              layoutClassName="inline-flex items-center gap-1.5"
              roundedClassName="rounded-lg"
              backgroundClassName="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50"
              sizeClassName="px-2 py-1 text-xs"
              textClassName="font-medium text-slate-500 dark:text-slate-400"
              stateClassName="transition-colors">
              <ListOrdered className="h-3.5 w-3.5" />
              Chi tiết đơn hàng ({summary.orders.length})
              {showOrders ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </Box>

          {showOrders && (
            <Box layoutClassName="divide-y divide-slate-50 border-t border-slate-100 dark:divide-slate-700/50 dark:border-slate-700">
              {summary.orders.map(order => {
                const cancelled =
                  order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED;
                return (
                  <Box key={order.id} layoutClassName="px-4 py-3 text-sm">
                    <Box layoutClassName="flex items-center gap-3">
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography as="span" layoutClassName={cancelled ? 'font-medium line-through' : 'font-medium'} textClassName={cancelled ? 'text-red-400' : 'text-slate-700 dark:text-slate-300'}>
                          {order.orderNumber || order.id}
                        </Typography>
                        <Typography as="span" size="xs" layoutClassName="ml-2" textClassName="text-slate-400">
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : ''}
                        </Typography>
                      </Box>
                      <Typography as="span" layoutClassName="shrink-0 font-semibold" textClassName="text-slate-900 dark:text-white">{formatVND(order.commissionAmount ?? 0)}</Typography>
                      <CommissionBadge status={order.commissionStatus} cancelled={cancelled} />
                    </Box>
                    {(order.items ?? []).length > 0 && (
                      <Box layoutClassName="mt-1.5 space-y-0.5">
                        {(order.items ?? []).map((it, idx) => (
                          <Box key={it.id || idx} layoutClassName="flex items-center justify-between gap-2">
                            <Typography as="span" size="xs" layoutClassName="min-w-0 flex-1 truncate" textClassName="text-slate-500 dark:text-slate-400">
                              {it.quantity}× {it.name}
                            </Typography>
                            <Typography as="span" size="xs" layoutClassName="shrink-0" textClassName="text-slate-400 dark:text-slate-500">
                              {formatVND(it.commissionAmount ?? 0)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CollabRow;
