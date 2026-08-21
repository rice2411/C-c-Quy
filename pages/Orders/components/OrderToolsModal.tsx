import React from 'react';
import { type LucideIcon } from 'lucide-react';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

/** 1 công cụ trong modal (icon + tên + mô tả + hành động). */
export interface OrderTool {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  /** Màu nhấn icon (accent) — Tailwind text-* class. */
  accentClassName?: string;
}

/** 1 nhóm công cụ (vd Vận đơn / Excel). */
export interface OrderToolGroup {
  key: string;
  label: string;
  tools: OrderTool[];
}

interface OrderToolsModalProps {
  open: boolean;
  onClose: () => void;
  groups: OrderToolGroup[];
}

/**
 * Modal "Công cụ đơn hàng" — chọn tính năng dạng lưới thẻ, gom theo nhóm (SPX/Excel/Vận đơn).
 * Thay menu "Thêm" phẳng để chỗ này mở rộng được nhiều tính năng mà vẫn gọn.
 */
const OrderToolsModal: React.FC<OrderToolsModalProps> = ({ open, onClose, groups }) => (
  <BaseModal isOpen={open} onClose={onClose} title="Công cụ đơn hàng" size="lg">
    <Box layoutClassName="space-y-5 p-1">
      {groups.map((g) => (
        <Box key={g.key} layoutClassName="space-y-2">
          <Typography
            as="span"
            size="xs"
            layoutClassName="px-0.5 font-semibold uppercase tracking-wide"
            textClassName="text-slate-400 dark:text-slate-500"
          >
            {g.label}
          </Typography>
          <Box layoutClassName="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {g.tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  type="button"
                  onClick={() => { onClose(); tool.onClick(); }}
                  variant="secondary"
                  disableVariantHover
                  disableVariantTextColor
                  layoutClassName="flex w-full items-start gap-3 text-left"
                  sizeClassName="p-3"
                  roundedClassName="rounded-xl"
                  borderClassName="border border-slate-200 dark:border-slate-700"
                  backgroundClassName="bg-white dark:bg-slate-800"
                  hoverClassName="hover:border-primary-300 hover:bg-primary-50/40 dark:hover:border-primary-600 dark:hover:bg-primary-900/10"
                  stateClassName="transition-colors"
                >
                  <Box
                    layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    backgroundClassName="bg-slate-100 dark:bg-slate-700/60"
                  >
                    <Icon className={`h-5 w-5 ${tool.accentClassName ?? 'text-primary-500'}`} />
                  </Box>
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                      {tool.label}
                    </Typography>
                    <Typography size="xs" variant="muted" layoutClassName="mt-0.5 block">
                      {tool.description}
                    </Typography>
                  </Box>
                </Button>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  </BaseModal>
);

export default OrderToolsModal;
