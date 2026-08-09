import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, LogIn, LogOut, ScanFace, Wifi } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import CameraCapture, { CameraCaptureHandle } from '@/components/CameraCapture';
import { useAttendanceMe, useAttendanceActions } from '@/hooks/queries/useAttendanceQuery';

const fmt = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

type BusyMode = 'in' | 'out' | null;

const CheckInTab: React.FC = () => {
  const { me, loading, refetch } = useAttendanceMe();
  const { check } = useAttendanceActions();
  const camRef = useRef<CameraCaptureHandle>(null);
  const [busy, setBusy] = useState<BusyMode>(null);

  if (loading) {
    return (
      <Box layoutClassName="flex flex-1 items-center justify-center py-16">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
    );
  }

  // Chưa gắn hồ sơ nhân viên với tài khoản
  if (!me?.employee) {
    return (
      <Card
        padding="lg"
        layoutClassName="mx-auto max-w-md text-center"
        borderClassName="border border-amber-200 dark:border-amber-800/50"
        backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
      >
        <Box layoutClassName="flex flex-col items-center gap-3">
          <ScanFace className="h-8 w-8 text-amber-500" />
          <Heading level={2} textClassName="text-base font-bold text-slate-900 dark:text-white">
            Tài khoản chưa gắn hồ sơ nhân viên
          </Heading>
          <Typography size="sm" textClassName="text-slate-600 dark:text-slate-300">
            Nhờ quản lý mở mục Nhân viên và điền email đăng nhập của bạn vào hồ sơ để bật chấm công.
          </Typography>
        </Box>
      </Card>
    );
  }

  const hasFace = me.employee.faceCount > 0;
  const ipOk = me.ip.allowed;
  const ipConfigured = me.ip.configured;

  const run = async (mode: Exclude<BusyMode, null>) => {
    const blob = await camRef.current?.capture();
    if (!blob) {
      toast.error('Camera chưa sẵn sàng. Đợi camera bật rồi thử lại.');
      return;
    }
    setBusy(mode);
    try {
      const r = await check(blob, mode);
      toast.success(
        `${mode === 'in' ? 'Đã chấm VÀO ca' : 'Đã chấm TAN ca'} lúc ${fmt(r.record.checkedAt)}.`,
      );
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Thao tác thất bại.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Box layoutClassName="mx-auto flex w-full max-w-md flex-col gap-4">
      {/* Chào + trạng thái hôm nay */}
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Box>
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">Xin chào</Typography>
          <Heading level={2} textClassName="text-lg font-bold text-slate-900 dark:text-white">
            {me.employee.name}
          </Heading>
        </Box>
        <Box layoutClassName="flex flex-col items-end gap-1 text-right">
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
            Vào: <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-emerald-600 dark:text-emerald-400">{fmt(me.status?.todayIn)}</Typography>
          </Typography>
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
            Ra: <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-rose-600 dark:text-rose-400">{fmt(me.status?.todayOut)}</Typography>
          </Typography>
        </Box>
      </Box>

      {/* Trạng thái mạng quán — banner xanh chỉ hiện khi ĐANG ở mạng quán */}
      {ipOk && (
        <Box
          layoutClassName="flex items-center gap-2 px-3 py-2"
          roundedClassName="rounded-lg"
          backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
        >
          <Wifi className="h-4 w-4 text-emerald-500" />
          <Typography size="xs" textClassName="text-emerald-700 dark:text-emerald-300">
            Bạn đang ở trong mạng của quán — có thể chấm công.
          </Typography>
        </Box>
      )}

      {/* KHÔNG ở mạng quán → báo lỗi, KHÔNG hiện camera/chấm công */}
      {!ipOk ? (
        <Box
          layoutClassName="flex flex-col items-center gap-3 p-5 text-center"
          roundedClassName="rounded-xl"
          borderClassName="border border-rose-200 dark:border-rose-800/60"
          backgroundClassName="bg-rose-50 dark:bg-rose-900/20"
        >
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <Typography size="sm" layoutClassName="font-semibold" textClassName="text-rose-700 dark:text-rose-300">
            {ipConfigured
              ? 'Bạn KHÔNG ở trong mạng wifi của quán nên không thể chấm công.'
              : 'Quán chưa cấu hình mạng chấm công.'}
          </Typography>
          <Typography size="xs" textClassName="text-rose-600/80 dark:text-rose-300/80">
            {ipConfigured
              ? `Hãy kết nối đúng wifi quán rồi tải lại trang. (IP hiện tại: ${me.ip.ip || '—'})`
              : 'Nhờ quản lý thêm IP mạng quán trong mục Quản lý.'}
          </Typography>
        </Box>
      ) : !hasFace ? (
        // Chưa được đăng ký khuôn mặt → KHÔNG tự đăng ký, KHÔNG hiện camera.
        <Box
          layoutClassName="flex flex-col items-center gap-3 p-5 text-center"
          roundedClassName="rounded-xl"
          borderClassName="border border-amber-200 dark:border-amber-800/50"
          backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
        >
          <ScanFace className="h-8 w-8 text-amber-500" />
          <Typography size="sm" layoutClassName="font-semibold" textClassName="text-amber-700 dark:text-amber-300">
            Bạn chưa được đăng ký khuôn mặt
          </Typography>
          <Typography size="xs" textClassName="text-amber-700/80 dark:text-amber-300/80">
            Nhờ quản lý (super admin) đăng ký khuôn mặt cho bạn tại máy quản lý, sau đó mới chấm công được.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Camera — chỉ bật khi đã ở đúng mạng quán + đã đăng ký khuôn mặt */}
          <CameraCapture ref={camRef} />
          <Box layoutClassName="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="primary"
              fullWidth
              disabled={busy !== null}
              leftIcon={<LogIn className="h-4 w-4" />}
              onClick={() => run('in')}
            >
              {busy === 'in' ? 'Đang chấm…' : 'Vào ca'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={busy !== null}
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={() => run('out')}
            >
              {busy === 'out' ? 'Đang chấm…' : 'Tan ca'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default CheckInTab;
