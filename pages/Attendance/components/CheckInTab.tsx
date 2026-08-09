import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { LogIn, LogOut, RefreshCw, ScanFace, Wifi, WifiOff } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Heading from '@/components/ui/Heading';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import CameraCapture, { CameraCaptureHandle } from '@/components/CameraCapture';
import { useAttendanceMe, useAttendanceActions } from '@/hooks/queries/useAttendanceQuery';
import { SHIFTS, shiftLabel, shiftTime } from '@/types/attendance';

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

  // Hành động kế tiếp + ca sắp chấm (BE derive; fallback theo lastKind nếu API cũ).
  const status = me.status;
  const nextKind: Exclude<BusyMode, null> =
    status?.nextKind ?? (status?.lastKind === 'in' ? 'out' : 'in');
  const isCheckedIn = nextKind === 'out';
  const curShift = status?.currentShift ?? null;
  const todayShifts = status?.todayShifts ?? [];

  const run = async (mode: Exclude<BusyMode, null>) => {
    // Đóng dấu tên + loại + ca + ngày giờ vào góc ảnh trước khi gửi lưu.
    const shiftTxt = curShift ? ` · ${shiftLabel(curShift)}` : '';
    const stamp = [
      me?.employee?.name ?? '',
      `${mode === 'in' ? 'VÀO CA' : 'TAN CA'}${shiftTxt}`,
      new Date().toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }),
    ];
    const blob = await camRef.current?.capture({ stamp });
    if (!blob) {
      toast.error('Camera chưa sẵn sàng. Đợi camera bật rồi thử lại.');
      return;
    }
    setBusy(mode);
    try {
      const r = await check(blob, mode);
      const caTxt = r.record.shift ? ` ${shiftLabel(r.record.shift)}` : '';
      toast.success(
        `${mode === 'in' ? 'Đã chấm VÀO' : 'Đã chấm TAN'}${caTxt} lúc ${fmt(r.record.checkedAt)}.`,
      );
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Thao tác thất bại.');
    } finally {
      setBusy(null);
    }
  };

  // Ở MẠNG NGOÀI (hoặc quán chưa cấu hình) → TRANG LỖI toàn màn, KHÔNG header/badge/camera.
  if (!ipOk) {
    return (
      <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <Box
          layoutClassName="flex h-20 w-20 items-center justify-center"
          roundedClassName="rounded-full"
          backgroundClassName="bg-rose-100 dark:bg-rose-900/30"
        >
          <WifiOff className="h-10 w-10 text-rose-500" />
        </Box>
        <Heading level={2} textClassName="text-xl font-bold text-slate-900 dark:text-white">
          {ipConfigured ? 'Bạn đang ở mạng ngoài' : 'Quán chưa cấu hình mạng chấm công'}
        </Heading>
        <Typography size="sm" layoutClassName="max-w-sm" textClassName="text-slate-600 dark:text-slate-300">
          {ipConfigured
            ? 'Chỉ chấm công được khi thiết bị dùng WIFI CỦA QUÁN. Hãy kết nối đúng wifi quán rồi bấm "Thử lại".'
            : 'Nhờ quản lý (super admin) thêm IP mạng quán trong mục Quản lý trước khi chấm công.'}
        </Typography>
        {ipConfigured && (
          <Badge
            size="sm"
            layoutClassName="px-2.5 py-1 font-mono"
            backgroundClassName="bg-slate-100 dark:bg-slate-700"
            textClassName="text-slate-600 dark:text-slate-300"
          >
            IP hiện tại: {me.ip.ip || '—'}
          </Badge>
        )}
        <Button
          type="button"
          variant="primary"
          sizeClassName="px-4 py-2 text-sm"
          layoutClassName="inline-flex items-center gap-2"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => refetch()}
        >
          Thử lại
        </Button>
      </Box>
    );
  }

  const initial = (me.employee.name || '?').trim().charAt(0).toUpperCase();

  return (
    <Box layoutClassName="mx-auto flex w-full max-w-sm flex-col gap-5 py-2">
      {/* Header: avatar + tên + chip mạng quán */}
      <Box layoutClassName="flex flex-col items-center gap-2 text-center">
        <Box
          layoutClassName="flex h-16 w-16 items-center justify-center"
          roundedClassName="rounded-full"
          backgroundClassName="bg-primary-100 dark:bg-primary-900/40"
        >
          <Typography as="span" layoutClassName="text-2xl font-bold" textClassName="text-primary-600 dark:text-primary-300">
            {initial}
          </Typography>
        </Box>
        <Heading level={2} textClassName="text-xl font-bold text-slate-900 dark:text-white">
          {me.employee.name}
        </Heading>
        <Box
          layoutClassName="inline-flex items-center gap-1.5 px-2.5 py-1"
          roundedClassName="rounded-full"
          backgroundClassName="bg-emerald-100 dark:bg-emerald-900/30"
        >
          <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-emerald-700 dark:text-emerald-300">
            Trong mạng quán
          </Typography>
        </Box>
      </Box>

      {/* Trạng thái hôm nay theo TỪNG CA (highlight ca sắp chấm) */}
      <Box layoutClassName="flex flex-col gap-2">
        {SHIFTS.map((s) => {
          const rec = todayShifts.find((t) => t.shift === s.value);
          const active = curShift === s.value;
          return (
            <Box
              key={s.value}
              layoutClassName="flex items-center justify-between gap-2 px-3 py-2"
              roundedClassName="rounded-xl"
              borderClassName={
                active
                  ? 'border border-primary-300 dark:border-primary-700'
                  : 'border border-slate-200 dark:border-slate-700'
              }
              backgroundClassName={
                active ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-slate-800'
              }
            >
              <Box layoutClassName="flex flex-col">
                <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                  {s.label}
                  {active ? ' · sắp chấm' : ''}
                </Typography>
                <Typography as="span" size="xs" textClassName="text-slate-400 dark:text-slate-500">
                  {s.time}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center gap-4">
                <Box layoutClassName="flex flex-col items-end">
                  <Box layoutClassName="flex items-center gap-1">
                    <LogIn className="h-3 w-3 text-emerald-500" />
                    <Typography as="span" size="xs" textClassName="text-slate-400 dark:text-slate-500">
                      Vào
                    </Typography>
                  </Box>
                  <Typography as="span" size="sm" layoutClassName="font-bold tabular-nums" textClassName="text-emerald-600 dark:text-emerald-400">
                    {fmt(rec?.in)}
                  </Typography>
                </Box>
                <Box layoutClassName="flex flex-col items-end">
                  <Box layoutClassName="flex items-center gap-1">
                    <LogOut className="h-3 w-3 text-rose-500" />
                    <Typography as="span" size="xs" textClassName="text-slate-400 dark:text-slate-500">
                      Tan
                    </Typography>
                  </Box>
                  <Typography as="span" size="sm" layoutClassName="font-bold tabular-nums" textClassName="text-rose-600 dark:text-rose-400">
                    {fmt(rec?.out)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {!hasFace ? (
        // Chưa được đăng ký khuôn mặt → KHÔNG tự đăng ký, KHÔNG hiện camera.
        <Box
          layoutClassName="flex flex-col items-center gap-3 p-5 text-center"
          roundedClassName="rounded-2xl"
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
          {/* Camera vuông cho mặt — chỉ bật khi ở đúng mạng + đã đăng ký */}
          <CameraCapture ref={camRef} heightClassName="aspect-square" />
          {curShift && (
            <Box layoutClassName="flex items-center justify-center gap-1.5">
              <Typography as="span" size="xs" variant="muted">
                {isCheckedIn ? 'Tan ca:' : 'Vào ca:'}
              </Typography>
              <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-primary-600 dark:text-primary-300">
                {shiftLabel(curShift)} · {shiftTime(curShift)}
              </Typography>
            </Box>
          )}
          <Typography size="xs" variant="muted" layoutClassName="text-center">
            {isCheckedIn
              ? 'Đưa mặt vào khung rồi bấm Tan ca để kết thúc ca.'
              : 'Đưa mặt vào khung rồi bấm Vào ca để bắt đầu ca.'}
          </Typography>
          {/* Mỗi lúc chỉ 1 nút theo trạng thái: chưa vào ca → Vào ca; đã vào ca → Tan ca. */}
          {isCheckedIn ? (
            <Button
              type="button"
              fullWidth
              disabled={busy !== null}
              sizeClassName="px-4 py-4 text-base"
              layoutClassName="inline-flex items-center justify-center gap-2"
              roundedClassName="rounded-xl"
              backgroundClassName="bg-rose-600 hover:bg-rose-700"
              textClassName="font-semibold text-white"
              borderClassName="border border-transparent"
              disableVariantHover
              disableVariantTextColor
              leftIcon={<LogOut className="h-5 w-5" />}
              onClick={() => run('out')}
            >
              {busy === 'out' ? 'Đang chấm…' : `Tan ${curShift ? shiftLabel(curShift) : 'ca'}`}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              fullWidth
              disabled={busy !== null}
              sizeClassName="px-4 py-4 text-base"
              layoutClassName="inline-flex items-center justify-center gap-2"
              roundedClassName="rounded-xl"
              leftIcon={<LogIn className="h-5 w-5" />}
              onClick={() => run('in')}
            >
              {busy === 'in' ? 'Đang chấm…' : `Vào ${curShift ? shiftLabel(curShift) : 'ca'}`}
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

export default CheckInTab;
