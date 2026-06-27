import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Leaf, 
  Recycle, 
  Zap, 
  Award, 
  MessageCircle,
  ShieldCheck,
  Clock
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "pickup" | "rewards" | "security";
}

const faqs: FAQItem[] = [
  {
    category: "general",
    question: "What is EcoScrap Pickup and how does it work?",
    answer: "EcoScrap Pickup is an AI-powered electronic waste recycling platform. You simply select your e-waste items, upload photos for AI classification, and pick a convenient time slot. Our automated drone or courier dispatch system collects the items from your location. Once verified and completed, your account is automatically credited with EcoPoints and an official sustainability certificate."
  },
  {
    category: "general",
    question: "What exact categories of e-waste do you accept?",
    answer: "Our platform specifically accepts 8 core categories of electronic waste: Mobile Phones, Audio Devices (headphones/speakers), Batteries, Charging Accessories (cables/adapters), Keyboards, Mice, Hard Drives, and Small Electronics/CPUs. You can select multiple categories in a single pickup request."
  },
  {
    category: "general",
    question: "How can I get instant answers or recycling tips while browsing?",
    answer: "You can chat with EcoBot, our built-in 24/7 AI recycling assistant located at the bottom right corner of your screen. EcoBot provides instant guidance on device preparation, recycling guidelines, and reward explanations."
  },
  {
    category: "pickup",
    question: "What time slots are available for scheduling a pickup?",
    answer: "During checkout, you can choose from three convenient 3-hour daily time slots: Morning (9 AM - 12 PM), Afternoon (12 PM - 3 PM), or Evening (3 PM - 6 PM). Our GPS-precision tracking ensures accurate arrivals."
  },
  {
    category: "pickup",
    question: "How does AI photo classification assist my pickup?",
    answer: "When scheduling a request, you upload photos of your items. Our AI vision model analyzes the equipment to estimate category classification and ensure proper handling equipment or drone payload capacities are assigned prior to dispatch."
  },
  {
    category: "rewards",
    question: "How are EcoPoints calculated for my recycled e-waste?",
    answer: "We use a transparent, standardized reward formula: you earn exactly 50 EcoPoints for every 1 kg of verified e-waste recycled (Points = Weight × 50). For example, a 2.5 kg collection instantly awards 125 EcoPoints to your balance."
  },
  {
    category: "rewards",
    question: "What are the EcoScrap rank tiers and how do I level up?",
    answer: "All users begin at 'Eco Beginner'. As you accumulate EcoPoints, your champion rank upgrades automatically: reaching 1,000 points unlocks 'Eco Champion', 2,500 points achieves 'Eco Legend', and 5,000 points grants our highest elite rank, 'Eco Master'."
  },
  {
    category: "rewards",
    question: "How does EcoScrap track my carbon emission savings and certificates?",
    answer: "Every kilogram of e-waste recycled through EcoScrap saves approximately 0.4 kg of atmospheric CO₂ emissions. Upon completion of each pickup, our system generates an official, verified 'Eco Champion Certificate' detailing your exact recycled weight and CO₂ reduction, accessible anytime on your Rewards dashboard."
  },
  {
    category: "security",
    question: "How do I ensure my personal data is secure before recycling storage devices?",
    answer: "We strongly recommend performing a factory reset or formatting hard drives, smartphones, and laptops before handover. Once received at our ISO-certified processing facilities, all data-bearing hardware undergoes rigorous physical degaussing and destruction protocols to guarantee complete data elimination."
  }
];

const categories = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "general", label: "General", icon: Leaf },
  { id: "pickup", label: "Pickups & Drones", icon: Zap },
  { id: "rewards", label: "EcoPoints & Rewards", icon: Award },
  { id: "security", label: "Security & Safety", icon: ShieldCheck },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Hero Header */}
      <section className="hero-mesh text-white py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass-dark rounded-full px-4 py-1.5 mb-6 animate-slide-up">
            <HelpCircle className="w-4 h-4 text-eco-green animate-pulse" />
            <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">Help Center</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-6 animate-slide-up-delay-1">
            Frequently Asked <span className="text-gradient-hero">Questions</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8 animate-slide-up-delay-2">
            Everything you need to know about AI-powered e-waste recycling, drone pickups, and earning EcoPoints.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto relative animate-slide-up-delay-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search questions (e.g. drone pickup, points, data safety)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-14 bg-white/95 backdrop-blur-md text-gray-900 placeholder:text-gray-500 rounded-2xl border-0 shadow-eco-lg focus-visible:ring-2 focus-visible:ring-eco-green text-base"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-20">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer shadow-sm ${
                  isActive
                    ? "bg-gradient-to-r from-eco-primary to-eco-green text-white shadow-eco scale-105 ring-2 ring-eco-green/30"
                    : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-eco-primary"}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-md p-12 text-center bg-white">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg text-gray-800 mb-2">No matching questions found</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                We couldn't find any FAQs matching "{searchQuery}". Try searching with different keywords or browse by category.
              </p>
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                className="border-eco-primary/30 text-eco-primary hover:bg-eco-primary hover:text-white rounded-xl"
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <Card 
                  key={index} 
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? "border-eco-green/40 shadow-eco bg-white" 
                      : "border-gray-200/80 shadow-sm hover:shadow-md bg-white/90"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="font-display font-bold text-lg text-gray-900 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-eco-green flex-shrink-0" />
                      {faq.question}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 ${
                      isOpen ? "bg-eco-primary text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-gray-600 leading-relaxed text-base border-t border-gray-100/80 animate-fadeIn">
                      <p className="pl-5 border-l-2 border-eco-green/60 py-1">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Contact Support Footer Card */}
        <div className="mt-12 bg-gradient-to-br from-eco-primary/10 via-eco-green/10 to-teal-50 rounded-3xl p-8 border border-eco-primary/20 text-center shadow-sm">
          <div className="w-12 h-12 bg-gradient-to-br from-eco-primary to-eco-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-eco">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
            Can't find the answer you're looking for? Reach out to our dedicated sustainability support team.
          </p>
          <a href="mailto:demo@ecoscrappickup.com">
            <Button className="btn-glow bg-gradient-to-r from-eco-primary to-eco-green text-white font-semibold rounded-xl px-6 h-11 shadow-eco gap-2">
              Contact Support
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
