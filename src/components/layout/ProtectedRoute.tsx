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
    // Return a skeleton loader matching the app's design
    return (
      <div className="min-h-screen bg-background flex flex-col p-6 animate-pulse">
        <div className="w-full h-48 bg-muted rounded-[2.5rem] mb-6 mt-12" />
        <div className="flex gap-4 mb-6">
          <div className="flex-1 h-32 bg-muted rounded-2xl" />
          <div className="flex-1 h-32 bg-muted rounded-2xl" />
        </div>
        <div className="w-3/4 h-8 bg-muted rounded-xl mb-4" />
        <div className="w-full h-32 bg-muted rounded-2xl mb-4" />
        <div className="w-full h-32 bg-muted rounded-2xl mb-4" />
      </div>
    );
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
