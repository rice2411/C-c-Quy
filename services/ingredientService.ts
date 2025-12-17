import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp, 
  query, 
  orderBy, 
  where
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Ingredient, ImportRecord, InventoryRecord, IngredientWithStats } from '@/types/ingredient';

/**
 * Fetch all ingredients with calculated stats from history
 */
export const fetchIngredients = async (): Promise<IngredientWithStats[]> => {
  try {
    // Fetch ingredients
    const ingredientsRef = collection(db, 'ingredients');
    const q = query(ingredientsRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    
    const ingredients = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Parse history from Firestore
      const history = data.history || {};
      const importRecords: ImportRecord[] = (history.import || []).map((imp: any) => ({
        id: imp.id || '',
        amount: Number(imp.amount || 0),
        quantity: Number(imp.quantity || 0),
        unit: imp.unit || '',
        price: Number(imp.price || 0),
        importDate: imp.importDate?.toDate?.().toISOString() || imp.importDate || new Date().toISOString(),
        note: imp.note || '',
        createdAt: imp.createdAt?.toDate?.().toISOString() || imp.createdAt || new Date().toISOString()
      }));

      const inventoryRecords: InventoryRecord[] = (history.inventory || []).map((inv: any) => ({
        id: inv.id || '',
        amount: Number(inv.amount || 0),
        quantity: Number(inv.quantity || 0),
        inventoryDate: inv.inventoryDate?.toDate?.().toISOString() || inv.inventoryDate || new Date().toISOString(),
        note: inv.note || '',
        createdAt: inv.createdAt?.toDate?.().toISOString() || inv.createdAt || new Date().toISOString()
      }));

      return {
        id: doc.id,
        name: data.name,
        supplier: data.supplier || '',
        amount: Number(data.amount || 0),
        quantity: Number(data.quantity || 0),
        unit: data.unit || 'kg',
        note: data.note || '',
        history: {
          import: importRecords,
          inventory: inventoryRecords
        },
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
      } as Ingredient;
    });

    // Calculate stats for each ingredient
    return ingredients.map(ingredient => {
      const ingredientImports = (ingredient.history?.import || [])
        .sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime());
      
      const ingredientInventories = (ingredient.history?.inventory || [])
        .sort((a, b) => new Date(b.inventoryDate).getTime() - new Date(a.inventoryDate).getTime());

      // Get latest inventory record if exists, otherwise calculate from imports
      // Use amount for currentQuantity calculation (khối lượng)
      let currentQuantity = 0;
      if (ingredientInventories.length > 0) {
        // Use latest inventory as base
        currentQuantity = ingredientInventories[0].amount;
        // Add imports after last inventory
        const lastInventoryDate = new Date(ingredientInventories[0].inventoryDate);
        const importsAfterInventory = ingredientImports.filter(
          imp => new Date(imp.importDate) > lastInventoryDate
        );
        currentQuantity += importsAfterInventory.reduce((sum, imp) => sum + imp.amount, 0);
      } else {
        // No inventory, sum all imports
        currentQuantity = ingredientImports.reduce((sum, imp) => sum + imp.amount, 0);
      }

      // Calculate average price
      const averagePrice = ingredientImports.length > 0
        ? ingredientImports.reduce((sum, imp) => sum + imp.price, 0) / ingredientImports.length
        : undefined;

      // Calculate total imported quantity (sum of all imports - using amount)
      const totalImportedQuantity = ingredientImports.reduce((sum, imp) => sum + imp.amount, 0);

      // Check if low stock: current quantity < 20% of total imported quantity
      const isLowStock = totalImportedQuantity > 0
        ? currentQuantity < (totalImportedQuantity * 0.2)
        : false;

      return {
        ...ingredient,
        currentQuantity,
        lastImportDate: ingredientImports[0]?.importDate,
        lastInventoryDate: ingredientInventories[0]?.inventoryDate,
        averagePrice,
        isLowStock,
        totalImportedQuantity
      } as IngredientWithStats;
    });
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return [];
  }
};

/**
 * Check if ingredient with same name and supplier already exists
 */
export const checkIngredientExists = async (name: string, supplier: string, excludeId?: string): Promise<boolean> => {
  try {
    const ingredientsRef = collection(db, 'ingredients');
    const q = query(
      ingredientsRef,
      where('name', '==', name.trim()),
      where('supplier', '==', supplier.trim())
    );
    const snapshot = await getDocs(q);
    
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking ingredient existence:", error);
    return false;
  }
};

/**
 * Find ingredient by name and supplier for auto-complete
 */
