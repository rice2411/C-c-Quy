import React, { useState, useMemo } from 'react';
import { 
  Edit, 
  Package, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  TrendingUp,
  Warehouse,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Receipt
} from 'lucide-react';
import { Ingredient, IngredientType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  calculateTotalImportQuantity, 
  calculateTotalUsageQuantity, 
  calculateCurrentQuantity, 
  isOutOfStock,
  calculateTotalImportPrice,
  calculateImportCount
} from '@/utils/ingredientUtil';

interface IngredientTableProps {
  ingredients: Ingredient[];
  loading: boolean;
  onEdit: (ingredient: Ingredient) => void;
}

type SortField = 'name' | 'type' | 'currentQuantity' | 'initialQuantity' | 'totalImport' | 'totalUsage';
type SortDirection = 'asc' | 'desc';

const typeOrder: IngredientType[] = [
  IngredientType.BASE,
  IngredientType.FLAVOR,
  IngredientType.TOPPING,
  IngredientType.DECORATION,
  IngredientType.MATERIAL,
];

const getTypeIcon = (type: IngredientType) => {
  return Package;
};

const getTypeColors = (type: IngredientType) => {
  switch (type) {
    case IngredientType.BASE:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      };
    case IngredientType.FLAVOR:
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-300',
        badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
      };
    case IngredientType.TOPPING:
      return {
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        text: 'text-pink-700 dark:text-pink-300',
        badge: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
      };
    case IngredientType.DECORATION:
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
      };
    case IngredientType.MATERIAL:
      return {
        bg: 'bg-teal-50 dark:bg-teal-900/20',
        text: 'text-teal-700 dark:text-teal-300',
        badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        badge: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
      };
  }
};

const IngredientTable: React.FC<IngredientTableProps> = ({ ingredients, loading, onEdit }) => {
  const { t } = useLanguage();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<IngredientType | 'all'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'inStock' | 'outOfStock'>('all');

  const sortedAndFiltered = useMemo(() => {
    let result = [...ingredients];

    if (filterType !== 'all') {
      result = result.filter(ing => ing.type === filterType);
    }

    if (filterStock !== 'all') {
      result = result.filter(ing => {
        if (filterStock === 'outOfStock') return isOutOfStock(ing);
        if (filterStock === 'inStock') return !isOutOfStock(ing);
        return true;
      });
    }

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = typeOrder.indexOf(a.type);
          bValue = typeOrder.indexOf(b.type);
          break;
        case 'currentQuantity':
          aValue = calculateCurrentQuantity(a);
          bValue = calculateCurrentQuantity(b);
          break;
        case 'initialQuantity':
          aValue = a.initialQuantity ?? 0;
          bValue = b.initialQuantity ?? 0;
          break;
        case 'totalImport':
          aValue = calculateTotalImportQuantity(a);
          bValue = calculateTotalImportQuantity(b);
          break;
        case 'totalUsage':
          aValue = calculateTotalUsageQuantity(a);
          bValue = calculateTotalUsageQuantity(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [ingredients, sortField, sortDirection, filterType, filterStock]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-orange-600" />
      : <ArrowDown className="w-4 h-4 text-orange-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('ingredients.loading')}</p>
        </div>
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('ingredients.noData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('ingredients.filterByType') || 'Lọc theo loại:'}
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as IngredientType | 'all')}
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">{t('ingredients.allTypes') || 'Tất cả'}</option>
            {typeOrder.map((type) => (
              <option key={type} value={type}>
                {t(`ingredients.form.types.${type.toString().toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('ingredients.filterByStock') || 'Lọc theo tồn kho:'}
          </span>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value as typeof filterStock)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">{t('ingredients.allStock') || 'Tất cả'}</option>
            <option value="inStock">{t('ingredients.inStock') || 'Còn hàng'}</option>
            <option value="outOfStock">{t('ingredients.outOfStock') || 'Hết hàng'}</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-slate-600 dark:text-slate-400">
          {t('ingredients.showing') || 'Hiển thị'} <span className="font-semibold text-slate-900 dark:text-white">{sortedAndFiltered.length}</span> / {ingredients.length}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {t('ingredients.name') || 'Tên'}
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('type')}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {t('ingredients.type') || 'Loại'}
                    <SortIcon field="type" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('currentQuantity')}
                    className="flex items-center gap-2 ml-auto text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {t('ingredients.currentQuantity') || 'Tồn kho'}
                    <SortIcon field="currentQuantity" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('initialQuantity')}
                    className="flex items-center gap-2 ml-auto text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {t('ingredients.initialQuantity') || 'Ban đầu'}
                    <SortIcon field="initialQuantity" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('totalImport')}
                    className="flex items-center gap-2 ml-auto text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {t('ingredients.totalImport') || 'Nhập'}
                    <SortIcon field="totalImport" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('totalUsage')}
                    className="flex items-center gap-2 ml-auto text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {t('ingredients.totalUsage') || 'Sử dụng'}
                    <SortIcon field="totalUsage" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('ingredients.totalImportPrice') || 'Tổng giá nhập'}
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('ingredients.importCount') || 'Số lần nhập'}
                  </span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('ingredients.status') || 'Trạng thái'}
                  </span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('ingredients.actions') || 'Thao tác'}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedAndFiltered.map((ing) => {
                const outOfStock = isOutOfStock(ing);
                const currentQty = calculateCurrentQuantity(ing);
                const totalImport = calculateTotalImportQuantity(ing);
                const totalUsage = calculateTotalUsageQuantity(ing);
                const totalImportPrice = calculateTotalImportPrice(ing);
                const importCount = calculateImportCount(ing);
                const colors = getTypeColors(ing.type);

                return (
                  <tr
                    key={ing.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {ing.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${colors.badge}`}>
                        {t(`ingredients.form.types.${ing.type.toString().toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <TrendingUp className={`w-4 h-4 ${outOfStock ? 'text-red-500' : 'text-orange-500'}`} />
                        <span className={`font-bold ${outOfStock ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {currentQty.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {ing.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Warehouse className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {(ing.initialQuantity ?? 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {ing.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ArrowDownCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-700 dark:text-green-300">
                          {totalImport.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {ing.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ArrowUpCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-700 dark:text-red-300">
                          {totalUsage.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {ing.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-green-700 dark:text-green-300 font-medium">
                          {totalImportPrice > 0 ? new Intl.NumberFormat('vi-VN', { 
                            style: 'currency', 
                            currency: 'VND',
                            maximumFractionDigits: 0
                          }).format(totalImportPrice) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Receipt className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                          {importCount}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {t('ingredients.times') || 'lần'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {outOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                          <XCircle className="w-3.5 h-3.5" />
                          {t('ingredients.outOfStock')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('ingredients.inStock') || 'Còn hàng'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onEdit(ing)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        {t('ingredients.edit') || 'Sửa'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IngredientTable;

