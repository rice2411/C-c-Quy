import React from 'react';
import { twMerge } from 'tailwind-merge';

type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: BadgeSize;
  layoutClassName?: string;
  borderClassName?: string;
  backgroundClassName?: string;
  textClassName?: string;
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs'
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { size = 'md', layoutClassName, borderClassName, backgroundClassName, textClassName, className, children, ...props },
    ref
  ) => {
    const classes = twMerge(
      [
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        sizeClasses[size],
        layoutClassName ?? '',
        borderClassName ?? '',
        backgroundClassName ?? '',
        textClassName ?? '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
