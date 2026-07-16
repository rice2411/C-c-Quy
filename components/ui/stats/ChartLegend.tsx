import React from 'react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

export interface ChartLegendItem {
  label: string;
  color: string;
  /** Giá trị đã format sẵn (vd formatVND). Bỏ trống → chỉ hiện màu + nhãn. */
  value?: React.ReactNode;
  /** % nguyên (0..100) → hiện "(n%)" mờ cạnh giá trị. */
  percent?: number;
  /** Làm mờ dòng (vd giá trị = 0 nhưng vẫn liệt kê). */
  dim?: boolean;
}

interface ChartLegendProps {
  items: ChartLegendItem[];
  /** Hình đánh dấu màu: chấm tròn (donut) hoặc ô vuông (pie/breakdown). */
  marker?: 'dot' | 'square';
  className?: string;
}

/**
 * Legend dùng chung cho donut/pie/breakdown: mỗi dòng = màu + nhãn (trái) …
 * giá trị (+% tuỳ chọn) (phải). Gom 5 bản legend lặp ở Dashboard/Expenses/Giao dịch.
 */
const ChartLegend: React.FC<ChartLegendProps> = ({ items, marker = 'dot', className }) => (
  <Box layoutClassName={`space-y-1.5 ${className ?? ''}`}>
    {items.map((it, i) => (
      <Box
        key={`${it.label}-${i}`}
        layoutClassName="flex items-center justify-between gap-2"
        stateClassName={it.dim ? 'opacity-40' : ''}>
        <Box layoutClassName="flex min-w-0 items-center gap-2">
          <Box
            layoutClassName="h-2.5 w-2.5 shrink-0"
            roundedClassName={marker === 'dot' ? 'rounded-full' : 'rounded-sm'}
            style={{ backgroundColor: it.color }} />
          <Typography as="span" size="sm" layoutClassName="min-w-0 truncate" textClassName="text-slate-600 dark:text-slate-300">
            {it.label}
          </Typography>
        </Box>
        {it.value != null ? (
          <Typography as="span" size="sm" layoutClassName="shrink-0 font-semibold tabular-nums" textClassName="text-slate-900 dark:text-white">
            {it.value}
            {it.percent != null ? (
              <Typography as="span" size="xs" variant="muted"> ({it.percent}%)</Typography>
            ) : null}
          </Typography>
        ) : null}
      </Box>
    ))}
  </Box>
);

export default ChartLegend;
