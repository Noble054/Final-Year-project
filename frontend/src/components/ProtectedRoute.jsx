import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'Admin') return <Navigate to="/admin" />;
    if (user.role === 'Station Operator') return <Navigate to="/operator" />;
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
