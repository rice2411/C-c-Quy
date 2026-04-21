import React from 'react';
import { twMerge } from 'tailwind-merge';

type AvatarImageSize = 'sm' | 'md' | 'lg';

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: AvatarImageSize;
  fallback?: React.ReactNode;
  containerClassName?: string;
  borderClassName?: string;
}

const sizeClasses: Record<AvatarImageSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12'
};

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ size = 'md', fallback, containerClassName, className, src, alt, borderClassName, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);
    const showImage = Boolean(src) && !hasError;

    const containerClasses = twMerge(
      [
        'overflow-hidden rounded-full border border-slate-200 bg-orange-100 dark:border-slate-500 dark:bg-slate-600 flex items-center justify-center flex-shrink-0',
        sizeClasses[size],
        borderClassName ?? '',
        containerClassName ?? ''
      ]
        .filter(Boolean)
        .join(' ')
    );

    const imageClasses = twMerge(['h-full w-full object-cover', className ?? ''].filter(Boolean).join(' '));

    return (
      <div className={containerClasses}>
        {showImage ? (
          <img ref={ref} src={src} alt={alt} className={imageClasses} onError={() => setHasError(true)} {...props} />
        ) : (
          fallback
        )}
      </div>
    );
  }
);

AvatarImage.displayName = 'AvatarImage';

export default AvatarImage;
