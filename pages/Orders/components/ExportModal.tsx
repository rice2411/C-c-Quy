import React, { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import BaseModal from '../../../components/BaseModal';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (range: 'month' | 'all' | 'custom', startDate?: string, endDate?: string) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const { t } = useLanguage();
  const [range, setRange] = useState<'month' | 'all' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = () => {
    onExport(range, startDate, endDate);
    onClose();
  };

  const footerContent = (
    <>
      <button 
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors"
      >
        {t('orders.exportCancel')}
      </button>
      <button 
        onClick={handleExport}
        disabled={range === 'custom' && (!startDate || !endDate)}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        {t('orders.exportConfirm')}
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Download className="w-5 h-5 text-orange-600" />
          {t('orders.exportTitle')}
        </span>
      }
      footer={footerContent}
      size="md"
    >
      <div className="space-y-3">
        <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
          <div className="flex items-center justify-center w-5 h-5 border-2 border-slate-300 dark:border-slate-500 rounded-full group-hover:border-orange-500">
            <input 
              type="radio" 
              name="exportRange" 
              value="month" 
              checked={range === 'month'} 
              onChange={() => setRange('month')}
              className="appearance-none w-3 h-3 rounded-full bg-transparent checked:bg-orange-600"
            />
          </div>
          <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{t('orders.exportCurrentMonth')}</span>
        </label>

        <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
           <div className="flex items-center justify-center w-5 h-5 border-2 border-slate-300 dark:border-slate-500 rounded-full group-hover:border-orange-500">
            <input 
              type="radio" 
              name="exportRange" 
              value="all" 
              checked={range === 'all'} 
              onChange={() => setRange('all')}
              className="appearance-none w-3 h-3 rounded-full bg-transparent checked:bg-orange-600"
            />
          </div>
          <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{t('orders.exportAllTime')}</span>
        </label>

        <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
           <div className="flex items-center justify-center w-5 h-5 border-2 border-slate-300 dark:border-slate-500 rounded-full group-hover:border-orange-500">
            <input 
              type="radio" 
              name="exportRange" 
              value="custom" 
              checked={range === 'custom'} 
              onChange={() => setRange('custom')}
              className="appearance-none w-3 h-3 rounded-full bg-transparent checked:bg-orange-600"
            />
          </div>
          <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{t('orders.exportCustom')}</span>
        </label>

        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pl-2 pt-2 animate-fade-in">
            <div>
              <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('orders.exportStart')}
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
               <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                 <Calendar className="w-3 h-3" />
                 {t('orders.exportEnd')}
               </label>
               <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ExportModal;