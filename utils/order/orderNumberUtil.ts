/**
 * Trích mã đơn dạng `ORD-XXXXXX` từ chuỗi tự do (thường là nội dung chuyển khoản
 * SePay, content message Zalo, ghi chú đơn, ...).
 *
 * Regex chấp nhận cả 2 dạng đầu vào:
 *   - `ORD123456`     → trả về `ORD-123456`
 *   - `ORD-123456`    → trả về `ORD-123456`
 *
 * @example
 *   extractFormattedOrderCode('Thanh toan ORD000287')        // 'ORD-000287'
 *   extractFormattedOrderCode('Cho don ORD-000287 cua minh') // 'ORD-000287'
 *   extractFormattedOrderCode('khong co ma don')             // null
 */
export const extractFormattedOrderCode = (
  str: string | null | undefined,
): string | null => {
  const match = (str || '').match(/ORD\d+/);
  return match ? match[0].replace(/ORD(\d+)/, 'ORD-$1') : null;
};
