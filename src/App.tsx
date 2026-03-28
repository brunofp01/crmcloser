import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import { RegisterSubscriptionPage } from "./pages/RegisterSubscriptionPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register-subscription" element={<RegisterSubscriptionPage />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/deals" element={<Index />} />
            <Route path="/clients" element={<Index />} />
            <Route path="/owners" element={<Index />} />
            <Route path="/tasks" element={<Index />} />
            <Route path="/lancamentos" element={<Index />} />
            <Route path="/anuncios" element={<Index />} />
            <Route path="/users" element={<Index />} />
            <Route path="/notifications" element={<Index />} />
            <Route path="/profile" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
