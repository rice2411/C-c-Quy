/**
 * Xuất đơn hàng ra Excel — TÁCH RIÊNG khỏi orderUtils để `xlsx-js-style` (~849KB)
 * KHÔNG bị kéo vào bundle chung. orderUtils export nhiều helper dùng khắp nơi
 * (Dashboard, Orders...) nên nếu import XLSX ở đó thì mọi trang đều tải 849KB thừa.
 * Module này chỉ được `await import()` lúc user thật sự bấm export.
 */
import * as XLSX from 'xlsx-js-style';
import { Order } from '@/types/order';
import { parseDateValue } from '../format/dateUtil';
import { getOrderTotal, ExportColumn } from './orderUtils';

export type { ExportColumn };

/**
 * Áp dụng kiểu dáng cho bảng tính Excel
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
