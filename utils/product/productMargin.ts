/**
 * Pure helpers for product margin calculations + color coding.
 * Shared between ProductSection, ProductDetailPage, ProductStatsBanner.
 */
import type { Product } from '@/types';

/**
 * Margin = (price - cost) / price. Returns null nếu thiếu dữ liệu.
 */
export const calcMargin = (p: Product): number | null => {
  if (!p.costPrice || p.costPrice <= 0 || !p.price || p.price <= 0) return null;
  return (p.price - p.costPrice) / p.price;
};

export interface MarginPalette {
  fg: string;
  bg: string;
  label: string;
}

/**
 * Map margin → palette + label. Null margin = grey "—".
 * <0: red LỖ, <20%: orange, ≥20%: green
 */
export const marginColor = (m: number | null): MarginPalette => {
  if (m === null) return { fg: '#94a3b8', bg: '#94a3b822', label: '—' };
  if (m < 0) return { fg: '#dc2626', bg: '#dc262622', label: `${Math.round(m * 100)}% LỖ` };
  if (m < 0.2) return { fg: '#ea580c', bg: '#ea580c22', label: `${Math.round(m * 100)}%` };
  return { fg: '#16a34a', bg: '#16a34a22', label: `${Math.round(m * 100)}%` };
};
