/* Concrete Editorial: application shell com idioma, sessão demo, transições de página e rotas de comércio/produto. */
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Story from "./pages/Story";
import Account from "./pages/Account";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [active, setActive] = useState(true);
  useEffect(() => {
    setActive(false);
    const timer = window.setTimeout(() => setActive(true), 80);
    return () => window.clearTimeout(timer);
  }, [location]);
  return <div className={`page-transition ${active ? "page-transition-active" : ""}`}>{children}</div>;
}

function Router() {
  return <PageTransition><Switch>
    <Route path="/" component={Home} />
    <Route path="/shop" component={Shop} />
    <Route path="/product/:slug" component={Product} />
    <Route path="/story" component={Story} />
    <Route path="/account" component={Account} />
    <Route path="/checkout" component={Checkout} />
      <Route path="/admin" component={Admin} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></PageTransition>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><LanguageProvider><AuthProvider><CartProvider><TooltipProvider><Toaster /><Router /></TooltipProvider></CartProvider></AuthProvider></LanguageProvider></ThemeProvider></ErrorBoundary>;
}
