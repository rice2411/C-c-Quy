import React, { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Target, X } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { getOrderTotal } from '@/utils/order/orderUtils';

interface DashboardGoalProgressProps {
  orders: Order[];
}

const STORAGE_KEY = 'dashboard.monthlyTarget';

/**
 * Goal progress — target doanh thu THÁNG hiện tại.
 *   - Target lưu localStorage (per-browser, không cần backend).
 *   - Actual = sum revenue của đơn DELIVERED+PAID trong tháng hiện tại.
 *   - Hiện: %, actual/target, ngày còn lại, cần TB mỗi ngày để đạt target.
 *   - Click icon ✏️ để edit inline.
 */
const DashboardGoalProgress: React.FC<DashboardGoalProgressProps> = ({ orders }) => {
  const [target, setTarget] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v) setTarget(Number(v) || 0);
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    const n = Number(draft.replace(/[^\d]/g, '')) || 0;
    setTarget(n);
    try {
      localStorage.setItem(STORAGE_KEY, String(n));
    } catch {
      // ignore
    }
    setEditing(false);
  };

  const handleStartEdit = () => {
    setDraft(String(target || ''));
    setEditing(true);
  };

  const { actual, daysLeft, dailyNeeded, percent } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    let sum = 0;
    for (const o of orders) {
      if (o.paymentStatus !== PaymentStatus.PAID || o.status !== OrderStatus.DELIVERED) continue;
      const created = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt as any);
      if (created < start || created > end) continue;
      sum += getOrderTotal(o);
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysRemaining = Math.max(
      0,
      Math.ceil((end.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );
    const remaining = Math.max(0, target - sum);
    const dn = daysRemaining > 0 ? remaining / daysRemaining : 0;
    const pct = target > 0 ? Math.min(100, Math.round((sum / target) * 100)) : 0;

    return {
      actual: sum,
      daysLeft: daysRemaining,
      dailyNeeded: dn,
      percent: pct,
    };
  }, [orders, target]);

  const reached = target > 0 && actual >= target;

  return (
    <Card padding="none" layoutClassName="overflow-hidden">
      <Box
        layoutClassName="flex items-center justify-between border-b px-5 py-3"
        borderClassName="border-slate-100 dark:border-slate-700"
      >
        <Box layoutClassName="flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-500" />
          <Heading level={3} textClassName="text-base font-semibold">
            Mục tiêu doanh thu tháng
          </Heading>
        </Box>
        {!editing ? (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" />
            {target > 0 ? 'Sửa mục tiêu' : 'Đặt mục tiêu'}
          </button>
        ) : null}
      </Box>

      <Box layoutClassName="p-5">
        {editing ? (
          <Box layoutClassName="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nhập mục tiêu (VND, vd: 50000000)"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white hover:bg-orange-700"
              aria-label="Lưu"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
              aria-label="Huỷ"
            >
              <X className="h-4 w-4" />
            </button>
          </Box>
        ) : target <= 0 ? (
          <Box layoutClassName="py-6 text-center">
            <Typography as="div" size="sm" variant="muted">
              Chưa đặt mục tiêu tháng. Bấm <strong>Đặt mục tiêu</strong> ở góc trên để bắt đầu.
            </Typography>
          </Box>
        ) : (
          <>
            <Box layoutClassName="flex items-baseline justify-between gap-3">
              <Box layoutClassName="flex flex-col">
                <Typography as="span" size="xs" variant="muted">
                  Đã đạt
                </Typography>
                <Typography
                  as="div"
                  size="xl"
                  textClassName="font-bold text-slate-900 dark:text-white"
                  layoutClassName="tabular-nums"
                >
                  {formatVND(actual)}
                </Typography>
              </Box>
              <Box layoutClassName="flex flex-col items-end">
                <Typography as="span" size="xs" variant="muted">
                  Mục tiêu
                </Typography>
                <Typography as="div" size="sm" textClassName="font-semibold text-slate-700 dark:text-slate-200" layoutClassName="tabular-nums">
                  {formatVND(target)}
                </Typography>
              </Box>
            </Box>

            {/* Progress bar */}
            <Box layoutClassName="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <Box
                layoutClassName={`h-full rounded-full transition-all ${
                  reached ? 'bg-emerald-500' : 'bg-orange-500'
                }`}
                stateClassName="transition-all duration-500"
              >
                <div style={{ width: `${percent}%`, height: '100%' }} />
              </Box>
            </Box>

            <Box layoutClassName="mt-2 flex items-center justify-between">
              <Typography
                as="span"
                size="sm"
                textClassName={reached ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-orange-600 dark:text-orange-400'}
              >
                {reached ? `🎉 Đã đạt 100%!` : `${percent}%`}
              </Typography>
              <Typography as="span" size="xs" variant="muted">
                {reached
                  ? `Vượt mục tiêu ${formatVND(actual - target)}`
                  : `Còn ${daysLeft} ngày · Cần TB ${formatVND(dailyNeeded)}/ngày`}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Card>
  );
};

export default DashboardGoalProgress;
