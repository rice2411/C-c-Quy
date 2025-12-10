import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Customer } from '../types';

export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const customersRef = collection(db, 'customers');
    // Order by name if possible, otherwise standard fetch
    const q = query(customersRef, orderBy('createdAt', 'desc')); 
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        country: data.country || ''
      } as Customer;
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    // Fallback in case of index error
    try {
        const snapshot = await getDocs(collection(db, 'customers'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    } catch (e) {
        return [];
    }
  }
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<void> => {
  try {
    const customersRef = collection(db, 'customers');
    await addDoc(customersRef, {
      ...customerData,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error adding customer:", error);
    throw error;
  }
};

export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<void> => {
  try {
    const customerRef = doc(db, 'customers', id);
    const { id: _, ...updateData } = customerData as any; 
    await updateDoc(customerRef, updateData);
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    const customerRef = doc(db, 'customers', id);
    await deleteDoc(customerRef);
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
};