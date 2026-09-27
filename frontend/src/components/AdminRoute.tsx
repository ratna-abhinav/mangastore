import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingBlock } from './ui/Skeleton';

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingBlock label="Checking your session…" />;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== 'ROLE_ADMIN') return <Navigate to="/home" replace />;
  return <Outlet />;
}
