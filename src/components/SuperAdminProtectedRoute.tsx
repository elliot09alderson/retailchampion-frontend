import { Navigate } from 'react-router-dom';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function SuperAdminProtectedRoute({ children }: SuperAdminProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/superadmin/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role !== 'superadmin') {
      return <Navigate to="/superadmin/login" replace />;
    }
  } catch {
    return <Navigate to="/superadmin/login" replace />;
  }

  return <>{children}</>;
}
