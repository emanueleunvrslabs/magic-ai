import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, TrendingUp, Wallet, ChevronRight, Shield, Award, Star } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const rotatingWords = ["RISPARMIARE.", "VIVERE GREEN.", "STARE SERENI."];

// Rotating word component with character-by-character animation
const RotatingWord = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const currentWord = rotatingWords[index];
  const characters = currentWord.split("");

  return (
    <span className="inline-flex overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          className="inline-flex text-primary"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {characters.map((char, i) => (
            <motion.span
              key={`${currentWord}-${i}`}
              className="inline-block"
              variants={{
                hidden: { y: "100%", opacity: 0 },
                visible: { y: 0, opacity: 1 },
                exit: { y: "-100%", opacity: 0 }
              }}
              transition={{
                duration: 0.35,
                delay: i * 0.03,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// Animated counter component
const AnimatedNumber = ({ value, duration = 2, prefix = "", suffix = "" }: { value: number; duration?: number; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const end = value;
          const stepTime = Math.abs(Math.floor((duration * 1000) / end));
          
          const timer = setInterval(() => {
            start += Math.ceil(value / 50);
            if (start >= end) {
              start = end;
              clearInterval(timer);
            }
            setDisplayValue(start);
          }, stepTime);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={ref}>{prefix}{displayValue.toLocaleString('it-IT')}{suffix}</span>;
};

export const HeroSection = () => {

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-screen pt-32 pb-24 md:py-24">
          {/* Left Side - Text Content */}
          <div className="text-left">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-8"
            >
              <motion.span
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="block whitespace-nowrap"
              >
                L'ENERGIA CHE TI FA
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4"
              >
                <RotatingWord />
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg md:text-xl text-white/70 max-w-xl mb-10 leading-relaxed"
            >
              Scarica l'app, carica una bolletta e ottieni subito la migliore tariffa. 
              L'intelligenza artificiale legge i tuoi dati e ti propone un'offerta personalizzata 
              in pochi secondi. Serviamo Domestici, Business e Pubblica Amministrazione.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-col gap-6"
            >
              {/* App Store Buttons */}
              <div className="flex flex-wrap gap-3">
                <motion.a
                  href="#"
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-base group text-white liquid-glass"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] opacity-70">Scarica su</div>
                    <div className="text-sm font-semibold -mt-0.5">App Store</div>
                  </div>
                </motion.a>
                
                <motion.a
                  href="#"
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-base group text-white liquid-glass"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] opacity-70">Disponibile su</div>
                    <div className="text-sm font-semibold -mt-0.5">Google Play</div>
                  </div>
                </motion.a>
              </div>

              <p className="text-sm text-white/50">
                Per clienti Business e PA, <a href="#contact" className="text-primary underline hover:text-primary/80">contattaci direttamente</a>
              </p>


              {/* Awards & Recognition */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="flex items-center gap-4 flex-wrap pt-2"
              >
                <div className="flex items-center gap-2 text-white/60">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">100% Energia Verde</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-white/80">ARERA Compliant</span>
                </div>

              </motion.div>
            </motion.div>
          </div>

          {/* Right Side - Liquid Glass Card */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <motion.div className="relative w-full max-w-md">
              {/* Liquid Glass Card - Lomma Style */}
              <div 
                className="relative rounded-[2rem] p-6 md:p-8 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.12) 0%, hsl(0 0% 100% / 0.06) 100%)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  border: '1px solid hsl(0 0% 100% / 0.25)',
                  boxShadow: `
                    0 32px 64px -12px hsl(220 30% 10% / 0.4),
                    inset 0 1px 0 0 hsl(0 0% 100% / 0.15)
                  `
                }}
              >
                {/* Animated border glow effect - top left corner */}
                <motion.div
                  className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, hsl(158 64% 50% / 0.6) 0%, hsl(158 64% 50% / 0.3) 30%, transparent 70%)',
                    filter: 'blur(8px)',
                  }}
                  animate={{
                    x: [-20, 80, -20],
                    y: [-20, 40, -20],
                    opacity: [0.4, 0.8, 0.4],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Glass shine effect */}
                <div 
                  className="absolute inset-0 pointer-events-none rounded-[2rem]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.08) 0%, transparent 60%)'
                  }}
                />

                {/* Logo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="text-center mb-4 relative z-10"
                >
                  <span className="text-lg font-semibold text-foreground/90">OK Energia</span>
                </motion.div>

                {/* Bandi Counter with Wave Glow Effect */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-center mb-8 relative z-10"
                >
                  <div className="relative inline-block">
                    {/* Pulsing glow background */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [0.9, 1.1, 0.9]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                    <motion.p 
                      className="relative text-5xl md:text-7xl font-bold text-foreground tracking-tight"
                      animate={{ 
                        textShadow: [
                          "0 0 20px hsl(var(--primary) / 0.3)",
                          "0 0 40px hsl(var(--primary) / 0.5)",
                          "0 0 20px hsl(var(--primary) / 0.3)"
                        ]
                      }}
                      transition={{ 
                        duration: 2.5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      <AnimatedNumber value={50000} duration={2} />
                    </motion.p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Clienti soddisfatti</p>
                </motion.div>

                {/* Info Cards - Glass Style */}
                <div className="space-y-3 relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer group"
                    style={{
                      background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.95) 0%, hsl(0 0% 100% / 0.9) 100%)',
                      boxShadow: '0 4px 24px -4px hsl(220 30% 10% / 0.15)',
                      border: '1px solid hsl(0 0% 90% / 0.8)'
                    }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">Risparmio Garantito</p>
                      <p className="text-sm text-slate-500">
                        <span className="text-emerald-600 font-semibold">- 25%</span>
                        {" "}sulla bolletta media
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.15 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer group"
                    style={{
                      background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.95) 0%, hsl(0 0% 100% / 0.9) 100%)',
                      boxShadow: '0 4px 24px -4px hsl(220 30% 10% / 0.15)',
                      border: '1px solid hsl(0 0% 90% / 0.8)'
                    }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">Bolletta Chiara</p>
                      <p className="text-sm text-slate-500">
                        Zero costi nascosti, <span className="font-semibold text-slate-900">100%</span> trasparenza
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                  </motion.div>
                </div>
              </div>

              {/* Floating decorative elements */}
              <motion.div
                className="absolute -top-6 -right-6 w-20 h-20 rounded-2xl bg-accent/20 backdrop-blur-sm border border-accent/30"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl bg-primary/10 backdrop-blur-sm border border-primary/20"
                animate={{ y: [0, 8, 0], rotate: [0, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2"
        >
          <motion.div 
            className="w-1.5 h-3 rounded-full bg-white"
            animate={{ opacity: [0.3, 1, 0.3], scaleY: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};
