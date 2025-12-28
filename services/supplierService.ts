import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Supplier, SupplierType } from '@/types';

const normalizeSupplierType = (val: any): SupplierType => {
  const key = (val || '').toString().toUpperCase();
  return Object.values(SupplierType).includes(key as SupplierType) ? (key as SupplierType) : SupplierType.GROCERY;
};

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  try {
    const suppliersRef = collection(db, 'suppliers');
    const q = query(suppliersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        type: normalizeSupplierType(data.type),
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        note: data.note,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Supplier;
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    try {
      const snapshot = await getDocs(collection(db, 'suppliers'));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Supplier));
    } catch (e) {
      return [];
    }
  }
};

export const addSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<void> => {
  try {
    const suppliersRef = collection(db, 'suppliers');
    await addDoc(suppliersRef, {
      name: supplierData.name.trim(),
      type: supplierData.type || SupplierType.GROCERY,
      contactName: supplierData.contactName?.trim() || '',
      phone: supplierData.phone?.trim() || '',
      email: supplierData.email?.trim() || '',
      address: supplierData.address?.trim() || '',
      note: supplierData.note?.trim() || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding supplier:', error);
    throw error;
  }
};

export const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<void> => {
  try {
    const supplierRef = doc(db, 'suppliers', id);
    const payload = {
      ...supplierData,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(supplierRef, payload as any);
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    const supplierRef = doc(db, 'suppliers', id);
    await deleteDoc(supplierRef);
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};

