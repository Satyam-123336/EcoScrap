import { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Star, Recycle, Trophy, Download, Award, Smartphone, Plug, Battery, Laptop,
  TrendingUp, Leaf, ArrowRight, Medal
} from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

interface RewardsProps { user: User; }

const getEWasteIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'mobile': return Smartphone;
    case 'charger': return Plug;
    case 'battery': return Battery;
    default: return Laptop;
  }
};

const downloadCertificate = (cert: any, userName: string) => {
  const W = 900, H = 620;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#f0fdf4'); bg.addColorStop(1, '#dcfce7');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 8; ctx.strokeRect(16, 16, W - 32, H - 32);
  ctx.strokeStyle = '#86efac'; ctx.lineWidth = 2; ctx.strokeRect(28, 28, W - 56, H - 56);
  const hdr = ctx.createLinearGradient(0, 0, W, 0);
  hdr.addColorStop(0, '#15803d'); hdr.addColorStop(1, '#16a34a');
  ctx.fillStyle = hdr; ctx.fillRect(40, 40, W - 80, 90);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 32px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('EcoScrap Pickup', W / 2, 80);
  ctx.font = '16px Georgia, serif'; ctx.fillText('Digital Green Certificate of Achievement', W / 2, 110);
  ctx.fillStyle = '#14532d'; ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText(cert.title || 'Eco Champion Certificate', W / 2, 185);
  ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(100, 200); ctx.lineTo(W - 100, 200); ctx.stroke();
  ctx.fillStyle = '#374151'; ctx.font = 'italic 18px Georgia, serif'; ctx.fillText('This certifies that', W / 2, 235);
  ctx.fillStyle = '#15803d'; ctx.font = 'bold 36px Georgia, serif'; ctx.fillText(userName, W / 2, 280);
  ctx.fillStyle = '#374151'; ctx.font = '16px Arial, sans-serif'; ctx.fillText(cert.description || '', W / 2, 320);
  const stats = [{ label: 'Weight Recycled', value: `${cert.weight} kg` }, { label: 'CO\u2082 Saved', value: `${parseFloat(cert.co2Saved || '0').toFixed(1)} kg` }];
  const colW = (W - 80) / stats.length;
  stats.forEach((s, i) => {
    const cx = 40 + colW * i + colW / 2;
    ctx.fillStyle = '#f0fdf4'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') { (ctx as any).roundRect(cx - 120, 350, 240, 80, 12); } else { ctx.rect(cx - 120, 350, 240, 80); }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#16a34a'; ctx.font = 'bold 22px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(s.value, cx, 395);
    ctx.fillStyle = '#6b7280'; ctx.font = '13px Arial, sans-serif'; ctx.fillText(s.label, cx, 415);
  });
  ctx.fillStyle = '#9ca3af'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
  ctx.fillText(`Certificate ID: ${cert.id?.substring(0, 18)}...`, 60, 490);
  ctx.textAlign = 'right'; ctx.fillText(`Issued: ${new Date(cert.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, W - 60, 490);
  ctx.textAlign = 'center'; ctx.fillStyle = '#15803d'; ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText('Verified by EcoScrap Pickup Platform', W / 2, 550);
  ctx.fillStyle = '#9ca3af'; ctx.font = '11px Arial, sans-serif'; ctx.fillText('Eco-friendly e-waste recycling service | ecoscrap.pickup', W / 2, 570);
  const link = document.createElement('a');
  link.download = `EcoScrap-Certificate-${cert.id?.substring(0, 8) || 'cert'}.png`;
  link.href = canvas.toDataURL('image/png'); link.click();
};

export default function Rewards({ user }: RewardsProps) {
  useSEO({
    title: "Rewards & EcoPoints | EcoScrap Pickup",
    description: "Earn EcoPoints for every pickup. Track your certificates and redeem points for sustainable rewards.",
    schema: { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{ "@type": "Question", "name": "How do I earn EcoPoints?", "acceptedAnswer": { "@type": "Answer", "text": "You earn EcoPoints by scheduling e-waste pickups." } }] }
  });

  const { data: pickups } = useQuery({ queryKey: ['/api/pickup-requests/user', user.id] });
  const { data: certificates } = useQuery({ queryKey: ['/api/certificates/user', user.id] });

  const completedPickups = (pickups as any)?.filter((p: any) => p.status === 'completed') || [];
  const totalCO2Saved = completedPickups.reduce((sum: number, p: any) => sum + (parseFloat(p.weight) * 0.4), 0);

  const nextLevelInfo = user.ecoPoints < 1000
    ? { next: "Eco Champion", remaining: 1000 - user.ecoPoints, pct: (user.ecoPoints / 1000) * 100 }
    : user.ecoPoints < 2500
    ? { next: "Eco Legend", remaining: 2500 - user.ecoPoints, pct: ((user.ecoPoints - 1000) / 1500) * 100 }
    : user.ecoPoints < 5000
    ? { next: "Eco Master", remaining: 5000 - user.ecoPoints, pct: ((user.ecoPoints - 2500) / 2500) * 100 }
    : { next: "Max Level!", remaining: 0, pct: 100 };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <section className="hero-mesh py-16 relative">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass-dark rounded-full px-4 py-1.5 mb-4 animate-slide-up">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-white/75 uppercase tracking-wide">Rewards Dashboard</span>
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-3 animate-slide-up-delay-1">
            My <span className="text-gradient-eco">EcoRewards</span>
          </h1>
          <p className="text-white/55 text-lg animate-slide-up-delay-2">Track your environmental impact and earn badges</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">

        {/* Stats cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 stagger">

          <div className="card-premium p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-md">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Balance</span>
            </div>
            <div className="stat-number text-4xl font-bold text-gray-900 mb-1">{user.ecoPoints.toLocaleString()}</div>
            <div className="text-sm text-gray-500 font-medium">EcoPoints Available</div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Progress to {nextLevelInfo.next}</span>
                <span>{Math.round(nextLevelInfo.pct)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(nextLevelInfo.pct, 100)}%` }}
                />
              </div>
              {nextLevelInfo.remaining > 0 && (
                <p className="text-xs text-gray-400 mt-1">{nextLevelInfo.remaining} pts to reach {nextLevelInfo.next}</p>
              )}
            </div>
          </div>

          <div className="card-premium p-6 animate-slide-up-delay-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-eco-primary to-eco-green rounded-2xl flex items-center justify-center shadow-md">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Impact</span>
            </div>
            <div className="stat-number text-4xl font-bold text-gray-900 mb-1">{user.totalWeight} kg</div>
            <div className="text-sm text-gray-500 font-medium">E-Waste Recycled</div>
            <div className="mt-4 flex items-center gap-2 text-eco-primary text-xs font-medium">
              <Leaf className="w-3.5 h-3.5" />
              <span>{totalCO2Saved.toFixed(1)} kg CO2 prevented</span>
            </div>
          </div>

          <div className="card-premium p-6 animate-slide-up-delay-2">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rank</span>
            </div>
            <div className="stat-number text-4xl font-bold text-gray-900 mb-1">{user.level}</div>
            <div className="text-sm text-gray-500 font-medium">Current Level</div>
            <div className="mt-4 flex items-center gap-2 text-violet-600 text-xs font-medium">
              <Medal className="w-3.5 h-3.5" />
              <span>
                {user.ecoPoints < 5000 ? `${nextLevelInfo.remaining} pts to next rank` : "Highest rank achieved!"}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Pickups */}
        <div className="card-premium p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-gray-900">Recent Pickups</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{completedPickups.length} completed</span>
          </div>

          {completedPickups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Recycle className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">No completed pickups yet</p>
              <p className="text-gray-300 text-sm mt-1">Schedule your first pickup to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedPickups.map((pickup: any) => {
                const IconComponent = getEWasteIcon(pickup.eWasteType);
                const statusColor = pickup.status === 'completed' ? 'text-eco-green bg-eco-green/10' : pickup.status === 'in-progress' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50';
                return (
                  <div key={pickup.id} className="flex items-center justify-between py-3 px-4 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors border border-gray-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-eco-primary/15 to-eco-green/10 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-eco-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{pickup.eWasteType}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                            {pickup.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(pickup.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {pickup.address && ` · ${pickup.address}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {pickup.pointsAwarded > 0 && (
                        <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          +{pickup.pointsAwarded}
                        </div>
                      )}
                      {pickup.status === 'completed' && (
                        <div className="text-xs text-eco-green mt-0.5"> {(parseFloat(pickup.weight) * 0.4).toFixed(1)}kg CO2 saved
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Certificates */}
        <div className="card-premium p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display font-bold text-lg sm:text-xl text-gray-900 truncate">Digital Green Certificates</h2>
              <p className="text-xs text-gray-400 truncate">Download and share your eco achievements</p>
            </div>
          </div>

          {!(certificates as any) || (certificates as any).length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-green-600 font-semibold">No certificates yet</p>
              <p className="text-green-400 text-sm mt-1">Complete your first pickup to earn a certificate!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {(certificates as any).map((cert: any) => (
                <div key={cert.id} className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 sm:p-5 border border-green-100 hover:border-green-200 transition-colors group">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 w-full">
                      <h4 className="font-display font-bold text-gray-900 truncate">{cert.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 break-words">{cert.description}</p>
                      <div className="text-xs text-gray-400 mt-2">
                        Issued: {new Date(cert.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 w-full sm:w-auto justify-center border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 rounded-xl gap-1.5 transition-all"
                      onClick={() => downloadCertificate(cert, user.name)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


