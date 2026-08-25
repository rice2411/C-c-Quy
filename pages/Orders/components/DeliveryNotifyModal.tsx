/**
 * DeliveryNotifyModal — chọn ngày bắt đầu + số ngày trước khi gửi Zalo "đơn cần giao".
 * Trước đây gửi cứng "3 ngày tới tính từ hôm nay"; giờ cho chọn ngày giao + phạm vi.
 */
import React, { useMemo, useState } from 'react';
import { BellRing } from 'lucide-react';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import Select from '@/components/ui/Select';
import Typography from '@/components/ui/Typography';
import DatePicker from '@/components/ui/DatePicker';

interface DeliveryNotifyModalProps {
  open: boolean;
  onClose: () => void;
  /** Gửi với ngày bắt đầu (YYYY-MM-DD) + số ngày gom. */
  onSend: (fromDate: string, days: number) => void;
  sending?: boolean;
}

/** Hôm nay theo giờ máy, định dạng YYYY-MM-DD. */
const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Cộng n ngày vào 1 ngày ISO → nhãn dd/mm/yyyy (để hiện phạm vi kết thúc). */
const addDaysLabel = (iso: string, add: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + add);
  return dt.toLocaleDateString('vi-VN');
};

const DAY_OPTIONS = [1, 2, 3, 5, 7];

const DeliveryNotifyModal: React.FC<DeliveryNotifyModalProps> = ({ open, onClose, onSend, sending }) => {
  const [fromDate, setFromDate] = useState<string>(todayISO());
  const [days, setDays] = useState<number>(3);

  const rangeText = useMemo(() => {
    if (!fromDate) return '';
    if (days <= 1) return `Chỉ ngày ${addDaysLabel(fromDate, 0)}`;
    return `${addDaysLabel(fromDate, 0)} → ${addDaysLabel(fromDate, days - 1)} (${days} ngày)`;
  }, [fromDate, days]);

  return (
    <BaseModal isOpen={open} onClose={onClose} title="Gửi Zalo: đơn cần giao" size="sm">
      <Box layoutClassName="space-y-4 p-1">
        <Typography as="p" size="sm" textClassName="text-slate-500 dark:text-slate-400">
          Chọn ngày giao bắt đầu và số ngày muốn gom, danh sách đơn cần giao sẽ được gửi qua Zalo.
        </Typography>

        <Box layoutClassName="space-y-1.5">
          <Label>Từ ngày giao</Label>
          <DatePicker value={fromDate} onChange={setFromDate} placeholder="Chọn ngày giao" />
        </Box>

        <Box layoutClassName="space-y-1.5">
          <Label>Số ngày gom</Label>
          <Select value={String(days)} onChange={(e) => setDays(Number(e.target.value) || 1)}>
            {DAY_OPTIONS.map((n) => (
              <option key={n} value={n}>{n === 1 ? '1 ngày' : `${n} ngày`}</option>
            ))}
          </Select>
        </Box>

        {rangeText ? (
          <Box
            layoutClassName="px-3 py-2"
            backgroundClassName="bg-amber-50 dark:bg-amber-900/30"
            roundedClassName="rounded-lg"
            borderClassName="border border-amber-200 dark:border-amber-800"
          >
            <Typography as="p" size="xs" layoutClassName="font-medium" textClassName="text-amber-700 dark:text-amber-300">
              Phạm vi: {rangeText}
            </Typography>
          </Box>
        ) : null}

        <Box layoutClassName="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            backgroundClassName="bg-white dark:bg-slate-800"
            borderClassName="border border-slate-200 dark:border-slate-600"
            textClassName="font-medium text-slate-700 dark:text-slate-200"
            roundedClassName="rounded-xl"
            sizeClassName="px-4 py-2 text-sm"
          >
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={() => fromDate && onSend(fromDate, days)}
            disabled={!fromDate || sending}
            leftIcon={<BellRing />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            backgroundClassName="bg-primary-600"
            hoverClassName="hover:bg-primary-700"
            textClassName="font-medium text-white"
            roundedClassName="rounded-xl"
            sizeClassName="px-4 py-2 text-sm"
            layoutClassName="inline-flex items-center gap-1.5"
            variant="primary"
            disableVariantHover
            disableVariantTextColor
          >
            {sending ? 'Đang gửi…' : 'Gửi Zalo'}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
};

export default DeliveryNotifyModal;
