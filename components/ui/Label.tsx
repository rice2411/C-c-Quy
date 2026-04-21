import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, children, ...props }, ref) => {
  const classes = twMerge(
    ['block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1', className ?? ''].filter(Boolean).join(' ')
  );

  return (
    <label ref={ref} className={classes} {...props}>
      {children}
    </label>
  );
});

Label.displayName = 'Label';

export default Label;
