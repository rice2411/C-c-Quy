/**
 * CSV export — sản phẩm sang file CSV với BOM UTF-8 cho Excel hiểu.
 */
import type { Product } from '@/types';
import { calcMargin } from './productMargin';

export const exportProductsCSV = (products: Product[], filename = 'products.csv'): void => {
  const headers = [
    'ID', 'Tên', 'Category', 'Giá bán', 'Giá vốn', 'Margin %', 'Status', 'Tags',
    'Mô tả', 'Đơn vị', 'Tồn kho', 'Ngưỡng cảnh báo',
  ];
  const rows = products.map((p) => {
    const m = calcMargin(p);
    return [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.price ?? '',
      p.costPrice ?? '',
      m !== null ? `${(m * 100).toFixed(1)}%` : '',
      p.status,
      `"${(p.tags || []).join('; ')}"`,
      `"${(p.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      p.stockUnit || '',
      p.currentStock ?? '',
      p.lowStockThreshold ?? '',
    ].join(',');
  });
  // BOM (﻿) để Excel/LibreOffice nhận diện UTF-8 đúng
  const csv = '﻿' + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
