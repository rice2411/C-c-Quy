import React from 'react';
import { Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Supplier, SupplierType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';  

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierTable: React.FC<SupplierTableProps> = ({ suppliers, onEdit, onDelete }) => {
  const { t } = useLanguage();

  return (
    <div className="hidden lg:block flex-1 overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-700 shadow-sm">
          <tr className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-600">
            <th className="px-6 py-4">{t('suppliers.table.name')}</th>
            <th className="px-6 py-4">{t('suppliers.form.type')}</th>
            <th className="px-6 py-4">{t('suppliers.table.contact')}</th>
            <th className="px-6 py-4">{t('suppliers.form.phone')}</th>
            <th className="px-6 py-4">{t('suppliers.form.email')}</th>
            <th className="px-6 py-4">{t('suppliers.form.address')}</th>
            <th className="px-6 py-4 text-center w-32">{t('suppliers.table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
                      {supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{supplier.name}</p>
                      <p className="text-xs text-slate-400">#{supplier.id.substring(0,6)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                  {t(`suppliers.form.types.${(supplier.type || SupplierType.GROCERY).toString().toLowerCase()}`)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{supplier.contactName || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm">
                    <Phone className="w-3 h-3 text-slate-400" /> 
                    {supplier.phone || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm">
                    <Mail className="w-3 h-3 text-slate-400" /> 
                    {supplier.email || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm">
                    <MapPin className="w-3 h-3 text-slate-400" /> 
                    {supplier.address || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(supplier)}
                      className="p-2 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(supplier.id)}
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
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                {t('suppliers.noData')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierTable;

