/**
 * OrderToolbarActions — cụm nút action của trang Đơn hàng.
 * Gom gọn: [Làm mới (icon)] · [Thêm ▾ (menu action phụ)] · [Tạo đơn (CTA)]
 * để toolbar không bị dài/rối do 5 nút to chen cạnh ô tìm kiếm.
 */
import React, { useState } from 'react';
import { Download, MoreHorizontal, PackagePlus, Plus, RefreshCw, Scale, Truck, type LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Popover from '@/components/ui/Popover';
import BottomSheet from '@/components/ui/BottomSheet';
import Typography from '@/components/ui/Typography';

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

const MenuItem: React.FC<{
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}> = ({ icon: Icon, label, onClick }) => (
  <Button
    type="button"
    onClick={onClick}
    variant="ghost"
    disableVariantHover
    disableVariantTextColor
    leftIcon={<Icon />}
    iconClassName="inline-flex shrink-0 text-slate-400 [&_svg]:h-4 [&_svg]:w-4"
    layoutClassName="flex w-full items-center gap-2.5"
    sizeClassName="px-2.5 py-2 text-sm"
    textClassName="font-medium text-slate-700 dark:text-slate-200"
    roundedClassName="rounded-lg"
    backgroundClassName="bg-transparent"
    hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700"
    stateClassName="transition-colors"
  >
    {label}
  </Button>
);

const OrderToolbarActions: React.FC<OrderToolbarActionsProps> = ({
  onRefresh, isRefreshing, onExport, canExport, onSyncTracking, onCompare, onExportSpx, onCreate,
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Danh sách mục menu "Thêm" — dùng chung cho Popover (desktop) và BottomSheet (mobile).
  const renderMenu = (close: () => void) => (
    <>
      {canExport ? (
        <MenuItem icon={Download} label={t('orders.exportCsv')} onClick={() => { close(); onExport(); }} />
      ) : null}
      <MenuItem icon={Truck} label="Đồng bộ vận đơn" onClick={() => { close(); onSyncTracking(); }} />
      <MenuItem icon={Scale} label="So sánh vận đơn" onClick={() => { close(); onCompare(); }} />
      <MenuItem icon={PackagePlus} label="Xuất file SPX" onClick={() => { close(); onExportSpx(); }} />
    </>
  );

  const moreButton = (onClick?: () => void) => (
    <Button
      type="button"
      onClick={onClick}
      variant="secondary"
      disableVariantHover
      disableVariantTextColor
      leftIcon={<MoreHorizontal />}
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
        {t('common.more')}
      </Typography>
    </Button>
  );

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

      {isMobile ? (
        <>
          {moreButton(() => setSheetOpen(true))}
          <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t('common.more')}>
            <Box layoutClassName="flex flex-col gap-0.5">
              {renderMenu(() => setSheetOpen(false))}
            </Box>
          </BottomSheet>
        </>
      ) : (
        <Popover align="right" width={216} trigger={moreButton()}>
          {(close) => <Box layoutClassName="flex flex-col gap-0.5">{renderMenu(close)}</Box>}
        </Popover>
      )}

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
