/**
 * ProductHistoryView — lịch sử chỉnh sửa product trong modal ProductForm.
 * Wrapper mỏng quanh ProductVersionTimeline (truyền thêm hasProduct).
 */
import React from 'react';
import type { ProductVersion } from '@/types';
import ProductVersionTimeline from './ProductVersionTimeline';

interface ProductHistoryViewProps {
  versions: ProductVersion[];
  loading: boolean;
  hasProduct: boolean;
}

const ProductHistoryView: React.FC<ProductHistoryViewProps> = ({ versions, loading, hasProduct }) => (
  <ProductVersionTimeline versions={versions} loading={loading} hasProduct={hasProduct} />
);

export default ProductHistoryView;
