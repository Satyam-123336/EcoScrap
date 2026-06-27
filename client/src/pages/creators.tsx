import { useSEO } from "@/hooks/use-seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Terminal,
  Cpu,
  Leaf,
  Github,
  Linkedin,
  Code,
  Zap,
  Globe,
  Award,
  ArrowRight,
  BrainCircuit
} from "lucide-react";
import { Link } from "wouter";

// ============================================================================
// 🛑 INVENTOR DETAILS (MODIFY THIS SECTION LATER)
// You can easily update names, initials, roles, bios, badges, and links below!
// ============================================================================
const inventors = [
  {
    id: "inventor-1",
    name: "Satyam Samanta",
    initials: "SS",
    role: "Lead Inventor & Full-Stack AI Engineer",
    domain: "Core Engineering & AI",
    bio: "Led the end-to-end design and development of EcoScrap Pickup, architecting the complete system including the web platform, backend services, AI-powered e-waste classification, database design, autonomous drone simulation, and overall product integration from concept to prototype.",
    badges: ["Full-Stack Development", "AI/ML", "System Architecture", "Drone Simulation"],
    github: "https://github.com/Satyam-123336/",
    linkedin: "https://www.linkedin.com/in/satyamsam10/",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    icon: Terminal
  },
  {
    id: "inventor-2",
    name: "Dr. Kriti Taneja",
    initials: "KT",
    role: "Research Supervisor & AI/ML Advisor",
    domain: "AI Research",
    bio: "Provided technical mentorship throughout the project, contributing to AI/ML model validation, dataset verification, research guidance, and evaluation of the overall system architecture to ensure technical robustness.",
    badges: ["AI Validation", "Dataset Verification", "Research Guidance", "Technical Review"],
    github: "https://github.com/kriti-taneja-0111/",
    linkedin: "https://www.linkedin.com/in/dr-kriti-taneja-ab5213147/",
    gradient: "from-amber-500 via-orange-500 to-red-600",
    icon: BrainCircuit
  },
  {
    id: "inventor-3",
    name: "Shivang Verma",
    initials: "SV",
    role: "Drone Hardware & Embedded Systems Engineer",
    domain: "Drone Hardware",
    bio: "Designed and assembled the physical drone platform, integrated the flight controller, propulsion system, electronic components, and onboard hardware required for future deployment of the autonomous e-waste collection system.",
    badges: ["Drone Assembly", "Embedded Systems", "Flight Controller", "Hardware Integration"],
    github: "https://github.com",
    linkedin: "https://www.linkedin.com/in/shivang-verma-60348a346/",
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    icon: Cpu
  }
];
// ============================================================================

export default function Creators() {
  useSEO({
    title: "Meet the Creators | EcoScrap Pickup",
    description: "Discover the engineering architects behind EcoScrap Pickup's autonomous drone dispatch and AI e-waste recycling platform.",
  });

  const pillars = [
    {
      icon: Zap,
      title: "AI-Powered Efficiency",
      desc: "Eliminating manual sorting friction by using machine learning vision models to instantly categorize electronic waste."
    },
    {
      icon: Globe,
      title: "Autonomous Logistics",
      desc: "Integrating simulated drone dispatch and smart route optimization for rapid, eco-friendly contactless pickups."
    },
    {
      icon: Award,
      title: "Gamified Sustainability",
      desc: "Rewarding positive environmental choices through real-time EcoPoints, tier ranks, and verified CO₂ reduction certificates."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Header */}
      <section className="hero-mesh text-white py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass-dark rounded-full px-4 py-1.5 mb-6 animate-slide-up border border-white/10 shadow-sm">
            <Code className="w-4 h-4 text-eco-green animate-pulse" />
            <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">Innovation & Engineering</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-slide-up-delay-1 tracking-tight">
            Meet the <span className="text-gradient-hero">Creators</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto mb-10 animate-slide-up-delay-2 leading-relaxed">
            The engineering architects behind EcoScrap Pickup&apos;s autonomous drone dispatch and AI e-waste classification platform.
          </p>

          <div className="flex justify-center items-center gap-4 animate-slide-up-delay-3">
            <Link href="/request-pickup">
              <Button size="lg" className="bg-gradient-to-r from-eco-primary to-eco-green text-white hover:opacity-95 shadow-eco-lg rounded-xl font-semibold px-6 py-6 transition-all scale-100 hover:scale-105">
                Schedule a Pickup <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Architects of a Greener Future
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Combining machine learning, robotics simulation, and environmental science to transform worldwide electronic waste recycling.
          </p>
        </div>

        {/* Creators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {inventors.map((inv) => {
            const DomainIcon = inv.icon;
            return (
              <Card
                key={inv.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 p-8 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Top Subtle Glow */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${inv.gradient}`} />

                <div>
                  {/* Monogram Badge (No Photo) */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${inv.gradient} p-0.5 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center`}>
                        <div className="w-full h-full bg-slate-900/90 rounded-[14px] flex items-center justify-center">
                          <span className="font-display text-2xl font-bold text-white tracking-wider">
                            {inv.initials}
                          </span>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center text-eco-primary">
                        <DomainIcon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-2">
                      <a
                        href={inv.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                        aria-label="GitHub Profile"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                      <a
                        href={inv.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-200/60 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
                        aria-label="LinkedIn Profile"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="mb-4">
                    <span className="inline-block text-xs font-semibold text-eco-primary uppercase tracking-wider bg-eco-light/30 px-3 py-1 rounded-full mb-2">
                      {inv.domain}
                    </span>
                    <h3 className="font-display text-2xl font-bold text-gray-900 group-hover:text-eco-primary transition-colors">
                      {inv.name}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">
                      {inv.role}
                    </p>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {inv.bio}
                  </p>
                </div>

                {/* Tech Badges */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1.5">
                    {inv.badges.map((badge, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold bg-gray-100/80 text-gray-700 px-2.5 py-1 rounded-md border border-gray-200/50"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Why We Built EcoScrap Section */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-eco-green/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center mb-12 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1 text-xs font-semibold text-eco-green mb-4 border border-white/10">
              <Leaf className="w-3.5 h-3.5" /> Our Engineering Philosophy
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Why We Built EcoScrap Pickup
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
              Electronic waste is the world&apos;s fastest-growing solid waste stream. We built EcoScrap to merge autonomous robotics and artificial intelligence into a seamless, accessible recycling experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {pillars.map((pillar, i) => {
              const PillarIcon = pillar.icon;
              return (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-eco-primary to-eco-green flex items-center justify-center text-white mb-4 shadow-md">
                    <PillarIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2 text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-white/65 text-xs sm:text-sm leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
