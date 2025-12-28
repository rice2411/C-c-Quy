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

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check to ensure detection even if events don't fire
    const checkInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          setIsOffline((prev) => {
            if (prev) {
              return false;
            }
            return prev;
          });
        } catch (error) {
          setIsOffline((prev) => {
            if (!prev) {
              window.location.href = '/offline.html';
              return true;
            }
            return prev;
          });
        }
      } else {
        setIsOffline((prev) => {
          if (!prev) {
            window.location.href = '/offline.html';
            return true;
          }
          return prev;
        });
      }
    }, 3000); // Check every 3 seconds

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, []); // Empty dependency array - only run once on mount

  return isOffline;
};

