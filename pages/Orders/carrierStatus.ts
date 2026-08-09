/**
 * Nhóm trạng thái giao hàng của ĐVVC (đơn vị vận chuyển).
 * trackingStatus trong DB KHÔNG chuẩn hoá: raw EN từ file SPX ('Delivered', 'In Transit'...),
 * nhãn VI từ sync live ('Đã giao thành công · <địa điểm>', 'Đang giao hàng · ...'),
 * hoặc 'Đã hủy'. → gom về nhóm bằng substring (khớp cả EN lẫn VI).
 */
export type CarrierStatusGroup =
  | 'delivered'
  | 'delivering'
  | 'preparing'
  | 'returned'
  | 'cancelled'
  | 'pendingUpdate';

/** Option cho dropdown lọc trạng thái ĐVVC. */
export const CARRIER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'All', label: 'Tất cả' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'delivering', label: 'Đang giao' },
  { value: 'preparing', label: 'Chờ lấy / chuẩn bị' },
  { value: 'returned', label: 'Hoàn / thất bại' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'pendingUpdate', label: 'Có mã, chưa cập nhật' },
];

/** Gom 1 trackingStatus (text thô) về nhóm. null nếu không có mã & không rõ. */
export function carrierStatusGroup(
  trackingStatus?: string | null,
  trackingNumber?: string | null,
): CarrierStatusGroup | null {
  const s = (trackingStatus ?? '').trim().toLowerCase();
  if (!s) return trackingNumber ? 'pendingUpdate' : null;
  if (s.includes('hủy') || s.includes('huỷ') || s.includes('cancel')) return 'cancelled';
  if (
    s.includes('hoàn') ||
    s.includes('return') ||
    s.includes('không thành công') ||
    s.includes('thất bại') ||
    s.includes('fail')
  )
    return 'returned';
  if (s.includes('đã giao thành công') || s.includes('delivered') || (s.includes('đã giao') && !s.includes('không')))
    return 'delivered';
  if (
    s.includes('đang giao') ||
    s.includes('out for delivery') ||
    s.includes('bưu cục') ||
    s.includes('kho phân loại') ||
    s.includes('vận chuyển') ||
    s.includes('in transit') ||
    s.includes('transit') ||
    s.includes('đã đến') ||
    s.includes('đã rời') ||
    s.includes('sorting') ||
    s.includes('mile')
  )
    return 'delivering';
  if (
    s.includes('chuẩn bị') ||
    s.includes('manifest') ||
    s.includes('pending') ||
    s.includes('chờ lấy') ||
    s.includes('đã lấy') ||
    s.includes('pickup') ||
    s.includes('picked up')
  )
    return 'preparing';
  return null;
}

/** Đơn có khớp filter trạng thái ĐVVC không. 'All'/rỗng → luôn khớp. */
export function matchesCarrierStatus(
  filter: string,
  trackingStatus?: string | null,
  trackingNumber?: string | null,
): boolean {
  if (!filter || filter === 'All') return true;
  return carrierStatusGroup(trackingStatus, trackingNumber) === filter;
}
