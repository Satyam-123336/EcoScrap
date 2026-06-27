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
import { Eye, Check, Image as ImageIcon } from "lucide-react";

interface PickupTableProps {
  requests: PickupRequest[];
  onComplete: (id: string, action: 'accept' | 'complete') => void;
  isLoading: boolean;
}

export default function PickupTable({ requests, onComplete, isLoading }: PickupTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);
  const [selectedImageRequest, setSelectedImageRequest] = useState<PickupRequest | null>(null);

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
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-900">Request ID</TableHead>
              <TableHead className="font-semibold text-gray-900">User</TableHead>
              <TableHead className="font-semibold text-gray-900">E-Waste Type</TableHead>
              <TableHead className="font-semibold text-gray-900">Weight</TableHead>
              <TableHead className="font-semibold text-gray-900">Image</TableHead>
              <TableHead className="font-semibold text-gray-900">Status</TableHead>
              <TableHead className="font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No pickup requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id} className="hover:bg-gray-50 border-b border-gray-100">
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">User ID: {request.userId}</div>
                      <div className="text-sm text-gray-500">{request.address}</div>
                      <div className="text-xs text-eco-primary mt-1 font-semibold">{request.pickupTimeSlot || "Not Specified"}</div>
                    </div>
                  </TableCell>
                  <TableCell>{request.eWasteType}</TableCell>
                  <TableCell>{request.weight} kg</TableCell>
                  <TableCell>
                    {request.photoUrl ? (
                      <Dialog onOpenChange={(open) => {
                        if (open) setSelectedImageRequest(request);
                        else setSelectedImageRequest(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <div className="relative">
                              <ImageIcon className="w-4 h-4" />
                              {request.photoUrl.split(',').filter(url => url.trim()).length > 1 && (
                                <div className="absolute -top-1 -right-1 bg-eco-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                  {request.photoUrl.split(',').filter(url => url.trim()).length}
                                </div>
                              )}
                            </div>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader className="border-b pb-4">
                            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-eco-primary" />
                              E-Waste Images & Analysis
                            </DialogTitle>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {((selectedImageRequest?.id === request.id ? selectedImageRequest?.photoUrl?.split(',')?.filter(url => url?.trim()) : request.photoUrl?.split(',')?.filter(url => url?.trim())) || []).map((url, index) => (
                                <div key={index} className="flex justify-center">
                                  <img 
                                    src={url.trim()} 
                                    alt={`E-waste item ${index + 1}`} 
                                    className="max-w-full max-h-64 object-contain rounded-lg shadow-lg border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                                    onClick={() => window.open(url.trim(), '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-2">AI Analysis Results</h4>
                              <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                                {request.aiVerification || 'No AI analysis available'}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog onOpenChange={(open) => {
                        if (open) setSelectedRequest(request);
                        else setSelectedRequest(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader className="border-b pb-4">
                            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                              <div className="w-2 h-2 bg-eco-primary rounded-full"></div>
                              Pickup Request Details
                            </DialogTitle>
                          </DialogHeader>
                          {selectedRequest && selectedRequest.id === request.id && (
                            <div className="space-y-6 py-4">
                              {}
                              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{selectedRequest.eWasteType}</h3>
                                  <p className="text-sm text-gray-600">Request ID: {selectedRequest.id}</p>
                                </div>
                                <div className="text-right">
                                  {getStatusBadge(selectedRequest.status)}
                                  <div className="text-sm text-gray-600 mt-1">
                                    {selectedRequest.weight} kg
                                  </div>
                                </div>
                              </div>

                              {}
                              {selectedRequest.photoUrl && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-eco-primary" />
                                    E-Waste Images
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedRequest.photoUrl.split(',').map((url, index) => (
                                      <div key={index} className="flex justify-center">
                                        <img 
                                          src={url.trim()} 
                                          alt={`E-waste item ${index + 1}`} 
                                          className="max-w-full max-h-64 object-contain rounded-lg shadow-md border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                                          onClick={() => window.open(url.trim(), '_blank')}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-gray-900 mb-3">Pickup Information</h4>
                                  <div className="space-y-3">
                                    <div>
                                      <div className="text-sm font-medium text-gray-700">Pickup Date</div>
                                      <div className="text-sm text-gray-600">
                                        {new Date(selectedRequest.pickupDate).toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </div>
                                      <div className="text-sm font-semibold text-eco-primary mt-1">
                                        {selectedRequest.pickupTimeSlot || "Not Specified"}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-700">Address</div>
                                      <div className="text-sm text-gray-600">{selectedRequest.address}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-700">Weight</div>
                                      <div className="text-sm text-gray-600">{selectedRequest.weight} kg</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-gray-900 mb-3">AI Analysis</h4>
                                  <div className="space-y-3">
                                    <div>
                                      <div className="text-sm font-medium text-gray-700">Verification Status</div>
                                      <div className="text-sm text-gray-600">
                                        {selectedRequest.aiVerification ? (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                             Verified by AI
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Manual verification required
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {selectedRequest.aiVerification && (
                                      <div>
                                        <div className="text-sm font-medium text-gray-700">Analysis Details</div>
                                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                                          {selectedRequest.aiVerification}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {}
                              {(selectedRequest?.pointsAwarded ?? 0) > 0 && (
                                <div className="bg-gradient-to-r from-eco-primary to-eco-green p-4 rounded-lg text-white">
                                  <h4 className="font-semibold mb-2">EcoPoints Awarded</h4>
                                  <div className="text-2xl font-bold">{selectedRequest?.pointsAwarded} points</div>
                                  <div className="text-sm opacity-90">
                                    Based on {selectedRequest.weight}kg of e-waste recycled
                                  </div>
                                </div>
                              )}

                              {}
                              {selectedRequest.completedAt && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-green-900 mb-2">Completed</h4>
                                  <div className="text-sm text-green-700">
                                    Pickup completed on {new Date(selectedRequest.completedAt).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {request.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => onComplete(request.id, 'accept')}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {isLoading ? 'Accepting...' : 'Accept'}
                        </Button>
                      )}
                      {request.status === 'in-progress' && (
                        <Button
                          size="sm"
                          onClick={() => onComplete(request.id, 'complete')}
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700"
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

