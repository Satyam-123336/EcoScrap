import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, Play, Recycle } from "lucide-react";

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
      {/* Hero Section */}
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
                  <Button size="lg" className="bg-white text-eco-primary hover:bg-gray-50">
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Pickup
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-eco-primary"
                >
                  <Play className="w-5 h-5 mr-2" />
                  How It Works
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <Recycle className="w-24 h-24 mx-auto mb-4 opacity-60" />
                  <p className="text-lg opacity-80">Drone E-Waste Collection</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-eco-amber text-eco-primary p-4 rounded-xl shadow-lg">
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm">Points per pickup</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-eco-primary mb-2">
                {(stats as any)?.totalPickups || 0}
              </div>
              <div className="text-gray-600">Total Pickups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-eco-primary mb-2">
                {(stats as any)?.wasteCollected || "0 kg"}
              </div>
              <div className="text-gray-600">E-Waste Collected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-eco-primary mb-2">
                {(stats as any)?.activeUsers || 0}
              </div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-eco-primary mb-2">
                {(stats as any)?.carbonSaved || "0 kg"}
              </div>
              <div className="text-gray-600">CO₂ Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Message */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome back, {user.name}!
              </h2>
              <p className="text-gray-600 mb-6">
                You're currently at <strong>{user.level}</strong> level with{" "}
                <strong>{user.ecoPoints.toLocaleString()} EcoPoints</strong>.
              </p>
              <p className="text-gray-600 mb-8">
                You've recycled <strong>{user.totalWeight} kg</strong> of e-waste so far. 
                Keep up the great work making our planet greener!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/request-pickup">
                  <Button size="lg">
                    Schedule New Pickup
                  </Button>
                </Link>
                <Link href="/rewards">
                  <Button variant="outline" size="lg">
                    View My Rewards
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
