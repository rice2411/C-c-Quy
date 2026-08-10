/**
 * Âm "ting ting" báo có đơn vừa thanh toán — synth bằng Web Audio API
 * (khỏi cần file asset, chạy offline). Trình duyệt chặn phát âm trước khi
 * người dùng tương tác → cần mở khoá AudioContext sau cử chỉ đầu tiên.
 */
let ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
};

/** Mở khoá AudioContext sau cử chỉ đầu tiên. Gọi 1 lần lúc mount; trả hàm cleanup. */
export const primeNotificationSound = (): (() => void) => {
  const unlock = () => {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume().catch(() => undefined);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  return () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
};

/** Phát 2 nốt "ting ting". Bị chặn (chưa tương tác) thì lặng lẽ bỏ qua. */
export const playNotificationSound = (): void => {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => undefined);

  const beep = (start: number, freq: number) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.27);
  };

  const now = c.currentTime;
  beep(now, 988); // ting (B5)
  beep(now + 0.16, 1319); // ting cao (E6)
};

/* ===================== Loa thanh toán (đọc số tiền bằng giọng nói) ===================== */

const SPEAKER_STORAGE_KEY = 'cucquy.paymentSpeaker.enabled';

/** Người dùng có bật loa đọc số tiền không (mặc định BẬT). Đọc từ localStorage. */
export const isPaymentSpeakerEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SPEAKER_STORAGE_KEY) !== 'off';
};

/** Bật/tắt loa đọc số tiền, lưu vào localStorage. */
export const setPaymentSpeakerEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SPEAKER_STORAGE_KEY, enabled ? 'on' : 'off');
};

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

/** Đọc 1 nhóm 3 chữ số (0–999) ra chữ tiếng Việt. `full` = có đọc "trăm/lẻ" ở nhóm không phải nhóm đầu. */
const readThreeDigits = (n: number, full: boolean): string => {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const units = n % 10;
  let out = '';

  if (hundreds > 0) {
    out += `${DIGITS[hundreds]} trăm`;
  } else if (full && (tens > 0 || units > 0)) {
    out += 'không trăm';
  }

  if (tens > 1) {
    out += ` ${DIGITS[tens]} mươi`;
    if (units === 1) out += ' mốt';
    else if (units === 5) out += ' lăm';
    else if (units > 0) out += ` ${DIGITS[units]}`;
  } else if (tens === 1) {
    out += ' mười';
    if (units === 5) out += ' lăm';
    else if (units > 0) out += ` ${DIGITS[units]}`;
  } else if (units > 0) {
    if (hundreds > 0 || full) out += ' lẻ';
    out += ` ${DIGITS[units]}`;
  }

  return out.trim();
};

/** Đổi số nguyên (VND) ra chữ tiếng Việt, vd 1250000 → "một triệu hai trăm năm mươi nghìn". */
export const numberToVietnameseWords = (value: number): string => {
  let num = Math.floor(Math.abs(value || 0));
  if (num === 0) return 'không';

  const groups: number[] = [];
  while (num > 0) {
    groups.unshift(num % 1000);
    num = Math.floor(num / 1000);
  }

  const scale = ['', ' nghìn', ' triệu', ' tỷ'];
  const total = groups.length;
  const parts: string[] = [];
  for (let i = 0; i < total; i += 1) {
    if (groups[i] === 0) continue;
    const unitIndex = total - 1 - i;
    parts.push(readThreeDigits(groups[i], i !== 0) + (scale[unitIndex] || ''));
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
};

/**
 * Chọn giọng đọc: ưu tiên tiếng Việt, không có thì lấy giọng mặc định (bất kỳ)
 * để vẫn phát được thành tiếng thay vì im lặng. KHÔNG cache theo biến module vì
 * danh sách voices có thể đổi giữa các lần gọi.
 */
const pickVoice = (synth: SpeechSynthesis): SpeechSynthesisVoice | null => {
  const voices = synth.getVoices();
  if (voices.length === 0) return null;
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith('vi')) ||
    voices.find((v) => v.default) ||
    voices[0]
  );
};

/** Đợi danh sách voices sẵn sàng (nạp bất đồng bộ ở nhiều trình duyệt). */
const whenVoicesReady = (synth: SpeechSynthesis, cb: () => void): void => {
  if (synth.getVoices().length > 0) {
    cb();
    return;
  }
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    cb();
  };
  synth.addEventListener('voiceschanged', fire, { once: true });
  // Fallback: một số trình duyệt không bắn 'voiceschanged' → vẫn thử sau 400ms.
  window.setTimeout(fire, 400);
};

/**
 * Đọc "Đã nhận <số tiền> đồng" bằng giọng nói (Web Speech API) — như loa thanh toán.
 * Ưu tiên giọng tiếng Việt; máy không có giọng vi thì đọc bằng giọng mặc định
 * (nghe hơi ngang nhưng vẫn ra tiếng). Không hỗ trợ thì lặng lẽ bỏ qua.
 */
export const speakPaymentAmount = (amount: number): void => {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;

  const sentence = `Đã nhận ${numberToVietnameseWords(amount)} đồng`;

  whenVoicesReady(synth, () => {
    const utter = new SpeechSynthesisUtterance(sentence);
    utter.lang = 'vi-VN';
    const voice = pickVoice(synth);
    if (voice) utter.voice = voice;
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;

    // Chỉ huỷ khi đang đọc dở (tránh bug Chrome: cancel() sát speak() nuốt câu).
    if (synth.speaking || synth.pending) synth.cancel();
    // Bug Chrome: engine hay kẹt ở trạng thái paused → resume trước khi đọc.
    try {
      synth.resume();
    } catch {
      /* noop */
    }
    synth.speak(utter);
  });
};

export interface SpeakerDiagnostics {
  /** Trình duyệt có API speechSynthesis không. */
  supported: boolean;
  /** Số giọng đọc hiện có. */
  voiceCount: number;
  /** Có giọng tiếng Việt không. */
  hasVietnamese: boolean;
  /** Danh sách lang của các giọng (rút gọn) — để debug. */
  langs: string;
}

/** Soi trạng thái TTS để hiện thông báo giúp chẩn đoán khi loa không kêu. */
export const getSpeakerDiagnostics = (): SpeakerDiagnostics => {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    return { supported: false, voiceCount: 0, hasVietnamese: false, langs: '' };
  }
  const voices = window.speechSynthesis.getVoices();
  return {
    supported: true,
    voiceCount: voices.length,
    hasVietnamese: voices.some((v) => v.lang?.toLowerCase().startsWith('vi')),
    langs: Array.from(new Set(voices.map((v) => v.lang))).slice(0, 10).join(', '),
  };
};
