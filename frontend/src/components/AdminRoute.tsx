import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p className="py-20 text-center text-slate-500">Checking your session…</p>;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== 'ROLE_ADMIN') return <Navigate to="/home" replace />;
  return <Outlet />;
}
