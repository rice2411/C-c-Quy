import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, Circle, Loader2, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { runBillImportPipeline, type BillImportProgressStage } from '@/services/billReceiptPipeline';
import type {
  BillLineItem,
  BillValidationResult,
  ImportedMaterialSummary,
  ImportedSupplierSummary,
  SavedStockReceiptDetail,
  SavedStockReceiptSummary,
  StockReceiptStructured,
} from '@/types/billReceipt';
import { formatVND } from '@/utils/currencyUtil';
import {
  fetchImportedMaterials,
  fetchImportedSuppliers,
  fetchStockReceiptDetail,
  fetchStockReceiptSummaries,
  saveStockReceiptDraft,
} from '@/services/stockReceiptService';
import { useAuth } from '@/contexts/AuthContext';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';

type UiProgressStage = 'prepare' | BillImportProgressStage;

const PIPELINE_STAGES: { id: BillImportProgressStage; labelKey: string }[] = [
  { id: 'vision', labelKey: 'billImport.stageVision' },
  { id: 'validate', labelKey: 'billImport.stageValidate' },
  { id: 'structure', labelKey: 'billImport.stageStructure' },
];

const normalizeText = (value: string | null | undefined): string => (value || '').trim().toLowerCase();

function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return formatVND(n);
}

