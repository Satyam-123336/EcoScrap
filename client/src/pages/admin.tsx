import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  Download,
  Bot,
  Play,
  Pause,
  Square,
  RotateCcw,
  Activity
} from "lucide-react";

// Type definitions for simulation status
interface SimulationMissionStatus {
  isRunning: boolean;
  requestId: string | null;
  startTime: string | null;
}

interface SimulationServerStatus {
  url: string;
  healthy: boolean;
  monitoring: boolean;
}

interface SimulationStatusResponse {
  mission: SimulationMissionStatus;
  server: SimulationServerStatus;
}

interface SimulationControlResponse {
  success: boolean;
  message: string;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // BUG-14 fix: filter state for the pickup table
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const filterOptions = ["all", "scheduled", "in-progress", "completed"];

  const cycleFilter = () => {
    setFilterStatus(prev => {
      const idx = filterOptions.indexOf(prev);
      return filterOptions[(idx + 1) % filterOptions.length];
    });
  };

  // BUG-14 fix: export visible requests as CSV
  const exportCSV = () => {
    const rows = filteredRequests as any[];
    if (!rows || rows.length === 0) {
      toast({ title: "Nothing to export", description: "No pickup requests match the current filter.", variant: "destructive" });
      return;
    }
    const headers = ["ID", "User ID", "Address", "Weight (kg)", "Status", "Pickup Date", "Time Slot", "Created At"];
    const csvRows = [
      headers.join(","),
      ...rows.map((r: any) =>
        [
          r.id, 
          r.userId, 
          `"${r.address}"`, 
          r.weight, 
          r.status,
          r.pickupDate ? new Date(r.pickupDate).toLocaleDateString() : "",
          r.pickupTimeSlot || "Not Specified",
          new Date(r.createdAt).toLocaleDateString()
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pickup-requests-${filterStatus}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: `${rows.length} record(s) downloaded as CSV.` });
  };

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 1000, // Refresh every 1 second for instant stats updates
  });

  const { data: pickupRequests } = useQuery({
    queryKey: ['/api/pickup-requests'],
    refetchInterval: 500, // Refresh every 500ms for near-instant updates
  });

  // BUG-14 fix: filtered view of requests
  const filteredRequests = filterStatus === "all"
    ? (pickupRequests as any[])
    : ((pickupRequests as any[]) || []).filter((r: any) => r.status === filterStatus);

  // Simulation status query
  const { data: simulationStatus } = useQuery<SimulationStatusResponse>({
    queryKey: ['/api/simulation/status'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time status
  });

  const acceptPickupMutation = useMutation({
    mutationFn: async (pickupId: string) => {
      const response = await apiRequest('PUT', `/api/pickup-requests/${pickupId}/accept`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pickup-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Pickup Accepted! ",
        description: `Pickup request ${data.id} has been successfully accepted. The user will be notified and ${data.pointsAwarded} EcoPoints will be awarded upon completion.`,
        duration: 5000,
        className: "bg-green-50 border-green-200 text-green-800",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept pickup request. Please try again.",
        variant: "destructive",
      });
    },
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
        title: "Pickup Completed! ",
        description: `Pickup ${data.id} has been marked as completed. User earned ${data.pointsAwarded} EcoPoints!`,
        duration: 5000,
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete pickup. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Simulation control mutations
  const stopSimulationMutation = useMutation({
    mutationFn: async (): Promise<SimulationControlResponse> => {
      const response = await apiRequest('POST', '/api/simulation/stop', {});
      return response.json();
    },
    onSuccess: (data: SimulationControlResponse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulation/status'] });
      toast({
        title: data.success ? "Mission Stopped 🛑" : "Stop Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  const resumeSimulationMutation = useMutation({
    mutationFn: async (): Promise<SimulationControlResponse> => {
      const response = await apiRequest('POST', '/api/simulation/resume', {});
      return response.json();
    },
    onSuccess: (data: SimulationControlResponse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulation/status'] });
      toast({
        title: data.success ? "Mission Resumed ▶️" : "Resume Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  const resetSimulationMutation = useMutation({
    mutationFn: async (): Promise<SimulationControlResponse> => {
      const response = await apiRequest('POST', '/api/simulation/reset', {});
      return response.json();
    },
    onSuccess: (data: SimulationControlResponse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulation/status'] });
      toast({
        title: data.success ? "Mission Reset 🔄" : "Reset Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  const forceCompleteSimulationMutation = useMutation({
    mutationFn: async (): Promise<SimulationControlResponse> => {
      const response = await apiRequest('POST', '/api/simulation/complete', {});
      return response.json();
    },
    onSuccess: (data: SimulationControlResponse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulation/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pickup-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: data.success ? "Mission Completed 🎯" : "Complete Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  const handlePickupAction = (pickupId: string, action: 'accept' | 'complete') => {
    if (action === 'accept') {
      acceptPickupMutation.mutate(pickupId);
    } else {
      completePickupMutation.mutate(pickupId);
    }
  };

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Manage pickup requests and system operations</p>
        </div>

        {}
        {/* Simulation Status Card */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-blue-600" />
              <span>Simulation Control Center</span>
              <div className="flex items-center space-x-1">
                <Activity className="w-4 h-4" />
                <Badge 
                  variant={simulationStatus?.server?.healthy ? "default" : "destructive"}
                  className="text-xs"
                >
                  {simulationStatus?.server?.healthy ? "Online" : "Offline"}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mission Status */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Mission Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={simulationStatus?.mission?.isRunning ? "default" : "secondary"}>
                      {simulationStatus?.mission?.isRunning ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                  {simulationStatus?.mission?.requestId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Request ID:</span>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {simulationStatus.mission.requestId.substring(0, 8)}...
                      </span>
                    </div>
                  )}
                  {simulationStatus?.mission?.startTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Started:</span>
                      <span className="text-xs text-gray-600">
                        {new Date(simulationStatus.mission.startTime).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Server:</span>
                    <span className="text-xs text-gray-600">{simulationStatus?.server?.url}</span>
                  </div>
                </div>
              </div>
              
              {/* Control Buttons */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Manual Controls</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resumeSimulationMutation.mutate()}
                    disabled={!simulationStatus?.server?.healthy || resumeSimulationMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopSimulationMutation.mutate()}
                    disabled={!simulationStatus?.server?.healthy || stopSimulationMutation.isPending}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => forceCompleteSimulationMutation.mutate()}
                    disabled={!simulationStatus?.mission?.isRunning || forceCompleteSimulationMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetSimulationMutation.mutate()}
                    disabled={!simulationStatus?.server?.healthy || resetSimulationMutation.isPending}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                    
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
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

        {}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Recent Pickup Requests</CardTitle>
                {filterStatus !== "all" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-eco-primary/10 text-eco-primary font-medium capitalize">
                    {filterStatus}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={cycleFilter} title={`Filter: ${filterStatus} → click to cycle`}>
                  <Filter className="w-4 h-4 mr-1" />
                  {filterStatus === "all" ? "Filter" : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PickupTable
              requests={filteredRequests || []}
              onComplete={handlePickupAction}
              isLoading={acceptPickupMutation.isPending || completePickupMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

