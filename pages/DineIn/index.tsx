import React, { useMemo, useState } from 'react';
import { LayoutGrid, Map as MapIcon, Pencil, RefreshCw, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ViewToggle from '@/components/ui/ViewToggle';
import { useTables } from '@/hooks/useTables';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { DiningTable, tableStatus } from '@/types';
import FloorMap from './components/FloorMap';
import TableGrid from './components/TableGrid';
import TableOrderPanel from './components/TableOrderPanel';
import TableManagePanel from './components/TableManagePanel';

const VIEW_OPTIONS = [
  { id: 'grid', Icon: LayoutGrid, title: 'Lưới thẻ bàn' },
  { id: 'map', Icon: MapIcon, title: 'Sơ đồ quán' },
];

const DineInPage: React.FC = () => {
  const {
    tables,
    loading,
    refreshTables,
    createTable,
    modifyTable,
    removeTable,
    closeTable,
  } = useTables();
  const { createNewOrder, modifyOrder } = useOrders();
  const { products } = useProducts();

  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [editMode, setEditMode] = useState(false);
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<DiningTable | null>(null);
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);

  const occupiedCount = useMemo(
    () => tables.filter((t) => tableStatus(t) === 'occupied').length,
    [tables],
  );

  const openTable = (t: DiningTable) => {
    setSelected(t);
    setOrderPanelOpen(true);
  };

  const handleMove = async (id: string, posX: number, posY: number) => {
    try {
      await modifyTable(id, { posX, posY });
    } catch {
      toast.error('Không lưu được vị trí bàn');
    }
  };

  const handleCreate = async (payload: any) => {
    await createNewOrder(payload);
    await refreshTables();
  };
  const handleSave = async (orderId: string, payload: any) => {
    await modifyOrder(orderId, payload);
    await refreshTables();
  };
  // Đóng bàn THỦ CÔNG: chỉ set giờ ra (không ép thanh toán).
  const handleCloseTable = async (orderId: string) => {
    await closeTable(orderId);
    await refreshTables();
  };

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
        <Box layoutClassName="flex flex-col gap-1">
          <Heading level={2}>Order theo bàn</Heading>
          <Typography textClassName="text-sm text-slate-500 dark:text-slate-400">
            {occupiedCount}/{tables.length} bàn đang ngồi
          </Typography>
        </Box>
        <Box layoutClassName="flex items-center gap-2">
          <ViewToggle value={view} onChange={(v) => setView(v as 'grid' | 'map')} options={VIEW_OPTIONS} />
          {view === 'map' && (
            <Button
              variant={editMode ? 'primary' : 'secondary'}
              onClick={() => setEditMode((v) => !v)}
              leftIcon={<Pencil className="w-4 h-4" />}
            >
              {editMode ? 'Xong' : 'Sửa sơ đồ'}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setManaging(true)}
            leftIcon={<Settings2 className="w-4 h-4" />}
          >
            Quản lý bàn
          </Button>
          <Button
            variant="ghost"
            onClick={() => refreshTables()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Làm mới
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center">
          <Spinner size="lg" />
        </Box>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="w-6 h-6" />}
          title="Chưa có bàn"
          description="Bấm “Quản lý bàn” để thêm bàn."
        />
      ) : view === 'grid' ? (
        <Box layoutClassName="flex-1 overflow-y-auto">
          <TableGrid tables={tables} onTableClick={openTable} />
        </Box>
      ) : (
        <Box layoutClassName="flex flex-col gap-2">
          <Box layoutClassName="flex items-center gap-3 text-xs">
            <Box layoutClassName="flex items-center gap-1.5">
              <Box layoutClassName="w-3 h-3" backgroundClassName="bg-emerald-400" roundedClassName="rounded" />
              <Typography textClassName="text-slate-500 dark:text-slate-400">Trống</Typography>
            </Box>
            <Box layoutClassName="flex items-center gap-1.5">
              <Box layoutClassName="w-3 h-3" backgroundClassName="bg-amber-400" roundedClassName="rounded" />
              <Typography textClassName="text-slate-500 dark:text-slate-400">Đang ngồi</Typography>
            </Box>
            <Typography textClassName="text-slate-400 dark:text-slate-500">
              {editMode ? '· Kéo-thả bàn để đổi vị trí' : '· Bấm vào bàn để order'}
            </Typography>
          </Box>
          <Box layoutClassName="max-w-3xl">
            <FloorMap
              tables={tables}
              editMode={editMode}
              onTableClick={openTable}
              onMoveTable={handleMove}
            />
          </Box>
        </Box>
      )}

      <TableOrderPanel
        isOpen={orderPanelOpen}
        table={selected}
        products={products}
        onClose={() => setOrderPanelOpen(false)}
        onCreate={handleCreate}
        onSave={handleSave}
        onCloseTable={handleCloseTable}
      />

      <TableManagePanel
        isOpen={managing}
        tables={tables}
        onClose={() => setManaging(false)}
        onCreate={createTable}
        onUpdate={modifyTable}
        onDelete={removeTable}
      />
    </Box>
  );
};

export default DineInPage;
