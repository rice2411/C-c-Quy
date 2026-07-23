import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  CreditCard,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Receipt,
  Store,
  Tag,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type {
  BillLineItem,
  BillValidationResult,
  ImportedSupplierSummary,
  StockReceiptStructured,
  SupplierContactInfo,
} from '@/types/billReceipt';
import { SUPPLIER_CHANNELS } from '@/types/billReceipt';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Image from '@/components/ui/Image';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { PIPELINE_STAGES, type UiProgressStage } from '@/pages/StockReceipts/constants';
import SupplierPicker from '@/pages/StockReceipts/SupplierPicker';
import LineTypePicker from '@/pages/StockReceipts/LineTypePicker';
import EmptyState from '@/components/ui/EmptyState';

export interface BillImportEntryTabProps {
  /** true = nhập thủ công (bill viết tay): ẩn panel OCR/JSON, cho đính ảnh lưu trữ. */
  isManual?: boolean;
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
  onAddLine: () => void;
  onRemoveLine: (idx: number) => void;
  /** Đính ảnh bill giấy để lưu trữ ở mode manual (không OCR). */
  onManualImageSelected?: (file: File | undefined) => void;
  supplierList: ImportedSupplierSummary[];
  selectedSupplierId: string | null;
  supplierContact: SupplierContactInfo;
  onSupplierSelect: (next: {
    id: string | null;
    name: string;
    supplier?: ImportedSupplierSummary;
  }) => void;
  onSupplierContactChange: (patch: Partial<SupplierContactInfo>) => void;
}

/**
 * Parse input số tiền/SL: chặn số âm (clamp >= 0). Rỗng → null, NaN → null.
 * Dùng cho quantity / unitPrice / lineTotal / tax / discount / subtotal.
 */
const parseNonNegative = (v: string): number | null => {
  if (v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return Math.max(0, n);
};

const ContactField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  layoutClassName?: string;
}> = ({ label, value, onChange, placeholder, layoutClassName }) => (
  <Box layoutClassName={layoutClassName ?? 'space-y-1'}>
    <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase tracking-wide">
      {label}
    </Typography>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </Box>
);

