import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Loader2, ScanFace } from 'lucide-react';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import CameraCapture, { CameraCaptureHandle } from '@/components/CameraCapture';
import { useAttendanceActions } from '@/hooks/queries/useAttendanceQuery';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: { employeeId: string; name: string } | null;
  onDone: () => void;
}

/** Các góc mặt cần quét (nhẹ để bộ detect chính diện vẫn thấy mặt). */
const STEPS = [
  'Nhìn thẳng vào camera',
  'Nghiêng đầu sang TRÁI một chút',
  'Nghiêng đầu sang PHẢI một chút',
  'Ngẩng đầu lên một chút',
  'Cúi đầu xuống một chút',
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Đăng ký khuôn mặt cho 1 nhân viên theo kiểu Face ID: quét nhiều góc có hướng dẫn +
 * thanh tiến trình. Mỗi góc chụp 1 khung → BE tính vector & lưu (lần đầu reset mẫu cũ).
 * Chỉ super_admin dùng (BE chặn role).
 */
const FaceEnrollModal: React.FC<Props> = ({ isOpen, onClose, employee, onDone }) => {
  const { registerFace } = useAttendanceActions();
  const camRef = useRef<CameraCaptureHandle>(null);
  const cancelRef = useRef(false);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [stepIdx, setStepIdx] = useState(0);
  const [captured, setCaptured] = useState(0);

  if (!employee) return null;

  const reset = () => {
    cancelRef.current = true;
    setPhase('idle');
    setStepIdx(0);
    setCaptured(0);
  };

  const handleClose = () => {
    cancelRef.current = true;
    reset();
    onClose();
  };

  const start = async () => {
    cancelRef.current = false;
    setPhase('running');
    setCaptured(0);
    let ok = 0;
    let useReset = true;
    for (let i = 0; i < STEPS.length; i++) {
      if (cancelRef.current) break;
      setStepIdx(i);
      await delay(1600); // cho người chỉnh tư thế theo hướng dẫn
      if (cancelRef.current) break;
      let done = false;
      for (let attempt = 0; attempt < 2 && !done && !cancelRef.current; attempt++) {
        const blob = await camRef.current?.capture();
        if (!blob) {
          await delay(500);
          continue;
        }
        try {
          await registerFace(blob, { employeeId: employee.employeeId, reset: useReset });
          useReset = false;
          ok += 1;
          setCaptured(ok);
          done = true;
        } catch {
          await delay(600); // góc này không rõ mặt → thử lại/bỏ qua
        }
      }
    }
    if (cancelRef.current) return;
    setPhase('done');
    if (ok > 0) {
      toast.success(`Đã đăng ký ${ok} mẫu khuôn mặt cho ${employee.name}.`);
      onDone();
    } else {
      toast.error('Không nhận được khuôn mặt rõ. Đảm bảo đủ sáng, mặt trong khung tròn rồi thử lại.');
      setPhase('idle');
    }
  };

  const total = STEPS.length;
  const pct = Math.round((captured / total) * 100);

  const footer = (
    <Box layoutClassName="flex items-center justify-end gap-2">
      <Button type="button" variant="secondary" sizeClassName="px-4 py-2 text-sm" onClick={handleClose}>
        {phase === 'done' ? 'Đóng' : 'Huỷ'}
      </Button>
      {phase !== 'running' && (
        <Button
          type="button"
          variant="primary"
          sizeClassName="px-4 py-2 text-sm"
          layoutClassName="inline-flex items-center gap-2"
          leftIcon={<ScanFace className="h-4 w-4" />}
          onClick={start}
        >
          {phase === 'done' ? 'Quét lại' : 'Bắt đầu quét'}
        </Button>
      )}
    </Box>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={`Đăng ký khuôn mặt · ${employee.name}`} footer={footer} size="md">
      <Box layoutClassName="space-y-4">
        <CameraCapture ref={camRef} heightClassName="aspect-square" />

        {/* Thanh tiến trình + số mẫu */}
        <Box layoutClassName="space-y-1.5">
          <Box
            layoutClassName="h-2 w-full overflow-hidden"
            roundedClassName="rounded-full"
            backgroundClassName="bg-slate-200 dark:bg-slate-700"
          >
            <Box
              layoutClassName="h-full"
              roundedClassName="rounded-full"
              backgroundClassName="bg-primary-500"
              style={{ width: `${pct}%`, transition: 'width 0.3s ease' }}
            />
          </Box>
          <Typography size="xs" variant="muted">
            Đã lấy {captured}/{total} mẫu
          </Typography>
        </Box>

        {/* Hướng dẫn theo bước */}
        {phase === 'running' ? (
          <Box
            layoutClassName="flex items-center gap-2 p-3"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary-500" />
            <Typography size="sm" layoutClassName="font-semibold" textClassName="text-primary-700 dark:text-primary-300">
              {STEPS[stepIdx]}
            </Typography>
          </Box>
        ) : phase === 'done' ? (
          <Box
            layoutClassName="flex items-center gap-2 p-3"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <Typography size="sm" textClassName="text-emerald-700 dark:text-emerald-300">
              Xong! Đã lưu {captured} mẫu khuôn mặt.
            </Typography>
          </Box>
        ) : (
          <Typography size="xs" variant="muted">
            Đưa mặt nhân viên vào khung tròn, đủ sáng. Bấm "Bắt đầu quét" rồi làm theo hướng dẫn quay
            trái/phải/lên/xuống — hệ thống tự chụp nhiều góc để nhận diện chính xác hơn.
          </Typography>
        )}
      </Box>
    </BaseModal>
  );
};

export default FaceEnrollModal;
