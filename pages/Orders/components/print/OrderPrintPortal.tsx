import React from 'react';
import { createPortal } from 'react-dom';
import Box from '@/components/ui/Box';
import BillReceipt, { BillReceiptProps } from './BillReceipt';
import KitchenTicket from './KitchenTicket';
import { buildEscpos, sendToPrintAgent } from '@/utils/print/escpos';

export interface OrderPrintPortalProps extends BillReceiptProps {
  /** Gọi khi in thành công (đã gửi cầu nối) → mark "đã in" + gỡ portal. */
  onDone?: () => void;
  /** Gọi khi lỗi (agent không chạy / máy in lỗi) → toast + gỡ portal. */
  onError?: (msg: string) => void;
}

const TRANSPARENT =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

/** Inline mọi ảnh (QR/logo) thành dataURL trước khi chụp → tránh canvas bị taint (CORS). */
async function inlineImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith('data:')) return;
      try {
        const res = await fetch(src, { mode: 'cors', cache: 'reload' });
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
const OrderPrintPortal: React.FC<OrderPrintPortalProps> = ({ onDone, onError, ...billProps }) => {
  const billRef = React.useRef<HTMLDivElement>(null);
  const kitchenRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        const bill = billRef.current;
        const kitchen = kitchenRef.current;
        if (!bill || !kitchen) throw new Error('no node');
        await inlineImages(bill);
        const { toCanvas } = await import('html-to-image');
        const opts = { backgroundColor: '#ffffff', pixelRatio: 1, width: 384 } as const;
        await toCanvas(bill, opts); // warm-up (html-to-image hay miss ảnh lần đầu)
        const billCanvas = await toCanvas(bill, opts);
        const kitchenCanvas = await toCanvas(kitchen, opts);
        if (cancelled) return;
        const bytes = buildEscpos([billCanvas, kitchenCanvas]);
        await sendToPrintAgent(bytes);
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
