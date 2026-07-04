import { Leaf, Github, Twitter, Linkedin, Mail, ArrowRight, Recycle } from "lucide-react";
import { Link } from "wouter";

const footerLinks = {
  "Platform": [
    { label: "Request Pickup", href: "/request-pickup" },
    { label: "My Rewards", href: "/rewards" },
    { label: "Profile", href: "/profile" },
  ],
  "About": [
    { label: "How It Works", href: "/" },
    { label: "Environmental Impact", href: "/#environmental-impact" },
    { label: "Meet the Creators", href: "/creators" },
    { label: "FAQ", href: "/faq" },
  ],
  "Legal": [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ],
};

const socialLinks = [
  { icon: Github, href: "https://github.com/Satyam-123336/EcoScrap", label: "GitHub" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/satyamsam10/", label: "LinkedIn" },
  { icon: Mail, href: "mailto:demo@ecoscrappickup.com", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="footer-bg text-gray-300">
      <div className="section-divider" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-eco-primary to-eco-green rounded-xl flex items-center justify-center shadow-eco">
                <Leaf className="w-4 h-4 text-white animate-leaf-sway" />
              </div>
              <span className="font-display font-bold text-xl">
                <span className="text-eco-green">Eco</span>
                <span className="text-white">Scrap</span>
                <span className="text-gray-400 text-base ml-1">Pickup</span>
              </span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              AI-powered e-waste collection platform making sustainable recycling accessible, rewarding, and effortless for everyone.
            </p>

            <div className="flex gap-5">
              {[
                { label: "E-Waste Recycled", value: "100+ kg" },
                { label: "Happy Users", value: "500+" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-white font-display font-bold text-lg">{stat.value}</div>
                  <div className="text-gray-500 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={social.label}
                  className="w-8 h-8 bg-white/5 hover:bg-eco-primary/20 border border-white/8 hover:border-eco-primary/40 rounded-lg flex items-center justify-center text-gray-400 hover:text-eco-green transition-all duration-200"
                >
                  <social.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-display font-semibold text-sm mb-4 uppercase tracking-wider">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href}>
                      <span 
                        onClick={() => {
                          if (link.href === "/" || link.href === "") {
                            // Always scroll to very top of the page
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          } else if (link.href.includes('#')) {
                            const id = link.href.split('#')[1];
                            const elem = document.getElementById(id);
                            if (elem) {
                              elem.scrollIntoView({ behavior: "smooth" });
                            }
                          }
                        }}
                        className="text-gray-400 hover:text-eco-green text-sm transition-colors duration-200 cursor-pointer flex items-center gap-1 group"
                      >
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-eco-green" />
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="section-divider mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Recycle className="w-3.5 h-3.5 text-eco-green" />
            <span>&copy; 2026 EcoScrap Pickup. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <span>Built with</span>
            <Recycle className="w-3.5 h-3.5 text-eco-green" />
            <span>for a greener future</span>
          </div>
        </div>
      </div>
    </footer>
  );
}