import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import OverviewTab from '@/pages/CostHub/OverviewTab';
import AssetsTab from '@/pages/CostHub/AssetsTab';
import OpexTab from '@/pages/CostHub/OpexTab';

// Lazy: Phiếu nhập (OCR pipeline) + NVL nặng → chunk riêng.
const StockReceiptsPage = lazy(() => import('@/pages/StockReceipts/index'));
const MaterialsPage = lazy(() => import('@/pages/Materials/index'));

type CostTab = 'overview' | 'receipts' | 'materials' | 'assets' | 'opex';
const VALID_TABS: CostTab[] = ['overview', 'receipts', 'materials', 'assets', 'opex'];

/**
 * Chi phí vận hành — 1 trang gom mọi chi phí:
 * Tổng quan (3 nhánh) · Phiếu nhập (input chung) · Nguyên vật liệu · Tài sản · Vận hành.
 * Phiếu nhập phân loại từng dòng → định tuyến về NVL / Tài sản / Vận hành.
 */
const CostHubPage: React.FC = () => {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: CostTab = VALID_TABS.includes(raw as CostTab) ? (raw as CostTab) : 'overview';

  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', v);
    setParams(next, { replace: true });
  };

  const tabItems = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'receipts', label: t('nav.stockReceipts') },
    { id: 'materials', label: t('nav.materials') },
    { id: 'assets', label: 'Tài sản' },
    { id: 'opex', label: 'Vận hành' },
  ];

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4">
      <Tabs items={tabItems} value={tab} onChange={setTab} />
      <Box layoutClassName="flex-1 overflow-y-auto">
        <Suspense
          fallback={
            <Box layoutClassName="flex min-h-[30vh] items-center justify-center">
              <Spinner size="lg" textClassName="text-primary-500" />
            </Box>
          }
        >
          {tab === 'overview' && <OverviewTab />}
          {tab === 'receipts' && <StockReceiptsPage />}
          {tab === 'materials' && <MaterialsPage />}
          {tab === 'assets' && <AssetsTab />}
          {tab === 'opex' && <OpexTab />}
        </Suspense>
      </Box>
    </Box>
  );
};

export default CostHubPage;
