/**
 * Badge service — gọi BE NestJS (envelope `.data` đã được apiClient bóc sẵn).
 * Config lưu ở `configurations/badges` (Firestore) phía BE.
 * `matchCustomerBadges` là logic thuần (không chạm dữ liệu) → giữ ở client.
 */

import { apiClient } from '@/services/api/client';
import type {
  BadgesConfiguration,
  CustomerBadgeRule,
  OrderBadge,
  ProductBadge,
} from '@/types/badge';

export const fetchBadgesConfiguration = async (): Promise<BadgesConfiguration> => {
  const res = await apiClient.get<BadgesConfiguration>('/badges');
  return res.data;
};

export const saveBadgesConfiguration = async (
  orderBadges: OrderBadge[],
  productBadges: ProductBadge[],
  customerRules: CustomerBadgeRule[],
  updatedBy?: string | null,
): Promise<void> => {
  await apiClient.put('/badges', {
    orderBadges,
    productBadges,
    customerRules,
    updatedBy: updatedBy ?? null,
  });
};

/**
 * Pure helper — tính các badge customer match dựa trên stats.
 * Stats: { orderCount, totalSpent }
 */
export const matchCustomerBadges = (
  stats: { orderCount: number; totalSpent: number },
  rules: CustomerBadgeRule[],
): CustomerBadgeRule[] => {
  return rules.filter((r) => {
    let value: number;
    if (r.ruleType === 'orderCount') value = stats.orderCount;
    else if (r.ruleType === 'totalSpent') value = stats.totalSpent;
    else value = stats.orderCount > 0 ? stats.totalSpent / stats.orderCount : 0;

    if (r.operator === '>=') return value >= r.threshold;
    if (r.operator === '>') return value > r.threshold;
    if (r.operator === '<') return value < r.threshold;
    if (r.operator === '<=') return value <= r.threshold;
    return false;
  });
};
