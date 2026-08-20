/**
 * Chụp 1 node DOM (thẻ chia sẻ đơn) thành PNG blob bằng html-to-image.
 * Inline mọi <img> thành dataURL TRƯỚC khi chụp để né "tainted canvas" (CORS).
 * (Tách từ OrderDetail.handleShareOrder để dùng lại cho hàng đợi gửi Zalo.)
 */
const TRANSPARENT =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export async function captureShareCard(node: HTMLElement): Promise<Blob> {
  if (document.fonts?.ready) await document.fonts.ready;

  const imgs = Array.from(node.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith('data:')) return;
      try {
        const res = await fetch(src, { mode: 'cors', cache: 'reload' });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        img.src = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = () => reject(new Error('read fail'));
          fr.readAsDataURL(blob);
        });
      } catch {
        img.removeAttribute('crossorigin');
        img.src = TRANSPARENT;
      }
      await new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) resolve();
        else {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }
      });
    }),
  );

  const opts = { pixelRatio: 2, backgroundColor: '#ffffff' } as const;
  const { toBlob } = await import('html-to-image');
  await toBlob(node, opts); // warm-up (html-to-image hay miss ảnh lần đầu)
  const blob = await toBlob(node, opts);
  if (!blob) throw new Error('no blob');
  return blob;
}
