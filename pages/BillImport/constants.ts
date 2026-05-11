import type { BillImportProgressStage } from '@/services/billReceiptPipeline';

/**
 * Tab IDs sau khi gộp:
 *  - 'receipts': danh sách phiếu nhập + nút mở modal nhập bill mới.
 *  - 'suppliers': danh sách NCC.
 *  - 'materials': danh sách nguyên vật liệu.
 */
export type BillImportTabId = 'receipts' | 'suppliers' | 'materials';

export type UiProgressStage = 'prepare' | BillImportProgressStage;

export const PIPELINE_STAGES: { id: BillImportProgressStage; labelKey: string }[] = [
  { id: 'vision', labelKey: 'billImport.stageVision' },
  { id: 'validate', labelKey: 'billImport.stageValidate' },
  { id: 'structure', labelKey: 'billImport.stageStructure' },
];
