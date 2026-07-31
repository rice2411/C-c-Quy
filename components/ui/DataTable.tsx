import React from 'react';
import Card from '@/components/ui/Card';
import Box from '@/components/ui/Box';
import { Table } from '@/components/ui/Table';

export interface DataTableProps {
  /** Nội dung bảng: <TableHead>… + <TableBody>… (dùng component UI Table). */
  children: React.ReactNode;
  /** Chiều cao tối đa vùng cuộn (header dính đầu). Mặc định 70vh. '' = không giới hạn. */
  maxHeightClassName?: string;
  /** Class thêm cho vùng cuộn (vd 'min-w-[720px]'). */
  scrollClassName?: string;
}

/**
 * Vỏ bảng danh sách CHUẨN toàn app (theo bảng product):
 * Card viền bo + vùng cuộn dọc/ngang + header slate-50 dính đầu (từ TableHead).
 * Dùng: <DataTable><TableHead>…</TableHead><TableBody>…</TableBody></DataTable>
 */
const DataTable: React.FC<DataTableProps> = ({
  children,
  maxHeightClassName = 'max-h-[70vh]',
  scrollClassName = '',
}) => (
  <Card
    padding="none"
    borderClassName="border-slate-200 dark:border-slate-700"
    layoutClassName="overflow-hidden"
  >
    <Box layoutClassName={`overflow-auto ${maxHeightClassName} ${scrollClassName}`.trim()}>
      <Table>{children}</Table>
    </Box>
  </Card>
);

export default DataTable;
