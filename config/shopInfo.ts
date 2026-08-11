/**
 * Thông tin cửa hàng — nguồn DUY NHẤT cho header/footer bill khách + phiếu bếp.
 * Layout in tự ẩn các dòng để trống (không in thông tin rỗng/sai).
 *
 * 👉 ĐIỀN 3 giá trị `address` / `phone` / `social` bên dưới trước khi in bill thật.
 */
export interface ShopInfo {
  /** Tên tiệm (in đậm ở đầu bill). */
  name: string;
  /** Đường dẫn logo trong public/ (in đen trắng trên máy nhiệt). */
  logo: string;
  /** Địa chỉ tiệm (in dưới tên). Để '' nếu chưa có → không in dòng này. */
  address: string;
  /** SĐT / Hotline. Để '' nếu chưa có. */
  phone: string;
  /** Mạng xã hội / fanpage (in ở chân bill). Để '' nếu chưa có. */
  social: string;
}

export const SHOP_INFO: ShopInfo = {
  name: 'Tiệm Bánh Cúc Quy',
  logo: '/icon-v4.svg',
  address: '', // TODO: điền địa chỉ tiệm
  phone: '', // TODO: điền hotline
  social: '', // TODO: điền fanpage/MXH (vd "fb.com/tiembanhcucquy")
};
