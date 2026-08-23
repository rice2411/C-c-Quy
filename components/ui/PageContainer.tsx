import React from 'react';
import Box from '@/components/ui/Box';

/**
 * Khung chuẩn cho trang CRUD (theo Orders).
 * Root chỉ `h-full` + xếp dọc — KHÔNG tự thêm padding/nền: shell (components/Layout.tsx)
 * đã cấp `p-4 md:p-8` + `bg-slate-50` + scroll. Xem rule fe/page-layout.md.
 */
const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box layoutClassName="relative flex h-full flex-col gap-4">{children}</Box>
);

export default PageContainer;
