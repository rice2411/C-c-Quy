import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type InventoryTab = 'products' | 'ingredients' | 'recipes';

interface TabsHeaderProps {
  activeTab: InventoryTab;
  onChange: (tab: InventoryTab) => void;
}

const TabsHeader: React.FC<TabsHeaderProps> = ({ activeTab, onChange }) => {
  const { t } = useLanguage();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const tabs: InventoryTab[] = ['products', 'ingredients', 'recipes'];

  // Update indicator position when activeTab changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = tabs.indexOf(activeTab);
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
          const isActive = activeTab === tab;
          const label =
            tab === 'products'
              ? t('inventory.productsTab')
              : tab === 'ingredients'
              ? t('inventory.ingredientsTab')
              : t('inventory.recipesTab');
          return (
            <button
              key={tab}
              ref={(el) => {
                tabsRef.current[index] = el;
              }}
              onClick={() => onChange(tab)}
              className={`relative pb-2 text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${
                isActive
                  ? 'text-orange-500 dark:text-orange-400'
                  : 'text-slate-500 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400'
              }`}
            >
              {label}
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

