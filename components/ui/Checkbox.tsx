import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  borderClassName?: string;
  focusClassName?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, containerClassName, labelClassName, borderClassName, focusClassName, ...props }, ref) => {
    const inputClasses = twMerge(
      [
        'h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600',
        borderClassName ?? '',
        focusClassName ?? '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );

    if (label !== undefined) {
      const wrapperClasses = twMerge(['inline-flex items-center gap-2', containerClassName ?? ''].filter(Boolean).join(' '));
      return (
        <label className={wrapperClasses}>
          <input ref={ref} type="checkbox" className={inputClasses} {...props} />
          <span className={labelClassName}>{label}</span>
        </label>
      );
    }

    return <input ref={ref} type="checkbox" className={inputClasses} {...props} />;
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
