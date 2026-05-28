/**
 * Stock status helper — map currentStock/lowStockThreshold → status + color.
 */
import type { Product } from '@/types';

export interface StockStatus {
  kind: 'none' | 'normal' | 'low' | 'out';
  color: string;
  label: string;
}

export const getStockStatus = (p: Product): StockStatus => {
  if (typeof p.currentStock !== 'number') {
    return { kind: 'none', color: '#94a3b8', label: '' };
  }
  if (p.currentStock <= 0) {
    return {
      kind: 'out',
      color: '#dc2626',
      label: `${p.currentStock} ${p.stockUnit || ''}`.trim(),
    };
  }
  const threshold = p.lowStockThreshold ?? 5;
  if (p.currentStock <= threshold) {
    return {
      kind: 'low',
      color: '#ea580c',
      label: `${p.currentStock} ${p.stockUnit || ''}`.trim(),
    };
  }
  return {
    kind: 'normal',
    color: '#16a34a',
    label: `${p.currentStock} ${p.stockUnit || ''}`.trim(),
  };
};
