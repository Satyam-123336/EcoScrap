import { User } from "@shared/schema";
import RequestForm from "@/components/pickup/request-form";
import { Button } from "@/components/ui/button"; // Importing Button component
import { useState } from "react"; // Import useState for managing button state
interface RequestPickupProps {
  user: User;
}
export default function RequestPickup({ user }: RequestPickupProps) {
const [isScheduling, setIsScheduling] = useState(false); // State to manage button text

const handleSchedulePickup = () => {
    // Logic to schedule pickup
    window.location.reload(); // Reload the page to show completion
  };

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Request E-Waste Pickup</h1>
          <p className="text-gray-600">Simple 3-step process to schedule your drone pickup</p>
        </div>

        <RequestForm user={user} />

      </div>
    </div>
  );
}

