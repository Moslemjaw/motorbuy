import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, placeholder = "Upload Image", className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const imageUrl = response.objectPath;
      setPreview(imageUrl);
      onChange(imageUrl);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    await uploadFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-image-file"
      />

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-md border"
            data-testid="img-preview"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2"
            onClick={handleRemove}
            disabled={isUploading}
            data-testid="button-remove-image"
          >
            <X className="w-4 h-4" />
          </Button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-upload-image"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {placeholder}
        </Button>
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function MultiImageUpload({ value = [], onChange, maxImages = 5, className }: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const imageUrl = response.objectPath;
      onChange([...value, imageUrl]);
      setUploadingIndex(null);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (value.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploadingIndex(value.length);
    await uploadFile(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-multi-image-file"
      />

      <div className="flex flex-wrap gap-3">
        {value.map((img, index) => (
          <div key={index} className="relative">
            <img
              src={img}
              alt={`Image ${index + 1}`}
              className="w-24 h-24 object-cover rounded-md border"
              data-testid={`img-product-${index}`}
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => handleRemove(index)}
              data-testid={`button-remove-image-${index}`}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}

        {isUploading && uploadingIndex !== null && (
          <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {value.length < maxImages && !isUploading && (
          <Button
            type="button"
            variant="outline"
            className="w-24 h-24"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-add-image"
          >
            <Upload className="w-5 h-5" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {value.length} / {maxImages} images
      </p>
    </div>
  );
}
