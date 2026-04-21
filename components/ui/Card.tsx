import React from 'react';
import { twMerge } from 'tailwind-merge';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  layoutClassName?: string;
  backgroundClassName?: string;
  borderClassName?: string;
  roundedClassName?: string;
  shadowClassName?: string;
  stateClassName?: string;
  hoverClassName?: string;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      padding = 'md',
      layoutClassName,
      backgroundClassName,
      borderClassName,
      roundedClassName,
      shadowClassName,
      stateClassName,
      hoverClassName,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const classes = twMerge(
      [
        'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800',
        paddingClasses[padding],
        layoutClassName ?? '',
        backgroundClassName ?? '',
        borderClassName ?? '',
        roundedClassName ?? '',
        shadowClassName ?? '',
        stateClassName ?? '',
        hoverClassName ?? '',
        className ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
