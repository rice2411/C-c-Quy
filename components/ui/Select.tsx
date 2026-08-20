/**
 * Select — GIỮ API cũ (children <option>, onChange(e.target.value)) nhưng render bằng
 * Dropdown TUỲ BIẾN (thay <select> native). Mọi call-site cũ không phải đổi gì.
 * Tự bật ô tìm kiếm khi danh sách dài (>8 mục). Cần multi-select / icon / group →
 * dùng thẳng component Dropdown.
 */
import React from 'react';
import Dropdown, { type DropdownOption } from './Dropdown';

type SelectSize = 'sm' | 'md';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize;
  error?: boolean;
  fullWidth?: boolean;
  /** Ép bật/tắt ô tìm kiếm (mặc định tự bật khi >8 mục). */
  searchable?: boolean;
  layoutClassName?: string;
  backgroundClassName?: string;
  borderClassName?: string;
  focusClassName?: string;
  sizeClassName?: string;
  stateClassName?: string;
  textClassName?: string;
  /** Icon trái trong ô — tự chừa padding, không đổi chiều cao (thay cho absolute icon + pl-9). */
  leftIcon?: React.ReactNode;
}

/** Ghép mọi con của <option> thành 1 chuỗi label. */
const flattenText = (c: React.ReactNode): string => {
  if (c == null || c === false || c === true) return '';
  if (typeof c === 'string' || typeof c === 'number') return String(c);
  if (Array.isArray(c)) return c.map(flattenText).join('');
  return '';
};

/** Parse children <option>/<optgroup> → mảng DropdownOption. */
const parseOptions = (children: React.ReactNode): DropdownOption[] => {
  const out: DropdownOption[] = [];
  const pushOption = (el: React.ReactElement, group?: string) => {
    const p: any = el.props;
    const label = flattenText(p.children);
    out.push({
      value: p.value !== undefined ? String(p.value) : label,
      label,
      group,
      disabled: !!p.disabled,
    });
  };
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === 'option') pushOption(child);
    else if (child.type === 'optgroup') {
      const g = (child.props as any).label as string | undefined;
      React.Children.forEach((child.props as any).children, (o) => {
        if (React.isValidElement(o) && o.type === 'option') pushOption(o, g);
      });
    }
  });
  return out;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>((props, _ref) => {
  const {
    size, error, fullWidth: _fullWidth, searchable, className: _className,
    layoutClassName, backgroundClassName, borderClassName, focusClassName: _focus,
    sizeClassName, stateClassName: _state, textClassName, leftIcon,
    children, value, onChange, disabled, id, 'aria-label': ariaLabel,
  } = props;

  const options = React.useMemo(() => parseOptions(children), [children]);

  const handleChange = (v: string) => {
    // Giả lập event native để call-site `onChange={(e)=>e.target.value}` chạy y như cũ.
    onChange?.({ target: { value: v }, currentTarget: { value: v } } as any);
  };

  return (
    <Dropdown
      options={options}
      value={value != null ? String(value) : ''}
      onChange={handleChange}
      disabled={disabled}
      id={id}
      ariaLabel={typeof ariaLabel === 'string' ? ariaLabel : undefined}
      error={error}
      size={size}
      searchable={searchable ?? options.length > 8}
      layoutClassName={layoutClassName}
      backgroundClassName={backgroundClassName}
      borderClassName={borderClassName}
      textClassName={textClassName}
      sizeClassName={sizeClassName}
      leftIcon={leftIcon}
    />
  );
});

Select.displayName = 'Select';

export default Select;
