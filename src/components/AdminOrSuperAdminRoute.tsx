import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

export default function AdminOrSuperAdminRoute({ children }: Props) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'admin' || user.role === 'superadmin') {
      return <>{children}</>;
    }
  } catch {}

  return <Navigate to="/admin/login" replace />;
}
