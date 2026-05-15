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
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Product, ProductVersion } from '@/types';

const ORDERS_COLLECTION = 'orders';
const BATCH_LIMIT_SAFE = 450;

/**
 * Cascade: khi 1 sản phẩm đổi ảnh, đồng bộ ảnh đó vào mọi đơn hàng
 * có chứa sản phẩm này (matching `items[].id === productId`).
 */
async function cascadeProductChangeToOrders(
  productId: string,
  patch: { image?: string; name?: string },
): Promise<number> {
  if (patch.image === undefined && patch.name === undefined) return 0;

  try {
    const ordersSnap = await getDocs(collection(db, ORDERS_COLLECTION));
    type ItemLike = { id?: unknown; name?: unknown; image?: unknown };

    interface OrderToUpdate {
      ref: ReturnType<typeof doc>;
      items: ItemLike[];
    }
    const toUpdate: OrderToUpdate[] = [];

    for (const orderDoc of ordersSnap.docs) {
      const data = orderDoc.data() as { items?: ItemLike[] };
      const items: ItemLike[] = Array.isArray(data.items) ? data.items : [];
      if (items.length === 0) continue;

      let dirty = false;
      const nextItems = items.map((it) => {
        if (it && it.id === productId) {
          const updated: ItemLike = { ...it };
          if (patch.image !== undefined && it.image !== patch.image) {
            updated.image = patch.image;
            dirty = true;
          }
          if (patch.name !== undefined && it.name !== patch.name) {
            updated.name = patch.name;
            dirty = true;
          }
          return updated;
        }
        return it;
      });
      if (dirty) {
        toUpdate.push({ ref: orderDoc.ref, items: nextItems });
      }
    }

    for (let i = 0; i < toUpdate.length; i += BATCH_LIMIT_SAFE) {
      const batch = writeBatch(db);
      for (const { ref, items } of toUpdate.slice(i, i + BATCH_LIMIT_SAFE)) {
        batch.update(ref, { items, updatedAt: serverTimestamp() });
      }
      await batch.commit();
    }

    return toUpdate.length;
  } catch (error) {
    console.error('cascadeProductChangeToOrders failed:', error);
    return 0;
  }
}

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

    let beforeImage: string | undefined;
    let beforeName: string | undefined;

    await runTransaction(db, async (tx) => {
      const currentSnap = await tx.get(productRef);
      if (!currentSnap.exists()) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      const before = currentSnap.data();
      beforeImage = typeof before.image === 'string' ? before.image : undefined;
      beforeName = typeof before.name === 'string' ? before.name : undefined;
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

    const newImage =
      typeof updates.image === 'string' ? (updates.image as string) : undefined;
    const newName =
      typeof updates.name === 'string' ? (updates.name as string) : undefined;
    const cascadePatch: { image?: string; name?: string } = {};
    if (newImage !== undefined && newImage !== beforeImage) cascadePatch.image = newImage;
    if (newName !== undefined && newName !== beforeName) cascadePatch.name = newName;
    if (cascadePatch.image !== undefined || cascadePatch.name !== undefined) {
      void cascadeProductChangeToOrders(id, cascadePatch);
    }
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

/**
 * Đồng bộ thủ công: với mọi đơn hàng, ghi đè item.image (và optionally item.name)
 * bằng giá trị hiện tại của product nếu khác.
 *
 * Trả về thống kê: số order quét, số order được update, số item được sửa.
 */
export async function syncAllProductImagesToOrders(options?: {
  includeName?: boolean;
}): Promise<{ ordersScanned: number; ordersUpdated: number; itemsFixed: number }> {
  const includeName = options?.includeName ?? true;

  const productsSnap = await getDocs(collection(db, 'products'));
  const productMap = new Map<string, { image?: string; name?: string }>();
  productsSnap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    productMap.set(d.id, {
      image: typeof data.image === 'string' ? data.image : undefined,
      name: typeof data.name === 'string' ? data.name : undefined,
    });
  });

  const ordersSnap = await getDocs(collection(db, ORDERS_COLLECTION));
  type ItemLike = { id?: unknown; name?: unknown; image?: unknown };
  interface OrderToUpdate {
    ref: ReturnType<typeof doc>;
    items: ItemLike[];
  }
  const toUpdate: OrderToUpdate[] = [];
  let itemsFixed = 0;

  for (const orderDoc of ordersSnap.docs) {
    const data = orderDoc.data() as { items?: ItemLike[] };
    const items: ItemLike[] = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) continue;

    let dirty = false;
    const nextItems = items.map((it) => {
      if (!it || typeof it.id !== 'string') return it;
      const p = productMap.get(it.id);
      if (!p) return it;
      const updated: ItemLike = { ...it };
      let changed = false;
      if (p.image !== undefined && it.image !== p.image) {
        updated.image = p.image;
        changed = true;
      }
      if (includeName && p.name !== undefined && it.name !== p.name) {
        updated.name = p.name;
        changed = true;
      }
      if (changed) {
        dirty = true;
        itemsFixed += 1;
      }
      return updated;
    });

    if (dirty) {
      toUpdate.push({ ref: orderDoc.ref, items: nextItems });
    }
  }

  for (let i = 0; i < toUpdate.length; i += BATCH_LIMIT_SAFE) {
    const batch = writeBatch(db);
    for (const { ref, items } of toUpdate.slice(i, i + BATCH_LIMIT_SAFE)) {
      batch.update(ref, { items, updatedAt: serverTimestamp() });
    }
    await batch.commit();
  }

  return {
    ordersScanned: ordersSnap.size,
    ordersUpdated: toUpdate.length,
    itemsFixed,
  };
}

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
