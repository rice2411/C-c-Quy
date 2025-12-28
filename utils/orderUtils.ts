

import * as XLSX from 'xlsx-js-style';
import { Order, OrderItem } from '@/types/order';

/**
 * Tính tổng giá trị đơn hàng từ items và shipping cost
 * @param items - Danh sách items trong đơn hàng
 * @param shippingCost - Chi phí vận chuyển
 * @returns Tổng giá trị đơn hàng
 */
export const calculateOrderTotal = (items: OrderItem[], shippingCost: number = 0): number => {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  return subtotal + Number(shippingCost);
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
  return calculateOrderTotal(order.items || [], order.shippingCost || 0);
};

/**
 * Tạo URL ảnh QR code thanh toán
 * @param order - Đơn hàng
 * @returns URL ảnh QR code thanh toán
 */
export const generateQRCodeImage = (description: string, total: number): string => {
  const qrUrl = `https://qr.sepay.vn/img?acc=96247HTTH1308&bank=BIDV&amount=${Math.round(total)}&des=${encodeURIComponent(description)}&template=compact`;
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
  headerColor: string = '#ea580c'
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
    const d = new Date(order.date);
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
