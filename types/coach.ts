// Nhà xe — danh bạ dùng lại cho hình thức giao "Ship xe khách".

export interface Coach {
  id: string;
  name: string;              // tên nhà xe
  phone?: string;            // SĐT liên hệ
  route?: string;            // tuyến: "Bến A → Bến B"
  pickupPoint?: string;      // điểm nhận/gửi hàng
  defaultFee?: number;       // phí gửi mặc định (VND)
  note?: string;
  sortOrder?: number;
}

/** Snapshot nhà xe lưu trên đơn (khi deliveryType = SHIP_COACH). */
export interface OrderCoachInfo {
  id?: string;               // ref coach gốc (có thể trống nếu nhập tay)
  name: string;
  phone?: string;
  route?: string;
  pickupPoint?: string;
}

/** Gen ID nhà xe dạng slug + suffix base36 (thuần client). */
export const generateCoachId = (name: string): string => {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'coach'}-${Date.now().toString(36)}`;
};
