import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';

const VALUE_SIZE: Record<string, string> = { lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl' };

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Class ô icon (bg + text), vd 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'. */
  iconWrapClassName?: string;
  valueClassName?: string;
  valueSize?: 'lg' | 'xl' | '2xl';
  /** Nhãn in hoa nhỏ (kiểu MyCommission) thay vì thường. */
  labelUppercase?: boolean;
  /** Dòng dưới: delta/ghi chú (ReactNode tuỳ ý, vd <MetricDelta/>). */
  footer?: React.ReactNode;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
}

/**
 * Thẻ số liệu (KPI) dùng chung: nhãn + value + ô icon (tuỳ chọn) + footer (delta/ghi chú).
 * Clickable khi có onClick. Gom các KPI card tự chế (Dashboard/Users/MyCommission...).
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  label, value, icon: Icon, iconWrapClassName, valueClassName, valueSize = '2xl',
  labelUppercase = false, footer, onClick, padding = 'md',
}) => (
  <Card
    padding={padding}
    onClick={onClick}
    backgroundClassName="bg-white dark:bg-slate-800"
    borderClassName="border-slate-100 dark:border-slate-700"
    layoutClassName={`flex flex-col justify-between${onClick ? ' cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    stateClassName={onClick ? 'transition-all' : ''}>
    <Box layoutClassName="flex items-start justify-between gap-2">
      <Box layoutClassName="min-w-0">
        <Typography
          size={labelUppercase ? 'xs' : 'sm'}
          variant="muted"
          layoutClassName={labelUppercase ? 'font-medium uppercase tracking-wide' : 'font-medium'}>
          {label}
        </Typography>
        <Heading level={3} layoutClassName={`mt-1 ${VALUE_SIZE[valueSize]} font-bold`} textClassName={valueClassName ?? 'text-slate-900 dark:text-white'}>
          {value}
        </Heading>
      </Box>
      {Icon ? (
        <Box layoutClassName={`p-2 shrink-0 ${iconWrapClassName ?? 'bg-slate-50 text-slate-500 dark:bg-slate-900/40'}`} roundedClassName="rounded-lg">
          <Icon size={20} />
        </Box>
      ) : null}
    </Box>
    {footer != null ? <Box layoutClassName="mt-4">{footer}</Box> : null}
  </Card>
);

interface MetricDeltaProps {
  /** % thay đổi (đã là phần trăm, vd 12.3). */
  change: number;
  /** Chú thích cạnh %, vd "vs kỳ trước". */
  text?: string;
  /** Đảo màu (giảm = tốt). */
  invert?: boolean;
}

/** Dòng delta xu hướng: mũi tên + "+X.X% <text>" màu xanh/đỏ. Dùng trong footer MetricCard. */
export const MetricDelta: React.FC<MetricDeltaProps> = ({ change, text, invert = false }) => {
  const up = change >= 0;
  const good = invert ? !up : up;
  const Icon = up ? TrendingUp : TrendingDown;
  const color = good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  return (
    <Box layoutClassName="flex items-center gap-1" textClassName={color}>
      <Icon size={16} />
      <Typography as="span" size="sm" textClassName={color}>
        {up ? '+' : ''}{change.toFixed(1)}%{text ? ` ${text}` : ''}
      </Typography>
    </Box>
  );
};

export default MetricCard;
