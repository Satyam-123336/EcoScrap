import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PhotoUpload from "./photo-upload";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  MapPin, 
  Smartphone, 
  Plug, 
  Battery, 
  Laptop,
  Zap,
  Sparkles
} from "lucide-react";
import { z } from "zod";

interface RequestFormProps {
  user: User;
}

const formSchema = z.object({
  eWasteType: z.string().min(1, "Please select an e-waste type"),
  weight: z.string().min(1, "Weight is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Weight must be a positive number"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  address: z.string().min(1, "Address is required"),
});

type FormData = z.infer<typeof formSchema>;

const eWasteTypes = [
  { id: "mobile", label: "Mobile Phones", icon: Smartphone },
  { id: "charger", label: "Chargers", icon: Plug },
  { id: "battery", label: "Batteries", icon: Battery },
  { id: "electronics", label: "Small Electronics", icon: Laptop },
];

export default function RequestForm({ user }: RequestFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [aiVerification, setAiVerification] = useState<string | null>(null);
  const [pickupId, setPickupId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eWasteType: "",
      weight: "",
      pickupDate: "",
      address: user.address,
    },
  });

  const createPickupMutation = useMutation({
    mutationFn: async (data: FormData & { photo?: File }) => {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('eWasteType', data.eWasteType);
      formData.append('weight', data.weight);
      formData.append('pickupDate', data.pickupDate);
      formData.append('address', data.address);
      if (data.photo) {
        formData.append('photo', data.photo);
      }

      const response = await fetch('/api/pickup-requests', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPickupId(data.id);
      setCurrentStep(3);
      toast({
        title: "Pickup Scheduled!",
        description: `Your request ${data.id} has been confirmed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode these coordinates
          const mockAddress = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (GPS Location)`;
          form.setValue("address", mockAddress);
          toast({
            title: "Location Updated",
            description: "GPS location has been fetched.",
          });
        },
        (error) => {
          toast({
            title: "GPS Error",
            description: "Could not get your location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "GPS Not Supported",
        description: "Your browser doesn't support GPS.",
        variant: "destructive",
      });
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    form.setValue("eWasteType", typeId);
  };

  const proceedToPhotoUpload = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handlePhotoVerified = (photo: File, verification: string) => {
    setUploadedPhoto(photo);
    setAiVerification(verification);
  };

  const schedulePickup = () => {
    const formData = form.getValues();
    createPickupMutation.mutate({
      ...formData,
      photo: uploadedPhoto || undefined,
    });
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
            step <= currentStep ? 'bg-eco-primary text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {step < currentStep ? <Check className="w-4 h-4" /> : step}
          </div>
          <div className={`ml-2 text-sm font-medium ${
            step <= currentStep ? 'text-eco-primary' : 'text-gray-600'
          }`}>
            {step === 1 && 'E-Waste Details'}
            {step === 2 && 'Photo Upload'}
            {step === 3 && 'Confirmation'}
          </div>
          {index < 2 && <div className="flex-1 h-px bg-gray-300 mx-4" />}
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardContent className="p-8">
        <StepIndicator />

        {/* Step 1: E-Waste Details */}
        {currentStep === 1 && (
          <form className="space-y-6">
            <div>
              <Label className="block text-sm font-semibold text-gray-700 mb-3">
                Type of E-Waste
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {eWasteTypes.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleTypeSelect(id)}
                    className={`p-4 border-2 rounded-lg transition-colors text-center ${
                      selectedType === id
                        ? 'border-eco-primary bg-eco-light/10'
                        : 'border-gray-200 hover:border-eco-primary hover:bg-eco-light/10'
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>
              {form.formState.errors.eWasteType && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.eWasteType.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="weight">Approximate Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="0.5"
                  {...form.register("weight")}
                  className="mt-1"
                />
                {form.formState.errors.weight && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.weight.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="pickupDate">Pickup Date</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  {...form.register("pickupDate")}
                  className="mt-1"
                  min={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.pickupDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.pickupDate.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Pickup Location</Label>
              <div className="flex gap-3 mt-1">
                <Input
                  id="address"
                  placeholder="123 Main Street, City, State"
                  {...form.register("address")}
                  className="flex-1"
                />
                <Button type="button" onClick={fetchGPSLocation} variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Use GPS
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">GPS location can be automatically fetched</p>
              {form.formState.errors.address && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={proceedToPhotoUpload}>
                Continue to Photo Upload
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Photo Upload */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Upload E-Waste Photo</h3>
            
            <PhotoUpload onVerified={handlePhotoVerified} />

            {aiVerification && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <Check className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>AI Classification Complete!</strong><br />
                    Your item has been analyzed and verified as recyclable e-waste.
                  </AlertDescription>
                </Alert>
                
                <Card className="border-2 border-eco-primary/20 bg-eco-light/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg text-eco-primary">
                      <Sparkles className="w-5 h-5" />
                      AI Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white rounded-lg p-4 space-y-3 border">
                      <div className="prose text-sm text-gray-700 whitespace-pre-line">
                        {aiVerification}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-gray-500">Powered by AI Vision Technology</span>
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="w-4 h-4" />
                          <span className="text-xs font-medium">Verified</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={schedulePickup}
                disabled={!aiVerification || createPickupMutation.isPending}
              >
                {createPickupMutation.isPending ? "Scheduling..." : "Schedule Pickup"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && pickupId && (
          <div className="text-center space-y-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pickup Scheduled Successfully!</h3>
              <p className="text-gray-600 mb-8">Your drone pickup has been scheduled. You'll receive updates via notifications.</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <div className="text-sm font-semibold text-gray-700">Pickup ID</div>
                  <div className="text-lg font-bold text-eco-primary">{pickupId}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Status</div>
                  <div className="text-lg font-semibold text-eco-amber">Scheduled</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Estimated Pickup</div>
                  <div className="text-lg">{form.getValues().pickupDate}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Potential EcoPoints</div>
                  <div className="text-lg font-semibold text-eco-primary">
                    +{Math.floor(parseFloat(form.getValues().weight) * 50)} points
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-eco-light/10 border border-eco-light rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <Zap className="w-5 h-5 text-eco-primary mr-3" />
                <span className="font-semibold text-eco-primary">Drone Dispatched - ETA: 24 hours</span>
              </div>
            </div>

            <Button size="lg" onClick={() => window.location.reload()}>
              Schedule Another Pickup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
