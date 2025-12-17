import React from 'react';
import { Package, Tag, Edit2, Trash2 } from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/currencyUtil';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, onEdit, onDelete, onCreate }) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Package className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500">
        <Package className="w-16 h-16 mb-4 opacity-20" />
        <p className="mb-4">{t('inventory.noProducts')}</p>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          {t('inventory.createFirst')}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
      {products.map(product => (
        <div key={product.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="aspect-square bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Product'; }}
            />
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${product.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                {t(`inventory.${product.status}`)}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1" title={product.name}>{product.name}</h3>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <Tag className="w-3 h-3 mr-1" />
                  <span>{product.category}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5em] mb-3">
              {product.description || 'No description available.'}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {formatVND(product.price)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(product)}
                  className="p-1.5 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(product.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;

