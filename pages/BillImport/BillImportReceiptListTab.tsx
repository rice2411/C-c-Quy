import React from 'react';
import type { SavedStockReceiptSummary } from '@/types/billReceipt';
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
import { formatImportedAt } from '@/utils/dateUtil';
import { formatVNDOrDash } from '@/utils/currencyUtil';

export interface BillImportReceiptListTabProps {
  receiptSearch: string;
  onReceiptSearchChange: (value: string) => void;
  receiptLoading: boolean;
  onRefresh: () => void;
  filteredReceipts: SavedStockReceiptSummary[];
  onRowClick: (receiptId: string) => void;
}

const BillImportReceiptListTab: React.FC<BillImportReceiptListTabProps> = ({
  receiptSearch,
  onReceiptSearchChange,
  receiptLoading,
  onRefresh,
  filteredReceipts,
  onRowClick,
}) => {
  return (
    <Box layoutClassName="grid gap-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex items-center justify-between">
          <Typography size="sm" layoutClassName="font-semibold">
            Danh sách bill đã lưu
          </Typography>
          <Button
            type="button"
            variant="secondary"
            sizeClassName="px-3 py-1.5 text-xs"
            onClick={() => void onRefresh()}
            disabled={receiptLoading}
          >
            {receiptLoading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </Box>
        <Input
          value={receiptSearch}
          onChange={(e) => onReceiptSearchChange(e.target.value)}
          placeholder="Tìm theo NCC, ngày bill, ngày nhập, mã phiếu..."
        />
        <Box layoutClassName="max-h-[480px] overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
          {filteredReceipts.length === 0 ? (
            <Typography size="sm" variant="muted" layoutClassName="p-3">
              Không có bill phù hợp.
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Ngày bill</TableHeaderCell>
                  <TableHeaderCell>Ngày nhập</TableHeaderCell>
                  <TableHeaderCell>Nhà cung cấp</TableHeaderCell>
                  <TableHeaderCell>Tổng tiền</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReceipts.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    onClick={() => void onRowClick(row.id)}
                  >
                    <TableCell>{row.receiptDate || '—'}</TableCell>
                    <TableCell>{formatImportedAt(row.createdAt)}</TableCell>
                    <TableCell>{row.supplierNameRaw || '—'}</TableCell>
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

export default BillImportReceiptListTab;
