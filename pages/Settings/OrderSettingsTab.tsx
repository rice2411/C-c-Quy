import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import ShippingSettingsTab from '@/pages/Settings/ShippingSettingsTab';
import SurchargeTagsTab from '@/pages/Settings/SurchargeTagsTab';

/**
 * Container cho mọi cài đặt liên quan đến đơn hàng.
 * Hiện tại có: Phí ship. Sau này thêm: tax, discount default, etc.
 */
const OrderSettingsTab: React.FC = () => {
  return (
    <Box layoutClassName="space-y-6">
      <Box>
        <Heading level={2} textClassName="flex items-center gap-2 text-xl font-semibold">
          <ShoppingCart className="h-6 w-6 text-primary-500" />
          Cài đặt đơn hàng
        </Heading>
        <Typography size="sm" variant="muted" layoutClassName="mt-1">
          Các tham số áp dụng cho đơn hàng: phí ship, điểm gốc tính khoảng cách, v.v.
        </Typography>
      </Box>

      <ShippingSettingsTab />
      <SurchargeTagsTab />
    </Box>
  );
};

export default OrderSettingsTab;
