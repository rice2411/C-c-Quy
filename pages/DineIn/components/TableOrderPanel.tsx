import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock, CreditCard, DoorClosed, History, Minus, Plus, Save, Users, Utensils, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  DeliveryType, DineInSession, DiningTable, Order, OrderStatus,
  PaymentMethod, PaymentStatus, Product, tableStatus,
} from '@/types';
import { fetchOrder } from '@/services/orderService';
import { fetchTableHistory } from '@/services/tableService';
import { formatVND } from '@/utils/format/currencyUtil';
import ProductPickerModal from '@/pages/Orders/components/ProductPickerModal';
import { fmtTime, fmtDateTime, fmtDuration, useNowTick } from './time';

interface Line {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now()}${Math.round(Math.random() * 1e6)}`;

interface TableOrderPanelProps {
  isOpen: boolean;
  table: DiningTable | null;
  products: Product[];
  onClose: () => void;
  /** Tạo đơn mới cho bàn (mở bàn). */
  onCreate: (payload: any) => Promise<void>;
  /** Lưu thay đổi đơn đang mở (món / số khách / thanh toán). */
  onSave: (orderId: string, payload: any) => Promise<void>;
  /** Đóng bàn thủ công (set giờ ra). */
  onCloseTable: (orderId: string) => Promise<void>;
}

const TableOrderPanel: React.FC<TableOrderPanelProps> = ({
  isOpen, table, products, onClose, onCreate, onSave, onCloseTable,
}) => {
  const now = useNowTick(1000);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [history, setHistory] = useState<DineInSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const occupied = table ? tableStatus(table) === 'occupied' : false;
  const openOrderId = table?.currentOrder?.id ?? null;
  const paid = order?.paymentStatus === PaymentStatus.PAID;

  // Nạp đơn đầy đủ khi mở bàn đang ngồi; reset khi mở bàn trống. Luôn nạp lịch sử.
  useEffect(() => {
    if (!isOpen || !table) return;
    setShowHistory(false);
    fetchTableHistory(table.id).then(setHistory).catch(() => setHistory([]));
    if (occupied && openOrderId) {
      setLoading(true);
      fetchOrder(openOrderId)
        .then((o) => {
          setOrder(o);
          setGuestCount(o?.guestCount ?? table.currentOrder?.guestCount ?? 1);
          setNote(o?.note ?? '');
          setLines((o?.items ?? []).map((it) => ({
            productId: it.productId ?? it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            image: it.image ?? '',
          })));
        })
        .catch(() => toast.error('Không tải được đơn của bàn'))
        .finally(() => setLoading(false));
    } else {
      setOrder(null);
      setGuestCount(1);
      setNote('');
      setLines([]);
    }
  }, [isOpen, table, occupied, openOrderId]);

  const quantities = useMemo(() => {
    const m: Record<string, number> = {};
    lines.forEach((l) => { m[l.productId] = (m[l.productId] ?? 0) + l.quantity; });
    return m;
  }, [lines]);

  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);

  const pickProduct = (p: Product) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1, image: p.image ?? '' }];
    });
  };
  const decProduct = (productId: string) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0));
  };

  const itemsPayload = () =>
    lines.map((l) => ({
      id: genId(), productId: l.productId, name: l.name,
      price: l.price, quantity: l.quantity, image: l.image,
    }));

  const basePayload = () => ({
    customer: order?.customer ?? { name: 'Khách tại quán' },
    items: itemsPayload(),
    deliveryType: DeliveryType.DINE_IN,
    tableId: table?.id,
    guestCount,
    note,
  });

  const handleCreate = async () => {
    if (!table) return;
    if (lines.length === 0) { toast.error('Chọn ít nhất 1 món'); return; }
    setSaving(true);
    try {
      await onCreate({
        ...basePayload(),
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.UNPAID,
        status: OrderStatus.PENDING,
      });
      toast.success(`Đã mở ${table.name}`);
      onClose();
    } catch { toast.error('Mở bàn thất bại'); } finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      await onSave(order.id, { ...basePayload(), status: order.status });
      toast.success('Đã lưu');
      onClose();
    } catch { toast.error('Lưu thất bại'); } finally { setSaving(false); }
  };

  // Thanh toán (đánh dấu PAID) — KHÔNG đóng bàn, bàn vẫn mở.
  const handlePay = async (method: PaymentMethod) => {
    if (!order) return;
    if (lines.length === 0) { toast.error('Chưa có món để thanh toán'); return; }
    setSaving(true);
    try {
      await onSave(order.id, {
        ...basePayload(),
        status: order.status,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: method,
        paidAmount: total,
      });
      setOrder((o) => (o ? { ...o, paymentStatus: PaymentStatus.PAID } : o));
      toast.success(`Đã thu ${formatVND(total)} (${method === PaymentMethod.CASH ? 'tiền mặt' : 'CK'})`);
    } catch { toast.error('Thanh toán thất bại'); } finally { setSaving(false); }
  };

  // Đóng bàn THỦ CÔNG (set giờ ra). Cảnh báo nếu chưa thanh toán.
  const handleClose = async () => {
    if (!order || !table) return;
    if (!paid && !window.confirm('Bàn chưa thanh toán. Vẫn đóng bàn?')) return;
    setSaving(true);
    try {
      await onCloseTable(order.id);
      toast.success(`Đã đóng ${table.name}`);
      onClose();
    } catch { toast.error('Đóng bàn thất bại'); } finally { setSaving(false); }
  };

  if (!table) return null;

  const footer = (
    <Box layoutClassName="flex flex-col gap-3">
      <Box layoutClassName="flex items-center justify-between">
        <Typography textClassName="text-sm text-slate-500 dark:text-slate-400">Tổng tạm tính</Typography>
        <Typography textClassName="text-lg font-bold text-slate-900 dark:text-white">{formatVND(total)}</Typography>
      </Box>
      {occupied && order ? (
        <Box layoutClassName="flex flex-col gap-2">
          <Button variant="secondary" onClick={handleSave} disabled={saving} leftIcon={<Save className="w-4 h-4" />}>
            Lưu thay đổi
          </Button>
          {paid ? (
            <Box
              layoutClassName="flex items-center justify-center gap-2 py-2"
              backgroundClassName="bg-emerald-50 dark:bg-emerald-900/30"
              roundedClassName="rounded-lg"
            >
              <Typography textClassName="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                ✓ Đã thanh toán {formatVND(order.paidAmount ?? total)}
              </Typography>
            </Box>
          ) : (
            <Box layoutClassName="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => handlePay(PaymentMethod.CASH)} disabled={saving} leftIcon={<Wallet className="w-4 h-4" />}>
                Thu tiền mặt
              </Button>
              <Button variant="secondary" onClick={() => handlePay(PaymentMethod.BANKING)} disabled={saving} leftIcon={<CreditCard className="w-4 h-4" />}>
                Thu CK
              </Button>
            </Box>
          )}
          <Button variant="primary" onClick={handleClose} disabled={saving} leftIcon={<DoorClosed className="w-4 h-4" />}>
            Đóng bàn
          </Button>
        </Box>
      ) : (
        <Button variant="primary" onClick={handleCreate} disabled={saving} leftIcon={<Utensils className="w-4 h-4" />}>
          Mở bàn
        </Button>
      )}
    </Box>
  );

  return (
    <>
      <BaseSlidePanel
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="md"
        title={`${table.name} · ${occupied ? 'Đang ngồi' : 'Bàn trống'}`}
        footer={footer}
      >
        {loading ? (
          <Box layoutClassName="flex items-center justify-center py-16"><Spinner size="lg" /></Box>
        ) : (
          <Box layoutClassName="flex flex-col gap-5 p-6">
            {/* Số khách + giờ vào (+ đồng hồ đếm giờ live) */}
            <Box layoutClassName="grid grid-cols-2 gap-3">
              <Box layoutClassName="flex flex-col gap-1">
                <Typography textClassName="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Số khách
                </Typography>
                <Input type="number" min={1} value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))} />
              </Box>
              <Box layoutClassName="flex flex-col gap-1">
                <Typography textClassName="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Giờ vào
                </Typography>
                <Box layoutClassName="flex items-center px-3 h-10"
                  backgroundClassName="bg-slate-50 dark:bg-slate-900" roundedClassName="rounded-lg"
                  borderClassName="border border-slate-200 dark:border-slate-700">
                  <Typography textClassName="text-sm text-slate-700 dark:text-slate-200">
                    {occupied
                      ? `${fmtTime(order?.seatedAt)} · ⏱ ${fmtDuration(order?.seatedAt, now)}`
                      : 'Ngay bây giờ'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Danh sách món */}
            <Box layoutClassName="flex flex-col gap-2">
              <Box layoutClassName="flex items-center justify-between">
                <Typography textClassName="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Món ({lines.length})
                </Typography>
                <Button variant="ghost" onClick={() => setPickerOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                  Thêm món
                </Button>
              </Box>
              {lines.length === 0 ? (
                <EmptyState icon={<Utensils className="w-6 h-6" />} title="Chưa có món"
                  description="Bấm “Thêm món” để chọn sản phẩm." />
              ) : (
                <Box layoutClassName="flex flex-col gap-2">
                  {lines.map((l) => (
                    <Box key={l.productId} layoutClassName="flex items-center gap-3 p-2"
                      backgroundClassName="bg-slate-50 dark:bg-slate-900/50" roundedClassName="rounded-lg">
                      <Box layoutClassName="flex-1 min-w-0">
                        <Typography textClassName="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{l.name}</Typography>
                        <Typography textClassName="text-xs text-slate-500 dark:text-slate-400">{formatVND(l.price)}</Typography>
                      </Box>
                      <Box layoutClassName="flex items-center gap-2">
                        <IconButton variant="ghost" onClick={() => decProduct(l.productId)} label="Giảm">
                          <Minus className="w-4 h-4" />
                        </IconButton>
                        <Typography textClassName="text-sm font-semibold w-6 text-center text-slate-800 dark:text-slate-100">{l.quantity}</Typography>
                        <IconButton variant="ghost"
                          onClick={() => pickProduct({ id: l.productId, name: l.name, price: l.price, image: l.image } as Product)} label="Tăng">
                          <Plus className="w-4 h-4" />
                        </IconButton>
                      </Box>
                      <Typography textClassName="text-sm font-semibold w-24 text-right text-slate-900 dark:text-white">{formatVND(l.price * l.quantity)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Ghi chú */}
            <Box layoutClassName="flex flex-col gap-1">
              <Typography textClassName="text-xs font-medium text-slate-500 dark:text-slate-400">Ghi chú</Typography>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: ít đường, mang thêm ghế…" />
            </Box>

            {/* Lịch sử vào/ra của bàn */}
            <Box layoutClassName="flex flex-col gap-2">
              <Button variant="ghost" onClick={() => setShowHistory((v) => !v)} leftIcon={<History className="w-4 h-4" />}>
                Lịch sử vào/ra ({history.length})
              </Button>
              {showHistory && (
                history.length === 0 ? (
                  <Typography textClassName="text-xs text-slate-400 dark:text-slate-500 px-1">Chưa có phiên nào.</Typography>
                ) : (
                  <Box layoutClassName="flex flex-col gap-1.5">
                    {history.map((s) => {
                      const open = !s.leftAt;
                      const sPaid = s.paymentStatus === PaymentStatus.PAID;
                      return (
                        <Box key={s.id} layoutClassName="flex items-center gap-2 p-2"
                          backgroundClassName="bg-slate-50 dark:bg-slate-900/50" roundedClassName="rounded-lg">
                          <Box layoutClassName="flex-1 min-w-0">
                            <Typography textClassName="text-xs font-medium text-slate-700 dark:text-slate-200">
                              {fmtDateTime(s.seatedAt)} → {open ? 'đang ngồi' : fmtTime(s.leftAt)}
                            </Typography>
                            <Typography textClassName="text-[11px] text-slate-500 dark:text-slate-400">
                              {fmtDuration(s.seatedAt, open ? now : (s.leftAt ? new Date(s.leftAt).getTime() : undefined))}
                              {' · '}{s.guestCount ?? '—'} khách · {s.itemCount} món
                            </Typography>
                          </Box>
                          <Box layoutClassName="flex flex-col items-end gap-0.5">
                            <Typography textClassName="text-xs font-semibold text-slate-900 dark:text-white">{formatVND(s.total)}</Typography>
                            <Badge size="sm"
                              backgroundClassName={sPaid ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700'}
                              textClassName={sPaid ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}
                              borderClassName={sPaid ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-600'}>
                              {sPaid ? 'Đã TT' : 'Chưa TT'}
                            </Badge>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )
              )}
            </Box>
          </Box>
        )}
      </BaseSlidePanel>

      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        products={products}
        currentQuantities={quantities}
        onPickProduct={pickProduct}
        onDecrementProduct={decProduct}
      />
    </>
  );
};

export default TableOrderPanel;
