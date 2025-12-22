import { Ingredient, IngredientHistoryType } from '@/types';

/**
 * Tính tổng số lượng nhập vào cho một nguyên liệu
 * @param ingredient - Nguyên liệu
 * @returns Tổng số lượng nhập vào cho nguyên liệu
 */
export const calculateTotalImportQuantity = (ingredient: Ingredient): number => {
  if (!ingredient.history || ingredient.history.length === 0) {
    return 0;
  }
  return ingredient.history.reduce((acc, item) => {
    if (item.type === IngredientHistoryType.IMPORT) {
      return acc + item.importQuantity;
    }
    return acc;
  }, 0);
};

/**
 * Tính tổng số lượng sử dụng cho một nguyên liệu
 * @param ingredient - Nguyên liệu
 * @returns Tổng số lượng sử dụng cho nguyên liệu
 */
export const calculateTotalUsageQuantity = (ingredient: Ingredient): number => {
  if (!ingredient.history || ingredient.history.length === 0) {
    return 0;
  }
  return ingredient.history.reduce((acc, item) => {
    if (item.type === IngredientHistoryType.USAGE) {
      return acc + item.importQuantity;
    }
    return acc;
  }, 0);
};

/**
 * Tính số lượng hiện tại của một nguyên liệu
 * @param ingredient - Nguyên liệu
 * @returns Số lượng hiện tại của nguyên liệu
 */
export const calculateCurrentQuantity = (ingredient: Ingredient): number => {
  const initialQty = ingredient.initialQuantity ?? 0;
  const totalImport = calculateTotalImportQuantity(ingredient);
  const totalUsage = calculateTotalUsageQuantity(ingredient);
  return initialQty + totalImport - totalUsage;
};

/**
 * Kiểm tra xem số lượng hiện tại của một nguyên liệu có thấp hơn 100 hay không
 * @param ingredient - Nguyên liệu
 * @returns true nếu số lượng hiện tại của nguyên liệu thấp hơn 100, false nếu không
 */
export const isLowStock = (ingredient: Ingredient): boolean => {
  const quantity = calculateCurrentQuantity(ingredient);
  return quantity < 100 && quantity > 0;
};

/**
 * Kiểm tra xem số lượng hiện tại của một nguyên liệu có bằng 0 hay không
 * @param ingredient - Nguyên liệu
 * @returns true nếu số lượng hiện tại của nguyên liệu bằng 0, false nếu không
 */
export const isOutOfStock = (ingredient: Ingredient): boolean => {
  return calculateCurrentQuantity(ingredient) <= 0;
};

