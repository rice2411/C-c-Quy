import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  layoutClassName?: string;
  borderClassName?: string;
  roundedClassName?: string;
  /** Tắt hiệu ứng mờ dần khi ảnh tải xong (mặc định bật). */
  disableFade?: boolean;
}

/**
 * `<img>` tối ưu: mặc định lazy-load (không tải ảnh ngoài viewport) + decode bất
 * đồng bộ + mờ dần khi tải xong. Xử lý cả ảnh đã cache (img.complete) để không bị
 * kẹt ở opacity-0, và ảnh lỗi (onError) để không vô hình mãi.
 */
const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ layoutClassName, borderClassName, roundedClassName, className, disableFade, loading, decoding, onLoad, onError, ...props }, ref) => {
    const [loaded, setLoaded] = React.useState(false);

    // Callback ref: ảnh trong cache có thể đã complete trước khi onLoad gắn.
    const setRef = React.useCallback(
      (node: HTMLImageElement | null) => {
        if (node && node.complete) setLoaded(true);
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLImageElement | null>).current = node;
      },
      [ref],
    );

    const classes = twMerge(
      [
        !disableFade ? 'transition-opacity duration-300' : '',
        !disableFade && !loaded ? 'opacity-0' : 'opacity-100',
        layoutClassName ?? '',
        borderClassName ?? '',
        roundedClassName ?? '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' '),
    );

    return (
      <img
        ref={setRef}
        className={classes}
        loading={loading ?? 'lazy'}
        decoding={decoding ?? 'async'}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setLoaded(true);
          onError?.(e);
        }}
        {...props}
      />
    );
  },
);

Image.displayName = 'Image';

export default Image;
