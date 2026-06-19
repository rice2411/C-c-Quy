import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  GitMerge,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptText,
  Store,
  Tag,
  TrendingUp,
  Truck,
  User,
  X,
} from 'lucide-react';
import type { ImportedSupplierSummary } from '@/types/billReceipt';
import { mergeSuppliers } from '@/services/stockReceiptService';
import StatsBanner from '@/pages/BillImport/StatsBanner';
import { filterByPeriod, PERIOD_OPTIONS, type DatePeriod } from '@/pages/BillImport/dateFilter';
import FilterToolbar from '@/components/shared/FilterToolbar';
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
import MergeItemsModal, { type MergeItemDescriptor } from '@/pages/BillImport/MergeItemsModal';
import EmptyState from '@/components/ui/EmptyState';

import Checkbox from '@/components/ui/Checkbox';
import { formatDateISO } from '@/utils/format/dateUtil';
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'amount' | 'name' | 'count'>('recent');
  const [period, setPeriod] = useState<DatePeriod>('all');

  const periodFiltered = useMemo(
    () => filterByPeriod(filteredSuppliers, period),
    [filteredSuppliers, period],
  );

  const sortedSuppliers = useMemo(() => {
    const arr = [...periodFiltered];
    if (sortBy === 'amount') arr.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    else if (sortBy === 'name') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'count') arr.sort((a, b) => (b.receiptCount || 0) - (a.receiptCount || 0));
    return arr;
  }, [periodFiltered, sortBy]);

  const stats = useMemo(() => {
    const totalAmount = periodFiltered.reduce((s, sp) => s + (sp.totalAmount || 0), 0);
    const totalReceipts = periodFiltered.reduce((s, sp) => s + (sp.receiptCount || 0), 0);
    return { totalAmount, totalReceipts };
  }, [periodFiltered]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const selectedItems: MergeItemDescriptor[] = filteredSuppliers
    .filter((sp) => selected.has(sp.id))
    .map((sp) => ({
      id: sp.id,
      name: sp.name,
      subtitle: `${sp.receiptCount} phiếu · ${formatVNDOrDash(sp.totalAmount)}${sp.phone ? ' · ' + sp.phone : ''}`,
    }));

  return (
    <Box layoutClassName="grid gap-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Box layoutClassName="flex flex-wrap items-start justify-between gap-2">
          <Box>
            <Typography size="sm" layoutClassName="font-semibold">
              Nhà cung cấp
            </Typography>
            <Typography size="xs" variant="muted">
              Bấm chi tiết để xem đầy đủ, chọn nhiều để gộp NCC trùng.
            </Typography>
          </Box>
          <Box layoutClassName="flex flex-wrap items-center gap-2">
            {selected.size >= 2 ? (
              <Button
                type="button"
                onClick={() => setMergeOpen(true)}
                leftIcon={<GitMerge />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                sizeClassName="px-3 py-1.5 text-xs"
                backgroundClassName="bg-gradient-to-r from-primary-600 to-primary-600"
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
        <StatsBanner
          items={[
            {
              icon: Store,
              label: 'NCC',
              value: String(periodFiltered.length),
              accent: '#4abab9',
            },
            {
              icon: ReceiptText,
              label: 'Phiếu',
              value: String(stats.totalReceipts),
              accent: '#0ea5e9',
            },
            {
              icon: TrendingUp,
              label: 'Tổng chi',
              value: formatVNDOrDash(stats.totalAmount),
              accent: '#16a34a',
            },
          ]}
        />
        <FilterToolbar
          search={supplierSearch}
          onSearchChange={onSupplierSearchChange}
          searchPlaceholder="Tìm NCC theo tên, SĐT, danh mục..."
          period={period}
          periodOptions={PERIOD_OPTIONS as any}
          onPeriodChange={(v) => setPeriod(v as DatePeriod)}
          sortBy={sortBy}
          sortOptions={[
            { value: 'recent', label: 'Mới nhất' },
            { value: 'amount', label: 'Chi nhiều nhất' },
            { value: 'count', label: 'Nhiều phiếu' },
            { value: 'name', label: 'Tên A-Z' },
          ]}
          onSortChange={(v) => setSortBy(v as any)}
          onClearAll={() => { setPeriod('all'); onSupplierSearchChange(''); }}
        />
        {selected.size >= 1 ? (
          <Typography size="xs" variant="muted">
            Đã chọn {selected.size} NCC.{' '}
            {selected.size < 2 ? 'Chọn thêm để gộp.' : 'Bấm "Gộp" để hợp nhất.'}
          </Typography>
        ) : null}

        {/* ===== MOBILE: card layout ===== */}
        <Box layoutClassName="max-h-[60vh] space-y-2 overflow-auto md:hidden">
          {sortedSuppliers.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="Không có nhà cung cấp phù hợp."
            />
          ) : (
            sortedSuppliers.map((row) => {
              const isChecked = selected.has(row.id);
              const open = expanded === row.id;
              return (
                <Box
                  key={`m-${row.id}`}
                  layoutClassName={
                    'rounded-xl border p-3 space-y-2 ' +
                    (isChecked
                      ? 'border-primary-300 bg-primary-50/60 dark:border-primary-700 dark:bg-primary-950/20'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900')
                  }
                >
                  <Box layoutClassName="flex gap-3">
                    <Checkbox checked={isChecked}
                      onChange={() => toggleSelect(row.id)}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Box layoutClassName="min-w-0 flex-1 space-y-1">
                      <Typography size="sm" layoutClassName="font-semibold break-words">
                        {row.name}
                      </Typography>
                      {row.category ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          <Tag className="h-3 w-3" /> {row.category}
                        </span>
                      ) : null}
                      {row.phone || row.contactPerson ? (
                        <Box layoutClassName="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                          {row.phone ? <span>📞 {row.phone}</span> : null}
                          {row.contactPerson ? <span>👤 {row.contactPerson}</span> : null}
                        </Box>
                      ) : null}
                      <Box layoutClassName="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                        <Typography size="xs" variant="muted">
                          Phiếu:{' '}
                          <strong className="text-slate-700 dark:text-slate-100">{row.receiptCount}</strong>
                        </Typography>
                        <Typography size="xs" variant="muted">
                          Tổng:{' '}
                          <strong className="text-slate-700 dark:text-slate-100">
                            {formatVNDOrDash(row.totalAmount)}
                          </strong>
                        </Typography>
                        {row.lastReceiptDate ? (
                          <Typography size="xs" variant="muted">
                            🕒 {formatDateISO(row.lastReceiptDate)}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>
                  </Box>
                  <Box layoutClassName="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      sizeClassName="px-2 py-1 text-xs"
                      onClick={() => setExpanded(open ? null : row.id)}
                      leftIcon={open ? <ChevronDown /> : <ChevronRight />}
                      iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
                      layoutClassName="inline-flex items-center gap-1"
                    >
                      {open ? 'Thu gọn' : 'Chi tiết'}
                    </Button>
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
                  {open ? (
                    <Box
                      layoutClassName="grid gap-2 rounded-md p-2 text-xs"
                      backgroundClassName="bg-slate-50 dark:bg-slate-800/50"
                    >
                      {row.email ? (
                        <Box layoutClassName="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" /> {row.email}
                        </Box>
                      ) : null}
                      {row.taxCode ? (
                        <Box layoutClassName="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-slate-400" /> MST: {row.taxCode}
                        </Box>
                      ) : null}
                      {row.address ? (
                        <Box layoutClassName="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                          <span className="break-words">{row.address}</span>
                        </Box>
                      ) : null}
                      {row.notes ? (
                        <Box
                          layoutClassName="rounded p-1.5"
                          backgroundClassName="bg-amber-50 dark:bg-amber-950/40"
                        >
                          💬 {row.notes}
                        </Box>
                      ) : null}
                      {!row.email && !row.taxCode && !row.address && !row.notes ? (
                        <Typography size="xs" variant="muted">
                          — Không có thông tin bổ sung —
                        </Typography>
                      ) : null}
                    </Box>
                  ) : null}
                </Box>
              );
            })
          )}
        </Box>

        {/* ===== DESKTOP: table layout ===== */}
        <Box layoutClassName="hidden max-h-[560px] overflow-auto rounded-lg border border-slate-100 dark:border-slate-800 md:block">
          {sortedSuppliers.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="Không có nhà cung cấp phù hợp."
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell layoutClassName="w-10"></TableHeaderCell>
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
                {sortedSuppliers.map((row) => {
                  const open = expanded === row.id;
                  const isChecked = selected.has(row.id);
                  return (
                    <React.Fragment key={`d-${row.id}`}>
                      <TableRow
                        layoutClassName={isChecked ? 'bg-primary-50/60 dark:bg-primary-950/20' : undefined}
                      >
                        <TableCell>
                          <Checkbox checked={isChecked}
                            onChange={() => toggleSelect(row.id)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            onClick={() => setExpanded(open ? null : row.id)}
                            className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            aria-label={open ? 'Thu gọn' : 'Mở rộng'}
                           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
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
                            {row.lastReceiptDate ? formatDateISO(row.lastReceiptDate) : '—'}
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
                          <TableCell colSpan={9}>
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

      <MergeItemsModal
        open={mergeOpen}
        itemTypeLabel="nhà cung cấp"
        items={selectedItems}
        onClose={() => setMergeOpen(false)}
        onConfirm={mergeSuppliers}
        onDone={() => {
          clearSelection();
          void onRefresh();
        }}
      />
    </Box>
  );
};

export default BillImportSuppliersTab;
