import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  onVerified: (photos: File[], verification: string) => void;
  selectedTypes: string[];
}

export default function PhotoUpload({ onVerified, selectedTypes }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAddMorePhotos = () => {
    console.log('handleAddMorePhotos called');
    console.log('addMoreInputRef.current:', addMoreInputRef.current);
    
    if (addMoreInputRef.current) {
      // Reset the input value to allow selecting the same files again
      addMoreInputRef.current.value = '';
      // Trigger click
      addMoreInputRef.current.click();
      console.log('Add more file input clicked');
    } else {
      console.error('Add more file input ref is null');
      alert('Error: File input ref is null');
    }
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const maxPhotos = selectedTypes.length;
    const currentPhotoCount = files.length;
    const validNewFiles: File[] = [];
    
    // Check if adding new files would exceed the limit
    const potentialTotal = currentPhotoCount + selectedFiles.length;
    if (potentialTotal > maxPhotos) {
      toast({
        title: "Too many photos",
        description: `You can upload maximum ${maxPhotos} photo${maxPhotos !== 1 ? 's' : ''} (one per selected e-waste type). Currently you have ${currentPhotoCount} photo${currentPhotoCount !== 1 ? 's' : ''}.`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate each file first
    Array.from(selectedFiles).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit`,
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return;
      }
      
      validNewFiles.push(file);
    });
    
    if (validNewFiles.length === 0) {
      return;
    }
    
    // Process all valid files at once using Promise.all
    const loadPreviews = validNewFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(loadPreviews).then(newPreviews => {
      const updatedFiles = [...files, ...validNewFiles];
      const updatedPreviews = [...previews, ...newPreviews];
      
      setFiles(updatedFiles);
      setPreviews(updatedPreviews);
      
      // Verify all images together
      verifyImages(updatedFiles);
    });
  };
  
  const verifyImages = async (imagesToVerify: File[]) => {
    // Don't verify if no new images
    if (imagesToVerify.length === 0) return;

    setVerifying(true);

    try {
      let verification = "";
      let hasMismatch = false;
      let mismatchDetails: string[] = [];

      if (imagesToVerify.length === 1) {
        // Single image analysis (existing logic)
        console.log('Analyzing single image...');
        const singleResult = await analyzeSingleImageWithMismatch(imagesToVerify[0]);
        
        if (singleResult.success) {
          verification = singleResult.verification;
          hasMismatch = singleResult.hasMismatch;
          mismatchDetails = singleResult.mismatchDetails;
        } else {
          throw new Error(singleResult.error || 'Single image analysis failed');
        }
      } else {
        // Multiple images - use batch analysis
        console.log(`Analyzing ${imagesToVerify.length} images in batch...`);
        const result = await analyzeBatchImages(imagesToVerify);
        
        if (result.success) {
          verification = result.verification;
          hasMismatch = result.hasMismatch;
          mismatchDetails = result.mismatchDetails;
        } else {
          throw new Error(result.error || 'Batch analysis failed');
        }
      }

      // Handle mismatch detection
      if (hasMismatch) {
        verification = `❌ TYPE MISMATCH DETECTED\n\n${verification}\n` +
          `Issue: The following images don't match your selected e-waste types:\n\n${mismatchDetails.join('\n')}\n\n` +
          `Solution:\n` +
          `• Go back to Step 1 and update your e-waste type selection\n` +
          `• Or upload photos that match your current selection\n` +
          `• Make sure the photos clearly show the e-waste items you want to recycle\n\n` +
          `Pickup cannot be scheduled until the mismatch is resolved.`;

        toast({
          title: "Type Mismatch Detected",
          description: `${mismatchDetails.length} image(s) don't match your selected e-waste types. Please resolve this before scheduling pickup.`,
          variant: "destructive",
        });

        setVerifying(false);
        return;
      }

      // All images match - provide success verification
      verification = `✅ IMAGES VERIFIED SUCCESSFULLY!\n\n${verification}\n` +
        `Preparation Guidelines:\n` +
        `• Remove all batteries before recycling\n` +
        `• Wipe personal data from storage devices\n` +
        `• Disconnect all cables and remove accessories\n` +
        `• Package items securely to prevent damage\n\n` +
        `Environmental Impact:\n` +
        `• Recycling this e-waste can save valuable resources and prevent toxic materials from entering landfills.\n` +
        `• Thank you for your contribution to a greener planet!`;

      toast({
        title: "Verification Complete",
        description: `${imagesToVerify.length} image(s) verified successfully. Ready for pickup scheduling!`,
        variant: "default",
      });

      setVerifying(false);
      onVerified(imagesToVerify, verification);

    } catch (error) {
      console.error('Error during image verification:', error);
      const verification = "❌ Failed to verify images. Please try again.";

      toast({
        title: "Verification Failed",
        description: "Unable to analyze images. Please check your connection and try again.",
        variant: "destructive",
      });

      setVerifying(false);
      onVerified(imagesToVerify, verification);
    }
  };

  const analyzeSingleImage = async (image: File) => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error analyzing image ${image.name}:`, error);
      throw error;
    }
  };

  const analyzeSingleImageWithMismatch = async (image: File) => {
    try {
      const result = await analyzeSingleImage(image);
      
      let verification = "";
      let hasMismatch = false;
      let mismatchDetails: string[] = [];

      const statusEmoji = result.recyclable ? "✅" : "❌";
      verification = `${statusEmoji} ${image.name}:\n` +
        `   • Detected: ${result.classification} (${Math.round(result.confidence * 100)}% confidence)\n` +
        `   • Recyclable: ${result.recyclable ? "Yes" : "No"}\n` +
        `   • Estimated Weight: ${result.estimatedWeight}\n` +
        `   • Suggestions: ${result.suggestions?.length || 0} recommendations\n\n`;

      // Check for type mismatch in single image
      if (selectedTypes.length > 0) {
        const typeMapping = {
          'mobile': ['Mobile'],
          'charging_accessories': ['Charging and Connectivity Accessories'],
          'chargers': ['Charging and Connectivity Accessories'],  // Backup for compatibility
          'battery': ['Battery'],
          'keyboard': ['Keyboard'],
          'mouse': ['Mouse'],
          'hard_drive': ['Hard Drive'],
          'small_electronics': ['PCB', 'Pen Drive'],
          'audio_devices': ['Audio devices']
        };

        const typeMatches = selectedTypes.some(selectedType =>
          typeMapping[selectedType as keyof typeof typeMapping]?.includes(result.classification)
        );

        if (!typeMatches) {
          hasMismatch = true;
          mismatchDetails.push(`${image.name}: Expected ${selectedTypes.join(' or ')}, but detected ${result.classification}`);
        }
      }

      return {
        success: true,
        verification,
        hasMismatch,
        mismatchDetails
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze ${image.name}: ${error}`,
        verification: "",
        hasMismatch: false,
        mismatchDetails: []
      };
    }
  };

  const analyzeBatchImages = async (images: File[]) => {
    try {
      console.log(`Starting batch analysis for ${images.length} images...`);
      
      const formData = new FormData();
      
      // Add all images to form data
      images.forEach((image, index) => {
        formData.append('images', image);
      });
      
      // Add selected types
      formData.append('selectedTypes', JSON.stringify(selectedTypes));

      const response = await fetch('/api/analyze-images-batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Batch API request failed: ${response.status}`);
      }

      const batchResult = await response.json();
      console.log('Batch analysis result:', batchResult);

      let verification = "";
      let hasMismatch = batchResult.has_mismatches;
      let mismatchDetails: string[] = [];

      // Process batch results
      batchResult.batch_results.forEach((result: any, index: number) => {
        const statusEmoji = result.error ? "❌" : (result.recyclable ? "✅" : "❌");
        
        if (result.error) {
          verification += `❌ ${result.filename}:\n   • Error: ${result.error}\n\n`;
        } else {
          verification += `${statusEmoji} ${result.filename}:\n` +
            `   • Detected: ${result.classification} (${Math.round(result.confidence * 100)}% confidence)\n` +
            `   • Recyclable: ${result.recyclable ? "Yes" : "No"}\n` +
            `   • Estimated Weight: ${result.estimatedWeight}\n` +
            `   • Status: ${result.mismatch ? "❌ Type Mismatch" : "✅ Matches Selection"}\n\n`;
        }

        // Add to mismatch details if there's a mismatch
        if (result.mismatch && !result.error) {
          mismatchDetails.push(
            `❌ ${result.filename}: Detected "${result.classification}" (${Math.round(result.confidence * 100)}% confidence) but you selected ${selectedTypes.join(", ")}`
          );
        }
      });

      // Add summary
      verification += `BATCH SUMMARY:\n` +
        `   • Total Images: ${batchResult.total_images}\n` +
        `   • Successfully Analyzed: ${batchResult.successful_predictions}\n` +
        `   • Type Matches: ${batchResult.summary.successful}\n` +
        `   • Type Mismatches: ${batchResult.summary.mismatched}\n` +
        `   • Errors: ${batchResult.summary.errors}\n\n`;

      return {
        success: true,
        verification,
        hasMismatch,
        mismatchDetails,
        batchResult
      };

    } catch (error) {
      console.error('Batch analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        verification: "",
        hasMismatch: true,
        mismatchDetails: []
      };
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const handleAddMoreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleAddMoreInputChange called with files:', e.target.files?.length);
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    
    if (newFiles.length > 0) {
      verifyImages(newFiles);
    } else {
      // Reset verification if no images left
      onVerified([], "");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {previews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`E-waste preview ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg shadow-md"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {files.length < selectedTypes.length && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 h-48">
              <Button
                type="button"
                variant="ghost"
                className="w-full h-full flex flex-col items-center justify-center hover:border-eco-primary transition-colors cursor-pointer"
                onClick={handleAddMorePhotos}
              >
                <Plus className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 text-center">Add more photos</p>
                <p className="text-xs text-gray-400 text-center mt-1">
                  {files.length}/{selectedTypes.length} photos uploaded
                </p>
              </Button>
            </div>
          )}
          
          {/* Hidden file input specifically for "Add more photos" */}
          <input
            ref={addMoreInputRef}
            type="file"
            accept="image/*"
            onChange={handleAddMoreInputChange}
            className="hidden"
            multiple
          />
        </div>
      )}
      
      {previews.length === 0 && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-eco-primary transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">Drop your photos here or click to browse</p>
          <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
          {selectedTypes.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Upload up to {selectedTypes.length} photo{selectedTypes.length !== 1 ? 's' : ''} (one per selected e-waste type)
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            multiple
          />
        </div>
      )}
      
      {verifying && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-700">AI is verifying your e-waste...</span>
          </div>
        </div>
      )}
    </div>
  );
}

