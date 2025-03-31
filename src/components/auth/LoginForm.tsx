
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { FcGoogle } from "react-icons/fc";

export function LoginForm() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col space-y-6 w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome to TaskFlow</h1>
        <p className="text-muted-foreground">Sign in to continue to your projects</p>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2 h-12" 
        onClick={signInWithGoogle}
      >
        <FcGoogle className="h-5 w-5" />
        <span>Continue with Google</span>
      </Button>
    </div>
  );
}
