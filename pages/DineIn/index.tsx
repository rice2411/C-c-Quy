import React, { useMemo, useState } from 'react';
import { LayoutGrid, Pencil, RefreshCw, Settings2, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@/components/ui/Table';
import { useTables } from '@/hooks/useTables';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { DiningTable, tableStatus, tableStatusLabel } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import FloorMap from './components/FloorMap';
import TableOrderPanel from './components/TableOrderPanel';
import TableManagePanel from './components/TableManagePanel';

const fmtTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

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
  const handleCheckout = async (orderId: string, payload: any) => {
    await modifyOrder(orderId, payload);
    await closeTable(orderId); // set giờ ra + invalidate tables
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
          <Button
            variant={editMode ? 'primary' : 'secondary'}
            onClick={() => setEditMode((v) => !v)}
            leftIcon={<Pencil className="w-4 h-4" />}
          >
            {editMode ? 'Xong' : 'Sửa sơ đồ'}
          </Button>
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
      ) : (
        <Box layoutClassName="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-5 min-h-0">
          {/* Sơ đồ */}
          <Box layoutClassName="lg:col-span-3 flex flex-col gap-2">
            <Box layoutClassName="flex items-center gap-3 text-xs">
              <Box layoutClassName="flex items-center gap-1.5">
                <Box layoutClassName="w-3 h-3" backgroundClassName="bg-emerald-400" roundedClassName="rounded" />
                <Typography textClassName="text-slate-500 dark:text-slate-400">Trống</Typography>
              </Box>
              <Box layoutClassName="flex items-center gap-1.5">
                <Box layoutClassName="w-3 h-3" backgroundClassName="bg-amber-400" roundedClassName="rounded" />
                <Typography textClassName="text-slate-500 dark:text-slate-400">Đang ngồi</Typography>
              </Box>
              {editMode ? (
                <Typography textClassName="text-slate-400 dark:text-slate-500">
                  · Kéo-thả bàn để đổi vị trí
                </Typography>
              ) : (
                <Typography textClassName="text-slate-400 dark:text-slate-500">
                  · Bấm vào bàn để order
                </Typography>
              )}
            </Box>
            <FloorMap
              tables={tables}
              editMode={editMode}
              onTableClick={openTable}
              onMoveTable={handleMove}
            />
          </Box>

          {/* Bảng danh sách bàn */}
          <Box
            layoutClassName="lg:col-span-2 flex flex-col min-h-0 overflow-hidden"
            backgroundClassName="bg-white dark:bg-slate-800"
            borderClassName="border border-slate-200 dark:border-slate-700"
            roundedClassName="rounded-xl"
          >
            {tables.length === 0 ? (
              <EmptyState
                icon={<LayoutGrid className="w-6 h-6" />}
                title="Chưa có bàn"
                description="Bấm “Quản lý bàn” để thêm bàn."
              />
            ) : (
              <Box layoutClassName="overflow-x-auto">
                <Table>
                  <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                    <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <TableHeaderCell layoutClassName="px-3 py-2.5">Bàn</TableHeaderCell>
                      <TableHeaderCell layoutClassName="px-3 py-2.5">Vào</TableHeaderCell>
                      <TableHeaderCell layoutClassName="px-3 py-2.5">Khách</TableHeaderCell>
                      <TableHeaderCell layoutClassName="px-3 py-2.5">Món</TableHeaderCell>
                      <TableHeaderCell layoutClassName="px-3 py-2.5 text-right">Tổng</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tables.map((t) => {
                      const occupied = tableStatus(t) === 'occupied';
                      const co = t.currentOrder;
                      return (
                        <TableRow
                          key={t.id}
                          stateClassName="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40"
                          onClick={() => openTable(t)}
                        >
                          <TableCell layoutClassName="px-3 py-2.5">
                            <Box layoutClassName="flex items-center gap-2">
                              <Typography textClassName="text-sm font-medium text-slate-800 dark:text-slate-100">
                                {t.name}
                              </Typography>
                              <Badge
                                size="sm"
                                backgroundClassName={
                                  occupied
                                    ? 'bg-amber-100 dark:bg-amber-900/40'
                                    : 'bg-emerald-100 dark:bg-emerald-900/40'
                                }
                                textClassName={
                                  occupied
                                    ? 'text-amber-700 dark:text-amber-300'
                                    : 'text-emerald-700 dark:text-emerald-300'
                                }
                                borderClassName={
                                  occupied
                                    ? 'border-amber-200 dark:border-amber-800'
                                    : 'border-emerald-200 dark:border-emerald-800'
                                }
                              >
                                {tableStatusLabel(tableStatus(t))}
                              </Badge>
                            </Box>
                          </TableCell>
                          <TableCell layoutClassName="px-3 py-2.5">
                            <Typography textClassName="text-sm text-slate-600 dark:text-slate-300">
                              {occupied ? fmtTime(co?.seatedAt) : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell layoutClassName="px-3 py-2.5">
                            <Typography textClassName="text-sm text-slate-600 dark:text-slate-300">
                              {occupied ? co?.guestCount ?? '—' : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell layoutClassName="px-3 py-2.5">
                            <Typography textClassName="text-sm text-slate-600 dark:text-slate-300">
                              {occupied ? co?.itemCount ?? 0 : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell layoutClassName="px-3 py-2.5 text-right">
                            <Typography textClassName="text-sm font-semibold text-slate-900 dark:text-white">
                              {occupied ? formatVND(co?.total ?? 0) : '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
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
        onCheckout={handleCheckout}
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
