/**
 * ProductSettings — "Cài đặt sản phẩm": gom Danh mục / Vị / Nhãn vào 1 màn có tab.
 */
import React, { useState } from 'react';
import Box from '@/components/ui/Box';
import Tabs from '@/components/ui/Tabs';
import CategoriesTab from '@/pages/Settings/CategoriesTab';
import BadgesTab from '@/pages/Settings/BadgesTab';

// Vị KHÔNG còn config tập trung — khai báo ngay trong từng sản phẩm.
type ProductSettingsTab = 'categories' | 'badges';

const ProductSettings: React.FC = () => {
  const [tab, setTab] = useState<ProductSettingsTab>('categories');

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      <Tabs
        items={[
          { id: 'categories', label: 'Danh mục' },
          { id: 'badges', label: 'Nhãn' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as ProductSettingsTab)}
      />
      <Box layoutClassName="min-h-0 flex-1">
        {tab === 'categories' ? <CategoriesTab /> : null}
        {tab === 'badges' ? <BadgesTab /> : null}
      </Box>
    </Box>
  );
};

export default ProductSettings;
