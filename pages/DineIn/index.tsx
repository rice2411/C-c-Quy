import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Map as MapIcon, Pencil, RefreshCw, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ViewToggle from '@/components/ui/ViewToggle';
import Tabs from '@/components/ui/Tabs';
import { useTables } from '@/hooks/useTables';
import { useOrders } from '@/hooks/useOrders';
import {
  DeliveryType, DiningTable, Order, OrderStatus, PaymentMethod, PaymentStatus,
  tableStatus, tableOpenOrders,
} from '@/types';
import OrderForm from '@/pages/Orders/components/modals/OrderForm';
import { getNextOrderNumber, fetchOrder } from '@/services/orderService';
import FloorMap from './components/FloorMap';
import TableGrid from './components/TableGrid';
import TableStatusPanel from './components/TableStatusPanel';
import TableManagePanel from './components/TableManagePanel';
import DineInHistory from './components/DineInHistory';

const VIEW_OPTIONS = [
  { id: 'grid', Icon: LayoutGrid, title: 'Lưới thẻ bàn' },
  { id: 'map', Icon: MapIcon, title: 'Sơ đồ quán' },
];

const TAB_ITEMS = [
  { id: 'tables', label: 'Bàn' },
  { id: 'history', label: 'Lịch sử bàn' },
];

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** initialData seed cho OrderForm khi MỞ BÀN (đơn tại quán mới). */
const dineInSeed = (): any => ({
  customer: { name: 'Khách tại quán', phone: '', address: '' },
  items: [],
  deliveryType: DeliveryType.DINE_IN,
  deliveryDate: todayStr(), // OrderForm bắt buộc ngày nhận — dine-in lấy hôm nay
  status: OrderStatus.PENDING,
  paymentStatus: PaymentStatus.UNPAID,
  paymentMethod: PaymentMethod.CASH,
});

const DineInPage: React.FC = () => {
  const { tables, loading, refreshTables, createTable, modifyTable, removeTable, closeTable } = useTables();
  const { createNewOrder, modifyOrder } = useOrders();

  const [tab, setTab] = useState<'tables' | 'history'>('tables');
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [editMode, setEditMode] = useState(false);
  const [managing, setManaging] = useState(false);

  // Panel trạng thái (bàn đang ngồi) — giữ theo ID để bám dữ liệu bàn mới nhất.
  const [statusTableId, setStatusTableId] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusTable = statusTableId ? tables.find((t) => t.id === statusTableId) ?? null : null;

  // OrderForm (tạo/sửa đơn của bàn)
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Order | null>(null);
  const [formEditId, setFormEditId] = useState<string | null>(null);
  const [formTableId, setFormTableId] = useState<string | null>(null);

  const occupiedCount = useMemo(
    () => tables.filter((t) => tableStatus(t) === 'occupied').length,
    [tables],
  );

  // Bàn đóng hết đơn → tự đóng panel trạng thái.
  useEffect(() => {
    if (statusOpen && statusTable && tableOpenOrders(statusTable).length === 0) {
      setStatusOpen(false);
    }
  }, [statusOpen, statusTable]);

  // Mở OrderForm TẠO đơn mới cho 1 bàn (mở bàn / thêm đơn vào bàn).
  const openCreateForm = async (tableId: string) => {
    setFormEditId(null);
    setFormTableId(tableId);
    let orderNumber: string | undefined;
    try { orderNumber = await getNextOrderNumber(); } catch { /* fallback N/A trong form */ }
    setFormInitial({ ...dineInSeed(), orderNumber });
    setFormOpen(true);
  };

  // Click bàn: trống → tạo đơn (mở bàn); đang ngồi → panel trạng thái (danh sách đơn).
  const openTable = (t: DiningTable) => {
    if (tableStatus(t) === 'occupied') {
      setStatusTableId(t.id);
      setStatusOpen(true);
    } else {
      void openCreateForm(t.id);
    }
  };

  // Sửa 1 đơn cụ thể của bàn (từ panel trạng thái) — nạp đơn đầy đủ rồi mở OrderForm.
  const editOrderById = async (orderId: string) => {
    try {
      const order = await fetchOrder(orderId);
      if (!order) { toast.error('Không tải được đơn'); return; }
      setFormInitial(order);
      setFormEditId(order.id);
      setFormTableId(order.tableId ?? statusTableId);
      setFormOpen(true);
    } catch {
      toast.error('Không tải được đơn');
    }
  };

  const handleFormSave = async (data: any) => {
    const payload = { ...data, deliveryType: DeliveryType.DINE_IN, tableId: formTableId };
    if (formEditId) {
      await modifyOrder(formEditId, payload);
      toast.success('Đã lưu đơn');
    } else {
      delete payload.orderNumber; // để BE tự sinh số đơn
      payload.seatedAt = new Date().toISOString();
      await createNewOrder(payload);
      toast.success('Đã thêm đơn vào bàn');
    }
    await refreshTables();
    setFormOpen(false);
  };

  const handleCloseOrder = async (orderId: string) => {
    await closeTable(orderId);
    await refreshTables();
  };
  const handleMove = async (id: string, posX: number, posY: number) => {
    try { await modifyTable(id, { posX, posY }); }
    catch { toast.error('Không lưu được vị trí bàn'); }
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
        {tab === 'tables' && (
          <Box layoutClassName="flex items-center gap-2">
            <ViewToggle value={view} onChange={(v) => setView(v as 'grid' | 'map')} options={VIEW_OPTIONS} />
            {view === 'map' && (
              <Button variant={editMode ? 'primary' : 'secondary'} onClick={() => setEditMode((v) => !v)}
                leftIcon={<Pencil className="w-4 h-4" />}>
                {editMode ? 'Xong' : 'Sửa sơ đồ'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setManaging(true)} leftIcon={<Settings2 className="w-4 h-4" />}>
              Quản lý bàn
            </Button>
            <Button variant="ghost" onClick={() => refreshTables()} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Làm mới
            </Button>
          </Box>
        )}
      </Box>

      <Tabs items={TAB_ITEMS} value={tab} onChange={(v) => setTab(v as 'tables' | 'history')} />

      {tab === 'history' ? (
        <DineInHistory active={tab === 'history'} />
      ) : loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center"><Spinner size="lg" /></Box>
      ) : tables.length === 0 ? (
        <EmptyState icon={<LayoutGrid className="w-6 h-6" />} title="Chưa có bàn"
          description="Bấm “Quản lý bàn” để thêm bàn." />
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
            <FloorMap tables={tables} editMode={editMode} onTableClick={openTable} onMoveTable={handleMove} />
          </Box>
        </Box>
      )}

      {/* OrderForm thật của trang Order — tạo/sửa đơn cho bàn */}
      <OrderForm
        isOpen={formOpen}
        initialData={formInitial}
        onSave={handleFormSave}
        onCancel={() => setFormOpen(false)}
      />

      {/* Trạng thái bàn đang ngồi — danh sách đơn + thêm đơn */}
      <TableStatusPanel
        isOpen={statusOpen}
        table={statusTable}
        onClose={() => setStatusOpen(false)}
        onAddOrder={() => statusTableId && void openCreateForm(statusTableId)}
        onEditOrder={editOrderById}
        onCloseOrder={handleCloseOrder}
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
