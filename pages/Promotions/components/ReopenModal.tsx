import React, { useEffect, useState } from 'react';
import DatePicker from '@/components/ui/DatePicker';
import { RotateCcw, X } from 'lucide-react';
import { Promotion } from '@/types/promotion';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import { todayYMD } from '../promotionUtils';

interface ReopenModalProps {
  /** Promo cần mở lại; null = đóng modal. */
  target: Promotion | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (data: { startAt: string | null; endAt: string | null }) => void;
}

const ReopenModal: React.FC<ReopenModalProps> = ({ target, loading, onClose, onConfirm }) => {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  // Mặc định đợt mới bắt đầu hôm nay, để trống ngày kết thúc.
  useEffect(() => {
    if (target) {
      setStartAt(todayYMD());
      setEndAt('');
    }
  }, [target]);

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={onClose} leftIcon={<X className="h-4 w-4" />}>
        Huỷ
      </Button>
      <Button
        variant="primary"
        size="sm"
        disabled={loading}
        onClick={() =>
          onConfirm({
            startAt: startAt ? new Date(startAt).toISOString() : null,
            endAt: endAt ? new Date(endAt).toISOString() : null,
          })
        }
        leftIcon={loading ? <Spinner size="sm" /> : <RotateCcw className="h-4 w-4" />}
      >
        Mở lại
      </Button>
    </>
  );

  return (
    <BaseModal isOpen={!!target} onClose={onClose} title="Mở lại chương trình" size="sm" footer={footer}>
      <Box layoutClassName="space-y-4">
        <Typography as="p" size="sm" textClassName="text-slate-600 dark:text-slate-300">
          Đợt hiện tại của <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{target?.name}</Typography> sẽ được lưu vào lịch sử, lượt dùng đếm lại từ 0 cho đợt mới.
        </Typography>
        <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Bắt đầu đợt mới">
            <DatePicker value={startAt} onChange={setStartAt} fullWidth />
          </Field>
          <Field label="Kết thúc" hint="Bỏ trống = không giới hạn">
            <DatePicker value={endAt} onChange={setEndAt} fullWidth />
          </Field>
        </Box>
      </Box>
    </BaseModal>
  );
};

export default ReopenModal;
