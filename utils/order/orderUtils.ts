

import * as XLSX from 'xlsx-js-style';
import { Order, OrderDecoration, OrderItem } from '@/types/order';
import { UserData, UserRole } from '@/types/user';
import { parseDateValue } from '../format/dateUtil';

/**
 * Chia phụ thu tổng đơn theo số lượng từng dòng SP — thuật toán PHẢI khớp BE.
 * Làm tròn tới đồng (Math.round), dồn phần dư vào SP CUỐI để tổng share = total.
 * Σqty === 0 → trả mảng rỗng (phụ thu vẫn ở cấp đơn, không chia được).
 *
 * @param total - Tổng phụ thu (VND)
 * @param items - Danh sách dòng có `quantity`
 * @returns Mảng tiền phụ thu cho từng dòng (cùng thứ tự, cùng độ dài items)
 */
export const allocateSurcharge = (
  total: number,
  items: { quantity: number }[],
): number[] => {
  const totalNum = Number(total) || 0;
  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  if (totalQty <= 0 || totalNum <= 0) return items.map(() => 0);

  const shares: number[] = [];
  let running = 0;
  for (let i = 0; i < items.length - 1; i++) {
    const share = Math.round((totalNum * Number(items[i].quantity || 0)) / totalQty);
    shares.push(share);
    running += share;
  }
  // SP cuối gánh phần dư để tổng khớp đúng total
  shares.push(totalNum - running);
  return shares;
};

/**
 * Tính tổng giá trị đơn hàng từ items và shipping cost
 * @param items - Danh sách items trong đơn hàng
 * @param shippingCost - Chi phí vận chuyển
 * @param decorations - Trang trí cũ (đơn cũ, backward compat)
 * @param surchargeAmount - Phụ thu tổng đơn (mô hình mới) — cộng vào subtotal trước giảm
 * @returns Tổng giá trị đơn hàng
 */
export const calculateOrderTotal = (
  items: OrderItem[],
  shippingCost: number = 0,
  decorations: OrderDecoration[] = [],
  surchargeAmount: number = 0,
): number => {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const decorationsTotal = decorations.reduce((sum, d) => sum + (Number(d.price) * Number(d.quantity)), 0);
  return subtotal + Number(shippingCost) + decorationsTotal + Number(surchargeAmount || 0);
};

/**
 * Lấy tổng giá trị đơn hàng (ưu tiên dùng order.total, nếu không có thì tính lại)
 * @param order - Đơn hàng
 * @returns Tổng giá trị đơn hàng
 */
export const getOrderTotal = (order: Order): number => {
  if (order.total && order.total > 0) {
    return Number(order.total);
  }
  return calculateOrderTotal(
    order.items || [],
    order.shippingCost || 0,
    order.decorations || [],
    order.surchargeAmount || 0,
  );
};

/**
 * Mốc thời gian "doanh thu" của 1 đơn — dùng cho mọi tính toán revenue/period
 * trên Dashboard (Today / Chart / Goal / TopProducts / TopCustomers).
 *
 * Ưu tiên `deliveryDate` (ngày bán/giao thực tế) → phản ánh đúng output của
 * bakery (sản xuất + giao trong ngày). Fallback `createdAt` cho đơn walk-in
 * không có deliveryDate.
 */
export const getOrderRevenueDate = (order: any): Date | null => {
  const delivery = parseDateValue(order?.deliveryDate);
  if (delivery) return delivery;
  const created = order?.createdAt?.toDate
    ? order.createdAt.toDate()
    : order?.createdAt
      ? new Date(order.createdAt)
      : null;
  return created instanceof Date && !isNaN(created.getTime()) ? created : null;
};

/** Admin / Super Admin: sửa mọi đơn. CTV (COLABORATOR): chỉ đơn do chính UID đó tạo (`createdByUid`). */
export function userCanEditOrder(
  user: UserData | null | undefined,
  order: Order | null | undefined,
): boolean {
  if (!user || !order) return false;
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return true;
  if (user.role === UserRole.COLABORATOR) {
    if (!order.createdByUid) return false;
    return order.createdByUid === user.uid;
  }
  return false;
}

