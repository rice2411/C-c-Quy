/**
 * GallerySection — phần upload + quản lý ảnh phụ (gallery) của sản phẩm.
 */
import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Plus, Star, X as XIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';

import Heading from '@/components/ui/Heading';
interface GallerySectionProps {
  image: string;
  gallery: string[];
  uploading: boolean;
  maxImages?: number;
  onChange: (gallery: string[]) => void;
  onSetPrimary: (idx: number) => void;
  onUploadFiles: (files: FileList) => void;
}

const GallerySection: React.FC<GallerySectionProps> = ({
  image, gallery, uploading, maxImages = 20, onChange, onSetPrimary, onUploadFiles,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const totalImages = gallery.length + (image ? 1 : 0);

  const removeAt = (idx: number) => onChange(gallery.filter((_, i) => i !== idx));
  const moveAt = (idx: number, dir: -1 | 1) => {
    const next = [...gallery];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <Card padding="md" layoutClassName="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={3} textClassName="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">Gallery</Heading>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ảnh phụ (góc chụp, chi tiết) — tối đa {maxImages} ảnh
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {totalImages}/{maxImages}
        </span>
      </div>

      <input
        type="file"
        ref={inputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onUploadFiles(e.target.files);
            e.target.value = '';
          }
        }}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {/* Ảnh chính — cũng nằm trong gallery (tile #1, đánh dấu). Thay ở nút "Upload ảnh chính". */}
        {image && (
          <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-amber-400 dark:border-amber-500 bg-slate-50 dark:bg-slate-900">
            <img
              src={image}
              alt="Ảnh chính"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Err'; }}
            />
            <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              <Star className="h-2.5 w-2.5 fill-current" /> Ảnh chính
            </span>
          </div>
        )}
        {gallery.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          >
            <img
              src={src}
              alt={`Gallery ${idx + 1}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Err';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <IconButton
                label="Đặt làm ảnh chính"
                size="sm"
                onClick={() => onSetPrimary(idx)}
                backgroundClassName="bg-amber-500 hover:bg-amber-600"
                textClassName="text-white"
                shadowClassName="shadow-md"
              >
                <Star className="h-3 w-3" />
              </IconButton>
              <IconButton
                label="Di chuyển trái"
                size="sm"
                disabled={idx === 0}
                onClick={() => moveAt(idx, -1)}
                backgroundClassName="bg-white/90 hover:bg-white"
                textClassName="text-slate-700"
                shadowClassName="shadow-md"
              >
                <ArrowLeft className="h-3 w-3" />
              </IconButton>
              <IconButton
                label="Di chuyển phải"
                size="sm"
                disabled={idx === gallery.length - 1}
                onClick={() => moveAt(idx, 1)}
                backgroundClassName="bg-white/90 hover:bg-white"
                textClassName="text-slate-700"
                shadowClassName="shadow-md"
              >
                <ArrowRight className="h-3 w-3" />
              </IconButton>
              <IconButton
                label="Xoá"
                size="sm"
                variant="danger"
                onClick={() => removeAt(idx)}
                backgroundClassName="bg-red-500 hover:bg-red-600"
                textClassName="text-white"
                shadowClassName="shadow-md"
              >
                <XIcon className="h-3 w-3" />
              </IconButton>
            </div>
            <span className="absolute top-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
              #{idx + 2}
            </span>
          </div>
        ))}

        {totalImages < maxImages && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            layoutClassName="flex aspect-square items-center justify-center"
            roundedClassName="rounded-lg"
            borderClassName="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-400"
            backgroundClassName="bg-transparent"
            textClassName="text-slate-400 dark:text-slate-500 hover:text-primary-500"
            stateClassName="transition-colors disabled:opacity-50"
            disableVariantHover
            disableVariantTextColor
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <span className="flex flex-col items-center gap-1">
                <Plus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Thêm ảnh</span>
              </span>
            )}
          </Button>
        )}
      </div>

      {gallery.length === 0 && !uploading && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          Chưa có ảnh phụ. Khách hàng sẽ thấy thêm góc chụp khi xem chi tiết sản phẩm.
        </p>
      )}
    </Card>
  );
};

export default GallerySection;
