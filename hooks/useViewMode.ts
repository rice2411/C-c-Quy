import { useEffect, useState } from 'react';

/** Lưu chế độ xem (card/table/grid…) theo key vào localStorage, dùng chung cho mọi màn list. */
export const useViewMode = <T extends string>(key: string, defaultMode: T): [T, (v: T) => void] => {
  const [mode, setMode] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultMode;
    return (localStorage.getItem(key) as T) || defaultMode;
  });
  useEffect(() => {
    localStorage.setItem(key, mode);
  }, [key, mode]);
  return [mode, setMode];
};

export default useViewMode;
