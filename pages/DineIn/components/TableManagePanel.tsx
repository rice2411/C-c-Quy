import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import { DiningTable, DiningTableInput, tableStatus } from '@/types';

interface TableManagePanelProps {
  isOpen: boolean;
  tables: DiningTable[];
  onClose: () => void;
  onCreate: (data: Omit<DiningTableInput, 'id'>) => Promise<unknown>;
  onUpdate: (id: string, data: Partial<Omit<DiningTableInput, 'id'>>) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
}

/** Quản lý bàn: thêm / đổi tên / số ghế / xoá. Vị trí bàn kéo-thả trực tiếp trên sơ đồ. */
const TableManagePanel: React.FC<TableManagePanelProps> = ({
  isOpen,
  tables,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [busy, setBusy] = useState(false);

  const addTable = async () => {
    setBusy(true);
    try {
      await onCreate({
        name: `Bàn ${tables.length + 1}`,
        posX: 0.5,
        posY: 0.4,
        seats: 4,
        sortOrder: tables.length + 1,
      });
      toast.success('Đã thêm bàn');
    } catch {
      toast.error('Thêm bàn thất bại');
    } finally {
      setBusy(false);
    }
  };

  const rename = async (t: DiningTable, name: string) => {
    if (!name.trim() || name === t.name) return;
    try {
      await onUpdate(t.id, { name: name.trim() });
    } catch {
      toast.error('Đổi tên thất bại');
    }
  };

  const setSeats = async (t: DiningTable, seats: number) => {
    if (seats === t.seats) return;
    try {
      await onUpdate(t.id, { seats: Math.max(1, seats) });
    } catch {
      toast.error('Đổi số ghế thất bại');
    }
  };

  const remove = async (t: DiningTable) => {
    if (tableStatus(t) === 'occupied') {
      toast.error('Bàn đang có khách — không xoá được');
      return;
    }
    try {
      await onDelete(t.id);
      toast.success('Đã xoá bàn');
    } catch {
      toast.error('Xoá thất bại (bàn còn đơn mở?)');
    }
  };

  return (
    <BaseSlidePanel
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Quản lý bàn"
      footer={
        <Button
          variant="primary"
          onClick={addTable}
          disabled={busy}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Thêm bàn
        </Button>
      }
    >
      <Box layoutClassName="flex flex-col gap-3 p-6">
        <Typography textClassName="text-xs text-slate-500 dark:text-slate-400">
          Kéo-thả bàn trên sơ đồ để đổi vị trí. Đổi tên / số ghế / xoá ở đây.
        </Typography>
        {tables.map((t) => (
          <Box
            key={t.id}
            layoutClassName="flex items-end gap-2 p-3"
            backgroundClassName="bg-slate-50 dark:bg-slate-900/50"
            roundedClassName="rounded-lg"
          >
            <Box layoutClassName="flex flex-col gap-1 flex-1 min-w-0">
              <Typography textClassName="text-xs font-medium text-slate-500 dark:text-slate-400">
                Tên bàn
              </Typography>
              <Input
                defaultValue={t.name}
                onBlur={(e) => rename(t, e.target.value)}
              />
            </Box>
            <Box layoutClassName="flex flex-col gap-1 w-20">
              <Typography textClassName="text-xs font-medium text-slate-500 dark:text-slate-400">
                Số ghế
              </Typography>
              <Input
                type="number"
                min={1}
                defaultValue={t.seats}
                onBlur={(e) => setSeats(t, Number(e.target.value) || t.seats)}
              />
            </Box>
            <IconButton
              variant="danger"
              onClick={() => remove(t)}
              label="Xoá bàn"
            >
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </BaseSlidePanel>
  );
};

export default TableManagePanel;
