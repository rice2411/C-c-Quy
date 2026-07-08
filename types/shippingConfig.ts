/**
 * Shipping configuration types + defaults.
 * Runtime config lưu ở BE (`configurations/shipping-configuration`),
 * truy cập qua `useShippingConfig()` ở components.
 * File này chỉ chứa types + default fallback (không có pure helpers — đã move vào context).
 */

export interface ShopOrigin {
  name: string;
  lat: number;
  lng: number;
  /** City hint dùng để enrich address (giảm ambiguity với SerpApi). */
  city: string;
}

export interface ShippingTier {
  /** Trần km của tier (km <= maxKm sẽ rơi vào tier này) */
  maxKm: number;
  /** Phí (VND) */
  fee: number;
  /** Label hiển thị, vd "< 2 km" */
  label: string;
}

export interface ShippingConfiguration {
  shopOrigin: ShopOrigin;
  tiers: ShippingTier[];
  /** Phí áp dụng khi km vượt quá tier cuối cùng. */
  overFee: number;
  /** Label hiển thị cho khoảng vượt, vd "> 6 km" */
  overLabel: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

/** Fallback khi chưa có cấu hình hoặc fetch fail. */
export const DEFAULT_SHIPPING_CONFIG: ShippingConfiguration = {
  shopOrigin: {
    name: '30/10 Nguyễn Hữu Cảnh, An Cựu, Huế',
    lat: 16.4474994,
    lng: 107.6065567,
    city: 'Huế',
  },
  tiers: [
    { maxKm: 2, fee: 10000, label: '< 2 km' },
    { maxKm: 4, fee: 15000, label: '2 - 4 km' },
    { maxKm: 6, fee: 20000, label: '4 - 6 km' },
  ],
  overFee: 25000,
  overLabel: '> 6 km',
};
