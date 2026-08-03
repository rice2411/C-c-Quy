import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

export interface DonutDatum {
  key?: string;
  label: string;
  value: number;
  color: string;
  // Cho phép recharts <Pie data> (yêu cầu object dạng record) nhận DonutDatum.
  [extra: string]: string | number | undefined;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: any[];
  isDarkMode: boolean;
  formatValue: (v: number) => string;
}

/** Tooltip nội bộ cho donut/pie: chấm màu + nhãn + giá trị (khớp legend). */
const DonutTooltip: React.FC<DonutTooltipProps> = ({ active, payload, isDarkMode, formatValue }) => {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const color = entry?.payload?.color ?? entry?.color ?? entry?.payload?.fill ?? '#94a3b8';
  const name = entry?.name ?? entry?.payload?.label ?? '';
  const value = typeof entry?.value === 'number' ? entry.value : 0;
  return (
    <Box
      layoutClassName="flex items-center gap-2 px-3 py-2"
      roundedClassName="rounded-lg"
      borderClassName={isDarkMode ? 'border border-slate-700' : 'border border-slate-200'}
      backgroundClassName={isDarkMode ? 'bg-slate-800' : 'bg-white'}
      shadowClassName="shadow-md">
      <Box layoutClassName="h-2.5 w-2.5 shrink-0" roundedClassName="rounded-full" style={{ backgroundColor: color }} />
      <Typography as="span" size="xs" textClassName={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>{name}</Typography>
      <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName={isDarkMode ? 'text-white' : 'text-slate-900'}>
        {formatValue(value)}
      </Typography>
    </Box>
  );
};

export interface DonutChartProps {
  data: DonutDatum[];
  formatValue: (v: number) => string;
  isDarkMode?: boolean;
  /** 0 = pie đặc; >0 = donut. Mặc định donut (42/66). */
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  /** Kích thước khung (Tailwind class h/w). Mặc định vuông 10rem. */
  containerClassName?: string;
}

/**
 * Donut/pie dùng chung: ResponsiveContainer + Pie + Cells + tooltip gộp sẵn.
 * Legend để ngoài (dùng ChartLegend) cho linh hoạt bố cục.
 *
 * (Bản impl — recharts. Được lazy-load qua ./DonutChart wrapper.)
 */
const DonutChart: React.FC<DonutChartProps> = ({
  data,
  formatValue,
  isDarkMode = false,
  innerRadius = 42,
  outerRadius = 66,
  paddingAngle = 2,
  containerClassName = 'h-40 w-40 shrink-0',
}) => (
  <Box layoutClassName={containerClassName}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={paddingAngle}>
          {data.map((d, i) => <Cell key={d.key ?? `${d.label}-${i}`} fill={d.color} />)}
        </Pie>
        <Tooltip content={<DonutTooltip isDarkMode={isDarkMode} formatValue={formatValue} />} />
      </PieChart>
    </ResponsiveContainer>
  </Box>
);

export default DonutChart;
