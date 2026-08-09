import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  ScanFace,
  User,
} from 'lucide-react';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import CameraCapture, { CameraCaptureHandle } from '@/components/CameraCapture';
import { useAttendanceActions } from '@/hooks/queries/useAttendanceQuery';
import {
  estimatePose,
  loadFacePoseModels,
  type PoseDirection,
} from '@/utils/facePose';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: { employeeId: string; name: string } | null;
  onDone: () => void;
}

interface Step {
  dir: PoseDirection;
  label: string;
}

/** Các góc mặt cần quét, theo thứ tự hướng dẫn. */
const STEPS: Step[] = [
  { dir: 'center', label: 'Nhìn thẳng vào camera' },
  { dir: 'left', label: 'Từ từ nghiêng đầu sang TRÁI' },
  { dir: 'right', label: 'Từ từ nghiêng đầu sang PHẢI' },
  { dir: 'up', label: 'Ngẩng đầu lên trên' },
  { dir: 'down', label: 'Cúi đầu xuống dưới' },
];

const DETECT_INTERVAL = 130; // ms giữa mỗi lần detect
const HOLD_NEEDED = 3; // số lần liên tiếp đúng hướng mới chấp nhận (~0.4s)
const STALL_TICKS = 90; // ~12s: nếu 1 bước kẹt quá lâu mà vẫn thấy mặt → tự chụp cho qua

type Phase = 'idle' | 'loading' | 'running' | 'done';

/**
 * Đăng ký khuôn mặt kiểu Face ID: PHÁT HIỆN HƯỚNG MẶT REALTIME trên trình duyệt
 * (face-api tiny + landmark68). Vòng hướng dẫn quanh mặt, khi nghiêng đúng hướng thì
 * đoạn đó sáng xanh → tự chụp 1 mẫu (gửi BE tính vector) → chuyển hướng kế. Chỉ super_admin dùng.
 */
