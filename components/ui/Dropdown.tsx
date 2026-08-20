/**
 * Dropdown — dropdown TUỲ BIẾN dùng chung cho toàn app (thay <select> native).
 * Panel nổi qua PORTAL (khớp bề rộng trigger), tự kẹp viewport, mở lên nếu thiếu chỗ.
 * Hỗ trợ: single / multi-select, tìm kiếm, icon + mô tả phụ, nhóm (group), bàn phím + a11y.
 *
 * Dùng single:
 *   <Dropdown value={v} onChange={setV} options={[{value:'a',label:'A'}]} />
 * Dùng multi:
 *   <Dropdown multiple value={arr} onChange={setArr} options={...} />
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  group?: string;
  disabled?: boolean;
}

type Size = 'sm' | 'md';

interface BaseProps {
  options: DropdownOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: Size;
  id?: string;
  ariaLabel?: string;
  align?: 'left' | 'right';
  /** Bề rộng panel tối thiểu (mặc định khớp trigger). */
  maxHeight?: number;
  /** Cho phép bỏ chọn (single) — hiện nút × khi đã chọn. */
  clearable?: boolean;
  // *ClassName cho trigger (theo convention UI).
  layoutClassName?: string;
  backgroundClassName?: string;
  borderClassName?: string;
  roundedClassName?: string;
  textClassName?: string;
  sizeClassName?: string;
  containerClassName?: string;
  /** Icon trái trong trigger — tự chừa padding (pl-9), KHÔNG đụng chiều cao mặc định. */
  leftIcon?: React.ReactNode;
}

type DropdownProps =
  | (BaseProps & { multiple?: false; value?: string; onChange: (value: string) => void })
  | (BaseProps & { multiple: true; value?: string[]; onChange: (value: string[]) => void });

const sizeClasses: Record<Size, string> = { sm: 'py-1.5 text-sm', md: 'py-2 text-sm' };

/** Bỏ dấu + lowercase để tìm kiếm không phân biệt hoa/thường/dấu. */
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

