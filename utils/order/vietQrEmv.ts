/**
 * Dựng chuỗi VietQR EMV (NAPAS EMVCo MPM) — port từ tools/gen_emv.py của firmware ESP32.
 * Dùng để đẩy xuống thiết bị POS/ESP32 (render QR bằng lv_qrcode). KHÁC ảnh SePay:
 * đây là payload thanh toán thô để máy quét app ngân hàng chuyển khoản.
 */

/** Tên/mã ngân hàng (SePay/NAPAS) → BIN 6 số. Trùng bảng gen_emv.py của ESP32. */
const BANK_BIN: Record<string, string> = {
  Vietcombank: '970436', VCB: '970436',
  VietinBank: '970415', Vietinbank: '970415',
  BIDV: '970418', Agribank: '970405',
  'MB Bank': '970422', MBBank: '970422', MB: '970422',
  Techcombank: '970407', TCB: '970407',
  ACB: '970416', TPBank: '970423', VPBank: '970432',
  HDBank: '970437', VIB: '970441', OCB: '970448', MSB: '970426',
  'Bac A Bank': '970409', 'Nam A Bank': '970428',
  SHB: '970443', Sacombank: '970403', Saigonbank: '970400',
  Vietbank: '970433', PVB: '970412', Oceanbank: '970414',
  GPBank: '970408', SeABank: '970440', LienVietPostBank: '970449',
  Eximbank: '970431', ABBANK: '970425', SCB: '970429',
  KienLongBank: '970452', Kienlongbank: '970452',
  PVcombank: '970412', Coopbank: '970446', 'BaoViet Bank': '970438',
  VRB: '970421', Shinhan: '970424', Woori: '970457',
  HSBC: '970412', 'Standard Chartered': '970410',
  'Public Bank': '970439', UOB: '970458', CAKE: '546034', Timo: '963388',
};

/** Tra BIN từ input (mã/tên/BIN sẵn). Partial match không phân biệt hoa thường. */
export function resolveBankBin(bankInput: string): string | null {
  const b = (bankInput || '').trim();
  if (!b) return null;
  if (BANK_BIN[b]) return BANK_BIN[b];
  if (/^\d{6}$/.test(b)) return b; // đã là BIN
  const lower = b.toLowerCase();
  for (const [name, code] of Object.entries(BANK_BIN)) {
    const n = name.toLowerCase();
    if (lower.includes(n) || n.includes(lower)) return code;
  }
  return null;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — chuẩn EMV. */
function crc16CcittFalse(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** TLV: tag(2) + length(2 chữ số) + value. */
function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`;
}

const NAPAS_GUID = 'A000000727';

/**
 * Dựng EMV payload. amount rỗng → QR tĩnh. description → nội dung CK (tag 62.08).
 */
export function buildVietQrEmv(
  account: string,
  bankBin: string,
  amount?: number | null,
  description?: string | null,
): string {
  const tag38 = tlv(
    '38',
    tlv('00', NAPAS_GUID) +
      tlv('01', tlv('00', bankBin) + tlv('01', account)) +
      tlv('02', 'QRIBFTTA'),
  );
  const hasAmount = typeof amount === 'number' && amount > 0;
  const tag62 = description ? tlv('62', tlv('08', description)) : '';

  let payload = tlv('00', '01');
  payload += tlv('01', hasAmount ? '12' : '11');
  payload += tag38;
  payload += tlv('53', '704'); // VND
  if (hasAmount) payload += tlv('54', String(Math.round(amount as number)));
  payload += tlv('58', 'VN');
  if (tag62) payload += tag62;
  payload += '6304'; // CRC tag + length, tính CRC lên cả cụm này
  return payload + crc16CcittFalse(payload);
}

/**
 * Dựng EMV cho 1 đơn từ tài khoản nhận (bankCode/accountNumber) — nội dung
 * "SEVQR <orderNumber>" khớp cách SePay đối soát. Trả '' nếu thiếu BIN/TK.
 */
export function buildOrderEmvQr(
  orderNumber: string,
  amount: number,
  account: { bankCode: string; accountNumber: string },
): string {
  const bin = resolveBankBin(account?.bankCode ?? '');
  const acc = (account?.accountNumber ?? '').trim();
  if (!bin || !acc) return '';
  return buildVietQrEmv(acc, bin, amount, `SEVQR ${orderNumber}`);
}
