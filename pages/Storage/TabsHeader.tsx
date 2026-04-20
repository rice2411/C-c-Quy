import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { RouteConfig } from '@/config/routes';

interface TabsHeaderProps {
  tabs: RouteConfig[];
  activeTab: string;
  onChange: (tab: string) => void;
}

const TabsHeader: React.FC<TabsHeaderProps> = ({ tabs, activeTab, onChange }) => {
  const { t } = useLanguage();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  // Update indicator position when activeTab changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = tabs.findIndex((tab) => (tab.tabId || '') === activeTab);
      if (activeIndex < 0) return;
      const activeButton = tabsRef.current[activeIndex];
      
      if (activeButton && indicatorRef.current) {
        const buttonRect = activeButton.getBoundingClientRect();
        const containerRect = activeButton.parentElement?.getBoundingClientRect();
        
        if (containerRect) {
          const left = buttonRect.left - containerRect.left;
          const width = buttonRect.width;
          
          setIndicatorStyle({ left, width });
        }
      }
    };

    // Update immediately
    updateIndicator();

    // Also update on window resize
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  return (
    <div className="w-full border-b border-slate-200 dark:border-slate-700">
      <div className="relative flex gap-6">
        {tabs.map((tab, index) => {
          const tabId = tab.tabId || '';
          const isActive = activeTab === tabId;
          const label = t(tab.labelKey);
          const isDisabled = Boolean(tab.disabled);
          return (
            <button
              key={tabId}
              ref={(el) => {
                tabsRef.current[index] = el;
              }}
              onClick={() => !isDisabled && onChange(tabId)}
              disabled={isDisabled}
              className={`relative pb-2 text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${
                isActive
                  ? 'text-orange-500 dark:text-orange-400'
                  : isDisabled
                    ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'text-slate-500 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400'
              }`}
            >
              {label}
              {isDisabled && (
                <span className="ml-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded normal-case">
                  Bảo trì
                </span>
              )}
            </button>
          );
        })}
        {/* Animated indicator */}
        <span
          ref={indicatorRef}
          className="absolute bottom-0 h-0.5 bg-orange-500 dark:bg-orange-400 rounded-full transition-all duration-300 ease-out"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      </div>
    </div>
  );
};

export default TabsHeader;

