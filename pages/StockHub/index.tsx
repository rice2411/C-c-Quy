import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import OverviewTab from '@/pages/StockHub/OverviewTab';

// Lazy để mỗi tab là 1 chunk riêng — không kéo OCR pipeline (Phiếu nhập) vào tab NCC/NVL.
const StockReceiptsPage = lazy(() => import('@/pages/StockReceipts/index'));
const MaterialsPage = lazy(() => import('@/pages/Materials/index'));

type StockTab = 'overview' | 'receipts' | 'materials';
const VALID_TABS: StockTab[] = ['overview', 'receipts', 'materials'];

/**
 * Nhập kho — gộp 3 phần cùng luồng nhập hàng thành 1 trang 3 tab:
 * Phiếu nhập · Nhà cung cấp · Nguyên vật liệu. Tab đồng bộ với query `?tab=`
 * (giữ link cũ /suppliers, /materials redirect sang đây). Chỉ mount tab đang xem.
 */
const StockHubPage: React.FC = () => {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: StockTab = VALID_TABS.includes(raw as StockTab) ? (raw as StockTab) : 'overview';

  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', v);
    setParams(next, { replace: true });
  };

  const tabItems = [
    { id: 'overview', label: t('nav.stockOverview') },
    { id: 'receipts', label: t('nav.stockReceipts') },
    { id: 'materials', label: t('nav.materials') },
  ];

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4">
      <Tabs items={tabItems} value={tab} onChange={setTab} />
      <Box layoutClassName="flex-1">
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
        </Suspense>
      </Box>
    </Box>
  );
};

export default StockHubPage;
