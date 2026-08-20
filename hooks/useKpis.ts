/**
 * Metric layer (FE) — 1 NƠI định nghĩa bộ KPI điều hành + so kỳ trước.
 *
 * Mọi số lấy từ MỘT nguồn duy nhất: `revenue_report` (server-side, qua useRevenueReport).
 * Gọi 2 kỳ (hiện tại + trước) → tính delta. Component chỉ render KpiItem[] qua <KpiGrid/>,
 * KHÔNG tự tính stats → đồng nhất logic + cấu trúc UI toàn hệ.
 */
import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DollarSign, TrendingUp, ArrowLeftRight, ShoppingCart } from 'lucide-react';
import { useRevenueReport } from '@/hooks/queries/useTransactionsQuery';
import { formatVND } from '@/utils/format/currencyUtil';

export type KpiTone = 'emerald' | 'rose' | 'primary' | 'blue' | 'amber' | 'violet' | 'slate';

/** 1 chỉ số điều hành (đã derive value + delta + meta hiển thị). */
export interface KpiItem {
  key: string;
  label: string;
  /** Giá trị đã format sẵn để hiển thị. */
  display: string;
  /** Class màu cho value (tuỳ chọn, vd lợi nhuận âm → đỏ). */
  valueClassName?: string;
  /** % thay đổi so kỳ trước. */
  deltaPct: number;
  /** Giảm = tốt (vd chi phí). */
  invert?: boolean;
  /** Ghi chú phụ dưới delta. */
  note?: string;
  icon: LucideIcon;
  tone: KpiTone;
  /** Route drill-down khi bấm thẻ. */
  to?: string;
}

export interface UseKpisParams {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
}

export interface UseKpisResult {
  items: KpiItem[];
  loading: boolean;
}

/** % thay đổi so kỳ trước (prev=0 → 100% nếu có tăng, 0 nếu cùng 0). */
const pct = (cur: number, prev: number): number =>
  prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

/**
 * Bộ KPI điều hành chuẩn (dùng ở Dashboard cockpit; tái dùng được cho mọi hub).
 * Định nghĩa chỉ số (công thức + nguồn + route) nằm TẬP TRUNG ở đây.
 */
export const useKpis = ({ from, to, prevFrom, prevTo }: UseKpisParams): UseKpisResult => {
  const { report, loading } = useRevenueReport({ from, to });
  const { report: prev } = useRevenueReport({ from: prevFrom, to: prevTo });

  const items = useMemo<KpiItem[]>(() => {
    if (!report) return [];
    const p = prev ?? undefined;
    const netFlow = report.bankIn - report.bankOut;
    const prevNetFlow = p ? p.bankIn - p.bankOut : 0;
    return [
      {
        key: 'revenue',
        label: 'Doanh thu thuần',
        display: formatVND(report.netRevenue),
        deltaPct: pct(report.netRevenue, p?.netRevenue ?? 0),
        icon: DollarSign,
        tone: 'emerald',
        to: '/finance/overview',
      },
      {
        key: 'profit',
        label: 'Lợi nhuận',
        display: formatVND(report.profit),
        valueClassName: report.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        deltaPct: pct(report.profit, p?.profit ?? 0),
        note: `Biên LN ${(report.margin * 100).toFixed(1)}%`,
        icon: TrendingUp,
        tone: 'primary',
        to: '/finance/overview',
      },
      {
        key: 'flow',
        label: 'Dòng tiền ròng',
        display: `${netFlow >= 0 ? '+' : '−'}${formatVND(Math.abs(netFlow))}`,
        valueClassName: netFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        deltaPct: pct(netFlow, prevNetFlow),
        note: `Vào ${formatVND(report.bankIn)} · Ra ${formatVND(report.bankOut)}`,
        icon: ArrowLeftRight,
        tone: 'blue',
        to: '/finance/ledger',
      },
      {
        key: 'orders',
        label: 'Đơn trong kỳ',
        display: String(report.orderCount),
        deltaPct: pct(report.orderCount, p?.orderCount ?? 0),
        icon: ShoppingCart,
        tone: 'violet',
        to: '/orders',
      },
    ];
  }, [report, prev]);

  return { items, loading: loading && !report };
};
