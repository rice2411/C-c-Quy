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
  // Usage history has been removed; keep function for compatibility
  return 0;
};

/**
 * Tính số lượng hiện tại của một nguyên liệu
 * @param ingredient - Nguyên liệu
 * @returns Số lượng hiện tại của nguyên liệu
 */
export const calculateCurrentQuantity = (ingredient: Ingredient): number => {
  const initialQty = ingredient.initialQuantity ?? 0;
  const totalImport = calculateTotalImportQuantity(ingredient);
  return initialQty + totalImport;
};

/**
 * Kiểm tra xem số lượng hiện tại của một nguyên liệu có bằng 0 hay không
 * @param ingredient - Nguyên liệu
 * @returns true nếu số lượng hiện tại của nguyên liệu bằng 0, false nếu không
 */
export const isOutOfStock = (ingredient: Ingredient): boolean => {
  return calculateCurrentQuantity(ingredient) <= 0;
};

/**
 * Tính tổng giá đã nhập cho một nguyên liệu
 * @param ingredient - Nguyên liệu
 * @returns Tổng giá đã nhập (VND)
 */
export const calculateTotalImportPrice = (ingredient: Ingredient): number => {
  if (!ingredient.history || ingredient.history.length === 0) {
    return 0;
  }
  return ingredient.history.reduce((acc, item) => {
    if (item.type === IngredientHistoryType.IMPORT && item.price && item.importQuantity) {
      return acc + (item.price * item.importQuantity);
    }
    return acc;
  }, 0);
};

/**
 * Tính số lần đã nhập cho một nguyên liệu
 * @param ingredient - Nguyên liệu
 * @returns Số lần đã nhập
 */
export const calculateImportCount = (ingredient: Ingredient): number => {
  if (!ingredient.history || ingredient.history.length === 0) {
    return 0;
  }
  return ingredient.history.filter(item => item.type === IngredientHistoryType.IMPORT).length;
};

/**
 * Tính tổng khối lượng đã nhập cho một nguyên liệu
 * @param ingredient - Nguyên liệu
 * @returns Tổng khối lượng đã nhập (g)
 */
export const calculateTotalImportWeight = (ingredient: Ingredient): number => {
  if (!ingredient.history || ingredient.history.length === 0) {
    return 0;
  }
  return ingredient.history.reduce((acc, item) => {
    if (item.type === IngredientHistoryType.IMPORT && item.productWeight && item.importQuantity) {
      return acc + (item.productWeight * item.importQuantity);
    }
    return acc;
  }, 0);
};

