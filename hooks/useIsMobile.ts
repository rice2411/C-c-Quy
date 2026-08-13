import { useEffect, useState } from 'react';

/** true khi màn hình <640px (Tailwind sm). Theo dõi thay đổi kích thước realtime. */
export const useIsMobile = (query = '(max-width: 639px)'): boolean => {
  const [match, setMatch] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return match;
};

export default useIsMobile;
