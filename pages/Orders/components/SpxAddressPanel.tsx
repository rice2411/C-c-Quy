import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Sparkles, Pencil, Check, X } from 'lucide-react';
import { Order } from '@/types';
import { SpxAddressStatus, spxAddressStatusLabel } from '@/types/order';
import {
  resolveOrderSpx,
  setOrderSpxAddress,
  fetchSpxOldCatalog,
  SpxOldCatalog,
} from '@/services/orderService';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Label from '@/components/ui/Label';

interface Props {
  order: Order;
  /** Gọi khi lưu/làm mịn thành công, truyền order mới để màn ngoài cập nhật cache. */
  onUpdated: (order: Order) => void;
}

/** Màu badge theo trạng thái làm mịn. */
const statusStyle: Record<SpxAddressStatus | 'none', { bg: string; text: string; border: string }> = {
  matched: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  partial: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  unmatched: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  none: {
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

/**
 * Khối "Địa chỉ SPX (đã làm mịn)" ở chi tiết đơn ship tỉnh: hiện Tỉnh/Quận/Xã đã resolve +
 * trạng thái, nút "Làm mịn lại" (chạy AI), và cho sửa tay bằng dropdown danh mục 3 cấp cũ.
 */
const SpxAddressPanel: React.FC<Props> = ({ order, onUpdated }) => {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [catalog, setCatalog] = useState<SpxOldCatalog | null>(null);
  const [state, setState] = useState(order.spxState ?? '');
  const [city, setCity] = useState(order.spxCity ?? '');
  const [ward, setWard] = useState(order.spxWard ?? '');

  // Đồng bộ lại state khi order (bản resolve) đổi từ ngoài.
  useEffect(() => {
    setState(order.spxState ?? '');
    setCity(order.spxCity ?? '');
    setWard(order.spxWard ?? '');
  }, [order.spxState, order.spxCity, order.spxWard]);

  const st = statusStyle[order.spxStatus ?? 'none'];
  const cities = useMemo(
    () => (catalog && state ? catalog.citiesByState[state] ?? [] : []),
    [catalog, state],
  );
  const wards = useMemo(
    () => (catalog && city ? catalog.wardsByCity[city] ?? [] : []),
    [catalog, city],
  );

  const openEdit = async () => {
    setEditing(true);
    if (!catalog) {
      try {
        setCatalog(await fetchSpxOldCatalog());
      } catch {
        toast.error('Không tải được danh mục địa chỉ.');
      }
    }
  };

  const handleResolve = async () => {
    setBusy(true);
    try {
      const o = await resolveOrderSpx(order.id, true);
      onUpdated(o);
      toast.success('Đã làm mịn địa chỉ.');
    } catch {
      toast.error('Làm mịn địa chỉ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const o = await setOrderSpxAddress(order.id, { state, city, ward });
      onUpdated(o);
      setEditing(false);
      toast.success('Đã lưu địa chỉ SPX.');
    } catch {
      toast.error('Lưu địa chỉ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const resolvedLine =
    [order.spxWard, order.spxCity, order.spxState].filter(Boolean).join(', ') || 'Chưa làm mịn';

  return (
    <Box
      layoutClassName="space-y-3 rounded-lg p-3"
      borderClassName={`border ${st.border}`}
      backgroundClassName={st.bg}
    >
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Box layoutClassName="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-300" />
          <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-100">
            Địa chỉ SPX
          </Typography>
          <Badge backgroundClassName={st.bg} textClassName={st.text} borderClassName={`border ${st.border}`}>
            {spxAddressStatusLabel(order.spxStatus)}
            {order.spxManual ? ' · sửa tay' : ''}
          </Badge>
        </Box>
      </Box>

      {!editing ? (
        <>
          <Typography as="p" size="sm" textClassName="text-slate-700 dark:text-slate-200">
            {resolvedLine}
          </Typography>
          <Box layoutClassName="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => void handleResolve()}
              disabled={busy}
              variant="secondary"
              leftIcon={<Sparkles />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-3 py-1.5 text-sm"
              roundedClassName="rounded-lg"
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-800"
              textClassName="text-slate-700 dark:text-slate-200"
              layoutClassName="inline-flex items-center gap-1.5"
            >
              Làm mịn lại
            </Button>
            <Button
              type="button"
              onClick={() => void openEdit()}
              disabled={busy}
              variant="secondary"
              leftIcon={<Pencil />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-3 py-1.5 text-sm"
              roundedClassName="rounded-lg"
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-800"
              textClassName="text-slate-700 dark:text-slate-200"
              layoutClassName="inline-flex items-center gap-1.5"
            >
              Sửa tay
            </Button>
          </Box>
        </>
      ) : (
        <Box layoutClassName="space-y-3">
          <Box layoutClassName="space-y-1">
            <Label className="mb-0">Tỉnh/Thành</Label>
            <Select
              value={state}
              searchable
              onChange={(e) => {
                setState(e.target.value);
                setCity('');
                setWard('');
              }}
            >
              <option value="">— Chọn Tỉnh —</option>
              {(catalog?.states ?? []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Box>
          <Box layoutClassName="space-y-1">
            <Label className="mb-0">Quận/Huyện</Label>
            <Select
              value={city}
              searchable
              disabled={!state}
              onChange={(e) => {
                setCity(e.target.value);
                setWard('');
              }}
            >
              <option value="">— Chọn Quận/Huyện —</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Box>
          <Box layoutClassName="space-y-1">
            <Label className="mb-0">Xã/Phường</Label>
            <Select
              value={ward}
              searchable
              disabled={!city}
              onChange={(e) => setWard(e.target.value)}
            >
              <option value="">— Chọn Xã/Phường —</option>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </Box>
          <Box layoutClassName="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy || !state}
              variant="primary"
              leftIcon={<Check />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-3 py-1.5 text-sm"
              roundedClassName="rounded-lg"
              backgroundClassName="bg-primary-600"
              hoverClassName="hover:bg-primary-700"
              textClassName="font-medium text-white"
              layoutClassName="inline-flex items-center gap-1.5"
              disableVariantHover
            >
              Lưu
            </Button>
            <Button
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
              variant="secondary"
              leftIcon={<X />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-3 py-1.5 text-sm"
              roundedClassName="rounded-lg"
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName="bg-white dark:bg-slate-800"
              textClassName="text-slate-700 dark:text-slate-200"
              layoutClassName="inline-flex items-center gap-1.5"
            >
              Huỷ
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SpxAddressPanel;
