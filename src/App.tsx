import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Materiais from "./pages/Materiais";
import Movimentacoes from "./pages/Movimentacoes";
import Solicitacoes from "./pages/Solicitacoes";
import MinhasRetiradas from "./pages/MinhasRetiradas";
import Usuarios from "./pages/Usuarios";
import Relatorios from "./pages/Relatorios";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Rotas Protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/materiais" element={<Materiais />} />
              <Route path="/movimentacoes" element={<Movimentacoes />} />
              <Route path="/solicitacoes" element={<Solicitacoes />} />
              <Route path="/minhas-retiradas" element={<MinhasRetiradas />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/relatorios" element={<Relatorios />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;