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
  LogOut,
  Users
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
        { href: "/creators", label: "About Us", icon: Users },
        { href: "/profile", label: "Profile", icon: UserIcon },
        { href: "/admin", label: "Admin", icon: Shield },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: "/request-pickup", label: "Request Pickup", icon: Calendar },
        { href: "/rewards", label: "My Rewards", icon: Trophy },
        { href: "/creators", label: "About Us", icon: Users },
        { href: "/profile", label: "Profile", icon: UserIcon },
      ];

  const NavLink = ({ href, label, icon: Icon, mobile = false }: { 
    href: string; 
    label: string; 
    icon: any;
    mobile?: boolean;
  }) => {
    const isActive = location === href;

    if (mobile) {
      return (
        <Link href={href}>
          <span className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            isActive 
              ? "bg-gradient-to-r from-eco-primary/15 to-eco-green/10 text-eco-primary" 
              : "text-gray-600 hover:bg-gray-50 hover:text-eco-primary"
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isActive ? "bg-eco-primary text-white shadow-sm" : "bg-gray-100 text-gray-500"
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            {label}
            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-eco-primary" />}
          </span>
        </Link>
      );
    }

    return (
      <Link href={href}>
        <span className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive 
            ? "nav-active text-eco-primary" 
            : "text-gray-600 hover:text-eco-primary hover:bg-eco-primary/5"
        }`}>
          <Icon className="w-3.5 h-3.5" />
          {label}
          {isActive && (
            <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-eco-primary to-eco-green rounded-full" />
          )}
        </span>
      </Link>
    );
  };

  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-eco-primary to-eco-green rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-eco transition-all duration-300">
                  <Leaf className="w-4 h-4 text-white animate-leaf-sway" />
                </div>
                <span className="font-display font-bold text-lg tracking-tight">
                  <span className="text-eco-primary">Eco</span>
                  <span className="text-gray-800">Scrap</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.href} 
                href={item.href} 
                label={item.label} 
                icon={item.icon}
              />
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {!user.isAdmin && (
              <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/70 px-3 py-1.5 rounded-full shadow-sm">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="text-xs font-semibold text-amber-700">
                  {user.ecoPoints.toLocaleString()}
                </span>
                <span className="text-xs text-amber-500 font-medium">pts</span>
              </div>
            )}

            {!user.isAdmin && <NotificationDropdown userId={user.id} />}

            <Button 
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="hidden md:flex items-center gap-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-all duration-200 px-2.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </Button>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden w-9 h-9 rounded-lg">
                  <Menu className="h-4 w-4 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-eco-primary to-eco-green p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center font-bold text-sm backdrop-blur-sm border border-white/20">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-white/70">{user.level}</div>
                    </div>
                  </div>
                  {!user.isAdmin && (
                    <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur-sm border border-white/10">
                      <Star className="w-4 h-4 text-amber-300 fill-amber-200" />
                      <span className="text-sm font-bold">{user.ecoPoints.toLocaleString()}</span>
                      <span className="text-xs text-white/70">EcoPoints</span>
                      <div className="ml-auto">
                        <NotificationDropdown userId={user.id} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-1">
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

                <div className="absolute bottom-6 left-4 right-4">
                  <Button 
                    onClick={onLogout} 
                    variant="outline"
                    className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
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
