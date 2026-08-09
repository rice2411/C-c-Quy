import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  LogIn,
  LogOut,
  ScanFace,
  ShieldCheck,
  UserPlus,
  Wifi,
  WifiOff,
} from 'lucide-react';
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

type BusyMode = 'in' | 'out' | 'register' | null;

const CheckInTab: React.FC = () => {
  const { me, loading, refetch } = useAttendanceMe();
  const { registerFace, check } = useAttendanceActions();
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
      if (mode === 'register') {
        const r = await registerFace(blob, { reset: hasFace });
        toast.success(`Đã đăng ký khuôn mặt (${r.faceCount} mẫu).`);
      } else {
        const r = await check(blob, mode);
        toast.success(
          `${mode === 'in' ? 'Đã chấm VÀO ca' : 'Đã chấm TAN ca'} lúc ${fmt(r.record.checkedAt)}.`,
        );
      }
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

      {/* Trạng thái mạng quán */}
      <Box
        layoutClassName="flex items-center gap-2 px-3 py-2"
        roundedClassName="rounded-lg"
        backgroundClassName={ipOk ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}
      >
        {ipOk ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-rose-500" />}
        <Typography size="xs" textClassName={ipOk ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
          {ipOk
            ? 'Bạn đang ở trong mạng của quán — có thể chấm công.'
            : ipConfigured
              ? `Không ở mạng quán (IP ${me.ip.ip}) — không thể chấm công.`
              : 'Quán chưa cấu hình mạng chấm công. Nhờ quản lý thêm IP.'}
        </Typography>
      </Box>

      {/* Camera */}
      <CameraCapture ref={camRef} />

      {/* Hành động */}
      {!hasFace ? (
        <Box layoutClassName="flex flex-col gap-2">
          <Box
            layoutClassName="flex items-center gap-2 px-3 py-2"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-sky-50 dark:bg-sky-900/20"
          >
            <UserPlus className="h-4 w-4 text-sky-500" />
            <Typography size="xs" textClassName="text-sky-700 dark:text-sky-300">
              Lần đầu chấm công: đăng ký khuôn mặt của bạn trước.
            </Typography>
          </Box>
          <Button
            type="button"
            variant="primary"
            fullWidth
            disabled={busy !== null}
            leftIcon={<ScanFace className="h-4 w-4" />}
            onClick={() => run('register')}
          >
            {busy === 'register' ? 'Đang đăng ký…' : 'Đăng ký khuôn mặt'}
          </Button>
        </Box>
      ) : (
        <Box layoutClassName="flex flex-col gap-3">
          {/* Không ở mạng quán → báo lỗi rõ ngay tại chỗ chấm công, khoá nút. */}
          {!ipOk && (
            <Box
              layoutClassName="flex items-start gap-2 p-3"
              roundedClassName="rounded-lg"
              borderClassName="border border-rose-200 dark:border-rose-800/60"
              backgroundClassName="bg-rose-50 dark:bg-rose-900/20"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <Typography size="sm" textClassName="text-rose-700 dark:text-rose-300">
                {ipConfigured
                  ? `Không chấm công được: bạn KHÔNG ở trong mạng wifi của quán (IP ${me.ip.ip}). Hãy kết nối đúng wifi quán rồi tải lại trang.`
                  : 'Không chấm công được: quán chưa cấu hình mạng. Nhờ quản lý thêm IP mạng quán trong mục Quản lý.'}
              </Typography>
            </Box>
          )}
          <Box layoutClassName="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="primary"
              fullWidth
              disabled={busy !== null || !ipOk}
              leftIcon={<LogIn className="h-4 w-4" />}
              onClick={() => run('in')}
            >
              {busy === 'in' ? 'Đang chấm…' : 'Vào ca'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={busy !== null || !ipOk}
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={() => run('out')}
            >
              {busy === 'out' ? 'Đang chấm…' : 'Tan ca'}
            </Button>
          </Box>
          <Box layoutClassName="flex items-center justify-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            <Button type="button" variant="ghost" size="sm" disabled={busy !== null} onClick={() => run('register')}>
              {busy === 'register' ? 'Đang cập nhật…' : 'Đăng ký lại khuôn mặt'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CheckInTab;
