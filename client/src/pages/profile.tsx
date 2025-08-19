import { User } from "@shared/schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  User as UserIcon,
  Plus,
  Download,
  Share,
  Star,
  Recycle
} from "lucide-react";

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface NotificationSettings {
  pickupConfirmations: boolean;
  rewardUpdates: boolean;
  environmentalTips: boolean;
}

export default function Profile({ user, onUpdate }: ProfileProps) {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    pickupConfirmations: true,
    rewardUpdates: true,
    environmentalTips: false,
  });
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest('PUT', `/api/user/${user.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      onUpdate(updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const co2Saved = parseFloat(user.totalWeight) * 0.4;

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Profile</h1>
          <p className="text-gray-600">Manage your account and environmental impact</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        {...form.register("phone")}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Member Since</Label>
                      <Input
                        value={new Date(user.createdAt).toLocaleDateString()}
                        readOnly
                        className="mt-1 bg-gray-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        {...form.register("address")}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries({
                    pickupConfirmations: {
                      title: "Pickup Confirmations",
                      description: "Get notified when your pickup is confirmed"
                    },
                    rewardUpdates: {
                      title: "Reward Updates", 
                      description: "Get notified when you earn EcoPoints"
                    },
                    environmentalTips: {
                      title: "Environmental Tips",
                      description: "Receive weekly eco-friendly tips"
                    }
                  }).map(([key, { title, description }]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{title}</div>
                        <div className="text-sm text-gray-600">{description}</div>
                      </div>
                      <Switch
                        checked={notifications[key as keyof NotificationSettings]}
                        onCheckedChange={() => toggleNotification(key as keyof NotificationSettings)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-eco-primary to-eco-green text-white rounded-xl p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold mb-2">{user.name}</h4>
                <div className="text-eco-light text-sm">{user.level}</div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">E-Waste Recycled</span>
                    <span className="font-semibold text-gray-900">{user.totalWeight} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CO₂ Saved</span>
                    <span className="font-semibold text-gray-900">{co2Saved.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">EcoPoints</span>
                    <span className="font-semibold text-eco-primary">{user.ecoPoints.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    New Pickup Request
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download History
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Share className="w-4 h-4 mr-2" />
                    Refer Friends
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
