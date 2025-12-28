import React from 'react';
import { Layers, Cake, Plus, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecipeToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onCreateBase: () => void;
  onCreateFull: () => void;
}

const RecipeToolbar: React.FC<RecipeToolbarProps> = ({ searchTerm, onSearchChange, onCreateBase, onCreateFull }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder={t('recipes.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCreateBase}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-200 dark:shadow-none whitespace-nowrap"
        >
          <Layers className="w-4 h-4" />
          <span>{t('recipes.addBase') || 'Thêm công thức nền'}</span>
        </button>
        <button
          onClick={onCreateFull}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-orange-200 dark:shadow-none whitespace-nowrap"
        >
          <Cake className="w-4 h-4" />
          <span>{t('recipes.addFull') || 'Thêm công thức bánh'}</span>
        </button>
      </div>
    </div>
  );
};

export default RecipeToolbar;
