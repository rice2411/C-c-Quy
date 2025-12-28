import React from 'react';
import { Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Supplier } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface SupplierCardProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onEdit, onDelete }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-lg">
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{supplier.name}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">ID: {supplier.id.substring(0,6)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(supplier)}
            className="p-2 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(supplier.id)}
            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {supplier.contactName && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('suppliers.form.contactName')}:</span>
            <span>{supplier.contactName}</span>
          </div>
        )}
        {supplier.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{supplier.phone}</span>
          </div>
        )}
        {supplier.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{supplier.email}</span>
          </div>
        )}
        {supplier.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{supplier.address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierCard;

