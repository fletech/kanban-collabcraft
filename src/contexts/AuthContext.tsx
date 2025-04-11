import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  verifyEmail: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up session change listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/projects`,
        },
      });

      if (error) {
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        navigate("/projects");
        toast({
          title: "Welcome Back!",
          description: "You have successfully signed in to your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to sign in with email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            needs_password_change: true,
          },
        },
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to create account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Signed Out Successfully",
        description: "You have been securely logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=recovery`,
      });

      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Reset Email Sent",
          description:
            "Please check your email for password reset instructions.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to process password reset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (newPassword: string) => {
    try {
      const {
        data: { user: updatedUser },
        error: updateError,
      } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast({
          title: "Password Reset Failed",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Sign out the current session
      await supabase.auth.signOut();

      // Try to sign in with the new password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: updatedUser?.email || "",
        password: newPassword,
      });

      if (signInError) {
        toast({
          title: "Error",
          description:
            "Password updated. Please try signing in with your new password.",
          variant: "destructive",
        });
        navigate("/signin");
      } else {
        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
        });
        navigate("/projects");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to process your request. Please try again.",
        variant: "destructive",
      });
      navigate("/signin");
    }
  };

  const verifyEmail = async (password: string) => {
    try {
      const {
        data: { user: updatedUser },
        error: updateError,
      } = await supabase.auth.updateUser({
        password: password,
        data: {
          needs_password_change: false,
        },
      });

      if (updateError) {
        toast({
          title: "Verification Failed",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Sign out and sign in with the new password
      await supabase.auth.signOut();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: updatedUser?.email || "",
        password: password,
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Please try signing in with your password.",
          variant: "destructive",
        });
        navigate("/signin");
      } else {
        toast({
          title: "Success",
          description: "Your email has been verified successfully.",
        });
        navigate("/projects");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to verify your email. Please try again.",
        variant: "destructive",
      });
      navigate("/signin");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        forgotPassword,
        resetPassword,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
