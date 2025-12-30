import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  adminOnly = false, 
  requiredRole,
  requiredEntityType, // Add this new prop
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
  
  // Role-based access check - check both role and entityType
  if (requiredRole || requiredEntityType) {
    const userRole = user?.role?.toLowerCase();
    const userEntityType = user?.entityType?.toLowerCase();
    const requiredRoleLower = requiredRole?.toLowerCase();
    const requiredEntityTypeLower = requiredEntityType?.toLowerCase();
    
    // Define role mappings
    const roleMappings = {
      broker: ["broker", "superagent", "agent"],
      customer: ["customer", "user", "subagent", "client"],
      company: ["company", "insurer"]
    };
    
    let hasAccess = false;
    
    // Check entityType first (most reliable)
    if (requiredEntityTypeLower && userEntityType === requiredEntityTypeLower) {
      hasAccess = true;
    }
    // Check role
    else if (requiredRoleLower) {
      // Direct match
      if (userRole === requiredRoleLower) {
        hasAccess = true;
      }
      // Check role variations
      else if (roleMappings[requiredRoleLower]?.includes(userRole)) {
        hasAccess = true;
      }
      // Check if entityType matches required role
      else if (userEntityType === requiredRoleLower) {
        hasAccess = true;
      }
    }
    
  
    
    if (!hasAccess) {
      if (fallbackToDashboard) {
        // Redirect to appropriate dashboard based on user's actual role or entityType
        const dashboardPaths = {
          broker: '/brokers/dashboard',
          customer: '/client/dashboard',
          company: '/company/dashboard',
          admin: '/admin/dashboard',
          user: '/client/dashboard', // Default for users
          superagent: '/brokers/dashboard',
          subagent: '/client/dashboard'
        };
        
        const dashboardRole = userEntityType || userRole;
        const dashboardPath = dashboardPaths[dashboardRole] || '/';
        
       
        return <Navigate to={dashboardPath} replace />;
      } else {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }
  

  return children;
};

export default ProtectedRoute;