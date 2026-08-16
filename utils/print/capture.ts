/**
 * Helper chụp DOM → canvas cho luồng in nhiệt (bill + phiếu bếp). Tách riêng để cả
 * OrderPrintPortal (1 đơn) và BatchKitchenPrintPortal (nhiều đơn) dùng chung — cùng cơ chế
 * tất định: chụp lại nếu canvas hỏng, không gửi canvas rác ra máy in.
 */

/** Bọc timeout cho 1 promise — treo quá `ms` thì reject để chuỗi in không kẹt âm thầm. */
export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} quá lâu (>${ms / 1000}s)`)), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

/** Đợi 2 khung hình (layout đã paint xong) trước khi chụp. */
export function nextPaint(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

/** Canvas có hợp lệ không: đúng khổ + có đủ điểm đen (render hỏng = trắng trơn / kích thước 0). */
export function canvasLooksValid(c: HTMLCanvasElement): boolean {
  if (!c.width || !c.height || c.width < 300) return false;
  const ctx = c.getContext('2d');
  if (!ctx) return false;
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let dark = 0;
  // mẫu thưa cho nhanh; bill/phiếu bếp thật luôn có hàng trăm điểm đen
  for (let i = 0; i < data.length; i += 40) {
    if (data[i + 3] >= 32 && data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114 < 160) {
      if (++dark >= 50) return true;
    }
  }
  return false;
}

/**
 * Chụp node → canvas, TỰ CHỤP LẠI nếu canvas hỏng (html-to-image hay lỗi lần đầu / khi in liên tiếp).
 * Tất định hơn kiểu "warm-up 1 lần" — không phụ thuộc thứ tự in bill/bếp.
 */
export async function captureCanvas(
  toCanvas: (n: HTMLElement, o: object) => Promise<HTMLCanvasElement>,
  node: HTMLElement,
  opts: object,
  label: string,
): Promise<HTMLCanvasElement> {
  let last: HTMLCanvasElement | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    await nextPaint();
    last = await withTimeout(toCanvas(node, opts), 12000, `Chụp ${label}`);
    if (canvasLooksValid(last)) return last;
  }
  // 4 lần vẫn hỏng → coi như lỗi để bung toast, KHÔNG gửi canvas rác ra máy in.
  throw new Error(`${label} chụp hỏng (canvas trắng) sau nhiều lần thử`);
}

/** Khổ chụp chuẩn cho máy in nhiệt 58mm (384px). skipFonts: dùng font hệ thống, đủ nét đen trắng. */
export const CAPTURE_OPTS = {
  backgroundColor: '#ffffff',
  pixelRatio: 1,
  width: 384,
  skipFonts: true,
} as const;
