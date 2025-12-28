import { useEffect, useState } from 'react';

interface UseFadeAnimationReturn {
  show: boolean;
  isAnimating: boolean;
}

export const useFadeAnimation = (isOpen: boolean, isFadeAnimation: boolean = true): UseFadeAnimationReturn => {
  const [show, setShow] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = 'hidden';
      if (isFadeAnimation) {
        setIsAnimating(false);
        const timer = setTimeout(() => setIsAnimating(true), 10);
        return () => clearTimeout(timer);
      } else {
        setIsAnimating(true);
      }
    } else {
      if (isFadeAnimation) {
        setIsAnimating(false);
      }
      const timer = setTimeout(() => {
        setShow(false);
        document.body.style.overflow = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isFadeAnimation]);

  return { show, isAnimating };
};

