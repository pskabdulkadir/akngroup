import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen";
import Index from "./pages/Index";
import Sistem from "./pages/Sistem";
import ManeviPanel from "./pages/ManeviPanel";
import EarningsDashboard from "./pages/EarningsDashboard";
import MemberPanel from "./pages/MemberPanel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ComprehensiveAdminPanel from "./pages/ComprehensiveAdminPanel";
import RealTimeTransactions from "./pages/RealTimeTransactions";
import EWalletFinancial from "./pages/EWalletFinancial";
import EWallet from "./pages/EWallet";
import ClonePage from "./pages/ClonePage";
import CloneProductPage from "./pages/CloneProductPage";
import CloneCustomerTracking from "./pages/CloneCustomerTracking";
import ProductCheckout from "./pages/ProductCheckout";
import ProductsPage from "./pages/ProductsPage";
import NotFound from "./pages/NotFound";
import BankAccountDemo from "./pages/BankAccountDemo";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Support from "./pages/Support";
import BatiniPanel from "./pages/BatiniPanel";
import TrainingPage from "./pages/TrainingPage";
import ZahiriPanel from "./pages/ZahiriPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/sistem" element={<Sistem />} />
              <Route path="/manevi-panel" element={<ManeviPanel />} />
              <Route path="/zahiri-panel" element={<ZahiriPanel />} />
              <Route path="/kazanc" element={<EarningsDashboard />} />
              <Route path="/earnings" element={<EarningsDashboard />} />
              <Route path="/member-panel" element={<MemberPanel />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/kayıt" element={<Register />} />
              <Route path="/admin-panel" element={<ComprehensiveAdminPanel />} />
              <Route path="/admin" element={<ComprehensiveAdminPanel />} />
              <Route path="/comprehensive-admin" element={<ComprehensiveAdminPanel />} />
              <Route path="/real-time-transactions" element={<RealTimeTransactions />} />
              <Route path="/e-wallet" element={<EWalletFinancial />} />
              <Route path="/wallet" element={<EWallet />} />
              <Route path="/clone/:slug" element={<ClonePage />} />
              <Route path="/clone-products/:memberId" element={<CloneProductPage />} />
              <Route path="/clone-customers" element={<CloneCustomerTracking />} />
              <Route path="/checkout" element={<ProductCheckout />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/bank-demo" element={<BankAccountDemo />} />
              <Route path="/gizlilik" element={<PrivacyPolicy />} />
              <Route path="/kullanim" element={<TermsOfUse />} />
              <Route path="/destek" element={<Support />} />
              <Route path="/batini-panel" element={<BatiniPanel />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/egitim" element={<TrainingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </Suspense>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
