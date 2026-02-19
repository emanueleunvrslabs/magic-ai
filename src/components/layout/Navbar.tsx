import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { CreditsDialog } from "@/components/credits/CreditsDialog";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Image", href: "/image" },
  { label: "Video", href: "/video" },
  { label: "Profile", href: "/profile", authOnly: true },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [hasOwnKey, setHasOwnKey] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activeLink = location.pathname;
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load balance
  useEffect(() => {
    if (!user) { setBalance(null); return; }
    const load = async () => {
      const [creditsRes, keysRes] = await Promise.all([
        supabase.from("user_credits").select("balance").eq("user_id", user.id).single(),
        supabase.from("user_api_keys").select("provider, is_valid").eq("user_id", user.id).eq("provider", "fal").eq("is_valid", true),
      ]);
      setBalance(creditsRes.data?.balance ?? 0);
      setHasOwnKey((keysRes.data?.length ?? 0) > 0);
    };
    load();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("navbar-credits")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_credits", filter: `user_id=eq.${user.id}` }, (payload: any) => {
        if (payload.new?.balance !== undefined) {
          setBalance(payload.new.balance);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const handleAuthButton = () => {
    if (user) {
      setCreditsOpen(true);
    } else {
      setLoginOpen(true);
    }
  };

  const visibleLinks = navLinks.filter(link => !link.authOnly || user);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4"
      >
        {/* Desktop - Floating Liquid Glass Pill */}
        <motion.div
          className={cn(
            "hidden lg:flex items-center gap-1 px-4 py-2.5 rounded-full transition-all duration-700",
            "liquid-glass-nav"
          )}
          style={{
            boxShadow: scrolled 
              ? '0 8px 32px hsl(0 0% 0% / 0.25), inset 0 1px 0 0 hsl(0 0% 100% / 0.1)'
              : '0 4px 24px hsl(0 0% 0% / 0.15), inset 0 1px 0 0 hsl(0 0% 100% / 0.08)'
          }}
        >
          {/* Logo */}
          <Link to="/" className="pr-4 pl-2">
            <span className="text-lg font-bold text-primary">
              magic ai
            </span>
            <span className="text-xs text-muted-foreground ml-1.5 font-medium">
              by unvrs labs
            </span>
          </Link>
          
          <div className="w-px h-5 bg-white/15 mx-1" />
          
          {visibleLinks.map((link) => {
            const isActive = activeLink === link.href;
            
            return (
              <motion.div
                key={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full cursor-pointer",
                  isActive
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full liquid-glass"
                    style={{
                      background: 'linear-gradient(135deg, hsl(270 80% 65% / 0.15) 0%, hsl(270 80% 65% / 0.05) 100%)',
                      border: '1px solid hsl(270 80% 65% / 0.25)'
                    }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Link to={link.href} onClick={handleLinkClick} className="relative z-10">
                  {link.label}
                </Link>
              </motion.div>
            );
          })}
          
          <div className="w-px h-5 bg-white/15 mx-1" />
          
          <motion.button
            onClick={handleAuthButton}
            className={cn(
              "px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 flex items-center gap-2",
              user
                ? "text-foreground liquid-glass hover:text-primary"
                : "text-primary-foreground bg-gradient-to-r from-primary to-primary/80"
            )}
            whileHover={{ scale: 1.05, boxShadow: user ? undefined : '0 8px 24px hsl(270 80% 60% / 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            {user ? (
              <>
                <Wallet className="w-4 h-4" />
                {hasOwnKey ? "∞" : `€${balance !== null ? balance.toFixed(2) : "—"}`}
              </>
            ) : (
              "Login"
            )}
          </motion.button>
        </motion.div>

        {/* Mobile Menu Toggle */}
        <motion.div
          className={cn(
            "lg:hidden flex items-center justify-between w-full px-5 py-3 rounded-full transition-all duration-500",
            "liquid-glass-nav"
          )}
        >
          <div className="flex items-center gap-1">
            <span className="text-primary font-bold text-lg">magic ai</span>
            <span className="text-xs text-muted-foreground font-medium">by unvrs labs</span>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <motion.button
                onClick={() => setCreditsOpen(true)}
                className="text-foreground text-sm font-semibold px-3 py-1.5 rounded-full liquid-glass flex items-center gap-1.5"
                whileTap={{ scale: 0.95 }}
              >
                <Wallet className="w-3.5 h-3.5 text-primary" />
                {hasOwnKey ? "∞" : `€${balance !== null ? balance.toFixed(2) : "—"}`}
              </motion.button>
            )}
            <motion.button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-foreground p-2 rounded-full liquid-glass"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </motion.div>

        {/* Mobile Menu - Liquid Glass Panel */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed top-[6rem] left-4 right-4 z-50 rounded-[1.5rem] overflow-hidden liquid-glass-card"
            >
              <div className="flex flex-col p-4 gap-1">
                {visibleLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300",
                        activeLink === link.href
                          ? "text-primary bg-primary/10"
                          : "text-foreground/70 hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                {!user && (
                  <>
                    <div className="h-px bg-white/10 my-2" />
                    <motion.button
                      onClick={() => { handleLinkClick(); setLoginOpen(true); }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="px-4 py-3 rounded-xl text-base font-semibold text-center text-primary-foreground bg-gradient-to-r from-primary to-primary/80"
                    >
                      Login
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Dialogs */}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      {user && <CreditsDialog open={creditsOpen} onOpenChange={setCreditsOpen} userId={user.id} />}
    </>
  );
};
