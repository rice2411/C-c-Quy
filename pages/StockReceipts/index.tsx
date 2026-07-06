import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type {
  BillLineItem,
  BillValidationResult,
  ImportedSupplierSummary,
  SavedStockReceiptDetail,
  StockReceiptStructured,
  SupplierContactInfo,
} from '@/types/billReceipt';
import {
  useImportedSuppliers,
  useStockReceiptDetail,
  useStockReceiptMutations,
  useStockReceiptSummaries,
} from '@/hooks/queries/useStockReceiptQuery';
import { runBillImportPipeline } from '@/services/billReceiptPipeline';
import { useAuth } from '@/contexts/AuthContext';
import Box from '@/components/ui/Box';
import BillImportEntryTab from '@/pages/StockReceipts/BillImportEntryTab';
import BillImportReceiptListTab from '@/pages/StockReceipts/BillImportReceiptListTab';
import ReceiptDetailModal from '@/pages/StockReceipts/ReceiptDetailModal';
import BillImportModal from '@/pages/StockReceipts/BillImportModal';
import type { UiProgressStage } from '@/pages/StockReceipts/constants';
import { fileToBase64NoPrefix } from '@/utils/io/fileUtil';
import { formatImportedAt } from '@/utils/format/dateUtil';
import { normalizeSearchText } from '@/utils/format/stringUtil';

const EMPTY_CONTACT: SupplierContactInfo = {};

const EMPTY_LINE: BillLineItem = {
  name: '',
  quantity: null,
  unit: null,
  unitPrice: null,
  lineTotal: null,
};

/** Phiếu trống cho luồng nhập thủ công (không OCR) — 1 dòng hàng sẵn để gõ. */
const buildEmptyStructured = (): StockReceiptStructured => ({
  supplierName: null,
  supplierPhone: null,
  supplierAddress: null,
  invoiceNumber: null,
  storeOrBranch: null,
  receiptDate: null,
  receiptTime: null,
  lineItems: [{ ...EMPTY_LINE }],
  productLineCount: 0,
  subtotal: null,
  tax: null,
  discount: null,
  totalAmount: null,
  currency: 'VND',
  paymentMethod: null,
  notes: null,
});

/** Validation snapshot mặc định cho phiếu nhập thủ công (không qua OCR/gating). */
const MANUAL_VALIDATION = {
  isLikelyReceipt: true,
  confidence: 1,
  reasonVi: 'Nhập thủ công',
  heuristicScore: 1,
  heuristicNoteVi: 'manual',
} as const;

const StockReceiptsPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedImageMimeType, setUploadedImageMimeType] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [draftStructured, setDraftStructured] = useState<StockReceiptStructured | null>(null);
  const [validation, setValidation] = useState<BillValidationResult | null>(null);
  const [progressStage, setProgressStage] = useState<UiProgressStage | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'ocr' | 'manual'>('ocr');
  const [detailReceiptId, setDetailReceiptId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState('');

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierContact, setSupplierContact] = useState<SupplierContactInfo>(EMPTY_CONTACT);

  // Data qua React Query (epic #58 — P8). queryFn gọi thẳng stockReceiptService.
  // supplierRows vẫn cần cho EntryTab (supplierList) + SupplierPicker.
  const receiptsQuery = useStockReceiptSummaries();
  const suppliersQuery = useImportedSuppliers();
  const detailQuery = useStockReceiptDetail(detailReceiptId);
  const { saveDraft } = useStockReceiptMutations();

  const receiptRows = receiptsQuery.receipts;
  const supplierRows = suppliersQuery.suppliers;
  const receiptLoading = receiptsQuery.loading;
  const receiptDetail: SavedStockReceiptDetail | null = detailQuery.detail;
  const detailLoading = detailQuery.loading;

  const loadReceipts = useCallback(async () => {
    await receiptsQuery.refetch();
  }, [receiptsQuery]);

  const resetOutput = useCallback(() => {
    setOcrText('');
    setDraftStructured(null);
    setValidation(null);
    setUploadedImageBase64(null);
    setUploadedImageMimeType(null);
    setSelectedSupplierId(null);
    setSupplierContact(EMPTY_CONTACT);
  }, []);

  const resetAndClosePreview = useCallback(() => {
    resetOutput();
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [resetOutput]);

  const runPipelineForFile = useCallback(
    async (file: File) => {
      resetOutput();
      setEntryMode('ocr');
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
        // Pre-fill supplier contact form từ SĐT / địa chỉ Gemini trích được.
        setSupplierContact({
          phone: result.structured.supplierPhone ?? null,
          address: result.structured.supplierAddress ?? null,
        });
        toast.success(t('billImport.done'));
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(msg);
      } finally {
        setBusy(false);
        setProgressStage(null);
      }
    },
    [resetOutput, t],
  );

  const handleFileSelected = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error(t('billImport.invalidFile'));
        return;
      }
      setImportModalOpen(true);
      void runPipelineForFile(file);
    },
    [runPipelineForFile, t],
  );

  // Mở form nhập THỦ CÔNG: phiếu trống, KHÔNG chạy OCR.
  const handleStartManual = useCallback(() => {
    resetAndClosePreview();
    setEntryMode('manual');
    setDraftStructured(buildEmptyStructured());
    setImportModalOpen(true);
  }, [resetAndClosePreview]);

  // Đính ảnh bill (giấy) để LƯU TRỮ ở mode manual — không chạy OCR pipeline.
  const handleManualImageSelected = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error(t('billImport.invalidFile'));
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      try {
        const b64 = await fileToBase64NoPrefix(file);
        setUploadedImageBase64(b64);
        setUploadedImageMimeType(file.type || null);
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : String(e));
      }
    },
    [t],
  );

  const addDraftLine = useCallback(() => {
    setDraftStructured((prev) =>
      prev ? { ...prev, lineItems: [...prev.lineItems, { ...EMPTY_LINE }] } : prev,
    );
  }, []);

  const removeDraftLine = useCallback((idx: number) => {
    setDraftStructured((prev) =>
      prev ? { ...prev, lineItems: prev.lineItems.filter((_, i) => i !== idx) } : prev,
    );
  }, []);

  const handleSaveDraft = async () => {
    const isManual = entryMode === 'manual';
    if (!draftStructured) {
      toast.error(t('billImport.missingSaveData'));
      return;
    }
    if (!isManual && (!validation || !ocrText)) {
      toast.error(t('billImport.missingSaveData'));
      return;
    }
    if (isManual) {
      const hasSupplier = (draftStructured.supplierName ?? '').trim() !== '';
      const validLines = draftStructured.lineItems.filter(
        (l) => (l.name ?? '').trim() !== '',
      );
      if (!hasSupplier) {
        toast.error('Nhập tên nhà cung cấp trước khi lưu.');
        return;
      }
      if (validLines.length === 0) {
        toast.error('Thêm ít nhất 1 dòng hàng có tên.');
        return;
      }
    }
    setSavingDraft(true);
    try {
      // Tổng tiền: nếu user/OCR đã nhập totalAmount (typeof number) thì GIỮ NGUYÊN,
      // chỉ tự tính lineSum + tax - discount khi totalAmount null/undefined.
      const hasExplicitTotal = typeof draftStructured.totalAmount === 'number';
      const lineSum = (draftStructured.lineItems || []).reduce(
        (s, l) => s + (typeof l.lineTotal === 'number' ? l.lineTotal : 0),
        0,
      );
      const taxV = typeof draftStructured.tax === 'number' ? draftStructured.tax : 0;
      const discountV =
        typeof draftStructured.discount === 'number' ? draftStructured.discount : 0;
      const validLineCount = (draftStructured.lineItems || []).filter(
        (l) => (l.name ?? '').trim() !== '',
      ).length;
      const structuredForSave: StockReceiptStructured = {
        ...draftStructured,
        totalAmount: hasExplicitTotal
          ? draftStructured.totalAmount
          : lineSum + taxV - discountV,
        productLineCount: isManual ? validLineCount : draftStructured.productLineCount,
      };
      await saveDraft({
        structured: structuredForSave,
        validation: validation ?? MANUAL_VALIDATION,
        ocrText: isManual ? '' : ocrText,
        source: isManual ? 'manual' : 'ocr',
        receiptImageBase64: uploadedImageBase64,
        receiptImageMimeType: uploadedImageMimeType,
        createdByUid: currentUser?.uid ?? null,
        targetSupplierId: selectedSupplierId,
        supplierContact,
      });
      toast.success(t('billImport.saved'));
      setImportModalOpen(false);
      setEntryMode('ocr');
      resetAndClosePreview();
    } catch (error) {
      console.error(error);
      const rawMsg = error instanceof Error ? error.message : String(error);
      if (rawMsg.startsWith('DUPLICATE_BILL:')) {
        const existingId = rawMsg.split(':')[1];
        toast.error(
          `Bill này đã được nhập trước đó (id: ${existingId}). Mở danh sách phiếu để xem.`,
          { duration: 6000 },
        );
      } else if (rawMsg === 'TOO_MANY_LINES') {
        toast.error('Bill có quá nhiều dòng (>240). Chia làm nhiều lần nhập.');
      } else {
        toast.error(rawMsg);
      }
    } finally {
      setSavingDraft(false);
    }
  };

  const openReceiptDetail = useCallback((receiptId: string) => {
    setDetailReceiptId(receiptId);
    setDetailOpen(true);
  }, []);

  const closeReceiptDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailReceiptId(null);
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

  const handleSupplierSelect = useCallback(
    (next: { id: string | null; name: string; supplier?: ImportedSupplierSummary }) => {
      setSelectedSupplierId(next.id);
      if (next.supplier) {
        setSupplierContact({
          phone: next.supplier.phone ?? null,
          address: next.supplier.address ?? null,
          contactPerson: next.supplier.contactPerson ?? null,
          email: next.supplier.email ?? null,
          taxCode: next.supplier.taxCode ?? null,
          category: next.supplier.category ?? null,
          notes: next.supplier.notes ?? null,
        });
      }
    },
    [],
  );

  const handleSupplierContactChange = useCallback((patch: Partial<SupplierContactInfo>) => {
    setSupplierContact((prev) => ({ ...prev, ...patch }));
  }, []);

  const closeImportModal = useCallback(() => {
    setImportModalOpen(false);
    setEntryMode('ocr');
    resetAndClosePreview();
  }, [resetAndClosePreview]);

  const filteredReceipts = receiptRows.filter((row) => {
    const q = normalizeSearchText(receiptSearch);
    if (!q) return true;
    const importedLabel = formatImportedAt(row.createdAt);
    return (
      normalizeSearchText(row.supplierNameRaw).includes(q) ||
      normalizeSearchText(row.receiptDate).includes(q) ||
      normalizeSearchText(row.createdAt).includes(q) ||
      normalizeSearchText(importedLabel).includes(q) ||
      normalizeSearchText(row.id).includes(q) ||
      normalizeSearchText(row.invoiceNumber).includes(q)
    );
  });

  return (
    <Box layoutClassName="space-y-6 animate-fade-in">
      <BillImportReceiptListTab
        receiptSearch={receiptSearch}
        onReceiptSearchChange={setReceiptSearch}
        receiptLoading={receiptLoading}
        onRefresh={loadReceipts}
        filteredReceipts={filteredReceipts}
        onRowClick={openReceiptDetail}
        onFileSelected={handleFileSelected}
        onStartManual={handleStartManual}
      />

      <BillImportModal
        open={importModalOpen}
        onClose={closeImportModal}
        title={entryMode === 'manual' ? 'Nhập phiếu thủ công' : 'Nhập bill mới'}
      >
        <BillImportEntryTab
          isManual={entryMode === 'manual'}
          busy={busy}
          previewUrl={previewUrl}
          progressStage={progressStage}
          validation={validation}
          ocrText={ocrText}
          draftStructured={draftStructured}
          savingDraft={savingDraft}
          onSaveDraft={handleSaveDraft}
          updateDraftField={updateDraftField}
          updateDraftLine={updateDraftLine}
          onAddLine={addDraftLine}
          onRemoveLine={removeDraftLine}
          onManualImageSelected={handleManualImageSelected}
          supplierList={supplierRows}
          selectedSupplierId={selectedSupplierId}
          supplierContact={supplierContact}
          onSupplierSelect={handleSupplierSelect}
          onSupplierContactChange={handleSupplierContactChange}
        />
      </BillImportModal>

      <ReceiptDetailModal
        open={detailOpen}
        detailLoading={detailLoading}
        receiptDetail={receiptDetail}
        onClose={closeReceiptDetail}
      />
    </Box>
  );
};

export default StockReceiptsPage;
