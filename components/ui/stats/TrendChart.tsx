import React from 'react';
import Box from '@/components/ui/Box';
import type { TrendChartProps, TrendSeries } from './TrendChart.impl';

export type { TrendSeries };

// Lazy-load impl (recharts ~107KB gzip) → chunk recharts KHÔNG nằm trên đường
// critical của trang; số liệu/khung vẽ trước, biểu đồ stream vào sau.
const TrendChartImpl = React.lazy(() => import('./TrendChart.impl'));

/**
 * Wrapper giữ nguyên API TrendChart. Fallback là Box đúng chiều cao/khung để
 * không gây layout shift khi recharts đang tải.
 */
const TrendChart: React.FC<TrendChartProps> = (props) => (
  <React.Suspense fallback={<Box layoutClassName={`${props.heightClassName ?? 'h-64'} w-full`} />}>
    <TrendChartImpl {...props} />
  </React.Suspense>
);

export default TrendChart;
