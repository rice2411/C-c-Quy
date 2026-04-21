import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  layoutClassName?: string;
  backgroundClassName?: string;
  borderClassName?: string;
  roundedClassName?: string;
  shadowClassName?: string;
  stateClassName?: string;
  hoverClassName?: string;
  textClassName?: string;
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  (
    {
      layoutClassName,
      backgroundClassName,
      borderClassName,
      roundedClassName,
      shadowClassName,
      stateClassName,
      hoverClassName,
      textClassName,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const classes = twMerge(
      [
        layoutClassName ?? '',
        backgroundClassName ?? '',
        borderClassName ?? '',
        roundedClassName ?? '',
        shadowClassName ?? '',
        stateClassName ?? '',
        hoverClassName ?? '',
        textClassName ?? '',
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

Box.displayName = 'Box';

export default Box;
