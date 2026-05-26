/**
 * Badge system — 3 loại:
 *   1. OrderBadge: tag tự định nghĩa cho đơn (VIP / Quà tặng / Khẩn cấp...).
 *   2. ProductBadge: tag cho sản phẩm (Bán chạy / Mới / Sale / Signature / Hot...).
 *   3. CustomerBadgeRule: badge tự tính cho khách theo tiêu chí (đơn count, tổng chi).
 */

export interface OrderBadge {
  id: string;
  name: string;
  /** Hex color for chip bg/text */
  color: string;
  /** Emoji or short symbol (eg. "⭐", "🎁") */
  icon?: string;
  description?: string;
  /** Display order */
  sortOrder?: number;
}

export interface ProductBadge {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
}

export type CustomerBadgeRuleType =
  | 'orderCount'    // số đơn đã đặt
  | 'totalSpent'    // tổng tiền đã chi
  | 'avgOrderValue'; // giá trị TB / đơn

export type CustomerBadgeOperator = '>=' | '>' | '<' | '<=';

export interface CustomerBadgeRule {
  id: string;
  name: string;
  color: string;
  icon?: string;
  ruleType: CustomerBadgeRuleType;
  operator: CustomerBadgeOperator;
  threshold: number;
  description?: string;
  sortOrder?: number;
}

export interface BadgesConfiguration {
  orderBadges: OrderBadge[];
  productBadges: ProductBadge[];
  customerRules: CustomerBadgeRule[];
  updatedAt?: string;
  updatedBy?: string | nul
l;
}

export const DEFAULT_BADGE_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#64748b', // slate
] as const;
