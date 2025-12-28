import { RecipeIngredient, Ingredient } from '@/types';
import { calculateCurrentQuantity } from './ingredientUtil';

export interface IngredientCalculationResult {
  ingredient: Ingredient;
  recipeIngredient: RecipeIngredient;
  required: number;
  available: number;
  sufficient: boolean;
  shortage: number;
}

export interface MaxPossibleCalculation {
  recipeCount: number;
  productQuantity: number;
}

/**
 * Tính toán nguyên liệu cần thiết cho một số lượng công thức
 * @param recipeIngredients - Danh sách nguyên liệu trong công thức
 * @param ingredients - Danh sách tất cả nguyên liệu
 * @param recipeCount - Số lần làm công thức
 * @returns Kết quả tính toán cho từng nguyên liệu
 */
export const calculateIngredientRequirements = (
  recipeIngredients: RecipeIngredient[],
  ingredients: Ingredient[],
  recipeCount: number
): IngredientCalculationResult[] | null => {
  if (recipeIngredients.length === 0 || recipeCount <= 0) {
    return null;
  }

  return recipeIngredients
    .map((ri) => {
      const ingredient = ingredients.find((ing) => ing.id === ri.ingredientId);
      if (!ingredient) return null;
      const required = ri.quantity * recipeCount;
      const available = calculateCurrentQuantity(ingredient);
      const sufficient = available >= required;
      const shortage = required - available;
      return {
        ingredient,
        recipeIngredient: ri,
        required,
        available,
        sufficient,
        shortage: shortage > 0 ? shortage : 0,
      };
    })
    .filter((result): result is IngredientCalculationResult => result !== null);
};

/**
 * Kiểm tra xem tất cả nguyên liệu có đủ không
 * @param calculationResults - Kết quả tính toán nguyên liệu
 * @returns true nếu tất cả nguyên liệu đủ, false nếu không
 */
export const checkAllIngredientsSufficient = (
  calculationResults: IngredientCalculationResult[] | null
): boolean => {
  return calculationResults?.every((r) => r.sufficient) ?? false;
};

/**
 * Tính số lần cần làm công thức dựa trên số lượng thành phẩm và tỉ lệ hao hụt
 * @param productQuantity - Số lượng thành phẩm muốn sản xuất
 * @param outputQuantity - Số lượng thành phẩm của công thức
 * @param wasteRate - Tỉ lệ hao hụt (%)
 * @returns Số lần cần làm công thức
 */
export const calculateRequiredRecipeCount = (
  productQuantity: number,
  outputQuantity: number,
  wasteRate: number
): number => {
  if (!outputQuantity || outputQuantity <= 0) {
    return 0;
  }
  const wasteMultiplier = 1 + wasteRate / 100;
  return (productQuantity * wasteMultiplier) / outputQuantity;
};

/**
 * Tính số lượng thành phẩm có thể làm được dựa trên nguyên liệu hiện có
 * @param recipeIngredients - Danh sách nguyên liệu trong công thức
 * @param ingredients - Danh sách tất cả nguyên liệu
 * @param outputQuantity - Số lượng thành phẩm của công thức
 * @returns Số lần có thể làm công thức và số lượng thành phẩm có thể làm được
 */
export const calculateMaxPossibleProductQuantity = (
  recipeIngredients: RecipeIngredient[],
  ingredients: Ingredient[],
  outputQuantity: number
): MaxPossibleCalculation => {
  if (recipeIngredients.length === 0 || !outputQuantity || outputQuantity <= 0) {
    return { recipeCount: 0, productQuantity: 0 };
  }

  const possibleRecipeCounts = recipeIngredients
    .map((ri) => {
      const ingredient = ingredients.find((ing) => ing.id === ri.ingredientId);
      if (!ingredient || ri.quantity <= 0) return Infinity;
      const available = calculateCurrentQuantity(ingredient);
      if (available <= 0) return 0;
      return Math.floor(available / ri.quantity);
    })
    .filter((count) => count !== Infinity && count >= 0);

  if (possibleRecipeCounts.length === 0 || possibleRecipeCounts.some((count) => count === 0)) {
    return { recipeCount: 0, productQuantity: 0 };
  }

  const minRecipeCount = Math.min(...possibleRecipeCounts);
  const productQuantity = minRecipeCount * outputQuantity;

  return { recipeCount: minRecipeCount, productQuantity };
};

/**
 * Tính số lượng thành phẩm cuối cùng sau khi trừ hao hụt
 * @param outputQuantity - Số lượng thành phẩm của công thức
 * @param wasteRate - Tỉ lệ hao hụt (%)
 * @returns Số lượng thành phẩm cuối cùng
 */
export const calculateFinalQuantity = (
  outputQuantity: number,
  wasteRate: number
): number => {
  if (!outputQuantity || outputQuantity <= 0) {
    return 0;
  }
  return Math.round(outputQuantity * (1 - wasteRate / 100) * 100) / 100;
};

