import React, { useState, useMemo } from 'react';
import { Search, Edit2, Trash2, User, Phone, Mail, MapPin } from 'lucide-react';
import { Customer } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full animate-fade-in transition-colors overflow-hidden">
      
      {/* Search Toolbar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
           <User className="w-5 h-5 text-orange-500" />
           {t('customers.title')}
        </h2>
        
        <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder={t('customers.search')}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 w-full placeholder-slate-400 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 flex-1 overflow-y-auto">
         {filteredCustomers.length > 0 ? (
           filteredCustomers.map(customer => (
             <div key={customer.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative group">
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
                   {(customer.phone || customer.email) && (
                     <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{customer.phone}</span>
                        {customer.email && <span className="text-slate-300 mx-1">|</span>}
                        <span className="truncate">{customer.email}</span>
                     </div>
                   )}
                   {(customer.address || customer.city) && (
                     <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{[customer.address, customer.city].filter(Boolean).join(', ')}</span>
                     </div>
                   )}
                </div>
             </div>
           ))
         ) : (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">{t('customers.noData')}</div>
         )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
           <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-700 shadow-sm">
             <tr className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-600">
               <th className="px-6 py-4">{t('customers.table.name')}</th>
               <th className="px-6 py-4">{t('customers.table.contact')}</th>
               <th className="px-6 py-4">{t('customers.table.location')}</th>
               <th className="px-6 py-4 text-center w-32">{t('customers.table.actions')}</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
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
                        <div className="flex flex-col text-sm">
                           {customer.phone && (
                             <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                               <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                             </div>
                           )}
                           {customer.email && (
                             <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                               <Mail className="w-3 h-3 text-slate-400" /> {customer.email}
                             </div>
                           )}
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                           <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                           <span className="truncate max-w-xs">
                             {[customer.address, customer.city, customer.country].filter(Boolean).join(', ')}
                           </span>
                        </div>
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
    </div>
  );
};

export default CustomerList;