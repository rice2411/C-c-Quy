import React from 'react';
import { twMerge } from 'tailwind-merge';

type SelectSize = 'sm' | 'md';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  size?: SelectSize;
  error?: boolean;
  fullWidth?: boolean;
  backgroundClassName?: string;
  borderClassName?: string;
  focusClassName?: string;
  sizeClassName?: string;
  stateClassName?: string;
  textClassName?: string;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: 'py-1.5 text-sm',
  md: 'py-2 text-sm'
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      error = false,
      fullWidth = false,
      className,
      children,
      backgroundClassName,
      borderClassName,
      focusClassName,
      sizeClassName,
      stateClassName,
      textClassName,
      ...props
    },
    ref
  ) => {
    const classes = twMerge(
      [
        'rounded-lg border bg-white px-4 text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-orange-500 dark:bg-slate-800 dark:text-white',
        error ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-slate-700',
        sizeClasses[size],
        borderClassName ?? '',
        focusClassName ?? '',
        backgroundClassName ?? '',
        textClassName ?? '',
        stateClassName ?? '',
        sizeClassName ?? '',
        fullWidth ? 'w-full' : '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );

    return (
      <select ref={ref} className={classes} {...props}>
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select;
