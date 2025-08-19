import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface EcoPointsCardProps {
  points: number;
  level: string;
}

export default function EcoPointsCard({ points, level }: EcoPointsCardProps) {
  return (
    <Card className="bg-gradient-to-br from-eco-primary to-eco-green text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Star className="w-8 h-8" />
          <span className="text-sm opacity-90">Available Points</span>
        </div>
        <div className="text-3xl font-bold mb-2">{points.toLocaleString()}</div>
        <div className="text-sm opacity-90">EcoPoints Balance</div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-sm opacity-90">Current Level</div>
          <div className="font-semibold">{level}</div>
        </div>
      </CardContent>
    </Card>
  );
}
