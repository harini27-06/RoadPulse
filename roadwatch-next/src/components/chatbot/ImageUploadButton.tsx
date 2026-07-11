"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadButtonProps {
  onUpload: (file: File, previewUrl: string) => Promise<void>;
  disabled?: boolean;
  loginRequired?: boolean;
}

export function ImageUploadButton({ onUpload, disabled, loginRequired }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setLoading(true);
    try {
      await onUpload(file, previewUrl);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
        title={loginRequired ? "Login to upload images" : "Upload image for road defect detection"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}
