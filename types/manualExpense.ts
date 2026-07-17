/** Chi phí thủ công — khoản chi KHÔNG qua bank (tiền mặt / đã trả trước). */
export interface ManualExpense {
  id: string;
  date: string; // ISO yyyy-mm-dd (ngày phát sinh / bắt đầu phân bổ)
  amount: number; // VND (tổng khoản chi)
  category: string; // ExpenseCategory (rent|utilities|...)
  spreadMonths: number; // số tháng phân bổ (1 = ghi 1 lần)
  note?: string | null;
  createdAt?: string;
  /** Nguồn: 'manual' (nhập tay) | 'receipt' (từ phiếu nhập). */
  source?: 'manual' | 'receipt';
}
