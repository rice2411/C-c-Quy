import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Product } from '../types';

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        price: Number(data.price),
        image: data.image,
        category: data.category || 'General',
        description: data.description || '',
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString()
      } as Product;
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    // Fallback if query fails (e.g. missing index), try basic fetch
    try {
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (e) {
        return [];
    }
  }
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<void> => {
  try {
    const productsRef = collection(db, 'products');
    await addDoc(productsRef, {
      ...productData,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<void> => {
  try {
    const productRef = doc(db, 'products', id);
    const { id: _, ...updateData } = productData as any; // Exclude ID from update
    await updateDoc(productRef, updateData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};