import { useEffect, useState } from 'react';

/**
 * Hook để detect offline và redirect đến offline page
 * @returns {boolean} isOffline - Trạng thái offline hiện tại
 */
export const useOfflineDetector = (): boolean => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial online status
    const checkOnlineStatus = async () => {
      if (!navigator.onLine) {
        setIsOffline(true);
        window.location.href = '/offline.html';
        return;
      }
    };

    checkOnlineStatus();

    // Handle online event
    const handleOnline = () => {
      setIsOffline(false);
      // If currently on offline page, reload to main page
      if (window.location.pathname.includes('offline.html')) {
        window.location.replace('/');
      }
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOffline(true);
      // Immediately redirect to offline page
      window.location.href = '/offline.html';
    };

    // Add event listeners — `online`/`offline` là event-driven, đủ để phát hiện.
    // (Bỏ setInterval 3s cũ: navigator.onLine đã được các event này cover, poll chỉ tốn wake-up thừa.)
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependency array - only run once on mount

  return isOffline;
};

