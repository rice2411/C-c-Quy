/**
 * CoachEditModal — thêm/sửa 1 nhà xe (giống luồng sửa NCC). Trả về coach qua onSave.
 */
import React, { useEffect, useState } from 'react';
import { Bus } from 'lucide-react';
import { Coach } from '@/types/coach';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';

interface Props {
  isOpen: boolean;
  initial: Coach | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (coach: Coach) => void;
}

const EMPTY: Coach = { id: '', name: '', phone: '', route: '', pickupPoint: '', defaultFee: 0, note: '' };

const CoachEditModal: React.FC<Props> = ({ isOpen, initial, saving, onClose, onSave }) => {
  const [draft, setDraft] = useState<Coach>(EMPTY);

  useEffect(() => {
    if (isOpen) setDraft(initial ? { ...initial } : { ...EMPTY });
  }, [isOpen, initial]);

  const set = (patch: Partial<Coach>) => setDraft((p) => ({ ...p, ...patch }));

  const handleSave = () => {
    if (!draft.name.trim()) return;
    onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={initial ? 'Sửa nhà xe' : 'Thêm nhà xe'} size="md">
      <Box layoutClassName="space-y-4">
        <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tên nhà xe" htmlFor="coach-name">
            <Input id="coach-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="VD: Nhà xe Phương Trang" autoFocus leftIcon={<Bus className="h-4 w-4" />} leftIconClassName="[&_svg]:h-4 [&_svg]:w-4" />
          </Field>
          <Field label="SĐT" htmlFor="coach-phone">
            <Input id="coach-phone" value={draft.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} placeholder="09xx xxx xxx" />
          </Field>
          <Field label="Tuyến (bến đi → bến đến)" htmlFor="coach-route">
            <Input id="coach-route" value={draft.route ?? ''} onChange={(e) => set({ route: e.target.value })} placeholder="VD: Bến Miền Đông → Đà Lạt" />
          </Field>
          <Field label="Điểm nhận/gửi hàng" htmlFor="coach-pickup">
            <Input id="coach-pickup" value={draft.pickupPoint ?? ''} onChange={(e) => set({ pickupPoint: e.target.value })} placeholder="VD: Quầy gửi hàng bến xe" />
          </Field>
          <Field label="Phí gửi mặc định (VND)" htmlFor="coach-fee">
            <Input id="coach-fee" type="number" min={0} step={1000} value={draft.defaultFee ?? 0} onChange={(e) => set({ defaultFee: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
          <Field label="Ghi chú" htmlFor="coach-note">
            <Input id="coach-note" value={draft.note ?? ''} onChange={(e) => set({ note: e.target.value })} placeholder="Ghi chú thêm" />
          </Field>
        </Box>

        <Box layoutClassName="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-white dark:bg-slate-800"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
            textClassName="text-sm font-medium text-slate-600 dark:text-slate-300"
            roundedClassName="rounded-lg"
            sizeClassName="px-4 py-2"
          >
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !draft.name.trim()}
            variant="primary"
            disableVariantHover
            disableVariantTextColor
            backgroundClassName="bg-primary-600"
            hoverClassName="hover:bg-primary-700"
            textClassName="text-sm font-semibold text-white"
            roundedClassName="rounded-lg"
            sizeClassName="px-5 py-2"
            stateClassName="transition-colors disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
};

export default CoachEditModal;
