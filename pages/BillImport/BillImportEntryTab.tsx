import React, { type RefObject } from 'react';
import { Camera, Check, Circle, Loader2, ScanLine } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BillLineItem, BillValidationResult, StockReceiptStructured } from '@/types/billReceipt';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
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
import { PIPELINE_STAGES, type UiProgressStage } from '@/pages/BillImport/constants';

export interface BillImportEntryTabProps {
  inputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  onFile: (file: File | undefined) => void | Promise<void>;
  busy: boolean;
  previewUrl: string | null;
  progressStage: UiProgressStage | null;
  validation: BillValidationResult | null;
  ocrText: string;
  draftStructured: StockReceiptStructured | null;
  savingDraft: boolean;
  onSaveDraft: () => void;
  updateDraftField: <K extends keyof StockReceiptStructured>(key: K, value: StockReceiptStructured[K]) => void;
  updateDraftLine: (idx: number, patch: Partial<BillLineItem>) => void;
}

const BillImportEntryTab: React.FC<BillImportEntryTabProps> = ({
  inputRef,
  cameraInputRef,
  onFile,
  busy,
  previewUrl,
  progressStage,
  validation,
  ocrText,
  draftStructured,
  savingDraft,
  onSaveDraft,
  updateDraftField,
  updateDraftLine,
}) => {
  const { t } = useLanguage();

  const activeStepIndex =
    progressStage === 'vision' ? 0 : progressStage === 'validate' ? 1 : progressStage === 'structure' ? 2 : -1;
  const progressBarPct =
    progressStage === 'prepare'
      ? 14
      : progressStage === 'vision'
        ? 40
        : progressStage === 'validate'
          ? 70
          : progressStage === 'structure'
            ? 96
            : 0;

  return (
    <>
      <Card
        padding="md"
        borderClassName="border-slate-200 dark:border-slate-700"
        layoutClassName="space-y-4"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <Box layoutClassName="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="primary"
            onClick={() => cameraInputRef.current?.click()}
            disabled={busy}
            leftIcon={busy ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : <Camera />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            layoutClassName="inline-flex items-center gap-2"
            disableVariantHover
            disableVariantTextColor
          >
            {busy ? t('billImport.processing') : t('billImport.captureImage')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            leftIcon={busy ? <Spinner size="sm" /> : <ScanLine />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            layoutClassName="inline-flex items-center gap-2"
            disableVariantHover
            disableVariantTextColor
          >
            {busy ? t('billImport.processing') : t('billImport.uploadImage')}
          </Button>
        </Box>

        {previewUrl && (
          <Box layoutClassName="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
            <img src={previewUrl} alt="" className="max-h-80 w-full object-contain bg-slate-50 dark:bg-slate-900" />
          </Box>
        )}
      </Card>

      {busy && progressStage ? (
        <Card
          padding="md"
          borderClassName="border-orange-200 dark:border-orange-900/50"
          backgroundClassName="bg-gradient-to-br from-orange-50/90 to-white dark:from-orange-950/40 dark:to-slate-900"
          layoutClassName="space-y-4 shadow-md shadow-orange-500/10"
        >
          <Box layoutClassName="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Box
              layoutClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              backgroundClassName="bg-orange-500 text-white"
            >
              <Spinner size="lg" borderClassName="border-white" textClassName="text-white" />
            </Box>
            <Box layoutClassName="min-w-0 flex-1 space-y-3">
              <Typography
                size="sm"
                layoutClassName="font-semibold uppercase tracking-wide text-orange-800 dark:text-orange-200"
              >
                {t('billImport.progressTitle')}
              </Typography>
              <Typography
                size="sm"
                layoutClassName="animate-pulse font-medium text-slate-800 dark:text-slate-100"
              >
                {progressStage === 'prepare'
                  ? t('billImport.stagePrepare')
                  : t(PIPELINE_STAGES[activeStepIndex]?.labelKey ?? 'billImport.stageVision')}
              </Typography>
              <Box
                layoutClassName="relative h-2 w-full overflow-hidden rounded-full"
                backgroundClassName="bg-slate-200/80 dark:bg-slate-700"
              >
                <Box
                  layoutClassName="h-full rounded-full"
                  backgroundClassName="bg-gradient-to-r from-orange-400 to-orange-600"
                  stateClassName="transition-[width] duration-700 ease-out"
                  style={{ width: `${progressBarPct}%` }}
                />
              </Box>
              <ul className="m-0 list-none space-y-2 p-0">
                {PIPELINE_STAGES.map((step, i) => {
                  const done = activeStepIndex > i;
                  const current = activeStepIndex === i;
                  return (
                    <li
                      key={step.id}
                      className={
                        'flex items-center gap-3 text-sm transition-colors duration-300 ' +
                        (current
                          ? 'font-semibold text-orange-700 dark:text-orange-300'
                          : done
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500')
                      }
                    >
                      {done ? (
                        <Check className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                      ) : current ? (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-orange-600 dark:text-orange-400" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0" strokeWidth={2} />
                      )}
                      <span>{t(step.labelKey)}</span>
                    </li>
                  );
                })}
              </ul>
            </Box>
          </Box>
        </Card>
      ) : null}

      {validation ? (
        <Card
          padding="md"
          borderClassName="border-emerald-200 dark:border-emerald-800"
          backgroundClassName="bg-emerald-50/80 dark:bg-emerald-950/30"
          layoutClassName="space-y-2"
        >
          <Typography size="sm" layoutClassName="font-semibold text-emerald-900 dark:text-emerald-200">
            {t('billImport.validationTitle')}
          </Typography>
          <Typography size="sm" textClassName="text-emerald-800 dark:text-emerald-100">
            {t('billImport.validationConfidence').replace('{{pct}}', String(Math.round(validation.confidence * 100)))}
          </Typography>
          <Typography size="xs" variant="muted" textClassName="text-emerald-900/80 dark:text-emerald-200/90">
            {t('billImport.validationHeuristic').replace('{{pct}}', String(Math.round(validation.heuristicScore * 100)))}
            {' — '}
            {validation.heuristicNoteVi}
          </Typography>
          <Typography size="xs" textClassName="text-slate-700 dark:text-slate-200">
            {validation.reasonVi}
          </Typography>
        </Card>
      ) : null}

      {ocrText ? (
        <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-2">
          <Typography size="sm" layoutClassName="font-semibold">
            {t('billImport.ocrSection')}
          </Typography>
          <Box
            layoutClassName="max-h-64 overflow-auto rounded-lg p-3"
            backgroundClassName="bg-slate-900"
            textClassName="whitespace-pre-wrap font-mono text-xs text-slate-100"
          >
            {ocrText}
          </Box>
        </Card>
      ) : null}

      {draftStructured ? (
        <>
          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-2">
            <Typography size="sm" layoutClassName="font-semibold">
              {t('billImport.jsonSection')}
            </Typography>
            <Box
              layoutClassName="max-h-56 overflow-auto rounded-lg p-3"
              backgroundClassName="bg-slate-900"
              textClassName="font-mono text-xs text-slate-100"
            >
              <pre className="m-0">{JSON.stringify(draftStructured, null, 2)}</pre>
            </Box>
          </Card>

          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-4">
            <Typography size="sm" layoutClassName="font-semibold">
              {t('billImport.summarySection')}
            </Typography>
            <Box layoutClassName="overflow-x-auto">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHeaderCell layoutClassName="w-48">{t('billImport.supplier')}</TableHeaderCell>
                    <TableCell>
                      <Input
                        value={draftStructured.supplierName ?? ''}
                        onChange={(e) => updateDraftField('supplierName', e.target.value)}
                        placeholder="Nhà cung cấp"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>{t('billImport.branch')}</TableHeaderCell>
                    <TableCell>
                      <Input
                        value={draftStructured.storeOrBranch ?? ''}
                        onChange={(e) => updateDraftField('storeOrBranch', e.target.value)}
                        placeholder="Chi nhánh / địa điểm"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>{t('billImport.dateOnBill')}</TableHeaderCell>
                    <TableCell>
                      <Box layoutClassName="grid gap-2 md:grid-cols-2">
                        <Input
                          value={draftStructured.receiptDate ?? ''}
                          onChange={(e) => updateDraftField('receiptDate', e.target.value)}
                          placeholder="YYYY-MM-DD"
                        />
                        <Input
                          value={draftStructured.receiptTime ?? ''}
                          onChange={(e) => updateDraftField('receiptTime', e.target.value)}
                          placeholder="HH:mm"
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>{t('billImport.lineCount')}</TableHeaderCell>
                    <TableCell>
                      <strong>{draftStructured.productLineCount}</strong>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>{t('billImport.subtotal')}</TableHeaderCell>
                    <TableCell>
                      <Input
                        value={String(draftStructured.subtotal ?? '')}
                        onChange={(e) => updateDraftField('subtotal', Number(e.target.value || 0))}
                        placeholder="Tạm tính"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>{t('billImport.tax')}</TableHeaderCell>
                    <TableCell>
                      <Input
                        value={String(draftStructured.tax ?? '')}
                        onChange={(e) => updateDraftField('tax', Number(e.target.value || 0))}
                        placeholder="Thuế"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>{t('billImport.discount')}</TableHeaderCell>
                    <TableCell>
                      <Input
                        value={String(draftStructured.discount ?? '')}
                        onChange={(e) => updateDraftField('discount', Number(e.target.value || 0))}
                        placeholder="Giảm giá"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>{t('billImport.total')}</TableHeaderCell>
                    <TableCell>
                      <Box layoutClassName="grid gap-2 md:grid-cols-2">
                        <Input
                          value={String(draftStructured.totalAmount ?? '')}
                          onChange={(e) => updateDraftField('totalAmount', Number(e.target.value || 0))}
                          placeholder="Tổng tiền"
                        />
                        <Input
                          value={draftStructured.currency ?? ''}
                          onChange={(e) => updateDraftField('currency', e.target.value)}
                          placeholder="Đơn vị tiền tệ"
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>{t('billImport.payment')}</TableHeaderCell>
                    <TableCell>
                      <Input
                        value={draftStructured.paymentMethod ?? ''}
                        onChange={(e) => updateDraftField('paymentMethod', e.target.value)}
                        placeholder="Phương thức thanh toán"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell>{t('billImport.notes')}</TableHeaderCell>
                    <TableCell>
                      <Input
                        value={draftStructured.notes ?? ''}
                        onChange={(e) => updateDraftField('notes', e.target.value)}
                        placeholder="Ghi chú"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            <Typography size="sm" layoutClassName="font-semibold">
              {t('billImport.items')}
            </Typography>
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
                  {draftStructured.lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell layoutClassName="text-slate-500" colSpan={6}>
                        {t('billImport.emptyLines')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    draftStructured.lineItems.map((it, idx) => (
                      <TableRow key={`${idx}-${it.name}`}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={it.name}
                            onChange={(e) => updateDraftLine(idx, { name: e.target.value })}
                            placeholder="Tên nguyên vật liệu"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={String(it.quantity ?? '')}
                            onChange={(e) => updateDraftLine(idx, { quantity: Number(e.target.value || 0) })}
                            placeholder="SL"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={it.unit ?? ''}
                            onChange={(e) => updateDraftLine(idx, { unit: e.target.value })}
                            placeholder="Đơn vị"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={String(it.unitPrice ?? '')}
                            onChange={(e) => updateDraftLine(idx, { unitPrice: Number(e.target.value || 0) })}
                            placeholder="Đơn giá"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={String(it.lineTotal ?? '')}
                            onChange={(e) => updateDraftLine(idx, { lineTotal: Number(e.target.value || 0) })}
                            placeholder="Thành tiền"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Card>

          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700">
            <Box layoutClassName="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void onSaveDraft()}
                disabled={savingDraft}
                leftIcon={
                  savingDraft ? (
                    <Spinner size="sm" textClassName="text-white" borderClassName="border-white" />
                  ) : (
                    <Check />
                  )
                }
                iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                sizeClassName="px-4 py-2"
                layoutClassName="inline-flex items-center gap-2"
                disableVariantHover
                disableVariantTextColor
              >
                {savingDraft ? t('billImport.savingDraft') : t('billImport.saveDraft')}
              </Button>
            </Box>
          </Card>
        </>
      ) : null}
    </>
  );
};

export default BillImportEntryTab;
