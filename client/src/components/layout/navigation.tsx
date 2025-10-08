import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Leaf, 
  Menu, 
  Star,
  Home,
  Calendar,
  Trophy,
  User as UserIcon,
  Shield,
  Bell
} from "lucide-react";
import NotificationDropdown from "@/components/ui/notification-dropdown";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavigationProps {
  user: User;
  onLogout: () => void;
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  const [location] = useLocation();

  const navItems = user.isAdmin 
    ? [
        { href: "/profile", label: "Profile", icon: UserIcon },
        { href: "/admin", label: "Admin", icon: Shield },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: "/request-pickup", label: "Request Pickup", icon: Calendar },
        { href: "/rewards", label: "My Rewards", icon: Trophy },
        { href: "/profile", label: "Profile", icon: UserIcon },
      ];

  const NavLink = ({ href, label, icon: Icon, mobile = false }: { 
    href: string; 
    label: string; 
    icon: any;
    mobile?: boolean;
  }) => {
    const isActive = location === href;
    const baseClasses = mobile 
      ? "flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium"
      : "px-3 py-2 text-sm font-medium transition-colors";
    
    const activeClasses = isActive 
      ? "text-eco-primary border-b-2 border-eco-primary" 
      : "text-gray-600 hover:text-eco-primary";

    return (
      <Link href={href}>
        <span className={`${baseClasses} ${activeClasses}`}>
          {mobile && <Icon className="w-5 h-5" />}
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Leaf className="text-eco-primary text-2xl mr-2" />
              <span className="text-xl font-bold text-eco-primary">EcoScrap Pickup</span>
            </div>
          </div>
          
          {}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <NavLink 
                  key={item.href} 
                  href={item.href} 
                  label={item.label} 
                  icon={item.icon}
                />
              ))}
            </div>
          </div>

          {}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-eco-light/20 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 text-eco-amber" />
              <span className="text-sm font-medium text-eco-primary">
                {user.ecoPoints.toLocaleString()} EcoPoints
              </span>
            </div>
            
            {!user.isAdmin && (
              <NotificationDropdown userId={user.id} />
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              className="hidden md:inline-flex"
            >
              Logout
            </Button>

            {}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-2 mb-6">
                    <Leaf className="text-eco-primary text-xl" />
                    <span className="text-lg font-bold text-eco-primary">EcoScrap</span>
                  </div>
                  
                  {}
                  <div className="bg-eco-light/10 p-4 rounded-lg mb-6">
                    <div className="font-semibold text-eco-primary">{user.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{user.level}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-eco-amber" />
                        <span className="text-sm font-medium text-eco-primary">
                          {user.ecoPoints.toLocaleString()} EcoPoints
                        </span>
                      </div>
                      {!user.isAdmin && (
                        <NotificationDropdown userId={user.id} />
                      )}
                    </div>
                  </div>

                  {}
                  <nav className="flex-1">
                    <div className="space-y-2">
                      {navItems.map((item) => (
                        <NavLink 
                          key={item.href} 
                          href={item.href} 
                          label={item.label} 
                          icon={item.icon}
                          mobile={true}
                        />
                      ))}
                    </div>
                  </nav>

                  <Button onClick={onLogout} className="mt-auto">
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

