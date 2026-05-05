import React from 'react';
import type { ImportedSupplierSummary } from '@/types/billReceipt';
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
import { formatVNDOrDash } from '@/utils/currencyUtil';

export interface BillImportSuppliersTabProps {
  supplierSearch: string;
  onSupplierSearchChange: (value: string) => void;
  masterLoading: boolean;
  onRefresh: () => void;
  filteredSuppliers: ImportedSupplierSummary[];
}

const BillImportSuppliersTab: React.FC<BillImportSuppliersTabProps> = ({
  supplierSearch,
  onSupplierSearchChange,
  masterLoading,
  onRefresh,
  filteredSuppliers,
}) => {
  return (
    <Box layoutClassName="grid gap-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex items-center justify-between">
          <Typography size="sm" layoutClassName="font-semibold">
            Nhà cung cấp
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
          value={supplierSearch}
          onChange={(e) => onSupplierSearchChange(e.target.value)}
          placeholder="Tìm nhà cung cấp..."
        />
        <Box layoutClassName="max-h-[480px] overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
          {filteredSuppliers.length === 0 ? (
            <Typography size="sm" variant="muted" layoutClassName="p-3">
              Không có nhà cung cấp phù hợp.
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Tên</TableHeaderCell>
                  <TableHeaderCell>Số lần nhập</TableHeaderCell>
                  <TableHeaderCell>Tổng tiền</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.receiptCount}</TableCell>
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

export default BillImportSuppliersTab;
