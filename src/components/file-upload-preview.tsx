"use client";

import { supabase } from "@/lib/supabase";

type FileStatus = "pending" | "approved" | "rejected";

interface FileUploadPreviewProps {
  bucket: string;
  filePath: string;
  fileName: string;
  status?: FileStatus;
}

const STATUS_CONFIG: Record<
  FileStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-star-gold",
  },
  approved: {
    label: "Approved",
    bg: "bg-green-50",
    text: "text-green-800",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-flag-red",
    dot: "bg-flag-red",
  },
};

function isImageFile(name: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name);
}

function getDownloadUrl(bucket: string, filePath: string): string | null {
  if (!supabase) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data?.publicUrl ?? null;
}

export default function FileUploadPreview({
  bucket,
  filePath,
  fileName,
  status,
}: FileUploadPreviewProps) {
  const isImage = isImageFile(fileName);
  const url = getDownloadUrl(bucket, filePath);
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      {/* Thumbnail / Icon */}
      {isImage && url ? (
        <img
          src={url}
          alt={fileName}
          className="h-16 w-16 shrink-0 rounded object-cover border border-gray-200"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-gray-100 border border-gray-200">
          {/* PDF / document icon */}
          <svg
            className="h-8 w-8 text-flag-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
      )}

      {/* File info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-charcoal truncate">
          {fileName}
        </p>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          {statusConfig && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
              />
              {statusConfig.label}
            </span>
          )}

          {/* Download link */}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-flag-blue hover:underline"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
