import React from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/format/currencyUtil';
import { ReconcilePreviewResult } from '@/services/transactionService';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

interface ReconcileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Kết quả preview (null khi đang quét). */
  preview: ReconcilePreviewResult | null;
  /** Đang quét preview. */
  loading: boolean;
  /** Đang ghi map. */
  applying: boolean;
  /** Ghi map cho các cặp đã preview. */
  onConfirm: () => void;
}

const ReconcileSyncModal: React.FC<ReconcileSyncModalProps> = ({
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
      title={t('transactions.sync.title') || 'Đồng bộ giao dịch với đơn'}
      footer={footer}
      size="lg"
    >
      {loading ? (
        <Box layoutClassName="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <Typography size="sm" variant="muted">
            {t('transactions.sync.scanning') || 'Đang quét giao dịch chưa khớp...'}
          </Typography>
        </Box>
      ) : (
        <Box layoutClassName="space-y-4">
          {/* Tóm tắt */}
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
              {preview?.skippedNoMatch ?? 0} {t('transactions.sync.noCandidate') || 'không khớp'}
            </Badge>
          </Box>

          {hasMatch ? (
            <Box layoutClassName="max-h-[50vh] space-y-2 overflow-y-auto">
              {matched.map((m) => (
                <Box
                  key={m.transactionId}
                  layoutClassName="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <Box layoutClassName="min-w-0">
                    <Typography
                      as="p"
                      size="sm"
                      layoutClassName="font-semibold"
                      textClassName="text-slate-700 dark:text-slate-200"
                    >
                      +{formatVND(m.amount)}
                    </Typography>
                    <Typography
                      as="p"
                      size="xs"
                      layoutClassName="truncate"
                      textClassName="text-slate-400 dark:text-slate-500"
                    >
                      GD #{m.sepayId}
                    </Typography>
                  </Box>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-500" />
                  <Box layoutClassName="min-w-0 text-right">
                    <Typography
                      as="p"
                      size="sm"
                      layoutClassName="font-semibold"
                      textClassName="text-primary-600 dark:text-primary-400"
                    >
                      {m.orderNumber}
                    </Typography>
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
                {t('transactions.sync.noMatch') || 'Không có giao dịch nào khớp tự động'}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </BaseModal>
  );
};

export default ReconcileSyncModal;
