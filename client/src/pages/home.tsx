import { useEffect } from "react";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, Play, Recycle, Zap, TrendingUp, Users, Leaf, ArrowRight, Shield, Award } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  }, []);

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    staleTime: 5 * 60 * 1000,
  });

  useSEO({
    title: "EcoScrap Pickup | Smart E-Waste Recycling Dashboard",
    description: "Welcome to EcoScrap Pickup. Schedule drone pickup for your electronic waste, get rewarded with EcoPoints, and help save the planet.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "EcoScrap Pickup",
      "url": "https://ecoscrappickup.com",
      "description": "Smart E-Waste Recycling platform.",
      "publisher": { "@type": "Organization", "name": "EcoScrap Pickup", "logo": "https://ecoscrappickup.com/favicon.png" }
    }
  });

  const features = [
    {
      icon: Recycle,
      title: "Smart Recycling",
      desc: "AI-powered e-waste classification ensures proper recycling and maximum environmental impact",
      gradient: "from-emerald-500 to-green-600",
      glow: "rgba(16,185,129,0.15)"
    },
    {
      icon: Zap,
      title: "Instant Pickup",
      desc: "Schedule drone pickup in minutes and receive service within 24 hours for maximum convenience",
      gradient: "from-amber-400 to-orange-500",
      glow: "rgba(251,191,36,0.15)"
    },
    {
      icon: Award,
      title: "Earn Rewards",
      desc: "Collect EcoPoints for every pickup and unlock achievements while saving the planet",
      gradient: "from-blue-500 to-indigo-600",
      glow: "rgba(59,130,246,0.15)"
    }
  ];

  const statItems = [
    { icon: Recycle, label: "Total Pickups", sub: "Successful collections", value: (stats as any)?.totalPickups || 0, gradient: "from-eco-primary to-eco-green" },
    { icon: TrendingUp, label: "E-Waste Collected", sub: "Total weight recycled", value: (stats as any)?.wasteCollected || "0 kg", gradient: "from-amber-400 to-orange-500" },
    { icon: Users, label: "Active Users", sub: "Community members", value: (stats as any)?.activeUsers || 0, gradient: "from-blue-500 to-indigo-500" },
    { icon: Leaf, label: "CO2 Saved", sub: "Environmental impact", value: (stats as any)?.carbonSaved || "0 kg", gradient: "from-teal-400 to-emerald-500" }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* -- Hero ----------------------------------------------- */}
      <section className="hero-mesh text-white py-24 relative">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">

            {/* Left copy */}
            <div className="mb-12 lg:mb-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 glass-dark rounded-full px-4 py-1.5 mb-6 animate-slide-up">
                <div className="w-1.5 h-1.5 rounded-full bg-eco-green animate-pulse" />
                <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">AI-Powered E-Waste Collection</span>
              </div>

              <h1 className="font-display text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-slide-up-delay-1">
                <span className="text-gradient-hero">Eco-Friendly</span>
                <br />
                <span className="text-white">E-Waste Collection</span>
                <br />
                <span className="text-white/70 text-4xl lg:text-5xl">Made Simple</span>
              </h1>

              <p className="text-lg mb-10 text-white/65 max-w-lg leading-relaxed animate-slide-up-delay-2">
                Schedule drone pickup for your electronic waste, earn EcoPoints, and help save the planet, one device at a time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-slide-up-delay-3">
                <Link href="/request-pickup">
                  <Button size="lg" className="btn-glow bg-gradient-to-r from-eco-green to-emerald-500 hover:from-emerald-400 hover:to-eco-green text-white border-0 font-semibold px-7 h-12 rounded-xl shadow-eco transition-all duration-300 gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule Pickup
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white/20 text-white bg-white/8 backdrop-blur-sm hover:bg-white/15 h-12 rounded-xl gap-2 transition-all duration-300">
                  <Play className="w-4 h-4" />
                  How It Works
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-10 animate-slide-up-delay-4">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Shield className="w-3.5 h-3.5 text-eco-green" />
                  <span>Secure & Certified</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Leaf className="w-3.5 h-3.5 text-eco-green" />
                  <span>Carbon Neutral Service</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reward Program</span>
                </div>
              </div>
            </div>

            {/* Right image card */}
            <div className="relative animate-slide-in-right">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden relative shadow-eco-xl">
                <img
                  src="/assets/drone.png"
                  alt="Drone delivering e-waste pickup at sunset"
                  className="w-full h-full object-cover object-center"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Floating labels */}
                <div className="absolute top-4 left-4 glass-dark rounded-2xl p-3 animate-float">
                  <p className="text-white font-display font-bold text-sm">Drone E-Waste Collection</p>
                  <p className="text-white/65 text-xs mt-0.5">AI-Powered Recycling Service</p>
                </div>

                <div className="absolute top-4 right-4 glass-dark rounded-xl p-3 animate-float-slow text-center">
                  <div className="text-white font-display font-bold text-xl">50+</div>
                  <div className="text-white/65 text-xs">pts / pickup</div>
                </div>

                <div className="absolute bottom-4 left-4 glass-dark rounded-xl p-3 text-center animate-float" style={{ animationDelay: '1s' }}>
                  <div className="text-white font-display font-bold text-xl">24h</div>
                  <div className="text-white/65 text-xs">Pickup Time</div>
                </div>

                <div className="absolute bottom-4 right-4 bg-gradient-to-r from-eco-green/90 to-eco-primary/90 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg animate-float-slow" style={{ animationDelay: '2s' }}>
                  <div className="flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-white" />
                    <div className="text-white text-xs font-semibold">Eco-Friendly</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- Features ------------------------------------------- */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-eco-primary/8 rounded-full px-4 py-1.5 mb-4">
              <Leaf className="w-3.5 h-3.5 text-eco-primary" />
              <span className="text-xs font-semibold text-eco-primary uppercase tracking-wide">Why Choose Us</span>
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">
              The Future of <span className="text-gradient-eco">E-Waste Recycling</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Experience cutting-edge drone technology and AI-powered classification for effortless eco-impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger">
            {features.map((f, i) => (
              <div key={i} className="card-premium p-8 group animate-slide-up text-center">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                  style={{ boxShadow: `0 8px 24px ${f.glow}` }}
                >
                  <f.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
                <div className="mt-5 flex items-center justify-center gap-1 text-eco-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* -- Environmental Impact Stats -------------------------- */}
      <section id="environmental-impact" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-eco-primary/8 rounded-full px-4 py-1.5 mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-eco-primary" />
              <span className="text-xs font-semibold text-eco-primary uppercase tracking-wide">Our Impact</span>
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">Environmental Impact Dashboard</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Track our collective progress in making the planet greener through e-waste recycling
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
            {statItems.map((s, i) => (
              <div key={i} className="card-premium p-6 animate-slide-up hover-lift text-center group">
                <div className={`w-14 h-14 bg-gradient-to-br ${s.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <div className="stat-number text-3xl font-bold text-gray-900 mb-1 animate-count-reveal">{s.value}</div>
                <div className="font-semibold text-gray-700 text-sm">{s.label}</div>
                <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* -- Personal Dashboard Card ----------------------------- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-premium overflow-hidden rounded-3xl shadow-eco-lg">
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-eco-primary via-eco-green to-teal-400" />

            <div className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-10 items-center">

                {/* Left: user info */}
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-eco-primary to-eco-green rounded-2xl flex items-center justify-center shadow-eco">
                        <span className="text-white font-display font-bold text-xl">
                          {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                        <Zap className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-2xl text-gray-900">
                        Welcome back, {user.name.split(" ")[0]}!
                      </h2>
                      <p className="text-eco-primary font-semibold text-sm">{user.level} &middot; EcoScrap Champion</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      { label: "Current Level", value: user.level, icon: Leaf, color: "text-eco-green" },
                      { label: "Total EcoPoints", value: user.ecoPoints.toLocaleString(), icon: TrendingUp, color: "text-amber-500" },
                      { label: "E-Waste Recycled", value: `${user.totalWeight} kg`, icon: Recycle, color: "text-eco-blue" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="text-gray-500 text-sm">{item.label}:</span>
                        <span className="font-bold text-gray-900 text-sm ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/request-pickup">
                      <Button size="lg" className="btn-glow bg-gradient-to-r from-eco-primary to-eco-green text-white border-0 gap-2 font-semibold rounded-xl h-11">
                        <Calendar className="w-4 h-4" />
                        Schedule New Pickup
                      </Button>
                    </Link>
                    <Link href="/rewards">
                      <Button variant="outline" size="lg" className="border-eco-primary/30 text-eco-primary hover:bg-eco-primary hover:text-white transition-all duration-300 gap-2 font-semibold rounded-xl h-11">
                        <TrendingUp className="w-4 h-4" />
                        View Rewards
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right: impact card */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-eco-primary/8 via-eco-green/5 to-teal-50 rounded-3xl p-8 border border-eco-primary/12">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-eco-primary to-eco-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-eco animate-pulse-glow">
                        <Recycle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-display font-bold text-xl text-eco-primary mb-1">Your Impact</h3>
                      <p className="text-gray-500 text-sm">Every pickup contributes to a greener planet. Keep it up!</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Level", value: user.level, sub: "rank" },
                        { label: "Points", value: user.ecoPoints.toLocaleString(), sub: "earned" },
                        { label: "Recycled", value: `${user.totalWeight}kg`, sub: "e-waste" },
                        { label: "CO2", value: `${(parseFloat(user.totalWeight) * 0.4).toFixed(1)}kg`, sub: "saved" },
                      ].map((item, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 text-center border border-eco-primary/8 shadow-sm">
                          <div className="stat-number text-lg font-bold text-eco-primary">{item.value}</div>
                          <div className="text-xs text-gray-400">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Champion badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white">
                    Champion
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


