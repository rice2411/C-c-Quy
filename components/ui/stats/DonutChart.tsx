import React from 'react';
import Box from '@/components/ui/Box';
import type { DonutChartProps, DonutDatum } from './DonutChart.impl';

export type { DonutDatum };

// Lazy-load impl (recharts) → chunk recharts không nằm trên đường critical.
const DonutChartImpl = React.lazy(() => import('./DonutChart.impl'));

/**
 * Wrapper giữ nguyên API DonutChart. Fallback là Box đúng khung để không layout shift.
 */
const DonutChart: React.FC<DonutChartProps> = (props) => (
  <React.Suspense fallback={<Box layoutClassName={props.containerClassName ?? 'h-40 w-40 shrink-0'} />}>
    <DonutChartImpl {...props} />
  </React.Suspense>
);

export default DonutChart;
