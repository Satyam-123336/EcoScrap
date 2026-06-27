import { User } from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Plus, Download, Share, Star, Recycle, Leaf, TrendingUp, Bell, Check } from "lucide-react";

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
    defaultValues: { name: user.name, email: user.email, phone: user.phone, address: user.address },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", `/api/user/${user.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      onUpdate(updatedUser);
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadHistory = async () => {
    try {
      const response = await apiRequest("GET", `/api/pickup-requests/user/${user.id}`);
      const data = await response.json();
      const csvContent = "data:text/csv;charset=utf-8,"
        + "Date,Time Slot,Type,Weight (kg),Status\n"
        + data.map((row: any) => `${new Date(row.createdAt).toLocaleDateString()},${row.pickupTimeSlot || "Not Specified"},${row.eWasteType},${row.weight},${row.status}`).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `EcoScrap_History_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast({ title: "History Downloaded", description: "Your pickup history has been saved." });
    } catch {
      toast({ title: "Download Failed", description: "Could not fetch your history.", variant: "destructive" });
    }
  };

  const handleReferFriends = () => {
    navigator.clipboard.writeText(`https://ecoscrap.pickup/join?ref=${user.id}`);
    toast({ title: "Link Copied!", description: "Your referral link has been copied." });
  };

  const co2Saved = parseFloat(user.totalWeight) * 0.4;
  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const notifItems = {
    pickupConfirmations: { title: "Pickup Confirmations", description: "Get notified when your pickup is confirmed", icon: Check },
    rewardUpdates: { title: "Reward Updates", description: "Get notified when you earn EcoPoints", icon: Star },
    environmentalTips: { title: "Environmental Tips", description: "Receive weekly eco-friendly tips", icon: Leaf },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header strip */}
      <section className="bg-gradient-to-br from-eco-primary to-eco-green py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center border-2 border-white/30 backdrop-blur-sm shadow-lg">
                <span className="font-display font-bold text-3xl text-white">{initials}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-white">{user.name}</h1>
              <p className="text-white/65 text-sm mt-0.5">{user.level} · Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal Information */}
            <div className="card-premium p-6">
              <h2 className="font-display font-bold text-lg text-gray-900 mb-5 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-eco-primary" />
                Personal Information
              </h2>
              <form onSubmit={form.handleSubmit(data => updateProfileMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "name", label: "Full Name", type: "text", field: "name" as const },
                    { id: "email", label: "Email Address", type: "email", field: "email" as const },
                    { id: "phone", label: "Phone Number", type: "text", field: "phone" as const },
                  ].map(({ id, label, type, field }) => (
                    <div key={id}>
                      <Label htmlFor={id} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</Label>
                      <Input id={id} type={type} {...form.register(field)} className="mt-1.5 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-eco-primary text-sm" />
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Member Since</Label>
                    <Input value={new Date(user.createdAt).toLocaleDateString()} readOnly className="mt-1.5 h-10 rounded-xl border-gray-200 bg-gray-100 text-sm text-gray-500 cursor-not-allowed" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</Label>
                    <Input id="address" {...form.register("address")} className="mt-1.5 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-eco-primary text-sm" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={updateProfileMutation.isPending} className="btn-glow bg-gradient-to-r from-eco-primary to-eco-green text-white border-0 rounded-xl font-semibold px-6 h-10 gap-2">
                    {updateProfileMutation.isPending ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</>
                    ) : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Notification Preferences */}
            <div className="card-premium p-6">
              <h2 className="font-display font-bold text-lg text-gray-900 mb-5 flex items-center gap-2">
                <Bell className="w-4 h-4 text-eco-primary" />
                Notification Preferences
              </h2>
              <div className="space-y-4">
                {Object.entries(notifItems).map(([key, { title, description, icon: Icon }]) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-eco-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-eco-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-eco-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{title}</div>
                        <div className="text-xs text-gray-400">{description}</div>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[key as keyof NotificationSettings]}
                      onCheckedChange={() => toggleNotification(key as keyof NotificationSettings)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Environmental Impact */}
            <div className="card-premium p-5">
              <h3 className="font-display font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-eco-primary" />
                Environmental Impact
              </h3>
              <div className="space-y-3">
                {[
                  { label: "E-Waste Recycled", value: `${user.totalWeight} kg`, icon: Recycle, color: "text-eco-primary" },
                  { label: "CO2 Saved", value: `${co2Saved.toFixed(1)} kg`, icon: Leaf, color: "text-emerald-500" },
                  { label: "EcoPoints", value: user.ecoPoints.toLocaleString(), icon: Star, color: "text-amber-500" },
                  { label: "Current Level", value: user.level, icon: TrendingUp, color: "text-violet-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <span className="text-xs text-gray-500">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card-premium p-5">
              <h3 className="font-display font-bold text-base text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2.5">
                <Link href="/request-pickup">
                  <Button className="w-full justify-start gap-2.5 bg-gradient-to-r from-eco-primary to-eco-green text-white border-0 rounded-xl font-medium h-10 hover:shadow-eco transition-all">
                    <Plus className="w-4 h-4" />
                    New Pickup Request
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start gap-2.5 rounded-xl border-gray-200 text-gray-700 hover:border-eco-primary/30 hover:text-eco-primary hover:bg-eco-primary/5 font-medium h-10 transition-all" onClick={handleDownloadHistory}>
                  <Download className="w-4 h-4" />
                  Download History
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2.5 rounded-xl border-gray-200 text-gray-700 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 font-medium h-10 transition-all" onClick={handleReferFriends}>
                  <Share className="w-4 h-4" />
                  Refer Friends
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

