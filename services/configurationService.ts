import { db } from '@/config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  ScreenConfiguration,
  ScreenVisibilityMap,
  ZaloGroupConfig,
  ZaloGroupsConfiguration,
  ZaloOrderEventType,
} from '@/types';
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

const sanitizeStringArray = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === 'string' && s.length > 0);
};

const asBool = (v: unknown, fallback: boolean): boolean =>
  typeof v === 'boolean' ? v : fallback;

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
      return {
        id,
        name,
        zaloGroupId,
        memberUids,
        notifyOnCreate: asBool(o.notifyOnCreate, true),
        notifyOnUpdate: asBool(o.notifyOnUpdate, true),
        notifyOnDelete: asBool(o.notifyOnDelete, true),
        updateFieldWhitelist: sanitizeStringArray(o.updateFieldWhitelist),
      };
    });
};

export const fetchZaloGroupsConfiguration = async (): Promise<ZaloGroupsConfiguration> => {
  const configRef = doc(db, CONFIG_COLLECTION, ZALO_CONFIG_DOC);
  const snapshot = await getDoc(configRef);
  if (!snapshot.exists()) return { groups: [] };
  const data = snapshot.data();
  return {
    groups: sanitizeZaloGroups(data.groups),
    mainGroupId: typeof data.mainGroupId === 'string' ? data.mainGroupId.trim() : '',
    mainNotifyOnCreate: asBool(data.mainNotifyOnCreate, true),
    mainNotifyOnUpdate: asBool(data.mainNotifyOnUpdate, true),
    mainNotifyOnDelete: asBool(data.mainNotifyOnDelete, true),
    mainUpdateFieldWhitelist: sanitizeStringArray(data.mainUpdateFieldWhitelist),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
    updatedBy: data.updatedBy ?? null,
  };
};

const getMainGroupId = async (cfg?: ZaloGroupsConfiguration): Promise<string> => {
  const fromCfg = (cfg?.mainGroupId ?? '').trim();
  if (fromCfg) return fromCfg;
  return String(process.env.ZALO_MAIN_GROUP_ID ?? '').trim();
};

const groupAcceptsEvent = (
  group: {
    notifyOnCreate?: boolean;
    notifyOnUpdate?: boolean;
    notifyOnDelete?: boolean;
    updateFieldWhitelist?: string[];
  },
  eventType: ZaloOrderEventType,
  changedFieldIds?: string[],
): boolean => {
  if (eventType === 'create') return group.notifyOnCreate !== false;
  if (eventType === 'delete') return group.notifyOnDelete !== false;
  if (group.notifyOnUpdate === false) return false;
  const wl = group.updateFieldWhitelist ?? [];
  if (wl.length === 0) return true;
  if (!changedFieldIds || changedFieldIds.length === 0) return false;
  return changedFieldIds.some((f) => wl.includes(f));
};

const dedupeIds = (ids: string[]): string[] => [...new Set(ids.map((x) => x.trim()).filter(Boolean))];

/**
 * Resolver chinh — filter group nao nhan event nay theo toggle + (cho update) field whitelist.
 */
export const resolveZaloGroupIdsForOrderEvent = async (
  eventType: ZaloOrderEventType,
  createdByUid: string | undefined,
  changedFieldIds?: string[],
): Promise<string[]> => {
  const cfg = await fetchZaloGroupsConfiguration();
  const mainId = await getMainGroupId(cfg);
  if (!mainId) throw new Error('Main Zalo group is not configured');

  const targets: string[] = [];

  const mainGroup = {
    notifyOnCreate: cfg.mainNotifyOnCreate,
    notifyOnUpdate: cfg.mainNotifyOnUpdate,
    notifyOnDelete: cfg.mainNotifyOnDelete,
    updateFieldWhitelist: cfg.mainUpdateFieldWhitelist,
  };
  if (groupAcceptsEvent(mainGroup, eventType, changedFieldIds)) {
    targets.push(mainId);
  }

  if (createdByUid) {
    const user = await getUserByUid(createdByUid);
    if (user?.role === UserRole.COLABORATOR) {
      let ctvGroupId = user.zaloCtvGroupChatId?.trim() ?? '';
      let ctvGroupConfig: ZaloGroupConfig | undefined;
      if (ctvGroupId) {
        ctvGroupConfig = cfg.groups.find((g) => g.zaloGroupId.trim() === ctvGroupId);
      } else {
        const found = cfg.groups.find((g) => g.zaloGroupId.trim() && g.memberUids.includes(createdByUid));
        if (!found) {
          if (eventType === 'create') throw new CollaboratorZaloGroupMissingError();
        } else {
          ctvGroupId = found.zaloGroupId.trim();
          ctvGroupConfig = found;
        }
      }
      if (ctvGroupId && ctvGroupConfig && groupAcceptsEvent(ctvGroupConfig, eventType, changedFieldIds)) {
        targets.push(ctvGroupId);
      }
    }
  }

  return dedupeIds(targets);
};

/** @deprecated Dung resolveZaloGroupIdsForOrderEvent. */
export const resolveZaloGroupIdsForNewOrder = async (
  createdByUid: string | undefined,
): Promise<string[]> => resolveZaloGroupIdsForOrderEvent('create', createdByUid);

export const collaboratorHasZaloGroup = async (uid: string): Promise<boolean> => {
  const user = await getUserByUid(uid);
  if (!user || user.role !== UserRole.COLABORATOR) return true;
  if (user.zaloCtvGroupChatId?.trim()) return true;
  const { groups } = await fetchZaloGroupsConfiguration();
  return groups.some((g) => g.zaloGroupId.trim() && g.memberUids.includes(uid));
};

export const saveZaloGroupsConfiguration = async (
  groups: ZaloGroupConfig[],
  updatedBy?: string | null,
  mainSettings?: Partial<Pick<
    ZaloGroupsConfiguration,
    'mainGroupId' | 'mainNotifyOnCreate' | 'mainNotifyOnUpdate' | 'mainNotifyOnDelete' | 'mainUpdateFieldWhitelist'
  >>,
): Promise<void> => {
  const configRef = doc(db, CONFIG_COLLECTION, ZALO_CONFIG_DOC);
  const payload: any = {
    groups,
    updatedBy: updatedBy ?? null,
    updatedAt: serverTimestamp(),
  };
  if (mainSettings) {
    if (mainSettings.mainGroupId !== undefined) payload.mainGroupId = mainSettings.mainGroupId.trim();
    if (mainSettings.mainNotifyOnCreate !== undefined) payload.mainNotifyOnCreate = mainSettings.mainNotifyOnCreate;
    if (mainSettings.mainNotifyOnUpdate !== undefined) payload.mainNotifyOnUpdate = mainSettings.mainNotifyOnUpdate;
    if (mainSettings.mainNotifyOnDelete !== undefined) payload.mainNotifyOnDelete = mainSettings.mainNotifyOnDelete;
    if (mainSettings.mainUpdateFieldWhitelist !== undefined)
      payload.mainUpdateFieldWhitelist = mainSettings.mainUpdateFieldWhitelist;
  }
  await setDoc(configRef, payload, { merge: true });
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
  updatedBy?: string | null,
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
