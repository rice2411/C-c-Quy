import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type InventoryTab = 'products' | 'ingredients' | 'recipes';

interface TabsHeaderProps {
  activeTab: InventoryTab;
  onChange: (tab: InventoryTab) => void;
}

const TabsHeader: React.FC<TabsHeaderProps> = ({ activeTab, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="w-full border-b border-slate-200 dark:border-slate-700">
      <div className="flex gap-6">
        {(['products', 'ingredients', 'recipes'] as InventoryTab[]).map((tab) => {
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
              onClick={() => onChange(tab)}
              className={`relative pb-2 text-sm font-semibold tracking-wide uppercase transition-colors ${
                isActive
                  ? 'text-orange-500 dark:text-orange-400'
                  : 'text-slate-500 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-0.5 mx-auto h-0.5 max-w-[90px] bg-orange-500 dark:bg-orange-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabsHeader;

