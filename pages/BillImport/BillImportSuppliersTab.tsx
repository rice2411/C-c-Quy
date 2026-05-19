import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Mail, MapPin, Pencil, Phone, Tag, User } from 'lucide-react';
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
import { formatVNDOrDash } from '@/utils/format/currencyUtil';
import SupplierEditModal from '@/pages/BillImport/SupplierEditModal';

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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<ImportedSupplierSummary | null>(null);

  return (
    <Box layoutClassName="grid gap-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex items-center justify-between">
          <Box>
            <Typography size="sm" layoutClassName="font-semibold">
              Nhà cung cấp
            </Typography>
            <Typography size="xs" variant="muted">
              Bấm vào dòng để xem chi tiết, bấm "Sửa" để cập nhật liên hệ / phân loại.
            </Typography>
          </Box>
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
        <Box layoutClassName="max-h-[560px] overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
          {filteredSuppliers.length === 0 ? (
            <Typography size="sm" variant="muted" layoutClassName="p-3">
              Không có nhà cung cấp phù hợp.
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell layoutClassName="w-8"></TableHeaderCell>
                  <TableHeaderCell>Tên</TableHeaderCell>
                  <TableHeaderCell>Danh mục</TableHeaderCell>
                  <TableHeaderCell>Liên hệ</TableHeaderCell>
                  <TableHeaderCell>Số phiếu</TableHeaderCell>
                  <TableHeaderCell>Tổng tiền</TableHeaderCell>
                  <TableHeaderCell>Lần cuối</TableHeaderCell>
                  <TableHeaderCell layoutClassName="w-20 text-right">Thao tác</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.map((row) => {
                  const open = expanded === row.id;
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setExpanded(open ? null : row.id)}
                            className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            aria-label={open ? 'Thu gọn' : 'Mở rộng'}
                          >
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Box layoutClassName="flex flex-col">
                            <Typography size="sm" layoutClassName="font-medium">
                              {row.name}
                            </Typography>
                            {row.address ? (
                              <Typography size="xs" variant="muted" layoutClassName="truncate">
                                {row.address}
                              </Typography>
                            ) : null}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {row.category ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                              <Tag className="h-3 w-3" /> {row.category}
                            </span>
                          ) : (
                            <Typography size="xs" variant="muted">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box layoutClassName="flex flex-col text-xs">
                            {row.phone ? <span>📞 {row.phone}</span> : null}
                            {row.contactPerson ? <span>👤 {row.contactPerson}</span> : null}
                            {!row.phone && !row.contactPerson ? (
                              <Typography size="xs" variant="muted">—</Typography>
                            ) : null}
                          </Box>
                        </TableCell>
                        <TableCell>{row.receiptCount}</TableCell>
                        <TableCell>{formatVNDOrDash(row.totalAmount)}</TableCell>
                        <TableCell>
                          <Typography size="xs" variant="muted">
                            {row.lastReceiptDate ? row.lastReceiptDate.slice(0, 10) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box layoutClassName="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              sizeClassName="px-2 py-1 text-xs"
                              onClick={() => setEditing(row)}
                              leftIcon={<Pencil />}
                              iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                              layoutClassName="inline-flex items-center gap-1"
                            >
                              Sửa
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                      {open ? (
                        <TableRow>
                          <TableCell colSpan={8}>
                            <Box
                              layoutClassName="grid gap-3 rounded-md p-3 sm:grid-cols-2 lg:grid-cols-3"
                              backgroundClassName="bg-slate-50 dark:bg-slate-800/50"
                            >
                              <Box layoutClassName="flex items-start gap-2 text-xs">
                                <Phone className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                                <Box>
                                  <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase">
                                    SĐT
                                  </Typography>
                                  <Typography size="sm">{row.phone || '—'}</Typography>
                                </Box>
                              </Box>
                              <Box layoutClassName="flex items-start gap-2 text-xs">
                                <User className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                                <Box>
                                  <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase">
                                    Người liên hệ
                                  </Typography>
                                  <Typography size="sm">{row.contactPerson || '—'}</Typography>
                                </Box>
                              </Box>
                              <Box layoutClassName="flex items-start gap-2 text-xs">
                                <Mail className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                                <Box>
                                  <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase">
                                    Email
                                  </Typography>
                                  <Typography size="sm">{row.email || '—'}</Typography>
                                </Box>
                              </Box>
                              <Box layoutClassName="flex items-start gap-2 text-xs">
                                <Tag className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                                <Box>
                                  <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase">
                                    MST
                                  </Typography>
                                  <Typography size="sm">{row.taxCode || '—'}</Typography>
                                </Box>
                              </Box>
                              <Box layoutClassName="flex items-start gap-2 text-xs sm:col-span-2">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                                <Box>
                                  <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase">
                                    Địa chỉ
                                  </Typography>
                                  <Typography size="sm">{row.address || '—'}</Typography>
                                </Box>
                              </Box>
                              {row.notes ? (
                                <Box
                                  layoutClassName="rounded-md p-2 text-xs sm:col-span-2 lg:col-span-3"
                                  backgroundClassName="bg-amber-50 dark:bg-amber-950/40"
                                  borderClassName="border border-amber-200 dark:border-amber-800"
                                >
                                  <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase">
                                    Ghi chú
                                  </Typography>
                                  <Typography size="sm">{row.notes}</Typography>
                                </Box>
                              ) : null}
                              <Box layoutClassName="flex justify-end sm:col-span-2 lg:col-span-3">
                                <Button
                                  type="button"
                                  variant="primary"
                                  sizeClassName="px-3 py-1.5 text-xs"
                                  onClick={() => setEditing(row)}
                                  leftIcon={<Pencil />}
                                  iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                                  layoutClassName="inline-flex items-center gap-1.5"
                                  disableVariantHover
                                  disableVariantTextColor
                                >
                                  Sửa thông tin NCC
                                </Button>
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      <SupplierEditModal
        open={editing !== null}
        supplier={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void onRefresh();
        }}
      />
    </Box>
  );
};

export default BillImportSuppliersTab;