const FaceEnrollModal: React.FC<Props> = ({ isOpen, onClose, employee, onDone }) => {
  const { registerFace } = useAttendanceActions();
  const camRef = useRef<CameraCaptureHandle>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [stepIdx, setStepIdx] = useState(0);
  const [live, setLive] = useState<{ hasFace: boolean; direction: PoseDirection }>({
    hasFace: false,
    direction: 'center',
  });

  // Refs điều phối vòng detect (đọc giá trị mới nhất trong loop async).
  const stoppedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);
  const holdRef = useRef(0);
  const tickOnStepRef = useRef(0);
  const capturingRef = useRef(false);
  const firstRef = useRef(true);
  const okCountRef = useRef(0);
  const doneDirsRef = useRef<Set<PoseDirection>>(new Set());
  const [doneDirs, setDoneDirs] = useState<Set<PoseDirection>>(new Set());

  const stopLoop = () => {
    stoppedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetAll = () => {
    stopLoop();
    setPhase('idle');
    setStepIdx(0);
    stepRef.current = 0;
    holdRef.current = 0;
    tickOnStepRef.current = 0;
    capturingRef.current = false;
    firstRef.current = true;
    okCountRef.current = 0;
    doneDirsRef.current = new Set();
    setDoneDirs(new Set());
    setLive({ hasFace: false, direction: 'center' });
  };

  // Dọn dẹp khi đóng modal / unmount.
  useEffect(() => {
    if (!isOpen) resetAll();
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!employee) return null;

  const finish = () => {
    stopLoop();
    setPhase('done');
    if (okCountRef.current > 0) {
      toast.success(`Đã đăng ký ${okCountRef.current} mẫu khuôn mặt cho ${employee.name}.`);
      onDone();
    } else {
      toast.error('Chưa lấy được mẫu khuôn mặt nào. Đảm bảo đủ sáng, mặt trong khung rồi thử lại.');
      setPhase('idle');
    }
  };

  const captureCurrentStep = async (): Promise<void> => {
    const target = STEPS[stepRef.current];
    capturingRef.current = true;
    holdRef.current = 0;
    try {
      const blob = await camRef.current?.capture();
      if (blob) {
        await registerFace(blob, { employeeId: employee.employeeId, reset: firstRef.current });
        firstRef.current = false;
        okCountRef.current += 1;
        doneDirsRef.current.add(target.dir);
        setDoneDirs(new Set(doneDirsRef.current));
      }
      // sang bước kế (dù blob lỗi cũng nhích để không kẹt cứng, nhưng chỉ khi đã chụp được ≥1)
      const next = stepRef.current + 1;
      if (next >= STEPS.length) {
        finish();
        return;
      }
      stepRef.current = next;
      setStepIdx(next);
      tickOnStepRef.current = 0;
    } catch {
      // góc này chưa rõ mặt → giữ nguyên bước, thử lại sau cooldown
    } finally {
      await new Promise((r) => setTimeout(r, 650)); // cooldown tránh chụp trùng
      capturingRef.current = false;
    }
  };

  const tick = async () => {
    if (stoppedRef.current) return;
    try {
      if (!capturingRef.current) {
        const video = camRef.current?.getVideo();
        if (video) {
          const pose = await estimatePose(video);
          setLive({ hasFace: pose.hasFace, direction: pose.direction });
          const target = STEPS[stepRef.current];
          tickOnStepRef.current += 1;

          const matched = pose.hasFace && pose.direction === target.dir;
          if (matched) holdRef.current += 1;
          else holdRef.current = Math.max(0, holdRef.current - 1);

          const stalled = pose.hasFace && tickOnStepRef.current > STALL_TICKS;
          if (holdRef.current >= HOLD_NEEDED || stalled) {
            await captureCurrentStep();
          }
        }
      }
    } catch {
      /* bỏ qua lỗi 1 frame */
    } finally {
      if (!stoppedRef.current) timerRef.current = setTimeout(tick, DETECT_INTERVAL);
    }
  };

  const start = async () => {
    setPhase('loading');
    try {
      await loadFacePoseModels();
    } catch {
      toast.error('Không tải được bộ nhận diện khuôn mặt. Kiểm tra mạng rồi thử lại.');
      setPhase('idle');
      return;
    }
    // reset tiến trình quét
    stepRef.current = 0;
    setStepIdx(0);
    holdRef.current = 0;
    tickOnStepRef.current = 0;
    capturingRef.current = false;
    firstRef.current = true;
    okCountRef.current = 0;
    doneDirsRef.current = new Set();
    setDoneDirs(new Set());
    setPhase('running');
    stoppedRef.current = false;
    timerRef.current = setTimeout(tick, DETECT_INTERVAL);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const total = STEPS.length;
  const pct = Math.round((doneDirs.size / total) * 100);
  const target = STEPS[stepIdx];
  const running = phase === 'running';

  // Trạng thái từng hướng cho vòng hướng dẫn.
  const dirState = (d: PoseDirection): 'done' | 'active' | 'idle' => {
    if (doneDirs.has(d)) return 'done';
    if (running && target.dir === d) return 'active';
    return 'idle';
  };
  const matchingNow = running && live.hasFace && live.direction === target.dir;

  const pill = (d: Exclude<PoseDirection, 'center'>, Icon: typeof ChevronUp, pos: string) => {
    const st = dirState(d);
    const bg =
      st === 'done'
        ? 'bg-emerald-500'
        : st === 'active'
          ? matchingNow
            ? 'bg-emerald-400'
            : 'bg-amber-400'
          : 'bg-white/25';
    return (
      <Box
        layoutClassName={`absolute ${pos} flex h-9 w-9 items-center justify-center`}
        roundedClassName="rounded-full"
        backgroundClassName={bg}
        stateClassName={st === 'active' && !matchingNow ? 'animate-pulse' : undefined}
      >
        <Icon className="h-5 w-5 text-white" />
      </Box>
    );
  };

  // Lớp phủ vòng hướng dẫn pose đè lên camera.
  const overlay = (
    <Box layoutClassName="absolute inset-0 flex items-center justify-center">
      <Box layoutClassName="relative h-[78%] w-[78%]">
        {/* Vòng khuôn mặt: xanh khi đang khớp hướng cần lấy */}
        <Box
          layoutClassName="absolute inset-0"
          roundedClassName="rounded-full"
          borderClassName={
            matchingNow ? 'border-4 border-emerald-400' : 'border-2 border-white/60'
          }
          style={matchingNow ? { boxShadow: '0 0 16px 2px rgba(16,185,129,0.7)' } : undefined}
        />
        {/* Chấm tâm (bước nhìn thẳng) */}
        <Box layoutClassName="absolute inset-0 flex items-center justify-center">
          <Box
            layoutClassName="h-4 w-4"
            roundedClassName="rounded-full"
            backgroundClassName={
              dirState('center') === 'done'
                ? 'bg-emerald-500'
                : dirState('center') === 'active'
                  ? matchingNow
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                  : 'bg-white/40'
            }
          />
        </Box>
        {pill('up', ChevronUp, '-top-3 left-1/2 -translate-x-1/2')}
        {pill('down', ChevronDown, '-bottom-3 left-1/2 -translate-x-1/2')}
        {pill('left', ChevronLeft, 'top-1/2 -left-3 -translate-y-1/2')}
        {pill('right', ChevronRight, 'top-1/2 -right-3 -translate-y-1/2')}
      </Box>
    </Box>
  );

  const footer = (
    <Box layoutClassName="flex items-center justify-end gap-2">
      <Button type="button" variant="secondary" sizeClassName="px-4 py-2 text-sm" onClick={handleClose}>
        {phase === 'done' ? 'Đóng' : 'Huỷ'}
      </Button>
      {phase !== 'running' && phase !== 'loading' && (
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
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Đăng ký khuôn mặt · ${employee.name}`}
      footer={footer}
      size="md"
    >
      <Box layoutClassName="space-y-4">
        <CameraCapture
          ref={camRef}
          heightClassName="aspect-square"
          showScanEffect={false}
          overlay={running || phase === 'done' ? overlay : undefined}
        />

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
            Đã lấy {doneDirs.size}/{total} góc
          </Typography>
        </Box>

        {/* Hướng dẫn theo bước / trạng thái */}
        {phase === 'loading' ? (
          <Box
            layoutClassName="flex items-center gap-2 p-3"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-slate-50 dark:bg-slate-800"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary-500" />
            <Typography size="sm" textClassName="text-slate-600 dark:text-slate-300">
              Đang tải bộ nhận diện khuôn mặt…
            </Typography>
          </Box>
        ) : running ? (
          <Box
            layoutClassName="flex items-center gap-2 p-3"
            roundedClassName="rounded-lg"
            backgroundClassName={
              matchingNow
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : !live.hasFace
                  ? 'bg-amber-50 dark:bg-amber-900/20'
                  : 'bg-primary-50 dark:bg-primary-900/20'
            }
          >
            {!live.hasFace ? (
              <User className="h-4 w-4 shrink-0 text-amber-500" />
            ) : matchingNow ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary-500" />
            )}
            <Typography
              size="sm"
              layoutClassName="font-semibold"
              textClassName={
                matchingNow
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : !live.hasFace
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-primary-700 dark:text-primary-300'
              }
            >
              {!live.hasFace ? 'Đưa mặt vào khung tròn' : matchingNow ? 'Giữ yên…' : target.label}
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
              Xong! Đã lưu {okCountRef.current} mẫu khuôn mặt.
            </Typography>
          </Box>
        ) : (
          <Typography size="xs" variant="muted">
            Đưa mặt nhân viên vào khung tròn, đủ sáng. Bấm "Bắt đầu quét" rồi làm theo hướng dẫn: nhìn
            thẳng → nghiêng trái/phải → ngẩng/cúi. Nghiêng ĐÚNG hướng thì đoạn đó sáng xanh và tự chụp,
            rồi chuyển hướng kế.
          </Typography>
        )}
      </Box>
    </BaseModal>
  );
};

export default FaceEnrollModal;
