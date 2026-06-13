import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function CustomerGate() {
  const { session, profileComplete, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/welcome" replace />;
  if (!profileComplete) return <Navigate to="/complete-profile" replace />;

  return <Outlet />;
}
