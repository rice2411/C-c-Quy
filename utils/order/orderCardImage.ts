import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { toBlob } from 'html-to-image';
import { DeliveryType, PaymentMethod, surchargeTagLabel } from '@/types';
import { generateQRCodeImage, getOrderTotal } from '@/utils/order/orderUtils';
import ShareableOrderCard, { ShareableOrderCardProps } from '@/pages/Orders/components/modals/ShareableOrderCard';

interface PaymentAccountLike {
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
  qrTemplate?: string;
  isActive?: boolean;
}

const deliveryLabel = (dt: unknown): string =>
  dt === DeliveryType.PICKUP ? 'Khách tới lấy'
  : dt === DeliveryType.SHIP_PROVINCE ? 'Ship tỉnh'
  : dt === DeliveryType.SHIP ? 'Giao tận nơi' : '';

const paymentLabel = (pm: unknown): string =>
  pm === PaymentMethod.CASH ? 'Tiền mặt'
  : pm === PaymentMethod.BANKING ? 'Chuyển khoản' : '';

/**
 * Tính đủ props cho ShareableOrderCard từ 1 order + danh sách TK (chọn TK active).
 * Dùng nhãn tiếng Việt tĩnh (thẻ gửi khách luôn VN) thay cho i18n `t()` — vì hàm này
 * chạy ngoài React (service tạo/sửa đơn).
 */
export const buildShareCardProps = (
  order: any,
  accounts: PaymentAccountLike[],
): ShareableOrderCardProps => {
  const activeAccount = accounts.find((a) => a.isActive) ?? accounts[0] ?? null;
  const shippingCost = order.shippingCost || 0;
  const subtotal = (order.items || []).reduce(
    (s: number, it: any) => s + (it.price || 0) * (it.quantity || 0),
    0,
  );
  const finalTotal = getOrderTotal(order);
  const qrUrl = activeAccount
    ? generateQRCodeImage(order.orderNumber, finalTotal, {
        bankCode: activeAccount.bankCode ?? '',
        accountNumber: activeAccount.accountNumber ?? '',
        qrTemplate: activeAccount.qrTemplate,
      })
    : '';
  return {
    order,
    subtotal,
    finalTotal,
    shippingCost,
    surchargeLabel: surchargeTagLabel(order.surchargeTag),
    deliveryLabel: deliveryLabel(order.deliveryType),
    paymentLabel: paymentLabel(order.paymentMethod),
    qrUrl,
    description: `SEVQR ${order.orderNumber}`,
    bankCode: activeAccount?.bankCode,
    accountNumber: activeAccount?.accountNumber,
    accountHolder: activeAccount?.accountHolder,
  };
};

/**
 * Render ShareableOrderCard OFF-SCREEN (không cần mở modal) → PNG blob.
 * Mount tạm bằng ReactDOM, chờ font + tất cả ảnh (QR/sản phẩm) load, warm-up rồi chụp
 * (giống OrderDetail để không ra ảnh trống), cuối cùng unmount dọn DOM.
 * Throw nếu không tạo được blob → caller retry / fallback.
 */
export const renderOrderCardBlob = async (
  order: any,
  accounts: PaymentAccountLike[],
): Promise<Blob> => {
  const props = buildShareCardProps(order, accounts);
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none;';
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    flushSync(() => root.render(React.createElement(ShareableOrderCard, props)));
    const node = container.firstElementChild as HTMLElement | null;
    if (!node) throw new Error('render card failed');
    if (document.fonts?.ready) await document.fonts.ready;
    const imgs = Array.from(node.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    );
    const opts = { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true } as const;
    await toBlob(node, opts); // warm-up (lần đầu hay miss ảnh)
    const blob = await toBlob(node, opts);
    if (!blob) throw new Error('capture blob failed');
    return blob;
  } finally {
    root.unmount();
    container.remove();
  }
};
