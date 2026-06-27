import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Leaf } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen hero-mesh flex items-center justify-center p-8">
      {/* Decorative leaves */}
      <div className="absolute top-20 left-10 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center animate-float">
        <Leaf className="w-6 h-6 text-eco-green/40" />
      </div>
      <div className="absolute bottom-32 right-16 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center animate-float-slow">
        <Leaf className="w-4 h-4 text-eco-green/30" />
      </div>
      <div className="absolute top-40 right-28 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center animate-float" style={{ animationDelay: "1.5s" }}>
        <Leaf className="w-5 h-5 text-eco-light/30" />
      </div>

      <div className="text-center animate-scale-in">
        {/* Big 404 */}
        <div className="relative mb-8 inline-block">
          <h1 className="font-display text-[10rem] leading-none font-black text-transparent select-none" style={{
            WebkitTextStroke: "2px rgba(76,175,80,0.3)",
          }}>
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-eco-primary to-eco-green rounded-3xl flex items-center justify-center shadow-eco-lg animate-float">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <h2 className="font-display text-2xl font-bold text-white mb-3">
          Even our drones couldn&apos;t find this page!
        </h2>
        <p className="text-white/50 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
          The page you&apos;re looking for has been recycled or doesn&apos;t exist. Let&apos;s get you back on track.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button className="btn-glow bg-gradient-to-r from-eco-green to-eco-primary text-white border-0 font-semibold px-6 h-11 rounded-xl gap-2 shadow-eco">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-white/20 text-white/80 bg-white/8 hover:bg-white/15 h-11 rounded-xl gap-2 px-6"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

