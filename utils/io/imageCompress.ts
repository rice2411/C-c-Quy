import { fileToBase64NoPrefix } from './fileUtil';

/** Số byte thật của 1 base64 (không prefix). */
const base64Bytes = (b64: string): number => Math.floor(b64.length * 0.75);

interface CompressOpts {
  /** Cạnh dài tối đa (px). Bill 1600px vẫn đọc rõ chữ. */
  maxDim?: number;
  /** Mục tiêu dung lượng (byte) — mặc định ~900KB (an toàn dưới 1MB). */
  targetBytes?: number;
  /** Chất lượng JPEG tối thiểu (không hạ thấp hơn để chữ khỏi vỡ). */
  minQuality?: number;
}

/**
 * Nén ảnh bill trước khi lưu/OCR: resize cạnh dài ≤ maxDim + JPEG, tự HẠ chất lượng
 * dần đến khi ≤ targetBytes (thường ra 200–400KB), giữ chữ đọc được cho OCR.
 * File không phải ảnh (PDF…), lỗi decode, hoặc ảnh gốc đã nhỏ hơn kết quả nén → giữ nguyên.
 * Trả base64 (KHÔNG prefix data:) + mimeType tương ứng.
 */
export async function compressImageFile(
  file: File,
  { maxDim = 1600, targetBytes = 900_000, minQuality = 0.5 }: CompressOpts = {},
): Promise<{ base64: string; mimeType: string }> {
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') {
    return { base64: await fileToBase64NoPrefix(file), mimeType: file.type || 'application/octet-stream' };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no-2d-context');
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    // Hạ chất lượng dần đến khi ≤ targetBytes hoặc chạm minQuality.
    let quality = 0.85;
    let bestB64 = '';
    for (;;) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const comma = dataUrl.indexOf(',');
      bestB64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
      if (base64Bytes(bestB64) <= targetBytes || quality <= minQuality) break;
      quality = Math.max(minQuality, quality - 0.12);
    }

    // Ảnh gốc đã nhỏ hơn kết quả nén → dùng gốc (khỏi phình).
    if (file.size > 0 && file.size < base64Bytes(bestB64)) {
      return { base64: await fileToBase64NoPrefix(file), mimeType: file.type || 'image/jpeg' };
    }
    return { base64: bestB64, mimeType: 'image/jpeg' };
  } catch {
    return { base64: await fileToBase64NoPrefix(file), mimeType: file.type || 'image/jpeg' };
  }
}
