import { PRINT_AGENT_URL } from '@/config/printAgent';

/** Máy in nhiệt 58mm = 384 dot ngang (48 byte/dòng). */
const WIDTH_DOTS = 384;
const WIDTH_BYTES = WIDTH_DOTS / 8;

const INIT = [0x1b, 0x40]; // ESC @ : khởi tạo
const CUT = [0x1d, 0x56, 0x01]; // GS V 1 : cắt giấy (partial)
const feed = (n: number) => [0x1b, 0x64, n & 0xff]; // ESC d n : nhả n dòng

/**
 * Canvas (đen/trắng, rộng 384px) → bytes raster ESC/POS (lệnh GS v 0), chia band 128 dòng.
 * Ngưỡng: luminance < 160 → chấm đen. Pixel trong suốt (alpha thấp) coi là trắng.
 */
export function canvasToRaster(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  const out: number[] = [];
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
              if (lum < 160) byte |= 0x80 >> bit;
            }
          }
        }
        out.push(byte);
      }
    }
  }
  return out;
}

/** Ghép nhiều canvas (bill, phiếu bếp) thành 1 luồng ESC/POS: init → raster+feed+cut từng tờ. */
export function buildEscpos(canvases: HTMLCanvasElement[]): Uint8Array {
  const bytes: number[] = [...INIT];
  canvases.forEach((c) => {
    bytes.push(...canvasToRaster(c));
    bytes.push(...feed(3));
    bytes.push(...CUT);
  });
  return Uint8Array.from(bytes);
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
