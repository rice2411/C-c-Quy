import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook để bảo vệ route - yêu cầu đăng nhập
 * Nếu user chưa đăng nhập, sẽ tự động redirect về trang login
 */
export const useRequireAuth = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  return { currentUser, loading, isAuthenticated: !!currentUser };
};
