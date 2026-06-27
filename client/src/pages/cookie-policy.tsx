import { Card, CardContent } from "@/components/ui/card";
import { Cookie, Shield, Lock, Eye, CheckCircle2 } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-eco-primary/10 rounded-full px-4 py-1.5 mb-4">
            <Cookie className="w-4 h-4 text-eco-primary" />
            <span className="text-xs font-semibold text-eco-primary uppercase tracking-wide">Legal & Privacy</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600">Effective Date: June 2026 &middot; EcoScrap Pickup Platform</p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-eco-green flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Essential Cookies</h3>
            <p className="text-xs text-gray-500">Strictly required for account authentication and drone dispatch tracking.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Secure Storage</h3>
            <p className="text-xs text-gray-500">Encrypted session tokens to keep your EcoPoints and profile safe.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">No Third-Party Ads</h3>
            <p className="text-xs text-gray-500">We never sell your cookie data or track you across external ad networks.</p>
          </div>
        </div>

        {/* Detailed Policy Card */}
        <Card className="rounded-3xl border-0 shadow-eco-lg overflow-hidden bg-white">
          <div className="h-1.5 bg-gradient-to-r from-eco-primary via-eco-green to-teal-400" />
          <CardContent className="p-8 sm:p-12 text-gray-700 leading-relaxed space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-eco-green rounded-full" />
                1. What Are Cookies?
              </h2>
              <p className="text-gray-600">
                Cookies are small text files stored on your device (computer, tablet, or smartphone) when you visit our website. They enable the EcoScrap Pickup platform to recognize your browser, remember your preferences, and maintain continuous session authentication while scheduling e-waste collections.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-eco-green rounded-full" />
                2. How We Use Cookies
              </h2>
              <p className="text-gray-600 mb-4">
                We use cookies to deliver and improve our seamless e-waste recycling service. Specifically, our cookies serve the following operational functions:
              </p>
              <div className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-eco-green flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block">Authentication & Session State</strong>
                    <span className="text-sm text-gray-600">Remembers your login credentials so you don't have to re-enter them when switching between your Pickup Dashboard and Rewards page.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-eco-green flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block">AI Classification & Pickup Preferences</strong>
                    <span className="text-sm text-gray-600">Temporarily stores device classification photos and address inputs during the scheduling flow before final submission.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-eco-green flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block">Security & Fraud Prevention</strong>
                    <span className="text-sm text-gray-600">Protects API endpoints against cross-site request forgery (CSRF) and detects automated spam attempts.</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-eco-green rounded-full" />
                3. Managing Your Cookies
              </h2>
              <p className="text-gray-600">
                Most web browsers automatically accept cookies by default. You can change your browser settings to decline cookies or notify you whenever a cookie is set. However, please note that disabling essential authentication cookies will prevent you from logging into your account or scheduling drone pickups.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-eco-green rounded-full" />
                4. Updates to This Policy
              </h2>
              <p className="text-gray-600">
                We may periodically update this Cookie Policy to reflect changes in regulatory standards or platform capabilities. Any modifications will be posted directly on this page with an updated effective date.
              </p>
            </div>

            <div className="pt-6 border-t border-gray-100 text-sm text-gray-500">
              If you have any inquiries regarding our cookie management or privacy safeguards, please reach out to us at <a href="mailto:demo@ecoscrappickup.com" className="text-eco-primary font-semibold underline">demo@ecoscrappickup.com</a>.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