const Dropdown: React.FC<DropdownProps> = (props) => {
  const {
    options, placeholder = '— Chọn —', searchable = false, searchPlaceholder = 'Tìm…',
    disabled = false, error = false, size = 'md', id, ariaLabel, align = 'left',
    maxHeight = 280, clearable = false,
    layoutClassName, backgroundClassName, borderClassName, roundedClassName, textClassName,
    sizeClassName, containerClassName, leftIcon,
  } = props;
  const multiple = props.multiple === true;
  const selected: string[] = multiple
    ? (Array.isArray(props.value) ? props.value : [])
    : (props.value ? [props.value as string] : []);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);
  // top HOẶC bottom (neo đáy khi lật lên) — dùng bottom để panel ngắn không bị nổi cao khỏi trigger.
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number; height: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = norm(search.trim());
    return options.filter((o) => norm(o.label).includes(q) || (o.description ? norm(o.description).includes(q) : false));
  }, [options, search, searchable]);

  // Danh sách "chọn được" (bỏ disabled) để điều hướng bàn phím.
  const navigable = useMemo(() => filtered.filter((o) => !o.disabled), [filtered]);

  // Nhóm theo group (giữ thứ tự xuất hiện). undefined group → khoá rỗng.
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, DropdownOption[]>();
    for (const o of filtered) {
      const g = o.group ?? '';
      if (!map.has(g)) { map.set(g, []); order.push(g); }
      map.get(g)!.push(o);
    }
    return order.map((g) => ({ group: g, items: map.get(g)! }));
  }, [filtered]);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = r.width;
    let left = align === 'right' ? r.right - width : r.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    // Chỗ trống thực bên dưới / bên trên trigger (chừa 8px mép).
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const spaceAbove = r.top - 8;
    // Lật lên chỉ khi dưới thiếu chỗ MÀ trên rộng hơn. Neo ĐÁY panel sát trigger (bottom)
    // để panel ngắn (ít mục) không nổi lơ lửng cách trigger cả trăm px.
    if (spaceBelow < Math.min(maxHeight, 200) && spaceAbove > spaceBelow) {
      setPos({ bottom: window.innerHeight - r.top + 4, left, width, height: Math.min(maxHeight, spaceAbove) });
    } else {
      setPos({ top: r.bottom + 4, left, width, height: Math.min(maxHeight, spaceBelow) });
    }
  }, [align, maxHeight]);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const reflow = () => place();
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', reflow);
    window.addEventListener('scroll', reflow, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', reflow);
      window.removeEventListener('scroll', reflow, true);
    };
  }, [open, place]);

  // Mở panel → reset search, focus ô tìm kiếm, set active theo mục đã chọn.
  useEffect(() => {
    if (!open) { setSearch(''); setActiveIdx(-1); return; }
    const firstSelected = navigable.findIndex((o) => selected.includes(o.value));
    setActiveIdx(firstSelected >= 0 ? firstSelected : (navigable.length > 0 ? 0 : -1));
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commit = (value: string) => {
    if (multiple) {
      const set = new Set(selected);
      if (set.has(value)) set.delete(value); else set.add(value);
      (props.onChange as (v: string[]) => void)(Array.from(set));
    } else {
      (props.onChange as (v: string) => void)(value);
      setOpen(false);
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) (props.onChange as (v: string[]) => void)([]);
    else (props.onChange as (v: string) => void)('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(navigable.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = navigable[activeIdx];
      if (opt) commit(opt.value);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const triggerLabel = useMemo(() => {
    if (selected.length === 0) return null;
    if (!multiple) return options.find((o) => o.value === selected[0])?.label ?? selected[0];
    if (selected.length === 1) return options.find((o) => o.value === selected[0])?.label ?? selected[0];
    return `Đã chọn ${selected.length}`;
  }, [selected, options, multiple]);

  const hasValue = selected.length > 0;

  const triggerCls = [
    'group relative flex w-full min-w-0 box-border items-center gap-2 pl-3 pr-9 outline-none transition-colors focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
    roundedClassName ?? 'rounded-lg',
    borderClassName ?? (error ? 'border border-red-500 dark:border-red-500' : 'border border-slate-200 dark:border-slate-600'),
    backgroundClassName ?? 'bg-slate-50 dark:bg-slate-700',
    textClassName ?? 'text-slate-900 dark:text-white',
    sizeClassName ?? sizeClasses[size],
    leftIcon ? 'pl-9' : '',
    layoutClassName ?? '',
  ].filter(Boolean).join(' ');

  const panel = open && pos
    ? createPortal(
        <div
          ref={panelRef}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          style={{
            position: 'fixed',
            left: pos.left,
            width: pos.width,
            maxHeight: pos.height,
            ...(pos.top != null ? { top: pos.top } : { bottom: pos.bottom }),
          }}
          className="z-[130] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {searchable ? (
            <div className="flex items-center gap-2 border-b border-slate-100 px-2.5 py-2 dark:border-slate-700">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveIdx(0); }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {navigable.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">Không có kết quả</div>
            ) : (
              groups.map(({ group, items }) => (
                <div key={group || '_'}>
                  {group ? (
                    <div className="px-2.5 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {group}
                    </div>
                  ) : null}
                  {items.map((o) => {
                    const isSel = selected.includes(o.value);
                    const navIdx = navigable.findIndex((n) => n.value === o.value);
                    const isActive = navIdx === activeIdx;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        disabled={o.disabled}
                        onClick={() => !o.disabled && commit(o.value)}
                        onMouseEnter={() => navIdx >= 0 && setActiveIdx(navIdx)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          isActive ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                        } ${isSel ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        {o.icon ? <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">{o.icon}</span> : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{o.label}</span>
                          {o.description ? (
                            <span className="block truncate text-xs text-slate-400 dark:text-slate-500">{o.description}</span>
                          ) : null}
                        </span>
                        {isSel ? <Check className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" /> : null}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={`relative w-full min-w-0 ${containerClassName ?? ''}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={triggerCls}
      >
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-slate-400 [&_svg]:h-4 [&_svg]:w-4">
            {leftIcon}
          </span>
        ) : null}
        <span className={`block min-w-0 flex-1 truncate text-left ${hasValue ? '' : 'text-slate-400 dark:text-slate-500'}`}>
          {triggerLabel ?? placeholder}
        </span>
        {clearable && hasValue ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Xoá chọn"
            onClick={clear}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {panel}
    </div>
  );
};

export default Dropdown;
