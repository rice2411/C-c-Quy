/**
 * HistoryTab — lịch sử chỉnh sửa sản phẩm (trong ProductDetailPage).
 * Wrapper mỏng: Card + tiêu đề, nội dung timeline dùng ProductVersionTimeline.
 */
import React from 'react';
import type { ProductVersion } from '@/types';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import ProductVersionTimeline from '../components/ProductVersionTimeline';

interface HistoryTabProps {
  versions: ProductVersion[];
  loading: boolean;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ versions, loading }) => (
  <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
    <Heading level={3} textClassName="text-sm font-bold uppercase tracking-wider">
      Lịch sử chỉnh sửa
    </Heading>
    <ProductVersionTimeline versions={versions} loading={loading} />
  </Card>
);

export default HistoryTab;
