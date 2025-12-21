export enum IngredientType {
  BASE = 'BASE',
  FLAVOR = 'FLAVOR',
  TOPPING = 'TOPPING',
  DECORATION = 'DECORATION',
  MATERIAL = 'MATERIAL',
}
export enum IngredientHistoryType {
  IMPORT = 'IMPORT',
  USAGE = 'USAGE',
}

export interface IngredientHistory {
  id: string;
  type: IngredientHistoryType;
  fromQuantity: number;
  importQuantity: number;
  unit: 'g' | 'piece';
  note?: string;
  supplierId?: string;
  supplierName?: string;
  price?: number;
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  type: IngredientType;
  initialQuantity: number;
  unit: 'g' | 'piece';
  history?: IngredientHistory[];
  createdAt?: any;
  updatedAt?: any;
}

