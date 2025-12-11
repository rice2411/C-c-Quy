import React, { useEffect, useState } from 'react';

/**
 * Component để detect offline và redirect đến offline page
 */
const OfflineDetector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Kiểm tra trạng thái ban đầu
    const checkOnlineStatus = async () => {
      if (!navigator.onLine) {
        setIsOffline(true);
        window.location.href = '/offline.html';
        return;
      }

      // Kiểm tra kết nối thực sự bằng cách fetch một file nhỏ
      try {
        const response = await fetch('/manifest.json', {
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors'
        });
        setIsOffline(false);
      } catch (error) {
        setIsOffline(true);
        window.location.href = '/offline.html';
      }
    };

    checkOnlineStatus();

    // Listen cho online event
    const handleOnline = () => {
      setIsOffline(false);
      // Nếu đang ở offline page, reload về trang chính
      if (window.location.pathname.includes('offline.html')) {
        window.location.href = '/';
      }
    };

    // Listen cho offline event
    const handleOffline = () => {
      setIsOffline(true);
      // Lập tức redirect đến offline page
      window.location.href = '/offline.html';
    };

    // Thêm event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check để đảm bảo phát hiện mất mạng ngay cả khi event không fire
    const checkInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          await fetch('/manifest.json', {
            method: 'HEAD',
            cache: 'no-cache',
            mode: 'no-cors'
          });
          if (isOffline) {
            setIsOffline(false);
          }
        } catch (error) {
          if (!isOffline) {
            setIsOffline(true);
            window.location.href = '/offline.html';
          }
        }
      } else {
        if (!isOffline) {
          setIsOffline(true);
          window.location.href = '/offline.html';
        }
      }
    }, 3000); // Check mỗi 3 giây

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, [isOffline]);

  // Nếu offline, không render children
  if (isOffline) {
    return null;
  }

  return <>{children}</>;
};

export default OfflineDetector;

