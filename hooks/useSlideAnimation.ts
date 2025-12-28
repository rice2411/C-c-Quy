import { useEffect, useState } from 'react';

interface UseSlideAnimationReturn {
  show: boolean;
  isClosing: boolean;
}

export const useSlideAnimation = (isOpen: boolean): UseSlideAnimationReturn => {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!show) {
        setShow(true);
        setIsClosing(false);
        document.body.style.overflow = 'hidden';
      } else {
        setIsClosing(false);
      }
    } else {
      if (show && !isClosing) {
        setIsClosing(true);
        const timer = setTimeout(() => {
          setShow(false);
          setIsClosing(false);
          document.body.style.overflow = '';
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen]);

  return { show, isClosing };
};