async function fileToBase64NoPrefix(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== 'string') {
        reject(new Error('read'));
        return;
      }
      const i = r.indexOf(',');
      resolve(i >= 0 ? r.slice(i + 1) : r);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const BillImportPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedImageMimeType, setUploadedImageMimeType] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [draftStructured, setDraftStructured] = useState<StockReceiptStructured | null>(null);
  const [validation, setValidation] = useState<BillValidationResult | null>(null);
  const [progressStage, setProgressStage] = useState<UiProgressStage | null>(null);
  const [activeTab, setActiveTab] = useState<'bills' | 'receiptList' | 'suppliers' | 'materials'>('bills');
  const [masterLoading, setMasterLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptRows, setReceiptRows] = useState<SavedStockReceiptSummary[]>([]);
  const [receiptDetail, setReceiptDetail] = useState<SavedStockReceiptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [supplierRows, setSupplierRows] = useState<ImportedSupplierSummary[]>([]);
  const [materialRows, setMaterialRows] = useState<ImportedMaterialSummary[]>([]);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  const resetOutput = useCallback(() => {
    setOcrText('');
    setDraftStructured(null);
    setValidation(null);
    setUploadedImageBase64(null);
    setUploadedImageMimeType(null);
  }, []);

  const onFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) {
      if (file) toast.error(t('billImport.invalidFile'));
      return;
    }
    resetOutput();
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    setBusy(true);
    setProgressStage('prepare');
    try {
      const b64 = await fileToBase64NoPrefix(file);
      setUploadedImageBase64(b64);
      setUploadedImageMimeType(file.type || null);
      const result = await runBillImportPipeline(b64, {
        onProgress: (stage) => setProgressStage(stage),
      });
      setOcrText(result.ocrText);
      setDraftStructured(result.structured);
      setValidation(result.validation);
      toast.success(t('billImport.done'));
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setBusy(false);
      setProgressStage(null);
    }
  };

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

  const handleSaveDraft = async () => {
    if (!draftStructured || !validation || !ocrText) {
      toast.error(t('billImport.missingSaveData'));
      return;
    }
    setSavingDraft(true);
    try {
      const newId = await saveStockReceiptDraft({
        structured: draftStructured,
        validation,
        ocrText,
        receiptImageBase64: uploadedImageBase64,
        receiptImageMimeType: uploadedImageMimeType,
        createdByUid: currentUser?.uid ?? null,
      });
      toast.success(t('billImport.saved'));
      navigate(`/bill-import/receipts?id=${newId}`);
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg);
    } finally {
      setSavingDraft(false);
    }
  };

  const loadMasters = useCallback(async () => {
    setMasterLoading(true);
    try {
      const [suppliers, materials] = await Promise.all([
        fetchImportedSuppliers(),
        fetchImportedMaterials(),
      ]);
      setSupplierRows(suppliers);
      setMaterialRows(materials);
    } finally {
      setMasterLoading(false);
    }
  }, []);

  const loadReceipts = useCallback(async () => {
    setReceiptLoading(true);
    try {
      const receipts = await fetchStockReceiptSummaries();
      setReceiptRows(receipts);
    } finally {
      setReceiptLoading(false);
    }
  }, []);

  const openReceiptDetail = useCallback(async (receiptId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const detail = await fetchStockReceiptDetail(receiptId);
      setReceiptDetail(detail);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeReceiptDetail = useCallback(() => {
    setDetailOpen(false);
    setReceiptDetail(null);
  }, []);

  const updateDraftField = <K extends keyof StockReceiptStructured>(key: K, value: StockReceiptStructured[K]) => {
    setDraftStructured((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateDraftLine = (idx: number, patch: Partial<BillLineItem>) => {
    setDraftStructured((prev) => {
      if (!prev) return prev;
      const nextLines = [...prev.lineItems];
      const cur = nextLines[idx];
      if (!cur) return prev;
      nextLines[idx] = { ...cur, ...patch };
      return { ...prev, lineItems: nextLines };
    });
  };

  useEffect(() => {
    void loadReceipts();
  }, [loadReceipts]);

  const filteredReceipts = receiptRows.filter((row) => {
    const q = normalizeText(receiptSearch);
    if (!q) return true;
    return (
      normalizeText(row.supplierNameRaw).includes(q) ||
      normalizeText(row.receiptDate).includes(q) ||
      normalizeText(row.id).includes(q)
    );
  });

  const filteredSuppliers = supplierRows.filter((row) => {
    const q = normalizeText(supplierSearch);
    if (!q) return true;
    return normalizeText(row.name).includes(q) || normalizeText(row.normalizedName).includes(q);
  });

  const filteredMaterials = materialRows.filter((row) => {
    const q = normalizeText(materialSearch);
    if (!q) return true;
    return normalizeText(row.name).includes(q) || normalizeText(row.normalizedName).includes(q);
  });

  return (
    <Box layoutClassName="space-y-6 animate-fade-in">
      <Box>
        <Heading level={2} textClassName="flex items-center gap-2 text-xl font-semibold">
          <ScanLine className="h-6 w-6 text-orange-500" />
          {t('header.billImportTitle')}
        </Heading>
        <Typography size="sm" variant="muted" layoutClassName="mt-1">
          {t('billImport.subtitle')}
        </Typography>
        <Typography size="xs" variant="muted" layoutClassName="mt-1">
          {t('billImport.validationHint')}
        </Typography>
      </Box>

      <Tabs
        items={[
          { id: 'bills', label: 'Nhập bill' },
          { id: 'receiptList', label: 'List bill' },
          { id: 'suppliers', label: 'Nhà cung cấp' },
          { id: 'materials', label: 'Nguyên vật liệu' },
        ]}
        value={activeTab}
        onChange={(value) => {
          const next = value as 'bills' | 'receiptList' | 'suppliers' | 'materials';
          setActiveTab(next);
          if (next === 'suppliers' || next === 'materials') {
            void loadMasters();
          }
          if (next === 'receiptList') void loadReceipts();
        }}
      />

      {activeTab === 'bills' ? (
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
            {t('billImport.validationConfidence').replace(
              '{{pct}}',
              String(Math.round(validation.confidence * 100))
            )}
          </Typography>
          <Typography size="xs" variant="muted" textClassName="text-emerald-900/80 dark:text-emerald-200/90">
            {t('billImport.validationHeuristic').replace(
              '{{pct}}',
              String(Math.round(validation.heuristicScore * 100))
            )}
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
                onClick={() => void handleSaveDraft()}
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
      ) : activeTab === 'receiptList' ? (
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
                onClick={() => void loadReceipts()}
                disabled={receiptLoading}
              >
                {receiptLoading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </Box>
            <Input
              value={receiptSearch}
              onChange={(e) => setReceiptSearch(e.target.value)}
              placeholder="Tìm bill theo NCC, ngày hoặc mã phiếu..."
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
                      <TableHeaderCell>Nhà cung cấp</TableHeaderCell>
                      <TableHeaderCell>Tổng tiền</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredReceipts.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        onClick={() => void openReceiptDetail(row.id)}
                      >
                        <TableCell>{row.receiptDate || '—'}</TableCell>
                        <TableCell>{row.supplierNameRaw || '—'}</TableCell>
                        <TableCell>{formatMoney(row.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Card>
        </Box>
      ) : activeTab === 'suppliers' ? (
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
                onClick={() => void loadMasters()}
                disabled={masterLoading}
              >
                {masterLoading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </Box>
            <Input
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
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
                        <TableCell>{formatMoney(row.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Card>
        </Box>
      ) : (
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
                onClick={() => void loadMasters()}
                disabled={masterLoading}
              >
                {masterLoading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </Box>
            <Input
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
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
                        <TableCell>{formatMoney(row.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Card>
        </Box>
      )}

      {detailOpen ? (
        <Box
          layoutClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
          backgroundClassName="bg-slate-900/60"
          onClick={closeReceiptDetail}
        >
          <Card
            padding="md"
            borderClassName="border-slate-200 dark:border-slate-700"
            layoutClassName="max-h-[85vh] w-full max-w-2xl space-y-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Box layoutClassName="flex items-center justify-between">
              <Typography size="sm" layoutClassName="font-semibold">
                Chi tiết bill
              </Typography>
              <button
                type="button"
                className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                onClick={closeReceiptDetail}
              >
                Đóng
              </button>
            </Box>

            {detailLoading ? (
              <Typography size="sm" variant="muted">
                Đang tải chi tiết...
              </Typography>
            ) : !receiptDetail ? (
              <Typography size="sm" variant="muted">
                Không tìm thấy dữ liệu bill.
              </Typography>
            ) : (
              <Box layoutClassName="space-y-3">
                <Box layoutClassName="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <Typography size="sm">
                    <strong>Tên nhà cung cấp:</strong> {receiptDetail.supplierNameRaw || '—'}
                  </Typography>
                  <Typography size="sm" layoutClassName="mt-1">
                    <strong>Ngày giờ:</strong> {receiptDetail.receiptDate || '—'}
                  </Typography>
                </Box>

                {receiptDetail.receiptImageBase64 ? (
                  <Box layoutClassName="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <img
                      src={`data:${receiptDetail.receiptImageMimeType || 'image/jpeg'};base64,${receiptDetail.receiptImageBase64}`}
                      alt="Bill"
                      className="max-h-80 w-full object-contain bg-slate-50 dark:bg-slate-900"
                    />
                  </Box>
                ) : null}

                <Box layoutClassName="rounded-lg border border-slate-200 dark:border-slate-700">
                  <Box layoutClassName="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                    <Typography size="sm" layoutClassName="font-semibold">
                      Sản phẩm
                    </Typography>
                  </Box>
                  <Box layoutClassName="space-y-2 p-3">
                    {receiptDetail.lineItems.length === 0 ? (
                      <Typography size="sm" variant="muted">
                        Không có dòng sản phẩm.
                      </Typography>
                    ) : (
                      receiptDetail.lineItems.map((item, idx) => (
                        <Box key={`${item.name}-${idx}`} layoutClassName="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800">
                          <Typography size="sm">{item.name || `Sản phẩm ${idx + 1}`}</Typography>
                          <Typography size="sm" layoutClassName="font-semibold">
                            {formatMoney(item.lineTotal)}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </Card>
        </Box>
      ) : null}
    </Box>
  );
};

export default BillImportPage;
