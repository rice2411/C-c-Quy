import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  CommissionGroup,
  DEFAULT_COMMISSION_GROUPS,
} from '@/types/commissionGroup';

const COL = 'commissionGroups';

/** Lấy danh sách nhóm hoa hồng. Nếu chưa có, seed defaults vào Firestore. */
export const fetchCommissionGroups = async (): Promise<CommissionGroup[]> => {
  const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')));

  if (!snap.empty) {
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommissionGroup));
  }

  // Seed defaults
  const batch = writeBatch(db);
  const seeded: CommissionGroup[] = [];
  for (const g of DEFAULT_COMMISSION_GROUPS) {
    const ref = doc(collection(db, COL));
    batch.set(ref, g);
    seeded.push({ id: ref.id, ...g });
  }
  await batch.commit();
  return seeded;
};

/** Tạo nhóm mới */
export const createCommissionGroup = async (
  data: Omit<CommissionGroup, 'id'>,
): Promise<CommissionGroup> => {
  const ref = await addDoc(collection(db, COL), data);
  return { id: ref.id, ...data };
};

/** Cập nhật nhóm */
export const updateCommissionGroup = async (
  id: string,
  data: Partial<Omit<CommissionGroup, 'id'>>,
): Promise<void> => {
  await updateDoc(doc(db, COL, id), data as Record<string, unknown>);
};

/** Xoá nhóm */
export const deleteCommissionGroup = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};
