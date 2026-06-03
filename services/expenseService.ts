import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Expense, ExpenseCategory } from '@/types/expense';

const COL = 'expenses';

export const fetchExpenses = async (): Promise<Expense[]> => {
  const snap = await getDocs(query(collection(db, COL), orderBy('date', 'desc')));
  return snap.docs.map(d => {
    const r = d.data();
    return {
      id: d.id,
      description: typeof r.description === 'string' ? r.description : '',
      amount: typeof r.amount === 'number' ? r.amount : 0,
      date: typeof r.date === 'string' ? r.date : '',
      category: (typeof r.category === 'string' ? r.category : 'other') as ExpenseCategory,
      note: typeof r.note === 'string' ? r.note : undefined,
      createdAt: r.createdAt instanceof Timestamp ? r.createdAt.toDate().toISOString() : undefined,
      createdBy: typeof r.createdBy === 'string' ? r.createdBy : undefined,
    } as Expense;
  });
};

export const addExpense = async (
  data: Omit<Expense, 'id' | 'createdAt'>,
): Promise<Expense> => {
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: Timestamp.now() });
  return { id: ref.id, ...data };
};

export const updateExpense = async (
  id: string,
  data: Partial<Omit<Expense, 'id'>>,
): Promise<void> => {
  await updateDoc(doc(db, COL, id), data as Record<string, unknown>);
};

export const deleteExpense = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};
