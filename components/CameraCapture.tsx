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
  /**
   * Chụp khung hình hiện tại → JPEG Blob (null nếu camera chưa sẵn sàng).
   * opts.stamp: các dòng chữ đóng dấu vào GÓC DƯỚI ảnh (vd tên, loại, ngày giờ).
   */
  capture: (opts?: { stamp?: string[] }) => Promise<Blob | null>;
  /** Phần tử <video> đang chạy (để chạy detect pose realtime), null nếu chưa sẵn sàng. */
  getVideo: () => HTMLVideoElement | null;
}

interface CameraCaptureProps {
  onReady?: (ready: boolean) => void;
  /** class chiều cao vùng video (mặc định aspect vuông). */
  heightClassName?: string;
  /** Hiệu ứng vạch quét + 4 góc mặc định (kiểu ngân hàng). Tắt khi muốn overlay riêng. */
  showScanEffect?: boolean;
  /** Lớp phủ tuỳ biến vẽ đè lên video (vd vòng hướng dẫn pose khi đăng ký). */
  overlay?: React.ReactNode;
}

/**
 * Ô camera trực tiếp (getUserMedia) cho chấm công Face ID. Dùng thẻ <video>/<canvas>
 * (không có component UI tương ứng). Hiển thị soi gương cho tự nhiên, nhưng CHỤP khung
 * gốc (không lật) để vector khuôn mặt nhất quán giữa lúc đăng ký và lúc chấm.
 * Chụp qua ref: const r = useRef<CameraCaptureHandle>(null); await r.current?.capture().
 */
const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  ({ onReady, heightClassName = 'aspect-[4/3]', showScanEffect = true, overlay }, ref) => {
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
      capture: async (opts) => {
        const video = videoRef.current;
        if (!video || !ready || !video.videoWidth) return null;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Đóng dấu ngày-giờ / loại chấm công vào GÓC DƯỚI ảnh (như app chấm công/ngân hàng).
        const lines = opts?.stamp?.filter((l) => l && l.trim());
        if (lines && lines.length) {
          const pad = Math.round(canvas.width * 0.025);
          const fs = Math.max(14, Math.round(canvas.width * 0.04));
          const lineH = Math.round(fs * 1.35);
          const boxH = lineH * lines.length + pad;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(0, canvas.height - boxH, canvas.width, boxH);
          ctx.font = `600 ${fs}px system-ui, -apple-system, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillStyle = '#ffffff';
          lines.forEach((t, i) =>
            ctx.fillText(t, pad, canvas.height - boxH + Math.round(pad / 2) + i * lineH),
          );
        }
        return new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9),
        );
      },
      getVideo: () => (ready ? videoRef.current : null),
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
        {/* Hiệu ứng quét khuôn mặt kiểu app ngân hàng: khung 4 góc + vạch quét chạy dọc */}
        <style>{`@keyframes cqScanLine{0%,100%{top:6%;opacity:.35}50%{top:90%;opacity:1}}`}</style>
        {ready && showScanEffect && (
          <Box layoutClassName="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Box layoutClassName="relative h-2/3 w-2/3">
              <Box layoutClassName="absolute left-0 top-0 h-7 w-7" borderClassName="border-l-2 border-t-2 border-emerald-400" roundedClassName="rounded-tl-xl" />
              <Box layoutClassName="absolute right-0 top-0 h-7 w-7" borderClassName="border-r-2 border-t-2 border-emerald-400" roundedClassName="rounded-tr-xl" />
              <Box layoutClassName="absolute bottom-0 left-0 h-7 w-7" borderClassName="border-b-2 border-l-2 border-emerald-400" roundedClassName="rounded-bl-xl" />
              <Box layoutClassName="absolute bottom-0 right-0 h-7 w-7" borderClassName="border-b-2 border-r-2 border-emerald-400" roundedClassName="rounded-br-xl" />
              <Box
                layoutClassName="absolute left-1 right-1 h-0.5"
                backgroundClassName="bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                style={{ animation: 'cqScanLine 2.2s ease-in-out infinite', boxShadow: '0 0 8px 1px rgba(16,185,129,0.7)' }}
              />
            </Box>
          </Box>
        )}
        {/* Lớp phủ tuỳ biến (vd vòng hướng dẫn pose lúc đăng ký) */}
        {ready && overlay && (
          <Box layoutClassName="pointer-events-none absolute inset-0">{overlay}</Box>
        )}
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
