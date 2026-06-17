import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowDown, Check, GitMerge } from 'lucide-react';
import toast from 'react-hot-toast';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

export interface MergeItemDescriptor {
  id: string;
  name: string;
  /** Subtitle hiển thị dưới tên, ví dụ: "5 phiếu · 1.250.000đ" */
  subtitle?: string;
}

export interface MergeItemsModalProps {
  open: boolean;
  /** Loại item — chỉ để display ("nhà cung cấp" / "nguyên liệu"). */
  itemTypeLabel: string;
  items: MergeItemDescriptor[];
  onClose: () => void;
  /** Gọi service merge — throws nếu fail. */
  onConfirm: (rootId: string, duplicateIds: string[]) => Promise<void>;
  /** Sau khi merge xong (success) — parent refresh data. */
  onDone: () => void;
}

const MergeItemsModal: React.FC<MergeItemsModalProps> = ({
  open,
  itemTypeLabel,
  items,
  onClose,
  onConfirm,
  onDone,
}) => {
  const [rootId, setRootId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset selection khi mở modal hoặc items đổi
  useEffect(() => {
    if (open && items.length > 0) {
      setRootId(items[0].id);
    } else if (!open) {
      setRootId(null);
      setSubmitting(false);
    }
  }, [open, items]);

  const root = items.find((i) => i.id === rootId) ?? null;
  const duplicates = items.filter((i) => i.id !== rootId);

  const handleConfirm = async () => {
    if (!rootId || duplicates.length === 0) return;
    setSubmitting(true);
    try {
      await onConfirm(rootId, duplicates.map((d) => d.id));
      toast.success(`Đã gộp ${duplicates.length} ${itemTypeLabel} vào "${root?.name}"`);
      onDone();
      onClose();
    } catch (e: any) {
      console.error('Merge failed:', e);
      toast.error(`Gộp thất bại: ${e?.message || 'Lỗi không xác định'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <BaseModal
      isOpen={open}
      onClose={() => !submitting && onClose()}
      title={
        <span className="flex items-center gap-2">
          <GitMerge className="h-5 w-5 text-primary-600" />
          Gộp {itemTypeLabel}
        </span>
      }
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onClose()}
            disabled={submitting}
            sizeClassName="px-4 py-2"
            roundedClassName="rounded-xl"
          >
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !rootId || duplicates.length === 0}
            leftIcon={submitting ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Check />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            backgroundClassName="bg-gradient-to-r from-primary-600 to-primary-600"
            textClassName="text-sm font-semibold text-white"
            roundedClassName="rounded-xl"
            layoutClassName="inline-flex items-center gap-2"
            disableVariantHover
            disableVariantTextColor
          >
            {submitting ? 'Đang gộp…' : `Gộp vào "${root?.name?.slice(0, 20) ?? ''}"`}
          </Button>
        </>
      }
    >
      <Box layoutClassName="space-y-4">
        <Typography size="sm" variant="muted">
          Chọn 1 mục làm <strong>gốc</strong> — các mục còn lại sẽ được gộp vào nó. Mọi phiếu / dòng tham chiếu sẽ được cập nhật, số liệu thống kê sẽ được cộng dồn.
        </Typography>

        {/* Cảnh báo */}
        <Box
          layoutClassName="flex items-start gap-2 rounded-lg border p-3"
          borderClassName="border-amber-200 dark:border-amber-800"
          backgroundClassName="bg-amber-50/80 dark:bg-amber-950/40"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <Typography size="xs" textClassName="text-amber-900 dark:text-amber-200">
            Thao tác không thể hoàn tác. Các mục được chọn ngoài "gốc" sẽ bị <strong>xoá</strong> khỏi hệ thống.
          </Typography>
        </Box>

        {/* Picker */}
        <Box layoutClassName="space-y-2">
          <Typography size="xs" layoutClassName="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chọn gốc
          </Typography>
          {items.map((item) => {
            const isRoot = item.id === rootId;
            return (
              <Button
                key={item.id}
                type="button"
                onClick={() => setRootId(item.id)}
                disabled={submitting}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isRoot
                    ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200 dark:border-primary-600 dark:bg-primary-950/30 dark:ring-primary-900'
                    : 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-700'
                }`}
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <Box layoutClassName="flex items-center gap-3">
                  <Box
                    layoutClassName={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isRoot ? 'border-primary-600 bg-primary-600' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isRoot ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
                  </Box>
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography
                      size="sm"
                      layoutClassName={`truncate font-semibold ${isRoot ? 'text-primary-900 dark:text-primary-200' : ''}`}
                    >
                      {item.name}
                    </Typography>
                    {item.subtitle ? (
                      <Typography size="xs" variant="muted" layoutClassName="truncate">
                        {item.subtitle}
                      </Typography>
                    ) : null}
                  </Box>
                  {isRoot ? (
                    <span className="rounded-md bg-primary-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      GỐC
                    </span>
                  ) : null}
                </Box>
              </Button>
            );
          })}
        </Box>

        {/* Preview */}
        {duplicates.length > 0 && root ? (
          <Box
            layoutClassName="rounded-lg border border-dashed p-3"
            borderClassName="border-slate-300 dark:border-slate-600"
            backgroundClassName="bg-slate-50/60 dark:bg-slate-900/40"
          >
            <Typography size="xs" variant="muted" layoutClassName="mb-2">
              Sau khi gộp:
            </Typography>
            <Box layoutClassName="space-y-1.5 text-xs">
              {duplicates.map((d) => (
                <Box key={d.id} layoutClassName="flex items-center gap-2">
                  <span className="line-through text-rose-600 dark:text-rose-400">{d.name}</span>
                  <ArrowDown className="h-3 w-3 rotate-[-90deg] text-slate-400" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">{root.name}</span>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
      </Box>
    </BaseModal>
  );
};

export default MergeItemsModal;
