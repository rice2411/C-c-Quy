import React, { useMemo } from 'react';
import { Box, FlaskConical, Sparkles, Package, Loader2, Warehouse, ArrowDownCircle, TrendingUp, DollarSign, Scale, Receipt } from 'lucide-react';
import { Ingredient, IngredientType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateTotalImportQuantity, calculateCurrentQuantity, isOutOfStock, calculateTotalImportPrice, calculateImportCount } from '@/utils/ingredientUtil';

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
        bg: 'bg-teal-50 dark:bg-teal-900/20',
        border: 'border-teal-200 dark:border-teal-800',
        text: 'text-teal-700 dark:text-teal-300',
        icon: 'text-teal-600 dark:text-teal-400',
        badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
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
                const outOfStock = isOutOfStock(ing);
                const totalImportPrice = calculateTotalImportPrice(ing);
                const currentQuantity = calculateCurrentQuantity(ing);
                const importCount = calculateImportCount(ing);
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

                      {/* Statistics - 2 Rows */}
                      <div className="space-y-2">
                        {/* Row 1: Tổng giá đã nhập (Highlighted) */}
                        <div className="w-full bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 rounded-lg p-3 border-2 border-green-300 dark:border-green-700 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">
                              {t('ingredients.totalImportPrice') || 'Tổng giá đã nhập'}
                            </span>
                          </div>
                          <p className="text-base font-bold text-green-700 dark:text-green-300 leading-none">
                            {totalImportPrice > 0 ? new Intl.NumberFormat('vi-VN', { 
                              style: 'currency', 
                              currency: 'VND',
                              maximumFractionDigits: 0
                            }).format(totalImportPrice) : '-'}
                          </p>
                        </div>

                        {/* Row 2: Tổng khối lượng và Tổng số lần nhập (2 cột) */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Tổng khối lượng (lấy từ số lượng hiện tại) */}
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Scale className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                              <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                                {t('ingredients.totalImportWeight') || 'Tổng khối lượng'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                              {currentQuantity > 0 ? `${currentQuantity.toLocaleString('vi-VN')}${ing.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}` : '-'}
                            </p>
                          </div>

                          {/* Tổng số lần nhập */}
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Receipt className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                              <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                                {t('ingredients.importCount') || 'Tổng số lần nhập'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                              {importCount} {t('ingredients.times') || 'lần'}
                            </p>
                          </div>
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

