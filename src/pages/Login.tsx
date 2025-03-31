
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Login() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-xl font-medium">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <LoginForm />
    </div>
  );
}
