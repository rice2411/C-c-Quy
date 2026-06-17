import React, { useCallback, useEffect, useState } from 'react';
import { ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type {
  BillLineItem,
  BillValidationResult,
  ImportedMaterialSummary,
  ImportedSupplierSummary,
  SavedStockReceiptDetail,
  SavedStockReceiptSummary,
  StockReceiptStructured,
  SupplierContactInfo,
} from '@/types/billReceipt';
import {
  fetchImportedMaterials,
  fetchImportedSuppliers,
  fetchStockReceiptDetail,
  fetchStockReceiptSummaries,
  saveStockReceiptDraft,
} from '@/services/stockReceiptService';
import { runBillImportPipeline } from '@/services/billReceiptPipeline';
import { useAuth } from '@/contexts/AuthContext';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Tabs from '@/components/ui/Tabs';
import BillImportEntryTab from '@/pages/BillImport/BillImportEntryTab';
import BillImportReceiptListTab from '@/pages/BillImport/BillImportReceiptListTab';
import BillImportSuppliersTab from '@/pages/BillImport/BillImportSuppliersTab';
import BillImportMaterialsTab from '@/pages/BillImport/BillImportMaterialsTab';
import ReceiptDetailModal from '@/pages/BillImport/ReceiptDetailModal';
import BillImportModal from '@/pages/BillImport/BillImportModal';
import type { BillImportTabId, UiProgressStage } from '@/pages/BillImport/constants';
import { fileToBase64NoPrefix } from '@/utils/io/fileUtil';
import { formatImportedAt } from '@/utils/format/dateUtil';
import { normalizeSearchText } from '@/utils/format/stringUtil';

const EMPTY_CONTACT: SupplierContactInfo = {};

const BillImportPage: React.FC = () => {
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
  const [activeTab, setActiveTab] = useState<BillImportTabId>('receipts');
  const [importModalOpen, setImportModalOpen] = useState(false);
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

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierContact, setSupplierContact] = useState<SupplierContactInfo>(EMPTY_CONTACT);

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

  const handleSaveDraft = async () => {
    if (!draftStructured || !validation || !ocrText) {
      toast.error(t('billImport.missingSaveData'));
      return;
    }
    setSavingDraft(true);
    try {
      const lineSum = (draftStructured.lineItems || []).reduce(
        (s, l) => s + (typeof l.lineTotal === 'number' ? l.lineTotal : 0),
        0,
      );
      const taxV = typeof draftStructured.tax === 'number' ? draftStructured.tax : 0;
      const discountV =
        typeof draftStructured.discount === 'number' ? draftStructured.discount : 0;
      const structuredForSave: StockReceiptStructured = {
        ...draftStructured,
        totalAmount: lineSum + taxV - discountV,
      };
      await saveStockReceiptDraft({
        structured: structuredForSave,
        validation,
        ocrText,
        receiptImageBase64: uploadedImageBase64,
        receiptImageMimeType: uploadedImageMimeType,
        createdByUid: currentUser?.uid ?? null,
        targetSupplierId: selectedSupplierId,
        supplierContact,
      });
      toast.success(t('billImport.saved'));
      void loadReceipts();
      void loadMasters();
      setImportModalOpen(false);
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
  }, []);

  useEffect(() => {
    void loadReceipts();
    void loadMasters();
  }, [loadReceipts, loadMasters]);

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

  const filteredSuppliers = supplierRows.filter((row) => {
    const q = normalizeSearchText(supplierSearch);
    if (!q) return true;
    return (
      normalizeSearchText(row.name).includes(q) || normalizeSearchText(row.normalizedName).includes(q)
    );
  });

  const filteredMaterials = materialRows.filter((row) => {
    const q = normalizeSearchText(materialSearch);
    if (!q) return true;
    return (
      normalizeSearchText(row.name).includes(q) || normalizeSearchText(row.normalizedName).includes(q)
    );
  });

  return (
    <Box layoutClassName="space-y-6 animate-fade-in">
      <Box>
        <Heading level={2} textClassName="flex items-center gap-2 text-xl font-semibold">
          <ScanLine className="h-6 w-6 text-primary-500" />
          {t('header.billImportTitle')}
        </Heading>
        <Typography size="sm" variant="muted" layoutClassName="mt-1">
          {t('billImport.subtitle')}
        </Typography>
      </Box>

      <Tabs
        items={[
          { id: 'receipts', label: 'Phiếu nhập' },
          { id: 'suppliers', label: 'Nhà cung cấp' },
          { id: 'materials', label: 'Nguyên vật liệu' },
        ]}
        value={activeTab}
        onChange={(value) => {
          const next = value as BillImportTabId;
          setActiveTab(next);
          if (next === 'suppliers' || next === 'materials') {
            void loadMasters();
          }
          if (next === 'receipts') void loadReceipts();
        }}
      />

      {activeTab === 'receipts' ? (
        <BillImportReceiptListTab
          receiptSearch={receiptSearch}
          onReceiptSearchChange={setReceiptSearch}
          receiptLoading={receiptLoading}
          onRefresh={loadReceipts}
          filteredReceipts={filteredReceipts}
          onRowClick={openReceiptDetail}
          onFileSelected={handleFileSelected}
        />
      ) : activeTab === 'suppliers' ? (
        <BillImportSuppliersTab
          supplierSearch={supplierSearch}
          onSupplierSearchChange={setSupplierSearch}
          masterLoading={masterLoading}
          onRefresh={loadMasters}
          filteredSuppliers={filteredSuppliers}
        />
      ) : (
        <BillImportMaterialsTab
          materialSearch={materialSearch}
          onMaterialSearchChange={setMaterialSearch}
          masterLoading={masterLoading}
          onRefresh={loadMasters}
          filteredMaterials={filteredMaterials}
        />
      )}

      <BillImportModal
        open={importModalOpen}
        onClose={closeImportModal}
        title="Nhập bill mới"
      >
        <BillImportEntryTab
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

export default BillImportPage;