/**
 * Tạo URL ảnh QR code thanh toán (SePay VietQR).
 * Config (số TK / mã bank / template) được BƠM VÀO từ usePaymentConfig() (React)
 * hoặc fetchPaymentConfiguration() (non-React) — KHÔNG hardcode.
 * Nội dung CK = "SEVQR <orderNumber>" (prefix SEVQR cố định, giữ nguyên orderNumber ORD-...).
 * @param orderNumber - Mã đơn (vd "ORD-2026-001")
 * @param total - Tổng tiền (VND)
 * @param config - Cấu hình thanh toán (bankCode/accountNumber/qrTemplate)
 * @returns URL ảnh QR, hoặc '' nếu thiếu số TK / mã bank (fallback an toàn, không tạo URL vỡ)
 */
export const generateQRCodeImage = (
  orderNumber: string,
  total: number,
  config: { bankCode: string; accountNumber: string; qrTemplate?: string },
): string => {
  const acc = (config?.accountNumber ?? '').trim();
  const bank = (config?.bankCode ?? '').trim();
  if (!acc || !bank) return '';
  const template = (config?.qrTemplate ?? 'compact').trim() || 'compact';
  const des = `SEVQR ${orderNumber}`;
  const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(acc)}&bank=${encodeURIComponent(bank)}&amount=${Math.round(total)}&des=${encodeURIComponent(des)}&template=${encodeURIComponent(template)}`;
  return qrUrl;
};


/**
 * Tạo URL ảnh sản phẩm dựa trên loại sản phẩm
 */
export const getProductImage = (type: string): string => {
  const t = (type || '').toLowerCase();
  if (t.includes('family') || t.includes('gia đình')) return 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=200';
  if (t.includes('friend') || t.includes('tình bạn')) return 'https://images.unsplash.com/photo-1621236378699-8597f840b45a?auto=format&fit=crop&q=80&w=200';
  if (t.includes('set') || t.includes('quà') || t.includes('gif')) return 'https://images.unsplash.com/photo-1549488352-22668e9e6c1c?auto=format&fit=crop&q=80&w=200';
  if (t.includes('cookie') || t.includes('bánh')) return 'https://images.unsplash.com/photo-1499636138143-bd649025ebeb?auto=format&fit=crop&q=80&w=200';
  if (t.includes('cake') || t.includes('kem')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200';
  return `https://placehold.co/200x200?text=${encodeURIComponent(type || 'Product')}`;
};



export interface ExportColumn {
  id: string;
  label: string;
  field: (order: Order) => any;
}
/**
 * Áp dụng kiểu dáng cho bảng tính Excel
 * @param ws - Bảng tính Excel
 * @param headerColor - Màu của header
 * @param currencyCols - Các cột cần áp dụng định dạng tiền tệ
 * @param hasFooter - Có áp dụng footer không
 * @returns Không có giá trị trả về
 */
const applySheetStyles = (ws: any, headerColor: string, currencyCols: number[] = [], hasFooter: boolean = false) => {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  const border = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  };

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[address]) continue;
      
      if (!ws[address].s) ws[address].s = {};

      if (R === 0) {
        // Header Styles
        ws[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: headerColor.replace('#', '') } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: border
        };
      } else {
        // Data Cell Styles
        ws[address].s = {
          alignment: { vertical: "center", wrapText: true },
          border: border
        };

        // Apply Currency Format to numeric cells in specific columns
        if (currencyCols.includes(C) && typeof ws[address].v === 'number') {
            ws[address].z = '#,##0 "₫"';
        }

        // Footer Row Style (Last Row)
        if (hasFooter && R === range.e.r) {
             ws[address].s.font = { bold: true, color: { rgb: "EA580C" } }; // Orange text
             ws[address].s.fill = { fgColor: { rgb: "FFF7ED" } }; // Light orange bg
             if (C === 0) ws[address].s.alignment = { horizontal: "center", vertical: "center" };
        }
      }
    }
  }
};

