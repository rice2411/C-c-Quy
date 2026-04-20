import { db } from '@/config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ScreenConfiguration, ScreenVisibilityMap } from '@/types';

const CONFIG_COLLECTION = 'configurations';
const SCREEN_CONFIG_DOC = 'screen-visibility';

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

