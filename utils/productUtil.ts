import { Recipe, Ingredient } from '@/types';
import { calculateAveragePrice } from './ingredientUtil';

/**
 * Tính tổng giá thành công thức (từ nguyên liệu) và giá mỗi thành phẩm.
 * @param recipe - Công thức (có ingredients, outputQuantity)
 * @param ingredients - Danh sách nguyên liệu (để lấy averagePrice)
 * @returns { totalCost, costPerOutput } (VND). costPerOutput = totalCost / outputQuantity
 */
export function computeRecipeCost(
  recipe: Recipe,
  ingredients: Ingredient[]
): { totalCost: number; costPerOutput: number } {
  const outputQty = recipe.outputQuantity && recipe.outputQuantity > 0 ? recipe.outputQuantity : 1;
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return { totalCost: 0, costPerOutput: 0 };
  }
  const totalCost = recipe.ingredients.reduce((sum, ri) => {
    const ing = ingredients.find((i) => i.id === ri.ingredientId);
    if (!ing) return sum;
    const avg = calculateAveragePrice(ing);
    if (avg <= 0 || !Number.isFinite(avg)) return sum;
    return sum + avg * ri.quantity;
  }, 0);
  const costPerOutput = outputQty > 0 ? totalCost / outputQty : 0;
  return {
    totalCost,
    costPerOutput: Number.isFinite(costPerOutput) ? costPerOutput : 0,
  };
}
