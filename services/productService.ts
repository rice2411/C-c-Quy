import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Product } from '@/types';

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Backward compatibility: convert old format to new format
      let recipes = data.recipes || [];
      let materials = data.materials || [];
      
      if (data.recipeId && recipes.length === 0) {
        recipes = [{ recipeId: data.recipeId, quantity: 1 }];
      }
      
      if (data.materialIds && materials.length === 0) {
        materials = (data.materialIds as string[]).map(id => ({ materialId: id, quantity: 1 }));
      }
      
      return {
        id: doc.id,
        name: data.name,
        price: Number(data.price),
        image: data.image,
        category: data.category || 'General',
        description: data.description || '',
        status: data.status || 'active',
        cakesPerProduct: data.cakesPerProduct != null ? Number(data.cakesPerProduct) : undefined,
        recipes,
        materials,
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

const omitUndefined = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<void> => {
  try {
    const productsRef = collection(db, 'products');
    await addDoc(productsRef, {
      ...omitUndefined(productData as Record<string, unknown>),
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
    const { id: _, ...rest } = productData as Record<string, unknown>;
    await updateDoc(productRef, omitUndefined(rest));
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