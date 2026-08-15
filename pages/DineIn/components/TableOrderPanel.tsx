import React, { useEffect, useMemo, useState } from 'react';
import { Clock, CreditCard, LogOut, Plus, Minus, Save, Users, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  DeliveryType,
  DiningTable,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  tableStatus,
} from '@/types';
import { fetchOrder } from '@/services/orderService';
import { formatVND } from '@/utils/format/currencyUtil';
import ProductPickerModal from '@/pages/Orders/components/ProductPickerModal';

/** 1 dòng món trong đơn bàn (rút gọn từ OrderItem cho POS tại chỗ). */
interface Line {
  productId: string;
  name: string;
  price: number; // VND
  quantity: number;
  image: string;
}

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now()}${Math.round(Math.random() * 1e6)}`;

const fmtTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

interface TableOrderPanelProps {
  isOpen: boolean;
  table: DiningTable | null;
  products: Product[];
  onClose: () => void;
  /** Tạo đơn mới cho bàn (trả về khi xong để cha refresh). */
  onCreate: (payload: any) => Promise<void>;
  /** Lưu thay đổi (món/số khách) cho đơn đang mở. */
  onSave: (orderId: string, payload: any) => Promise<void>;
  /** Thanh toán + đóng bàn. */
  onCheckout: (orderId: string, payload: any) => Promise<void>;
}

const TableOrderPanel: React.FC<TableOrderPanelProps> = ({
  isOpen,
  table,
  products,
  onClose,
  onCreate,
  onSave,
  onCheckout,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null); // đơn đang mở (khi occupied)
  const [guestCount, setGuestCount] = useState(1);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const occupied = table ? tableStatus(table) === 'occupied' : false;
  const openOrderId = table?.currentOrder?.id ?? null;

  // Nạp đơn đầy đủ khi mở bàn đang ngồi; reset khi mở bàn trống.
  useEffect(() => {
    if (!isOpen || !table) return;
    if (occupied && openOrderId) {
      setLoading(true);
      fetchOrder(openOrderId)
        .then((o) => {
          setOrder(o);
          setGuestCount(o?.guestCount ?? table.currentOrder?.guestCount ?? 1);
          setNote(o?.note ?? '');
          setLines(
            (o?.items ?? []).map((it) => ({
              productId: it.productId ?? it.id,
              name: it.name,
              price: it.price,
              quantity: it.quantity,
              image: it.image ?? '',
            })),
          );
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
    lines.forEach((l) => {
      m[l.productId] = (m[l.productId] ?? 0) + l.quantity;
    });
    return m;
  }, [lines]);

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.price * l.quantity, 0),
    [lines],
  );

  const pickProduct = (p: Product) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, price: p.price, quantity: 1, image: p.image ?? '' },
      ];
    });
  };
  const decProduct = (productId: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const itemsPayload = () =>
    lines.map((l) => ({
      id: genId(),
      productId: l.productId,
      name: l.name,
      price: l.price,
      quantity: l.quantity,
      image: l.image,
    }));

  const handleCreate = async () => {
    if (!table) return;
    if (lines.length === 0) {
      toast.error('Chọn ít nhất 1 món');
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        customer: { name: 'Khách tại quán' },
        items: itemsPayload(),
        deliveryType: DeliveryType.DINE_IN,
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.UNPAID,
        status: OrderStatus.PENDING,
        tableId: table.id,
        guestCount,
        note,
      });
      toast.success(`Đã mở ${table.name}`);
      onClose();
    } catch {
      toast.error('Mở bàn thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!table || !order) return;
    setSaving(true);
    try {
      await onSave(order.id, {
        customer: order.customer,
        items: itemsPayload(),
        status: order.status,
        deliveryType: DeliveryType.DINE_IN,
        tableId: table.id,
        guestCount,
        note,
      });
      toast.success('Đã lưu');
      onClose();
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async (method: PaymentMethod) => {
    if (!table || !order) return;
    if (lines.length === 0) {
      toast.error('Chưa có món để thanh toán');
      return;
    }
    setSaving(true);
    try {
      await onCheckout(order.id, {
        customer: order.customer,
        items: itemsPayload(),
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: method,
        paidAmount: total,
        deliveryType: DeliveryType.DINE_IN,
        tableId: table.id,
        guestCount,
        note,
      });
      toast.success(`Thanh toán ${formatVND(total)} · đóng ${table.name}`);
      onClose();
    } catch {
      toast.error('Thanh toán thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (!table) return null;

  const footer = (
    <Box layoutClassName="flex flex-col gap-3">
      <Box layoutClassName="flex items-center justify-between">
        <Typography textClassName="text-sm text-slate-500 dark:text-slate-400">
          Tổng tạm tính
        </Typography>
        <Typography textClassName="text-lg font-bold text-slate-900 dark:text-white">
          {formatVND(total)}
        </Typography>
      </Box>
      {occupied && order ? (
        <Box layoutClassName="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Lưu thay đổi
          </Button>
          <Box layoutClassName="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              onClick={() => handleCheckout(PaymentMethod.CASH)}
              disabled={saving}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Tiền mặt · đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => handleCheckout(PaymentMethod.BANKING)}
              disabled={saving}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              Chuyển khoản · đóng
            </Button>
          </Box>
        </Box>
      ) : (
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={saving}
          leftIcon={<Utensils className="w-4 h-4" />}
        >
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
          <Box layoutClassName="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </Box>
        ) : (
          <Box layoutClassName="flex flex-col gap-5 p-6">
            {/* Số khách + giờ vào */}
            <Box layoutClassName="grid grid-cols-2 gap-3">
              <Box layoutClassName="flex flex-col gap-1">
                <Typography textClassName="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Số khách
                </Typography>
                <Input
                  type="number"
                  min={1}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
                />
              </Box>
              <Box layoutClassName="flex flex-col gap-1">
                <Typography textClassName="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Giờ vào
                </Typography>
                <Box
                  layoutClassName="flex items-center px-3 h-10"
                  backgroundClassName="bg-slate-50 dark:bg-slate-900"
                  roundedClassName="rounded-lg"
                  borderClassName="border border-slate-200 dark:border-slate-700"
                >
                  <Typography textClassName="text-sm text-slate-700 dark:text-slate-200">
                    {occupied ? fmtTime(order?.seatedAt) : 'Ngay bây giờ'}
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
                <Button
                  variant="ghost"
                  onClick={() => setPickerOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Thêm món
                </Button>
              </Box>

              {lines.length === 0 ? (
                <EmptyState
                  icon={<Utensils className="w-6 h-6" />}
                  title="Chưa có món"
                  description="Bấm “Thêm món” để chọn sản phẩm."
                />
              ) : (
                <Box layoutClassName="flex flex-col gap-2">
                  {lines.map((l) => (
                    <Box
                      key={l.productId}
                      layoutClassName="flex items-center gap-3 p-2"
                      backgroundClassName="bg-slate-50 dark:bg-slate-900/50"
                      roundedClassName="rounded-lg"
                    >
                      <Box layoutClassName="flex-1 min-w-0">
                        <Typography textClassName="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {l.name}
                        </Typography>
                        <Typography textClassName="text-xs text-slate-500 dark:text-slate-400">
                          {formatVND(l.price)}
                        </Typography>
                      </Box>
                      <Box layoutClassName="flex items-center gap-2">
                        <IconButton
                          variant="ghost"
                          onClick={() => decProduct(l.productId)}
                          label="Giảm"
                        >
                          <Minus className="w-4 h-4" />
                        </IconButton>
                        <Typography textClassName="text-sm font-semibold w-6 text-center text-slate-800 dark:text-slate-100">
                          {l.quantity}
                        </Typography>
                        <IconButton
                          variant="ghost"
                          onClick={() => pickProduct({ id: l.productId, name: l.name, price: l.price, image: l.image } as Product)}
                          label="Tăng"
                        >
                          <Plus className="w-4 h-4" />
                        </IconButton>
                      </Box>
                      <Typography textClassName="text-sm font-semibold w-24 text-right text-slate-900 dark:text-white">
                        {formatVND(l.price * l.quantity)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Ghi chú */}
            <Box layoutClassName="flex flex-col gap-1">
              <Typography textClassName="text-xs font-medium text-slate-500 dark:text-slate-400">
                Ghi chú
              </Typography>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: ít đường, mang thêm ghế…"
              />
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
