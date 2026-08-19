import React, { useState } from 'react';
import { ShoppingCart, Truck, Tags } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import ShippingSettingsTab from '@/pages/Settings/ShippingSettingsTab';
import SurchargeTagsTab from '@/pages/Settings/SurchargeTagsTab';

type Tab = 'shipping' | 'surcharge';

/**
 * Cài đặt liên quan đơn hàng — chia TAB con để gọn (thay vì xếp chồng dài):
 *  - Phí ship (khoảng cách + bậc phí + điểm gốc)
 *  - Nhãn phụ thu
 */
const OrderSettingsTab: React.FC = () => {
  const [tab, setTab] = useState<Tab>('shipping');

  const tabBtn = (value: Tab, label: string, icon: React.ReactNode) => (
    <Button
      type="button"
      onClick={() => setTab(value)}
      variant={tab === value ? 'primary' : 'secondary'}
      leftIcon={icon}
      iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
      sizeClassName="px-3.5 py-1.5 text-sm"
      roundedClassName="rounded-lg"
      borderClassName={tab === value ? 'border border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
      backgroundClassName={tab === value ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
      textClassName={tab === value ? 'font-medium text-white' : 'text-slate-700 dark:text-slate-200'}
      layoutClassName="inline-flex items-center gap-1.5"
      disableVariantHover
      disableVariantTextColor
    >
      {label}
    </Button>
  );

  return (
    <Box layoutClassName="space-y-5">
      <Box>
        <Heading level={2} textClassName="flex items-center gap-2 text-xl font-semibold">
          <ShoppingCart className="h-6 w-6 text-primary-500" />
          Cài đặt đơn hàng
        </Heading>
        <Typography size="sm" variant="muted" layoutClassName="mt-1">
          Tham số áp dụng cho đơn hàng — chọn nhóm bên dưới để cấu hình.
        </Typography>
      </Box>

      <Box layoutClassName="flex flex-wrap gap-2">
        {tabBtn('shipping', 'Phí ship', <Truck />)}
        {tabBtn('surcharge', 'Nhãn phụ thu', <Tags />)}
      </Box>

      {tab === 'shipping' ? <ShippingSettingsTab /> : <SurchargeTagsTab />}
    </Box>
  );
};

export default OrderSettingsTab;
