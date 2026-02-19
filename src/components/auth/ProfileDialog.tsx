import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    onOpenChange(false);
  };

  const phone = user?.phone || user?.email?.replace('@magic-ai.app', '').replace('wa_', '+') || "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full p-0 bg-background/95 backdrop-blur-xl border-border/30 rounded-2xl overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">{phone}</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="outline"
            className="w-full rounded-xl h-11 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
