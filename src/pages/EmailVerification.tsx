import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EmailVerificationForm } from "@/components/auth/EmailVerificationForm";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export default function EmailVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/projects");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center gap-2 px-2">
        <div className="bg-blue-600 text-white p-1 rounded">
          <LayoutDashboard size={18} />
        </div>
        <h1 className="text-xl font-bold">TaskFlow</h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <EmailVerificationForm />
      </div>
    </div>
  );
}
