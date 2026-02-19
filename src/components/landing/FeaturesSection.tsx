import { motion } from "framer-motion";
import { 
  Fingerprint, 
  Brain, 
  Route, 
  Users, 
  Bell, 
  FileText,
  Shield,
  BarChart3,
  ArrowUpRight
} from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "Scansione Bolletta AI",
    description: "Fotografa la bolletta e l'AI estrae automaticamente tutti i dati per proporti l'offerta migliore.",
    size: "small",
    color: "from-primary to-emerald-500"
  },
  {
    icon: Brain,
    title: "Energia 100% Verde",
    description: "Tutta la nostra energia proviene da fonti rinnovabili certificate.",
    size: "small",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Route,
    title: "Prezzi Trasparenti",
    description: "Nessun costo nascosto. Sai sempre esattamente quanto paghi e perché.",
    size: "small",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: Users,
    title: "3 Tipologie Clienti",
    description: "Serviamo Domestici (solo App), Business e Pubblica Amministrazione.",
    size: "small",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: Bell,
    title: "Alert Consumi",
    description: "Ricevi notifiche sui tuoi consumi e consigli per risparmiare ancora di più.",
    size: "small",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: FileText,
    title: "Dati Precompilati",
    description: "I dati della bolletta vengono copiati automaticamente per la registrazione.",
    size: "small",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: Shield,
    title: "Nessun Vincolo",
    description: "Sei libero di cambiare fornitore quando vuoi, senza penali.",
    size: "small",
    color: "from-slate-400 to-slate-600"
  },
  {
    icon: BarChart3,
    title: "Monitoraggio Consumi",
    description: "Tieni sotto controllo i tuoi consumi con grafici e statistiche dettagliate.",
    size: "small",
    color: "from-green-500 to-emerald-600"
  }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const isLarge = feature.size === "large";
  const isMedium = feature.size === "medium";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={`
        ${isLarge ? 'md:col-span-2 md:row-span-2' : ''}
        ${isMedium ? 'md:col-span-2' : ''}
        group relative
      `}
    >
      <motion.div
        className={`
          relative h-full liquid-glass-card-sm p-6 md:p-8 
          transition-all duration-500 overflow-hidden
          ${isLarge ? 'min-h-[280px]' : 'min-h-[160px]'}
        `}
        whileHover={{ 
          y: -4,
          transition: { duration: 0.3 }
        }}
        style={{
          background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.08) 0%, hsl(0 0% 100% / 0.03) 100%)'
        }}
      >
        {/* Hover glow effect */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem]"
          style={{
            background: `radial-gradient(circle at 30% 30%, hsl(38 92% 50% / 0.08) 0%, transparent 60%)`
          }}
        />
        
        {/* Icon - Layered with gradient */}
        <motion.div 
          className={`
            relative z-10
            ${isLarge ? 'w-14 h-14' : 'w-11 h-11'} 
            rounded-[1rem] bg-gradient-to-br ${feature.color}
            flex items-center justify-center mb-4 shadow-lg
          `}
          whileHover={{ scale: 1.08, rotate: 3 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <feature.icon className={`${isLarge ? 'w-7 h-7' : 'w-5 h-5'} text-white`} />
        </motion.div>
        
        {/* Content */}
        <div className="relative z-10">
          <h3 className={`${isLarge ? 'text-2xl' : 'text-lg'} font-bold text-foreground mb-2 group-hover:text-primary transition-colors`}>
            {feature.title}
          </h3>
          <p className={`text-muted-foreground ${isLarge ? 'text-base' : 'text-sm'} leading-relaxed`}>
            {feature.description}
          </p>
        </div>

        {/* Hover arrow */}
        <motion.div
          className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        >
          <ArrowUpRight className="w-5 h-5 text-primary" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.span 
            className="inline-block px-5 py-2 rounded-full liquid-glass text-primary text-sm font-semibold mb-6"
            whileHover={{ scale: 1.05 }}
          >
            I Nostri Vantaggi
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Tutto ciò che ti serve
            <br />
            <span className="gradient-text-gold">in un unico fornitore</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            OK Energia ti offre luce e gas con un servizio completo, trasparente e sempre a portata di mano.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
