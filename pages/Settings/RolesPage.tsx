import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import RoleManagerCard from './RoleManagerCard';

/** Màn CÀI ĐẶT → Vai trò: quản lý danh sách role (thêm/sửa/xoá). Route /settings/roles (super_admin). */
const RolesPage: React.FC = () => (
  <Box layoutClassName="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
    <Box layoutClassName="flex items-center gap-2">
      <ShieldCheck className="h-5 w-5 text-primary-500" />
      <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
        Vai trò
      </Heading>
    </Box>
    <Typography as="p" size="sm" variant="muted">
      Thêm/sửa/xoá vai trò. Role tạo ở đây dùng cho phân quyền màn (Cài đặt → Màn hình) và gán người dùng.
    </Typography>
    <RoleManagerCard />
  </Box>
);

export default RolesPage;