const BillImportEntryTab: React.FC<BillImportEntryTabProps> = ({
  isManual = false,
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
  onAddLine,
  onRemoveLine,
  onManualImageSelected,
  supplierList,
  selectedSupplierId,
  supplierContact,
  onSupplierSelect,
  onSupplierContactChange,
}) => {
  const { t } = useLanguage();
  const manualImageInputRef = useRef<HTMLInputElement>(null);
  const [showMore, setShowMore] = useState(false);
  const [showOcr, setShowOcr] = useState(false);

  const moneyFmt = useMemo(
    () => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }),
    [],
  );

  const computedTotal = useMemo(() => {
    if (!draftStructured) return 0;
    const lineSum = (draftStructured.lineItems || []).reduce(
      (s, l) => s + (typeof l.lineTotal === 'number' ? l.lineTotal : 0),
      0,
    );
    const tax = typeof draftStructured.tax === 'number' ? draftStructured.tax : 0;
    const shipping =
      typeof draftStructured.shippingFee === 'number' ? draftStructured.shippingFee : 0;
    const discount =
      typeof draftStructured.discount === 'number' ? draftStructured.discount : 0;
    return lineSum + tax + shipping - discount;
  }, [draftStructured]);

  const activeStepIndex =
    progressStage === 'vision' ? 0
      : progressStage === 'validate' ? 1
        : progressStage === 'structure' ? 2
          : progressStage === 'classify' ? 3
            : -1;
  const progressBarPct =
    progressStage === 'prepare'
      ? 10
      : progressStage === 'vision'
        ? 30
        : progressStage === 'validate'
          ? 55
          : progressStage === 'structure'
            ? 80
            : progressStage === 'classify'
              ? 96
              : 0;

  const contact = supplierContact || {};

  return (
    <>
      {previewUrl ? (
        <Card
          padding="none"
          borderClassName="border-slate-200 dark:border-slate-700"
          layoutClassName="overflow-hidden"
        >
          <Image
            src={previewUrl}
            alt="Bill"
            layoutClassName="max-h-48 sm:max-h-80 w-full object-contain bg-slate-50 dark:bg-slate-900"
          />
        </Card>
      ) : null}

      {isManual && onManualImageSelected ? (
        <>
          {/* File input thô: chưa có UI component cho input file (giống pages/Storage/product/*). */}
          <input
            ref={manualImageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              onManualImageSelected(file);
            }}
          />
          <Box layoutClassName="space-y-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => manualImageInputRef.current?.click()}
              leftIcon={<ImagePlus />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-3 py-1.5 text-xs"
              layoutClassName="inline-flex w-fit items-center gap-1.5"
              disableVariantTextColor
            >
              {previewUrl ? 'Đổi ảnh đính kèm' : 'Đính ảnh bill (tuỳ chọn, không OCR)'}
            </Button>
            <Typography size="xs" variant="muted">
              {t('billImport.pasteHint')}
            </Typography>
          </Box>
        </>
      ) : null}

      {busy && progressStage ? (
        <Card
          padding="md"
          borderClassName="border-primary-200 dark:border-primary-900/50"
          backgroundClassName="bg-gradient-to-br from-primary-50/90 to-white dark:from-primary-950/40 dark:to-slate-900"
          layoutClassName="space-y-4 shadow-md shadow-primary-500/10"
        >
          <Box layoutClassName="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Box
              layoutClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              backgroundClassName="bg-primary-500 text-white"
            >
              <Spinner size="lg" borderClassName="border-white" textClassName="text-white" />
            </Box>
            <Box layoutClassName="min-w-0 flex-1 space-y-3">
              <Typography
                size="sm"
                layoutClassName="font-semibold uppercase tracking-wide text-primary-800 dark:text-primary-200"
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
                  backgroundClassName="bg-gradient-to-r from-primary-400 to-primary-600"
                  stateClassName="transition-[width] duration-700 ease-out"
                  style={{ width: `${progressBarPct}%` }}
                />
              </Box>
              <Box layoutClassName="m-0 list-none space-y-2 p-0">
                {PIPELINE_STAGES.map((step, i) => {
                  const done = activeStepIndex > i;
                  const current = activeStepIndex === i;
                  return (
                    <Box
                      key={step.id}
                      layoutClassName="flex items-center gap-3"
                      textClassName="text-sm"
                      stateClassName={
                        'transition-colors duration-300 ' +
                        (current
                          ? 'font-semibold text-primary-700 dark:text-primary-300'
                          : done
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500')
                      }
                    >
                      {done ? (
                        <Check className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                      ) : current ? (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-600 dark:text-primary-400" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0" strokeWidth={2} />
                      )}
                      <Typography as="span">{t(step.labelKey)}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Card>
      ) : null}

      {validation ? (
        <Box
          layoutClassName="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1"
          borderClassName="border-emerald-200 dark:border-emerald-800"
          backgroundClassName="bg-emerald-50/80 dark:bg-emerald-950/30"
          title={`${t('billImport.validationHeuristic').replace('{{pct}}', String(Math.round(validation.heuristicScore * 100)))} — ${validation.heuristicNoteVi}\n${validation.reasonVi}`}
        >
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          <Typography size="xs" textClassName="font-medium text-emerald-800 dark:text-emerald-100">
            {t('billImport.validationConfidence').replace('{{pct}}', String(Math.round(validation.confidence * 100)))}
          </Typography>
        </Box>
      ) : null}

      {!isManual && (ocrText || draftStructured) ? (
        <Box layoutClassName="space-y-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowOcr((v) => !v)}
            leftIcon={showOcr ? <ChevronUp /> : <ChevronDown />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-2 py-1 text-xs"
            layoutClassName="inline-flex w-fit items-center gap-1"
            textClassName="text-slate-500 dark:text-slate-400"
            disableVariantTextColor
          >
            {showOcr ? t('billImport.hideOcrData') : t('billImport.viewOcrData')}
          </Button>
          {showOcr ? (
            <Box layoutClassName="grid gap-4 md:grid-cols-2">
              {ocrText ? (
                <Card
                  padding="md"
                  borderClassName="border-slate-200 dark:border-slate-700"
                  layoutClassName="space-y-2"
                >
                  <Typography size="sm" layoutClassName="font-semibold">
                    {t('billImport.ocrSection')}
                  </Typography>
                  <Box
                    layoutClassName="max-h-72 overflow-auto rounded-lg p-3"
                    backgroundClassName="bg-slate-900"
                    textClassName="whitespace-pre-wrap font-mono text-xs text-slate-100"
                  >
                    {ocrText}
                  </Box>
                </Card>
              ) : null}
              {draftStructured ? (
                <Card
                  padding="md"
                  borderClassName="border-slate-200 dark:border-slate-700"
                  layoutClassName="space-y-2"
                >
                  <Typography size="sm" layoutClassName="font-semibold">
                    {t('billImport.jsonSection')}
                  </Typography>
                  <Box
                    layoutClassName="max-h-72 overflow-auto rounded-lg p-3"
                    backgroundClassName="bg-slate-900"
                    textClassName="font-mono text-xs text-slate-100"
                  >
                    <Box layoutClassName="m-0" textClassName="whitespace-pre-wrap break-all">
                      {JSON.stringify(draftStructured, null, 2)}
                    </Box>
                  </Box>
                </Card>
              ) : null}
            </Box>
          ) : null}
        </Box>
      ) : null}

      {draftStructured ? (
        <>
          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-4">
            <Box layoutClassName="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary-500" />
              <Typography size="sm" layoutClassName="font-semibold">
                Nhà cung cấp
              </Typography>
              <Typography size="xs" variant="muted">
                — chọn NCC đã có (kể cả đã đổi tên) hoặc tạo NCC mới
              </Typography>
            </Box>

            <SupplierPicker
              rawName={draftStructured.supplierName ?? ''}
              selectedId={selectedSupplierId}
              suppliers={supplierList}
              onChange={(next) => {
                updateDraftField('supplierName', next.name || null);
                onSupplierSelect(next);
              }}
            />

            <Box layoutClassName="grid gap-3 sm:grid-cols-2">
              <ContactField
                label="Số điện thoại"
                value={contact.phone ?? ''}
                onChange={(v) => onSupplierContactChange({ phone: v })}
                placeholder="VD: 0901234567"
              />
            </Box>
          </Card>

          {/* ===== TỔNG TIỀN — luôn hiện ===== */}
          <Box
            layoutClassName="flex items-center justify-between gap-3 rounded-lg border p-3"
            borderClassName="border-primary-200 dark:border-primary-800"
            backgroundClassName="bg-primary-50 dark:bg-primary-950/40"
          >
            <Box layoutClassName="flex flex-col gap-0.5">
              <Box layoutClassName="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <Typography size="sm" layoutClassName="font-semibold text-primary-900 dark:text-primary-100">
                  Tổng tiền
                </Typography>
              </Box>
              <Typography size="xs" textClassName="text-primary-800/70 dark:text-primary-200/70">
                = Σ mặt hàng + thuế − giảm giá
              </Typography>
            </Box>
            <Typography
              size="sm"
              layoutClassName="text-right font-bold tabular-nums text-primary-900 dark:text-primary-100"
            >
              {moneyFmt.format(computedTotal)}{' '}
              <Typography as="span" textClassName="text-xs font-medium opacity-70">
                {draftStructured.currency || 'VND'}
              </Typography>
            </Typography>
          </Box>

          {/* ===== TOGGLE THÔNG TIN THÊM ===== */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowMore((v) => !v)}
            leftIcon={showMore ? <ChevronUp /> : <ChevronDown />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-3 py-1.5 text-xs"
            layoutClassName="inline-flex w-fit items-center gap-1.5"
            textClassName="text-slate-600 dark:text-slate-300"
            disableVariantTextColor
          >
            {showMore ? t('billImport.lessInfo') : t('billImport.moreInfo')}
          </Button>

          {showMore ? (
            <Box layoutClassName="space-y-4">
              {/* --- NCC mở rộng --- */}
              <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
                <Box layoutClassName="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary-500" />
                  <Typography size="sm" layoutClassName="font-semibold">
                    Thông tin nhà cung cấp
                  </Typography>
                </Box>
                <Box layoutClassName="grid gap-3 sm:grid-cols-2">
                  <ContactField
                    label="Người liên hệ"
                    value={contact.contactPerson ?? ''}
                    onChange={(v) => onSupplierContactChange({ contactPerson: v })}
                    placeholder="Tên sale / chủ shop"
                  />
                  <ContactField
                    label="Email"
                    value={contact.email ?? ''}
                    onChange={(v) => onSupplierContactChange({ email: v })}
                    placeholder="contact@example.com"
                  />
                  <ContactField
                    label="MST"
                    value={contact.taxCode ?? ''}
                    onChange={(v) => onSupplierContactChange({ taxCode: v })}
                    placeholder="Mã số thuế"
                  />
                  <Box layoutClassName="space-y-1">
                    <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase tracking-wide">
                      Loại
                    </Typography>
                    <Select
                      fullWidth
                      value={contact.channel ?? ''}
                      onChange={(e) => onSupplierContactChange({ channel: e.target.value })}
                    >
                      <option value="">Chưa phân loại</option>
                      {SUPPLIER_CHANNELS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </Box>
                  <ContactField
                    label="Danh mục"
                    value={contact.category ?? ''}
                    onChange={(v) => onSupplierContactChange({ category: v })}
                    placeholder="VD: Bột & ngũ cốc"
                  />
                  <ContactField
                    label="Địa chỉ"
                    value={contact.address ?? ''}
                    onChange={(v) => onSupplierContactChange({ address: v })}
                    placeholder="Số nhà, đường, quận, TP"
                    layoutClassName="space-y-1 sm:col-span-2"
                  />
                  <ContactField
                    label="Ghi chú NCC"
                    value={contact.notes ?? ''}
                    onChange={(v) => onSupplierContactChange({ notes: v })}
                    placeholder="Giá tốt, giao nhanh…"
                    layoutClassName="space-y-1 sm:col-span-2"
                  />
                </Box>
                <Typography size="xs" variant="muted">
                  {isManual
                    ? 'Chọn NCC đã có hoặc gõ tên NCC mới. Trường trống sẽ không ghi đè dữ liệu cũ của NCC.'
                    : 'SĐT / địa chỉ được tự điền từ OCR. Trường trống sẽ không ghi đè dữ liệu cũ của NCC.'}
                </Typography>
              </Card>

              <Box layoutClassName="grid gap-4 lg:grid-cols-2">
                {/* --- Thông tin phiếu --- */}
                <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
                  <Box layoutClassName="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary-500" />
                    <Typography size="sm" layoutClassName="font-semibold">
                      Thông tin phiếu
                    </Typography>
                  </Box>
                  <Box layoutClassName="grid gap-3 sm:grid-cols-2">
                    <ContactField
                      label="Mã / Số HĐ"
                      value={draftStructured.invoiceNumber ?? ''}
                      onChange={(v) => updateDraftField('invoiceNumber', v || null)}
                      placeholder="VD: HĐGTGT 00012345"
                      layoutClassName="space-y-1 sm:col-span-2"
                    />
                    <ContactField
                      label="Ngày trên bill"
                      value={draftStructured.receiptDate ?? ''}
                      onChange={(v) => updateDraftField('receiptDate', v || null)}
                      placeholder="YYYY-MM-DD (mặc định hôm nay)"
                    />
                    <ContactField
                      label="Giờ"
                      value={draftStructured.receiptTime ?? ''}
                      onChange={(v) => updateDraftField('receiptTime', v || null)}
                      placeholder="HH:mm"
                    />
                    <ContactField
                      label="Chi nhánh / địa điểm"
                      value={draftStructured.storeOrBranch ?? ''}
                      onChange={(v) => updateDraftField('storeOrBranch', v || null)}
                      placeholder="Tên chi nhánh nếu có"
                      layoutClassName="space-y-1 sm:col-span-2"
                    />
                    <ContactField
                      label="Phương thức thanh toán"
                      value={draftStructured.paymentMethod ?? ''}
                      onChange={(v) => updateDraftField('paymentMethod', v || null)}
                      placeholder="Tiền mặt / Chuyển khoản / Pos"
                      layoutClassName="space-y-1 sm:col-span-2"
                    />
                    <ContactField
                      label="Ghi chú bill"
                      value={draftStructured.notes ?? ''}
                      onChange={(v) => updateDraftField('notes', v || null)}
                      placeholder="Ghi chú riêng cho phiếu này"
                      layoutClassName="space-y-1 sm:col-span-2"
                    />
                  </Box>
                  <Box
                    layoutClassName="flex items-center gap-2 rounded-md p-2 text-xs"
                    backgroundClassName="bg-slate-50 dark:bg-slate-800/60"
                  >
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    <Typography size="xs" variant="muted">
                      Số dòng mặt hàng:{' '}
                      <Typography as="span" textClassName="font-semibold text-slate-700 dark:text-slate-100">
                        {draftStructured.productLineCount}
                      </Typography>
                    </Typography>
                  </Box>
                </Card>

                {/* --- Tài chính phụ --- */}
                <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
                  <Box layoutClassName="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary-500" />
                    <Typography size="sm" layoutClassName="font-semibold">
                      Tài chính
                    </Typography>
                  </Box>

                  <Box layoutClassName="grid gap-3 sm:grid-cols-2">
                    <ContactField
                      label="Tạm tính"
                      value={String(draftStructured.subtotal ?? '')}
                      onChange={(v) => updateDraftField('subtotal', parseNonNegative(v))}
                      placeholder="0"
                    />
                    <ContactField
                      label="Thuế"
                      value={String(draftStructured.tax ?? '')}
                      onChange={(v) => updateDraftField('tax', parseNonNegative(v))}
                      placeholder="0"
                    />
                    <ContactField
                      label="Phí vận chuyển"
                      value={String(draftStructured.shippingFee ?? '')}
                      onChange={(v) => updateDraftField('shippingFee', parseNonNegative(v))}
                      placeholder="0"
                    />
                    <ContactField
                      label="Giảm giá (gồm ưu đãi ship)"
                      value={String(draftStructured.discount ?? '')}
                      onChange={(v) => updateDraftField('discount', parseNonNegative(v))}
                      placeholder="0"
                    />
                    <ContactField
                      label="Đơn vị tiền"
                      value={draftStructured.currency ?? ''}
                      onChange={(v) => updateDraftField('currency', v)}
                      placeholder="VND"
                    />
                  </Box>
                </Card>
              </Box>
            </Box>
          ) : null}

          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
            <Typography size="sm" layoutClassName="font-semibold">
              {t('billImport.items')}
            </Typography>

            {/* ===== MOBILE: card layout (mỗi line = 1 card với labels) ===== */}
            <Box layoutClassName="space-y-3 md:hidden">
              {draftStructured.lineItems.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6" />}
                  title={t('billImport.emptyLines')}
                />
              ) : (
                draftStructured.lineItems.map((it, idx) => (
                  <Box
                    key={`m-${idx}`}
                    layoutClassName="rounded-xl border p-3 space-y-2"
                    borderClassName="border-slate-200 dark:border-slate-700"
                    backgroundClassName="bg-slate-50/60 dark:bg-slate-900/40"
                  >
                    <Box layoutClassName="flex items-center justify-between">
                      <Typography size="xs" variant="muted" layoutClassName="font-bold uppercase tracking-wider">
                        #{idx + 1}
                      </Typography>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onRemoveLine(idx)}
                        leftIcon={<Trash2 />}
                        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                        sizeClassName="px-2 py-1 text-xs"
                        layoutClassName="inline-flex items-center gap-1"
                        textClassName="text-red-600 dark:text-red-400"
                      >
                        Xoá
                      </Button>
                    </Box>
                    <ContactField
                      label={t('billImport.colName')}
                      value={it.name ?? ''}
                      onChange={(v) => updateDraftLine(idx, { name: v })}
                      placeholder="Tên nguyên vật liệu"
                    />
                    <Box layoutClassName="grid grid-cols-2 gap-2">
                      <ContactField
                        label={t('billImport.colQty')}
                        value={String(it.quantity ?? '')}
                        onChange={(v) => updateDraftLine(idx, { quantity: parseNonNegative(v) })}
                        placeholder="SL"
                      />
                      <ContactField
                        label={t('billImport.colUnit')}
                        value={it.unit ?? ''}
                        onChange={(v) => updateDraftLine(idx, { unit: v })}
                        placeholder="Đơn vị"
                      />
                      <ContactField
                        label={t('billImport.colPrice')}
                        value={String(it.unitPrice ?? '')}
                        onChange={(v) => updateDraftLine(idx, { unitPrice: parseNonNegative(v) })}
                        placeholder="Đơn giá"
                      />
                      <ContactField
                        label={t('billImport.colLineTotal')}
                        value={String(it.lineTotal ?? '')}
                        onChange={(v) => updateDraftLine(idx, { lineTotal: parseNonNegative(v) })}
                        placeholder="Thành tiền"
                      />
                    </Box>
                    <Box layoutClassName="space-y-1">
                      <Typography as="span" size="xs" variant="muted" layoutClassName="font-medium uppercase tracking-wide">Phân loại</Typography>
                      <LineTypePicker line={it} onChange={(patch) => updateDraftLine(idx, patch)} />
                    </Box>
                  </Box>
                ))
              )}
            </Box>

            {/* ===== TABLET/DESKTOP: table layout ===== */}
            <Box layoutClassName="hidden md:block overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>#</TableHeaderCell>
                    <TableHeaderCell>{t('billImport.colName')}</TableHeaderCell>
                    <TableHeaderCell>{t('billImport.colQty')}</TableHeaderCell>
                    <TableHeaderCell>{t('billImport.colUnit')}</TableHeaderCell>
                    <TableHeaderCell>{t('billImport.colPrice')}</TableHeaderCell>
                    <TableHeaderCell>{t('billImport.colLineTotal')}</TableHeaderCell>
                    <TableHeaderCell>Loại</TableHeaderCell>
                    <TableHeaderCell> </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draftStructured.lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <EmptyState
                          icon={<FileText className="h-6 w-6" />}
                          title={t('billImport.emptyLines')}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    draftStructured.lineItems.map((it, idx) => (
                      <TableRow key={`d-${idx}`}>
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
                            onChange={(e) =>
                              updateDraftLine(idx, {
                                quantity: parseNonNegative(e.target.value),
                              })
                            }
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
                            onChange={(e) =>
                              updateDraftLine(idx, {
                                unitPrice: parseNonNegative(e.target.value),
                              })
                            }
                            placeholder="Đơn giá"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={String(it.lineTotal ?? '')}
                            onChange={(e) =>
                              updateDraftLine(idx, {
                                lineTotal: parseNonNegative(e.target.value),
                              })
                            }
                            placeholder="Thành tiền"
                          />
                        </TableCell>
                        <TableCell layoutClassName="min-w-[9rem]">
                          <LineTypePicker line={it} onChange={(patch) => updateDraftLine(idx, patch)} />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onRemoveLine(idx)}
                            leftIcon={<Trash2 />}
                            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                            sizeClassName="px-2 py-1"
                            layoutClassName="inline-flex items-center"
                            textClassName="text-red-600 dark:text-red-400"
                            aria-label="Xoá dòng"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            <Box layoutClassName="flex justify-start">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onAddLine()}
                leftIcon={<Plus />}
                iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                sizeClassName="px-3 py-1.5 text-xs"
                layoutClassName="inline-flex items-center gap-1.5"
                disableVariantTextColor
              >
                Thêm dòng
              </Button>
            </Box>
          </Card>

          <Card
            padding="md"
            borderClassName="border-slate-200 dark:border-slate-700"
            layoutClassName="sticky bottom-2 z-20 shadow-lg shadow-slate-900/10 dark:shadow-black/40 md:static md:shadow-none"
          >
            <Box layoutClassName="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <Typography size="xs" variant="muted">
                {selectedSupplierId
                  ? 'Phiếu sẽ được gộp vào NCC đã chọn (counter & lịch sử + 1).'
                  : 'NCC mới sẽ được tạo từ tên hiện tại.'}
              </Typography>
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
                sizeClassName="px-4 py-2.5 sm:py-2"
                layoutClassName="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                textClassName="text-white"
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
