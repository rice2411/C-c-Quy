import React, { useMemo } from 'react';
import { Box, FlaskConical, Sparkles, Package, Loader2, Warehouse, ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';
import { Ingredient, IngredientHistoryType, IngredientType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface IngredientGridProps {
  ingredients: Ingredient[];
  loading: boolean;
  onEdit: (ingredient: Ingredient) => void;
  onCreate: () => void;
}

const typeOrder: IngredientType[] = [
  IngredientType.BASE,
  IngredientType.FLAVOR,
  IngredientType.TOPPING,
  IngredientType.DECORATION,
  IngredientType.MATERIAL,
];

// Get icon for ingredient type
const getTypeIcon = (type: IngredientType) => {
  switch (type) {
    case IngredientType.BASE:
      return Box;
    case IngredientType.FLAVOR:
      return FlaskConical;
    case IngredientType.TOPPING:
      return Sparkles;
    case IngredientType.DECORATION:
      return Sparkles;
    case IngredientType.MATERIAL:
      return Package;
    default:
      return Box;
  }
};

// Get color scheme for ingredient type
const getTypeColors = (type: IngredientType) => {
  switch (type) {
    case IngredientType.BASE:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      };
    case IngredientType.FLAVOR:
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-700 dark:text-purple-300',
        icon: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
      };
    case IngredientType.TOPPING:
      return {
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        border: 'border-pink-200 dark:border-pink-800',
        text: 'text-pink-700 dark:text-pink-300',
        icon: 'text-pink-600 dark:text-pink-400',
        badge: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
      };
    case IngredientType.DECORATION:
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: 'text-yellow-600 dark:text-yellow-400',
        badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
      };
    case IngredientType.MATERIAL:
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-800',
        border: 'border-slate-200 dark:border-slate-700',
        text: 'text-slate-700 dark:text-slate-300',
        icon: 'text-slate-600 dark:text-slate-400',
        badge: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
      };
  }
};

// Calculate total import quantity from history
const calculateTotalImportQuantity = (ingredient: Ingredient): number => {
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

// Calculate total usage quantity from history
const calculateTotalUsageQuantity = (ingredient: Ingredient): number => {
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

// Calculate current quantity from initialQuantity and history
const calculateCurrentQuantity = (ingredient: Ingredient): number => {
  const initialQty = ingredient.initialQuantity ?? 0;
  const totalImport = calculateTotalImportQuantity(ingredient);
  const totalUsage = calculateTotalUsageQuantity(ingredient);
  return initialQty + totalImport - totalUsage;
};

// Check if stock is low (less than 10% or less than 100g/pieces)
const isLowStock = (ingredient: Ingredient): boolean => {
  const quantity = calculateCurrentQuantity(ingredient);
  return quantity < 100 && quantity > 0;
};

// Check if out of stock
const isOutOfStock = (ingredient: Ingredient): boolean => {
  return calculateCurrentQuantity(ingredient) <= 0;
};

const IngredientGrid: React.FC<IngredientGridProps> = ({ ingredients, loading, onEdit, onCreate }) => {
  const { t } = useLanguage();

  const grouped = useMemo(
    () =>
      typeOrder
        .map((type) => ({
          type,
          items: ingredients.filter((ing) => ing.type === type),
        }))
        .filter((group) => group.items.length > 0),
    [ingredients]
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('ingredients.loading')}</p>
        </div>
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('ingredients.noData') || 'Chưa có nguyên vật liệu nào'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-6">
      {grouped.map((group) => {
        const TypeIcon = getTypeIcon(group.type);
        const colors = getTypeColors(group.type);
        
        return (
          <div key={group.type} className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                  <TypeIcon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t(`ingredients.form.types.${group.type.toString().toLowerCase()}`)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {group.items.length} {group.items.length === 1 ? t('ingredients.items') : t('ingredients.itemsPlural')}
                  </p>
                </div>
              </div>
            </div>

            {/* Ingredient Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.items.map((ing) => {
                const lowStock = isLowStock(ing);
                const outOfStock = isOutOfStock(ing);
                const itemColors = getTypeColors(ing.type);
                const ItemIcon = getTypeIcon(ing.type);
                
                return (
                  <div
                    key={ing.id}
                    onClick={() => onEdit(ing)}
                    className={`group relative bg-white dark:bg-slate-800 rounded-xl border-2 ${itemColors.border} shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden`}
                  >
                    {/* Stock Status Indicator */}
                    {outOfStock && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                          {t('ingredients.outOfStock')}
                        </span>
                      </div>
                    )}
                    {lowStock && !outOfStock && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs font-bold text-white bg-yellow-500 rounded-full">
                          {t('ingredients.lowStock')}
                        </span>
                      </div>
                    )}

                    <div className="p-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${itemColors.bg} flex items-center justify-center border ${itemColors.border}`}>
                            <ItemIcon className={`w-5 h-5 ${itemColors.icon}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm">
                              {ing.name}
                            </h4>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${itemColors.badge}`}>
                              {t(`ingredients.form.types.${ing.type.toString().toLowerCase()}`)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Quantity - Compact */}
                      <div className={`mb-2.5 rounded-lg p-2.5 border ${outOfStock ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : lowStock ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className={`w-3.5 h-3.5 ${outOfStock ? 'text-red-600 dark:text-red-400' : lowStock ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`} />
                            <span className={`text-[10px] font-semibold uppercase tracking-wide ${outOfStock ? 'text-red-700 dark:text-red-300' : lowStock ? 'text-yellow-700 dark:text-yellow-300' : 'text-orange-700 dark:text-orange-300'}`}>
                              {t('ingredients.currentQuantity')}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-lg font-bold ${outOfStock ? 'text-red-600 dark:text-red-400' : lowStock ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {calculateCurrentQuantity(ing)}
                            </span>
                            <span className={`text-xs font-medium ${outOfStock ? 'text-red-600/70 dark:text-red-400/70' : lowStock ? 'text-yellow-600/70 dark:text-yellow-400/70' : 'text-orange-600/70 dark:text-orange-400/70'}`}>
                              {ing.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Statistics Row - Compact */}
                      <div className="flex items-center gap-1.5">
                        {/* Initial */}
                        <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-md p-1.5 border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Warehouse className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                            <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                              {t('ingredients.initialQuantity')}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                            {ing.initialQuantity ?? 0}
                          </p>
                        </div>

                        {/* Import */}
                        <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-md p-1.5 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-1 mb-0.5">
                            <ArrowDownCircle className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                            <span className="text-[9px] font-semibold text-green-700 dark:text-green-300 uppercase">
                              {t('ingredients.totalImport')}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-green-700 dark:text-green-300 leading-none">
                            {calculateTotalImportQuantity(ing)}
                          </p>
                        </div>

                        {/* Usage */}
                        <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-md p-1.5 border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-1 mb-0.5">
                            <ArrowUpCircle className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
                            <span className="text-[9px] font-semibold text-red-700 dark:text-red-300 uppercase">
                              {t('ingredients.totalUsage')}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-red-700 dark:text-red-300 leading-none">
                            {calculateTotalUsageQuantity(ing)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IngredientGrid;

