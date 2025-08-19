import { Switch, Route } from "wouter";
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
import Chatbot from "@/components/chatbot/chatbot";

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authManager.loadUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const handleStorageChange = () => {
      authManager.loadUser().then(setUser);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-eco-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={() => {
        authManager.logout();
        setUser(null);
      }} />
      
      <main className="min-h-screen">
        <Switch>
          <Route path="/" component={() => <Home user={user} />} />
          <Route path="/request-pickup" component={() => <RequestPickup user={user} />} />
          <Route path="/rewards" component={() => <Rewards user={user} />} />
          <Route path="/profile" component={() => <Profile user={user} onUpdate={setUser} />} />
          <Route path="/admin" component={() => user.isAdmin ? <Admin /> : <NotFound />} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <Footer />
      <Chatbot />
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
