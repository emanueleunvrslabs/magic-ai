import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CREDIT_PACKAGES = [
  { value: "10", label: "€10", bonus: "" },
  { value: "20", label: "€20", bonus: "" },
  { value: "50", label: "€50", bonus: "Popolare", highlight: true },
  { value: "100", label: "€100", bonus: "" },
  { value: "250", label: "€250", bonus: "" },
  { value: "500", label: "€500", bonus: "" },
];

interface CreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const CreditsDialog = ({ open, onOpenChange, userId }: CreditsDialogProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [hasOwnKey, setHasOwnKey] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    const load = async () => {
      const [creditsRes, keysRes] = await Promise.all([
        supabase.from("user_credits").select("balance").eq("user_id", userId).single(),
        supabase.from("user_api_keys").select("provider, is_valid").eq("user_id", userId).eq("provider", "fal").eq("is_valid", true),
      ]);
      setBalance(creditsRes.data?.balance ?? 0);
      setHasOwnKey((keysRes.data?.length ?? 0) > 0);
    };
    load();
  }, [open, userId]);

  const handlePurchase = async (pkg: string) => {
    setPurchasing(pkg);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { package: pkg },
      });
      console.log("Checkout response:", data, error);
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        // Use window.location for better compatibility (popup blockers can block window.open)
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Errore durante il checkout");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="liquid-glass-card border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Zap className="w-5 h-5 text-primary" />
            Crediti
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Balance */}
          <div className="liquid-glass-card-sm p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Saldo disponibile</p>
                  <p className="text-2xl font-bold text-foreground">
                    {hasOwnKey ? "∞" : `€${balance !== null ? balance.toFixed(2) : "—"}`}
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-muted-foreground space-y-0.5">
                <p>€0.50 / immagine</p>
                <p>€10.00 / video</p>
              </div>
            </div>
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

          <p className="text-[10px] text-muted-foreground text-center">
            Il saldo verrà aggiornato automaticamente dopo il pagamento
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
