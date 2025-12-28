import React from 'react';
import { Search, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SupplierFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SupplierFilters: React.FC<SupplierFiltersProps> = ({ searchTerm, onSearchChange }) => {
  const { t } = useLanguage();

  return (
    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
        <Building2 className="w-5 h-5 text-orange-500" />
        {t('suppliers.title')}
      </h2>
      
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder={t('suppliers.search')}
          className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 w-full placeholder-slate-400 transition-all"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SupplierFilters;

