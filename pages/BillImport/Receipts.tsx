import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchStockReceiptDetail, fetchStockReceiptSummaries } from '@/services/stockReceiptService';
import type { SavedStockReceiptDetail, SavedStockReceiptSummary } from '@/types/billReceipt';
import { formatVND } from '@/utils/currencyUtil';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';

const fmtMoney = (n: number | null, currency = 'VND') => {
  if (n == null) return '—';
  if (currency === 'VND') return formatVND(n);
  return `${n.toLocaleString('en-US')} ${currency}`;
};

const ReceiptsPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingList, setLoadingList] = useState(false);
  const [list, setList] = useState<SavedStockReceiptSummary[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<SavedStockReceiptDetail | null>(null);

  const selectedId = searchParams.get('id');

  useEffect(() => {
    const load = async () => {
      setLoadingList(true);
      try {
        const rows = await fetchStockReceiptSummaries();
        setList(rows);
        if (!selectedId && rows.length > 0) {
          setSearchParams({ id: rows[0].id });
        }
      } finally {
        setLoadingList(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const load = async () => {
      setLoadingDetail(true);
      try {
        setDetail(await fetchStockReceiptDetail(selectedId));
      } finally {
        setLoadingDetail(false);
      }
    };
    void load();
  }, [selectedId]);

  const listBody = useMemo(() => {
    if (loadingList) {
      return (
        <Box layoutClassName="flex items-center gap-2 p-4">
          <Spinner size="sm" />
          <Typography size="sm">{t('billImport.loadingReceipts')}</Typography>
        </Box>
      );
    }
    if (list.length === 0) {
      return (
        <Typography size="sm" variant="muted" layoutClassName="p-4">
          {t('billImport.noReceipts')}
        </Typography>
      );
    }
    return (
      <Box layoutClassName="space-y-2 p-2">
        {list.map((r) => (
          <Button
            key={r.id}
            type="button"
            variant="ghost"
            onClick={() => setSearchParams({ id: r.id })}
            roundedClassName="rounded-lg"
            borderClassName={
              selectedId === r.id
                ? 'border border-orange-200 dark:border-orange-700'
                : 'border border-slate-200 dark:border-slate-700'
            }
            backgroundClassName={selectedId === r.id ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-white dark:bg-slate-800'}
            layoutClassName="w-full items-start justify-between gap-3 px-3 py-2 text-left"
            disableVariantHover
            disableVariantTextColor
          >
            <Box layoutClassName="min-w-0">
              <Typography size="sm" layoutClassName="truncate font-medium">
                {r.supplierNameRaw || '(Unknown supplier)'}
              </Typography>
              <Typography size="xs" variant="muted" layoutClassName="truncate">
                {r.receiptDate || '—'} • {r.productLineCount} lines
              </Typography>
            </Box>
            <Typography size="xs" layoutClassName="shrink-0 font-semibold">
              {fmtMoney(r.totalAmount, r.currency)}
            </Typography>
          </Button>
        ))}
      </Box>
    );
  }, [loadingList, list, selectedId]);

  return (
    <Box layoutClassName="mx-auto max-w-6xl space-y-4 pb-8">
      <Heading level={2} textClassName="flex items-center gap-2 text-xl font-semibold">
        <FileText className="h-6 w-6 text-orange-500" />
        {t('billImport.receiptScreenTitle')}
      </Heading>
      <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card padding="none" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="lg:col-span-4 overflow-hidden">
          <Box layoutClassName="border-b px-3 py-2" borderClassName="border-slate-200 dark:border-slate-700">
            <Typography size="sm" layoutClassName="font-semibold">{t('billImport.receiptList')}</Typography>
          </Box>
          {listBody}
        </Card>

        <Card padding="none" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="lg:col-span-8 overflow-hidden">
          <Box layoutClassName="border-b px-3 py-2" borderClassName="border-slate-200 dark:border-slate-700">
            <Typography size="sm" layoutClassName="font-semibold">{t('billImport.receiptDetail')}</Typography>
          </Box>
          {loadingDetail ? (
            <Box layoutClassName="flex items-center gap-2 p-4">
              <Spinner size="sm" />
              <Typography size="sm">{t('billImport.loadingDetail')}</Typography>
            </Box>
          ) : !detail ? (
            <Typography size="sm" variant="muted" layoutClassName="p-4">
              {t('billImport.selectReceiptHint')}
            </Typography>
          ) : (
            <Box layoutClassName="space-y-4 p-4">
              <Box layoutClassName="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Typography size="sm"><strong>{t('billImport.supplier')}:</strong> {detail.supplierNameRaw || '—'}</Typography>
                <Typography size="sm"><strong>{t('billImport.dateOnBill')}:</strong> {detail.receiptDate || '—'}</Typography>
                <Typography size="sm"><strong>{t('billImport.total')}:</strong> {fmtMoney(detail.totalAmount, detail.currency)}</Typography>
                <Typography size="sm"><strong>{t('billImport.lineCount')}:</strong> {detail.productLineCount}</Typography>
              </Box>
              <Box layoutClassName="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>#</TableHeaderCell>
                      <TableHeaderCell>{t('billImport.colName')}</TableHeaderCell>
                      <TableHeaderCell>{t('billImport.colQty')}</TableHeaderCell>
                      <TableHeaderCell>{t('billImport.colUnit')}</TableHeaderCell>
                      <TableHeaderCell>{t('billImport.colPrice')}</TableHeaderCell>
                      <TableHeaderCell>{t('billImport.colLineTotal')}</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.lineItems.map((it, idx) => (
                      <TableRow key={`${idx}-${it.name}`}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{it.name}</TableCell>
                        <TableCell>{it.quantity ?? '—'}</TableCell>
                        <TableCell>{it.unit || '—'}</TableCell>
                        <TableCell>{fmtMoney(it.unitPrice, detail.currency)}</TableCell>
                        <TableCell>{fmtMoney(it.lineTotal, detail.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
};

export default ReceiptsPage;
