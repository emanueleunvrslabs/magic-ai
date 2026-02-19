import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GenerationProvider } from "@/contexts/GenerationContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import ImageGenerate from "./pages/ImageGenerate";
import VideoGenerate from "./pages/VideoGenerate";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <GenerationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/image" element={<RequireAuth><ImageGenerate /></RequireAuth>} />
              <Route path="/video" element={<RequireAuth><VideoGenerate /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </GenerationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
