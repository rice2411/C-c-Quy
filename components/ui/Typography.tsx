import React from 'react';
import { twMerge } from 'tailwind-merge';

type TypographySize = 'inherit' | 'xs' | 'sm' | 'base' | 'lg';
type TypographyTone = 'default' | 'muted' | 'strong';
type TypographyVariant = 'primary' | 'secondary' | 'muted' | 'danger' | 'success';
type TypographyRounded = 'none' | 'sm' | 'md' | 'full';

export interface TypographyProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: TypographySize;
  variant?: TypographyVariant;
  rounded?: TypographyRounded;
  tone?: TypographyTone;
  as?: 'p' | 'span';
  layoutClassName?: string;
  textClassName?: string;
  stateClassName?: string;
}

const sizeClasses: Record<TypographySize, string> = {
  inherit: 'text-inherit',
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg'
};

const toneClasses: Record<TypographyTone, string> = {
  default: 'text-slate-700 dark:text-slate-300',
  muted: 'text-slate-500 dark:text-slate-400',
  strong: 'text-slate-900 dark:text-white'
};

const variantClasses: Record<TypographyVariant, string> = {
  primary: 'text-slate-900 dark:text-white',
  secondary: 'text-slate-700 dark:text-slate-300',
  muted: 'text-slate-500 dark:text-slate-400',
  danger: 'text-red-600 dark:text-red-400',
  success: 'text-emerald-600 dark:text-emerald-400'
};

const roundedClasses: Record<TypographyRounded, string> = {
  none: '',
  sm: 'rounded px-1',
  md: 'rounded-md px-1.5 py-0.5',
  full: 'rounded-full px-2 py-0.5'
};

const Typography = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ size, variant, rounded = 'none', tone, as = 'p', layoutClassName, textClassName, stateClassName, className, children, ...props }, ref) => {
    const resolvedSize = size ?? (as === 'span' ? 'inherit' : 'base');
    const resolvedColorClass = variant
      ? variantClasses[variant]
      : tone
        ? toneClasses[tone]
        : as === 'span'
          ? ''
          : toneClasses.default;
    const classes = twMerge(
      [sizeClasses[resolvedSize], resolvedColorClass, roundedClasses[rounded], layoutClassName ?? '', textClassName ?? '', stateClassName ?? '', className ?? '']
        .filter(Boolean)
        .join(' ')
    );
    if (as === 'span') {
      return (
        <span className={classes} {...(props as React.HTMLAttributes<HTMLSpanElement>)}>
          {children}
        </span>
      );
    }
    return (
      <p ref={ref} className={classes} {...props}>
        {children}
      </p>
    );
  }
);

Typography.displayName = 'Typography';

export default Typography;
