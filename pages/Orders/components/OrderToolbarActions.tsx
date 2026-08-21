/**
 * OrderToolbarActions — cụm nút action của trang Đơn hàng.
 * Gom gọn: [Làm mới (icon)] · [Công cụ ▾ (mở modal chọn tính năng)] · [Tạo đơn (CTA)].
 * Menu "Thêm" cũ (phẳng) đổi thành modal lưới công cụ để mở rộng nhiều tính năng SPX/Excel/vận đơn.
 */
import React, { useState } from 'react';
import { Download, LayoutGrid, PackagePlus, Plus, RefreshCw, Scale, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import OrderToolsModal, { type OrderToolGroup } from './OrderToolsModal';

interface OrderToolbarActionsProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onExport: () => void;
  canExport: boolean;
  onSyncTracking: () => void;
  onCompare: () => void;
  onExportSpx: () => void;
  onCreate: () => void;
}

const OrderToolbarActions: React.FC<OrderToolbarActionsProps> = ({
  onRefresh, isRefreshing, onExport, canExport, onSyncTracking, onCompare, onExportSpx, onCreate,
}) => {
  const { t } = useLanguage();
  const [toolsOpen, setToolsOpen] = useState(false);

  // Nhóm công cụ cho modal — dễ bổ sung tính năng mới sau này (chỉ push thêm vào group).
  const toolGroups: OrderToolGroup[] = [
    {
      key: 'shipping',
      label: 'Vận đơn / SPX',
      tools: [
        { id: 'sync', icon: Truck, label: 'Đồng bộ vận đơn', description: 'Cập nhật trạng thái vận đơn từ hãng.', onClick: onSyncTracking, accentClassName: 'text-cyan-500' },
        { id: 'compare', icon: Scale, label: 'So sánh vận đơn', description: 'Đối chiếu đơn với dữ liệu hãng vận chuyển.', onClick: onCompare, accentClassName: 'text-violet-500' },
        { id: 'spx', icon: PackagePlus, label: 'Xuất file SPX', description: 'Tạo file import đơn cho Shopee Express.', onClick: onExportSpx, accentClassName: 'text-orange-500' },
      ],
    },
    {
      key: 'excel',
      label: 'Excel',
      tools: [
        ...(canExport
          ? [{ id: 'csv', icon: Download, label: t('orders.exportCsv'), description: 'Xuất danh sách đơn đang lọc ra file.', onClick: onExport, accentClassName: 'text-emerald-500' }]
          : []),
      ],
    },
  ].filter((g) => g.tools.length > 0);

  return (
    <Box layoutClassName="flex items-center gap-2">
      <IconButton
        variant="secondary"
        size="md"
        label={t('orders.refresh')}
        onClick={onRefresh}
        disabled={isRefreshing}
        roundedClassName="rounded-xl"
      >
        <RefreshCw className={`h-4 w-4${isRefreshing ? ' animate-spin' : ''}`} />
      </IconButton>

      <Button
        type="button"
        onClick={() => setToolsOpen(true)}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        leftIcon={<LayoutGrid />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
        backgroundClassName="bg-white dark:bg-slate-800"
        borderClassName="border border-slate-200 dark:border-slate-600"
        textClassName="font-medium text-slate-700 dark:text-slate-200"
        roundedClassName="rounded-xl"
        sizeClassName="px-3 py-2 text-xs"
        layoutClassName="inline-flex items-center gap-1.5"
        hoverClassName="hover:border-primary-300 dark:hover:border-primary-500"
        stateClassName="transition-colors"
      >
        <Typography as="span" size="xs" layoutClassName="hidden sm:inline">
          Công cụ
        </Typography>
      </Button>

      <OrderToolsModal open={toolsOpen} onClose={() => setToolsOpen(false)} groups={toolGroups} />

      <Button
        type="button"
        onClick={onCreate}
        leftIcon={<Plus />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
        backgroundClassName="bg-primary-600"
        hoverClassName="hover:bg-primary-700"
        textClassName="font-medium text-white"
        roundedClassName="rounded-xl"
        shadowClassName="shadow-sm shadow-primary-200 dark:shadow-none"
        sizeClassName="px-4 py-2 text-xs"
        layoutClassName="inline-flex items-center gap-1.5"
        stateClassName="transition-colors"
        variant="primary"
        disableVariantHover
        disableVariantTextColor
      >
        {t('nav.newOrder')}
      </Button>
    </Box>
  );
};

export default OrderToolbarActions;
