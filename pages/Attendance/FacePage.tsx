import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ScanFace } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import FaceEnrollModal from '@/pages/Attendance/components/FaceEnrollModal';
import Box from '@/components/ui/Box';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { useAttendanceOverview, useNetworkMutations } from '@/hooks/queries/useAttendanceQuery';

/** Trang QUẢN LÝ KHUÔN MẶT: danh sách NV + số mẫu đã đăng ký; đăng ký / đăng ký lại / xoá. */
const FacePage: React.FC = () => {
  const { userData } = useAuth();
  const isSuperAdmin = userData?.role === UserRole.SUPER_ADMIN;
  const { rows: overview, loading } = useAttendanceOverview(true);
  const { clearFace } = useNetworkMutations();
  const [enroll, setEnroll] = useState<{ employeeId: string; name: string } | null>(null);

  const removeFace = async (employeeId: string, name: string) => {
    if (!window.confirm(`Xoá dữ liệu khuôn mặt của "${name}"? Nhân viên sẽ phải đăng ký lại.`)) return;
    try {
      const r = await clearFace(employeeId);
      toast.success(`Đã xoá ${r.deleted} mẫu khuôn mặt.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xoá thất bại.');
    }
  };

  const th = 'px-4 py-3';
  return (
    <PageContainer>
      <Box layoutClassName="flex items-center gap-2">
        <ScanFace className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Khuôn mặt
        </Heading>
      </Box>

      <Card
        padding="none"
        layoutClassName="min-h-0 flex-1 overflow-hidden"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box
          layoutClassName="flex items-center gap-2 px-4 py-3"
          borderClassName="border-b border-slate-100 dark:border-slate-700"
        >
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
            Đăng ký khuôn mặt để nhân viên chấm công bằng Face ID. Mỗi NV nên chụp vài góc mặt.
          </Typography>
        </Box>
        <Box layoutClassName="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <Box layoutClassName="p-6"><Spinner size="sm" textClassName="text-primary-500" /></Box>
          ) : overview.length === 0 ? (
            <EmptyState title="Chưa có nhân viên nào." />
          ) : (
            <Box layoutClassName="overflow-x-auto">
              <Table>
                <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                  <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <TableHeaderCell layoutClassName={th}>Tên</TableHeaderCell>
                    <TableHeaderCell layoutClassName={th}>Email đăng nhập</TableHeaderCell>
                    <TableHeaderCell layoutClassName={`${th} text-center`}>Khuôn mặt</TableHeaderCell>
                    <TableHeaderCell layoutClassName={`${th} text-right`}>Thao tác</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overview.map((r) => (
                    <TableRow key={r.employeeId} borderClassName="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                      <TableCell layoutClassName={`${th} whitespace-nowrap`}>
                        <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">{r.name}</Typography>
                      </TableCell>
                      <TableCell layoutClassName={`${th} whitespace-nowrap`}>
                        {r.email ? (
                          <Typography as="span" size="sm" layoutClassName="font-mono" textClassName="text-slate-600 dark:text-slate-300">{r.email}</Typography>
                        ) : (
                          <Badge size="sm" layoutClassName="px-2 py-0.5 text-xs" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">chưa gắn</Badge>
                        )}
                      </TableCell>
                      <TableCell layoutClassName={`${th} text-center whitespace-nowrap`}>
                        <Badge
                          size="sm"
                          layoutClassName="inline-flex px-2 py-0.5 text-xs font-semibold"
                          backgroundClassName={r.faceCount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700'}
                          textClassName={r.faceCount > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}
                        >
                          {r.faceCount > 0 ? `${r.faceCount} mẫu` : 'chưa có'}
                        </Badge>
                      </TableCell>
                      <TableCell layoutClassName={`${th} text-right whitespace-nowrap`}>
                        <Box layoutClassName="inline-flex items-center gap-1">
                          {isSuperAdmin && (
                            <Button type="button" variant="secondary" size="sm" leftIcon={<ScanFace className="h-3.5 w-3.5" />} onClick={() => setEnroll({ employeeId: r.employeeId, name: r.name })}>
                              {r.faceCount > 0 ? 'Đăng ký lại' : 'Đăng ký mặt'}
                            </Button>
                          )}
                          {r.faceCount > 0 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeFace(r.employeeId, r.name)}>
                              Xoá
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Card>

      <FaceEnrollModal isOpen={!!enroll} onClose={() => setEnroll(null)} employee={enroll} onDone={() => setEnroll(null)} />
    </PageContainer>
  );
};

export default FacePage;
