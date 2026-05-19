import React from 'react';
import type { ImportedMaterialSummary } from '@/types/billReceipt';
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
  return (
    <Box layoutClassName="grid gap-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex items-center justify-between">
          <Typography size="sm" layoutClassName="font-semibold">
            Nguyên vật liệu đã nhập
          </Typography>
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
        <Input
          value={materialSearch}
          onChange={(e) => onMaterialSearchChange(e.target.value)}
          placeholder="Tìm nguyên vật liệu..."
        />
        <Box layoutClassName="max-h-[480px] overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
          {filteredMaterials.length === 0 ? (
            <Typography size="sm" variant="muted" layoutClassName="p-3">
              Không có nguyên vật liệu phù hợp.
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Tên</TableHeaderCell>
                  <TableHeaderCell>Nhà cung cấp</TableHeaderCell>
                  <TableHeaderCell>Số lần</TableHeaderCell>
                  <TableHeaderCell>Tổng SL</TableHeaderCell>
                  <TableHeaderCell>Tổng tiền</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.lastSupplierName || '—'}</TableCell>
                    <TableCell>{row.importCount}</TableCell>
                    <TableCell>{row.totalQty}</TableCell>
                        <TableCell>{formatVNDOrDash(row.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default BillImportMaterialsTab;
