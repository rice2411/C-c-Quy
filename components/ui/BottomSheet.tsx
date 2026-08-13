/**
 * BottomSheet — tấm trượt LÊN từ đáy màn hình (mobile action sheet), render qua PORTAL.
 * Đóng khi bấm nền tối / Esc. Có thanh kéo + tiêu đề tuỳ chọn + chừa safe-area đáy.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFadeAnimation } from '@/hooks/useFadeAnimation';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, title, children }) => {
  const { show, isAnimating } = useFadeAnimation(open, true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!show && !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-xl transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-800 ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mb-2 mt-1 h-1.5 w-10 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
        {title ? (
          <div className="px-2 pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</div>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default BottomSheet;
