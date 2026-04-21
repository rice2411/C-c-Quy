import React from 'react';
import { twMerge } from 'tailwind-merge';

type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  borderClassName?: string;
  textClassName?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-[3px]'
};

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size = 'sm', borderClassName, textClassName, className, ...props }, ref) => {
    const classes = twMerge(
      [
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeClasses[size],
        borderClassName ?? '',
        textClassName ?? '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );

    return <span ref={ref} className={classes} aria-hidden="true" {...props} />;
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;
