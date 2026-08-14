import React from 'react';
import { createPortal } from 'react-dom';
import Box from '@/components/ui/Box';
import BillReceipt, { BillReceiptProps } from './BillReceipt';
import KitchenTicket from './KitchenTicket';
import { buildEscpos, sendToPrintAgent } from '@/utils/print/escpos';

export interface OrderPrintPortalProps extends BillReceiptProps {
  /** Chọn in gì: 'bill' = hoá đơn khách, 'kitchen' = phiếu bếp, 'both' = cả hai (mặc định). */
  mode?: 'both' | 'bill' | 'kitchen';
  /** Gọi khi in thành công (đã gửi cầu nối) → mark "đã in" + gỡ portal. */
  onDone?: () => void;
  /** Gọi khi lỗi (agent không chạy / máy in lỗi) → toast + gỡ portal. */
  onError?: (msg: string) => void;
}

const TRANSPARENT =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

/** Bọc timeout cho 1 promise — treo quá `ms` thì reject để chuỗi in không kẹt âm thầm. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
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

/** Inline mọi ảnh (QR/logo) thành dataURL trước khi chụp → tránh canvas bị taint (CORS). */
async function inlineImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith('data:')) return;
      try {
        // AbortController: fetch ảnh remote (QR/logo) treo → huỷ sau 6s, fallback ảnh trong suốt.
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), 6000);
        const res = await fetch(src, { mode: 'cors', cache: 'reload', signal: ac.signal }).finally(
          () => clearTimeout(to),
        );
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        img.src = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = () => reject(new Error('read fail'));
          fr.readAsDataURL(blob);
        });
      } catch {
        img.removeAttribute('crossorigin');
        img.src = TRANSPARENT;
      }
      await new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) resolve();
        else {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }
      });
    }),
  );
}

/**
 * Render OFF-SCREEN (không display:none để html-to-image chụp được) BILL KHÁCH + PHIẾU BẾP
 * ở khổ 384px (= 58mm), chụp → canvas → ESC/POS raster → gửi cầu nối in local (1 lần 2 tờ, tự cắt).
 */
const OrderPrintPortal: React.FC<OrderPrintPortalProps> = ({ mode = 'both', onDone, onError, ...billProps }) => {
  const billRef = React.useRef<HTMLDivElement>(null);
  const kitchenRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // font đã load → chờ, nhưng không để nó treo vô hạn (skipFonts vẫn dùng font hệ thống).
        if (document.fonts?.ready) await withTimeout(document.fonts.ready, 4000, 'Chờ font').catch(() => {});
        const bill = billRef.current;
        const kitchen = kitchenRef.current;
        if (!bill || !kitchen) throw new Error('no node');
        const { toCanvas } = await import('html-to-image');
        // skipFonts: KHÔNG cố inline @font-face của Google Fonts (cross-origin) — trước gây
        // SecurityError "Cannot access cssRules" spam console + chậm. Bill in đen trắng khổ
        // nhiệt không cần web font, dùng font hệ thống là đủ nét.
        const opts = { backgroundColor: '#ffffff', pixelRatio: 1, width: 384, skipFonts: true } as const;
        // Chỉ chụp tờ cần in theo mode → in bill / in bếp / cả hai.
        // ⚠️ Lần toCanvas ĐẦU TIÊN của html-to-image hay lỗi (miss ảnh / canvas méo) → LUÔN warm-up
        //    (chụp bỏ 1 lần) TRƯỚC mỗi tờ rồi mới lấy lần thứ 2. Thiếu warm-up ở phiếu bếp khi in
        //    bếp-riêng → canvas hỏng → raster méo → máy in nhả ký tự rác.
        const canvases: HTMLCanvasElement[] = [];
        if (mode !== 'kitchen') {
          await withTimeout(inlineImages(bill), 8000, 'Tải ảnh QR/logo'); // QR/logo chỉ có ở bill
          await withTimeout(toCanvas(bill, opts), 12000, 'Chụp bill'); // warm-up
          canvases.push(await withTimeout(toCanvas(bill, opts), 12000, 'Chụp bill'));
        }
        if (mode !== 'bill') {
          await withTimeout(toCanvas(kitchen, opts), 12000, 'Chụp phiếu bếp'); // warm-up
          canvases.push(await withTimeout(toCanvas(kitchen, opts), 12000, 'Chụp phiếu bếp'));
        }
        if (cancelled) return;
        const bytes = buildEscpos(canvases);
        await withTimeout(sendToPrintAgent(bytes), 30000, 'Gửi máy in');
        if (!cancelled) onDone?.();
      } catch (e) {
        if (!cancelled) onError?.(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <Box layoutClassName="fixed left-[-99999px] top-0 w-[384px]" backgroundClassName="bg-white" textClassName="text-black">
      <Box ref={billRef} layoutClassName="w-[384px]" backgroundClassName="bg-white">
        <BillReceipt {...billProps} />
      </Box>
      <Box ref={kitchenRef} layoutClassName="w-[384px]" backgroundClassName="bg-white">
        <KitchenTicket order={billProps.order} />
      </Box>
    </Box>,
    document.body,
  );
};

export default OrderPrintPortal;
