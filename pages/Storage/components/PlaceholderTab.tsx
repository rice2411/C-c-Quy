import React from 'react';
import { FlaskConical, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type InventoryTab = 'products' | 'ingredients' | 'recipes';

interface PlaceholderTabProps {
  tab: InventoryTab;
}

const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ tab }) => {
  const { t } = useLanguage();

  const icon = tab === 'ingredients' ? <FlaskConical className="w-10 h-10 opacity-30" /> : <BookOpen className="w-10 h-10 opacity-30" />;
  const titleKey = tab === 'ingredients' ? 'inventory.ingredientsTab' : 'inventory.recipesTab';
  const descKey = tab === 'ingredients' ? 'inventory.ingredientsPlaceholder' : 'inventory.recipesPlaceholder';

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
      {icon}
      <p className="text-base font-semibold text-slate-600 dark:text-slate-300">{t(titleKey)}</p>
      <p className="text-sm text-center max-w-sm">{t(descKey)}</p>
    </div>
  );
};

export default PlaceholderTab;

