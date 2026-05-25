import React, { useState } from 'react';
import { GitMerge, X } from 'lucide-react';
import type { ImportedMaterialSummary } from '@/types/billReceipt';
import { mergeMaterials } from '@/services/stockReceiptService';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import MergeItemsModal, { type MergeItemDescriptor } from '@/pages/BillImport/MergeItemsModal';

export interface BillImportMaterialsTabProps {
  materialSearch: string;
  onMaterialSearchChange: (value: string) => void;
  masterLoading: boolean;
  onRefresh: () => void;
  filteredMaterials: ImportedMaterialSummary[];
}

const BillImportMaterialsTab: React.FC<BillImportMaterialsTabProps> = ({
  materialSearch,
  onMaterialSearchChange,
  masterLoading,
  onRefresh,
  filteredMaterials,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const selectedItems: MergeItemDescriptor[] = filteredMaterials
    .filter((m) => selected.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      subtitle: `${m.importCount} lần · ${m.totalQty} sp · ${formatVNDOrDash(m.totalAmount)}`,
    }));

  return (
    <Box layoutClassName="grid gap-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
          <Typography size="sm" layoutClassName="font-semibold">
            Nguyên vật liệu đã nhập
          </Typography>
          <Box layoutClassName="flex flex-wrap items-center gap-2">
            {selected.size >= 2 ? (
              <Button
                type="button"
                onClick={() => setMergeOpen(true)}
                leftIcon={<GitMerge />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                sizeClassName="px-3 py-1.5 text-xs"
                backgroundClassName="bg-gradient-to-r from-orange-600 to-amber-600"
                textClassName="font-semibold text-white"
                roundedClassName="rounded-lg"
                layoutClassName="inline-flex items-center gap-1.5"
                disableVariantHover
                disableVariantTextColor
              >
                Gộp {selected.size}
              </Button>
            ) : null}
            {selected.size > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearSelection}
                leftIcon={<X />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                sizeClassName="px-2 py-1.5 text-xs"
              >
                Bỏ chọn
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              sizeClassName="px-3 py-1.5 text-xs"
              onClick={() => void onRefresh()}
              disabled={masterLoading}
            >
              {masterLoading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </Box>
        </Box>
        <Input
          value={materialSearch}
          onChange={(e) => onMaterialSearchChange(e.target.value)}
          placeholder="Tìm nguyên vật liệu..."
        />
        {selected.size >= 1 ? (
          <Typography size="xs" variant="muted">
            Đã chọn {selected.size} mục.{' '}
            {selected.size < 2 ? 'Chọn thêm để gộp.' : 'Bấm "Gộp" để hợp nhất.'}
          </Typography>
        ) : null}

        {/* ===== MOBILE: card layout ===== */}
        <Box layoutClassName="max-h-[60vh] space-y-2 overflow-auto md:hidden">
          {filteredMaterials.length === 0 ? (
            <Typography size="sm" variant="muted" layoutClassName="p-3">
              Không có nguyên vật liệu phù hợp.
            </Typography>
          ) : (
            filteredMaterials.map((row) => {
              const isChecked = selected.has(row.id);
              return (
                <Box
                  key={`m-${row.id}`}
                  layoutClassName={
                    'flex gap-3 rounded-xl border p-3 ' +
                    (isChecked
                      ? 'border-orange-300 bg-orange-50/60 dark:border-orange-700 dark:bg-orange-950/20'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900')
                  }
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(row.id)}
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <Box layoutClassName="min-w-0 flex-1 space-y-1">
                    <Typography size="sm" layoutClassName="font-semibold break-words">
                      {row.name}
                    </Typography>
                    {row.lastSupplierName ? (
                      <Typography size="xs" variant="muted" layoutClassName="truncate">
                        🏭 {row.lastSupplierName}
                      </Typography>
                    ) : null}
                    <Box layoutClassName="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      <Typography size="xs" variant="muted">
                        Số lần:{' '}
                        <strong className="text-slate-700 dark:text-slate-100">{row.importCount}</strong>
                      </Typography>
                      <Typography size="xs" variant="muted">
                        SL: <strong className="text-slate-700 dark:text-slate-100">{row.totalQty}</strong>
                      </Typography>
                      <Typography size="xs" variant="muted">
                        Tổng:{' '}
                        <strong className="text-slate-700 dark:text-slate-100">
                          {formatVNDOrDash(row.totalAmount)}
                        </strong>
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* ===== DESKTOP: table layout ===== */}
        <Box layoutClassName="hidden max-h-[480px] overflow-auto rounded-lg border border-slate-100 dark:border-slate-800 md:block">
          {filteredMaterials.length === 0 ? (
            <Typography size="sm" variant="muted" layoutClassName="p-3">
              Không có nguyên vật liệu phù hợp.
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell layoutClassName="w-10"></TableHeaderCell>
                  <TableHeaderCell>Tên</TableHeaderCell>
                  <TableHeaderCell>Nhà cung cấp</TableHeaderCell>
                  <TableHeaderCell>Số lần</TableHeaderCell>
                  <TableHeaderCell>Tổng SL</TableHeaderCell>
                  <TableHeaderCell>Tổng tiền</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials.map((row) => {
                  const isChecked = selected.has(row.id);
                  return (
                    <TableRow
                      key={`d-${row.id}`}
                      layoutClassName={isChecked ? 'bg-orange-50/60 dark:bg-orange-950/20' : undefined}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(row.id)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.lastSupplierName || '—'}</TableCell>
                      <TableCell>{row.importCount}</TableCell>
                      <TableCell>{row.totalQty}</TableCell>
                      <TableCell>{formatVNDOrDash(row.totalAmount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      <MergeItemsModal
        open={mergeOpen}
        itemTypeLabel="nguyên liệu"
        items={selectedItems}
        onClose={() => setMergeOpen(false)}
        onConfirm={mergeMaterials}
        onDone={() => {
          clearSelection();
          void onRefresh();
        }}
      />
    </Box>
  );
};

export default BillImportMaterialsTab;
