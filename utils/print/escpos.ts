import { PRINT_AGENT_URL } from '@/config/printAgent';

/** Máy in nhiệt 58mm = 384 dot ngang (48 byte/dòng). */
const WIDTH_DOTS = 384;
const WIDTH_BYTES = WIDTH_DOTS / 8;

// ESC @ (khởi tạo) + ESC 7 n1 n2 n3 (chỉnh đầu đốt): n1 = SỐ CHẤM ĐỐT CÙNG LÚC tối đa.
// Hạ n1 xuống thấp → giảm DÒNG ĐỈNH tức thời của đầu in nhiệt → bớt nhiễu điện → máy in KHÔNG
// tự ngắt USB giữa lúc in (thủ phạm khiến bản in ảnh cũ ra ký tự rác ở tờ 2). Đã đo trên máy
// SingPC Print-211: in ảnh nhẹ cao tới 800px vẫn sống với ESC 7 này (trước rớt vì in full nhiệt).
// n2 = thời gian đốt (độ đậm), n3 = khoảng nghỉ. Chỉnh nếu bản in quá nhạt/quá đậm.
const INIT = [0x1b, 0x40, 0x1b, 0x37, 3, 180, 6];
const CUT = [0x1d, 0x56, 0x01]; // GS V 1 : cắt giấy (partial)
const feed = (n: number) => [0x1b, 0x64, n & 0xff]; // ESC d n : nhả n dòng

/**
 * Đẩy raster ESC/POS (lệnh GS v 0, chia band 128 dòng) của 1 canvas (đen/trắng, rộng 384px)
 * TRỰC TIẾP vào mảng out. Ngưỡng: luminance < 160 → chấm đen; pixel trong suốt = trắng.
 * (Đẩy từng byte, KHÔNG spread mảng lớn → bill dài mấy cũng không tràn stack.)
 */
function appendRaster(out: number[], canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  const band = 128;
  for (let y0 = 0; y0 < h; y0 += band) {
    const rows = Math.min(band, h - y0);
    out.push(
      0x1d, 0x76, 0x30, 0x00,
      WIDTH_BYTES & 0xff, (WIDTH_BYTES >> 8) & 0xff,
      rows & 0xff, (rows >> 8) & 0xff,
    );
    for (let ry = 0; ry < rows; ry++) {
      const y = y0 + ry;
      for (let xb = 0; xb < WIDTH_BYTES; xb++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = xb * 8 + bit;
          if (x < w) {
            const i = (y * w + x) * 4;
            const alpha = data[i + 3];
            if (alpha >= 32) {
              const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              // Ngưỡng 130 (thấp hơn 160 cũ): chỉ lấy nét ĐẬM thật → in MẢNH hơn, ít chấm đen hơn
              // → nhẹ dòng đốt thêm ("nén nhẹ"). Vẫn giữ lõi chữ nên đọc tốt.
              if (lum < 130) byte |= 0x80 >> bit;
            }
          }
        }
        out.push(byte);
      }
    }
  }
}

/** Ghép nhiều canvas (bill, phiếu bếp) thành 1 luồng ESC/POS: init → raster+feed+cut từng tờ. */
export function buildEscpos(canvases: HTMLCanvasElement[]): Uint8Array {
  const out: number[] = [];
  const append = (arr: number[]) => {
    for (let i = 0; i < arr.length; i++) out.push(arr[i]);
  };
  append(INIT);
  canvases.forEach((c) => {
    appendRaster(out, c);
    append(feed(3));
    append(CUT);
  });
  return Uint8Array.from(out);
}

/** Gửi bytes ESC/POS tới cầu nối in local. Throw nếu agent không chạy / máy in lỗi. */
export async function sendToPrintAgent(bytes: Uint8Array): Promise<void> {
  const res = await fetch(`${PRINT_AGENT_URL}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: bytes,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `agent HTTP ${res.status}`);
  }
}
