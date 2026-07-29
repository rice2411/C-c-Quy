import React from 'react';
import { Order } from '@/types';
import { surchargeTagLabel } from '@/types/surchargeTag';
import { formatVND } from '@/utils/format/currencyUtil';
import { getDepositInfo } from '@/utils/order/orderUtils';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { buildOrderItemRows } from '@/pages/Orders/orderItemRows';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Heading from '@/components/ui/Heading';
import Image from '@/components/ui/Image';

export interface ShareableOrderCardProps {
  order: Order;
  subtotal: number;
  finalTotal: number;
  shippingCost: number;
  surchargeLabel?: string;
  /** Nhãn loại giao: "Giao tận nơi" / "Khách tới lấy" / "Ship tỉnh". */
  deliveryLabel?: string;
  /** Nhãn hình thức thanh toán: "Tiền mặt" / "Chuyển khoản". */
  paymentLabel?: string;
  qrUrl: string;
  /** Nội dung chuyển khoản = mã đơn. */
  description: string;
  /** Thông tin tài khoản (lấy động từ tài khoản đang active — khớp với QR). */
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
}

/**
 * Thẻ "gửi khách" để chụp thành ảnh (html-to-image) → copy clipboard.
 * Render OFF-SCREEN, LUÔN NỀN SÁNG (chỉ dùng class light, KHÔNG `dark:`) để ảnh đẹp
 * dù admin đang ở dark mode. Chỉ chứa thông tin gửi khách (khách + sản phẩm + tổng + QR),
 * KHÔNG có nút thao tác. Sản phẩm hiển thị dạng text (không thumbnail) để né CORS ảnh.
 */
