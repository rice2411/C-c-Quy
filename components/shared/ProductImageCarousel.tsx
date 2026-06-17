import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';

interface ProductImageCarouselProps {
  /** Ảnh chính (primary). Có thể rỗng nếu chỉ có gallery. */
  primary?: string;
  /** Ảnh phụ */
  gallery?: string[];
  /** Tên sản phẩm dùng làm alt */
  alt?: string;
  /** Aspect class: 'aspect-square' (default) | 'aspect-[4/3]' | 'aspect-video' */
  aspectClass?: string;
  /** Class extra cho container ngoài */
  className?: string;
  /** Cho phép mở lightbox khi click ảnh */
  enableLightbox?: boolean;
  /** Hiển thị thumbnail strip phía dưới */
  showThumbnails?: boolean;
  /** Tự động chuyển ảnh */
  autoPlayMs?: number;
}

/**
 * Carousel hiển thị nhiều ảnh sản phẩm.
 * - Ảnh đầu tiên = `primary`, các ảnh sau = `gallery`.
 * - Có nút prev/next, indicator dots, optional thumbnails, optional lightbox.
 */
const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  primary,
  gallery = [],
  alt = 'Product',
  aspectClass = 'aspect-square',
  className = '',
  enableLightbox = false,
  showThumbnails = true,
  autoPlayMs,
}) => {
  const images = useMemo(() => {
    const all = [primary, ...gallery].filter((v): v is string => !!v && v.trim() !== '');
    return all;
  }, [primary, gallery]);

  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Reset khi danh sách thay đổi
  useEffect(() => {
    setIndex(0);
  }, [images.length, primary]);

  // Autoplay
  useEffect(() => {
    if (!autoPlayMs || images.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, autoPlayMs);
    return () => window.clearInterval(id);
  }, [autoPlayMs, images.length]);

  // Phím tắt cho lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, images.length]);

  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };
  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };

  if (images.length === 0) {
    return (
      <div
        className={`${aspectClass} ${className} flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800`}
      >
        <ImageIcon className="h-16 w-16 text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  const currentSrc = images[index];

  return (
    <>
      <div className={`relative ${aspectClass} ${className} overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900`}>
        <img
          src={currentSrc}
          alt={alt}
          className={`h-full w-full object-cover ${enableLightbox ? 'cursor-zoom-in' : ''}`}
          onClick={() => enableLightbox && setLightboxOpen(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image';
          }}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Ảnh trước"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-80 transition-opacity hover:opacity-100 backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Ảnh kế"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-80 transition-opacity hover:opacity-100 backdrop-blur-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  aria-label={`Ảnh ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {index + 1}/{images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails strip */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === index
                  ? 'border-primary-500 ring-2 ring-primary-500/30'
                  : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={src} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-primary-500 py-0.5 text-center text-[8px] font-bold uppercase text-white">
                  Chính
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {enableLightbox && lightboxOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
        >
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          <img
            src={currentSrc}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Ảnh trước"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Ảnh kế"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {index + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ProductImageCarousel;
