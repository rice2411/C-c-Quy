import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import type { ImportedSupplierSummary } from '@/types/billReceipt';
import { useStockReceiptMutations } from '@/hooks/queries/useStockReceiptQuery';
import { formatDateISO } from '@/utils/format/dateUtil';

interface FormState {
  name: string;
  phone: string;
  contactPerson: string;
  email: string;
  taxCode: string;
  address: string;
  category: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  name: '',
  phone: '',
  contactPerson: '',
  email: '',
  taxCode: '',
  address: '',
  category: '',
  notes: '',
});

const fromSupplier = (s: ImportedSupplierSummary): FormState => ({
  name: s.name || '',
  phone: s.phone || '',
  contactPerson: s.contactPerson || '',
  email: s.email || '',
  taxCode: s.taxCode || '',
  address: s.address || '',
  category: s.category || '',
  notes: s.notes || '',
});

const moneyFmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

export interface SupplierEditModalProps {
  open: boolean;
  supplier: ImportedSupplierSummary | null;
  onClose: () => void;
  onSaved: () => void;
}

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  layoutClassName?: string;
}> = ({ label, value, onChange, placeholder, layoutClassName }) => (
  <Box layoutClassName={layoutClassName ?? 'space-y-1'}>
    <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase tracking-wide">
      {label}
    </Typography>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </Box>
);

const SupplierEditModal: React.FC<SupplierEditModalProps> = ({
  open,
  supplier,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const { updateSupplierInfo } = useStockReceiptMutations();

  useEffect(() => {
    if (supplier) setForm(fromSupplier(supplier));
    else setForm(emptyForm());
  }, [supplier]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, saving]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !supplier) return null;

  const setField = <K extends keyof FormState>(k: K, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error('Tên NCC không được rỗng.');
      return;
    }
    setSaving(true);
    try {
      await updateSupplierInfo({
        id: supplier.id,
        patch: {
          name,
          phone: form.phone,
          contactPerson: form.contactPerson,
          email: form.email,
          taxCode: form.taxCode,
          address: form.address,
          category: form.category,
          notes: form.notes,
        },
      });
      toast.success('Đã cập nhật nhà cung cấp');
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Lưu thất bại: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const tree = (
    <Box
      layoutClassName="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 sm:p-6"
      backgroundClassName="bg-slate-900/60"
      onClick={() => !saving && onClose()}
    >
      <Card
        padding="none"
        borderClassName="border-slate-200 dark:border-slate-700"
        layoutClassName="w-full max-w-2xl my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          layoutClassName="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-3"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-900"
        >
          <Box>
            <Typography size="sm" layoutClassName="font-semibold">
              Sửa nhà cung cấp
            </Typography>
            <Typography size="xs" variant="muted">
              Field để trống = xoá field đó. Tên đổi sẽ tự cập nhật khóa dedupe.
            </Typography>
          </Box>
          <Button
            type="button"
            aria-label="Đóng"
            disabled={saving}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            <X className="h-5 w-5" />
          </Button>
        </Box>

        <Box layoutClassName="space-y-4 p-4 sm:p-5">
          {/* Read-only stats */}
          <Box
            layoutClassName="flex flex-wrap items-center gap-3 rounded-lg p-3 text-xs"
            backgroundClassName="bg-slate-50 dark:bg-slate-800/60"
            borderClassName="border border-slate-200 dark:border-slate-700"
          >
            <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
              Lịch sử nhập:
            </Typography>
            <Typography size="xs" layoutClassName="font-semibold">
              {supplier.receiptCount} phiếu
            </Typography>
            <Typography size="xs" textClassName="text-slate-400">·</Typography>
            <Typography size="xs" layoutClassName="font-semibold">
              {moneyFmt.format(supplier.totalAmount)}đ
            </Typography>
            {supplier.lastReceiptDate ? (
              <>
                <Typography size="xs" textClassName="text-slate-400">·</Typography>
                <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
                  lần cuối {formatDateISO(supplier.lastReceiptDate)}
                </Typography>
              </>
            ) : null}
          </Box>

          <Field
            label="Tên nhà cung cấp *"
            value={form.name}
            onChange={(v) => setField('name', v)}
            placeholder="Tên hiển thị"
          />

          <Box layoutClassName="grid gap-3 sm:grid-cols-2">
            <Field
              label="Số điện thoại"
              value={form.phone}
              onChange={(v) => setField('phone', v)}
              placeholder="VD: 0901234567"
            />
            <Field
              label="Người liên hệ"
              value={form.contactPerson}
              onChange={(v) => setField('contactPerson', v)}
              placeholder="Tên sale / chủ shop"
            />
            <Field
              label="Email"
              value={form.email}
              onChange={(v) => setField('email', v)}
              placeholder="contact@example.com"
            />
            <Field
              label="MST"
              value={form.taxCode}
              onChange={(v) => setField('taxCode', v)}
              placeholder="Mã số thuế"
            />
            <Field
              label="Địa chỉ"
              value={form.address}
              onChange={(v) => setField('address', v)}
              placeholder="Số nhà, đường, quận, TP"
              layoutClassName="space-y-1 sm:col-span-2"
            />
            <Field
              label="Danh mục"
              value={form.category}
              onChange={(v) => setField('category', v)}
              placeholder="VD: Bột & ngũ cốc"
            />
            <Field
              label="Ghi chú"
              value={form.notes}
              onChange={(v) => setField('notes', v)}
              placeholder="Giá tốt, giao nhanh…"
            />
          </Box>
        </Box>

        <Box
          layoutClassName="sticky bottom-0 flex items-center justify-end gap-2 border-t px-5 py-3"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-900"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            sizeClassName="px-3 py-2"
            disableVariantHover
            disableVariantTextColor
          >
            Huỷ
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSave()}
            disabled={saving}
            leftIcon={
              saving ? (
                <Spinner size="sm" textClassName="text-white" borderClassName="border-white" />
              ) : (
                <Save />
              )
            }
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            layoutClassName="inline-flex items-center gap-2"
            disableVariantHover
            disableVariantTextColor
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </Box>
      </Card>
    </Box>
  );

  return createPortal(tree, document.body);
};

export default SupplierEditModal;
