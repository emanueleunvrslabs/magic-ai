import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.length < 8) {
      setError("Enter a valid WhatsApp number with country code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-otp", {
        body: { phone: phone.startsWith("+") ? phone : `+${phone}` },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const cleanPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const { data, error: fnError } = await supabase.functions.invoke("verify-otp", {
        body: { phone: cleanPhone, otp },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.token_hash && data?.email) {
        // Use the token to sign in
        const { error: authError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (authError) throw new Error(authError.message);

        setStep("success");
        setTimeout(() => {
          onOpenChange(false);
          setStep("phone");
          setPhone("");
          setOtp("");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setOtp("");
      setError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm w-full p-0 bg-background/95 backdrop-blur-xl border-border/30 rounded-2xl overflow-hidden sm:top-[50%] top-[10%] translate-y-0 sm:translate-y-[-50%]">
        <div className="p-6 overflow-y-auto max-h-[80dvh]">
          <AnimatePresence mode="wait">
            {step === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Login with WhatsApp</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your WhatsApp number to receive a verification code
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground/70 text-xs font-medium">WhatsApp Number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+39 123 456 7890"
                    className="bg-input/50 border-border/50 rounded-xl h-11 text-base"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Include country code (e.g. +39 for Italy)
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-destructive text-center">{error}</p>
                )}

                <Button
                  onClick={handleSendOtp}
                  disabled={loading || !phone.trim()}
                  className="w-full btn-premium rounded-xl h-11"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Send Code
                </Button>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Enter Code</h2>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to your WhatsApp
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <p className="text-xs text-destructive text-center">{error}</p>
                )}

                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full btn-premium rounded-xl h-11"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Verify
                </Button>

                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  Change number
                </button>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground">Welcome!</h2>
                <p className="text-sm text-muted-foreground">You're now logged in</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
