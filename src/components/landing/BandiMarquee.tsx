import { motion } from "framer-motion";
import { 
  Leaf, 
  Wallet, 
  Shield, 
  Zap, 
  Clock,
  HeartHandshake,
  Smartphone,
  Award
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const customerBenefits: { icon: LucideIcon; label: string }[] = [
  { icon: Smartphone, label: "Registrazione via App" },
  { icon: Wallet, label: "Risparmio Garantito" },
  { icon: Leaf, label: "100% Energia Verde" },
  { icon: Shield, label: "Zero Costi Nascosti" },
  { icon: Zap, label: "Attivazione in 60 Secondi" },
  { icon: Clock, label: "Assistenza 24/7" },
  { icon: HeartHandshake, label: "Nessun Vincolo" },
  { icon: Award, label: "AI Lettura Bollette" },
];

const BenefitCard = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
  <div 
    className="flex items-center gap-3 px-5 py-3 rounded-full border border-primary/40 bg-primary/5 backdrop-blur-sm whitespace-nowrap"
    style={{
      boxShadow: '0 0 20px hsl(var(--primary) / 0.15), inset 0 1px 0 0 hsl(0 0% 100% / 0.1)'
    }}
  >
    <Icon className="w-5 h-5 text-primary" />
    <span className="text-sm font-medium text-foreground">{label}</span>
  </div>
);

export const BandiMarquee = () => {
  const duplicatedBenefits = [...customerBenefits, ...customerBenefits, ...customerBenefits];

  return (
    <section className="py-12 overflow-hidden">
      <div className="relative">
        {/* Gradient fade left */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        
        {/* Gradient fade right */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling container */}
        <motion.div
          className="flex gap-4"
          animate={{
            x: [0, -50 * customerBenefits.length],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 20,
              ease: "linear",
            },
          }}
        >
          {duplicatedBenefits.map((benefit, index) => (
            <BenefitCard key={`${benefit.label}-${index}`} icon={benefit.icon} label={benefit.label} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
