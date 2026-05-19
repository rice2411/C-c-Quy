import { parseDateValue } from './dateUtil';

export type DeliveryTone = 'urgent' | 'warning' | 'ok' | 'done' | 'none';

export interface DeliveryBadge {
  label: string;
  sublabel: string;
  tone: DeliveryTone;
  /** Classname (bg + border) cho toan bo Card outer */
  cardClass: string;
  /** Classname (bg + border + text) cho strip header trong card */
  stripClass: string;
  diffDays: number | null;
  priority: number;
}

const VN_WEEKDAY = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];

const formatVNShort = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return VN_WEEKDAY[d.getDay()] + ', ' + dd + '/' + mm;
};

/**
 * 5 tones:
 *  - urgent (DO):  qua han / hom nay  -> Card va strip cung do soft
 *  - warning (VANG): pending >= 1 ngay -> Card vang soft, strip vang dam hon
 *  - ok (XANH):    don da DELIVERED   -> Card xanh soft, strip xanh dam
 *  - done (XAM):   CANCELLED/RETURNED -> Card xam neutral
 *  - none (XAM):   khong co ngay giao -> Card xam neutral
 */
const CARD_CLASS: Record<DeliveryTone, string> = {
  urgent:
    'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800',
  warning:
    'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800',
  ok:
    'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800',
  done:
    'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
  none:
    'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700',
};

const STRIP_CLASS: Record<DeliveryTone, string> = {
  urgent:
    'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200',
  warning:
    'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200',
  ok:
    'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200',
  done:
    'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300',
  none:
    'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300',
};

/**
 * Quy tac mau:
 *  - DELIVERED -> XANH (toan card)
 *  - PENDING/PROCESSING + diffDays <= 0 (qua han hoac hom nay) -> DO
 *  - PENDING/PROCESSING + diffDays >= 1 -> VANG
 *  - CANCELLED / RETURNED -> XAM "Da huy" / "Da tra hang"
 *  - Khong co ngay giao -> XAM "Chua co ngay giao"
 *
 * Priority de sort: 0=do, 1=vang, 2=xanh DELIVERED, 3=khong co ngay, 4=cancelled/returned.
 * (DELIVERED uu tien sort cao hon CANCELLED/RETURNED — mac dinh hien DELIVERED gan top hon)
 */
export const buildDeliveryBadge = (
  deliveryDate: any,
  options?: { status?: string },
): DeliveryBadge => {
  const status = options?.status;
  const isDelivered = status === 'DELIVERED';
  const isCancelled = status === 'CANCELLED';
  const isReturned = status === 'RETURNED';

  const date = parseDateValue(deliveryDate);

  // Da giao thanh cong -> XANH, KHONG bao gio "qua han"
  if (isDelivered) {
    return {
      label: 'Đã giao thành công',
      sublabel: date ? formatVNShort(date) : '—',
      tone: 'ok',
      cardClass: CARD_CLASS.ok,
      stripClass: STRIP_CLASS.ok,
      diffDays: null,
      priority: 4,
    };
  }

  // Da huy / da tra hang -> XAM
  if (isCancelled || isReturned) {
    return {
      label: isCancelled ? 'Đã huỷ' : 'Đã trả hàng',
      sublabel: date ? formatVNShort(date) : '—',
      tone: 'done',
      cardClass: CARD_CLASS.done,
      stripClass: STRIP_CLASS.done,
      diffDays: null,
      priority: 5,
    };
  }

  if (!date) {
    return {
      label: 'Chưa có ngày giao',
      sublabel: '—',
      tone: 'none',
      cardClass: CARD_CLASS.none,
      stripClass: STRIP_CLASS.none,
      diffDays: null,
      priority: 3,
    };
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (target.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  const sublabel = formatVNShort(date);

  // DO: qua han hoac hom nay (duoi 1 ngay)
  if (diffDays < 0) {
    return {
      label: 'Quá hạn ' + Math.abs(diffDays) + ' ngày',
      sublabel,
      tone: 'urgent',
      cardClass: CARD_CLASS.urgent,
      stripClass: STRIP_CLASS.urgent,
      diffDays,
      priority: 0,
    };
  }
  if (diffDays === 0) {
    return {
      label: 'Hôm nay',
      sublabel,
      tone: 'urgent',
      cardClass: CARD_CLASS.urgent,
      stripClass: STRIP_CLASS.urgent,
      diffDays,
      priority: 0,
    };
  }

  // VANG: tu 1 ngay tro len
  return {
    label: diffDays === 1 ? 'Ngày mai' : 'Còn ' + diffDays + ' ngày',
    sublabel,
    tone: 'warning',
    cardClass: CARD_CLASS.warning,
    stripClass: STRIP_CLASS.warning,
    diffDays,
    priority: 1,
  };
};