/**
 * Xuất đơn hàng ra file Excel
 * @param orders - Danh sách đơn hàng
 * @param columns - Các cột cần xuất
 * @param headerColor - Màu của header
 * @returns void
 */
export const exportOrdersToExcel = (
  orders: Order[], 
  columns: ExportColumn[], 
  headerColor: string = '#4abab9'
) => {
  const wb = XLSX.utils.book_new();

  // Identify Currency Columns by ID to apply VND format
  const currencyIds = ['total', 'subtotal', 'shipping', 'price', 'unitPrice', 'cost', 'revenue'];
  const currencyColIndices = columns
    .map((col, idx) => currencyIds.some(id => col.id.toLowerCase().includes(id)) ? idx : -1)
    .filter(idx => idx !== -1);

  // Group orders by Month (YYYY-MM)
  const groupedOrders: Record<string, Order[]> = {};
  orders.forEach(order => {
    const d = parseDateValue(order.orderDate || order.date);
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groupedOrders[key]) groupedOrders[key] = [];
    groupedOrders[key].push(order);
  });

  const monthKeys = Object.keys(groupedOrders).sort();

  if (monthKeys.length > 1) {
    // --- MULTI-SHEET MODE (Overall + Monthly Sheets) ---

    // 1. Overall Sheet
    const overallData = monthKeys.map(month => {
      const monthOrders = groupedOrders[month];
      const revenue = monthOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
      const uniqueCustomers = new Set(monthOrders.map(o => o.customer.id)).size;
      return {
        "Month": month,
        "Total Orders": monthOrders.length,
        "Total Revenue": revenue,
        "Total Customers": uniqueCustomers,
        "Avg Order Value": monthOrders.length ? revenue / monthOrders.length : 0
      };
    });

    const wsOverall = XLSX.utils.json_to_sheet(overallData);
    // Set columns width
    wsOverall['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
    ];
    // Apply currency format to 'Total Revenue' (col 2) and 'Avg Order Value' (col 4)
    applySheetStyles(wsOverall, headerColor, [2, 4], false);
    XLSX.utils.book_append_sheet(wb, wsOverall, "Overall");

    // 2. Individual Month Sheets
    monthKeys.forEach(month => {
      const monthOrders = groupedOrders[month];
      const sheetData = monthOrders.map(order => {
        const row: any = {};
        columns.forEach(col => {
          row[col.label] = col.field(order);
        });
        return row;
      });

      // Calculate Total Revenue for this sheet
      const totalRevenue = monthOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
      
      // Create Footer Row
      const footerRow: any = {};
      columns.forEach((col, idx) => {
          if (idx === 0) footerRow[col.label] = "TOTAL REVENUE";
          else if (col.id === 'total') footerRow[col.label] = totalRevenue;
          else footerRow[col.label] = ""; // Empty string for other columns to maintain borders
      });
      sheetData.push(footerRow);

      const ws = XLSX.utils.json_to_sheet(sheetData);
      ws['!cols'] = columns.map(() => ({ wch: 20 }));
      applySheetStyles(ws, headerColor, currencyColIndices, true);
      XLSX.utils.book_append_sheet(wb, ws, month);
    });

  } else {
    // --- SINGLE SHEET MODE (Standard) ---
    const sheetData = orders.map(order => {
      const row: any = {};
      columns.forEach(col => {
        row[col.label] = col.field(order);
      });
      return row;
    });

    // Calculate Total Revenue
    const totalRevenue = orders.reduce((sum, o) => sum + getOrderTotal(o), 0);
      
    // Create Footer Row
    const footerRow: any = {};
    columns.forEach((col, idx) => {
        if (idx === 0) footerRow[col.label] = "TOTAL REVENUE";
        else if (col.id === 'total') footerRow[col.label] = totalRevenue;
        else footerRow[col.label] = "";
    });
    sheetData.push(footerRow);

    const ws = XLSX.utils.json_to_sheet(sheetData);
    ws['!cols'] = columns.map(() => ({ wch: 20 }));
    applySheetStyles(ws, headerColor, currencyColIndices, true);
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
  }

  const fileName = `CucQuy_Orders_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
