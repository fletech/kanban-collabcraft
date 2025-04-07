import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Puedes reemplazar esto con un componente de loading más elaborado
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
