import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface PhotoUploadProps {
  onVerified: (photo: File, verification: string) => void;
}

export default function PhotoUpload({ onVerified }: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // Simulate AI verification
    setVerifying(true);
    setTimeout(() => {
      const verification = Math.random() > 0.1 ? "Valid e-waste" : "Invalid item";
      setVerifying(false);
      onVerified(selectedFile, verification);
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelect(droppedFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-eco-primary transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">Drop your photo here or click to browse</p>
          <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={preview}
              alt="E-waste preview"
              className="w-full max-w-md mx-auto rounded-lg shadow-md"
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={removeFile}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {verifying && (
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-700">AI is verifying your e-waste...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
