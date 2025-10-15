import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  adminOnly = false, 
  requiredRole,
  fallbackToDashboard = true 
}) => {
  const { user, isAuthenticated } = useAuth();
  
  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin-only access check
  if (adminOnly && !user?.isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Role-based access check
  if (requiredRole && user?.role !== requiredRole) {
    if (fallbackToDashboard) {
      // Redirect to appropriate dashboard based on user's actual role
      const dashboardPaths = {
        admin: '/admin/dashboard',
        broker: '/brokers/dashboard',
        insuredclient: '/client/dashboard',
        company: '/companies/dashboard',
        insurance: '/companies/dashboard'
      };
      
      const dashboardPath = dashboardPaths[user?.role] || '/dashboard';
      return <Navigate to={dashboardPath} replace />;
    } else {
      // Redirect to unauthorized page
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Access granted
  return children;
};

export default ProtectedRoute;