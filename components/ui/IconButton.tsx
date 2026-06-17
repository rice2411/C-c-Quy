import React from 'react';
import { twMerge } from 'tailwind-merge';

type IconButtonVariant = 'ghost' | 'secondary' | 'danger';
type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  label: string;
  baseClassName?: string;
  layoutClassName?: string;
  sizeClassName?: string;
  backgroundClassName?: string;
  textClassName?: string;
  roundedClassName?: string;
  shadowClassName?: string;
  stateClassName?: string;
  hoverClassName?: string;
  borderClassName?: string;
  focusClassName?: string;
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost:
    'border border-transparent bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:ring-primary-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200',
  secondary:
    'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
  danger:
    'border border-transparent bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30'
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10'
};

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'sm',
      label,
      baseClassName,
      layoutClassName,
      sizeClassName,
      backgroundClassName,
      textClassName,
      roundedClassName,
      shadowClassName,
      stateClassName,
      hoverClassName,
      borderClassName,
      focusClassName,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const classes = twMerge(
      [
        'inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        baseClassName ?? '',
        layoutClassName ?? '',
        sizeClassName ?? '',
        backgroundClassName ?? '',
        textClassName ?? '',
        roundedClassName ?? '',
        shadowClassName ?? '',
        stateClassName ?? '',
        hoverClassName ?? '',
        borderClassName ?? '',
        focusClassName ?? '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );

    return (
      <button ref={ref} type={type} aria-label={label} title={label} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
