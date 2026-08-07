/**
 * React Query hooks cho domain Stock Receipt / Bill Import (epic #58 — P8).
 *
 * - queryFn/mutationFn GỌI THẲNG service hiện có (stockReceiptService) — KHÔNG viết lại HTTP.
 * - Query `enabled: !!currentUser` để tránh gọi API 401 ở màn login.
 * - Mutation (saveDraft / updateSupplier / merge*) invalidate key liên quan
 *   (suppliers / materials / summaries) để list tự refresh.
 * - KHÔNG nuốt lỗi: caller (component) bắt error → toast.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ImportedMaterialSummary,
  MaterialStock,
  ImportedSupplierSummary,
  SavedStockReceiptDetail,
  SavedStockReceiptSummary,
  StockReceiptSource,
  StockReceiptStructured,
  StockReceiptValidationSnapshot,
  SupplierContactInfo,
} from '@/types/billReceipt';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchImportedMaterials,
  fetchMaterialStock,
  fetchImportedSuppliers,
  fetchMaterialMergeSuggestions,
  fetchMaterialMergeSuggestionsAi,
  fetchMaterialPriceOptions,
  fetchStockReceiptDetail,
  fetchStockReceiptSummaries,
  deleteStockReceipt,
  mergeMaterials,
  mergeSuppliers,
  saveStockReceiptDraft,
  updateMaterial,
  updateSupplier,
  type MaterialMergeAiGroup,
  type MaterialMergeSuggestionPair,
  type MaterialPriceOption,
} from '@/services/stockReceiptService';

/** Ngưỡng độ giống mặc định cho gợi ý gộp NVL (đồng bộ với BE). */
export const DEFAULT_MATERIAL_MERGE_THRESHOLD = 0.4;

// ==================== QUERIES ====================

export interface UseImportedSuppliersResult {
  suppliers: ImportedSupplierSummary[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useImportedSuppliers = (): UseImportedSuppliersResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.stockReceipt.suppliers,
    queryFn: fetchImportedSuppliers,
    enabled: !!currentUser,
  });
  return {
    suppliers: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
};

export interface UseImportedMaterialsResult {
  materials: ImportedMaterialSummary[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useImportedMaterials = (): UseImportedMaterialsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.stockReceipt.materials,
    queryFn: fetchImportedMaterials,
    enabled: !!currentUser,
  });
  return {
    materials: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
};

/** Tồn dư (neo kiểm kê) — keyed by materialId ở component. */
export const useMaterialStock = (): { data: MaterialStock[]; loading: boolean } => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.stockReceipt.stockEstimate,
    queryFn: fetchMaterialStock,
    enabled: !!currentUser,
  });
  return { data: query.data ?? [], loading: query.isLoading };
};

export interface UseMaterialPriceOptionsResult {
  options: MaterialPriceOption[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useMaterialPriceOptions = (enabled = true): UseMaterialPriceOptionsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.stockReceipt.materialPriceOptions,
    queryFn: fetchMaterialPriceOptions,
    enabled: !!currentUser && enabled,
  });
  return {
    options: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
};

export interface UseMaterialMergeSuggestionsResult {
  suggestions: MaterialMergeSuggestionPair[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Gợi ý các cặp NVL nghi trùng. `enabled` để chỉ fetch khi user mở panel gợi ý
 * (tránh gọi API nặng ngay khi vào trang). `threshold` đổi → key đổi → query mới.
 */
export const useMaterialMergeSuggestions = (
  enabled = true,
  threshold = DEFAULT_MATERIAL_MERGE_THRESHOLD,
): UseMaterialMergeSuggestionsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.stockReceipt.materialMergeSuggestions(threshold),
    queryFn: () => fetchMaterialMergeSuggestions(threshold),
    enabled: !!currentUser && enabled,
  });
  return {
    suggestions: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
};

export interface UseMaterialMergeSuggestionsAiResult {
  groups: MaterialMergeAiGroup[];
  loading: boolean;
  error: Error | null;
  /** Chạy AI phân tích (gọi Claude). On-demand — chỉ khi user bấm. */
  run: () => Promise<void>;
  /** Đã chạy ít nhất 1 lần (để phân biệt "chưa chạy" vs "chạy xong không có nhóm"). */
  hasRun: boolean;
}

/**
 * Gợi ý gộp NVL bằng AI (Claude). Dùng mutation vì gọi tốn kém + on-demand
 * (chỉ khi user bấm nút), không auto-fetch như gợi ý theo tên.
 */
export const useMaterialMergeSuggestionsAi = (): UseMaterialMergeSuggestionsAiResult => {
  const mutation = useMutation({ mutationFn: fetchMaterialMergeSuggestionsAi });
  return {
    groups: mutation.data ?? [],
    loading: mutation.isPending,
    error: (mutation.error as Error) ?? null,
    run: async () => {
      await mutation.mutateAsync();
    },
    hasRun: mutation.isSuccess || mutation.isError,
  };
};

