/**
 * StatusChip — click chip để toggle active/inactive.
 */
import React from 'react';
import Button from '@/components/ui/Button';

interface StatusChipProps {
  status: 'active' | 'inactive';
  onToggle: () => void;
}

const StatusChip: React.FC<StatusChipProps> = ({ status, onToggle }) => (
  <Button
    type="button"
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    title="Click để đổi trạng thái"
    variant="ghost"
    disableVariantHover
    disableVariantTextColor
    sizeClassName="px-2 py-0.5 text-[10px]"
    roundedClassName="rounded-full"
    backgroundClassName={
      status === 'active'
        ? 'bg-emerald-500/90 hover:bg-emerald-600'
        : 'bg-slate-500/80 hover:bg-slate-600'
    }
    textClassName="font-bold uppercase text-white"
    layoutClassName="inline-flex items-center gap-1 transition-all hover:scale-105"
    borderClassName="border-transparent"
  >
    {status === 'active' ? '● Hoạt động' : '○ Tạm dừng'}
  </Button>
);

export default StatusChip;
