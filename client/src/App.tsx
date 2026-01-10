import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import { initKeepalive } from "@/lib/keepalive";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProductList from "@/pages/ProductList";
import ProductDetail from "@/pages/ProductDetail";
import VendorList from "@/pages/VendorList";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import VendorDashboard from "@/pages/VendorDashboard";
import CustomerAccount from "@/pages/CustomerAccount";
import OrderHistory from "@/pages/OrderHistory";
import VendorAccount from "@/pages/VendorAccount";
import VendorStore from "@/pages/VendorStore";
import VendorWallet from "@/pages/VendorWallet";
import AdminDashboard from "@/pages/AdminDashboard";
import Stories from "@/pages/Stories";
import VendorProfile from "@/pages/VendorProfile";
import AuthPage from "@/pages/AuthPage";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import ContactUs from "@/pages/ContactUs";
import FAQ from "@/pages/FAQ";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={ProductList} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/vendors" component={VendorList} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/stories" component={Stories} />
      
      {/* Legal & Support routes */}
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/faq" component={FAQ} />
      
      {/* Auth routes */}
      <Route path="/login" component={AuthPage} />
      <Route path="/signup" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Customer routes */}
      <Route path="/account" component={CustomerAccount} />
      <Route path="/orders" component={OrderHistory} />
      
      {/* Vendor routes - specific routes must come before /vendor/:id */}
      <Route path="/vendor/account" component={VendorAccount} />
      <Route path="/vendor/store" component={VendorStore} />
      <Route path="/vendor/dashboard" component={VendorDashboard} />
      <Route path="/vendor/wallet" component={VendorWallet} />
      <Route path="/vendor/:id" component={VendorProfile} />
      
      {/* Legacy route redirects */}
      <Route path="/vendor-dashboard" component={VendorDashboard} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize keepalive service to prevent server from sleeping
    initKeepalive();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
