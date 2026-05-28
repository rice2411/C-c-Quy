/**
 * ProductHistoryView — hiển thị danh sách lịch sử chỉnh sửa product.
 */
import React from 'react';
import { Loader2 } from 'lucide-react';
import type { ProductVersion } from '@/types';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

interface ProductHistoryViewProps {
  versions: ProductVersion[];
  loading: boolean;
  hasProduct: boolean;
}

const ProductHistoryView: React.FC<ProductHistoryViewProps> = ({ versions, loading, hasProduct }) => {
  if (!hasProduct) {
    return <Typography size="sm" variant="muted">Lưu sản phẩm trước khi xem lịch sử.</Typography>;
  }
  if (loading) {
    return (
      <Typography size="sm" variant="muted" layoutClassName="inline-flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tải lịch sử...
      </Typography>
    );
  }
  if (versions.length === 0) {
    return <Typography size="sm" variant="muted">Chưa có bản ghi lịch sử chỉnh sửa.</Typography>;
  }
  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <Card key={version.id} padding="sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {version.editedAt
              ? new Date(version.editedAt).toLocaleString('vi-VN')
              : 'Không rõ thời gian'}
          </div>
          <pre className="rounded bg-slate-900 p-2 font-mono text-xs text-slate-100 whitespace-pre-wrap">
            {JSON.stringify(version.changes || {}, null, 2)}
          </pre>
        </Card>
      ))}
    </div>
  );
};

export default ProductHistoryView;
