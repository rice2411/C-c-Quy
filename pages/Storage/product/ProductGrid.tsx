import React, { useEffect, useMemo, useState } from 'react';
import { Package, Tag, Loader2, Image as ImageIcon, DollarSign, Boxes } from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/format/currencyUtil';
import { getTagPalette } from '@/utils/product/productTagPalette';
import { fetchBadgesConfiguration } from '@/services/badgeService';
import type { ProductBadge } from '@/types/badge';
import Badge from '@/components/ui/Badge';

import Heading from '@/components/ui/Heading';
import Button from '@/components/ui/Button';
interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onCreate: () => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, onEdit, onCreate }) => {
  const { t } = useLanguage();

  // Load product badges từ config để hiển thị chip có màu đúng cấu hình
  const [productBadges, setProductBadges] = useState<ProductBadge[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchBadgesConfiguration();
        if (!cancelled) setProductBadges(cfg.productBadges);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const badgeByName = useMemo(() => {
    const m = new Map<string, ProductBadge>();
    productBadges.forEach((b) => m.set(b.name, b));
    return m;
  }, [productBadges]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('inventory.loading') || 'Đang tải...'}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-400 dark:text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t('inventory.noProducts') || 'Chưa có sản phẩm nào'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Tạo sản phẩm đầu tiên để bắt đầu
            </p>
          </div>
          <Button
            onClick={onCreate}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            {t('inventory.createFirst') || 'Tạo sản phẩm đầu tiên'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
      {products.map(product => (
        <div
          key={product.id}
          onClick={() => onEdit(product)}
          className="group relative bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          {/* Image Section */}
          <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Status Badge */}
            <div className="absolute top-3 right-3 z-10">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shadow-lg backdrop-blur-sm ${
                product.status === 'active' 
                  ? 'bg-emerald-500/90 text-white dark:bg-emerald-600/90' 
                  : 'bg-slate-500/90 text-white dark:bg-slate-600/90'
              }`}>
                {product.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
              </span>
            </div>

            {/* Category Badge */}
            {product.category && (
              <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full">
                  <Tag className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {product.category}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div>
              <Heading level={3} textClassName="font-bold text-slate-900 dark:text-white line-clamp-1 text-base mb-1" title={product.name}>
                {product.name}
              </Heading>
              {product.tags && product.tags.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {product.tags.map((tag, idx) => {
                    const badge = badgeByName.get(tag);
                    // Tag có trong config → dùng màu cấu hình
                    if (badge) {
                      return (
                        <span
                          key={`${product.id}-tag-${idx}-${tag}`}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            backgroundColor: badge.color + '22',
                            color: badge.color,
                            border: `1px solid ${badge.color}55`,
                          }}
                        >
                          {badge.icon ? <span>{badge.icon}</span> : null}
                          {tag}
                        </span>
                      );
                    }
                    // Legacy fallback
                    const palette = getTagPalette(tag);
                    return (
                      <Badge
                        key={`${product.id}-tag-${idx}-${tag}`}
                        className={palette.chip}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
                </div>
              ) : null}
              {product.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>

            {/* Materials Info */}
            {product.materials && product.materials.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-600 dark:bg-slate-700/50">
                  <Boxes className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {product.materials.length} vật liệu
                  </span>
                </div>
              </div>
            )}

            {/* Price Section */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                  {formatVND(product.price)}
                </span>
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {t('inventory.formTitleEdit') || 'Chỉnh sửa'}
              </div>
            </div>
          </div>

          {/* Hover Effect Border */}
          <div className="absolute inset-0 border-2 border-orange-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
