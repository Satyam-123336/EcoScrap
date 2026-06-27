import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { authManager } from "./lib/auth";
import { User } from "@shared/schema";

import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import RequestPickup from "@/pages/request-pickup";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/privacy";
import TermsOfService from "@/pages/terms";
import FAQ from "@/pages/faq";
import CookiePolicy from "@/pages/cookie-policy";
import Creators from "@/pages/creators";
import Chatbot from "@/components/chatbot/chatbot";
import NotificationManager from "@/components/notifications/notification-manager";

function ScrollToTop() {
  const [pathname] = useLocation();

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 150);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  
  const originalSetCurrentUser = authManager.setCurrentUser;
  authManager.setCurrentUser = (user: User | null) => {
    originalSetCurrentUser.call(authManager, user);
    setUser(user);
    setLoading(false);
  };

  const loadUser = async () => {
    try {
      const user = await Promise.race([
        authManager.loadUser(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)) // 5 second timeout
      ]);
      setUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    
    const handleStorageChange = () => {
      loadUser();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-animated">
        <div className="text-center animate-scale-in">
          {/* Orbiting ring */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-t-2 border-eco-green animate-spin" style={{ animationDuration: '1.2s' }} />
            <div className="absolute inset-2 rounded-full border-t border-white/20 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <svg className="w-6 h-6 text-white animate-leaf-sway" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2 0 0-.71 2.81 1 4-.29-.04-.58-.06-.88-.06C7.41 9 5 12.59 5 16.59c0 2.28 1.02 4.34 2.62 5.74-.18.56-.34 1.13-.5 1.67l1.89.67c.29-.99.6-1.97.93-2.92.5.09 1.01.14 1.55.14 1.66 0 3.13-.58 4.28-1.52.57.63 1.27 1.12 2.06 1.41.02-.07.05-.13.07-.2-.8-.28-1.5-.77-2.06-1.41.68-.56 1.25-1.22 1.7-1.96C18.32 17.09 19 15.34 19 14c0-2.76-1.59-5.19-4-6.32.33-.24.65-.49.97-.74C17.32 6.3 17 8 17 8z"/>
                </svg>
              </div>
            </div>
          </div>
          <p className="font-display font-semibold text-white text-lg tracking-wide">EcoScrap Pickup</p>
          <p className="text-white/50 text-sm mt-1 font-medium">Loading your eco dashboard...</p>
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-eco-green animate-bounce-subtle" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }


  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-eco-primary to-eco-green">
        <ScrollToTop />
        <Switch>
          <Route path="/register">
            <Register />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/privacy">
            <PrivacyPolicy />
          </Route>
          <Route path="/terms">
            <TermsOfService />
          </Route>
          <Route path="/faq">
            <FAQ />
          </Route>
          <Route path="/cookie-policy">
            <CookiePolicy />
          </Route>
          <Route path="/creators">
            <Creators />
          </Route>
          <Route>
            {/* Redirect any unknown/bare URL to /login so URL always matches the view */}
            <Redirect to="/login" />
          </Route>
        </Switch>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={async () => {
        await authManager.logout();
        setUser(null);
      }} />
      <ScrollToTop />
      
      <main className="min-h-screen">
        <Switch>
          {/* If an authenticated user lands on /login or /register (timing race),
              redirect them home immediately instead of showing 404 */}
          <Route path="/login">
            <Redirect to="/" />
          </Route>
          <Route path="/register">
            <Redirect to="/" />
          </Route>
          <Route path="/">
            {() => user.isAdmin ? <Admin /> : <Home user={user} />}
          </Route>
          <Route path="/request-pickup">
            {() => user.isAdmin ? <Admin /> : <RequestPickup user={user} />}
          </Route>
          <Route path="/rewards">
            {() => user.isAdmin ? <Admin /> : <Rewards user={user} />}
          </Route>
          <Route path="/profile">
            {() => <Profile user={user} onUpdate={setUser} />}
          </Route>
          <Route path="/admin">
            {() => user.isAdmin ? <Admin /> : <NotFound />}
          </Route>
          <Route path="/privacy">
            <PrivacyPolicy />
          </Route>
          <Route path="/terms">
            <TermsOfService />
          </Route>
          <Route path="/faq">
            <FAQ />
          </Route>
          <Route path="/cookie-policy">
            <CookiePolicy />
          </Route>
          <Route path="/creators">
            <Creators />
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </main>
      
      <Footer />
      <Chatbot />
      {!user.isAdmin && null}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
