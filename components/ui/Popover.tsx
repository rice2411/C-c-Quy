/**
 * Popover — nội dung nổi neo theo 1 nút trigger, render qua PORTAL (document.body)
 * + position:fixed tính từ rect của trigger → KHÔNG bị `overflow-hidden` cha cắt / bị đè.
 * Tự kẹp trong viewport, thiếu chỗ dưới thì mở lên; đóng khi click ngoài / Esc / scroll-resize reflow.
 *
 * Dùng:
 *   <Popover trigger={<IconButton .../>}>
 *     {(close) => <Box>...</Box>}
 *   </Popover>
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Box from '@/components/ui/Box';

export interface PopoverProps {
  /** Phần tử mở popover (nút/ảnh...). Popover tự gắn toggle, KHÔNG cần onClick riêng. */
  trigger: React.ReactNode;
  /** Nội dung popover; nhận `close` để tự đóng sau khi chọn. */
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  width?: number; // px, mặc định 224 (w-56)
  maxHeight?: number; // px, mặc định 260
  align?: 'left' | 'right'; // canh mép trigger
  /** Controlled (tuỳ chọn). Bỏ trống → tự quản state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerClassName?: string; // layout wrapper trigger
  backgroundClassName?: string;
  borderClassName?: string;
  roundedClassName?: string;
  shadowClassName?: string;
  paddingClassName?: string;
  zIndexClassName?: string;
}

const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  width = 224,
  maxHeight = 260,
  align = 'left',
  open: openProp,
  onOpenChange,
  disabled,
  triggerClassName = 'relative inline-block',
  backgroundClassName = 'bg-white dark:bg-slate-800',
  borderClassName = 'border border-slate-200 dark:border-slate-700',
  roundedClassName = 'rounded-xl',
  shadowClassName = 'shadow-lg',
  paddingClassName = 'p-2',
  zIndexClassName = 'z-[120]',
}) => {
  const isControlled = openProp !== undefined;
  const [openState, setOpenState] = useState(false);
  const open = isControlled ? openProp : openState;
  const setOpen = useCallback(
    (v: boolean) => { if (!isControlled) setOpenState(v); onOpenChange?.(v); },
    [isControlled, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);

  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = align === 'right' ? r.right - width : r.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    let top = r.bottom + 4;
    if (top + maxHeight > window.innerHeight && r.top - maxHeight > 0) top = r.top - maxHeight - 4;
    setPos({ top, left });
  }, [align, width, maxHeight]);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const reflow = () => place();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', reflow);
    window.addEventListener('scroll', reflow, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', reflow);
      window.removeEventListener('scroll', reflow, true);
    };
  }, [open, place, setOpen]);

  const panel = open && pos
    ? createPortal(
        <Box
          ref={panelRef as React.RefObject<HTMLDivElement>}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width, maxHeight }}
          layoutClassName={`${zIndexClassName} overflow-y-auto ${paddingClassName}`}
          backgroundClassName={backgroundClassName}
          borderClassName={borderClassName}
          roundedClassName={roundedClassName}
          shadowClassName={shadowClassName}>
          {typeof children === 'function' ? children(close) : children}
        </Box>,
        document.body,
      )
    : null;

  return (
    <Box
      layoutClassName={triggerClassName}
      ref={triggerRef as React.RefObject<HTMLDivElement>}
      onClick={() => { if (!disabled) setOpen(!open); }}>
      {trigger}
      {panel}
    </Box>
  );
};

export default Popover;
