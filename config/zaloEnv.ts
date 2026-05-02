/** Main Zalo group for admins / broadcast (from env, injected by Vite). */
export function getZaloMainGroupId(): string {
  const raw =
    typeof process !== 'undefined' && process.env && process.env.ZALO_MAIN_GROUP_ID
      ? String(process.env.ZALO_MAIN_GROUP_ID)
      : '';
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('ZALO_MAIN_GROUP_ID is not configured');
  }
  return trimmed;
}

/** Fallback for non-order Zalo sends when env is missing (legacy). */
export function getZaloMainGroupIdOrFallback(): string {
  try {
    return getZaloMainGroupId();
  } catch {
    return '165291943369399492';
  }
}
