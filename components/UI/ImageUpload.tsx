"use client";

import React, { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";

interface ImageUploadProps {
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  value?: string[];
  onChange: (urls: string[]) => void;
  className?: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  multiple?: boolean;
  showPreviews?: boolean;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

/** Preview thumbnail that hides itself on load error (fallback icon behind stays visible). */
function PreviewImage({ url, index }: { url: string; index: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      src={url}
      alt={`Upload ${index + 1}`}
      fill
      sizes="(max-width: 640px) 33vw, 200px"
      className={cn("object-cover", failed && "hidden")}
      onError={() => setFailed(true)}
    />
  );
}

export function ImageUpload({
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  value = [],
  onChange,
  className,
  placeholder = "Drag and drop images here, or click to select",
  hint = "JPEG, PNG, WebP up to 5MB",
  disabled = false,
  multiple = true,
  showPreviews = true,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `Invalid file type: ${file.type.split("/")[1]?.toUpperCase() || "unknown"}`;
      }
      if (file.size > maxSizeBytes) {
        return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${maxSizeMB}MB)`;
      }
      return null;
    },
    [acceptedTypes, maxSizeBytes, maxSizeMB]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setError(null);

      // Check max files limit
      const availableSlots = maxFiles - value.length;
      if (files.length > availableSlots) {
        setError(`Can only upload ${availableSlots} more file(s)`);
        return;
      }

      // Validate all files first
      const validFiles: File[] = [];
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Create uploading state
      const uploadingItems: UploadingFile[] = validFiles.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        progress: 0,
      }));
      setUploading(uploadingItems);

      try {
        const formData = new FormData();
        validFiles.forEach((file) => formData.append("files", file));

        // Simulate progress (real progress requires XHR)
        const progressInterval = setInterval(() => {
          setUploading((prev) =>
            prev.map((item) => ({
              ...item,
              progress: Math.min(item.progress + 10, 90),
            }))
          );
        }, 100);

        const response = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        // If unauthorized, show login error
        if (response.status === 401) {
          clearInterval(progressInterval);
          setError("Please log in to upload files");
          setUploading([]);
          return;
        }

        clearInterval(progressInterval);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await response.json();

        // Update with new URLs
        setUploading([]);
        onChange([...value, ...data.urls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setUploading([]);
      }
    },
    [value, onChange, maxFiles, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadFiles(multiple ? files : [files[0]]);
      }
    },
    [disabled, multiple, uploadFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        uploadFiles(multiple ? files : [files[0]]);
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [multiple, uploadFiles]
  );

  const handleRemove = useCallback(
    (urlToRemove: string) => {
      onChange(value.filter((url) => url !== urlToRemove));
    },
    [value, onChange]
  );

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const isMaxReached = value.length >= maxFiles;
  const acceptString = acceptedTypes.join(",");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
          "border-2 border-dashed",
          isDragging
            ? "border-[#0A6045] bg-[#0A6045]/5"
            : "border-gray-300 hover:border-[#0A6045]/50",
          disabled && "opacity-50 cursor-not-allowed",
          isMaxReached && "opacity-50 cursor-not-allowed"
        )}
        style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptString}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled || isMaxReached}
          className="hidden"
        />

        {uploading.length > 0 ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 mx-auto text-[#0A6045] animate-spin" />
            <p className="text-sm text-gray-600">
              Uploading {uploading.length} file(s)...
            </p>
            {/* Progress bars */}
            <div className="space-y-1 max-w-xs mx-auto">
              {uploading.map((item) => (
                <div key={item.id} className="w-full">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="truncate max-w-[150px]">{item.name}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0A6045] transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-400 mt-1">{hint}</p>
            {isMaxReached && (
              <p className="text-xs text-amber-600 mt-2">
                Maximum {maxFiles} files reached
              </p>
            )}
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview Grid */}
      {showPreviews && value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {value.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
            >
              <PreviewImage url={url} index={index} />
              {/* Fallback for broken images */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <ImageIcon className="w-6 h-6 text-gray-300" />
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(url);
                }}
                className={cn(
                  "absolute top-1 right-1 p-1 rounded-full",
                  "bg-black/50 text-white opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-200 hover:bg-black/70"
                )}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
              {/* Order indicator */}
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-white text-xs">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
