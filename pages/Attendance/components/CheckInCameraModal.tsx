import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, LogIn, LogOut, ScanFace } from 'lucide-react';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import CameraCapture, { CameraCaptureHandle } from '@/components/CameraCapture';
import { useAttendanceActions } from '@/hooks/queries/useAttendanceQuery';
import {
  AttendanceKind,
  AttendanceShift,
  shiftLabel,
  shiftTime,
} from '@/types/attendance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: AttendanceKind;
  shift: AttendanceShift | null;
  employeeName: string;
  onSuccess: () => void | Promise<unknown>;
}

const fmtTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

/**
 * Modal camera CHẤM CÔNG riêng: mở khi bấm Vào/Tan ca. Camera chỉ bật trong modal
 * (đóng modal → tắt stream). Bấm chấm → chụp (đóng dấu tên/ca/giờ) → hiện lớp
 * "đang nhận diện" trong lúc BE khớp mặt → thành công đóng modal, lỗi báo tại chỗ để thử lại.
 */
const CheckInCameraModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mode,
  shift,
  employeeName,
  onSuccess,
}) => {
  const { check } = useAttendanceActions();
  const camRef = useRef<CameraCaptureHandle>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIn = mode === 'in';
  const actionLabel = `${isIn ? 'Vào' : 'Tan'} ${shift ? shiftLabel(shift) : 'ca'}`;

  const handleClose = () => {
    if (busy) return; // đang gọi BE thì không cho đóng
    setError(null);
    onClose();
  };

  const submit = async () => {
    const shiftTxt = shift ? ` · ${shiftLabel(shift)}` : '';
    const stamp = [
      employeeName || '',
      `${isIn ? 'VÀO CA' : 'TAN CA'}${shiftTxt}`,
      new Date().toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }),
    ];
    const blob = await camRef.current?.capture({ stamp });
    if (!blob) {
      setError('Camera chưa sẵn sàng. Đợi camera bật rồi thử lại.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await check(blob, mode);
      const caTxt = r.record.shift ? ` ${shiftLabel(r.record.shift)}` : '';
      toast.success(
        `${isIn ? 'Đã chấm VÀO' : 'Đã chấm TAN'}${caTxt} lúc ${fmtTime(r.record.checkedAt)}.`,
      );
      await onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chấm công thất bại. Thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <Box layoutClassName="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="secondary"
        sizeClassName="px-4 py-2 text-sm"
        disabled={busy}
        onClick={handleClose}
      >
        Huỷ
      </Button>
      <Button
        type="button"
        fullWidth={false}
        disabled={busy}
        sizeClassName="px-5 py-2 text-sm"
        layoutClassName="inline-flex items-center gap-2"
        roundedClassName="rounded-lg"
        backgroundClassName={isIn ? 'bg-primary-600 hover:bg-primary-700' : 'bg-rose-600 hover:bg-rose-700'}
        textClassName="font-semibold text-white"
        borderClassName="border border-transparent"
        disableVariantHover
        disableVariantTextColor
        leftIcon={isIn ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
        onClick={submit}
      >
        {busy ? 'Đang nhận diện…' : `Chấm ${actionLabel}`}
      </Button>
    </Box>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={`Chấm công · ${actionLabel}`} footer={footer} size="sm">
      <Box layoutClassName="space-y-3">
        {shift && (
          <Box layoutClassName="flex items-center justify-center gap-1.5">
            <Typography as="span" size="xs" variant="muted">
              {isIn ? 'Vào ca:' : 'Tan ca:'}
            </Typography>
            <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-primary-600 dark:text-primary-300">
              {shiftLabel(shift)} · {shiftTime(shift)}
            </Typography>
          </Box>
        )}

        {/* Camera + lớp ĐANG XỬ LÝ khi gọi BE nhận diện */}
        <Box layoutClassName="relative">
          <CameraCapture ref={camRef} heightClassName="aspect-square" />
          {busy && (
            <Box
              layoutClassName="absolute inset-0 flex flex-col items-center justify-center gap-3"
              roundedClassName="rounded-xl"
              backgroundClassName="bg-slate-900/70"
            >
              <style>{`@keyframes cqSpin{to{transform:rotate(360deg)}}`}</style>
              <Box
                layoutClassName="h-12 w-12"
                roundedClassName="rounded-full"
                borderClassName="border-4 border-white/25 border-t-emerald-400"
                style={{ animation: 'cqSpin 0.8s linear infinite' }}
              />
              <Typography size="sm" layoutClassName="font-semibold" textClassName="text-white">
                Đang nhận diện khuôn mặt…
              </Typography>
            </Box>
          )}
        </Box>

        {error ? (
          <Box
            layoutClassName="flex items-start gap-2 p-3"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-rose-50 dark:bg-rose-900/20"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <Typography size="sm" textClassName="text-rose-700 dark:text-rose-300">
              {error}
            </Typography>
          </Box>
        ) : (
          <Box layoutClassName="flex items-center justify-center gap-2">
            <ScanFace className="h-4 w-4 text-slate-400" />
            <Typography size="xs" variant="muted" layoutClassName="text-center">
              Đưa mặt vào khung, đủ sáng rồi bấm "Chấm {actionLabel}".
            </Typography>
          </Box>
        )}
      </Box>
    </BaseModal>
  );
};

export default CheckInCameraModal;
