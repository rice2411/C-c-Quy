import React from 'react';
import { twMerge } from 'tailwind-merge';

type TypographySize = 'inherit' | 'xs' | 'sm' | 'base' | 'lg' | 'xl';
type TypographyTone = 'default' | 'muted' | 'strong';
type TypographyVariant = 'primary' | 'secondary' | 'muted' | 'danger' | 'success';
type TypographyRounded = 'none' | 'sm' | 'md' | 'full';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  size?: TypographySize;
  variant?: TypographyVariant;
  rounded?: TypographyRounded;
  tone?: TypographyTone;
  as?: 'p' | 'span' | 'div';
  layoutClassName?: string;
  sizeClassName?: string;
  textClassName?: string;
  backgroundClassName?: string;
  borderClassName?: string;
  roundedClassName?: string;
  shadowClassName?: string;
  stateClassName?: string;
  hoverClassName?: string;
  focusClassName?: string;
}

const sizeClasses: Record<TypographySize, string> = {
  inherit: 'text-inherit',
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
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

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      size,
      variant,
      rounded = 'none',
      tone,
      as = 'p',
      layoutClassName,
      sizeClassName,
      textClassName,
      backgroundClassName,
      borderClassName,
      roundedClassName,
      shadowClassName,
      stateClassName,
      hoverClassName,
      focusClassName,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedSize = size ?? (as === 'span' ? 'inherit' : 'base');
    const resolvedColorClass = variant
      ? variantClasses[variant]
      : tone
        ? toneClasses[tone]
        : as === 'span'
          ? ''
          : toneClasses.default;
    const classes = twMerge(
      [
        sizeClasses[resolvedSize],
        resolvedColorClass,
        roundedClasses[rounded],
        layoutClassName ?? '',
        sizeClassName ?? '',
        textClassName ?? '',
        backgroundClassName ?? '',
        borderClassName ?? '',
        roundedClassName ?? '',
        shadowClassName ?? '',
        stateClassName ?? '',
        hoverClassName ?? '',
        focusClassName ?? '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );
    const Tag = as as React.ElementType;
    return (
      <Tag ref={ref} className={classes} {...props}>
        {children}
      </Tag>
    );
  }
);

Typography.displayName = 'Typography';

export default Typography;
