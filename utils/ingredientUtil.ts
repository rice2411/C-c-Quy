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

/**
 * Tính giá trung bình mỗi đơn vị của nguyên liệu
 * Dựa trên tổng giá đã nhập và tổng số lượng đã nhập (theo đơn vị lưu trong importQuantity)
 * 
 * Logic:
 * - price trong history là giá mỗi đơn vị (VND/unit)
 * - Tổng giá = sum(price * importQuantity) cho tất cả lần nhập
 * - Tổng số lượng = sum(importQuantity) cho tất cả lần nhập
 * - Giá trung bình = Tổng giá / Tổng số lượng
 * 
 * @param ingredient - Nguyên liệu
 * @returns Giá trung bình trên mỗi đơn vị (cùng đơn vị với importQuantity / ingredient.unit), trả về 0 nếu không có dữ liệu
 */
export const calculateAveragePrice = (ingredient: Ingredient): number => {
  if (!ingredient.history || ingredient.history.length === 0) {
    return 0;
  }

  const importHistory = ingredient.history.filter(
    (item) =>
      item.type === IngredientHistoryType.IMPORT &&
      item.importQuantity &&
      item.price !== undefined &&
      item.price !== null
  );

  if (importHistory.length === 0) {
    return 0;
  }

  // Tổng giá = sum(price * importQuantity)
  const totalPrice = importHistory.reduce(
    (sum, item) => sum + (item.price as number) * item.importQuantity,
    0
  );

  // Tùy theo đơn vị chính của nguyên liệu, chọn mẫu số phù hợp
  let totalQuantityForAverage = 0;

  if (ingredient.unit === "piece") {
    // Nguyên liệu tính theo cái: importQuantity là số cái
    totalQuantityForAverage = importHistory.reduce(
      (sum, item) => sum + item.importQuantity,
      0
    );
  } else {
    // Nguyên liệu tính theo gram:
    // - Nếu có productWeight: importQuantity (số gói) * productWeight (gram/gói)
    // - Nếu không có productWeight: importQuantity đã là gram
    totalQuantityForAverage = importHistory.reduce((sum, item) => {
      if (item.productWeight && item.productWeight > 0) {
        return sum + item.importQuantity * item.productWeight;
      }
      return sum + item.importQuantity;
    }, 0);
  }

  if (totalQuantityForAverage <= 0) {
    return 0;
  }

  const averagePrice = totalPrice / totalQuantityForAverage;

  // Kiểm tra kết quả hợp lệ
  if (isNaN(averagePrice) || !isFinite(averagePrice)) {
    return 0;
  }
  
  return averagePrice;
};