const ShareableOrderCard = React.forwardRef<HTMLDivElement, ShareableOrderCardProps>(
  ({ order, subtotal, finalTotal, shippingCost, surchargeLabel, deliveryLabel, paymentLabel, qrUrl, description, bankCode, accountNumber, accountHolder }, ref) => {
    const c = order.customer;
    const { products } = useProducts();
    const itemRows = buildOrderItemRows(order.items, products);
    const rowClass = 'flex items-center justify-between gap-3';
    // Phụ thu nhiều dòng (fallback đơn cũ = 1 dòng từ surchargeAmount/tag).
    const surchargeRows = (
      order.surcharges && order.surcharges.length > 0
        ? order.surcharges
        : order.surchargeAmount
          ? [{ tag: order.surchargeTag, amount: order.surchargeAmount }]
          : []
    )
      .filter((s) => Number(s.amount) > 0)
      .map((s) => ({
        amount: Number(s.amount),
        label: s.tag ? surchargeTagLabel(s.tag) : surchargeLabel || '',
      }));
    const deliveryDateText = order.deliveryDate
      ? `${new Date(order.deliveryDate).toLocaleDateString('vi-VN')}${order.deliveryTime ? ` · ${order.deliveryTime}` : ''}`
      : '';
    // 1 dòng thông tin: nhãn (trái, cố định) : giá trị (phải).
    const infoRow = (label: string, value: React.ReactNode) => (
      <Box layoutClassName="flex gap-2">
        <Typography as="span" size="sm" layoutClassName="w-[84px] shrink-0" textClassName="text-slate-400">{label}</Typography>
        <Typography as="span" size="sm" layoutClassName="min-w-0 flex-1 font-medium" textClassName="text-slate-700">{value}</Typography>
      </Box>
    );
    return (
      <Box
        ref={ref}
        layoutClassName="w-[440px] p-6 space-y-4"
        backgroundClassName="bg-white"
        textClassName="text-slate-900"
      >
        {/* Header thương hiệu + mã đơn */}
        <Box layoutClassName="flex items-center justify-between border-b border-slate-200 pb-3">
          <Box>
            <Heading level={3} textClassName="text-lg font-extrabold text-primary-600">Tiệm Bánh Cúc Quy</Heading>
          </Box>
          <Typography as="p" size="sm" layoutClassName="font-mono font-bold" textClassName="text-slate-700">{order.orderNumber}</Typography>
        </Box>

        {/* Thông tin khách + giao + thanh toán (nhãn : giá trị) */}
        <Box layoutClassName="space-y-1.5">
          <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-400">Thông tin đơn</Typography>
          {infoRow('Khách hàng', c.name || '—')}
          {c.phone ? infoRow('SĐT', c.phone) : null}
          {deliveryLabel ? infoRow('Hình thức', deliveryLabel) : null}
          {c.address ? infoRow('Địa chỉ', `${c.address}${c.city ? `, ${c.city}` : ''}`) : null}
          {paymentLabel ? infoRow('Thanh toán', paymentLabel) : null}
          {deliveryDateText ? infoRow('Ngày giao', deliveryDateText) : null}
        </Box>

        {/* Sản phẩm — mỗi vị/phần 1 dòng (giống order list) */}
        <Box layoutClassName="space-y-2 border-t border-slate-200 pt-3">
          <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-400">Sản phẩm</Typography>
          {itemRows.map((r) => (
            <Box key={r.key} layoutClassName="flex items-start gap-2.5">
              {r.img ? (
                <Image
                  src={r.img}
                  alt={r.name}
                  crossOrigin="anonymous"
                  disableFade
                  loading="eager"
                  layoutClassName="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover"
                />
              ) : (
                <Box layoutClassName="h-10 w-10 shrink-0 rounded-md" backgroundClassName="bg-slate-100" />
              )}
              <Box layoutClassName="min-w-0 flex-1">
                <Typography as="p" size="sm" layoutClassName="font-medium leading-snug" textClassName="text-slate-700">{r.name}</Typography>
                {r.meta.map((m, i) => (
                  <Typography key={i} as="p" size="xs" layoutClassName="leading-snug" textClassName="text-slate-500">{m}</Typography>
                ))}
              </Box>
              <Typography as="span" size="sm" layoutClassName="shrink-0 font-medium" textClassName="text-slate-700">×{r.qty}</Typography>
            </Box>
          ))}
        </Box>

        {/* Tổng tiền */}
        <Box layoutClassName="space-y-1 border-t border-slate-200 pt-3">
          <Box layoutClassName={rowClass}>
            <Typography as="span" size="sm" textClassName="text-slate-500">Tạm tính</Typography>
            <Typography as="span" size="sm" textClassName="text-slate-700">{formatVND(subtotal)}</Typography>
          </Box>
          {surchargeRows.length > 0
            ? surchargeRows.map((s, i) => (
                <Box key={i} layoutClassName={rowClass}>
                  <Typography as="span" size="sm" textClassName="text-primary-600">Phụ thu{s.label ? ` · ${s.label}` : ''}</Typography>
                  <Typography as="span" size="sm" textClassName="text-primary-600">+{formatVND(s.amount)}</Typography>
                </Box>
              ))
            : null}
          {order.decorations && order.decorations.length > 0 ? (
            <Box layoutClassName={rowClass}>
              <Typography as="span" size="sm" textClassName="text-slate-500">Trang trí</Typography>
              <Typography as="span" size="sm" textClassName="text-slate-700">{formatVND(order.decorations.reduce((s, d) => s + d.price * d.quantity, 0))}</Typography>
            </Box>
          ) : null}
          <Box layoutClassName={rowClass}>
            <Typography as="span" size="sm" textClassName="text-slate-500">Phí ship</Typography>
            <Typography as="span" size="sm" textClassName="text-slate-700">{formatVND(shippingCost)}</Typography>
          </Box>
          {order.discountAmount && order.discountAmount > 0 ? (
            <Box layoutClassName={rowClass}>
              <Typography as="span" size="sm" textClassName="text-emerald-600">Khuyến mãi</Typography>
              <Typography as="span" size="sm" textClassName="text-emerald-600">−{formatVND(order.discountAmount)}</Typography>
            </Box>
          ) : null}
          {order.manualDiscountAmount && order.manualDiscountAmount > 0 ? (
            <Box layoutClassName={rowClass}>
              <Typography as="span" size="sm" textClassName="text-rose-600">Giảm giá</Typography>
              <Typography as="span" size="sm" textClassName="text-rose-600">−{formatVND(order.manualDiscountAmount)}</Typography>
            </Box>
          ) : null}
          <Box layoutClassName={`${rowClass} border-t border-slate-200 pt-2`}>
            <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-slate-900">TỔNG</Typography>
            <Typography as="span" size="lg" layoutClassName="font-extrabold" textClassName="text-primary-600">{formatVND(finalTotal)}</Typography>
          </Box>
          {(() => {
            const dep = getDepositInfo(order, finalTotal);
            if (!dep.show) return null;
            return (
              <>
                <Box layoutClassName={rowClass}>
                  <Typography as="span" size="sm" textClassName="text-amber-600">Tiền cọc</Typography>
                  <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-amber-600">
                    {formatVND(dep.deposit || dep.paid)} · {dep.statusLabel}
                  </Typography>
                </Box>
                {dep.remaining > 0 && dep.paid < finalTotal ? (
                  <Box layoutClassName={`${rowClass} border-t border-slate-200 pt-2`}>
                    <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-slate-900">CÒN LẠI</Typography>
                    <Typography as="span" size="lg" layoutClassName="font-extrabold" textClassName="text-rose-600">{formatVND(dep.remaining)}</Typography>
                  </Box>
                ) : null}
              </>
            );
          })()}
        </Box>

        {/* QR chuyển khoản */}
        <Box layoutClassName="flex gap-4 border-t border-slate-200 pt-3">
          <Box layoutClassName="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5">
            <Image src={qrUrl} alt="QR chuyển khoản" crossOrigin="anonymous" disableFade loading="eager" layoutClassName="h-28 w-28 object-contain" />
          </Box>
          <Box layoutClassName="flex-1 space-y-0.5 text-sm">
            <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-400">Chuyển khoản</Typography>
            <Typography as="p" size="sm" textClassName="text-slate-700"><Typography as="span" size="sm" layoutClassName="font-bold">{bankCode || '—'}</Typography>{accountNumber ? ` · ${accountNumber}` : ''}</Typography>
            <Typography as="p" size="sm" layoutClassName="font-bold" textClassName="text-slate-800">{(accountHolder || '').toUpperCase()}</Typography>
            <Typography as="p" size="sm" textClassName="text-slate-600">Số tiền: <Typography as="span" size="sm" layoutClassName="font-bold" textClassName="text-primary-600">{formatVND(finalTotal)}</Typography></Typography>
            <Typography as="p" size="sm" textClassName="text-slate-600">Nội dung: <Typography as="span" size="sm" layoutClassName="font-mono font-bold" textClassName="text-slate-800">{description}</Typography></Typography>
          </Box>
        </Box>
      </Box>
    );
  },
);

ShareableOrderCard.displayName = 'ShareableOrderCard';

export default ShareableOrderCard;
