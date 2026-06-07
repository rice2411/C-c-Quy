import { apiClient } from '@/services/api/client';

/**
 * `content`: base64 thuần (không có prefix data:image/...).
 * OCR được xử lý ở BE (Google Vision). FE chỉ gọi API.
 */
export async function extractTextWithVision(content: string): Promise<string> {
  // apiClient đã bóc envelope → data = { text }.
  const { data } = await apiClient.post('/ocr/vision', { content });
  return String(data?.text ?? '');
}
