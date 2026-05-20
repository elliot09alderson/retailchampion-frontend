import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Check if user is logged in
  if (!token || !userStr) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check if user is admin
  try {
    const user = JSON.parse(userStr);
    if (user.role === 'superadmin') {
      // Super Admins have their own dashboard — keep them out of the regular admin panel
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    if (user.role !== 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
  } catch (error) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
