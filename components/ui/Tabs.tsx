import React, { useEffect, useMemo, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export interface TabsItem {
  id: string;
  label: React.ReactNode;
  disabled?: boolean;
  badge?: React.ReactNode;
}

export interface TabsProps {
  items: TabsItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ items, value, onChange, className }) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const activeIndex = useMemo(() => items.findIndex((item) => item.id === value), [items, value]);

  useEffect(() => {
    const updateIndicator = () => {
      if (activeIndex < 0) return;
      const activeButton = tabRefs.current[activeIndex];
      const container = containerRef.current;
      if (!activeButton || !container) return;

      const buttonRect = activeButton.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeIndex, items]);

  const wrapperClassName = twMerge(['w-full border-b border-slate-200 dark:border-slate-700', className ?? ''].filter(Boolean).join(' '));

  return (
    <div className={wrapperClassName}>
      <div ref={containerRef} className="relative flex gap-6">
        {items.map((item, index) => {
          const isActive = value === item.id;
          const isDisabled = Boolean(item.disabled);
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              onClick={() => !isDisabled && onChange(item.id)}
              disabled={isDisabled}
              className={`relative pb-2 text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${
                isActive
                  ? 'text-orange-500 dark:text-orange-400'
                  : isDisabled
                    ? 'cursor-not-allowed text-slate-400 dark:text-slate-500'
                    : 'text-slate-500 hover:text-orange-500 dark:text-slate-300 dark:hover:text-orange-400'
              }`}
            >
              {item.label}
              {item.badge}
            </button>
          );
        })}
        <span
          className="absolute bottom-0 h-0.5 rounded-full bg-orange-500 transition-all duration-300 ease-out dark:bg-orange-400"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`
          }}
        />
      </div>
    </div>
  );
};

export default Tabs;
