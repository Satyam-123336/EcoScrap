import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: June 2026</p>
        </div>

        <Card>
          <CardContent className="p-8 prose prose-green max-w-none text-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 mt-0 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By accessing and using the EcoScrap Pickup platform, you accept and agree to be bound by the terms and provision of this agreement. 
              In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="mb-6">
              EcoScrap Pickup provides users with a platform to schedule, track, and manage e-waste pickups ("Service"). 
              You understand and agree that the Service is provided "AS-IS" and that EcoScrap assumes no responsibility for 
              the timeliness, deletion, mis-delivery, or failure to store any user communications or personalization settings.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Obligations regarding E-Waste</h2>
            <p className="mb-4">
              When utilizing our pickup services, you agree to the following obligations:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>All requested items must actually fall under the category of electronic waste (e-waste).</li>
              <li>You are responsible for wiping or destroying any personal or sensitive data from devices prior to pickup. EcoScrap Pickup is not liable for data breaches resulting from undeleted data on submitted devices.</li>
              <li>Hazardous materials not strictly classified as e-waste (e.g., leaking industrial batteries, medical waste) must not be included.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. EcoPoints and Reward System</h2>
            <p className="mb-6">
              EcoPoints are issued based on the type and weight of e-waste collected. These points have no cash value outside of the EcoScrap Pickup ecosystem and cannot be redeemed for fiat currency. EcoScrap reserves the right to modify the conversion rate of EcoPoints or terminate the reward program with 30 days prior notice.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Limitation of Liability</h2>
            <p className="mb-6">
              EcoScrap Pickup shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or the inability to use the service or for cost of procurement of substitute goods and services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Modifications to Service</h2>
            <p>
              We reserve the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that EcoScrap Pickup shall not be liable to you or to any third party for any modification, suspension or discontinuance of the Service.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
