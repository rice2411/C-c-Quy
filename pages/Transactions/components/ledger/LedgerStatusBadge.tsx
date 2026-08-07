import React from 'react';
import { LedgerStatus, LEDGER_STATUS_META, LEDGER_TONE_CLASS } from '@/types/transaction';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

interface LedgerStatusBadgeProps {
  status: LedgerStatus;
  /** GD nhận tiền cần đối soát tay (≥2 đơn cùng số tiền) — thêm dấu chấm cảnh báo. */
  needsReview?: boolean;
}

/** Badge trạng thái thống nhất cho 1 dòng sổ (tone theo LEDGER_STATUS_META). */
const LedgerStatusBadge: React.FC<LedgerStatusBadgeProps> = ({ status, needsReview }) => {
  const meta = LEDGER_STATUS_META[status];
  const tone = LEDGER_TONE_CLASS[meta.tone];
  return (
    <Badge
      size="sm"
      layoutClassName="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold"
      borderClassName={tone.border}
      backgroundClassName={tone.bg}
      textClassName={tone.text}
    >
      {needsReview && status === 'unmatched' && (
        <Box layoutClassName="h-1.5 w-1.5 rounded-full" backgroundClassName="bg-amber-500" />
      )}
      <Typography as="span">{meta.label}</Typography>
    </Badge>
  );
};

export default LedgerStatusBadge;
