import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

export interface CameraCaptureHandle {
  /** Chụp khung hình hiện tại → JPEG Blob (null nếu camera chưa sẵn sàng). */
  capture: () => Promise<Blob | null>;
}

interface CameraCaptureProps {
  onReady?: (ready: boolean) => void;
  /** class chiều cao vùng video (mặc định aspect vuông). */
  heightClassName?: string;
}

/**
 * Ô camera trực tiếp (getUserMedia) cho chấm công Face ID. Dùng thẻ <video>/<canvas>
 * (không có component UI tương ứng). Hiển thị soi gương cho tự nhiên, nhưng CHỤP khung
 * gốc (không lật) để vector khuôn mặt nhất quán giữa lúc đăng ký và lúc chấm.
 * Chụp qua ref: const r = useRef<CameraCaptureHandle>(null); await r.current?.capture().
 */
const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  ({ onReady, heightClassName = 'aspect-[4/3]' }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
      let cancelled = false;
      setReady(false);
      setError(null);

      async function start() {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Trình duyệt không hỗ trợ camera.');
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          const video = videoRef.current;
          if (video) {
            video.srcObject = stream;
            await video.play().catch(() => {});
            setReady(true);
            onReady?.(true);
          }
        } catch (e: any) {
          const name = e?.name || '';
          setError(
            name === 'NotAllowedError'
              ? 'Bạn chưa cho phép dùng camera. Bấm cho phép rồi thử lại.'
              : name === 'NotFoundError'
                ? 'Không tìm thấy camera trên thiết bị.'
                : 'Không mở được camera. Thử lại.',
          );
        }
      }

      start();
      return () => {
        cancelled = true;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        onReady?.(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt]);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        const video = videoRef.current;
        if (!video || !ready || !video.videoWidth) return null;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9),
        );
      },
    }));

    if (error) {
      return (
        <Box
          layoutClassName={`flex ${heightClassName} w-full flex-col items-center justify-center gap-3 p-4`}
          backgroundClassName="bg-slate-100 dark:bg-slate-800"
          roundedClassName="rounded-xl"
          borderClassName="border border-dashed border-slate-300 dark:border-slate-600"
        >
          <CameraOff className="h-8 w-8 text-slate-400" />
          <Typography size="sm" textClassName="text-center text-slate-500 dark:text-slate-400">
            {error}
          </Typography>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => setAttempt((a) => a + 1)}
          >
            Thử lại camera
          </Button>
        </Box>
      );
    }

    return (
      <Box
        layoutClassName={`relative ${heightClassName} w-full overflow-hidden`}
        backgroundClassName="bg-slate-900"
        roundedClassName="rounded-xl"
      >
        {/* Thẻ video thô (không có component UI tương ứng). Style inline để tránh
            className bị scanner gán nhầm cho Box cha. Soi gương bằng scaleX(-1). */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
        {/* Khung tròn gợi ý đặt mặt */}
        <Box layoutClassName="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Box
            layoutClassName="h-40 w-40 sm:h-48 sm:w-48"
            borderClassName="border-2 border-white/70"
            roundedClassName="rounded-full"
          />
        </Box>
        {!ready && (
          <Box
            layoutClassName="absolute inset-0 flex items-center justify-center gap-2"
            backgroundClassName="bg-slate-900/60"
          >
            <Camera className="h-5 w-5 animate-pulse text-white" />
            <Typography size="sm" textClassName="text-white">Đang mở camera…</Typography>
          </Box>
        )}
      </Box>
    );
  },
);

CameraCapture.displayName = 'CameraCapture';
export default CameraCapture;
