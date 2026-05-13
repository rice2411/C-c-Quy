import React from 'react';
import { twMerge } from 'tailwind-merge';

type TextareaSize = 'sm' | 'md';
type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
  error?: boolean;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
  leftIconClassName?: string;
  borderClassName?: string;
  focusClassName?: string;
  resize?: TextareaResize;
}

const sizeClasses: Record<TextareaSize, string> = {
  sm: 'py-1.5 text-sm',
  md: 'py-2 text-sm'
};

const resizeClasses: Record<TextareaResize, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize'
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      error = false,
      leftIcon,
      resize,
      className,
      containerClassName,
      leftIconClassName,
      borderClassName,
      focusClassName,
      ...props
    },
    ref
  ) => {
    const classes = twMerge(
      [
        // `min-w-0 box-border` cần thiết để textarea không tràn ra ngoài container
        // trên mobile (textarea có default cols=20 → intrinsic min-width).
        'block w-full min-w-0 box-border max-w-full rounded-lg border bg-slate-50 text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:text-white',
        error ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-slate-600',
        leftIcon ? 'pl-9 pr-3' : 'px-3',
        sizeClasses[size],
        resize ? resizeClasses[resize] : '',
        borderClassName ?? '',
        focusClassName ?? '',
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
              ['pointer-events-none absolute left-3 top-2.5 text-slate-400', leftIconClassName ?? ''].filter(Boolean).join(' ')
            )}
          >
            {leftIcon}
          </div>
        ) : null}
        <textarea ref={ref} className={classes} {...props} />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
