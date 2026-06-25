/**
 * Payment configuration types + defaults.
 * Runtime config lưu ở BE (`configurations/payment-configuration`),
 * truy cập qua `usePaymentConfig()` ở components (mirror shipping config).
 * File này chỉ chứa types + default fallback.
 */

/** Template QR của SePay (VietQR). */
export type QrTemplate = 'compact' | 'compact2' | 'qr_only' | 'print';

export interface PaymentConfiguration {
  /** Mã ngân hàng theo SePay/Napas, vd "BIDV". */
  bankCode: string;
  /** Số tài khoản nhận tiền. */
  accountNumber: string;
  /** Tên chủ tài khoản (in hoa). */
  accountHolder: string;
  /** Template ảnh QR của SePay (mặc định "compact"). */
  qrTemplate: QrTemplate;
  updatedAt?: string;
}

/** Fallback khi BE chưa có doc hoặc fetch fail. */
export const DEFAULT_PAYMENT_CONFIG: PaymentConfiguration = {
  bankCode: 'BIDV',
  accountNumber: '96247HTTH1308',
  accountHolder: 'TON THAT ANH MINH',
  qrTemplate: 'compact',
};

/** Lựa chọn template cho dropdown cấu hình. */
export const QR_TEMPLATES: { value: QrTemplate; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'compact2', label: 'Compact 2' },
  { value: 'qr_only', label: 'QR only' },
  { value: 'print', label: 'Print' },
];

/** Helper lookup label template. */
export const qrTemplateLabel = (t: QrTemplate | string): string =>
  QR_TEMPLATES.find((x) => x.value === t)?.label ?? 'Compact';
