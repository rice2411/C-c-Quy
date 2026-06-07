import { apiClient } from '@/services/api/client';
import type { StockReceiptStructured } from '@/types/billReceipt';

export async function validateReceiptWithGemini(ocrText: string): Promise<{
  isLikelyReceipt: boolean;
  confidence: number;
  reasonVi: string;
}> {
  return (await apiClient.post('/gemini/validate-receipt', { ocrText })).data;
}

export async function structureStockReceiptWithGemini(
  ocrText: string,
): Promise<StockReceiptStructured> {
  return (await apiClient.post('/gemini/structure-receipt', { ocrText })).data;
}
