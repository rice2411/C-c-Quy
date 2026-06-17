import React from 'react';
import { Sparkles } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
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
    <Box
      layoutClassName="relative overflow-hidden p-6 text-white lg:col-span-1"
      backgroundClassName="bg-gradient-to-br from-primary-600 to-rose-600 dark:from-primary-800 dark:to-rose-900"
      roundedClassName="rounded-xl"
      shadowClassName="shadow-lg"
      stateClassName="transition-colors"
    >
      <Box
        layoutClassName="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32"
        backgroundClassName="bg-white"
        roundedClassName="rounded-full"
        stateClassName="opacity-10 blur-2xl"
      />
      <Box layoutClassName="relative z-10 flex h-full flex-col">
        <Box layoutClassName="mb-4 flex items-center space-x-2">
          <Sparkles className="text-yellow-300" />
          <Heading level={3} textClassName="text-lg font-bold text-white">
            {t('dashboard.aiTitle')}
          </Heading>
        </Box>
        
        <Box layoutClassName="flex-grow">
          {loading ? (
             <Box layoutClassName="flex h-full flex-col items-center justify-center space-y-3">
               <Spinner
                 size="lg"
                 borderClassName="border-white/30 border-t-white"
                 textClassName="text-white"
               />
               <Typography size="sm" textClassName="font-medium text-white/80">
                 {t('dashboard.analyzing')}
               </Typography>
             </Box>
          ) : insight ? (
            <Box layoutClassName="prose prose-sm prose-invert">
              <Typography textClassName="whitespace-pre-line leading-relaxed text-primary-50">{insight}</Typography>
            </Box>
          ) : (
            <Typography size="sm" textClassName="leading-relaxed text-primary-50">
              {t('dashboard.aiPlaceholder')}
            </Typography>
          )}
        </Box>

        <Button
          onClick={onGenerate}
          disabled={loading}
          variant="primary"
          fullWidth
          layoutClassName="mt-6"
          borderClassName="border border-white/20"
          backgroundClassName="bg-white/10"
          textClassName="text-sm font-medium text-white"
          stateClassName="backdrop-blur-sm"
          hoverClassName="hover:bg-white/20"
        >
          {insight ? t('dashboard.updateAnalysis') : t('dashboard.generateBrief')}
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardInsights;