"use client";

import { useCallback, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface FileUploadProps {
  bucket: string;
  folder: string;
  accept?: string;
  maxSizeMB?: number;
  label: string;
  description?: string;
  onUploadComplete: (filePath: string, fileName: string) => void;
  existingFile?: { path: string; name: string } | null;
  disabled?: boolean;
}

export default function FileUpload({
  bucket,
  folder,
  accept = "image/*,.pdf",
  maxSizeMB = 10,
  label,
  description,
  onUploadComplete,
  existingFile = null,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [uploaded, setUploaded] = useState<{
    path: string;
    name: string;
  } | null>(existingFile);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeBytes) {
        return `File is too large. Maximum size is ${maxSizeMB}MB.`;
      }

      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return fileExt === type.toLowerCase();
        }
        if (type.endsWith("/*")) {
          const category = type.split("/")[0];
          return file.type.startsWith(`${category}/`);
        }
        return file.type === type;
      });

      if (!isAccepted) {
        return `File type not accepted. Allowed: ${accept}`;
      }

      return null;
    },
    [accept, maxSizeBytes, maxSizeMB]
  );

  const handleUpload = useCallback(
    async (file: File) => {
      if (!supabase) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreview({ url, name: file.name, type: file.type });
      } else {
        setPreview({ url: "", name: file.name, type: file.type });
      }

      const uniqueName = `${Date.now()}-${file.name}`;
      const filePath = `${folder}/${uniqueName}`;

      // Simulate progress since Supabase JS v2 upload doesn't support onUploadProgress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        setProgress(0);
        setPreview(null);
        return;
      }

      setProgress(100);
      setUploading(false);
      setUploaded({ path: filePath, name: file.name });
      onUploadComplete(filePath, file.name);
    },
    [bucket, folder, validateFile, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || uploading) return;

      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [disabled, uploading, handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleUpload]
  );

  const handleReplace = useCallback(() => {
    setUploaded(null);
    setPreview(null);
    setError(null);
    setProgress(0);
    inputRef.current?.click();
  }, []);

  if (!supabase) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-charcoal font-display uppercase tracking-wide">
          {label}
        </label>
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-100 p-6 text-center">
          <p className="text-sm text-gray-400">Upload unavailable</p>
          <p className="text-xs text-gray-400 mt-1">
            Storage is not configured.
          </p>
        </div>
      </div>
    );
  }

  // Show existing/uploaded file state
  if (uploaded && !uploading) {
    const isImage =
      preview?.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(uploaded.name);

    return (
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-charcoal font-display uppercase tracking-wide">
          {label}
        </label>
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            {/* Preview or icon */}
            {isImage && preview?.url ? (
              <img
                src={preview.url}
                alt={uploaded.name}
                className="h-12 w-12 rounded object-cover border border-green-200"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-white border border-green-200">
                <svg
                  className="h-6 w-6 text-flag-red"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-medium text-green-800 truncate">
                  {uploaded.name}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-0.5">
                Uploaded successfully
              </p>
            </div>

            {/* Replace button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleReplace}
                className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-gray-50 transition-colors"
              >
                Replace
              </button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-charcoal font-display uppercase tracking-wide">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-600 mb-1">{description}</p>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled && !uploading) inputRef.current?.click();
          }
        }}
        className={`
          relative rounded-lg border-2 border-dashed p-6 text-center transition-all cursor-pointer
          ${
            disabled
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              : dragOver
                ? "border-flag-blue bg-blue-50"
                : uploading
                  ? "border-star-gold bg-amber-50"
                  : error
                    ? "border-flag-red bg-red-50"
                    : "border-gray-300 bg-white hover:border-flag-blue hover:bg-blue-50/30"
          }
        `}
      >
        {uploading ? (
          /* Upload in progress */
          <div className="space-y-3">
            {preview?.type.startsWith("image/") && preview.url && (
              <img
                src={preview.url}
                alt="Preview"
                className="mx-auto h-16 w-16 rounded object-cover opacity-50"
              />
            )}
            <p className="text-sm text-gray-600">
              Uploading {preview?.name}...
            </p>
            <div className="mx-auto max-w-xs">
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-flag-blue transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{progress}%</p>
            </div>
          </div>
        ) : (
          /* Default drop zone */
          <div className="space-y-2">
            <svg
              className="mx-auto h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <div>
              <p className="text-sm text-charcoal">
                <span className="font-semibold text-flag-blue">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {accept.replace(/\*/g, "all")} up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="flex items-center gap-1 text-xs text-flag-red mt-1">
          <svg
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
