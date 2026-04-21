import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  layoutClassName?: string;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(({ layoutClassName, className, ...props }, ref) => {
  const classes = twMerge([layoutClassName ?? '', className ?? ''].filter(Boolean).join(' '));
  return <img ref={ref} className={classes} {...props} />;
});

Image.displayName = 'Image';

export default Image;
