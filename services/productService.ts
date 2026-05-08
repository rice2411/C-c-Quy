import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
  runTransaction,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Product, ProductVersion } from '@/types';

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      let materials = data.materials || [];

      if (data.materialIds && materials.length === 0) {
        materials = (data.materialIds as string[]).map(id => ({ materialId: id, quantity: 1 }));
      }
      
      return {
        id: doc.id,
        name: data.name,
        price: Number(data.price),
        image: data.image,
        category: data.category || 'General',
        tags: Array.isArray(data.tags) ? data.tags.filter((tag: unknown) => typeof tag === 'string') : [],
        description: data.description || '',
        status: data.status || 'active',
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
    const { id: _, ...rest } = productData as Record<string, unknown>;
    const updates = omitUndefined(rest);
    if (Object.keys(updates).length === 0) return;

    const productRef = doc(db, 'products', id);
    const versionsRef = collection(db, 'product_versions');

    await runTransaction(db, async (tx) => {
      const currentSnap = await tx.get(productRef);
      if (!currentSnap.exists()) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      const before = currentSnap.data();
      const after = {
        ...before,
        ...updates,
      };

      tx.update(productRef, updates);
      tx.set(doc(versionsRef), {
        productId: id,
        editedAt: Timestamp.now(),
        action: 'update',
        before,
        changes: updates,
        after,
      });
    });
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

export const fetchProductVersions = async (productId: string): Promise<ProductVersion[]> => {
  const mapVersion = (docSnap: any): ProductVersion => {
    const data = docSnap.data();
    const editedAtDate =
      data.editedAt?.toDate && typeof data.editedAt.toDate === 'function'
        ? data.editedAt.toDate()
        : null;
    return {
      id: docSnap.id,
      productId: String(data.productId || ''),
      action: String(data.action || 'update'),
      editedAt: editedAtDate ? editedAtDate.toISOString() : undefined,
      before: (data.before || {}) as Record<string, unknown>,
      changes: (data.changes || {}) as Record<string, unknown>,
      after: (data.after || {}) as Record<string, unknown>,
    };
  };

  try {
    const versionsRef = collection(db, 'product_versions');
    const q = query(versionsRef, where('productId', '==', productId), orderBy('editedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapVersion);
  } catch (error) {
    console.error('Error fetching product versions:', error);
    // Fallback when composite index (productId + editedAt) is missing
    try {
      const versionsRef = collection(db, 'product_versions');
      const fallbackQ = query(versionsRef, where('productId', '==', productId));
      const fallbackSnapshot = await getDocs(fallbackQ);
      return fallbackSnapshot.docs
        .map(mapVersion)
        .sort((a, b) => {
          const at = a.editedAt ? new Date(a.editedAt).getTime() : 0;
          const bt = b.editedAt ? new Date(b.editedAt).getTime() : 0;
          return bt - at;
        });
    } catch (fallbackError) {
      console.error('Fallback fetch product versions failed:', fallbackError);
      return [];
    }
  }
};