import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Ingredient, IngredientHistoryType, IngredientType } from '@/types';
import { deleteField } from 'firebase/firestore';

const normalizeIngredientType = (val: any): IngredientType => {
  const key = (val || '').toString().toUpperCase();
  return Object.values(IngredientType).includes(key as IngredientType) ? (key as IngredientType) : IngredientType.BASE;
};

const normalizeHistoryType = (val: any): IngredientHistoryType => {
  const key = (val || '').toString().toUpperCase();
  return Object.values(IngredientHistoryType).includes(key as IngredientHistoryType)
    ? (key as IngredientHistoryType)
    : IngredientHistoryType.IMPORT;
};




//create a function to modifert one field of all order
export const modifyOrderField = async (): Promise<void> => {
  try {
    const ingredientsRef = collection(db, "ingredients");
    const q = query(ingredientsRef);
    const snapshot = await getDocs(q);
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      await updateDoc(doc.ref, {
        quantity: deleteField()
      }); 
    }
  
  } catch (error) {
    console.error("Error modifying order field:", error);
    throw error;
  }
};


export const fetchIngredients = async (): Promise<Ingredient[]> => {
  try {
    // await modifyOrderField()
    const ref = collection(db, 'ingredients');
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const historyData = Array.isArray(data.history)
        ? data.history.map((item: any) => ({
            id: item.id || docSnap.id + (item.createdAt?.seconds || ''),
            type: normalizeHistoryType(item.type),
            fromQuantity: Number(item.fromQuantity ?? 0),
            importQuantity: Number(item.importQuantity ?? item.toQuantity ?? item.quantity ?? 0),
            productWeight: Number(item.productWeight ?? 0),
            unit: item.unit === 'piece' ? 'piece' : 'g',
            note: item.note || '',
            price: Number(item.price || 0),
            supplierId: item.supplierId || '',
            supplierName: item.supplierName || '',
            createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : item.createdAt || Timestamp.now().toDate().toISOString(),
          }))
        : [];
      const initialQty = Number(data.initialQuantity ?? data.quantity ?? 0);
      return {
        id: docSnap.id,
        name: data.name || '',
        type: normalizeIngredientType(data.type),
        initialQuantity: initialQty,
        unit: data.unit || 'g',
        history: historyData,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Ingredient;
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    try {
      const snapshot = await getDocs(collection(db, 'ingredients'));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Ingredient));
    } catch (e) {
      return [];
    }
  }
};

export const addIngredient = async (ingredientData: Omit<Ingredient, 'id'>): Promise<void> => {
  try {
    const ref = collection(db, 'ingredients');
    const cleanHistory = (ingredientData.history || []).map((item: any) => {
      const cleanItem: any = {
        id: item.id,
        type: item.type,
        fromQuantity: item.fromQuantity,
        importQuantity: item.importQuantity,
        unit: item.unit,
        createdAt: item.createdAt,
      };
      if (item.type === IngredientHistoryType.IMPORT) {
        if (item.price !== undefined && item.price !== null) cleanItem.price = item.price;
        if (item.note) cleanItem.note = item.note;
        if (item.supplierId) cleanItem.supplierId = item.supplierId;
        if (item.supplierName) cleanItem.supplierName = item.supplierName;
        if (item.productWeight !== undefined && item.productWeight !== null) cleanItem.productWeight = item.productWeight;
      }
      return cleanItem;
    });
    await addDoc(ref, {
      name: ingredientData.name.trim(),
      type: ingredientData.type,
      initialQuantity: ingredientData.initialQuantity || 0,
      unit: ingredientData.unit || 'g',
      history: cleanHistory,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding ingredient:', error);
    throw error;
  }
};

export const updateIngredient = async (id: string, ingredientData: Partial<Ingredient>): Promise<void> => {
  try {
    const ref = doc(db, 'ingredients', id);
    const payload: any = {
      updatedAt: Timestamp.now(),
    };
    
    Object.keys(ingredientData).forEach((key) => {
      const value = (ingredientData as any)[key];
      if (value !== undefined && value !== null) {
        if (key === 'history' && Array.isArray(value)) {
          payload[key] = value.map((item: any) => {
            const cleanItem: any = {
              id: item.id,
              type: item.type,
              fromQuantity: item.fromQuantity,
              importQuantity: item.importQuantity,
              unit: item.unit,
              createdAt: item.createdAt,
            };
            if (item.type === IngredientHistoryType.IMPORT) {
              if (item.price !== undefined) cleanItem.price = item.price;
              if (item.note) cleanItem.note = item.note;
              if (item.supplierId) cleanItem.supplierId = item.supplierId;
              if (item.supplierName) cleanItem.supplierName = item.supplierName;
              if (item.productWeight !== undefined && item.productWeight !== null) cleanItem.productWeight = item.productWeight;
            }
            return cleanItem;
          });
        } else {
          payload[key] = value;
        }
      }
    });
    
    await updateDoc(ref, payload);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    throw error;
  }
};

export const deleteIngredient = async (id: string): Promise<void> => {
  try {
    const ref = doc(db, 'ingredients', id);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    throw error;
  }
};

