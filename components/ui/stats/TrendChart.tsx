import React from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Box from '@/components/ui/Box';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface TrendChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: TrendSeries[];
  type?: 'area' | 'line';
  isDarkMode?: boolean;
  formatValue: (v: number) => string;
  /** Chiều cao khung (Tailwind h-*). Mặc định h-64. */
  heightClassName?: string;
  /** Hiện chấm điểm (area 1 series). */
  showDots?: boolean;
}

/**
 * Biểu đồ xu hướng dùng chung — Area/Line 1–2 series, lưới + trục gọn (compact),
 * tooltip theo theme. Gom AreaChart doanh thu, Area revenue/profit, Line P&L...
 */
const TrendChart: React.FC<TrendChartProps> = ({
  data,
  xKey,
  series,
  type = 'area',
  isDarkMode = false,
  formatValue,
  heightClassName = 'h-64',
  showDots = false,
}) => {
  const axisTick = { fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 };
  const grid = isDarkMode ? '#334155' : '#f1f5f9';
  const labelByKey = new Map(series.map((s) => [s.key, s.label]));
  const tooltip = (
    <Tooltip
      formatter={(value: number, name: string) => [formatValue(value), labelByKey.get(name) ?? name]}
      contentStyle={{
        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
        borderRadius: 8,
        border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      }}
      itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600 }}
      labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
    />
  );
  const margin = { top: 10, right: 10, left: -20, bottom: 0 };
  const yFmt = (v: number) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v);

  return (
    <Box layoutClassName={`${heightClassName} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={data} margin={margin}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`trend-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={axisTick} dy={8} minTickGap={24} />
            <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={yFmt} />
            {tooltip}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#trend-${s.key})`}
                dot={showDots ? { r: 3, fill: s.color, strokeWidth: 2, stroke: isDarkMode ? '#1e293b' : '#fff' } : false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={axisTick} dy={8} minTickGap={24} />
            <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={yFmt} />
            {tooltip}
            {series.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={showDots} activeDot={{ r: 5, strokeWidth: 0 }} />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

export default TrendChart;
