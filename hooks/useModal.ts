import { useState, useCallback } from 'react';

export interface UseModalReturn<T = any> {
  isOpen: boolean;
  open: (data?: T) => void;
  close: () => void;
  data: T | undefined;
}

export const useModal = <T = any>(): UseModalReturn<T> => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const open = useCallback((modalData?: T) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setData(undefined), 300); // Clear data after animation
  }, []);

  return {
    isOpen,
    open,
    close,
    data
  };
};