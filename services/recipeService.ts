import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp, deleteField } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Recipe } from '@/types';

export const fetchRecipes = async (): Promise<Recipe[]> => {
  try {
    const ref = collection(db, 'recipes');
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        description: data.description || '',
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        instructions: data.instructions || '',
        yield: data.yield || 0,
        yieldUnit: data.yieldUnit || '',
        outputQuantity: data.outputQuantity || 0,
        wasteRate: data.wasteRate || 0,
        recipeType: data.recipeType || 'base',
        baseRecipeId: data.baseRecipeId || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Recipe;
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    try {
      const snapshot = await getDocs(collection(db, 'recipes'));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Recipe));
    } catch (e) {
      return [];
    }
  }
};

export const addRecipe = async (recipeData: Omit<Recipe, 'id'>): Promise<void> => {
  try {
    const ref = collection(db, 'recipes');
    await addDoc(ref, {
      name: recipeData.name.trim(),
      description: recipeData.description || '',
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || '',
      yield: recipeData.yield || 0,
      yieldUnit: recipeData.yieldUnit || '',
      outputQuantity: recipeData.outputQuantity || 0,
      wasteRate: recipeData.wasteRate || 0,
      recipeType: recipeData.recipeType || 'base',
      baseRecipeId: recipeData.baseRecipeId || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding recipe:', error);
    throw error;
  }
};

export const updateRecipe = async (id: string, recipeData: Partial<Recipe>): Promise<void> => {
  try {
    const ref = doc(db, 'recipes', id);
    const payload: any = {
      updatedAt: Timestamp.now(),
    };

    Object.keys(recipeData).forEach((key) => {
      const value = (recipeData as any)[key];
      if (value !== undefined) {
        if (key === 'baseRecipeId') {
          if (value) {
            payload[key] = value;
          } else {
            payload[key] = deleteField();
          }
        } else {
          payload[key] = value;
        }
      }
    });

    await updateDoc(ref, payload);
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

export const deleteRecipe = async (id: string): Promise<void> => {
  try {
    const ref = doc(db, 'recipes', id);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};
