import React from 'react';
import { Order } from '@/types';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { buildBillText, buildKitchenText } from '@/utils/print/escposText';
import { sendToPrintAgent } from '@/utils/print/escpos';

export interface OrderPrintPortalProps {
  order: Order;
  subtotal: number;
  finalTotal: number;
  shippingCost: number;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
  /** Nội dung CK (= mã đơn) — in dạng chữ (không còn QR). */
  description?: string;
  /** Chọn in gì: 'bill' = hoá đơn khách, 'kitchen' = phiếu bếp, 'both' = cả hai. */
  mode?: 'both' | 'bill' | 'kitchen';
  /** Gọi khi in thành công (đã gửi cầu nối) → mark "đã in" + gỡ portal. */
  onDone?: () => void;
  /** Gọi khi lỗi (agent không chạy / máy in lỗi) → toast + gỡ portal. */
  onError?: (msg: string) => void;
}

/** Bọc timeout cho gửi máy in — treo quá `ms` thì reject để không kẹt "Đang in...". */
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

/**
 * Gửi lệnh in bill/phiếu bếp dạng TEXT-MODE ESC/POS thẳng tới cầu nối in local.
 * KHÔNG render DOM / không html-to-image → nhẹ dòng đốt (máy in nhiệt không rớt USB) + hết bug canvas.
 * Component không vẽ gì ra màn hình, chỉ chạy hiệu ứng gửi in 1 lần rồi báo onDone/onError.
 */
const OrderPrintPortal: React.FC<OrderPrintPortalProps> = ({
  mode = 'both',
  onDone,
  onError,
  order,
  subtotal,
  finalTotal,
  shippingCost,
  bankCode,
  accountNumber,
  accountHolder,
  description,
}) => {
  const { products } = useProducts();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Nối 2 tờ (nếu 'both') thành 1 luồng: máy in tự cắt sau mỗi tờ.
        const parts: Uint8Array[] = [];
        if (mode !== 'kitchen') {
          parts.push(
            buildBillText({ order, products, subtotal, finalTotal, shippingCost, bankCode, accountNumber, accountHolder, description }),
          );
        }
        if (mode !== 'bill') {
          parts.push(buildKitchenText(order, products));
        }
        const total = parts.reduce((n, p) => n + p.length, 0);
        const bytes = new Uint8Array(total);
        let off = 0;
        for (const p of parts) {
          bytes.set(p, off);
          off += p.length;
        }
        if (cancelled) return;
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

  return null;
};

export default OrderPrintPortal;
