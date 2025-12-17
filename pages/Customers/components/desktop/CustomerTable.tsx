import React from 'react';
import { Edit2, Trash2, Phone } from 'lucide-react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';  

interface CustomerTableProps {
  customers: Customer[];
  customerStats: Map<string, number>;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({ customers, customerStats, onEdit, onDelete }) => {
  const { t } = useLanguage();

  const getProductCount = (phone: string) => {
    const normalized = phone.replace(/\D/g, '');
    return customerStats.get(normalized) || 0;
  };

  return (
    <div className="hidden lg:block flex-1 overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-700 shadow-sm">
          <tr className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-600">
            <th className="px-6 py-4">{t('customers.table.name')}</th>
            <th className="px-6 py-4">{t('customers.form.phone')}</th>
            <th className="px-6 py-4 text-center">{t('customers.table.totalProducts')}</th>
            <th className="px-6 py-4 text-center w-32">{t('customers.table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {customers.length > 0 ? (
            customers.map(customer => (
              <tr key={customer.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{customer.name}</p>
                      <p className="text-xs text-slate-400">#{customer.id.substring(0,6)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm">
                    <Phone className="w-3 h-3 text-slate-400" /> 
                    {customer.phone}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {getProductCount(customer.phone)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(customer)}
                      className="p-2 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(customer.id)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                {t('customers.noData')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;