export const findIngredientByNameAndSupplier = async (name: string, supplier: string): Promise<Ingredient | null> => {
  try {
    if (!name.trim() || !supplier.trim()) {
      return null;
    }

    const ingredientsRef = collection(db, 'ingredients');
    const q = query(
      ingredientsRef,
      where('name', '==', name.trim()),
      where('supplier', '==', supplier.trim())
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      supplier: data.supplier || '',
      amount: Number(data.amount || 0),
      quantity: Number(data.quantity || 0),
      unit: data.unit || 'kg',
      note: data.note || '',
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
    } as Ingredient;
  } catch (error) {
    console.error("Error finding ingredient:", error);
    return null;
  }
};

/**
 * Add new ingredient - chỉ cần name và supplier
 */
export const addIngredient = async (ingredientData: { name: string; supplier: string; amount?: number; quantity?: number; unit?: string; note?: string }): Promise<void> => {
  try {
    // Check for duplicate
    const exists = await checkIngredientExists(ingredientData.name, ingredientData.supplier);
    if (exists) {
      throw new Error('Nguyên liệu với tên và nhà cung cấp này đã tồn tại');
    }

    const ingredientsRef = collection(db, 'ingredients');
    await addDoc(ingredientsRef, {
      name: ingredientData.name.trim(),
      supplier: ingredientData.supplier.trim(),
      amount: ingredientData.amount || 0,
      quantity: ingredientData.quantity || 0,
      unit: ingredientData.unit || 'kg',
      note: ingredientData.note || '',
      history: {
        import: [],
        inventory: []
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error adding ingredient:", error);
    throw error;
  }
};

/**
 * Update ingredient
 */
export const updateIngredient = async (id: string, ingredientData: Partial<Ingredient>): Promise<void> => {
  try {
    // If name or supplier changed, check for duplicate
    if (ingredientData.name || ingredientData.supplier) {
      const currentIngredient = await getIngredientById(id);
      const name = ingredientData.name || currentIngredient?.name || '';
      const supplier = ingredientData.supplier || currentIngredient?.supplier || '';
      
      const exists = await checkIngredientExists(name, supplier, id);
      if (exists) {
        throw new Error('Nguyên liệu với tên và nhà cung cấp này đã tồn tại');
      }
    }

    const ingredientRef = doc(db, 'ingredients', id);
    const { id: _, ...updateData } = ingredientData as any;
    
    await updateDoc(ingredientRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating ingredient:", error);
    throw error;
  }
};

/**
 * Get ingredient by ID
 */
export const getIngredientById = async (id: string): Promise<Ingredient | null> => {
  try {
    const ingredientRef = doc(db, 'ingredients', id);
    const docSnapshot = await getDoc(ingredientRef);
    
    if (!docSnapshot.exists()) return null;
    
    const data = docSnapshot.data();
    
    // Parse history from Firestore
    const history = data.history || {};
    const importRecords: ImportRecord[] = (history.import || []).map((imp: any) => ({
      id: imp.id || '',
      amount: Number(imp.amount || 0),
      quantity: Number(imp.quantity || 0),
      unit: imp.unit || '',
      price: Number(imp.price || 0),
      importDate: imp.importDate?.toDate?.().toISOString() || imp.importDate || new Date().toISOString(),
      note: imp.note || '',
      createdAt: imp.createdAt?.toDate?.().toISOString() || imp.createdAt || new Date().toISOString()
    }));

    const inventoryRecords: InventoryRecord[] = (history.inventory || []).map((inv: any) => ({
      id: inv.id || '',
      amount: Number(inv.amount || 0),
      quantity: Number(inv.quantity || 0),
      inventoryDate: inv.inventoryDate?.toDate?.().toISOString() || inv.inventoryDate || new Date().toISOString(),
      note: inv.note || '',
      createdAt: inv.createdAt?.toDate?.().toISOString() || inv.createdAt || new Date().toISOString()
    }));

    return {
      id: docSnapshot.id,
      name: data.name,
      supplier: data.supplier || '',
      quantity: Number(data.quantity || 0),
      unit: data.unit || 'kg',
      note: data.note || '',
      history: {
        import: importRecords,
        inventory: inventoryRecords
      },
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
    } as Ingredient;
  } catch (error) {
    console.error("Error getting ingredient:", error);
    return null;
  }
};

/**
 * Delete ingredient
 */
export const deleteIngredient = async (id: string): Promise<void> => {
  try {
    const ingredientRef = doc(db, 'ingredients', id);
    await deleteDoc(ingredientRef);
    // History is already in the ingredient document, so no need to delete separately
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    throw error;
  }
};

/**
 * Add import record - nhập hàng
 */
export const addImportRecord = async (importData: {
  ingredientId: string;
  amount: number;
  quantity: number;
  unit: string;
  price: number;
  importDate: string; // ISO string
  note?: string;
}): Promise<void> => {
  try {
    const ingredientRef = doc(db, 'ingredients', importData.ingredientId);
    const ingredientDoc = await getDoc(ingredientRef);
    
    if (!ingredientDoc.exists()) {
      throw new Error('Ingredient not found');
    }

    const data = ingredientDoc.data();
    const currentHistory = data.history || { import: [], inventory: [] };
    const currentImports = currentHistory.import || [];

    // Create new import record
    const newImportRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
      amount: importData.amount,
      quantity: importData.quantity,
      unit: importData.unit,
      price: importData.price,
      importDate: Timestamp.fromDate(new Date(importData.importDate)),
      note: importData.note || '',
      createdAt: Timestamp.now()
    };

    // Add to history
    const updatedImports = [...currentImports, newImportRecord];

    // Update ingredient with new history
    await updateDoc(ingredientRef, {
      history: {
        ...currentHistory,
        import: updatedImports
      },
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error adding import record:", error);
    throw error;
  }
};

/**
 * Add inventory record - kiểm kê
 */
export const addInventoryRecord = async (inventoryData: {
  ingredientId: string;
  amount: number;
  quantity: number;
  inventoryDate: string; // ISO string
  note?: string;
}): Promise<void> => {
  try {
    const ingredientRef = doc(db, 'ingredients', inventoryData.ingredientId);
    const ingredientDoc = await getDoc(ingredientRef);
    
    if (!ingredientDoc.exists()) {
      throw new Error('Ingredient not found');
    }

    const data = ingredientDoc.data();
    const currentHistory = data.history || { import: [], inventory: [] };
    const currentInventories = currentHistory.inventory || [];

    // Create new inventory record
    const newInventoryRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
      amount: inventoryData.amount,
      quantity: inventoryData.quantity,
      inventoryDate: Timestamp.fromDate(new Date(inventoryData.inventoryDate)),
      note: inventoryData.note || '',
      createdAt: Timestamp.now()
    };

    // Add to history
    const updatedInventories = [...currentInventories, newInventoryRecord];

    // Update ingredient with new history
    await updateDoc(ingredientRef, {
      history: {
        ...currentHistory,
        inventory: updatedInventories
      },
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error adding inventory record:", error);
    throw error;
  }
};

/**
 * Get import records for an ingredient
 */
export const getImportRecords = async (ingredientId: string): Promise<ImportRecord[]> => {
  try {
    const ingredientRef = doc(db, 'ingredients', ingredientId);
    const ingredientDoc = await getDoc(ingredientRef);
    
    if (!ingredientDoc.exists()) {
      return [];
    }

    const data = ingredientDoc.data();
    const history = data.history || {};
    const imports = history.import || [];

    return imports.map((imp: any) => ({
      id: imp.id || '',
      amount: Number(imp.amount || 0),
      quantity: Number(imp.quantity || 0),
      unit: imp.unit || '',
      price: Number(imp.price || 0),
      importDate: imp.importDate?.toDate?.().toISOString() || imp.importDate || new Date().toISOString(),
      note: imp.note || '',
      createdAt: imp.createdAt?.toDate?.().toISOString() || imp.createdAt || new Date().toISOString()
    })).sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime());
  } catch (error) {
    console.error("Error fetching import records:", error);
    return [];
  }
};

/**
 * Get inventory records for an ingredient
 */
export const getInventoryRecords = async (ingredientId: string): Promise<InventoryRecord[]> => {
  try {
    const ingredientRef = doc(db, 'ingredients', ingredientId);
    const ingredientDoc = await getDoc(ingredientRef);
    
    if (!ingredientDoc.exists()) {
      return [];
    }

    const data = ingredientDoc.data();
    const history = data.history || {};
    const inventories = history.inventory || [];

    return inventories.map((inv: any) => ({
      id: inv.id || '',
      amount: Number(inv.amount || 0),
      quantity: Number(inv.quantity || 0),
      inventoryDate: inv.inventoryDate?.toDate?.().toISOString() || inv.inventoryDate || new Date().toISOString(),
      note: inv.note || '',
      createdAt: inv.createdAt?.toDate?.().toISOString() || inv.createdAt || new Date().toISOString()
    })).sort((a, b) => new Date(b.inventoryDate).getTime() - new Date(a.inventoryDate).getTime());
  } catch (error) {
    console.error("Error fetching inventory records:", error);
    return [];
  }
};

