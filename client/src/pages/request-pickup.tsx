import { User } from "@shared/schema";
import RequestForm from "@/components/pickup/request-form";
import { useSEO } from "@/hooks/use-seo";
import { Package, Camera, Calendar, ArrowRight } from "lucide-react";

interface RequestPickupProps {
  user: User;
}

export default function RequestPickup({ user }: RequestPickupProps) {
  useSEO({
    title: "Schedule E-Waste Pickup | EcoScrap",
    description: "Request an automated drone pickup for your electronic waste. Quick, simple, and eco-friendly.",
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "E-Waste Drone Pickup",
      "provider": { "@type": "Organization", "name": "EcoScrap Pickup" },
      "serviceType": "Electronic Waste Recycling",
      "areaServed": "Global"
    }
  });

  const steps = [
    { icon: Package, label: "Select Items", num: 1 },
    { icon: Camera, label: "Upload Photos", num: 2 },
    { icon: Calendar, label: "Schedule", num: 3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="hero-mesh py-14">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-5xl font-bold text-white mb-3 animate-slide-up">
            Request <span className="text-gradient-eco">E-Waste Pickup</span>
          </h1>
          <p className="text-white/60 text-lg mb-10 animate-slide-up-delay-1">
            Complete the form below to schedule your drone pickup in minutes
          </p>
          <div className="flex items-center justify-center gap-0 animate-slide-up-delay-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 glass-dark rounded-xl flex items-center justify-center border border-white/20 shadow-sm">
                    <step.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/65 text-xs font-medium hidden sm:block">{step.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex items-center mx-3 mb-4">
                    <div className="w-8 sm:w-16 h-px bg-white/20" />
                    <ArrowRight className="w-3 h-3 text-white/30 -mx-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-16">
        <RequestForm user={user} />
      </div>
    </div>
  );
}

