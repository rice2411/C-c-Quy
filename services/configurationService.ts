import { db } from '@/config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ScreenConfiguration, ScreenVisibilityMap, ZaloGroupConfig, ZaloGroupsConfiguration } from '@/types';
import { UserRole } from '@/types/user';
import { getUserByUid, syncZaloCtvGroupFieldsFromGroups } from '@/services/userService';
import { CollaboratorZaloGroupMissingError } from '@/services/zaloOrderErrors';

const CONFIG_COLLECTION = 'configurations';
const SCREEN_CONFIG_DOC = 'screen-visibility';
const ZALO_CONFIG_DOC = 'zalo-configuration';

const sanitizeVisibility = (value: unknown): ScreenVisibilityMap => {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([path, enabled]) => [path, enabled !== false])
  );
};

export const fetchScreenConfiguration = async (): Promise<ScreenConfiguration> => {
  const configRef = doc(db, CONFIG_COLLECTION, SCREEN_CONFIG_DOC);
  const snapshot = await getDoc(configRef);

  if (!snapshot.exists()) {
    return { screenVisibility: {} };
  }

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
  await setDoc(
    configRef,
    {
      screenVisibility,
      updatedBy: updatedBy || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
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
  if (!snapshot.exists()) {
    return { groups: [] };
  }
  const data = snapshot.data();
  return {
    groups: sanitizeZaloGroups(data.groups),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
    updatedBy: data.updatedBy ?? null,
  };
};

const dedupeIds = (ids: string[]): string[] => [...new Set(ids.map((x) => x.trim()).filter(Boolean))];

/**
 * Resolves Zalo group ids for a newly created order (admin → main env only;
 * collaborator → main + their configured CTV group).
 */
export const resolveZaloGroupIdsForNewOrder = async (
  createdByUid: string | undefined
): Promise<string[]> => {
  const mainId = String(process.env.ZALO_MAIN_GROUP_ID ?? '').trim();
  if (!mainId) {
    throw new Error('ZALO_MAIN_GROUP_ID is not configured');
  }

  if (!createdByUid) {
    return dedupeIds([mainId]);
  }

  const user = await getUserByUid(createdByUid);
  if (!user) {
    return dedupeIds([mainId]);
  }

  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return dedupeIds([mainId]);
  }

  if (user.role === UserRole.COLABORATOR) {
    const fromUser = user.zaloCtvGroupChatId?.trim();
    if (fromUser) {
      return dedupeIds([mainId, fromUser]);
    }
    const { groups } = await fetchZaloGroupsConfiguration();
    const withId = groups.filter((g) => g.zaloGroupId.trim() && g.memberUids.includes(createdByUid));
    if (withId.length === 0) {
      throw new CollaboratorZaloGroupMissingError();
    }
    const ctvGroupId = withId[0].zaloGroupId.trim();
    return dedupeIds([mainId, ctvGroupId]);
  }

  return dedupeIds([mainId]);
};

/** True if user does not need a CTV Zalo group, or already belongs to a configured group. */
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
  await setDoc(
    configRef,
    {
      groups,
      updatedBy: updatedBy ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await syncZaloCtvGroupFieldsFromGroups(groups);
};

