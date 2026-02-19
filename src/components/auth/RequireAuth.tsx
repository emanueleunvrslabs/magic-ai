import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Loader2 } from "lucide-react";

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="fixed inset-0 mesh-gradient" />
        <Loader2 className="relative z-10 w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {children}
        <LoginDialog open={true} onOpenChange={() => {}} />
      </>
    );
  }

  return <>{children}</>;
};
