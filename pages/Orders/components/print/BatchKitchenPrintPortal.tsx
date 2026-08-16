import React from 'react';
import { createPortal } from 'react-dom';
import { Order } from '@/types';
import Box from '@/components/ui/Box';
import KitchenTicket from './KitchenTicket';
import { buildEscpos, sendToPrintAgent } from '@/utils/print/escpos';
import { withTimeout, captureCanvas, CAPTURE_OPTS } from '@/utils/print/capture';

export interface BatchKitchenPrintPortalProps {
  /** Danh sách đơn cần in phiếu bếp — mỗi đơn 1 tờ, tự cắt giữa các tờ. */
  orders: Order[];
  /** Gọi khi in xong (đã gửi cầu nối) → gỡ portal. */
  onDone?: () => void;
  /** Gọi khi lỗi (agent không chạy / chụp hỏng) → toast + gỡ portal. */
  onError?: (msg: string) => void;
}

/**
 * IN BẾP HÀNG LOẠT — render OFF-SCREEN nhiều PHIẾU BẾP (khổ 58mm), chụp từng tờ → canvas →
 * gộp thành 1 luồng ESC/POS (mỗi tờ feed + cắt) → gửi cầu nối in local MỘT LẦN.
 * Phiếu bếp không có ảnh QR/logo nên không cần inline ảnh như bill.
 */
const BatchKitchenPrintPortal: React.FC<BatchKitchenPrintPortalProps> = ({ orders, onDone, onError }) => {
  const nodeRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!orders.length) throw new Error('Không có đơn nào để in');
        // font đã load → chờ, nhưng không để treo vô hạn (skipFonts vẫn dùng font hệ thống).
        if (document.fonts?.ready) await withTimeout(document.fonts.ready, 4000, 'Chờ font').catch(() => {});
        const { toCanvas } = await import('html-to-image');
        const canvases: HTMLCanvasElement[] = [];
        for (let i = 0; i < orders.length; i++) {
          if (cancelled) return;
          const node = nodeRefs.current[i];
          if (!node) throw new Error('no node');
          canvases.push(await captureCanvas(toCanvas, node, CAPTURE_OPTS, `phiếu bếp #${i + 1}`));
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
      {orders.map((order, i) => (
        <Box
          key={order.id}
          ref={(el: HTMLDivElement | null) => {
            nodeRefs.current[i] = el;
          }}
          layoutClassName="w-[384px]"
          backgroundClassName="bg-white"
        >
          <KitchenTicket order={order} />
        </Box>
      ))}
    </Box>,
    document.body,
  );
};

export default BatchKitchenPrintPortal;
