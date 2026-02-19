import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
        <LoginDialog open={true} onOpenChange={(open) => { if (!open) navigate('/'); }} />
      </>
    );
  }

  return <>{children}</>;
};
