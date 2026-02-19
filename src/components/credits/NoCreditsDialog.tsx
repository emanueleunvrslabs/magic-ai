import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Plug, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const CREDIT_PACKAGES = [
  { value: "10", label: "€10", bonus: "" },
  { value: "20", label: "€20", bonus: "" },
  { value: "50", label: "€50", bonus: "Popolare", highlight: true },
  { value: "100", label: "€100", bonus: "" },
  { value: "250", label: "€250", bonus: "" },
  { value: "500", label: "€500", bonus: "" },
];

interface NoCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NoCreditsDialog = ({ open, onOpenChange }: NoCreditsDialogProps) => {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePurchase = async (pkg: string) => {
    setPurchasing(pkg);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { package: pkg },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Errore durante il checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const handleGoToProfile = () => {
    onOpenChange(false);
    navigate("/profile");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full p-0 bg-background/95 backdrop-blur-xl border-border/30 rounded-2xl overflow-hidden">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Credito insufficiente</h2>
            <p className="text-sm text-muted-foreground">
              Acquista crediti per iniziare a generare
            </p>
          </div>

          {/* Packages */}
          <div className="grid grid-cols-3 gap-2">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.value}
                onClick={() => handlePurchase(pkg.value)}
                disabled={purchasing !== null}
                className={`relative liquid-glass-card-sm p-3 pt-5 rounded-xl text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 overflow-visible ${
                  pkg.highlight ? "ring-1 ring-primary/30 bg-primary/5" : ""
                }`}
              >
                {pkg.bonus && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap z-10">
                    {pkg.bonus}
                  </span>
                )}
                <p className="text-lg font-bold text-foreground">{pkg.label}</p>
                {purchasing === pkg.value && (
                  <Loader2 className="w-3 h-3 animate-spin mx-auto mt-1 text-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Divider with alternative */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background/95 px-3 text-xs text-muted-foreground">oppure</span>
            </div>
          </div>

          {/* API alternative */}
          <button
            onClick={handleGoToProfile}
            className="w-full liquid-glass-card-sm p-4 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Plug className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Usa le tue API</p>
                <p className="text-xs text-muted-foreground">
                  Inserisci le tue chiavi API su Profilo → Integrazioni per generare senza limiti
                </p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
