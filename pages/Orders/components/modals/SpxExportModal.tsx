import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PackageCheck } from 'lucide-react';
import { Order } from '@/types';
import { exportOrdersToSpx, isSpxShippable, codRemaining, ResolvedAddress, SpxAddressMode } from '@/utils/order/spxOrderExport';
import { resolveSpxOldAddresses } from '@/services/orderService';
import { resolveSpxAddresses } from '@/utils/order/spxAddressMatch';
import { getOrderTotal } from '@/utils/order/orderUtils';
import { formatVND } from '@/utils/format/currencyUtil';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Typography from '@/components/ui/Typography';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Toàn bộ danh sách đơn (tự lọc đơn cần tạo VĐ bên trong). */
  orders: Order[];
}

const SpxExportModal: React.FC<Props> = ({ isOpen, onClose, orders }) => {
  const [weight, setWeight] = useState('1');
  // Mặc định 'old' — SPX chỉ đọc sheet ĐẦU "Tạo đơn (địa chỉ cũ)"; để data ở sheet "mới" (sheet2) → SPX đọc sheet đầu trống → fail.
  const [addressMode, setAddressMode] = useState<SpxAddressMode>('old');
  const useAi = true; // luôn dùng AI tách địa chỉ (không cho tắt).
  const [busy, setBusy] = useState(false);

  const eligible = useMemo(() => orders.filter(isSpxShippable), [orders]);
  const totalCod = useMemo(() => eligible.reduce((s, o) => s + codRemaining(o), 0), [eligible]);
  const totalValue = useMemo(() => eligible.reduce((s, o) => s + getOrderTotal(o), 0), [eligible]);

  const handleExport = async () => {
    if (eligible.length === 0) return;
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) {
      toast.error('Cân nặng mặc định phải là số dương (KG).');
      return;
    }
    setBusy(true);
    const loadingId = toast.loading(useAi ? 'Đang tách địa chỉ (rule + AI)…' : 'Đang tách địa chỉ…');
    try {
      let resolved: ResolvedAddress[];
      let filled: number;
      let label: string;
      if (addressMode === 'old') {
        // Hệ CŨ 3 cấp (BE, danh mục spx_*_old + AI): Tỉnh + Quận/Huyện + Xã/Phường.
        const addrs = eligible.map((o) =>
          [o.customer.address, o.customer.city].filter(Boolean).join(', '),
        );
        const old = await resolveSpxOldAddresses(addrs, useAi);
        resolved = old.map((r) => ({ state: r.state, city: r.city, ward: r.ward }));
        filled = old.filter((r) => r.state && r.city && r.ward).length;
        label = 'Tỉnh+Quận+Xã';
      } else {
        // Hệ MỚI 2 cấp (danh mục 2025 + AI): Tỉnh + Phường/Xã (KHÔNG Quận).
        const nw = await resolveSpxAddresses(eligible, useAi);
        resolved = nw.map((r) => ({ province: r.province, ward: r.ward }));
        filled = nw.filter((r) => r.province && r.ward).length;
        label = 'Tỉnh+Phường/Xã';
      }
      if (loadingId) toast.dismiss(loadingId);
      const n = await exportOrdersToSpx(eligible, { weightKg: w, addressMode, resolved });
      toast.success(`Đã xuất ${n} đơn · điền đủ ${label} ${filled}/${n}`);
      onClose();
    } catch (err) {
      if (loadingId) toast.dismiss(loadingId);
      toast.error(err instanceof Error ? err.message : 'Xuất file thất bại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Xuất file tạo đơn hàng loạt SPX" size="lg">
      <Box layoutClassName="space-y-4">
        <Typography as="p" size="sm" variant="muted">
          Xuất các đơn <b>cần tạo vận đơn</b> (giao ship, chưa có mã vận đơn, chưa huỷ/giao) ra file
          Excel đúng cột template SPX. Số tiền COD = <b>còn lại phải thu</b> (tổng đơn − đã trả) nên đơn
          đã cọc chỉ thu phần còn thiếu.
        </Typography>

        <Box
          layoutClassName="flex flex-wrap gap-x-6 gap-y-1 rounded-lg px-3 py-2.5"
          borderClassName="border border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-slate-50 dark:bg-slate-800/60"
        >
          <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">
            Đơn đủ điều kiện: <b>{eligible.length}</b>
          </Typography>
          <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">
            Tổng giá trị: <b>{formatVND(totalValue)}</b>
          </Typography>
          <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">
            Tổng COD cần thu: <b>{formatVND(totalCod)}</b>
          </Typography>
        </Box>

        {/* Chọn định dạng địa chỉ */}
        <Box layoutClassName="flex flex-wrap items-center gap-3">
          <Label className="mb-0">Định dạng địa chỉ</Label>
          <Box layoutClassName="inline-flex gap-1.5">
            <Button
              type="button"
              onClick={() => setAddressMode('new')}
              variant={addressMode === 'new' ? 'primary' : 'secondary'}
              sizeClassName="px-3 py-1.5 text-sm"
              roundedClassName="rounded-lg"
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName={addressMode === 'new' ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
              textClassName={addressMode === 'new' ? 'font-medium text-white' : 'text-slate-700 dark:text-slate-200'}
              disableVariantHover
              disableVariantTextColor
            >
              Địa chỉ mới (2 cấp)
            </Button>
            <Button
              type="button"
              onClick={() => setAddressMode('old')}
              variant={addressMode === 'old' ? 'primary' : 'secondary'}
              sizeClassName="px-3 py-1.5 text-sm"
              roundedClassName="rounded-lg"
              borderClassName="border border-slate-200 dark:border-slate-600"
              backgroundClassName={addressMode === 'old' ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
              textClassName={addressMode === 'old' ? 'font-medium text-white' : 'text-slate-700 dark:text-slate-200'}
              disableVariantHover
              disableVariantTextColor
            >
              Địa chỉ cũ (3 cấp)
            </Button>
          </Box>
        </Box>

        {/* Cân nặng mặc định */}
        <Box layoutClassName="flex items-center gap-3">
          <Label htmlFor="spx-weight" className="mb-0">
            Cân nặng mặc định (KG)
          </Label>
          <Input
            id="spx-weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min="0.1"
            step="0.1"
            inputMode="decimal"
            sizeClassName="w-24 px-3 py-1.5 text-sm"
            borderClassName="border border-slate-200 dark:border-slate-600"
            roundedClassName="rounded-lg"
          />
        </Box>

        <Box layoutClassName="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            sizeClassName="px-4 py-2 text-sm"
            roundedClassName="rounded-lg"
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-white dark:bg-slate-800"
          >
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={() => void handleExport()}
            disabled={busy || eligible.length === 0}
            variant="primary"
            leftIcon={<PackageCheck />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            backgroundClassName="bg-primary-600"
            hoverClassName="hover:bg-primary-700"
            textClassName="font-medium text-white"
            sizeClassName="px-4 py-2 text-sm"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
          >
            {eligible.length === 0 ? 'Không có đơn' : `Tải file (${eligible.length} đơn)`}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
};

export default SpxExportModal;
