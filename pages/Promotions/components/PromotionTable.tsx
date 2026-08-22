import React from 'react';
import { Pencil, Trash2, RotateCcw } from 'lucide-react';
import { Promotion, discountTypeLabel } from '@/types/promotion';
import type { ProductCategory } from '@/types/category';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { formatDateRange, promotionState, runsCount } from '../promotionUtils';
import { TYPE_META, STATE_META, promotionValueLabel } from '../promotionMeta';

interface Props {
  promotions: Promotion[];
  categories: ProductCategory[];
  onEdit: (p: Promotion) => void;
  onDelete: (p: Promotion) => void;
  onReopen: (p: Promotion) => void;
}

const PromotionRow: React.FC<{ p: Promotion } & Omit<Props, 'promotions'>> = ({ p, categories, onEdit, onDelete, onReopen }) => {
  const meta = TYPE_META[p.discountType] ?? TYPE_META.FIXED;
  const { Icon } = meta;
  const state = promotionState(p);
  const stateMeta = STATE_META[state];
  const totalRuns = runsCount(p);
  const hasLimit = p.maxUses != null && p.maxUses > 0;

  return (
    <TableRow>
      {/* Tên + loại */}
      <TableCell layoutClassName="p-2.5">
        <Box layoutClassName="flex items-center gap-2.5">
          <Box layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" backgroundClassName={meta.iconBg}>
            <Icon className={`h-4 w-4 ${meta.iconText}`} />
          </Box>
          <Box layoutClassName="min-w-0">
            <Box layoutClassName="flex items-center gap-1.5">
              <Typography as="span" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-900 dark:text-white">{p.name}</Typography>
              {totalRuns > 1 ? (
                <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-violet-100 dark:bg-violet-900/30" textClassName="text-violet-700 dark:text-violet-300">#{totalRuns}</Badge>
              ) : null}
            </Box>
            <Typography as="p" size="xs" variant="muted">{discountTypeLabel(p.discountType)}</Typography>
          </Box>
        </Box>
      </TableCell>

      {/* Giá trị giảm */}
      <TableCell layoutClassName="p-2.5">
        <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-slate-700 dark:text-slate-200">{promotionValueLabel(p, categories)}</Typography>
      </TableCell>

      {/* Cách áp */}
      <TableCell layoutClassName="p-2.5">
        {p.applyMode === 'CODE' && p.code ? (
          <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-primary-100 dark:bg-primary-900/30" textClassName="font-mono text-primary-700 dark:text-primary-300">{p.code}</Badge>
        ) : (
          <Badge size="sm" borderClassName="border-transparent" backgroundClassName="bg-sky-100 dark:bg-sky-900/30" textClassName="text-sky-700 dark:text-sky-300">tự áp</Badge>
        )}
      </TableCell>

      {/* Thời gian */}
      <TableCell layoutClassName="p-2.5">
        <Typography as="span" size="xs" variant="muted">{formatDateRange(p.startAt, p.endAt)}</Typography>
      </TableCell>

      {/* Lượt dùng */}
      <TableCell layoutClassName="p-2.5 text-right">
        <Typography as="span" size="xs" variant="muted">
          {hasLimit ? `${p.usedCount || 0}/${p.maxUses}` : `${p.usedCount || 0} · ∞`}
        </Typography>
      </TableCell>

      {/* Trạng thái */}
      <TableCell layoutClassName="p-2.5 text-center">
        <Badge size="sm" borderClassName="border-transparent" backgroundClassName={stateMeta.bg} textClassName={stateMeta.text}>{stateMeta.label}</Badge>
      </TableCell>

      {/* Hành động */}
      <TableCell layoutClassName="p-2.5">
        <Box layoutClassName="flex items-center justify-end gap-1">
          {state !== 'running' ? (
            <IconButton label="Mở lại đợt mới" variant="ghost" size="sm" onClick={() => onReopen(p)} textClassName="text-slate-400" hoverClassName="hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              <RotateCcw className="h-4 w-4" />
            </IconButton>
          ) : null}
          <IconButton label="Sửa" variant="ghost" size="sm" onClick={() => onEdit(p)} textClassName="text-slate-400" hoverClassName="hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20">
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton label="Xoá" variant="ghost" size="sm" onClick={() => onDelete(p)} textClassName="text-slate-400" hoverClassName="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

/** Bảng khuyến mãi cho chế độ table (giống Giao dịch). */
const PromotionTable: React.FC<Props> = ({ promotions, categories, onEdit, onDelete, onReopen }) => (
  <Card padding="none" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="overflow-hidden">
    <Box layoutClassName="max-h-[70vh] overflow-auto">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Chương trình</TableHeaderCell>
            <TableHeaderCell>Giá trị</TableHeaderCell>
            <TableHeaderCell>Cách áp</TableHeaderCell>
            <TableHeaderCell>Thời gian</TableHeaderCell>
            <TableHeaderCell layoutClassName="px-3 py-2.5 text-right">Lượt dùng</TableHeaderCell>
            <TableHeaderCell layoutClassName="px-3 py-2.5 text-center">Trạng thái</TableHeaderCell>
            <TableHeaderCell layoutClassName="px-3 py-2.5 text-right"> </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {promotions.map((p) => (
            <PromotionRow key={p.id} p={p} categories={categories} onEdit={onEdit} onDelete={onDelete} onReopen={onReopen} />
          ))}
        </TableBody>
      </Table>
    </Box>
  </Card>
);

export default PromotionTable;
