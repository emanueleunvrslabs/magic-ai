import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Domestico",
    description: "Per famiglie e privati - Attivazione esclusiva tramite App",
    price: "App",
    period: "Scarica",
    features: [
      "Registrazione veloce con foto bolletta",
      "AI che legge i dati automaticamente",
      "Proposta tariffa migliore istantanea",
      "Dati anagrafici precompilati",
      "Energia 100% rinnovabile",
      "Gestione completa da smartphone"
    ],
    cta: "Scarica l'App",
    highlighted: true,
    badge: "Solo App"
  },
  {
    name: "Business",
    description: "Per aziende e partite IVA",
    price: "Custom",
    period: "",
    features: [
      "Tariffe personalizzate",
      "Consulente dedicato",
      "Fatturazione elettronica",
      "Report consumi dettagliati",
      "Supporto prioritario",
      "Pagamento a 30/60 giorni",
      "Soluzioni multi-punto"
    ],
    cta: "Richiedi Preventivo",
    highlighted: false
  },
  {
    name: "Pubblica Amministrazione",
    description: "Per enti pubblici e PA",
    price: "Gara",
    period: "",
    features: [
      "Procedure MEPA/Consip",
      "Conformità normativa completa",
      "Account manager dedicato",
      "Rendicontazione trasparente",
      "Energia verde certificata",
      "Fatturazione split payment",
      "Supporto gare d'appalto"
    ],
    cta: "Contattaci",
    highlighted: false
  }
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-32 relative overflow-hidden">
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
            Prezzi Trasparenti
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Scegli l'offerta
            <br />
            <span className="gradient-text-gold">giusta per te</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Offerte chiare e trasparenti per casa e azienda. Nessun costo nascosto, solo risparmio.
          </p>
        </motion.div>

        {/* Pricing Cards - Liquid Glass */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.highlighted ? 'lg:-mt-4 lg:mb-4' : ''}`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <motion.div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25">
                    <Sparkles className="w-4 h-4" />
                    Solo via App
                  </div>
                </motion.div>
              )}
              
              <motion.div 
                className={`
                  relative h-full rounded-[2rem] p-8 flex flex-col
                  transition-all duration-500 overflow-hidden
                  ${plan.highlighted 
                    ? 'liquid-glass border-primary/30' 
                    : 'liquid-glass-card'
                  }
                `}
                whileHover={{ y: -4 }}
                style={{
                  background: plan.highlighted 
                    ? 'linear-gradient(135deg, hsl(158 64% 42% / 0.12) 0%, hsl(0 0% 100% / 0.08) 50%, hsl(0 0% 100% / 0.04) 100%)'
                    : 'linear-gradient(135deg, hsl(0 0% 100% / 0.08) 0%, hsl(0 0% 100% / 0.03) 100%)',
                  border: plan.highlighted 
                    ? '1px solid hsl(158 64% 42% / 0.3)' 
                    : '1px solid hsl(0 0% 100% / 0.12)'
                }}
              >
                {/* Glow effect for highlighted */}
                {plan.highlighted && (
                  <div 
                    className="absolute inset-0 rounded-[2rem] opacity-40"
                    style={{
                      background: 'radial-gradient(ellipse at 50% 0%, hsl(158 64% 42% / 0.15) 0%, transparent 60%)'
                    }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Plan Info */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-lg">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.li 
                        key={featureIndex}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + featureIndex * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.highlighted ? 'bg-primary/25' : 'bg-white/10'}`}>
                          <Check className={`w-3 h-3 ${plan.highlighted ? 'text-primary' : 'text-foreground/70'}`} />
                        </div>
                        <span className="text-foreground/80">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <motion.a
                    href="#contact"
                    className={`
                      w-full py-4 px-6 rounded-[1rem] font-semibold text-center 
                      transition-all duration-300 flex items-center justify-center gap-2
                      ${plan.highlighted
                        ? 'bg-gradient-to-r from-primary to-amber-500 text-primary-foreground shadow-lg shadow-primary/25'
                        : 'liquid-glass text-foreground hover:bg-white/15'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </motion.a>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Trust text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 text-muted-foreground"
        >
          ⚡ Attivazione gratuita · 🌱 100% Energia verde · 🔒 Nessun vincolo
        </motion.p>
      </div>
    </section>
  );
};
