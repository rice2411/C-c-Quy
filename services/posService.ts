import { apiClient } from '@/services/api/client';

/**
 * Đẩy QR thanh toán động lên màn hình thiết bị POS/ESP32 → POST /pos/qr.
 * BE publish MQTT cucquy/<device>/order/create. `qr` = chuỗi VietQR EMV thô.
 */
export async function pushPosQr(input: {
  order_id: string;
  amount: number;
  qr: string;
}): Promise<void> {
  await apiClient.post('/pos/qr', input);
}

/** Xoá QR trên thiết bị (về màn chờ) → POST /pos/clear. */
export async function clearPosQr(): Promise<void> {
  await apiClient.post('/pos/clear', {});
}
