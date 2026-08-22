/**
 * Badge service — gọi BE NestJS (envelope `.data` đã được apiClient bóc sẵn).
 * Config lưu ở `configurations/badges` phía BE.
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

