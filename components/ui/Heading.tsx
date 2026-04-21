import React from 'react';
import { twMerge } from 'tailwind-merge';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  layoutClassName?: string;
  textClassName?: string;
  stateClassName?: string;
}

const levelClasses: Record<HeadingLevel, string> = {
  1: 'text-4xl font-bold',
  2: 'text-3xl font-bold',
  3: 'text-2xl font-semibold',
  4: 'text-xl font-semibold',
  5: 'text-lg font-semibold',
  6: 'text-base font-semibold'
};

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, layoutClassName, textClassName, stateClassName, className, children, ...props }, ref) => {
    const classes = twMerge(
      [levelClasses[level], 'text-slate-900 dark:text-white', layoutClassName ?? '', textClassName ?? '', stateClassName ?? '', className ?? '']
        .filter(Boolean)
        .join(' ')
    );
    const tagName = `h${level}` as keyof JSX.IntrinsicElements;
    return React.createElement(tagName, { ref, className: classes, ...props }, children);
  }
);

Heading.displayName = 'Heading';

export default Heading;
