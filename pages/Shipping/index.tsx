import React from 'react';
import Box from '@/components/ui/Box';
import ShippingSettingsTab from '@/pages/Settings/ShippingSettingsTab';

/**
 * Trang "Vận chuyển" (nhóm Bán hàng) = CẤU HÌNH phí ship (điểm gốc / tiers theo km / phí vượt).
 * (Chuyển từ Cài đặt đơn hàng sang đây.) Phần PHÂN TÍCH theo ĐVVC đã chuyển sang
 * Đối tác → ĐVVC → tab "Tổng quan".
 */
const ShippingPage: React.FC = () => (
  <Box layoutClassName="h-full overflow-y-auto p-4">
    <ShippingSettingsTab />
  </Box>
);

export default ShippingPage;
