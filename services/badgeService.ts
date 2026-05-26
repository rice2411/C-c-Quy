/**
 * Badge service — CRUD cho Order badges + Customer auto-badge rules.
 * Lưu trong `configurations/badges` (Firestore).
 */

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type {
  BadgesConfiguration,
  CustomerBadgeRule,
  CustomerBadgeRuleType,
  OrderBadge,
  ProductBadge,
} from '@/types/badge';

const CONFIG_COLLECTION = 'configurations';
const BADGES_DOC = 'badges';

const sanitizeOrderBadges = (raw: unknown): OrderBadge[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is object => it != null && typeof it === 'object')
    .map((it) => {
      const o = it as Record<string, unknown>;
      return {
        id: typeof o.id === 'string' && o.id ? o.id : crypto.randomUUID(),
        name: typeof o.name === 'string' ? o.name : '',
        color: typeof o.color === 'string' && o.color ? o.color : '#64748b',
        icon: typeof o.icon === 'string' ? o.icon : undefined,
        description: typeof o.description === 'string' ? o.description : undefined,
        sortOrder: typeof o.sortOrder === 'number' ? o.sortOrder : 0,
      };
    })
    .filter((b) => b.name.trim().length > 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
};

const sanitizeProductBadges = (raw: unknown): ProductBadge[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is object => it != null && typeof it === 'object')
    .map((it) => {
      const o = it as Record<string, unknown>;
      return {
        id: typeof o.id === 'string' && o.id ? o.id : crypto.randomUUID(),
        name: typeof o.name === 'string' ? o.name : '',
        color: typeof o.color === 'string' && o.color ? o.color : '#22c55e',
        icon: typeof o.icon === 'string' ? o.icon : undefined,
        description: typeof o.description === 'string' ? o.description : undefined,
        sortOrder: typeof o.sortOrder === 'number' ? o.sortOrder : 0,
      };
    })
    .filter((b) => b.name.trim().length > 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
};

const sanitizeCustomerRules = (raw: unknown): CustomerBadgeRule[] => {
  if (!Array.isArray(raw)) return [];
  const VALID_TYPES: CustomerBadgeRuleType[] = ['orderCount', 'totalSpent', 'avgOrderValue'];
  return raw
    .filter((it): it is object => it != null && typeof it === 'object')
    .map((it) => {
      const o = it as Record<string, unknown>;
      const ruleType: CustomerBadgeRuleType = VALID_TYPES.includes(o.ruleType as CustomerBadgeRuleType)
        ? (o.ruleType as CustomerBadgeRuleType)
        : 'orderCount';
      const operator = ['>=', '>', '<', '<='].includes(o.operator as string)
        ? (o.operator as CustomerBadgeRule['operator'])
        : '>=';
      return {
        id: typeof o.id === 'string' && o.id ? o.id : crypto.randomUUID(),
        name: typeof o.name === 'string' ? o.name : '',
        color: typeof o.color === 'string' && o.color ? o.color : '#22c55e',
        icon: typeof o.icon === 'string' ? o.icon : undefined,
        ruleType,
        operator,
        threshold: typeof o.threshold === 'number' && Number.isFinite(o.threshold) ? o.threshold : 0,
        description: typeof o.description === 'string' ? o.description : undefined,
        sortOrder: typeof o.sortOrder === 'number' ? o.sortOrder : 0,
      };
    })
    .filter((r) => r.name.trim().length > 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
};

export const fetchBadgesConfiguration = async (): Promise<BadgesConfiguration> => {
  const ref = doc(db, CONFIG_COLLECTION, BADGES_DOC);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { orderBadges: [], productBadges: [], customerRules: [] };
  const data = snap.data();
  return {
    orderBadges: sanitizeOrderBadges(data.orderBadges),
    productBadges: sanitizeProductBadges(data.productBadges),
    customerRules: sanitizeCustomerRules(data.customerRules),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
    updatedBy: data.updatedBy ?? null,
  };
};

export const saveBadgesConfiguration = async (
  orderBadges: OrderBadge[],
  productBadges: ProductBadge[],
  customerRules: CustomerBadgeRule[],
  updatedBy?: string | null,
): Promise<void> => {
  const ref = doc(db, CONFIG_COLLECTION, BADGES_DOC);
  await setDoc(
    ref,
    {
      orderBadges,
      productBadges,
      customerRules,
      updatedBy: updatedBy ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
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
