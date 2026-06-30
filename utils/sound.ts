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
