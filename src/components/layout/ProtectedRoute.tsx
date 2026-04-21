import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

type Role = 'customer' | 'vendor' | 'admin' | 'support';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
}

/**
 * ProtectedRoute — wraps a screen and redirects if the current
 * user does not have one of the `allowedRoles`.
 *
 * - If not authenticated       → redirects to /login
 * - If wrong role               → redirects to /home  
 * - If still loading auth info → renders nothing (avoids flash)
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    // Auth is still resolving — render nothing to avoid flashing the page
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userData && !allowedRoles.includes(userData.role)) {
    // User is authenticated but doesn't have the right role
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
