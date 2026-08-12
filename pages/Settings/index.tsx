/**
 * SettingsPage — gom các trang cài đặt lẻ vào 1 màn nhiều tab (giảm mục sidebar).
 * Tab: Đơn hàng / Thanh toán (SePay) / Zalo / Màn hình / Nhà xe.
 * Deep-link qua ?tab=... để redirect từ các path cũ (/settings/zalo…) vào đúng tab.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@/components/ui/Box';
import Tabs from '@/components/ui/Tabs';
import OrderSettingsTab from '@/pages/Settings/OrderSettingsTab';
import SepaySettingsTab from '@/pages/Settings/SepaySettingsTab';
import ZaloSettingsTab from '@/pages/Settings/ZaloSettingsTab';
import ScreenVisibilityTab from '@/pages/Settings/ScreenVisibilityTab';
import CoachesTab from '@/pages/Settings/CoachesTab';

type SettingsTab = 'order' | 'sepay' | 'zalo' | 'screens' | 'coaches';
const VALID: SettingsTab[] = ['order', 'sepay', 'zalo', 'screens', 'coaches'];

const SettingsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: SettingsTab = (VALID as string[]).includes(raw ?? '') ? (raw as SettingsTab) : 'order';

  const setTab = (v: string) => setParams({ tab: v }, { replace: true });

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      <Tabs
        items={[
          { id: 'order', label: 'Đơn hàng' },
          { id: 'sepay', label: 'Thanh toán' },
          { id: 'zalo', label: 'Zalo' },
          { id: 'screens', label: 'Màn hình' },
          { id: 'coaches', label: 'Nhà xe' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Box layoutClassName="min-h-0 flex-1 overflow-y-auto">
        {tab === 'order' ? <OrderSettingsTab /> : null}
        {tab === 'sepay' ? <SepaySettingsTab /> : null}
        {tab === 'zalo' ? <ZaloSettingsTab /> : null}
        {tab === 'screens' ? <ScreenVisibilityTab /> : null}
        {tab === 'coaches' ? <CoachesTab /> : null}
      </Box>
    </Box>
  );
};

export default SettingsPage;
