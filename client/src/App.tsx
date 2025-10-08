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
import NotificationManager from "@/components/notifications/notification-manager";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-eco-primary to-eco-green">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-eco-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-white text-lg font-medium">Loading EcoScrap Pickup...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-eco-primary to-eco-green">
        <Switch>
          <Route path="/register">
            <Register />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          <Route>
            <Login />
          </Route>
        </Switch>
      </div>
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
