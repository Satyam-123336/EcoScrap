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
  Sparkles,
  Headphones,
  Keyboard,
  Mouse,
  HardDrive,
  Cpu
} from "lucide-react";
import { z } from "zod";

interface RequestFormProps {
  user: User;
}

const formSchema = z.object({
  eWasteTypes: z.array(z.string()).min(1, "Please select at least one e-waste type"),
  weight: z.string().min(1, "Weight is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Weight must be a positive number"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTimeSlot: z.string().min(1, "Time slot is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

const eWasteTypes = [
  { id: "audio_devices", label: "Audio Devices", icon: Headphones },
  { id: "mobile", label: "Mobile Phones", icon: Smartphone },
  { id: "battery", label: "Batteries", icon: Battery },
  { id: "charging_accessories", label: "Charging Accessories", icon: Plug },
  { id: "keyboard", label: "Keyboard", icon: Keyboard },
  { id: "mouse", label: "Mouse", icon: Mouse },
  { id: "hard_drive", label: "Hard Drive", icon: HardDrive },
  { id: "small_electronics", label: "Small Electronics", icon: Cpu },
];

export default function RequestForm({ user }: RequestFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [aiVerification, setAiVerification] = useState<string>("");
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [pickupId, setPickupId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eWasteTypes: [],
      weight: "",
      pickupDate: "",
      pickupTimeSlot: "",
      address: user.address || "",
      latitude: user.latitude ? Number(user.latitude) : undefined,
      longitude: user.longitude ? Number(user.longitude) : undefined,
    },
  });

  const createPickupMutation = useMutation({
    mutationFn: async (data: FormData & { photos?: File[] }) => {
      const formData = new FormData();
      // BUG-05 fix: userId is taken from the server session — do NOT send in body
      
      // Add e-waste types as indexed form fields
      data.eWasteTypes.forEach((type, index) => {
        formData.append(`eWasteTypes[${index}]`, type);
      });
      
      formData.append('weight', data.weight);
      formData.append('pickupDate', data.pickupDate);
      formData.append('pickupTimeSlot', data.pickupTimeSlot);
      formData.append('address', data.address);
      formData.append('latitude', data.latitude?.toString() || '');
      formData.append('longitude', data.longitude?.toString() || '');
      
      // Add photos with the field name expected by multer
      if (data.photos && data.photos.length > 0) {
        data.photos.forEach((photo) => {
          formData.append('photos', photo);
        });
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

  const fetchGPSLocation = async () => {
    // Note: We use GPS instead of IP-based location because:
    // - GPS provides meter-level accuracy (2-20m when optimal)
    // - IP location only provides city-level accuracy (10-50km)
    // - IP can show ISP location, not user location
    // - VPNs make IP location completely unreliable
    
    if (!navigator.geolocation) {
      toast({
        title: "Location Services Unavailable",
        description: "Your device doesn't support location services. Please type your address manually.",
        variant: "destructive",
      });
      return;
    }
    
    if (isGpsLoading) {
      console.log("Location request already in progress, ignoring new request");
      return;
    }

    setIsGpsLoading(true);
    
    toast({
      title: "Finding Your Location",
      description: (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: "300ms" }}></div>
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: "600ms" }}></div>
            <span className="text-gray-700 font-medium">Getting precise location...</span>
          </div>
          <div className="text-xs text-gray-600">
            📍 Using GPS for highest accuracy possible
          </div>
        </div>
      ),
      duration: 30000, // Longer duration for the sophisticated process
    });

    try {
      // First attempt with high accuracy settings
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true, 
          timeout: 20000, // Longer timeout for GPS lock
          maximumAge: 0 // Always get fresh location
        });
      });
      
      let { latitude, longitude, accuracy } = position.coords;
      console.log(`Initial GPS reading: ${accuracy}m accuracy`);
      
      // If accuracy is poor, try multiple readings and use the best one
      if (accuracy > 50) {
        console.log(`Poor accuracy detected (${accuracy}m), attempting multiple readings...`);
        
        const readings = [{ lat: latitude, lng: longitude, acc: accuracy }];
        
        // Take up to 3 additional readings
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Attempt ${attempt + 1} for better accuracy...`);
            const betterPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { 
                enableHighAccuracy: true,
                timeout: 15000 + (attempt * 5000), // Progressive timeout
                maximumAge: 0
              });
            });
            
            readings.push({
              lat: betterPosition.coords.latitude,
              lng: betterPosition.coords.longitude,
              acc: betterPosition.coords.accuracy
            });
            
            console.log(`Reading ${attempt + 1}: ${betterPosition.coords.accuracy}m accuracy`);
            
            // If we get a good reading, stop trying
            if (betterPosition.coords.accuracy <= 20) {
              console.log("Good accuracy achieved, stopping additional attempts");
              break;
            }
          } catch (retryError) {
            console.log(`Attempt ${attempt + 1} failed:`, retryError);
          }
        }
        
        // Find the most accurate reading
        const bestReading = readings.reduce((best, current) => 
          current.acc < best.acc ? current : best
        );
        
        if (bestReading.acc < accuracy) {
          console.log(`Using best reading: improved from ${accuracy}m to ${bestReading.acc}m`);
          latitude = bestReading.lat;
          longitude = bestReading.lng;
          accuracy = bestReading.acc;
        }
        
        // If still poor accuracy, try watchPosition for a few seconds
        if (accuracy > 100) {
          console.log("Trying continuous location monitoring for better accuracy...");
          try {
            const watchPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
              let bestWatchAccuracy = accuracy;
              let bestWatchPosition: GeolocationPosition | null = null;
              let watchId: number;
              
              const timeout = setTimeout(() => {
                navigator.geolocation.clearWatch(watchId);
                if (bestWatchPosition) {
                  resolve(bestWatchPosition);
                } else {
                  reject(new Error("No better position found"));
                }
              }, 10000); // Watch for 10 seconds
              
              watchId = navigator.geolocation.watchPosition(
                (pos) => {
                  if (pos.coords.accuracy < bestWatchAccuracy) {
                    bestWatchAccuracy = pos.coords.accuracy;
                    bestWatchPosition = pos;
                    console.log(`Watch position improved: ${pos.coords.accuracy}m`);
                    
                    // If we get very good accuracy, resolve immediately
                    if (pos.coords.accuracy <= 15) {
                      clearTimeout(timeout);
                      navigator.geolocation.clearWatch(watchId);
                      resolve(pos);
                    }
                  }
                },
                (error) => {
                  clearTimeout(timeout);
                  navigator.geolocation.clearWatch(watchId);
                  reject(error);
                },
                {
                  enableHighAccuracy: true,
                  timeout: 5000,
                  maximumAge: 0
                }
              );
            });
            
            if (watchPosition.coords.accuracy < accuracy) {
              console.log(`Watch position improved accuracy from ${accuracy}m to ${watchPosition.coords.accuracy}m`);
              latitude = watchPosition.coords.latitude;
              longitude = watchPosition.coords.longitude;
              accuracy = watchPosition.coords.accuracy;
            }
          } catch (watchError) {
            console.log("Watch position failed:", watchError);
          }
        }
      }
      
      // Simple reverse geocoding using Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { 
          headers: { 
            'Accept-Language': 'en-US,en',
            'User-Agent': 'EcoScrapPickup/1.0' 
          } 
        }
      );
      
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          address = data.display_name;
        }
      }
      
      form.setValue("latitude", latitude);
      form.setValue("longitude", longitude);
      form.setValue("address", address);
      
      // Determine accuracy status and colors with better thresholds
      const isHighAccuracy = accuracy <= 15;
      const isMediumAccuracy = accuracy <= 50;
      const isLowAccuracy = accuracy <= 200;
      
      const accuracyColor = isHighAccuracy 
        ? "text-green-700" 
        : isMediumAccuracy 
          ? "text-yellow-700" 
          : isLowAccuracy 
            ? "text-orange-700" 
            : "text-red-700";
            
      const accuracyStatus = isHighAccuracy 
        ? "Excellent" 
        : isMediumAccuracy 
          ? "Good" 
          : isLowAccuracy 
            ? "Fair" 
            : "Poor";
      
      const showAccuracyTip = accuracy > 50;
      
      toast({
        title: "Location Found!",
        description: (
          <div className="flex flex-col gap-2">
            <p className="text-green-800 font-medium">We've found your location successfully.</p>
            <div className="text-xs bg-green-50 text-green-900 p-2 rounded border max-w-xs overflow-hidden text-ellipsis">
              {address}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${accuracyColor} font-medium`}>
                  Accuracy: {Math.round(accuracy)}m ({accuracyStatus})
                </span>
              </div>
              {showAccuracyTip && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                  💡 <strong>Tips for better accuracy:</strong>
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li>Move outdoors with clear sky view</li>
                    <li>Wait a moment for GPS to stabilize</li>
                    <li>Ensure location services are enabled</li>
                    {accuracy > 200 && <li>Consider manually entering your address</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ),
        variant: "default",
        duration: showAccuracyTip ? 15000 : 8000, // Longer duration for tips
      });
    } catch (error: any) {
      console.error('Location error:', error);
      
      let message = "Location error";
      let suggestion = "Please check your location settings and try again, or enter your address manually.";
      
      if (error.code === 1) {
        message = "Location access was denied";
        suggestion = "Please enable location access in your browser settings and try again.";
      } else if (error.code === 2) {
        message = "Position unavailable";
        suggestion = "Try moving to an area with better GPS signal or enter your address manually.";
      } else if (error.code === 3) {
        message = "Location request timed out";
        suggestion = "Your device took too long to provide location. Please try again or enter address manually.";
      }

      toast({
        title: message,
        description: (
          <div className="space-y-2">
            <p className="text-white font-medium">{suggestion}</p>
            <div className="pt-1 border-t border-red-200">
              <button 
                onClick={() => document.getElementById('address')?.focus()}
                className="text-xs text-red-100 hover:text-white hover:underline font-medium"
              >
                Enter address manually
              </button>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsGpsLoading(false);
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedTypes(prev => {
      const newTypes = prev.includes(typeId) 
        ? prev.filter(type => type !== typeId) 
        : [...prev, typeId];
      
      form.setValue("eWasteTypes", newTypes);
      return newTypes;
    });
  };

  const proceedToPhotoUpload = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handlePhotoVerified = (photos: File[], verification: string) => {
    setUploadedPhotos(photos);
    setAiVerification(verification);
  };

  const schedulePickup = async () => {
    const formData = form.getValues();

    // Fix 4: If no GPS coordinates but user has typed an address,
    // attempt forward geocoding via Nominatim before submitting.
    if ((formData.latitude === undefined || formData.longitude === undefined) && formData.address?.trim()) {
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1`,
          { headers: { 'Accept-Language': 'en-US,en', 'User-Agent': 'EcoScrapPickup/1.0' } }
        );
        if (geoResponse.ok) {
          const results = await geoResponse.json();
          if (results.length > 0) {
            form.setValue('latitude', parseFloat(results[0].lat));
            form.setValue('longitude', parseFloat(results[0].lon));
            toast({
              title: "Address Located",
              description: "We found your address on the map. Proceeding with pickup scheduling.",
            });
          }
        }
      } catch {
        // Geocoding failed — submit anyway with just the text address
        console.log('Forward geocoding failed; submitting with text address only.');
      }
    }

    createPickupMutation.mutate({
      ...form.getValues(),   // use updated values (may now include geocoded lat/lng)
      photos: uploadedPhotos
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {eWasteTypes.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleTypeSelect(id)}
                    className={`p-4 border-2 rounded-lg transition-colors text-center ${
                      selectedTypes.includes(id)
                        ? 'border-eco-primary bg-eco-light/10'
                        : 'border-gray-200 hover:border-eco-primary hover:bg-eco-light/10'
                    }`}
                  >
                    <div className="relative">
                      {selectedTypes.includes(id) && (
                        <div className="absolute -top-2 -right-2 bg-eco-primary text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    </div>
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>
              {form.formState.errors.eWasteTypes?.message && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.eWasteTypes.message}
                </p>
              )}
              {selectedTypes.length > 0 && (
                <div className="mt-2 text-sm text-eco-primary">
                  Selected: {selectedTypes.length} type{selectedTypes.length > 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="space-y-6">
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
                {form.formState.errors.weight?.message && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.weight.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="pickupDate">Pickup Date</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    {...form.register("pickupDate")}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {form.formState.errors.pickupDate?.message && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.pickupDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="pickupTimeSlot">Time Slot</Label>
                  <select
                    id="pickupTimeSlot"
                    {...form.register("pickupTimeSlot")}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  >
                    <option value="" disabled>Select time slot</option>
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 3 PM)">Afternoon (12 PM - 3 PM)</option>
                    <option value="Evening (3 PM - 6 PM)">Evening (3 PM - 6 PM)</option>
                  </select>
                  {form.formState.errors.pickupTimeSlot?.message && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.pickupTimeSlot.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Pickup Location</Label>
              <div className="flex gap-3 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="address"
                    placeholder="123 Main Street, City, State"
                    {...form.register("address")}
                    className={`pr-8 ${form.watch("latitude") && form.watch("longitude") ? 'border-green-400 focus-visible:ring-green-400' : ''}`}
                  />
                  {form.watch("latitude") && form.watch("longitude") && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  type="button" 
                  onClick={fetchGPSLocation} 
                  variant={isGpsLoading ? "default" : "outline"}
                  className={`min-w-[120px] transition-all duration-200 ${isGpsLoading ? 'bg-eco-primary text-white' : ''}`}
                  disabled={isGpsLoading}
                >
                  {isGpsLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Locating...</span>
                    </div>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>Get Location</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-1">
                {form.watch("latitude") !== undefined && form.watch("longitude") !== undefined ? (
                  <div className="flex items-start text-xs flex-col">
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span>Exact location set</span>
                    </div>
                    <div className="text-gray-500 mt-0.5 flex items-center">
                      <span className="font-mono bg-gray-100 px-1 rounded text-[10px]">
                        {form.watch("latitude")?.toFixed(5)}, {form.watch("longitude")?.toFixed(5)}
                      </span>
                      <button
                        type="button"
                        className="ml-1 text-blue-500 hover:text-blue-700 text-[10px] underline"
                        onClick={() => {
                          const lat = form.watch("latitude");
                          const lng = form.watch("longitude");
                          if (lat && lng) {
                            window.open(`https://www.google.com/maps?q=${lat},${lng}`);
                          }
                        }}
                      >
                        View Map
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Type your address above, or click "Get Location" for automatic GPS detection
                  </p>
                )}
              </div>
              {form.formState.errors.address?.message && (
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
            
            <PhotoUpload onVerified={handlePhotoVerified} selectedTypes={selectedTypes} />

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
                className={createPickupMutation.isPending ? "animate-pulse bg-green-600 transition-all scale-105 shadow-lg" : "hover:scale-105 active:scale-95 active:bg-green-600 active:shadow-inner transition-all duration-200"}
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
                  <div className="text-sm font-medium text-gray-500">Pickup Details</div>
                  <div className="text-lg">{form.getValues().pickupDate}</div>
                  <div className="text-md text-gray-600">{form.getValues().pickupTimeSlot}</div>
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