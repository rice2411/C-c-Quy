import React from 'react';
import { Order } from '@/types';
import { surchargeTagLabel } from '@/types/surchargeTag';
import { formatVND } from '@/utils/format/currencyUtil';
import { getDepositInfo } from '@/utils/order/orderUtils';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { buildOrderItemRows } from '@/pages/Orders/orderItemRows';
import { SHOP_INFO } from '@/config/shopInfo';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Heading from '@/components/ui/Heading';
import Image from '@/components/ui/Image';

export interface BillReceiptProps {
  order: Order;
  subtotal: number;
  finalTotal: number;
  shippingCost: number;
  /** URL ảnh QR chuyển khoản (rỗng → không in khối QR). */
  qrUrl?: string;
  /** Nội dung chuyển khoản (= mã đơn). */
  description?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
}

/**
 * Bill KHÁCH — khổ 58mm máy in nhiệt, ĐEN TRẮNG (chỉ class light, không `dark:`).
 * Render off-screen, chỉ hiện lúc in (xem OrderPrintPortal + @media print trong styles.css).
 */
const BillReceipt: React.FC<BillReceiptProps> = ({
  order,
  subtotal,
  finalTotal,
  shippingCost,
  qrUrl,
  description,
  bankCode,
  accountNumber,
  accountHolder,
}) => {
  const c = order.customer;
  const { products } = useProducts();
  const itemRows = buildOrderItemRows(order.items, products);
  const row = 'flex items-start justify-between gap-2';
  const dashed = 'border-t border-dashed border-black pt-1 mt-1';

  const surchargeRows = (
    order.surcharges && order.surcharges.length > 0
      ? order.surcharges
      : order.surchargeAmount
        ? [{ tag: order.surchargeTag, amount: order.surchargeAmount }]
        : []
  )
    .filter((s) => Number(s.amount) > 0)
    .map((s) => ({ amount: Number(s.amount), label: s.tag ? surchargeTagLabel(s.tag) : '' }));

  const deliveryDateText = order.deliveryDate
    ? `${new Date(order.deliveryDate).toLocaleDateString('vi-VN')}${order.deliveryTime ? ` · ${order.deliveryTime}` : ''}`
    : '';
  const dep = getDepositInfo(order, finalTotal);

  // Font vừa (đọc thoải mái) + SIẾT khoảng cách/lề để ảnh gọn lại → tổng mực không tăng dù chữ to hơn.
  const infoRow = (label: string, value: React.ReactNode) => (
    <Box layoutClassName="flex gap-2">
      <Typography as="span" layoutClassName="w-[15mm] shrink-0 text-[21px]" textClassName="text-black">{label}</Typography>
      <Typography as="span" layoutClassName="min-w-0 flex-1 text-[21px] font-medium" textClassName="text-black">{value}</Typography>
    </Box>
  );

  return (
    <Box layoutClassName="w-full px-0 py-1 leading-snug" backgroundClassName="bg-white" textClassName="text-black">
      {/* Header tiệm — bỏ logo (giảm mực), chữ vừa */}
      <Box layoutClassName="flex flex-col items-center text-center pb-1">
        <Heading level={3} layoutClassName="text-[27px] font-semibold uppercase" textClassName="text-black">{SHOP_INFO.name}</Heading>
        {SHOP_INFO.address ? <Typography as="p" layoutClassName="text-[19px]" textClassName="text-black">{SHOP_INFO.address}</Typography> : null}
        {SHOP_INFO.phone ? <Typography as="p" layoutClassName="text-[19px]" textClassName="text-black">ĐT: {SHOP_INFO.phone}</Typography> : null}
      </Box>

      <Box layoutClassName="text-center border-t border-b border-dashed border-black py-1">
        <Typography as="p" layoutClassName="text-[24px] font-semibold uppercase" textClassName="text-black">Hoá đơn bán hàng</Typography>
        <Typography as="p" layoutClassName="text-[22px] font-mono font-semibold" textClassName="text-black">{order.orderNumber || order.id}</Typography>
        <Typography as="p" layoutClassName="text-[19px]" textClassName="text-black">{new Date(order.date || Date.now()).toLocaleString('vi-VN')}</Typography>
      </Box>

      {/* Khách */}
      <Box layoutClassName="py-1 space-y-1">
        {infoRow('Khách', c?.name || '—')}
        {c?.phone ? infoRow('SĐT', c.phone) : null}
        {c?.address ? infoRow('Địa chỉ', `${c.address}${c.city ? `, ${c.city}` : ''}`) : null}
        {order.coachInfo ? infoRow('Nhà xe', [order.coachInfo.name, order.coachInfo.phone, order.coachInfo.route, order.coachInfo.pickupPoint].filter(Boolean).join(' · ')) : null}
        {deliveryDateText ? infoRow('Ngày giao', deliveryDateText) : null}
      </Box>

      {/* Món */}
      <Box layoutClassName={`${dashed} space-y-1.5`}>
        {itemRows.map((r) => {
          const lineItem = order.items.find((it) => r.key.startsWith(it.id));
          const unitPrice = lineItem?.price ?? 0;
          return (
            <Box key={r.key} layoutClassName="space-y-0.5">
              <Typography as="p" layoutClassName="text-[23px] font-semibold leading-snug" textClassName="text-black">{r.name}</Typography>
              {r.meta.length > 0 ? (
                <Typography as="p" layoutClassName="text-[19px] leading-snug" textClassName="text-black">{r.meta.join(' · ')}</Typography>
              ) : null}
              <Box layoutClassName={row}>
                <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">{r.qty} × {formatVND(unitPrice)}</Typography>
                <Typography as="span" layoutClassName="text-[21px] font-medium" textClassName="text-black">{formatVND(unitPrice * r.qty)}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Tổng */}
      <Box layoutClassName={`${dashed} space-y-1.5`}>
        <Box layoutClassName={row}>
          <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">Tạm tính</Typography>
          <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">{formatVND(subtotal)}</Typography>
        </Box>
        {surchargeRows.map((s, i) => (
          <Box key={i} layoutClassName={row}>
            <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">Phụ thu{s.label ? ` · ${s.label}` : ''}</Typography>
            <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">+{formatVND(s.amount)}</Typography>
          </Box>
        ))}
        {shippingCost > 0 ? (
          <Box layoutClassName={row}>
            <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">Phí ship</Typography>
            <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">{formatVND(shippingCost)}</Typography>
          </Box>
        ) : null}
        {order.discountAmount && order.discountAmount > 0 ? (
          <Box layoutClassName={row}>
            <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">Khuyến mãi</Typography>
            <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">−{formatVND(order.discountAmount)}</Typography>
          </Box>
        ) : null}
        {order.manualDiscountAmount && order.manualDiscountAmount > 0 ? (
          <Box layoutClassName={row}>
            <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">Giảm giá</Typography>
            <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">−{formatVND(order.manualDiscountAmount)}</Typography>
          </Box>
        ) : null}
        <Box layoutClassName={`${row} border-t border-black pt-0.5 mt-0.5`}>
          <Typography as="span" layoutClassName="text-[25px] font-bold" textClassName="text-black">TỔNG</Typography>
          <Typography as="span" layoutClassName="text-[26px] font-bold" textClassName="text-black">{formatVND(finalTotal)}</Typography>
        </Box>
        {dep.show ? (
          <>
            <Box layoutClassName={row}>
              <Typography as="span" layoutClassName="text-[21px]" textClassName="text-black">Đã nhận ({dep.statusLabel})</Typography>
              <Typography as="span" layoutClassName="text-[21px] font-medium" textClassName="text-black">{formatVND(dep.deposit || dep.paid)}</Typography>
            </Box>
            {dep.remaining > 0 && dep.paid < finalTotal ? (
              <Box layoutClassName={`${row} border-t border-black pt-0.5`}>
                <Typography as="span" layoutClassName="text-[23px] font-bold" textClassName="text-black">CÒN LẠI</Typography>
                <Typography as="span" layoutClassName="text-[24px] font-bold" textClassName="text-black">{formatVND(dep.remaining)}</Typography>
              </Box>
            ) : null}
          </>
        ) : null}
      </Box>

      {/* QR chuyển khoản (mặc định KHÔNG in — bỏ QR cho nhẹ mực; chỉ hiện nếu có qrUrl) */}
      {qrUrl ? (
        <Box layoutClassName={`${dashed} flex flex-col items-center gap-0.5 pt-1`}>
          <Typography as="p" layoutClassName="text-[17px] font-semibold uppercase" textClassName="text-black">Quét QR chuyển khoản</Typography>
          <Image src={qrUrl} alt="QR chuyển khoản" disableFade loading="eager" layoutClassName="h-[26mm] w-[26mm] object-contain" />
          <Typography as="p" layoutClassName="text-[17px] text-center" textClassName="text-black">
            {(bankCode || '').toUpperCase()}{accountNumber ? ` · ${accountNumber}` : ''}
          </Typography>
          {accountHolder ? <Typography as="p" layoutClassName="text-[17px] font-medium text-center" textClassName="text-black">{accountHolder.toUpperCase()}</Typography> : null}
          {description ? <Typography as="p" layoutClassName="text-[17px] text-center" textClassName="text-black">Nội dung: <Typography as="span" layoutClassName="font-mono font-semibold text-[17px]" textClassName="text-black">{description}</Typography></Typography> : null}
        </Box>
      ) : null}

      {/* Chân bill */}
      <Box layoutClassName="border-t border-dashed border-black pt-0.5 mt-0.5 text-center">
        <Typography as="p" layoutClassName="text-[21px] font-semibold" textClassName="text-black">Cảm ơn quý khách!</Typography>
        {SHOP_INFO.social ? <Typography as="p" layoutClassName="text-[19px]" textClassName="text-black">{SHOP_INFO.social}</Typography> : null}
      </Box>
    </Box>
  );
};

export default BillReceipt;
