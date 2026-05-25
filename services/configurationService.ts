import { db } from '@/config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ScreenConfiguration, ScreenVisibilityMap, ZaloGroupConfig, ZaloGroupsConfiguration } from '@/types';
import { DEFAULT_SHIPPING_CONFIG } from '@/types/shippingConfig';
import type { ShippingConfiguration, ShippingTier } from '@/types/shippingConfig';
import { UserRole } from '@/types/user';
import { getUserByUid, syncZaloCtvGroupFieldsFromGroups } from '@/services/userService';
import { CollaboratorZaloGroupMissingError } from '@/services/zaloOrderErrors';

const CONFIG_COLLECTION = 'configurations';
const SCREEN_CONFIG_DOC = 'screen-visibility';
const ZALO_CONFIG_DOC = 'zalo-configuration';
const SHIPPING_CONFIG_DOC = 'shipping-configuration';

const sanitizeVisibility = (value: unknown): ScreenVisibilityMap => {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([path, enabled]) => [path, enabled !== false])
  );
};

export const fetchScreenConfiguration = async (): Promise<ScreenConfiguration> => {
  const configRef = doc(db, CONFIG_COLLECTION, SCREEN_CONFIG_DOC);
  const snapshot = await getDoc(configRef);
  if (!snapshot.exists()) return { screenVisibility: {} };
  const data = snapshot.data();
  return {
    screenVisibility: sanitizeVisibility(data.screenVisibility),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
    updatedBy: data.updatedBy,
  };
};

