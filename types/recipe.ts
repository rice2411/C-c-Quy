export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: 'g' | 'piece';
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions?: string;
  yield?: number;
  yieldUnit?: string;
  outputQuantity?: number;
  wasteRate?: number;
  createdAt?: any;
  updatedAt?: any;
}
