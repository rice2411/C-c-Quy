/**
 * Cầu nối in local (cucquy-print-agent) — chạy trên máy cắm máy in nhiệt.
 * FE gửi bytes ESC/POS tới đây, agent `lp -o raw` ra máy in (bỏ qua driver).
 * localhost http từ trang https được Chrome cho phép (localhost = secure context).
 */
export const PRINT_AGENT_URL = 'http://127.0.0.1:9110';
