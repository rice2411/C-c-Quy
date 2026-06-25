/**
 * ProductVersionTimeline — timeline DỌC lịch sử chỉnh sửa sản phẩm.
 * Mỗi version = 1 mốc: thời gian (vi-VN) + list field đổi dạng
 * "Nhãn: cũ (đỏ/gạch) → mới (xanh)".
 *
 * Dùng chung cho:
 *  - tab Lịch sử trong ProductDetailPage (HistoryTab)
 *  - tab Lịch sử trong modal ProductForm (ProductHistoryView, có prop hasProduct)
 */
import React from 'react';
import { Clock, History } from 'lucide-react';
import type { ProductVersion } from '@/types';
import { diffProductVersion, formatEditedAt } from '@/utils/product/productHistoryDiff';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

interface ProductVersionTimelineProps {
  versions: ProductVersion[];
  loading: boolean;
  /** Khi render trong modal tạo/sửa: false nếu sản phẩm chưa được lưu. */
  hasProduct?: boolean;
}

const ProductVersionTimeline: React.FC<ProductVersionTimelineProps> = ({
  versions,
  loading,
  hasProduct = true,
}) => {
  if (!hasProduct) {
    return (
      <EmptyState
        icon={<History className="h-6 w-6" />}
        title="Lưu sản phẩm trước khi xem lịch sử"
      />
    );
  }

  if (loading) {
    return (
      <Box layoutClassName="flex items-center justify-center gap-2 py-6">
        <Spinner size="md" />
        <Typography size="sm" variant="muted">Đang tải lịch sử...</Typography>
      </Box>
    );
  }

  // Tính diff trước + bỏ qua version không còn field nào đổi (BE ghi cả field không đổi).
  const visibleVersions = versions
    .map((version) => ({ version, changes: diffProductVersion(version) }))
    .filter((v) => v.changes.length > 0);

  if (versions.length === 0 || visibleVersions.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-6 w-6" />}
        title="Chưa có lịch sử chỉnh sửa"
      />
    );
  }

  return (
    <Box
      layoutClassName="relative space-y-5 pl-5"
      borderClassName="border-l-2 border-slate-200 dark:border-slate-700"
    >
      {visibleVersions.map(({ version, changes }) => {
        return (
          <Box key={version.id} layoutClassName="relative">
            {/* Dot mốc thời gian */}
            <Box
              layoutClassName="absolute -left-[27px] top-1 h-4 w-4 rounded-full ring-2"
              backgroundClassName="bg-primary-500"
              borderClassName="border-2 border-white dark:border-slate-800"
              textClassName="ring-primary-100 dark:ring-primary-900/40"
            />
            <Box layoutClassName="flex flex-wrap items-center gap-2">
              <Typography
                size="xs"
                variant="muted"
                layoutClassName="inline-flex items-center gap-1"
              >
                <Clock className="h-3 w-3" />
                {formatEditedAt(version.editedAt)}
              </Typography>
            </Box>

            <Box layoutClassName="mt-2 space-y-1.5">
              {changes.map((c) => (
                <Box
                  key={c.field}
                  layoutClassName="flex flex-wrap items-center gap-2 rounded-md p-2"
                  backgroundClassName="bg-slate-50/70 dark:bg-slate-700/30"
                  borderClassName="border border-slate-100 dark:border-slate-700"
                >
                  <Badge
                    size="sm"
                    backgroundClassName="bg-slate-200 dark:bg-slate-600"
                    textClassName="font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {c.label}
                  </Badge>
                  <Typography
                    as="span"
                    size="xs"
                    layoutClassName="break-all line-through"
                    textClassName="text-rose-500 dark:text-rose-400"
                  >
                    {c.before}
                  </Typography>
                  <Typography as="span" size="xs" variant="muted" aria-hidden="true">
                    →
                  </Typography>
                  <Typography
                    as="span"
                    size="xs"
                    layoutClassName="break-all font-semibold"
                    textClassName="text-emerald-600 dark:text-emerald-400"
                  >
                    {c.after}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default ProductVersionTimeline;
