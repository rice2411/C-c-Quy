import React from 'react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

interface DonutTooltipProps {
  // recharts tự inject active/payload khi truyền qua prop `content`
  active?: boolean;
  payload?: any[];
  isDarkMode: boolean;
  /** Định dạng giá trị: vd `${v} đơn` hoặc formatVND */
  formatValue: (value: number) => string;
}

/**
 * Tooltip dùng chung cho các donut: chấm màu (đúng màu lát) + nhãn + giá trị.
 * Đồng bộ style với legend cột phải.
 */
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
      shadowClassName="shadow-md"
    >
      <Box layoutClassName="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <Typography as="span" size="xs" textClassName={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
        {name}
      </Typography>
      <Typography
        as="span"
        size="xs"
        layoutClassName="font-semibold"
        textClassName={isDarkMode ? 'text-white' : 'text-slate-900'}
      >
        {formatValue(value)}
      </Typography>
    </Box>
  );
};

export default DonutTooltip;
