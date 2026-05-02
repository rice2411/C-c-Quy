/** Main Zalo group for admins / broadcast (from env, injected by Vite). */
export function getZaloMainGroupId(): string {
  // Do not gate on `process` / `process.env` truthiness: in the browser bundle those
  // are often undefined, which short-circuits before Vite can substitute this identifier.
  const raw = String(process.env.ZALO_MAIN_GROUP_ID ?? '').trim();
  if (!raw) {
    throw new Error('ZALO_MAIN_GROUP_ID is not configured');
  }
  return raw;
}

/** Fallback for non-order Zalo sends when env is missing (legacy). */
export function getZaloMainGroupIdOrFallback(): string {
  try {
    return getZaloMainGroupId();
  } catch {
    return '165291943369399492';
  }
}
