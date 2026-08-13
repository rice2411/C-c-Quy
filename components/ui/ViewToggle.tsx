/**
 * ViewToggle — nút chuyển chế độ xem dùng chung cho các màn list (card / table / grid…).
 * Đặt vào slot `viewToggle` của FilterToolbar. Trạng thái do parent giữ (dùng useViewMode).
 */
import React from 'react';
import { LayoutGrid, List, Table2, type LucideIcon } from 'lucide-react';
import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';

export interface ViewModeOption {
  id: string;
  Icon: LucideIcon;
  title: string;
}

/** Bộ chế độ mặc định: danh sách thẻ · bảng · lưới. */
export const DEFAULT_VIEW_OPTIONS: ViewModeOption[] = [
  { id: 'list', Icon: List, title: 'Danh sách thẻ' },
  { id: 'table', Icon: Table2, title: 'Bảng' },
  { id: 'grid', Icon: LayoutGrid, title: 'Lưới' },
];

interface ViewToggleProps {
  value: string;
  onChange: (v: string) => void;
  options?: ViewModeOption[];
}

const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange, options = DEFAULT_VIEW_OPTIONS }) => (
  <Box
    layoutClassName="inline-flex items-center gap-0.5 p-0.5"
    roundedClassName="rounded-lg"
    borderClassName="border border-slate-200 dark:border-slate-600"
    backgroundClassName="bg-white dark:bg-slate-800"
  >
    {options.map(({ id, Icon, title }) => {
      const active = value === id;
      return (
        <IconButton
          key={id}
          label={title}
          size="sm"
          variant="ghost"
          onClick={() => onChange(id)}
          roundedClassName="rounded-md"
          backgroundClassName={active ? 'bg-primary-500 hover:bg-primary-600' : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}
          textClassName={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}
          shadowClassName={active ? 'shadow-sm' : ''}
        >
          <Icon className="h-4 w-4" />
        </IconButton>
      );
    })}
  </Box>
);

export default ViewToggle;
