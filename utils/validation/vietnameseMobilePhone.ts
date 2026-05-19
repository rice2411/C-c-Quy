/** Regex cho thuê bao di động VN (10 số, bắt đầu 0). */
export const viettelRegex = /^(032|033|034|035|036|037|038|039|086|096|097|098)\d{7}$/;
export const vinaRegex = /^(081|082|083|084|085|088|091|094)\d{7}$/;
export const mobiRegex = /^(070|076|077|078|079|089|090|093)\d{7}$/;
export const vietnamobileRegex = /^(052|056|058|092)\d{7}$/;
export const gmobileRegex = /^(059|099)\d{7}$/;

export type VietMobileCarrier =
  | 'viettel'
  | 'vina'
  | 'mobi'
  | 'vietnamobile'
  | 'gmobile';

export type VietMobileClassification =
  | { kind: 'empty' }
  | { kind: 'invalid'; normalized: string }
  | { kind: 'valid'; carrier: VietMobileCarrier; normalized: string };

/** Chuẩn hóa chuỗi nhập (dấu cách, +84, 84...) về dạng 0xxxxxxxxx nếu có thể. */
export function normalizeVietnameseMobileDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('84')) {
    return `0${digits.slice(2)}`;
  }

  if (digits.length === 9 && !digits.startsWith('0')) {
    return `0${digits}`;
  }

  return digits;
}

/** Chuỗi số để khớp khách ↔ đơn (chỉ chữ số). */
export function getNormalizedPhoneDigits(raw?: string | null): string {
  return (raw ?? '').replace(/\D/g, '');
}

/** Map regex → carrier để dễ mở rộng */
const carrierRegexMap: Record<VietMobileCarrier, RegExp> = {
  viettel: viettelRegex,
  vina: vinaRegex,
  mobi: mobiRegex,
  vietnamobile: vietnamobileRegex,
  gmobile: gmobileRegex,
};

export function classifyVietnameseMobile(raw: string): VietMobileClassification {
  const normalized = normalizeVietnameseMobileDigits(raw);
  if (!normalized) return { kind: 'empty' };

  for (const [carrier, regex] of Object.entries(carrierRegexMap) as [VietMobileCarrier, RegExp][]) {
    if (regex.test(normalized)) {
      return { kind: 'valid', carrier, normalized };
    }
  }

  return { kind: 'invalid', normalized };
}
