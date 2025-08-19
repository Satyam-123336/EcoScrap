import { useState } from "react";
import { PickupRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Check } from "lucide-react";

interface PickupTableProps {
  requests: PickupRequest[];
  onComplete: (id: string) => void;
  isLoading: boolean;
}

export default function PickupTable({ requests, onComplete, isLoading }: PickupTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Scheduled</Badge>;
      case 'in-progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>E-Waste Type</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No pickup requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">User ID: {request.userId}</div>
                      <div className="text-sm text-gray-500">{request.address}</div>
                    </div>
                  </TableCell>
                  <TableCell>{request.eWasteType}</TableCell>
                  <TableCell>{request.weight} kg</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Pickup Request Details</DialogTitle>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-4">
                              <div>
                                <div className="font-semibold">Request ID</div>
                                <div className="text-sm text-gray-600">{selectedRequest.id}</div>
                              </div>
                              <div>
                                <div className="font-semibold">E-Waste Type</div>
                                <div className="text-sm text-gray-600">{selectedRequest.eWasteType}</div>
                              </div>
                              <div>
                                <div className="font-semibold">Weight</div>
                                <div className="text-sm text-gray-600">{selectedRequest.weight} kg</div>
                              </div>
                              <div>
                                <div className="font-semibold">Address</div>
                                <div className="text-sm text-gray-600">{selectedRequest.address}</div>
                              </div>
                              <div>
                                <div className="font-semibold">Pickup Date</div>
                                <div className="text-sm text-gray-600">
                                  {new Date(selectedRequest.pickupDate).toLocaleDateString()}
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold">AI Verification</div>
                                <div className="text-sm text-gray-600">{selectedRequest.aiVerification || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="font-semibold">Status</div>
                                <div>{getStatusBadge(selectedRequest.status)}</div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {request.status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => onComplete(request.id)}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {isLoading ? 'Completing...' : 'Complete'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {requests.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Showing {Math.min(requests.length, 10)} of {requests.length} results
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-eco-primary text-white">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
