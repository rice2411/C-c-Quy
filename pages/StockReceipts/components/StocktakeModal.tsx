import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { recordStocktake } from '@/services/stockReceiptService';
import { qk } from '@/hooks/queryKeys';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Typography from '@/components/ui/Typography';

interface StocktakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  materialName: string;
  unit: string;
}

/** Ngày LOCAL yyyy-mm-dd. */
const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Nhập kiểm kê tay 1 nguyên liệu (đếm hiện có) → neo lại tồn kho. */
const StocktakeModal: React.FC<StocktakeModalProps> = ({ isOpen, onClose, materialId, materialName, unit }) => {
  const qc = useQueryClient();
  const [qty, setQty] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const q = Number(qty);
    if (!Number.isFinite(q) || q < 0) {
      toast.error('Nhập số lượng hợp lệ');
      return;
    }
    setSaving(true);
    try {
      await recordStocktake(materialId, q, date, note || undefined);
      await qc.invalidateQueries({ queryKey: qk.stockReceipt.stockEstimate });
      toast.success('Đã lưu kiểm kê');
      setQty('');
      setNote('');
      onClose();
    } catch (err) {
      toast.error((err as Error)?.message || 'Lưu kiểm kê thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Kiểm kê: ${materialName}`} size="sm">
      <Box layoutClassName="space-y-3">
        <Typography size="xs" variant="muted">
          Đếm số lượng thực tế đang có → hệ neo tồn kho từ mốc này (tồn = số đếm + nhập sau − tiêu hao sau).
        </Typography>
        <Box>
          <Label htmlFor="stk-qty">Số lượng hiện có ({unit || 'đơn vị'})</Label>
          <Input
            id="stk-qty"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="vd 10"
            roundedClassName="rounded-lg"
          />
        </Box>
        <Box>
          <Label htmlFor="stk-date">Ngày kiểm kê</Label>
          <Input id="stk-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} roundedClassName="rounded-lg" />
        </Box>
        <Box>
          <Label htmlFor="stk-note">Ghi chú (tuỳ chọn)</Label>
          <Input id="stk-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="vd đếm cuối ngày" roundedClassName="rounded-lg" />
        </Box>
        <Box layoutClassName="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} sizeClassName="px-3 py-1.5 text-sm">Huỷ</Button>
          <Button type="button" variant="primary" onClick={handleSave} disabled={saving} sizeClassName="px-4 py-1.5 text-sm" stateClassName="disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu kiểm kê'}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
};

export default StocktakeModal;
