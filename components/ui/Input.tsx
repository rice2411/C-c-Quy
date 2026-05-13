import React from 'react';
import { twMerge } from 'tailwind-merge';

type InputSize = 'sm' | 'md';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  leftIconClassName?: string;
  rightIconClassName?: string;
  backgroundClassName?: string;
  borderClassName?: string;
  focusClassName?: string;
  sizeClassName?: string;
  shadowClassName?: string;
  stateClassName?: string;
  textClassName?: string;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'py-1.5 text-sm',
  md: 'py-2 text-sm'
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      error = false,
      leftIcon,
      rightIcon,
      className,
      containerClassName,
      leftIconClassName,
      rightIconClassName,
      backgroundClassName,
      borderClassName,
      focusClassName,
      sizeClassName,
      shadowClassName,
      stateClassName,
      textClassName,
      ...props
    },
    ref
  ) => {
    const classes = twMerge(
      [
        // `min-w-0 box-border` cần thiết để input không tràn ra ngoài container
        // trên mobile (đặc biệt input type="date"/"time" trên iOS có intrinsic
        // min-width > parent column).
        'block w-full min-w-0 box-border max-w-full rounded-lg border bg-slate-50 text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:text-white',
        error ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-slate-600',
        leftIcon ? 'pl-9' : 'pl-3',
        rightIcon ? 'pr-9' : 'pr-3',
        sizeClasses[size],
        borderClassName ?? '',
        focusClassName ?? '',
        backgroundClassName ?? '',
        textClassName ?? '',
        shadowClassName ?? '',
        stateClassName ?? '',
        sizeClassName ?? '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );

    return (
      <div className={twMerge(['relative w-full min-w-0', containerClassName ?? ''].filter(Boolean).join(' '))}>
        {leftIcon ? (
          <div
            className={twMerge(
              ['pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400', leftIconClassName ?? '']
                .filter(Boolean)
                .join(' ')
            )}
          >
            {leftIcon}
          </div>
        ) : null}
        <input ref={ref} className={classes} {...props} />
        {rightIcon ? (
          <div
            className={twMerge(
              ['pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400', rightIconClassName ?? '']
                .filter(Boolean)
                .join(' ')
            )}
          >
            {rightIcon}
          </div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
