import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { authManager } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, ArrowRight, Eye, EyeOff, Users, Star, Globe } from "lucide-react";

export default function Register() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", email: "", password: "", name: "", phone: "", address: "" },
  });

  const onSubmit = async (data: InsertUser) => {
    setIsLoading(true);
    setError("");
    try {
      await authManager.register(data);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branded panel */}
      <div className="hidden lg:flex lg:w-5/12 hero-mesh flex-col justify-between p-12 relative">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Leaf className="w-5 h-5 text-white animate-leaf-sway" />
            </div>
            <span className="font-display font-bold text-xl text-white">EcoScrap Pickup</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
              Join the<br />
              <span className="text-gradient-eco">Green Revolution</span>
            </h2>
            <p className="text-white/60 leading-relaxed max-w-xs text-sm">
              Thousands of eco-warriors are already making a difference. Be the change you want to see.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users, label: "10K+", sub: "Members" },
              { icon: Star, label: "500K", sub: "EcoPoints" },
              { icon: Globe, label: "50+", sub: "Cities" },
            ].map((item, i) => (
              <div key={i} className="glass-dark rounded-2xl p-4 text-center border border-white/10">
                <div className="text-white font-display font-bold text-lg">{item.label}</div>
                <div className="text-white/50 text-xs mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/25 text-xs">© 2026 EcoScrap Pickup</div>
      </div>

      {/* Right: Registration form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md animate-scale-in py-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-eco-primary to-eco-green rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-eco-primary">EcoScrap Pickup</span>
          </div>

          <div className="mb-7">
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-500 text-sm">Start earning EcoPoints for every pickup</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5 border-red-200 bg-red-50 rounded-xl">
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Full Name</Label>
                <Input id="name" {...form.register("name")} className="mt-1.5 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-eco-primary text-sm" placeholder="John Doe" />
                {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="username" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Username</Label>
                <Input id="username" {...form.register("username")} className="mt-1.5 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-eco-primary text-sm" placeholder="johndoe" />
                {form.formState.errors.username && <p className="text-xs text-red-500 mt-1">{form.formState.errors.username.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</Label>
              <Input id="email" type="email" {...form.register("email")} className="mt-1.5 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-eco-primary text-sm" placeholder="john@example.com" />
              {form.formState.errors.email && <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="phone" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone</Label>
              <Input id="phone" {...form.register("phone")} className="mt-1.5 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-eco-primary text-sm" placeholder="+1 (555) 000-0000" />
              {form.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{form.formState.errors.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="address" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Address</Label>
              <Input id="address" {...form.register("address")} className="mt-1.5 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-eco-primary text-sm" placeholder="123 Green Street, City" />
              {form.formState.errors.address && <p className="text-xs text-red-500 mt-1">{form.formState.errors.address.message}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  className="h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-eco-primary text-sm pr-10"
                  placeholder="Create a strong password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && <p className="text-xs text-red-500 mt-1">{form.formState.errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 btn-glow bg-gradient-to-r from-eco-primary to-eco-green hover:from-eco-green hover:to-eco-primary text-white border-0 font-semibold rounded-xl gap-2 transition-all duration-300 mt-2"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-eco-primary hover:text-eco-green font-semibold cursor-pointer transition-colors">Sign in ?</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

