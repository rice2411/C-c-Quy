import React from 'react';
import { ChevronDown } from 'lucide-react';
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
    // appearance-none + mũi tên tự vẽ → bỏ chrome native (padding nội bộ + arrow gốc)
    // để select KHỚP HỆT Input: cùng pl-3, cùng chiều cao, cùng nền/viền. pr-9 chừa chỗ mũi tên.
    const classes = twMerge(
      [
        'block w-full min-w-0 box-border max-w-full appearance-none rounded-lg border bg-slate-50 pl-3 pr-9 text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:text-white',
        error ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-slate-600',
        sizeClasses[size],
        borderClassName ?? '',
        focusClassName ?? '',
        backgroundClassName ?? '',
        textClassName ?? '',
        stateClassName ?? '',
        sizeClassName ?? '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );

    return (
      <div className={twMerge(['relative min-w-0', fullWidth ? 'block w-full' : 'inline-block'].join(' '))}>
        <select ref={ref} className={classes} {...props}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
