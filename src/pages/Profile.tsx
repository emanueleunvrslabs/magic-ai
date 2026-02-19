import { useState, useEffect, useCallback } from "react";
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
  Plug,
  ExternalLink,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

interface IntegrationState {
  apiKey: string;
  loading: boolean;
  connected: boolean;
  error: string;
  showKey: boolean;
  editing: boolean;
}

const defaultIntState: IntegrationState = {
  apiKey: "",
  loading: false,
  connected: false,
  error: "",
  showKey: false,
  editing: false,
};

const Profile = () => {
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [changingNumber, setChangingNumber] = useState(false);
  const [step, setStep] = useState<"idle" | "phone" | "otp" | "success">("idle");
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fal, setFal] = useState<IntegrationState>({ ...defaultIntState });
  const [openai, setOpenai] = useState<IntegrationState>({ ...defaultIntState });

  const phone =
    user?.phone ||
    user?.email?.replace("@magic-ai.app", "").replace("wa_", "+") ||
    "Unknown";

  // Load existing keys on mount
  useEffect(() => {
    if (!user) return;
    const loadKeys = async () => {
      const { data } = await supabase
        .from("user_api_keys")
        .select("provider, api_key, is_valid")
        .eq("user_id", user.id);

      if (data) {
        data.forEach((row: any) => {
          const masked = row.api_key.slice(0, 8) + "..." + row.api_key.slice(-4);
          if (row.provider === "fal") {
            setFal((prev) => ({ ...prev, apiKey: masked, connected: row.is_valid }));
          } else if (row.provider === "openai") {
            setOpenai((prev) => ({ ...prev, apiKey: masked, connected: row.is_valid }));
          }
        });
      }
    };
    loadKeys();
  }, [user]);

  const handleConnect = useCallback(
    async (
      provider: "fal" | "openai",
      state: IntegrationState,
      setState: React.Dispatch<React.SetStateAction<IntegrationState>>
    ) => {
      if (!state.apiKey.trim() || state.apiKey.includes("...")) {
        setState((p) => ({ ...p, error: "Enter a valid API key" }));
        return;
      }

      setState((p) => ({ ...p, loading: true, error: "" }));

      try {
        // Verify the key
        const { data, error: fnError } = await supabase.functions.invoke(
          "verify-api-key",
          { body: { provider, api_key: state.apiKey } }
        );

        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);

        if (!data?.valid) {
          setState((p) => ({
            ...p,
            loading: false,
            error: "Invalid API key. Please check and try again.",
          }));
          return;
        }

        // Save to DB
        const { error: dbError } = await supabase.from("user_api_keys").upsert(
          {
            user_id: user!.id,
            provider,
            api_key: state.apiKey,
            is_valid: true,
          },
          { onConflict: "user_id,provider" }
        );

        if (dbError) throw new Error(dbError.message);

        const masked =
          state.apiKey.slice(0, 8) + "..." + state.apiKey.slice(-4);
        setState((p) => ({
          ...p,
          loading: false,
          connected: true,
          apiKey: masked,
          editing: false,
          error: "",
        }));
      } catch (err: any) {
        setState((p) => ({
          ...p,
          loading: false,
          error: err.message || "Connection failed",
        }));
      }
    },
    [user]
  );

  const handleDisconnect = useCallback(
    async (
      provider: "fal" | "openai",
      setState: React.Dispatch<React.SetStateAction<IntegrationState>>
    ) => {
      await supabase
        .from("user_api_keys")
        .delete()
        .eq("user_id", user!.id)
        .eq("provider", provider);

      setState({ ...defaultIntState });
    },
    [user]
  );

  // --- Phone change handlers (same as before) ---
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

  const renderIntegration = (
    provider: "fal" | "openai",
    label: string,
    description: string,
    url: string,
    icon: React.ReactNode,
    state: IntegrationState,
    setState: React.Dispatch<React.SetStateAction<IntegrationState>>
  ) => (
    <div className="liquid-glass-card-sm p-4 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-foreground font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {state.connected && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span className="text-[10px] font-medium text-green-500">Connected</span>
            </div>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* API Key Input */}
      {(!state.connected || state.editing) && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={state.apiKey}
                onChange={(e) => setState((p) => ({ ...p, apiKey: e.target.value, error: "" }))}
                placeholder={`Enter ${label} API key...`}
                type={state.showKey ? "text" : "password"}
                className="bg-input/50 border-border/50 rounded-xl h-9 text-sm pr-9"
              />
              <button
                type="button"
                onClick={() => setState((p) => ({ ...p, showKey: !p.showKey }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {state.showKey ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <Button
              onClick={() => handleConnect(provider, state, setState)}
              disabled={state.loading || !state.apiKey.trim()}
              size="sm"
              className="btn-premium rounded-xl h-9 px-4 text-xs"
            >
              {state.loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Connect"
              )}
            </Button>
            {state.editing && (
              <Button
                onClick={() => setState((p) => ({ ...p, editing: false, error: "" }))}
                variant="outline"
                size="sm"
                className="rounded-xl h-9 px-2 border-border/50"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          {state.error && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
        </div>
      )}

      {/* Connected state actions */}
      {state.connected && !state.editing && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">{state.apiKey}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setState((p) => ({ ...p, editing: true, apiKey: "" }))}
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              Change
            </button>
            <button
              onClick={() => handleDisconnect(provider, setState)}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );

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
                    <p className="text-sm text-muted-foreground">Manage your account</p>
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
                        <p className="text-xs text-muted-foreground font-medium">WhatsApp Number</p>
                        <p className="text-foreground font-semibold">{phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs font-medium text-green-500">Verified</span>
                    </div>
                  </div>
                </div>

                {/* Change Number Flow */}
                <AnimatePresence mode="wait">
                  {!changingNumber && step === "idle" && (
                    <motion.div key="change-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <button
                        onClick={handleStartChange}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mx-auto"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Change Number
                      </button>
                    </motion.div>
                  )}

                  {step === "phone" && (
                    <motion.div key="phone-step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="liquid-glass-card-sm p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          <Label className="text-foreground/70 text-xs font-medium">New WhatsApp Number</Label>
                        </div>
                        <Input
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="+39 123 456 7890"
                          className="bg-input/50 border-border/50 rounded-xl h-11 text-base"
                          type="tel"
                          onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        />
                        <p className="text-[11px] text-muted-foreground">Include country code (e.g. +39 for Italy)</p>
                      </div>
                      {error && <p className="text-xs text-destructive text-center">{error}</p>}
                      <div className="flex gap-2">
                        <Button onClick={handleCancelChange} variant="outline" className="flex-1 rounded-xl h-11 border-border/50">Cancel</Button>
                        <Button onClick={handleSendOtp} disabled={loading || !newPhone.trim()} className="flex-1 btn-premium rounded-xl h-11">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                          Send Code
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === "otp" && (
                    <motion.div key="otp-step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="liquid-glass-card-sm p-4 rounded-xl space-y-3">
                        <p className="text-sm text-muted-foreground text-center">Enter the 6-digit code sent to your WhatsApp</p>
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
                      {error && <p className="text-xs text-destructive text-center">{error}</p>}
                      <div className="flex gap-2">
                        <Button onClick={() => { setStep("phone"); setOtp(""); setError(""); }} variant="outline" className="flex-1 rounded-xl h-11 border-border/50">Back</Button>
                        <Button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="flex-1 btn-premium rounded-xl h-11">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                          Verify
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === "success" && (
                    <motion.div key="success-step" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-2">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                      </motion.div>
                      <p className="text-sm font-medium text-foreground">Number updated successfully!</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Integrations */}
                <div className="h-px bg-border/30" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Plug className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Integrations</h2>
                  </div>

                  {renderIntegration(
                    "fal",
                    "fal.ai",
                    "Image & Video generation",
                    "https://fal.ai/dashboard/keys",
                    <span className="text-lg font-bold text-primary">f</span>,
                    fal,
                    setFal
                  )}

                  {renderIntegration(
                    "openai",
                    "OpenAI",
                    "AI models & assistants",
                    "https://platform.openai.com/api-keys",
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="currentColor">
                      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
                    </svg>,
                    openai,
                    setOpenai
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-border/30" />

                {/* Logout */}
                <Button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  variant="outline"
                  className="w-full rounded-xl h-11 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:border-destructive/50 transition-all"
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
