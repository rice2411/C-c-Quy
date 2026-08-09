// Ước lượng HƯỚNG MẶT (pose) NGAY TRÊN TRÌNH DUYỆT cho luồng đăng ký khuôn mặt kiểu Face ID.
// Chỉ dùng tiny_face_detector + face_landmark_68 (nhẹ, ~560KB) — nhận diện danh tính vẫn ở BE.
// Model serve tĩnh từ /models/face (copy trong public/). face-api được import ĐỘNG để không
// phình main bundle (modal đăng ký mới nạp).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceApi = any;

const MODEL_URL = '/models/face';

let faceapiPromise: Promise<FaceApi> | null = null;
let modelsPromise: Promise<void> | null = null;

async function getFaceApi(): Promise<FaceApi> {
  if (!faceapiPromise) {
    faceapiPromise = import('@vladmandic/face-api').then(async (m) => {
      const faceapi: FaceApi = (m as unknown as { default?: FaceApi }).default ?? m;
      // Ưu tiên webgl cho realtime; fallback cpu/wasm nếu không có.
      try {
        await faceapi.tf?.setBackend?.('webgl');
      } catch {
        /* để backend mặc định */
      }
      await faceapi.tf?.ready?.();
      return faceapi;
    });
  }
  return faceapiPromise;
}

/** Nạp model (idempotent). Trả về khi sẵn sàng detect. */
export async function loadFacePoseModels(): Promise<void> {
  if (!modelsPromise) {
    modelsPromise = (async () => {
      const faceapi = await getFaceApi();
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    })().catch((e) => {
      modelsPromise = null; // cho phép thử lại
      throw e;
    });
  }
  return modelsPromise;
}

export type PoseDirection = 'center' | 'left' | 'right' | 'up' | 'down';

export interface PoseResult {
  hasFace: boolean;
  direction: PoseDirection;
  yaw: number; // <0: quay sang TRÁI màn hình (mirrored), >0: sang PHẢI
  pitch: number; // >0: ngẩng lên, <0: cúi xuống
  score: number;
}

// Ngưỡng phân loại hướng (đủ rộng vì landmark có nhiễu). Chỉnh nếu quá nhạy/ì.
const YAW_T = 0.16;
const PITCH_T = 0.14;

const NO_FACE: PoseResult = { hasFace: false, direction: 'center', yaw: 0, pitch: 0, score: 0 };

/**
 * Đo hướng mặt từ 1 khung video. Trả về hướng đã phân loại + yaw/pitch thô.
 * Lưu ý gương: video hiển thị soi gương (scaleX(-1)) nhưng face-api đọc pixel GỐC.
 * Quy ước dấu đã map để khớp trực giác trên màn hình soi gương:
 *   nghiêng về phía TRÁI màn hình → yaw < 0 → direction 'left'.
 * Nếu trên thiết bị thật bị ngược trái/phải, đổi dấu ở dòng `yaw = -rawYaw`.
 */
export async function estimatePose(video: HTMLVideoElement): Promise<PoseResult> {
  const faceapi = await getFaceApi();
  const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
  const res = await faceapi.detectSingleFace(video, opts).withFaceLandmarks();
  if (!res) return NO_FACE;

  const p: Array<{ x: number; y: number }> = res.landmarks.positions;
  if (!p || p.length < 68) return NO_FACE;

  const noseTip = p[30];
  const jawL = p[0];
  const jawR = p[16];
  const eyeCenterY = (p[36].y + p[39].y + p[42].y + p[45].y) / 4;
  const mouthY = (p[51].y + p[57].y) / 2;

  // Yaw: nose lệch về mép trái/phải của khuôn mặt.
  const dl = noseTip.x - jawL.x; // sang mép trái ảnh gốc
  const dr = jawR.x - noseTip.x; // sang mép phải ảnh gốc
  const rawYaw = dr + dl > 0 ? (dr - dl) / (dr + dl) : 0;
  const yaw = -rawYaw; // đổi dấu để khớp màn hình soi gương

  // Pitch: tỉ lệ (mắt→mũi) so với (mũi→miệng). Ngẩng lên → phần dưới ngắn lại → pitch>0.
  const a = noseTip.y - eyeCenterY; // mắt → mũi
  const b = mouthY - noseTip.y; // mũi → miệng
  const pitch = a + b > 0 ? (b - a) / (a + b) : 0;

  let direction: PoseDirection = 'center';
  if (Math.abs(yaw) >= YAW_T && Math.abs(yaw) >= Math.abs(pitch)) {
    direction = yaw < 0 ? 'left' : 'right';
  } else if (Math.abs(pitch) >= PITCH_T) {
    direction = pitch > 0 ? 'up' : 'down';
  }

  return { hasFace: true, direction, yaw, pitch, score: res.detection?.score ?? 1 };
}
