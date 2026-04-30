import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  trackClassName?: string;
  thumbClassName?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled,
      className,
      trackClassName,
      thumbClassName,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || disabled) {
        return;
      }
      onCheckedChange(!checked);
    };

    const trackClasses = twMerge(
      [
        'relative inline-flex h-6 w-11 items-center rounded-full p-0 transition-colors',
        checked ? 'bg-orange-600' : 'bg-slate-300 dark:bg-slate-600',
        'disabled:cursor-not-allowed disabled:opacity-50',
        trackClassName ?? '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')
    );

    const thumbClasses = twMerge(
      [
        'absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0',
        thumbClassName ?? '',
      ]
        .filter(Boolean)
        .join(' ')
    );

    return (
      <button
        {...props}
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={trackClasses}
      >
        <span className={thumbClasses} />
      </button>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
