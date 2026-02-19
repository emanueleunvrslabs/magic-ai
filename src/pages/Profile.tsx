import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  LogOut,
  CheckCircle2,
  Phone,
  Loader2,
  ArrowRight,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [changingNumber, setChangingNumber] = useState(false);
  const [step, setStep] = useState<"idle" | "phone" | "otp" | "success">("idle");
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const phone =
    user?.phone ||
    user?.email?.replace("@magic-ai.app", "").replace("wa_", "+") ||
    "Unknown";

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
  };

  const handleStartChange = () => {
    setChangingNumber(true);
    setStep("phone");
    setNewPhone("");
    setOtp("");
    setError("");
  };

  const handleCancelChange = () => {
    setChangingNumber(false);
    setStep("idle");
    setNewPhone("");
    setOtp("");
    setError("");
  };

  const handleSendOtp = async () => {
    if (!newPhone.trim() || newPhone.length < 8) {
      setError("Enter a valid WhatsApp number with country code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cleanPhone = newPhone.startsWith("+") ? newPhone : `+${newPhone}`;
      const { data, error: fnError } = await supabase.functions.invoke("send-otp", {
        body: { phone: cleanPhone },
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
      const cleanPhone = newPhone.startsWith("+") ? newPhone : `+${newPhone}`;
      const { data, error: fnError } = await supabase.functions.invoke("verify-otp", {
        body: { phone: cleanPhone, otp },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.token_hash && data?.email) {
        const { error: authError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });
        if (authError) throw new Error(authError.message);
        setStep("success");
        setTimeout(() => {
          setChangingNumber(false);
          setStep("idle");
          setNewPhone("");
          setOtp("");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <div className="fixed inset-0 mesh-gradient" />
      <div className="fixed inset-0 aurora-bg pointer-events-none" />
      <div className="grain-overlay" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 pt-28 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Profile Card */}
            <div className="liquid-glass-card p-8 rounded-2xl space-y-6">
              {/* Avatar & Info */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your account
                  </p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="liquid-glass-card-sm p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">
                        WhatsApp Number
                      </p>
                      <p className="text-foreground font-semibold">{phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs font-medium text-green-500">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Change Number Flow */}
              <AnimatePresence mode="wait">
                {!changingNumber && step === "idle" && (
                  <motion.div
                    key="change-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button
                      onClick={handleStartChange}
                      variant="outline"
                      className="w-full rounded-xl h-11 border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Change Number
                    </Button>
                  </motion.div>
                )}

                {step === "phone" && (
                  <motion.div
                    key="phone-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="liquid-glass-card-sm p-4 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        <Label className="text-foreground/70 text-xs font-medium">
                          New WhatsApp Number
                        </Label>
                      </div>
                      <Input
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+39 123 456 7890"
                        className="bg-input/50 border-border/50 rounded-xl h-11 text-base"
                        type="tel"
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Include country code (e.g. +39 for Italy)
                      </p>
                    </div>

                    {error && (
                      <p className="text-xs text-destructive text-center">{error}</p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancelChange}
                        variant="outline"
                        className="flex-1 rounded-xl h-11 border-border/50"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendOtp}
                        disabled={loading || !newPhone.trim()}
                        className="flex-1 btn-premium rounded-xl h-11"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <ArrowRight className="w-4 h-4 mr-2" />
                        )}
                        Send Code
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === "otp" && (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="liquid-glass-card-sm p-4 rounded-xl space-y-3">
                      <p className="text-sm text-muted-foreground text-center">
                        Enter the 6-digit code sent to your WhatsApp
                      </p>
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
                    </div>

                    {error && (
                      <p className="text-xs text-destructive text-center">{error}</p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setStep("phone");
                          setOtp("");
                          setError("");
                        }}
                        variant="outline"
                        className="flex-1 rounded-xl h-11 border-border/50"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.length !== 6}
                        className="flex-1 btn-premium rounded-xl h-11"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Verify
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success-step"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-2"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    </motion.div>
                    <p className="text-sm font-medium text-foreground">
                      Number updated successfully!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="h-px bg-border/30" />

              {/* Logout */}
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
          </motion.div>
        </div>
      </main>

        <Footer />
      </div>
    </div>
  );
};

export default Profile;
