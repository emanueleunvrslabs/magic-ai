import { Navbar } from "@/components/layout/Navbar";
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
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1" />
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
