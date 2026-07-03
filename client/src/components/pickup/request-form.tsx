import { useState, useEffect } from "react";
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
import MapPinModal from "./map-pin-modal";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  Headphones,
  Smartphone,
  Battery,
  Plug,
  Keyboard,
  Mouse,
  HardDrive,
  Cpu,
  Navigation,
  Sparkles,
  Zap,
} from "lucide-react";
import * as z from "zod";

interface RequestFormProps {
  user: User;
}

const formSchema = z.object({
  eWasteTypes: z.array(z.string()).min(1, "Please select at least one e-waste type"),
  weight: z.string().min(1, "Estimated weight is required"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTimeSlot: z.string().min(1, "Pickup time slot is required"),
  address: z.string().min(5, "Please provide a complete pickup address"),
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
  const [showMapModal, setShowMapModal] = useState(false);
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

  const watchedDate = form.watch("pickupDate");
  const watchedSlot = form.watch("pickupTimeSlot");

  // Synchronize available time slots with current date & time
  const todayStr = new Date().toISOString().split("T")[0];
  const isSelectedDateToday = watchedDate === todayStr;
  const currentHour = new Date().getHours();

  const isMorningExpired = isSelectedDateToday && currentHour >= 12;
  const isAfternoonExpired = isSelectedDateToday && currentHour >= 15;
  const isEveningExpired = isSelectedDateToday && currentHour >= 18;

  useEffect(() => {
    if (!isSelectedDateToday) return;
    if (watchedSlot === "Morning (9 AM - 12 PM)" && isMorningExpired) {
      form.setValue("pickupTimeSlot", "");
    } else if (watchedSlot === "Afternoon (12 PM - 3 PM)" && isAfternoonExpired) {
      form.setValue("pickupTimeSlot", "");
    } else if (watchedSlot === "Evening (3 PM - 6 PM)" && isEveningExpired) {
      form.setValue("pickupTimeSlot", "");
    }
  }, [watchedDate, watchedSlot, isSelectedDateToday, isMorningExpired, isAfternoonExpired, isEveningExpired, form]);

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
      // Industry Standard (Uber/Swiggy): Get location fast (< 1.5s typical, 5s max cap).
      // On desktop PCs without hardware GPS, Wi-Fi triangulation returns 50m-150m accuracy.
      // We accept this initial neighborhood fix immediately so the user can visually drag the pin!
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 30000
        });
      });
      
      const { latitude, longitude, accuracy } = position.coords;
      console.log(`GPS reading acquired in <1.5s: ${latitude}, ${longitude} (${accuracy}m accuracy)`);
      
      // Reverse geocoding via Nominatim (OpenStreetMap) — global coverage, no API key.
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en-US,en",
              "User-Agent": "EcoScrapPickup/1.0",
            },
            signal: AbortSignal.timeout(5000),
          }
        );

        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData?.display_name) {
            address = geoData.display_name;
          }
        }
      } catch {
        console.warn("Nominatim reverse geocoding fallback triggered.");
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
        duration: showAccuracyTip ? 15000 : 8000, // Longer duration for tips
      });

      // Automatically pop open the high-precision map pin modal immediately
      // so the user can visually drag/confirm their exact doorstep!
      setShowMapModal(true);
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
                    <option value="Morning (9 AM - 12 PM)" disabled={isMorningExpired}>
                      Morning (9 AM - 12 PM) {isMorningExpired ? "(Ended for today)" : ""}
                    </option>
                    <option value="Afternoon (12 PM - 3 PM)" disabled={isAfternoonExpired}>
                      Afternoon (12 PM - 3 PM) {isAfternoonExpired ? "(Ended for today)" : ""}
                    </option>
                    <option value="Evening (3 PM - 6 PM)" disabled={isEveningExpired}>
                      Evening (3 PM - 6 PM) {isEveningExpired ? "(Ended for today)" : ""}
                    </option>
                  </select>
                  {form.formState.errors.pickupTimeSlot?.message && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.pickupTimeSlot.message}
                    </p>
                  )}
                  {isSelectedDateToday && isEveningExpired && (
                    <p className="text-xs text-orange-600 font-medium mt-1.5 flex items-center gap-1">
                      <span>⚠️ All pickup slots for today have ended. Please select tomorrow.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Pickup Location</Label>
              <div className="flex gap-2 mt-1.5">
                <div className="relative flex-1">
                  <Input
                    id="address"
                    placeholder="123 Main Street, City, State"
                    {...form.register("address")}
                    className={`pr-10 h-11 text-sm ${
                      form.watch("latitude") && form.watch("longitude")
                        ? "border-green-500 focus-visible:ring-green-500 shadow-sm"
                        : ""
                    }`}
                  />
                  {form.watch("latitude") && form.watch("longitude") && (
                    <button
                      type="button"
                      onClick={() => setShowMapModal(true)}
                      title="Adjust exact drop zone on map"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-green-50 hover:bg-green-100 text-green-700 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={fetchGPSLocation}
                  variant={isGpsLoading ? "default" : "outline"}
                  className={`h-11 px-4 font-medium transition-all duration-200 shrink-0 ${
                    isGpsLoading
                      ? "bg-eco-primary text-white shadow-sm"
                      : "border-gray-300 hover:border-eco-primary hover:text-eco-primary"
                  }`}
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
                      <MapPin className="w-4 h-4 mr-2 text-eco-primary" />
                      <span>Get Location</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1 min-h-[24px]">
                {form.watch("latitude") !== undefined && form.watch("longitude") !== undefined ? (
                  <div className="flex items-center justify-between w-full text-xs">
                    <div className="flex items-center gap-1.5 text-green-700 font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Exact location locked ({form.watch("latitude")?.toFixed(5)}, {form.watch("longitude")?.toFixed(5)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMapModal(true)}
                      className="flex items-center gap-1 text-eco-primary hover:underline font-semibold"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Adjust on Map
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Enter your address above, or click "Get Location" for automatic GPS detection
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

        {/* Map Pin Modal — mounts only when open to avoid Leaflet DOM conflicts */}
        {showMapModal && (
          <MapPinModal
            initialLat={form.getValues("latitude") ?? 20.5937}
            initialLng={form.getValues("longitude") ?? 78.9629}
            onConfirm={(loc) => {
              form.setValue("latitude", loc.latitude, { shouldValidate: true });
              form.setValue("longitude", loc.longitude, { shouldValidate: true });
              form.setValue("address", loc.address, { shouldValidate: true });
              setShowMapModal(false);
              toast({
                title: "Drop Zone Confirmed ✅",
                description: `Coordinates locked to ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
              });
            }}
            onClose={() => setShowMapModal(false)}
          />
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