export const saveScreenConfiguration = async (
  screenVisibility: ScreenVisibilityMap,
  updatedBy?: string
): Promise<void> => {
  const configRef = doc(db, CONFIG_COLLECTION, SCREEN_CONFIG_DOC);
  await setDoc(configRef, {
    screenVisibility,
    updatedBy: updatedBy || null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

const sanitizeZaloGroups = (raw: unknown): ZaloGroupConfig[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is object => item != null && typeof item === 'object')
    .map((item) => {
      const o = item as Record<string, unknown>;
      const id = typeof o.id === 'string' && o.id ? o.id : crypto.randomUUID();
      const name = typeof o.name === 'string' ? o.name : '';
      const zaloGroupId = typeof o.zaloGroupId === 'string' ? o.zaloGroupId : '';
      const memberUids = Array.isArray(o.memberUids)
        ? o.memberUids.filter((u): u is string => typeof u === 'string' && u.length > 0)
        : [];
      return { id, name, zaloGroupId, memberUids };
    });
};

export const fetchZaloGroupsConfiguration = async (): Promise<ZaloGroupsConfiguration> => {
  const configRef = doc(db, CONFIG_COLLECTION, ZALO_CONFIG_DOC);
  const snapshot = await getDoc(configRef);
  if (!snapshot.exists()) return { groups: [] };
  const data = snapshot.data();
  return {
    groups: sanitizeZaloGroups(data.groups),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
    updatedBy: data.updatedBy ?? null,
  };
};

const dedupeIds = (ids: string[]): string[] => [...new Set(ids.map((x) => x.trim()).filter(Boolean))];

export const resolveZaloGroupIdsForNewOrder = async (
  createdByUid: string | undefined
): Promise<string[]> => {
  const mainId = String(process.env.ZALO_MAIN_GROUP_ID ?? '').trim();
  if (!mainId) throw new Error('ZALO_MAIN_GROUP_ID is not configured');
  if (!createdByUid) return dedupeIds([mainId]);
  const user = await getUserByUid(createdByUid);
  if (!user) return dedupeIds([mainId]);
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) return dedupeIds([mainId]);
  if (user.role === UserRole.COLABORATOR) {
    const fromUser = user.zaloCtvGroupChatId?.trim();
    if (fromUser) return dedupeIds([mainId, fromUser]);
    const { groups } = await fetchZaloGroupsConfiguration();
    const withId = groups.filter((g) => g.zaloGroupId.trim() && g.memberUids.includes(createdByUid));
    if (withId.length === 0) throw new CollaboratorZaloGroupMissingError();
    const ctvGroupId = withId[0].zaloGroupId.trim();
    return dedupeIds([mainId, ctvGroupId]);
  }
  return dedupeIds([mainId]);
};

export const collaboratorHasZaloGroup = async (uid: string): Promise<boolean> => {
  const user = await getUserByUid(uid);
  if (!user || user.role !== UserRole.COLABORATOR) return true;
  if (user.zaloCtvGroupChatId?.trim()) return true;
  const { groups } = await fetchZaloGroupsConfiguration();
  return groups.some((g) => g.zaloGroupId.trim() && g.memberUids.includes(uid));
};

export const saveZaloGroupsConfiguration = async (
  groups: ZaloGroupConfig[],
  updatedBy?: string | null
): Promise<void> => {
  const configRef = doc(db, CONFIG_COLLECTION, ZALO_CONFIG_DOC);
  await setDoc(configRef, {
    groups,
    updatedBy: updatedBy ?? null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await syncZaloCtvGroupFieldsFromGroups(groups);
};

// ==================== SHIPPING CONFIGURATION ====================

const sanitizeShippingTiers = (raw: unknown): ShippingTier[] => {
  if (!Array.isArray(raw)) return DEFAULT_SHIPPING_CONFIG.tiers;
  const cleaned = raw
    .filter((t): t is object => t != null && typeof t === 'object')
    .map((t) => {
      const o = t as Record<string, unknown>;
      const maxKm = typeof o.maxKm === 'number' && o.maxKm > 0 ? o.maxKm : 0;
      const fee = typeof o.fee === 'number' && o.fee >= 0 ? o.fee : 0;
      const label = typeof o.label === 'string' && o.label ? o.label : `< ${maxKm} km`;
      return { maxKm, fee, label };
    })
    .filter((t) => t.maxKm > 0);
  return cleaned.length > 0 ? cleaned.sort((a, b) => a.maxKm - b.maxKm) : DEFAULT_SHIPPING_CONFIG.tiers;
};

const sanitizeShippingConfig = (data: any): ShippingConfiguration => {
  const origin = (data?.shopOrigin && typeof data.shopOrigin === 'object') ? data.shopOrigin : {};
  return {
    shopOrigin: {
      name: typeof origin.name === 'string' && origin.name ? origin.name : DEFAULT_SHIPPING_CONFIG.shopOrigin.name,
      lat: typeof origin.lat === 'number' ? origin.lat : DEFAULT_SHIPPING_CONFIG.shopOrigin.lat,
      lng: typeof origin.lng === 'number' ? origin.lng : DEFAULT_SHIPPING_CONFIG.shopOrigin.lng,
      city: typeof origin.city === 'string' && origin.city ? origin.city : DEFAULT_SHIPPING_CONFIG.shopOrigin.city,
    },
    tiers: sanitizeShippingTiers(data?.tiers),
    overFee: typeof data?.overFee === 'number' && data.overFee >= 0 ? data.overFee : DEFAULT_SHIPPING_CONFIG.overFee,
    overLabel: typeof data?.overLabel === 'string' && data.overLabel ? data.overLabel : DEFAULT_SHIPPING_CONFIG.overLabel,
    updatedAt: data?.updatedAt?.toDate?.()?.toISOString?.(),
    updatedBy: data?.updatedBy ?? null,
  };
};

export const fetchShippingConfiguration = async (): Promise<ShippingConfiguration> => {
  const configRef = doc(db, CONFIG_COLLECTION, SHIPPING_CONFIG_DOC);
  const snapshot = await getDoc(configRef);
  if (!snapshot.exists()) return DEFAULT_SHIPPING_CONFIG;
  return sanitizeShippingConfig(snapshot.data());
};

export const saveShippingConfiguration = async (
  config: ShippingConfiguration,
  updatedBy?: string | null
): Promise<void> => {
  const configRef = doc(db, CONFIG_COLLECTION, SHIPPING_CONFIG_DOC);
  await setDoc(configRef, {
    shopOrigin: config.shopOrigin,
    tiers: config.tiers,
    overFee: config.overFee,
    overLabel: config.overLabel,
    updatedBy: updatedBy ?? null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
