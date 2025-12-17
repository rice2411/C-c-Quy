import React from 'react';
import { Edit2, Trash2, Phone, ShoppingBag } from 'lucide-react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomerCardProps {
  customer: Customer;
  productCount: number;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, productCount, onEdit, onDelete }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-lg">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{customer.name}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">ID: {customer.id.substring(0,6)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(customer)}
            className="p-2 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(customer.id)}
            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {customer.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{customer.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">{t('customers.table.totalProducts')}: {productCount}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;

