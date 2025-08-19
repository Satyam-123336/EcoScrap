import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PickupTable from "@/components/admin/pickup-table";
import { 
  Clock, 
  Zap, 
  CheckCircle, 
  DollarSign,
  Filter,
  Download
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: pickupRequests } = useQuery({
    queryKey: ['/api/pickup-requests'],
    refetchInterval: 30000,
  });

  const completePickupMutation = useMutation({
    mutationFn: async (pickupId: string) => {
      const response = await apiRequest('PUT', `/api/pickup-requests/${pickupId}/complete`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pickup-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Pickup Completed",
        description: `Pickup ${data.id} has been marked as completed. User earned ${data.pointsAwarded} EcoPoints!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete pickup.",
        variant: "destructive",
      });
    },
  });

  const handleCompletePickup = (pickupId: string) => {
    completePickupMutation.mutate(pickupId);
  };

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Manage pickup requests and system operations</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{(stats as any)?.pending || 0}</div>
                  <div className="text-sm text-gray-600">Pending Requests</div>
                </div>
                <Clock className="w-8 h-8 text-eco-amber" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{(stats as any)?.inProgress || 0}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <Zap className="w-8 h-8 text-eco-blue" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{(stats as any)?.completedToday || 0}</div>
                  <div className="text-sm text-gray-600">Completed Today</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{(stats as any)?.totalPickups || 0}</div>
                  <div className="text-sm text-gray-600">Total Pickups</div>
                </div>
                <DollarSign className="w-8 h-8 text-eco-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pickup Requests Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Pickup Requests</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-1" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PickupTable
              requests={(pickupRequests as any) || []}
              onComplete={handleCompletePickup}
              isLoading={completePickupMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