export interface UseStockReceiptSummariesResult {
  receipts: SavedStockReceiptSummary[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useStockReceiptSummaries = (): UseStockReceiptSummariesResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.stockReceipt.summaries,
    queryFn: fetchStockReceiptSummaries,
    enabled: !!currentUser,
  });
  return {
    receipts: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
};

export interface UseStockReceiptDetailResult {
  detail: SavedStockReceiptDetail | null;
  loading: boolean;
  error: Error | null;
}

export const useStockReceiptDetail = (
  receiptId: string | null | undefined,
): UseStockReceiptDetailResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.stockReceipt.detail(receiptId ?? ''),
    queryFn: () => fetchStockReceiptDetail(receiptId as string),
    enabled: !!receiptId && !!currentUser,
  });
  return {
    detail: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
  };
};

// ==================== MUTATIONS ====================

export interface SaveStockReceiptDraftArgs {
  structured: StockReceiptStructured;
  validation: StockReceiptValidationSnapshot;
  ocrText: string;
  receiptImageBase64?: string | null;
  receiptImageMimeType?: string | null;
  createdByUid?: string | null;
  targetSupplierId?: string | null;
  supplierContact?: SupplierContactInfo | null;
  source?: StockReceiptSource;
}

export interface UpdateSupplierArgs {
  id: string;
  patch: Partial<SupplierContactInfo> & { name?: string };
}

export interface MergeArgs {
  rootId: string;
  duplicateIds: string[];
}

export interface UpdateMaterialArgs {
  id: string;
  patch: { name?: string; canonicalUnit?: string };
}

export interface UseStockReceiptMutationsResult {
  saveDraft: (args: SaveStockReceiptDraftArgs) => Promise<string>;
  updateSupplierInfo: (args: UpdateSupplierArgs) => Promise<void>;
  updateMaterialInfo: (args: UpdateMaterialArgs) => Promise<void>;
  mergeSuppliersInto: (args: MergeArgs) => Promise<void>;
  mergeMaterialsInto: (args: MergeArgs) => Promise<void>;
  deleteReceipt: (receiptId: string) => Promise<{ ok: boolean; reason?: string }>;
}

export const useStockReceiptMutations = (): UseStockReceiptMutationsResult => {
  const queryClient = useQueryClient();

  // Prefix ['stock-receipt','material-merge-suggestions'] → invalidate mọi threshold.
  const MATERIAL_MERGE_SUGGESTIONS_PREFIX = [
    'stock-receipt',
    'material-merge-suggestions',
  ] as const;

  const invalidateMaterialMergeSuggestions = () => {
    queryClient.invalidateQueries({ queryKey: MATERIAL_MERGE_SUGGESTIONS_PREFIX });
  };

  const invalidateMasters = () => {
    queryClient.invalidateQueries({ queryKey: qk.stockReceipt.suppliers });
    queryClient.invalidateQueries({ queryKey: qk.stockReceipt.materials });
    queryClient.invalidateQueries({ queryKey: qk.stockReceipt.materialPriceOptions });
  };

  const saveDraftMutation = useMutation({
    mutationFn: (args: SaveStockReceiptDraftArgs) => saveStockReceiptDraft(args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.stockReceipt.summaries });
      invalidateMasters();
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, patch }: UpdateSupplierArgs) => updateSupplier(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.stockReceipt.suppliers });
    },
  });

  const mergeSuppliersMutation = useMutation({
    mutationFn: ({ rootId, duplicateIds }: MergeArgs) => mergeSuppliers(rootId, duplicateIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.stockReceipt.suppliers });
      queryClient.invalidateQueries({ queryKey: qk.stockReceipt.summaries });
    },
  });

  const mergeMaterialsMutation = useMutation({
    mutationFn: ({ rootId, duplicateIds }: MergeArgs) => mergeMaterials(rootId, duplicateIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.stockReceipt.materials });
      queryClient.invalidateQueries({ queryKey: qk.stockReceipt.materialPriceOptions });
      invalidateMaterialMergeSuggestions();
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: ({ id, patch }: UpdateMaterialArgs) => updateMaterial(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.stockReceipt.materials });
      queryClient.invalidateQueries({ queryKey: qk.stockReceipt.materialPriceOptions });
      invalidateMaterialMergeSuggestions();
    },
  });

  const deleteReceiptMutation = useMutation({
    mutationFn: (receiptId: string) => deleteStockReceipt(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.stockReceipt.summaries });
      invalidateMasters();
    },
  });

  return {
    saveDraft: (args) => saveDraftMutation.mutateAsync(args),
    updateSupplierInfo: (args) => updateSupplierMutation.mutateAsync(args),
    updateMaterialInfo: (args) => updateMaterialMutation.mutateAsync(args),
    mergeSuppliersInto: (args) => mergeSuppliersMutation.mutateAsync(args),
    mergeMaterialsInto: (args) => mergeMaterialsMutation.mutateAsync(args),
    deleteReceipt: (receiptId) => deleteReceiptMutation.mutateAsync(receiptId),
  };
};
