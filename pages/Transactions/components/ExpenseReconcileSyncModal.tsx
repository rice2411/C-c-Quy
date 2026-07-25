import React from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/format/currencyUtil';
import { expenseCategoryLabel } from '@/types/transaction';
import { ExpenseReconcilePreviewResult } from '@/services/transactionService';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

interface ExpenseReconcileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Kết quả preview (null khi đang quét). */
  preview: ExpenseReconcilePreviewResult | null;
  loading: boolean;
  applying: boolean;
  onConfirm: () => void;
}

/** Bulk đối soát tiền RA ↔ chi phí tay (gợi ý theo số tiền + ngày). */
const ExpenseReconcileSyncModal: React.FC<ExpenseReconcileSyncModalProps> = ({
  isOpen,
  onClose,
  preview,
  loading,
  applying,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const matched = preview?.matched ?? [];
  const hasMatch = matched.length > 0;

  const footer = (
    <Box layoutClassName="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        disabled={applying}
        sizeClassName="px-4 py-2 text-sm"
      >
        {t('transactions.sync.cancel') || 'Hủy'}
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={onConfirm}
        disabled={!hasMatch || applying || loading}
        layoutClassName="flex items-center gap-2"
        sizeClassName="px-4 py-2 text-sm"
      >
        {applying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        {applying
          ? t('transactions.sync.applying') || 'Đang khớp...'
          : t('transactions.sync.confirm') || 'Xác nhận khớp'}
      </Button>
    </Box>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('transactions.expenseSync.title') || 'Đồng bộ tiền ra với chi phí'}
      footer={footer}
      size="lg"
    >
      {loading ? (
        <Box layoutClassName="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <Typography size="sm" variant="muted">
            {t('transactions.expenseSync.scanning') || 'Đang quét tiền ra chưa gắn chi phí...'}
          </Typography>
        </Box>
      ) : (
        <Box layoutClassName="space-y-4">
          <Box layoutClassName="flex flex-wrap items-center gap-2">
            <Badge
              size="sm"
              backgroundClassName="bg-emerald-100 dark:bg-emerald-900/30"
              textClassName="font-semibold text-emerald-700 dark:text-emerald-300"
            >
              {matched.length} {t('transactions.sync.willMatch') || 'sẽ khớp'}
            </Badge>
            <Badge
              size="sm"
              backgroundClassName="bg-amber-100 dark:bg-amber-900/30"
              textClassName="font-semibold text-amber-700 dark:text-amber-300"
            >
              {preview?.skippedAmbiguous ?? 0} {t('transactions.sync.ambiguous') || 'mơ hồ'}
            </Badge>
            <Badge
              size="sm"
              backgroundClassName="bg-slate-100 dark:bg-slate-700"
              textClassName="font-semibold text-slate-600 dark:text-slate-300"
            >
              {preview?.totalUnlinkedExpense ?? 0} {t('transactions.expenseSync.unlinkedExpense') || 'chi phí chưa gắn'}
            </Badge>
          </Box>

          {hasMatch ? (
            <Box layoutClassName="max-h-[50vh] space-y-2 overflow-y-auto">
              {matched.map((m) => (
                <Box
                  key={m.transactionId}
                  layoutClassName="flex items-center justify-between gap-3 rounded-xl border p-3"
                  borderClassName="border-slate-100 dark:border-slate-700"
                  backgroundClassName="bg-white dark:bg-slate-800"
                >
                  <Box layoutClassName="min-w-0">
                    <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-rose-600 dark:text-rose-400">
                      −{formatVND(m.amount)}
                    </Typography>
                    <Typography as="p" size="xs" layoutClassName="truncate" textClassName="text-slate-400 dark:text-slate-500">
                      {m.description || t('transactions.expenseSync.bankOut') || 'Tiền ra'}
                    </Typography>
                  </Box>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-500" />
                  <Box layoutClassName="min-w-0 text-right">
                    <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-primary-600 dark:text-primary-400">
                      {expenseCategoryLabel(m.category ?? '')}
                    </Typography>
                    {m.note ? (
                      <Typography as="p" size="xs" layoutClassName="truncate" textClassName="text-slate-400 dark:text-slate-500">
                        {m.note}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              layoutClassName="flex flex-col items-center justify-center gap-3 py-10"
              textClassName="text-slate-400 dark:text-slate-500"
            >
              <CheckCircle2 className="h-10 w-10 opacity-30" />
              <Typography size="sm" variant="muted">
                {t('transactions.expenseSync.noMatch') || 'Không có cặp tiền ra ↔ chi phí nào khớp tự động'}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </BaseModal>
  );
};

export default ExpenseReconcileSyncModal;
