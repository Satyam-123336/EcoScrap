import { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import EcoPointsCard from "@/components/rewards/eco-points-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Recycle, 
  Trophy, 
  Download,
  Award,
  Smartphone,
  Plug,
  Battery,
  Laptop
} from "lucide-react";

interface RewardsProps {
  user: User;
}

const getEWasteIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'mobile': return Smartphone;
    case 'charger': return Plug;
    case 'battery': return Battery;
    default: return Laptop;
  }
};

export default function Rewards({ user }: RewardsProps) {
  const { data: pickups } = useQuery({
    queryKey: ['/api/pickup-requests/user', user.id],
  });

  const { data: certificates } = useQuery({
    queryKey: ['/api/certificates/user', user.id],
  });

  const completedPickups = pickups?.filter((pickup: any) => pickup.status === 'completed') || [];
  const totalCO2Saved = completedPickups.reduce((sum: number, pickup: any) => 
    sum + (parseFloat(pickup.weight) * 0.4), 0
  );

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My EcoRewards</h1>
          <p className="text-gray-600">Track your environmental impact and earn rewards</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Points Balance Card */}
          <div className="bg-gradient-to-br from-eco-primary to-eco-green text-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8" />
              <span className="text-sm opacity-90">Available Points</span>
            </div>
            <div className="text-3xl font-bold mb-2">{user.ecoPoints.toLocaleString()}</div>
            <div className="text-sm opacity-90">EcoPoints Balance</div>
          </div>

          {/* Impact Stats Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Recycle className="w-8 h-8 text-eco-primary" />
              <span className="text-sm text-gray-600">Total Impact</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{user.totalWeight} kg</div>
            <div className="text-sm text-gray-600">E-Waste Recycled</div>
          </div>

          {/* Level Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 text-eco-amber" />
              <span className="text-sm text-gray-600">Current Level</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{user.level}</div>
            <div className="text-sm text-gray-600">
              {user.ecoPoints < 1000 ? `Next: Eco Champion (${1000 - user.ecoPoints} pts)` : 
               user.ecoPoints < 2500 ? `Next: Eco Legend (${2500 - user.ecoPoints} pts)` :
               user.ecoPoints < 5000 ? `Next: Eco Master (${5000 - user.ecoPoints} pts)` :
               'Max Level Reached!'}
            </div>
          </div>
        </div>

        {/* Recent Pickups */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            {completedPickups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No completed pickups yet. Schedule your first pickup to earn rewards!
              </div>
            ) : (
              <div className="space-y-4">
                {completedPickups.slice(0, 5).map((pickup: any) => {
                  const IconComponent = getEWasteIcon(pickup.eWasteType);
                  return (
                    <div key={pickup.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-eco-light/20 rounded-lg flex items-center justify-center mr-4">
                          <IconComponent className="w-6 h-6 text-eco-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{pickup.eWasteType}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(pickup.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-eco-primary">+{pickup.pointsAwarded} points</div>
                        <div className="text-sm text-green-600">Completed</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Green Certificates */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6 text-green-600" />
                Digital Green Certificates
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!certificates || certificates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No certificates earned yet. Complete your first pickup to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.map((cert: any) => (
                  <div key={cert.id} className="bg-white rounded-lg p-4 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{cert.title}</h4>
                        <p className="text-sm text-gray-600">{cert.description}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          Issued: {new Date(cert.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
