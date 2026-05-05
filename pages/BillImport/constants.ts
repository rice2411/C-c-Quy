import type { BillImportProgressStage } from '@/services/billReceiptPipeline';

export type BillImportTabId = 'bills' | 'receiptList' | 'suppliers' | 'materials';

export type UiProgressStage = 'prepare' | BillImportProgressStage;

export const PIPELINE_STAGES: { id: BillImportProgressStage; labelKey: string }[] = [
  { id: 'vision', labelKey: 'billImport.stageVision' },
  { id: 'validate', labelKey: 'billImport.stageValidate' },
  { id: 'structure', labelKey: 'billImport.stageStructure' },
];
