import React from 'react';
import { Plus, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface IngredientToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onCreate: () => void;
}

const IngredientToolbar: React.FC<IngredientToolbarProps> = ({ 
  searchTerm, 
  onSearchChange, 
  onCreate
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder={t('ingredients.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
        />
      </div>

      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-orange-200 dark:shadow-none whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        <span>{t('ingredients.add')}</span>
      </button>
    </div>
  );
};

export default IngredientToolbar;

