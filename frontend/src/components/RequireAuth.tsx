import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingBlock } from './ui/Skeleton';

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingBlock label="Checking your session…" />;
  if (!user) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}
