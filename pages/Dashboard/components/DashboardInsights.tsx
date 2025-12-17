import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardInsightsProps {
  insight: string | null;
  loading: boolean;
  onGenerate: () => void;
}

const DashboardInsights: React.FC<DashboardInsightsProps> = ({ 
  insight, 
  loading, 
  onGenerate 
}) => {
  const { t } = useLanguage();

  return (
    <div className="lg:col-span-1 bg-gradient-to-br from-orange-600 to-rose-600 dark:from-orange-800 dark:to-rose-900 p-6 rounded-xl shadow-lg text-white relative overflow-hidden transition-colors">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="text-yellow-300" />
          <h3 className="text-lg font-bold">{t('dashboard.aiTitle')}</h3>
        </div>
        
        <div className="flex-grow">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full space-y-3">
               <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
               <p className="text-sm font-medium text-white/80">{t('dashboard.analyzing')}</p>
             </div>
          ) : insight ? (
            <div className="prose prose-invert prose-sm">
              <p className="text-orange-50 whitespace-pre-line leading-relaxed">{insight}</p>
            </div>
          ) : (
            <p className="text-orange-50 text-sm leading-relaxed">
              {t('dashboard.aiPlaceholder')}
            </p>
          )}
        </div>

        <button 
          onClick={onGenerate}
          disabled={loading}
          className="mt-6 w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 backdrop-blur-sm"
        >
          <span>{insight ? t('dashboard.updateAnalysis') : t('dashboard.generateBrief')}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardInsights;