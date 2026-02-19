import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BandiMarquee } from "@/components/landing/BandiMarquee";
import { ProblemSolutionSection } from "@/components/landing/ProblemSolutionSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Modern mesh gradient background */}
      <div className="fixed inset-0 mesh-gradient" />
      
      {/* Subtle aurora effect */}
      <div className="fixed inset-0 aurora-bg pointer-events-none" />
      
      {/* Very subtle grain for texture */}
      <div className="grain-overlay" />
      
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        
        <main>
          <HeroSection />
          <BandiMarquee />
          <ProblemSolutionSection />
          <FeaturesSection />
          <HowItWorksSection />
          <PricingSection />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
