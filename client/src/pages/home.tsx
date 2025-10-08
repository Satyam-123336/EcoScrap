import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, Play, Recycle, Zap, TrendingUp, Users, Leaf } from "lucide-react";

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {}
      <section className="bg-gradient-to-br from-eco-primary to-eco-green text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="mb-10 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Eco-Friendly E-Waste Collection Made Simple
              </h1>
              <p className="text-xl mb-8 text-green-100">
                Schedule drone pickup for your electronic waste, get rewarded with EcoPoints, and help save the planet - one device at a time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/request-pickup">
                  <Button size="lg" className="bg-white text-eco-primary hover:bg-gray-50 hover:scale-105 hover:shadow-lg transition-all duration-300 transform">
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Pickup
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white bg-white/10"
                >
                  <Play className="w-5 h-5 mr-2" />
                  How It Works
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-white/20 to-white/5 rounded-2xl backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                {}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                    alt="Eco-friendly drone for e-waste collection"
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      // Fallback to a simple icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 bg-gradient-to-br from-eco-primary to-eco-green rounded-2xl flex items-center justify-center">
                    <Recycle className="w-16 h-16 text-white" />
                  </div>
                </div>

                {}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-left bg-black/40 backdrop-blur-md rounded-xl p-2 sm:p-4 max-w-[calc(100%-1rem)] sm:max-w-xs">
                  <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">Drone E-Waste Collection</h3>
                  <p className="text-xs sm:text-sm text-white/90">AI-Powered Recycling Service</p>
                </div>

                {}
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/25 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-white/40 shadow-lg">
                  <div className="text-center">
                    <div className="text-sm sm:text-lg font-bold text-black">50+</div>
                    <div className="text-xs text-black/90 font-medium hidden sm:block">Points per pickup</div>
                    <div className="text-xs text-black/90 font-medium sm:hidden">Points</div>
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white/25 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-white/40 shadow-lg">
                  <div className="text-center">
                    <div className="text-sm sm:text-lg font-bold text-black">24h</div>
                    <div className="text-xs text-black/90 font-medium hidden sm:block">Pickup time</div>
                    <div className="text-xs text-black/90 font-medium sm:hidden">Time</div>
                  </div>
                </div>

                {}
                <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-gradient-to-r from-eco-green/90 to-eco-primary/90 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-white/40 shadow-lg">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Leaf className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    <div className="text-xs text-white/90 font-medium hidden sm:block">Eco-Friendly</div>
                    <div className="text-xs text-white/90 font-medium sm:hidden">Eco</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose EcoScrap Pickup?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience the future of e-waste collection with cutting-edge drone technology and eco-friendly practices
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-eco-primary to-eco-green rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Recycle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Recycling</h3>
              <p className="text-gray-600">
                AI-powered e-waste classification ensures proper recycling and maximum environmental impact
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-eco-amber to-eco-orange rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Pickup</h3>
              <p className="text-gray-600">
                Schedule drone pickup in minutes and receive service within 24 hours for maximum convenience
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-eco-blue to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Earn Rewards</h3>
              <p className="text-gray-600">
                Collect EcoPoints for every pickup and unlock achievements while saving the planet
              </p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Environmental Impact Dashboard</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Track our collective progress in making the planet greener through e-waste recycling
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-eco-primary to-eco-green rounded-2xl mx-auto mb-4">
                <Recycle className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-eco-primary mb-2">
                  {(stats as any)?.totalPickups || 0}
                </div>
                <div className="text-gray-600 font-medium">Total Pickups</div>
                <div className="text-sm text-gray-500 mt-1">Successful collections</div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-eco-amber to-eco-orange rounded-2xl mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-eco-primary mb-2">
                  {(stats as any)?.wasteCollected || "0 kg"}
                </div>
                <div className="text-gray-600 font-medium">E-Waste Collected</div>
                <div className="text-sm text-gray-500 mt-1">Total weight recycled</div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-eco-blue to-blue-500 rounded-2xl mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-eco-primary mb-2">
                  {(stats as any)?.activeUsers || 0}
                </div>
                <div className="text-gray-600 font-medium">Active Users</div>
                <div className="text-sm text-gray-500 mt-1">Community members</div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-eco-green to-green-500 rounded-2xl mx-auto mb-4">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-eco-primary mb-2">
                  {(stats as any)?.carbonSaved || "0 kg"}
                </div>
                <div className="text-gray-600 font-medium">CO Saved</div>
                <div className="text-sm text-gray-500 mt-1">Environmental impact</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-eco-primary to-eco-green rounded-2xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Welcome back, {user.name}!
                      </h2>
                      <p className="text-eco-primary font-medium">EcoScrap Champion</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-12 lg:mb-16">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-eco-green/20 rounded-lg flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-eco-green" />
                      </div>
                      <div>
                        <span className="text-gray-600">Current Level: </span>
                        <span className="font-bold text-eco-primary">{user.level}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-eco-amber/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-eco-amber" />
                      </div>
                      <div>
                        <span className="text-gray-600">Total EcoPoints: </span>
                        <span className="font-bold text-eco-primary">{user.ecoPoints.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-eco-blue/20 rounded-lg flex items-center justify-center">
                        <Recycle className="w-4 h-4 text-eco-blue" />
                      </div>
                      <div>
                        <span className="text-gray-600">E-Waste Recycled: </span>
                        <span className="font-bold text-eco-primary">{user.totalWeight} kg</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/request-pickup">
                      <Button size="lg" className="bg-gradient-to-r from-eco-primary to-eco-green hover:from-eco-green hover:to-eco-primary transition-all duration-300">
                        <Calendar className="w-5 h-5 mr-2" />
                        Schedule New Pickup
                      </Button>
                    </Link>
                    <Link href="/rewards">
                      <Button variant="outline" size="lg" className="border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white transition-all duration-300">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        View My Rewards
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="bg-gradient-to-br from-eco-primary/10 to-eco-green/10 rounded-2xl p-8 border border-eco-primary/20">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-eco-primary to-eco-green rounded-full flex items-center justify-center mx-auto mb-4">
                        <Recycle className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-eco-primary mb-2">Your Impact</h3>
                      <p className="text-gray-600 text-sm">
                        Every pickup contributes to a greener planet. Keep up the amazing work!
                      </p>
                    </div>
                  </div>
                  
                  {}
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-eco-amber to-eco-orange text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
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

