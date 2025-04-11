import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export default function ResetPassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Si el usuario ya está logueado y no hay hash ni query params, redirigir a projects
  useEffect(() => {
    if (user && !window.location.hash && !window.location.search) {
      navigate("/projects");
    }
    setIsLoading(false);
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center gap-2 px-2">
        <div className="bg-blue-600 text-white p-1 rounded">
          <LayoutDashboard size={18} />
        </div>
        <h1 className="text-xl font-bold">TaskFlow</h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
