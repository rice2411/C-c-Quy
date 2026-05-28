/**
 * CsvPreviewTable — render bảng preview rows từ CSV import, color-coded action.
 */
import React from 'react';
import Badge from '@/components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';

export interface CsvPreviewRow {
  __row: number;
  __action: 'add' | 'update' | 'skip';
  __error?: string;
  name: string;
  category: string;
  price: number;
  status: 'active' | 'inactive';
}

interface CsvPreviewTableProps {
  rows: CsvPreviewRow[];
}

const ACTION_STYLES: Record<CsvPreviewRow['__action'], { bg: string; text: string; label: string }> = {
  add: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'MỚI' },
  update: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'CẬP NHẬT' },
  skip: { bg: 'bg-red-100', text: 'text-red-700', label: 'BỎ QUA' },
};

const CsvPreviewTable: React.FC<CsvPreviewTableProps> = ({ rows }) => (
  <div className="rounded-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-auto">
    <Table>
      <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700" stateClassName="sticky top-0">
        <TableRow>
          <TableHeaderCell layoutClassName="px-2 py-1.5">#</TableHeaderCell>
          <TableHeaderCell layoutClassName="px-2 py-1.5">Hành động</TableHeaderCell>
          <TableHeaderCell layoutClassName="px-2 py-1.5">Tên</TableHeaderCell>
          <TableHeaderCell layoutClassName="px-2 py-1.5">Category</TableHeaderCell>
          <TableHeaderCell layoutClassName="px-2 py-1.5 text-right">Giá</TableHeaderCell>
          <TableHeaderCell layoutClassName="px-2 py-1.5">Status</TableHeaderCell>
          <TableHeaderCell layoutClassName="px-2 py-1.5">Lỗi</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => {
          const s = ACTION_STYLES[r.__action];
          return (
            <TableRow key={r.__row} hoverClassName={r.__action === 'skip' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
              <TableCell layoutClassName="px-2 py-1 text-slate-500">{r.__row}</TableCell>
              <TableCell layoutClassName="px-2 py-1">
                <Badge size="sm" backgroundClassName={s.bg} textClassName={`${s.text} font-bold`} borderClassName="border-transparent">
                  {s.label}
                </Badge>
              </TableCell>
              <TableCell layoutClassName="px-2 py-1 font-medium">{r.name}</TableCell>
              <TableCell layoutClassName="px-2 py-1 text-slate-600 dark:text-slate-400">{r.category}</TableCell>
              <TableCell layoutClassName="px-2 py-1 text-right">{r.price.toLocaleString('vi-VN')}đ</TableCell>
              <TableCell layoutClassName="px-2 py-1">
                <span className={r.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}>
                  {r.status === 'active' ? '●' : '○'}
                </span>
              </TableCell>
              <TableCell layoutClassName="px-2 py-1 text-red-600">{r.__error || ''}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export default CsvPreviewTable;
