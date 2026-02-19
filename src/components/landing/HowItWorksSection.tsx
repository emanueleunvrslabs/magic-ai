import { motion } from "framer-motion";
import { Smartphone, Camera, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Smartphone,
    title: "Scarica l'App",
    description: "Disponibile su App Store e Google Play. Installala in pochi secondi.",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: Camera,
    title: "Carica una Bolletta",
    description: "Fotografa la tua bolletta attuale. L'AI legge automaticamente tutti i dati.",
    color: "from-primary to-emerald-500"
  },
  {
    icon: Sparkles,
    title: "Ricevi l'Offerta Migliore",
    description: "In pochi secondi ti proponiamo la tariffa più conveniente per te.",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: CheckCircle,
    title: "Completa la Registrazione",
    description: "I dati anagrafici vengono copiati automaticamente. Firma e attiva subito.",
    color: "from-emerald-500 to-teal-500"
  }
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden">
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
            Clienti Domestici
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Diventa cliente
            <br />
            <span className="gradient-text-gold">in 60 secondi</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            L'app OK Energia usa l'intelligenza artificiale per leggere la tua bolletta e proporti subito la tariffa migliore.
          </p>
        </motion.div>

        {/* Steps - Liquid Glass Cards */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div 
                className="liquid-glass-card-sm p-8 h-full group cursor-pointer"
                whileHover={{ 
                  y: -4,
                  transition: { duration: 0.3 }
                }}
                style={{
                  background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.08) 0%, hsl(0 0% 100% / 0.03) 100%)'
                }}
              >
                {/* Step number & icon */}
                <div className="flex items-start gap-5 mb-4">
                  <motion.div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center relative shadow-lg`}
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center shadow-lg">
                      {index + 1}
                    </span>
                  </motion.div>
                  
                  <div className="flex-1 pt-2">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-base leading-relaxed pl-0 md:pl-[84px]">
                  {step.description}
                </p>

                {/* Hover arrow indicator */}
                <motion.div
                  className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight className="w-5 h-5 text-primary" />
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <motion.a 
            href="#" 
            className="btn-premium inline-flex items-center gap-3 text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Scarica l'App Gratis
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </motion.a>
          <p className="text-sm text-muted-foreground mt-4">
            Sei un'azienda o PA? <a href="#contact" className="text-primary underline">Contattaci per un preventivo dedicato</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
