import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginData } from "@shared/schema";
import { authManager } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, ArrowRight, Shield, Recycle, Zap, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    setError("");
    try {
      await authManager.login(data);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branded panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-mesh flex-col justify-between p-12 relative">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Leaf className="w-5 h-5 text-white animate-leaf-sway" />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">EcoScrap Pickup</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
              Making recycling<br />
              <span className="text-gradient-eco">rewarding</span>
            </h2>
            <p className="text-white/60 leading-relaxed max-w-sm">
              Join thousands of eco-conscious users earning EcoPoints by responsibly disposing of electronic waste.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Recycle, text: "AI-powered e-waste classification" },
              { icon: Zap, text: "24-hour drone pickup service" },
              { icon: Shield, text: "Secure, certified recycling partners" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/15">
                  <item.icon className="w-4 h-4 text-eco-green" />
                </div>
                <span className="text-white/70 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs">
          © 2026 EcoScrap Pickup. All rights reserved.
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-eco-primary to-eco-green rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-eco-primary">EcoScrap Pickup</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 rounded-xl">
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Username</Label>
              <Input
                id="username"
                {...form.register("username")}
                className="mt-1.5 h-11 rounded-xl border-gray-200 focus:border-eco-primary focus:ring-eco-primary/20 bg-gray-50 focus:bg-white transition-colors"
                placeholder="Enter your username"
              />
              {form.formState.errors.username && (
                <p className="text-xs text-red-500 mt-1.5">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  className="h-11 rounded-xl border-gray-200 focus:border-eco-primary focus:ring-eco-primary/20 bg-gray-50 focus:bg-white transition-colors pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-red-500 mt-1.5">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 btn-glow bg-gradient-to-r from-eco-primary to-eco-green hover:from-eco-green hover:to-eco-primary text-white border-0 font-semibold rounded-xl transition-all duration-300 gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register">
              <span className="text-eco-primary hover:text-eco-green font-semibold cursor-pointer transition-colors">
                Create one
              </span>
            </Link>
          </p>

          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-500 font-semibold mb-2">Demo Credentials</p>
            <p className="text-xs text-gray-500">Admin: <code className="bg-white px-1.5 py-0.5 rounded text-eco-primary font-mono">admin / admin123</code></p>
            <p className="text-xs text-gray-400 mt-1">Or register a new account above</p>
          </div>
        </div>
      </div>
    </div>
  );
}

